import { useRef, useEffect, useCallback, useState } from 'react';
import { Shield, Zap, Crosshair, Clock } from 'lucide-react';
import { createInitialState, updateGame, canPlaceTower } from '@/lib/gameEngine';
import { renderGame } from '@/lib/gameRenderer';
import { GAME_WIDTH, GAME_HEIGHT, TOWER_COSTS, TOWER_STATS } from '@/lib/gameConstants';
import type { GameState, TowerType } from '@/lib/gameTypes';
import { cn } from '@/lib/utils';

// ─── Tower select button ─────────────────────────────────────────────────────

const TOWER_ICONS: Record<TowerType, typeof Shield> = {
  basic: Shield,
  rapid: Zap,
  sniper: Crosshair,
  slow: Clock,
};

const TOWER_LABELS: Record<TowerType, string> = {
  basic: 'TURRET',
  rapid: 'RAPID',
  sniper: 'SNIPER',
  slow: 'FREEZE',
};

function TowerBtn({ type, money, selected, onSelect }: {
  type: TowerType; money: number; selected: boolean; onSelect: () => void;
}) {
  const Icon = TOWER_ICONS[type];
  const cost = TOWER_COSTS[type];
  const affordable = money >= cost;

  return (
    <button
      onClick={onSelect}
      disabled={!affordable && !selected}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 transition-all active:scale-95 select-none',
        'h-[52px] w-[52px] sm:h-16 sm:w-16 p-0.5 sm:p-1',
        selected
          ? 'border-blue-400 bg-blue-900/50 shadow-[0_0_12px_rgba(96,165,250,0.35)] scale-105'
          : 'border-blue-900/40 bg-black/80 hover:border-blue-700/60',
        !affordable && !selected && 'opacity-35 grayscale pointer-events-none',
      )}
    >
      <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', selected ? 'text-blue-400' : 'text-blue-200/70')} />
      <span className={cn('text-[7px] sm:text-[9px] font-pixel leading-none mt-0.5', selected ? 'text-blue-100' : 'text-blue-200/50')}>
        {TOWER_LABELS[type]}
      </span>
      <span className={cn('text-[7px] sm:text-[9px] mt-0.5', affordable ? 'text-blue-400' : 'text-red-400')}>
        {cost}⚡
      </span>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  isMobile: boolean;
}

export function GameCanvas({ onGameOver, isPlaying, isMobile }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(performance.now()));
  const frameRef = useRef(0);
  const animRef = useRef(0);
  const gameOverFiredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // React state for UI
  const [money, setMoney] = useState(0);
  const [wave, setWave] = useState(0);
  const [hp, setHp] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<TowerType | null>(null);

  // ── Coordinate mapping ──────────────────────────────────────────────────
  const toGameCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -100, y: -100 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * GAME_WIDTH,
      y: ((clientY - rect.top) / rect.height) * GAME_HEIGHT,
    };
  }, []);

  // ── Reset on play ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      stateRef.current = createInitialState(performance.now());
      gameOverFiredRef.current = false;
      setSelected(null);
      setMoney(stateRef.current.money);
      setWave(0);
      setHp(stateRef.current.citadelHp);
      setScore(0);
    }
  }, [isPlaying]);

  // ── Sync selected tower type into game state ────────────────────────────
  useEffect(() => {
    stateRef.current.buildingTowerType = selected;
  }, [selected]);

  // ── Mouse move → cursor position ────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPlaying) return;
    const { x, y } = toGameCoords(e.clientX, e.clientY);
    stateRef.current.cursorX = x;
    stateRef.current.cursorY = y;
  }, [isPlaying, toGameCoords]);

  // ── Click / tap → place tower ───────────────────────────────────────────
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isPlaying || !selected) return;
    e.preventDefault();

    const { x, y } = toGameCoords(e.clientX, e.clientY);

    if (stateRef.current.money >= TOWER_COSTS[selected] && canPlaceTower(x, y, stateRef.current)) {
      stateRef.current = updateGame(stateRef.current, { placeTower: { type: selected, x, y } });
      setMoney(stateRef.current.money);
    }
  }, [isPlaying, selected, toGameCoords]);

  // ── Game loop ───────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let s = stateRef.current;

    if (!s.gameOver) {
      s = updateGame(s, {});
      stateRef.current = s;

      // Sync UI every few frames
      if (frameRef.current % 6 === 0) {
        setMoney(s.money);
        setWave(s.wave);
        setHp(Math.ceil(s.citadelHp));
        setScore(s.score);
      }
    } else if (!gameOverFiredRef.current) {
      gameOverFiredRef.current = true;
      setMoney(s.money);
      setWave(s.wave);
      setHp(0);
      setScore(s.score);
      onGameOver(s.score);
    }

    frameRef.current++;
    renderGame(ctx, s, frameRef.current);
    animRef.current = requestAnimationFrame(loop);
  }, [isPlaying, onGameOver]);

  useEffect(() => {
    if (isPlaying) {
      frameRef.current = 0;
      animRef.current = requestAnimationFrame(loop);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, loop]);

  // ── Idle render (static preview) ────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let idleAnim: number;
    const idleState = createInitialState(performance.now());

    function drawIdle() {
      frame++;
      renderGame(ctx!, idleState, frame);
      idleAnim = requestAnimationFrame(drawIdle);
    }
    idleAnim = requestAnimationFrame(drawIdle);
    return () => cancelAnimationFrame(idleAnim);
  }, [isPlaying]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      {/* Canvas viewport — scales via CSS to fill width */}
      <div className="relative w-full" style={{ maxWidth: GAME_WIDTH, aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className={cn(
            'w-full h-full rounded-lg border border-blue-900/50 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(59,130,246,0.08)] touch-none',
            selected ? 'cursor-crosshair' : 'cursor-default',
          )}
          style={{ imageRendering: 'pixelated' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/* HUD overlay (HTML for crisp text at any scale) */}
        {isPlaying && (
          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between pointer-events-none">
            <div className="flex gap-1.5 sm:gap-2">
              <span className="bg-black/70 px-2 py-0.5 rounded text-[10px] sm:text-xs font-pixel text-blue-400 border border-blue-900/30">
                ⚡{money}
              </span>
              <span className="bg-black/70 px-2 py-0.5 rounded text-[10px] sm:text-xs font-pixel text-red-400 border border-blue-900/30">
                ❤{hp}
              </span>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <span className="bg-black/70 px-2 py-0.5 rounded text-[10px] sm:text-xs font-pixel text-cyan-400 border border-blue-900/30">
                W{wave}
              </span>
              <span className="bg-black/70 px-2 py-0.5 rounded text-[10px] sm:text-xs font-pixel text-white border border-blue-900/30">
                {score}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tower selection bar */}
      {isPlaying && (
        <div className="mt-3 w-full max-w-md flex items-center justify-center gap-2 sm:gap-3 px-3 py-2 sm:py-3 bg-black/70 backdrop-blur rounded-xl border border-blue-900/40">
          {(['basic', 'rapid', 'sniper', 'slow'] as TowerType[]).map((t) => (
            <TowerBtn
              key={t}
              type={t}
              money={money}
              selected={selected === t}
              onSelect={() => setSelected(prev => prev === t ? null : t)}
            />
          ))}

          {/* Hint */}
          <div className="hidden sm:block ml-3 pl-3 border-l border-white/10 text-[10px] font-pixel text-blue-200/50 leading-snug min-w-[100px]">
            {selected ? (
              <>
                <div className="text-blue-400 uppercase">{selected}</div>
                <div>{isMobile ? 'TAP' : 'CLICK'} TO BUILD</div>
              </>
            ) : (
              <div>SELECT A TOWER</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
