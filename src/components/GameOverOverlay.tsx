import { Zap, RotateCcw, Loader2, Skull } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface GameOverOverlayProps {
  score: number;
  isPublishing: boolean;
  onPlayAgain: () => void;
}

export function GameOverOverlay({ score, isPublishing, onPlayAgain }: GameOverOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
      <div className="text-center space-y-4 p-6">
        <div className="flex justify-center">
          <Skull className="size-8 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
        </div>

        <h2 className="font-pixel text-base sm:text-lg text-red-500 tracking-wider drop-shadow-[0_0_6px_rgba(220,38,38,0.3)]">
          CITADEL FALLEN
        </h2>

        <div className="space-y-1">
          <p className="text-[10px] text-orange-300/50 font-pixel">FINAL SCORE</p>
          <div className="flex items-center justify-center gap-2">
            <Zap className="size-5 text-amber-400 fill-amber-500" />
            <span className="font-pixel text-xl sm:text-2xl text-amber-300 tabular-nums drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {isPublishing && (
          <div className="flex items-center justify-center gap-2 text-orange-300/40">
            <Loader2 className="size-3 animate-spin" />
            <span className="text-[10px] font-pixel">SAVING SCORE...</span>
          </div>
        )}

        <Button
          onClick={onPlayAgain}
          className="bg-amber-500 text-black font-pixel text-xs hover:bg-amber-400 h-10 px-6 shadow-[0_0_16px_rgba(245,158,11,0.2)] border border-amber-600/50"
        >
          <RotateCcw className="size-3.5 mr-2" />
          PLAY AGAIN (100 SATS)
        </Button>
      </div>
    </div>
  );
}
