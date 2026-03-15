import { useRef, useEffect, useCallback, useState } from 'react';
import { Shield, Zap, Crosshair, Clock } from 'lucide-react';
import { createInitialState, updateGame } from '@/lib/gameEngine';
import { renderGame } from '@/lib/gameRenderer';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TOWER_COSTS,
} from '@/lib/gameConstants';
import type { GameState, TowerType } from '@/lib/gameTypes';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

// Helper component for tower buttons
const TowerSelectButton = ({ 
  type, 
  icon: Icon, 
  label, 
  cost, 
  money, 
  selected, 
  onClick 
}: { 
  type: TowerType, 
  icon: any, 
  label: string, 
  cost: number, 
  money: number, 
  selected: boolean, 
  onClick: () => void 
}) => {
  const affordable = money >= cost;
  
  return (
    <button
        onClick={onClick}
        disabled={!affordable && !selected}
        className={cn(
            "flex flex-col items-center justify-center h-16 w-16 p-1 rounded-md border-2 bg-black/80 transition-all active:scale-95",
            selected 
              ? "border-amber-400 bg-amber-900/40 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105" 
              : "border-amber-900/40 hover:border-amber-700/60 hover:bg-black/90",
            !affordable && !selected && "opacity-40 grayscale cursor-not-allowed border-stone-800"
        )}
    >
        <Icon className={cn("mb-1 w-5 h-5", selected ? "text-amber-400" : "text-amber-200/70")} />
        <span className={cn("text-[9px] font-pixel leading-tight", selected ? "text-amber-100" : "text-amber-200/50")}>{label}</span>
        <span className={cn("text-[9px] mt-0.5", affordable ? "text-amber-400" : "text-red-400")}>{cost}⚡</span>
    </button>
  );
};

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  isMobile: boolean;
}

export function GameCanvas({ onGameOver, isPlaying, isMobile }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState(performance.now()));
  
  // Game loop references
  const frameRef = useRef(0);
  const animFrameRef = useRef(0);
  const gameOverCalledRef = useRef(false);
  
  // UI State (synced from game loop for React renders)
  const [money, setMoney] = useState(0);
  const [wave, setWave] = useState(0);
  const [baseHp, setBaseHp] = useState(0);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Canvas scaling ──────────────────────────────────────────────────────────
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      // Calculate scale to fit width, max 1.5x
      const scale = Math.min(containerWidth / GAME_WIDTH, 1.2);
       setCanvasScale(scale);
    }
    
    // Initial size
    handleResize();
    
    // Resize observer
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // ── Reset game when starting ─────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      gameStateRef.current = createInitialState(performance.now());
      // Start with wave 1 ready
      gameStateRef.current.spawnTimer = -1; 
      gameStateRef.current.money = 150; 
      
      setMoney(150);
      setWave(1);
      setBaseHp(20);
      
      gameOverCalledRef.current = false;
      setSelectedTowerType(null);
    }
  }, [isPlaying]);

  // ── Input Handling ───────────────────────────────────────────────────────────
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    
    // Update raw game state cursor for engine use
    gameStateRef.current.cursorX = x;
    gameStateRef.current.cursorY = y;
    
    // Set preview type
    gameStateRef.current.buildingTowerType = selectedTowerType;
    
  }, [isPlaying, selectedTowerType]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isPlaying) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (selectedTowerType) {
        // Place Tower via Input Event to Update Logic
        const cost = TOWER_COSTS[selectedTowerType];
        
        // Manual check quickly before engine update to give instant UI feedback if needed
        if (gameStateRef.current.money >= cost) {
             // Pass intent to engine
             // In a clearer pattern, we queue inputs, but direct state update is fine for this scale
             const nextState = updateGame(gameStateRef.current, {
                 placeTower: { type: selectedTowerType, x, y }
             }, performance.now());
             
             gameStateRef.current = nextState;
             
             // Sync UI
             setMoney(nextState.money);
             
             // Deselect after placement (optional, maybe keep selected for rapid placement?)
             // For now, let's keep selected for rapid placement
             // If money runs out, the button disabled state handles visual feedback
        }
    } else {
        // Select tower on map logic
        // TODO: Selection and upgrade UI
    }
  }, [isPlaying, selectedTowerType]);
  
  // Mobile Tap
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
      if (!isPlaying || !selectedTowerType) return;
      // Prevent scrolling
      // e.preventDefault(); 
      
      const touch = e.touches[0];
      const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
      
      const cost = TOWER_COSTS[selectedTowerType];
      if (gameStateRef.current.money >= cost) {
         const nextState = updateGame(gameStateRef.current, {
             placeTower: { type: selectedTowerType, x, y }
         }, performance.now());
         gameStateRef.current = nextState;
         setMoney(nextState.money);
      }
  }, [isPlaying, selectedTowerType]);


  // ── Game Loop ────────────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    let state = gameStateRef.current; // mutable ref access

    if (!state.gameOver) {
      // Run Update Logic
      state = updateGame(
        state,
        { // Inputs
            cursor: { x: state.cursorX, y: state.cursorY }
        },
        now,
      );
      gameStateRef.current = state;
      
      // Sync vital UI stats occasionally (every 10 frames? or just every frame, simple enough)
      // optimizing react renders:
      if (frameRef.current % 5 === 0) {
          if (state.money !== money) setMoney(state.money);
          if (state.wave !== wave) setWave(state.wave);
          if (Math.ceil(state.citadelHp) !== baseHp) setBaseHp(Math.ceil(state.citadelHp));
      }
      
    } else if (!gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(state.score);
    }

    frameRef.current++;
    renderGame(ctx, state, frameRef.current);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, onGameOver, money, wave, baseHp]); // deps ensuring closure freshness if needed

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, gameLoop]);


  // ── Rendering Controls ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center w-full max-w-4xl" ref={containerRef}>
      
      {/* Game Viewport */}
      <div 
        className="relative overflow-hidden rounded-lg border border-amber-900/60 shadow-2xl bg-[#050301]"
        style={{ 
            width: GAME_WIDTH * canvasScale, 
            height: GAME_HEIGHT * canvasScale,
            maxHeight: '70vh'
        }}
      >
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="w-full h-full cursor-crosshair touch-none"
            style={{ imageRendering: 'pixelated' }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleClick}
            onTouchStart={handleTouchStart}
          />
          
          {/* Overlay UI for stats if we want them cleaner than canvas text */}
          {isPlaying && (
              <div className="absolute top-2 left-2 flex gap-4 pointer-events-none">
                  <div className="bg-black/60 px-3 py-1 rounded border border-amber-900/30 text-xs font-pixel text-amber-500">
                      SATS: <span className="text-white">{money}</span>
                  </div>
                  <div className="bg-black/60 px-3 py-1 rounded border border-amber-900/30 text-xs font-pixel text-red-500">
                      HP: <span className="text-white">{baseHp}</span>
                  </div>
                  <div className="bg-black/60 px-3 py-1 rounded border border-amber-900/30 text-xs font-pixel text-blue-400">
                      WAVE: <span className="text-white">{wave}</span>
                  </div>
              </div>
          )}
      </div>

      {/* Control Bar */}
      {isPlaying && (
        <div className="mt-4 w-full flex flex-wrap justify-center gap-3 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-amber-900/40 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
             <TowerSelectButton 
                type="basic" icon={Shield} label="TURRET" cost={TOWER_COSTS.basic} 
                money={money} selected={selectedTowerType === 'basic'} 
                onClick={() => setSelectedTowerType(prev => prev === 'basic' ? null : 'basic')} 
             />
             <TowerSelectButton 
                type="rapid" icon={Zap} label="RAPID" cost={TOWER_COSTS.rapid} 
                money={money} selected={selectedTowerType === 'rapid'} 
                onClick={() => setSelectedTowerType(prev => prev === 'rapid' ? null : 'rapid')} 
             />
             <TowerSelectButton 
                type="sniper" icon={Crosshair} label="SNIPER" cost={TOWER_COSTS.sniper} 
                money={money} selected={selectedTowerType === 'sniper'} 
                onClick={() => setSelectedTowerType(prev => prev === 'sniper' ? null : 'sniper')} 
             />
             <TowerSelectButton 
                type="slow" icon={Clock} label="FREEZE" cost={TOWER_COSTS.slow} 
                money={money} selected={selectedTowerType === 'slow'} 
                onClick={() => setSelectedTowerType(prev => prev === 'slow' ? null : 'slow')} 
             />
             
             {/* Dynamic hint area */}
             <div className="hidden sm:flex flex-col justify-center ml-4 px-4 border-l border-white/10 text-xs text-amber-200/60 font-pixel min-w-[140px]">
                 {selectedTowerType ? (
                     <>
                        <span className="text-amber-400 uppercase">{selectedTowerType} TOWER SELECTED</span>
                        <span className="text-[10px] opacity-60">CLICK MAP TO BUILD</span>
                     </>
                 ) : (
                     <>
                        <span>SELECT TOWER</span>
                        <span className="text-[10px] opacity-60">BUILD DEFENSES</span>
                     </>
                 )}
             </div>
        </div>
      )}
      
      {/* Mobile Hint */}
      {isMobile && isPlaying && selectedTowerType && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-amber-400 px-4 py-2 rounded-full text-xs font-bold border border-amber-500/50 shadow-lg animate-pulse pointer-events-none">
              TAP TO BUILD
          </div>
      )}
    </div>
  );
}
