import { v4 as uuidv4 } from 'uuid';
import type {
  GameState,
  Tower,
  Invader,
  Bullet,
  Particle,
  TowerType,
  InvaderType,
  Position,
} from '@/lib/gameTypes';

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE,
  INITIAL_LIVES,
  INITIAL_MONEY,
  WAVE_DELAY,
  SPAWN_DELAY,
  TOWER_COSTS,
  TOWER_STATS,
  INVADER_STATS,
  COLOR_CITADEL,
} from '@/lib/gameConstants';

// ─── Path Definition ────────────────────────────────────────────────────────
// Simple winding path for now
const PATH: Position[] = [
  { x: 0, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 300 },
  { x: 400, y: 300 },
  { x: 400, y: 150 },
  { x: 600, y: 150 },
  { x: 600, y: 450 },
  { x: 100, y: 450 },
  { x: 100, y: 550 },
  { x: 800, y: 550 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDistance(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function getAngle(a: Position, b: Position): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function moveTowards(current: Position, target: Position, speed: number): Position {
  const angle = getAngle(current, target);
  const dist = getDistance(current, target);
  
  if (dist <= speed) return { ...target };
  
  return {
    x: current.x + Math.cos(angle) * speed,
    y: current.y + Math.sin(angle) * speed,
  };
}

// ─── Game Logic ──────────────────────────────────────────────────────────────

export function createInitialState(startTime: number): GameState {
  return {
    citadelHp: INITIAL_LIVES,
    citadelMaxHp: INITIAL_LIVES,
    money: INITIAL_MONEY,
    score: 0,
    wave: 0,
    
    towers: [],
    invaders: [],
    bullets: [],
    particles: [],
    
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    path: PATH,
    
    gameOver: false,
    gameSpeed: 1,
    
    waveActive: false,
    enemiesToSpawn: [],
    spawnTimer: 0,
    
    frame: 0,
    startTime,
    
    selectedTowerId: null,
    buildingTowerType: null,
    cursorX: 0,
    cursorY: 0,
  };
}

export function startNextWave(state: GameState): GameState {
  const wave = state.wave + 1;
  const count = 5 + Math.floor(wave * 2); // Increasing enemy count
  
  let enemyType: InvaderType = 'drone';
  if (wave % 5 === 0) enemyType = 'boss';
  else if (wave % 3 === 0) enemyType = 'tank';
  else if (wave % 2 === 0) enemyType = 'scout';
  
  const queue: InvaderType[] = Array(count).fill(enemyType);
  
  // Mixed waves later on
  if (wave > 5) {
    const extra = Array(3).fill('drone') as InvaderType[];
    queue.push(...extra);
  }

  return {
    ...state,
    wave,
    waveActive: true,
    enemiesToSpawn: queue,
    spawnTimer: SPAWN_DELAY,
  };
}

// ─── Update Loop ─────────────────────────────────────────────────────────────

interface InputState {
  placeTower?: { type: TowerType; x: number; y: number };
  selectTower?: string | null;
  cursor?: { x: number; y: number };
}

export function updateGame(state: GameState, input: InputState, now: number): GameState {
  if (state.gameOver) return state;

  // Use a minimal step approach or delta time if needed, for now frame-based
  const ns = { ...state };
  ns.frame++;

  // Handle Input
  if (input.cursor) {
    ns.cursorX = input.cursor.x;
    ns.cursorY = input.cursor.y;
  }
  
  if (input.selectTower !== undefined) {
    ns.selectedTowerId = input.selectTower;
    ns.buildingTowerType = null;
  }

  // --- Tower Placement Logic ---
  if (input.placeTower) {
    const { type, x, y } = input.placeTower;
    const cost = TOWER_COSTS[type];
    
    if (ns.money >= cost) {
      // Check collision/valid placement logic here (simplified for now)
      let valid = true;
      // Could check distance to path < TILE_SIZE/2 to blocking
      
      if (valid) {
        ns.money -= cost;
        ns.towers = [...ns.towers, {
          id: uuidv4(),
          type,
          x,
          y,
          range: TOWER_STATS[type].range,
          damage: TOWER_STATS[type].damage,
          fireRate: TOWER_STATS[type].fireRate,
          fireRateCounter: 0, // Assuming fireRate is shots per sec, we convert to frame
          cooldown: 0,
          level: 1,
          active: true,
          angle: 0,
        }];
        ns.buildingTowerType = null; 
      }
    }
  }

  // --- Wave Management ---
  if (ns.waveActive) {
    if (ns.enemiesToSpawn.length > 0) {
      ns.spawnTimer--;
      if (ns.spawnTimer <= 0) {
        const type = ns.enemiesToSpawn.shift()!;
        const stats = INVADER_STATS[type];
        
        // Spawn at start of path
        const start = ns.path[0];
        ns.invaders = [...ns.invaders, {
          id: uuidv4(),
          type,
          x: start.x,
          y: start.y,
          hp: stats.hp + (ns.wave * stats.hp * 0.2), // HP scaling
          maxHp: stats.hp + (ns.wave * stats.hp * 0.2),
          speed: stats.speed,
          value: stats.value,
          damage: 1, 
          pathIndex: 0,
          pathProgress: 0,
          frozen: 0,
          effect: 'none',
        }];
        ns.spawnTimer = SPAWN_DELAY;
      }
    } else if (ns.invaders.length === 0) {
      ns.waveActive = false;
      // Wave complete logic if needed
    }
  } else {
    // Check if we should auto-start next wave
    if (ns.invaders.length === 0) {
      // We will count down spawnTimer into negatives to track delay between waves
      if (ns.spawnTimer <= -WAVE_DELAY) {
         return startNextWave(ns); // Start next wave automatically
      }
      ns.spawnTimer--;
    }
  }
  
  // --- Invader Movement ---
  // Create a new array for updated invaders
  const nextInvaders: Invader[] = [];
  
  for (const inv of ns.invaders) {
    let currentSpeed = inv.speed;
    let frozen = inv.frozen;
    
    if (frozen > 0) {
      currentSpeed *= 0.5;
      frozen--;
    }
    
    // Logic to move along path segments
    const currentWaypoint = ns.path[inv.pathIndex];
    const nextWaypoint = ns.path[inv.pathIndex + 1];
    
    if (!nextWaypoint) {
      // Reached the end (Citadel)
      ns.citadelHp -= inv.damage;
      ns.particles.push({
         x: inv.x, y: inv.y,
         vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
         life: 30, maxLife: 30,
         color: COLOR_CITADEL, size: 8,
         type: 'explosion'
      });
      continue; // Remove invader
    }
    
    // Move towards next waypoint
    const newPos = moveTowards(inv, nextWaypoint, currentSpeed);
    
    // Check if we reached the waypoint
    let nextIndex = inv.pathIndex;
    if (getDistance(newPos, nextWaypoint) < 1) {
       nextIndex++;
    }
    
    nextInvaders.push({ 
      ...inv, 
      x: newPos.x, 
      y: newPos.y, 
      pathIndex: nextIndex,
      frozen
    });
  }
  ns.invaders = nextInvaders;
  
  // Clean up dead invaders (hp check done separately commonly, or implicitly if not pushed)
  // We'll filter HP <= 0 here just in case damage happens elsewhere
  ns.invaders = ns.invaders.filter(inv => inv.hp > 0);

  if (ns.citadelHp <= 0) {
    ns.gameOver = true;
  }

  // --- Tower Logic ---
  ns.towers = ns.towers.map(tower => {
    let cooldown = tower.cooldown;
    if (cooldown > 0) cooldown--;
    
    // Find target
    const target = ns.invaders.find(inv => getDistance(tower, inv) <= tower.range);
    
    let angle = tower.angle;
    
    if (target) {
      // Rotate towards target
      angle = getAngle(tower, target);
      
      // Fire if ready
      if (cooldown <= 0) {
        ns.bullets.push({
          id: uuidv4(),
          x: tower.x,
          y: tower.y,
          targetId: target.id,
          speed: 8,
          damage: tower.damage,
          active: true,
          vx: Math.cos(angle) * 8, // Initial velocity towards target
          vy: Math.sin(angle) * 8,
          // Map generic types to specific projectile types
          type: tower.type === 'sniper' ? 'laser' : 
                tower.type === 'slow' ? 'slow' : 
                tower.type === 'rapid' ? 'basic' : 'basic', 
          color: TOWER_STATS[tower.type].color,
        });
        
        // Cooldown in frames (60fps assumed)
        cooldown = 60 / tower.fireRate;
      }
    }
    
    return { ...tower, angle, cooldown };
  });

  // --- Bullet Logic ---
  const validBullets: Bullet[] = [];
  
  for (const b of ns.bullets) {
    if (!b.active) continue;
    
    // Move bullet
    const newB = { ...b, x: b.x + b.vx, y: b.y + b.vy };
    
    // Check bounds
    if (newB.x < 0 || newB.x > GAME_WIDTH || newB.y < 0 || newB.y > GAME_HEIGHT) {
      continue;
    }
    
    // Check Collision
    let hit = false;
    for (const inv of ns.invaders) {
       const size = INVADER_STATS[inv.type].size + 5; // Hitbox padding
       if (getDistance(newB, inv) < size) {
          hit = true;
          // Apply damage
          inv.hp -= newB.damage;
          
          if (newB.type === 'slow') {
            inv.frozen = 120; // Slow duration
          }
          
          // Hit particle
          ns.particles.push({
            x: newB.x, y: newB.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 10, maxLife: 10,
            color: newB.color, 
            size: 3,
            type: 'spark'
          });
          
          // Kill logic
          if (inv.hp <= 0) {
            ns.money += inv.value;
            ns.score += inv.value * 10;
            // Explosion particles
             for(let i=0; i<5; i++) {
              ns.particles.push({
                x: inv.x, y: inv.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20, maxLife: 20,
                color: INVADER_STATS[inv.type].color,
                size: 4,
                type: 'explosion'
              });
            }
          }
          break; // Bullet hits one enemy
       }
    }
    
    if (!hit) {
      validBullets.push(newB);
    }
  }
  ns.bullets = validBullets;
  
  // Re-filter dead invaders after bullet logic
  ns.invaders = ns.invaders.filter(inv => inv.hp > 0);

  // --- Particle Logic ---
  ns.particles = ns.particles.map(p => ({
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    life: p.life - 1
  })).filter(p => p.life > 0);

  return ns;
}
