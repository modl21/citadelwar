import { useRef, useEffect, useCallback, useState } from 'react';

import { createInitialState, updateGame } from '@/lib/gameEngine';
import { renderGame } from '@/lib/gameRenderer';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  SPIKE_WIDTH,
  SPIKE_HEIGHT,
  CRATE_WIDTH,
  CRATE_HEIGHT,
  BARREL_WIDTH,
  BARREL_HEIGHT,
  WALL_WIDTH,
  WALL_HEIGHT,
} from '@/lib/gameConstants';
import type { GameState } from '@/lib/gameTypes';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  isMobile: boolean;
}

export function GameCanvas({ onGameOver, isPlaying, isMobile }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState(performance.now()));
  const frameRef = useRef(0);
  const animFrameRef = useRef(0);
  const gameOverCalledRef = useRef(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Input refs
  const jumpRef = useRef(false);
  const shootRef = useRef(false);

  // ── Canvas scaling ──────────────────────────────────────────────────────────
  useEffect(() => {
    function handleResize() {
      const maxW = Math.min(window.innerWidth - 16, 640);
      const maxH = window.innerHeight - 200;
      const scaleW = maxW / GAME_WIDTH;
      const scaleH = maxH / GAME_HEIGHT;
      setCanvasScale(Math.min(scaleW, scaleH, 1.5));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Reset game when starting ─────────────────────────────────────────────────
  useEffect(() => {
    gameStateRef.current = createInitialState(performance.now());
    gameOverCalledRef.current = false;
    jumpRef.current = false;
    shootRef.current = false;
  }, [isPlaying]);

  // ── Desktop Keyboard Controls ───────────────────────────────────────────────
  // Space = Jump, Enter = Shoot
  useEffect(() => {
    if (!isPlaying) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jumpRef.current = true;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        shootRef.current = true;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        jumpRef.current = false;
      }
      if (e.key === 'Enter') {
        shootRef.current = false;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  // ── Mobile Touch Controls ───────────────────────────────────────────────────
  const handleTouchStartJump = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    jumpRef.current = true;
  }, []);

  const handleTouchEndJump = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    jumpRef.current = false;
  }, []);

  const handleTouchStartShoot = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    shootRef.current = true;
  }, []);

  const handleTouchEndShoot = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    shootRef.current = false;
  }, []);

  // ── Game loop ───────────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const state = gameStateRef.current;

    if (!state.gameOver) {
      gameStateRef.current = updateGame(
        state,
        { jump: jumpRef.current, shoot: shootRef.current },
        now,
      );
    } else if (!gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(state.score);
    }

    frameRef.current++;
    renderGame(ctx, gameStateRef.current, frameRef.current);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, onGameOver]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  // ── Idle animation when not playing ─────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let idleState = createInitialState(performance.now());
    // Spawn some obstacles for visual interest
    idleState.obstacles = [
      { x: 140, y: GROUND_Y - SPIKE_HEIGHT, width: SPIKE_WIDTH, height: SPIKE_HEIGHT, type: 'jump', hp: 999, maxHp: 999, active: true, hitFlash: 0 },
      { x: 200, y: GROUND_Y - CRATE_HEIGHT, width: CRATE_WIDTH, height: CRATE_HEIGHT, type: 'shoot1', hp: 1, maxHp: 1, active: true, hitFlash: 0 },
      { x: 330, y: GROUND_Y - BARREL_HEIGHT, width: BARREL_WIDTH, height: BARREL_HEIGHT, type: 'shoot2', hp: 2, maxHp: 2, active: true, hitFlash: 0 },
      { x: 390, y: GROUND_Y - WALL_HEIGHT, width: WALL_WIDTH, height: WALL_HEIGHT, type: 'shoot3', hp: 3, maxHp: 3, active: true, hitFlash: 0 },
    ];

    let idleAnimFrame: number;

    function animateIdle() {
      frame++;
      // Slow scroll
      idleState = {
        ...idleState,
        stars: idleState.stars.map((s) => {
          let nx = s.x - s.speed * 1.5;
          if (nx < -2) nx += GAME_WIDTH + 4;
          return { ...s, x: nx };
        }),
        distanceTraveled: idleState.distanceTraveled + 0.5,
        obstacles: idleState.obstacles.map((o) => {
          let nx = o.x - 0.5;
          if (nx < -40) nx += GAME_WIDTH + 80;
          return { ...o, x: nx };
        }),
        groundTiles: idleState.groundTiles.map((t) => {
          let nx = t.x - 0.5;
          if (nx < -40) nx += GAME_WIDTH + 80;
          return { ...t, x: nx };
        }),
        frame,
        survivalTime: 0,
        gameSpeed: 1.5,
        speedMultiplier: 1,
        fuelFlashTimer: 0,
        fuelExplosionTimer: 0,
        fuelExplosionX: 0,
        fuelExplosionY: 0,
      };
      renderGame(ctx!, idleState, frame);
      idleAnimFrame = requestAnimationFrame(animateIdle);
    }

    idleAnimFrame = requestAnimationFrame(animateIdle);
    return () => cancelAnimationFrame(idleAnimFrame);
  }, [isPlaying]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="game-canvas rounded-lg border border-amber-700/55 shadow-[0_18px_60px_rgba(8,6,4,0.55),0_0_42px_rgba(179,106,57,0.18)]"
        style={{
          width: GAME_WIDTH * canvasScale,
          height: GAME_HEIGHT * canvasScale,
          imageRendering: 'pixelated'
        }}
      />

      {/* Mobile Controls Under-Canvas */}
      {isPlaying && isMobile && (
        <div className="mt-3 grid grid-cols-2 gap-2 touch-none select-none">
          <button
            type="button"
            aria-label="Jump"
            className="h-14 rounded-lg border border-amber-300/35 bg-amber-500/16 active:bg-amber-500/28 text-amber-100/90 font-pixel text-[10px] tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition-colors"
            onTouchStart={handleTouchStartJump}
            onTouchEnd={handleTouchEndJump}
            onTouchCancel={handleTouchEndJump}
            onMouseDown={handleTouchStartJump}
            onMouseUp={handleTouchEndJump}
            onMouseLeave={handleTouchEndJump}
          >
            JUMP
          </button>

          <button
            type="button"
            aria-label="Fire"
            className="h-14 rounded-lg border border-red-300/35 bg-red-500/16 active:bg-red-500/28 text-red-100/90 font-pixel text-[10px] tracking-wider shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition-colors"
            onTouchStart={handleTouchStartShoot}
            onTouchEnd={handleTouchEndShoot}
            onTouchCancel={handleTouchEndShoot}
            onMouseDown={handleTouchStartShoot}
            onMouseUp={handleTouchEndShoot}
            onMouseLeave={handleTouchEndShoot}
          >
            FIRE
          </button>

          <div className="col-span-2 text-center text-[8px] font-pixel text-orange-200/45 pt-0.5">
            TAP BELOW THE SCREEN TO PLAY
          </div>
        </div>
      )}

      {/* Desktop hint */}
      {isPlaying && !isMobile && (
        <div className="absolute top-2 w-full text-center pointer-events-none text-amber-200/40 text-[10px] hidden sm:block">
          SPACE to Jump &bull; ENTER to Fire
        </div>
      )}
    </div>
  );
}
