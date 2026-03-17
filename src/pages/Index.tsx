import { useState, useCallback, useRef, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Zap, Play, Shield, Swords } from 'lucide-react';
import type { NSecSigner } from '@nostrify/nostrify';

import { Button } from '@/components/ui/button';
import { GameCanvas } from '@/components/GameCanvas';
import { PaymentGate } from '@/components/PaymentGate';
import { Leaderboard } from '@/components/Leaderboard';
import { WeeklyWinnerBanner } from '@/components/WeeklyWinnerBanner';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { usePublishScore } from '@/hooks/usePublishScore';
import { useTotalPlayCount } from '@/hooks/useLeaderboard';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { GamePhase } from '@/lib/gameTypes';
import type { GameInvoice } from '@/lib/lightning';

const Index = () => {
  useSeoMeta({
    title: 'Citadel War - Defend Your Fortress',
    description: 'Protect the Citadel.',
    ogTitle: 'Citadel War',
    ogDescription: 'Protect the Citadel.',
    ogType: 'website',
    ogSiteName: 'Citadel War',
    ogUrl: 'https://citadelwar.com',
    ogImage: 'https://blossom.ditto.pub/73791a4a53fef178065a2277ee9507637f5fa40c9adbef0426222387aab57452.jpeg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Citadel War',
    twitterDescription: 'Protect the Citadel.',
    twitterImage: 'https://blossom.ditto.pub/73791a4a53fef178065a2277ee9507637f5fa40c9adbef0426222387aab57452.jpeg',
  });

  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [showPayment, setShowPayment] = useState(false);
  const [lightningAddress, setLightningAddress] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const signerRef = useRef<NSecSigner | null>(null);
  const { mutateAsync: publishScore, isPending: isPublishing } = usePublishScore();
  const { data: totalPlayCount } = useTotalPlayCount();

  const handleStartGame = useCallback(() => {
    setShowPayment(true);
  }, []);

  const handlePaid = useCallback((address: string, gameInvoice: GameInvoice) => {
    setLightningAddress(address);
    setShowPayment(false);
    setPhase('ready');
    signerRef.current = gameInvoice.signer;
  }, []);

  const handleLaunchGame = useCallback(() => {
    setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'ready') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleLaunchGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleLaunchGame]);

  const handleGameOver = useCallback(async (score: number) => {
    setFinalScore(score);
    setPhase('gameOver');

    if (signerRef.current && lightningAddress) {
      try {
        await publishScore({ score, lightning: lightningAddress, signer: signerRef.current });
      } catch (error) {
        console.error('Failed to publish score:', error);
      }
    }
  }, [lightningAddress, publishScore]);

  const handlePlayAgain = useCallback(() => {
    setPhase('idle');
    setFinalScore(0);
    setShowPayment(true);
  }, []);

  return (
    <div className="min-h-full bg-[#060a14] text-foreground overflow-y-auto">
      {/* Cinematic background effects */}
      <div className="fixed inset-x-0 top-0 h-56 pointer-events-none z-0 bg-gradient-to-b from-blue-900/15 to-transparent" />
      <div className="fixed inset-0 pointer-events-none z-[45] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />

      <div className="relative z-10 flex flex-col items-center min-h-full px-3 sm:px-4 py-4 sm:py-6 gap-4 sm:gap-5">
        {/* Header */}
        <header className="w-full max-w-4xl flex items-center justify-between gap-4">
          <a
            href="https://citadelarcade.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <div className="flex h-8 sm:h-10 items-center justify-center rounded-sm bg-white px-2 sm:px-3 shadow-[0_0_20px_rgba(96,165,250,0.12)]">
              <span className="text-[11px] sm:text-[13px] font-[900] tracking-tighter text-black uppercase whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                CITADEL ARCADE
              </span>
            </div>
          </a>
          <a
            href="https://primal.net/odell"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] sm:text-[10px] font-[900] uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors font-sans"
          >
            CURATED BY <span className="text-white/40">ODELL</span>
          </a>
        </header>

        <WeeklyWinnerBanner />

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-pixel text-lg sm:text-xl md:text-2xl text-blue-300 tracking-[0.22em] animate-float drop-shadow-[0_0_14px_rgba(96,165,250,0.5)]">
            CITADEL WAR
          </h1>
          <p className="text-[11px] sm:text-xs text-blue-200/50 max-w-xs mx-auto tracking-wide">
            Defend the fortress. (Map Changes Weekly)
          </p>
        </div>

        {/* Game Area — the canvas manages its own sizing */}
        <div className="relative w-full max-w-[960px]">
          <GameCanvas
            onGameOver={handleGameOver}
            isPlaying={phase === 'playing'}
            isMobile={isMobile}
          />

          {/* Idle overlay */}
          {phase === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/65 backdrop-blur-[3px] rounded-lg" style={{ aspectRatio: '960/640' }}>
              <div className="text-center space-y-4 p-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="size-14 rounded-xl bg-blue-800/30 border border-blue-600/40 flex items-center justify-center animate-float">
                      <Shield className="size-7 text-blue-400 fill-blue-500/60" />
                    </div>
                    <div className="absolute -top-1 -right-1 size-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Swords className="size-2.5 text-white fill-white" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-200/60 max-w-[240px] mx-auto leading-relaxed">
                  Protect the Citadel.
                </p>
                <Button
                  onClick={handleStartGame}
                  className="bg-blue-500 text-white font-pixel text-xs hover:bg-blue-400 h-12 px-8 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/50"
                >
                  <Zap className="size-4 mr-2 fill-current" />
                  INSERT COIN
                </Button>
                <p className="text-[9px] font-pixel text-blue-300/40">
                  {isMobile ? 'TAP TO PLACE TOWERS' : 'CLICK TO PLACE TOWERS'}
                </p>
              </div>
            </div>
          )}

          {/* Ready overlay */}
          {phase === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 backdrop-blur-[2px] rounded-lg" style={{ aspectRatio: '960/640' }}>
              <div className="text-center space-y-5 p-6">
                <p className="font-pixel text-[10px] text-blue-500/70 tracking-wider">SATS RECEIVED</p>
                <p className="font-pixel text-sm text-blue-300 tracking-wider">PREPARE DEFENSES</p>
                <Button
                  onClick={handleLaunchGame}
                  className="bg-blue-500 text-white font-pixel text-sm hover:bg-blue-400 h-14 px-10 shadow-[0_12px_36px_rgba(0,0,0,0.45),0_0_24px_rgba(59,130,246,0.3)] animate-pulse-glow border border-blue-400/50"
                >
                  <Play className="size-5 mr-2 fill-current" />
                  START WAVE
                </Button>
              </div>
            </div>
          )}

          {/* Game Over overlay */}
          {phase === 'gameOver' && (
            <div className="absolute inset-0 z-10" style={{ aspectRatio: '960/640' }}>
              <GameOverOverlay
                score={finalScore}
                isPublishing={isPublishing}
                onPlayAgain={handlePlayAgain}
              />
            </div>
          )}
        </div>

        {/* Total play count */}
        <p className="text-[9px] font-pixel text-blue-200/25 tracking-wider">
          TOTAL WARS {typeof totalPlayCount === 'number' ? totalPlayCount.toLocaleString() : '...'}
        </p>

        <Leaderboard />

        <footer className="text-center text-[10px] text-blue-300/20 pb-4 space-y-1">
          <p>
            Scores on <span className="text-blue-400/40">Nostr</span>
            {' '}&middot;{' '}
            Payments via <span className="text-blue-400/40">Lightning</span>
          </p>
          <p>
            Vibed with{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="text-blue-400/40 hover:text-blue-300/70 transition-colors">
              Shakespeare
            </a>
          </p>
        </footer>
      </div>

      <PaymentGate open={showPayment} onPaid={handlePaid} onClose={() => setShowPayment(false)} />
    </div>
  );
};

export default Index;
