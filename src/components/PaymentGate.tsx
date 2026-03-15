import { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Copy, Check, Loader2 } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import qrcode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/hooks/useAppContext';
import { PAYMENT_AMOUNT_SATS, PAYMENT_RECIPIENT } from '@/lib/gameConstants';
import { getGameInvoice, isWebLNAvailable, payWithWebLN } from '@/lib/lightning';
import type { GameInvoice } from '@/lib/lightning';

interface PaymentGateProps {
  open: boolean;
  onPaid: (lightningAddress: string, invoice: GameInvoice) => void;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 2500;

export function PaymentGate({ open, onPaid, onClose }: PaymentGateProps) {
  const { nostr } = useNostr();
  const { config } = useAppContext();
  const [lightningAddress, setLightningAddress] = useState('');
  const [step, setStep] = useState<'address' | 'invoice'>('address');
  const [invoice, setInvoice] = useState<GameInvoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const activeRef = useRef(false);

  const stopVerification = useCallback(() => {
    activeRef.current = false;
    setVerifying(false);
  }, []);

  useEffect(() => {
    if (open) {
      setStep('address');
      setInvoice(null);
      setQrDataUrl('');
      setError('');
      setCopied(false);
      setLoading(false);
      stopVerification();
    } else {
      stopVerification();
    }
  }, [open, stopVerification]);

  useEffect(() => {
    return () => { activeRef.current = false; };
  }, []);

  const startVerification = useCallback((gameInvoice: GameInvoice, address: string) => {
    stopVerification();
    activeRef.current = true;
    setVerifying(true);

    const onSettled = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      setVerifying(false);
      onPaid(address, gameInvoice);
    };

    const sinceTimestamp = Math.floor(Date.now() / 1000) - 60;
    const recipientPubkey = gameInvoice.recipientLnurlPubkey!;
    const zapRequestId = gameInvoice.zapRequest!.id;
    const bolt11 = gameInvoice.bolt11;

    const filter = [{
      kinds: [9735],
      authors: [recipientPubkey],
      '#p': [recipientPubkey],
      since: sinceTimestamp,
      limit: 20,
    }];

    async function poll() {
      if (!activeRef.current) return;

      try {
        const events = await nostr.query(filter, { signal: AbortSignal.timeout(8000) });

        for (const event of events) {
          // Hard guard: only trust receipts authored by the recipient LNURL pubkey
          if (event.pubkey !== recipientPubkey) continue;

          const bolt11Tag = event.tags.find(([n]) => n === 'bolt11')?.[1];
          if (bolt11Tag === bolt11) {
            onSettled();
            return;
          }

          const descTag = event.tags.find(([n]) => n === 'description')?.[1];
          if (descTag) {
            try {
              const embedded = JSON.parse(descTag) as {
                id?: string;
                tags?: string[][];
              };

              const hasRecipientTag = embedded.tags?.some(([name, value]) => name === 'p' && value === recipientPubkey);
              if (embedded.id === zapRequestId && hasRecipientTag) {
                onSettled();
                return;
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch {
        // query failed, will retry
      }

      if (activeRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    setTimeout(poll, 3000);
  }, [nostr, stopVerification, onPaid]);

  const handleSubmitAddress = useCallback(async () => {
    const trimmed = lightningAddress.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid lightning address (e.g. you@wallet.com)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const relays = config.relayMetadata.relays.map((r) => r.url);
      const gameInvoice = await getGameInvoice(relays);
      setInvoice(gameInvoice);

      const dataUrl = await qrcode.toDataURL(gameInvoice.bolt11.toUpperCase(), {
        width: 280,
        margin: 2,
        color: { dark: '#22d3ee', light: '#0a0914' },
      });
      setQrDataUrl(dataUrl);

      if (isWebLNAvailable()) {
        const paid = await payWithWebLN(gameInvoice.bolt11);
        if (paid) {
          startVerification(gameInvoice, trimmed);
          setStep('invoice');
          return;
        }
      }

      setStep('invoice');
      startVerification(gameInvoice, trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  }, [lightningAddress, config, startVerification]);

  const handleCopyInvoice = useCallback(() => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice.bolt11);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [invoice]);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!o && step === 'invoice') return;
    if (!o) onClose();
  }, [step, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`bg-[#0a0914] border-cyan-500/30 max-w-sm mx-auto ${step === 'invoice' ? '[&>button:last-of-type]:hidden' : ''}`}
        onEscapeKeyDown={(e) => { if (step === 'invoice') e.preventDefault(); }}
        onInteractOutside={(e) => { if (step === 'invoice') e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-cyan-400 text-center tracking-wider">
            INSERT COIN
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm">
            ZAP {PAYMENT_AMOUNT_SATS} SATS FOR ONE LIFE
          </DialogDescription>
          <div className="flex justify-center pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-[10px] font-pixel tracking-wide text-cyan-300/70 underline decoration-dotted underline-offset-2 hover:text-cyan-300 transition-colors"
                >
                  NEED A LIGHTNING WALLET?
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[230px] border-cyan-500/30 bg-[#0a0914] text-cyan-200">
                <a
                  href="https://primal.net/downloads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Need a lightning wallet?
                </a>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        {step === 'address' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-pixel tracking-wider">
                YOUR LIGHTNING ADDRESS
              </label>
              <Input
                placeholder="you@wallet.com"
                value={lightningAddress}
                onChange={(e) => setLightningAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitAddress()}
                className="bg-secondary/50 border-cyan-500/20 text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground/60">
                Your address goes on the leaderboard if you make the top 10
              </p>
            </div>

            {error && (
              <p className="text-destructive text-xs font-pixel">{error}</p>
            )}

            <Button
              onClick={handleSubmitAddress}
              disabled={loading || !lightningAddress.trim()}
              className="w-full bg-cyan-500 text-black font-pixel text-xs hover:bg-cyan-400 h-12"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Zap className="size-4 mr-2" />
              )}
              {loading ? 'GENERATING INVOICE...' : `ZAP ${PAYMENT_AMOUNT_SATS} SATS`}
            </Button>
          </div>
        )}

        {step === 'invoice' && invoice && (
          <div className="space-y-4 pt-2">
            {qrDataUrl && (
              <div className="flex justify-center">
                <div className="p-2 rounded-lg border border-cyan-500/20 bg-[#0a0914]">
                  <img src={qrDataUrl} alt="Lightning Invoice QR" className="w-[280px] h-[280px]" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                readOnly
                value={invoice.bolt11.substring(0, 32) + '...'}
                className="bg-secondary/50 border-cyan-500/20 text-foreground text-xs font-mono"
              />
              <Button
                onClick={handleCopyInvoice}
                variant="outline"
                size="icon"
                className="border-cyan-500/20 shrink-0"
              >
                {copied ? <Check className="size-4 text-cyan-400" /> : <Copy className="size-4" />}
              </Button>
            </div>

            {error && (
              <p className="text-destructive text-xs">{error}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-3 rounded-md bg-secondary/30 border border-cyan-500/10">
                <Loader2 className="size-4 text-cyan-400 animate-spin" />
                <span className="font-pixel text-[10px] text-cyan-400 tracking-wider">
                  {verifying ? 'WAITING FOR PAYMENT...' : 'PREPARING...'}
                </span>
              </div>
              <p className="text-[10px] text-center text-muted-foreground/50">
                Zap the invoice — the game starts automatically once confirmed
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
