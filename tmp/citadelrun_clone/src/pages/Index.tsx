import { useState, useCallback, useRef, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Zap, Play, Smartphone, Keyboard, Flame } from 'lucide-react';
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
    title: 'Citadel Run - One life. Infinite wasteland.',
    description: 'One life. Infinite wasteland.',
    ogTitle: 'Citadel Run',
    ogDescription: 'One life. Infinite wasteland.',
    ogType: 'website',
    ogSiteName: 'Citadel Run',
    ogUrl: 'https://citadelrun.com',
    ogImage: 'https://citadelrun.com/citadelruns.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Citadel Run',
    twitterDescription: 'One life. Infinite wasteland.',
    twitterImage: 'https://citadelrun.com/citadelruns.jpg',
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
        await publishScore({
          score,
          lightning: lightningAddress,
          signer: signerRef.current,
        });
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
    <div className="min-h-full bg-[#0d0700] text-foreground overflow-y-auto">
      {/* Cinematic top glow */}
      <div className="fixed inset-x-0 top-0 h-56 pointer-events-none z-0 bg-gradient-to-b from-amber-900/12 via-orange-900/8 to-transparent" />

      {/* Dust/grit overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
        <div className="w-full h-[200%] bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(200,120,30,0.04)_2px,rgba(200,120,30,0.04)_4px)] animate-scanline" />
      </div>

      {/* Vignette-style edge darkening */}
      <div className="fixed inset-0 pointer-events-none z-[45] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.38)_100%)]" />

      {/* Distant heat shimmer glow at horizon */}
      <div className="fixed bottom-0 left-0 right-0 h-36 pointer-events-none z-0 bg-gradient-to-t from-orange-900/20 via-orange-800/10 to-transparent" />

      <div className="relative z-10 flex flex-col items-center min-h-full px-4 py-6 gap-5">
        <header className="w-full max-w-4xl flex items-center justify-between gap-4 mb-2">
          {/* Citadel Arcade Badge */}
          <a 
            href="https://citadelarcade.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <div className="flex h-10 items-center justify-center rounded-sm bg-white px-3 shadow-[0_0_25px_rgba(255,255,255,0.1)]">
              <span className="text-[13px] font-[900] tracking-tighter text-black uppercase whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                CITADEL ARCADE
              </span>
            </div>
          </a>

          <a
            href="https://primal.net/odell"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-[900] uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors font-sans"
          >
            CURATED BY <span className="text-white/40">ODELL</span>
          </a>
        </header>

        {/* Weekly Winner Banner */}
        <WeeklyWinnerBanner />

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-pixel text-xl md:text-2xl text-amber-300 tracking-[0.22em] animate-float drop-shadow-[0_0_14px_rgba(245,158,11,0.55)]">
            CITADEL RUN
          </h1>
          <p className="text-xs text-orange-200/70 max-w-xs mx-auto tracking-wide">
            One life. Infinite wasteland.
          </p>
        </div>

        {/* Game Area */}
        <div className="relative">
          <GameCanvas
            onGameOver={handleGameOver}
            isPlaying={phase === 'playing'}
            isMobile={isMobile}
          />

          {/* Idle overlay */}
          {phase === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 backdrop-blur-[3px] rounded-lg">
              <div className="text-center space-y-5 p-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="size-14 rounded-xl bg-orange-800/30 border border-orange-600/40 flex items-center justify-center animate-float">
                      <Flame className="size-7 text-amber-400 fill-amber-500/60" />
                    </div>
                    <div className="absolute -top-1 -right-1 size-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <Zap className="size-2.5 text-black fill-black" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-pixel text-xs text-amber-300 tracking-wider">
                    100 SATS = 1 LIFE
                  </p>
                  <p className="text-[10px] text-orange-200/60 max-w-[220px] mx-auto leading-relaxed">
                    Run the wasteland.
                  </p>
                </div>

                <Button
                  onClick={handleStartGame}
                  className="bg-amber-500 text-black font-pixel text-xs hover:bg-amber-400 h-12 px-8 shadow-[0_12px_34px_rgba(0,0,0,0.42),0_0_24px_rgba(245,158,11,0.28)] hover:shadow-[0_18px_46px_rgba(0,0,0,0.5),0_0_36px_rgba(245,158,11,0.5)] transition-shadow border border-amber-600/50"
                >
                  <Zap className="size-4 mr-2 fill-current" />
                  INSERT COIN
                </Button>

                {/* Controls hint */}
                <div className="flex flex-col items-center gap-1.5 text-orange-300/40">
                  {isMobile ? (
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="size-3" />
                      <span className="text-[8px] font-pixel">JUMP (left) &middot; FIRE (right)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Keyboard className="size-3" />
                      <span className="text-[8px] font-pixel">SPACE = JUMP &middot; ENTER = FIRE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ready overlay — payment received, waiting to start */}
          {phase === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70 backdrop-blur-[2px] rounded-lg">
              <div className="text-center space-y-6 p-6">
                <div className="space-y-2">
                  <p className="font-pixel text-[10px] text-amber-500/70 tracking-wider">
                    SATS RECEIVED
                  </p>
                  <p className="font-pixel text-sm text-amber-300 tracking-wider">
                    SADDLE UP
                  </p>
                </div>

                <Button
                  onClick={handleLaunchGame}
                  className="bg-amber-500 text-black font-pixel text-sm hover:bg-amber-400 h-14 px-10 shadow-[0_16px_40px_rgba(0,0,0,0.48),0_0_30px_rgba(245,158,11,0.35)] hover:shadow-[0_22px_56px_rgba(0,0,0,0.56),0_0_48px_rgba(245,158,11,0.55)] transition-shadow animate-pulse-glow border border-amber-600/50"
                >
                  <Play className="size-5 mr-2 fill-current" />
                  RUN
                </Button>

                {isMobile ? (
                  <p className="text-[9px] text-orange-300/40 font-pixel">
                    JUMP (left) &middot; FIRE (right)
                  </p>
                ) : (
                  <p className="text-[9px] text-orange-300/40 font-pixel">
                    SPACE = JUMP &middot; ENTER = FIRE
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Game Over overlay */}
          {phase === 'gameOver' && (
            <GameOverOverlay
              score={finalScore}
              isPublishing={isPublishing}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>

        {/* Hazard legend */}
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-4 text-[8px] font-pixel text-orange-300/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-end gap-[1px] h-2.5">
                <span className="w-[2px] h-2 bg-red-600" />
                <span className="w-[2px] h-2.5 bg-red-500" />
                <span className="w-[2px] h-2 bg-red-600" />
              </span>
              WIRE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 bg-yellow-800 border border-amber-500/40" />
              TRUCK (1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 bg-orange-800 rounded-[2px] border border-orange-400/35" />
              FUEL (2) +10% SPD
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 bg-stone-700 border border-orange-200/20" />
              CITADEL (3)
            </span>
          </div>
        </div>

        {/* Total play count */}
        <p className="text-[9px] font-pixel text-orange-200/35 tracking-wider">
          TOTAL RUNS {typeof totalPlayCount === 'number' ? totalPlayCount.toLocaleString() : '...'}
        </p>

        {/* Leaderboard */}
        <Leaderboard />

        {/* Footer */}
        <footer className="text-center text-[10px] text-orange-300/30 pb-4 space-y-1">
          <p>
            Scores on{' '}
            <span className="text-amber-500/50">Nostr</span>
            {' '}&middot;{' '}
            Payments via{' '}
            <span className="text-amber-500/50">Lightning</span>
          </p>
          <p>
            Vibed with{' '}
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500/50 hover:text-amber-400/80 transition-colors"
            >
              Shakespeare
            </a>
          </p>
        </footer>
      </div>

      {/* Payment Dialog */}
      <PaymentGate
        open={showPayment}
        onPaid={handlePaid}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
};

export default Index;
