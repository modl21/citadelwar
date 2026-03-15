import type {
  GameState,
  Invader,
  Bullet,
  TowerType,
  InvaderType,
  Position,
} from '@/lib/gameTypes';

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  INITIAL_LIVES,
  INITIAL_MONEY,
  FIRST_WAVE_COUNTDOWN,
  WAVE_COUNTDOWN,
  SPAWN_DELAY_BASE,
  SPAWN_DELAY_MIN,
  PATH_WIDTH,
  TOWER_COSTS,
  TOWER_STATS,
  INVADER_STATS,
  TOWER_SIZE,
} from '@/lib/gameConstants';

// ─── Path ────────────────────────────────────────────────────────────────────
const PATH: Position[] = [
  { x: -20, y: 80 },
  { x: 180, y: 80 },
  { x: 180, y: 220 },
  { x: 420, y: 220 },
  { x: 420, y: 80 },
  { x: 700, y: 80 },
  { x: 700, y: 300 },
  { x: 520, y: 300 },
  { x: 520, y: 460 },
  { x: 260, y: 460 },
  { x: 260, y: 340 },
  { x: 80, y: 340 },
  { x: 80, y: 560 },
  { x: 500, y: 560 },
  { x: 500, y: 600 },
  { x: 880, y: 600 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let nextId = 0;
function uid(): string {
  return 't' + (++nextId) + '_' + ((Math.random() * 0xffff) | 0).toString(16);
}

function dist(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angle(a: Position, b: Position): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function moveTowards(from: Position, to: Position, speed: number): Position {
  const d = dist(from, to);
  if (d <= speed) return { x: to.x, y: to.y };
  const a = angle(from, to);
  return { x: from.x + Math.cos(a) * speed, y: from.y + Math.sin(a) * speed };
}

/** Distance from point to the nearest path segment */
export function distToPath(p: Position, path: Position[]): number {
  let minD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    const d = Math.sqrt((p.x - px) ** 2 + (p.y - py) ** 2);
    if (d < minD) minD = d;
  }
  return minD;
}

export function canPlaceTower(x: number, y: number, state: GameState): boolean {
  // Must be on screen
  if (x < TOWER_SIZE || x > GAME_WIDTH - TOWER_SIZE || y < TOWER_SIZE || y > GAME_HEIGHT - TOWER_SIZE) return false;
  // Not on path — allow placing close but not directly on the path
  if (distToPath({ x, y }, state.path) < PATH_WIDTH * 0.5 + TOWER_SIZE * 0.6) return false;
  // Not overlapping the citadel
  const citadelEnd = state.path[state.path.length - 1];
  if (dist({ x, y }, citadelEnd) < 55) return false;
  // Not overlapping another tower
  for (const t of state.towers) {
    if (dist(t, { x, y }) < TOWER_SIZE * 2 + 4) return false;
  }
  return true;
}

// ─── Wave composition ────────────────────────────────────────────────────────

/** HP multiplier for a given wave — gentle early, accelerating later */
function hpScale(wave: number): number {
  // Wave 1 = 1.0x, wave 5 = 1.3x, wave 10 = 1.8x, wave 20 = 3.4x
  return 1 + (wave - 1) * 0.08 + Math.max(0, wave - 8) * 0.1;
}

/** Speed multiplier — enemies get slightly faster over time */
function speedScale(wave: number): number {
  return 1 + Math.min(wave * 0.03, 0.6); // caps at +60% speed
}

/** Spawn delay for this wave (fewer frames = faster spawning) */
function spawnDelay(wave: number): number {
  return Math.max(SPAWN_DELAY_MIN, SPAWN_DELAY_BASE - wave * 2);
}

function buildWaveQueue(wave: number): InvaderType[] {
  const queue: InvaderType[] = [];

  // ── Waves 1-3: Drones only, small counts ─────────────────────────────
  if (wave <= 3) {
    const count = 3 + wave * 2; // 5, 7, 9
    for (let i = 0; i < count; i++) queue.push('drone');
    return queue;
  }

  // ── Waves 4-6: Introduce scouts ──────────────────────────────────────
  if (wave <= 6) {
    const drones = 4 + wave;
    const scouts = wave - 3; // 1, 2, 3
    for (let i = 0; i < drones; i++) queue.push('drone');
    for (let i = 0; i < scouts; i++) queue.push('scout');
    return queue;
  }

  // ── Wave 7+: Mixed composition with increasing variety ───────────────

  // Boss waves every 10
  if (wave % 10 === 0) {
    const bosses = Math.floor(wave / 10);
    for (let i = 0; i < bosses; i++) queue.push('boss');
    for (let i = 0; i < 4 + wave; i++) queue.push('drone');
    for (let i = 0; i < Math.floor(wave / 4); i++) queue.push('scout');
    return queue;
  }

  // Tank waves every 5 (but not 10)
  if (wave % 5 === 0) {
    const tanks = 1 + Math.floor(wave / 5);
    for (let i = 0; i < tanks; i++) queue.push('tank');
    for (let i = 0; i < 3 + wave; i++) queue.push('drone');
    return queue;
  }

  // Scout rush every 4th wave
  if (wave % 4 === 0) {
    const scouts = 4 + Math.floor(wave * 1.2);
    for (let i = 0; i < scouts; i++) queue.push('scout');
    for (let i = 0; i < 3; i++) queue.push('drone');
    return queue;
  }

  // Regular mixed waves
  const drones = 3 + Math.floor(wave * 1.2);
  for (let i = 0; i < drones; i++) queue.push('drone');

  // Add scouts after wave 4
  if (wave > 4) {
    const scouts = Math.floor((wave - 4) * 0.6);
    for (let i = 0; i < scouts; i++) queue.push('scout');
  }

  // Sprinkle tanks after wave 8
  if (wave > 8) {
    const tanks = Math.floor((wave - 8) / 3);
    for (let i = 0; i < tanks; i++) queue.push('tank');
  }

  return queue;
}

// ─── Initial state ──────────────────────────────────────────────────────────

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
    path: PATH,
    gameOver: false,
    waveActive: false,
    enemiesToSpawn: [],
    spawnTimer: 0,
    waveCountdown: FIRST_WAVE_COUNTDOWN,
    frame: 0,
    startTime,
    buildingTowerType: null,
    cursorX: -100,
    cursorY: -100,
  };
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface InputState {
  placeTower?: { type: TowerType; x: number; y: number };
}

// ─── Update ─────────────────────────────────────────────────────────────────

export function updateGame(state: GameState, input: InputState): GameState {
  if (state.gameOver) return state;

  const ns: GameState = {
    ...state,
    frame: state.frame + 1,
    invaders: [...state.invaders],
    bullets: [...state.bullets],
    particles: [...state.particles],
    towers: [...state.towers],
    enemiesToSpawn: [...state.enemiesToSpawn],
  };

  // ── Tower placement ──────────────────────────────────────────────────────
  if (input.placeTower) {
    const { type, x, y } = input.placeTower;
    const cost = TOWER_COSTS[type];
    if (ns.money >= cost && canPlaceTower(x, y, ns)) {
      ns.money -= cost;
      const s = TOWER_STATS[type];
      ns.towers.push({
        id: uid(), type, x, y,
        range: s.range, damage: s.damage, fireRate: s.fireRate,
        cooldown: 0, level: 1, angle: 0,
      });
    }
  }

  // ── Wave management ──────────────────────────────────────────────────────
  if (!ns.waveActive) {
    ns.waveCountdown--;
    if (ns.waveCountdown <= 0) {
      ns.wave++;
      ns.waveActive = true;
      ns.enemiesToSpawn = buildWaveQueue(ns.wave);
      ns.spawnTimer = 0;
      ns.waveCountdown = WAVE_COUNTDOWN;
    }
  } else {
    if (ns.enemiesToSpawn.length > 0) {
      ns.spawnTimer--;
      if (ns.spawnTimer <= 0) {
        const type = ns.enemiesToSpawn.shift()!;
        const s = INVADER_STATS[type];
        const hp = Math.round(s.hp * hpScale(ns.wave));
        const spd = s.speed * speedScale(ns.wave);
        const start = ns.path[0];
        ns.invaders.push({
          id: uid(), type,
          x: start.x, y: start.y,
          hp,
          maxHp: hp,
          speed: spd,
          value: s.value + Math.floor(ns.wave / 3), // slightly more reward at higher waves
          damage: 1,
          pathIndex: 0,
          frozen: 0,
        });
        ns.spawnTimer = spawnDelay(ns.wave);
      }
    } else if (ns.invaders.length === 0) {
      ns.waveActive = false;
      ns.waveCountdown = WAVE_COUNTDOWN;
      ns.score += ns.wave * 50; // wave complete bonus
      // Bonus money for surviving a wave
      ns.money += 10 + ns.wave * 5;
    }
  }

  // ── Invader movement ─────────────────────────────────────────────────────
  const aliveInvaders: Invader[] = [];
  for (const inv of ns.invaders) {
    let spd = inv.speed;
    let frozen = inv.frozen;
    if (frozen > 0) { spd *= 0.4; frozen--; }

    const target = ns.path[inv.pathIndex + 1];
    if (!target) {
      // Reached citadel
      ns.citadelHp -= inv.damage;
      // Damage particles
      for (let i = 0; i < 6; i++) {
        ns.particles.push({
          x: inv.x, y: inv.y,
          vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
          life: 25, maxLife: 25, color: '#f59e0b', size: 3 + Math.random() * 3,
        });
      }
      continue;
    }

    const newPos = moveTowards(inv, target, spd);
    let idx = inv.pathIndex;
    if (dist(newPos, target) < 1) idx++;

    aliveInvaders.push({ ...inv, x: newPos.x, y: newPos.y, pathIndex: idx, frozen });
  }
  ns.invaders = aliveInvaders;

  if (ns.citadelHp <= 0) {
    ns.citadelHp = 0;
    ns.gameOver = true;
    return ns;
  }

  // ── Tower targeting & shooting ───────────────────────────────────────────
  for (let ti = 0; ti < ns.towers.length; ti++) {
    const tower = { ...ns.towers[ti] };
    ns.towers[ti] = tower;

    if (tower.cooldown > 0) { tower.cooldown--; continue; }

    // Find closest invader in range
    let bestDist = Infinity;
    let bestInv: Invader | null = null;
    for (const inv of ns.invaders) {
      const d = dist(tower, inv);
      if (d <= tower.range && d < bestDist) { bestDist = d; bestInv = inv; }
    }

    if (bestInv) {
      const a = angle(tower, bestInv);
      tower.angle = a;
      tower.cooldown = Math.round(60 / tower.fireRate);

      const bulletSpeed = tower.type === 'sniper' ? 14 : 7;
      ns.bullets.push({
        x: tower.x + Math.cos(a) * TOWER_SIZE,
        y: tower.y + Math.sin(a) * TOWER_SIZE,
        vx: Math.cos(a) * bulletSpeed,
        vy: Math.sin(a) * bulletSpeed,
        damage: tower.damage,
        type: tower.type === 'slow' ? 'slow' : tower.type === 'sniper' ? 'laser' : 'basic',
        color: TOWER_STATS[tower.type].color,
      });
    }
  }

  // ── Bullet movement & collision ──────────────────────────────────────────
  const aliveBullets: Bullet[] = [];
  for (const b of ns.bullets) {
    const nb: Bullet = { ...b, x: b.x + b.vx, y: b.y + b.vy };
    if (nb.x < -20 || nb.x > GAME_WIDTH + 20 || nb.y < -20 || nb.y > GAME_HEIGHT + 20) continue;

    let hit = false;
    for (const inv of ns.invaders) {
      if (inv.hp <= 0) continue;
      const hitRadius = INVADER_STATS[inv.type].size + 4;
      if (dist(nb, inv) < hitRadius) {
        hit = true;
        inv.hp -= nb.damage;
        if (nb.type === 'slow') inv.frozen = Math.max(inv.frozen, 90);

        // Spark
        ns.particles.push({
          x: nb.x, y: nb.y,
          vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
          life: 8, maxLife: 8, color: nb.color, size: 2,
        });

        if (inv.hp <= 0) {
          ns.money += inv.value;
          ns.score += inv.value * 10;
          for (let i = 0; i < 8; i++) {
            ns.particles.push({
              x: inv.x, y: inv.y,
              vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
              life: 18, maxLife: 18,
              color: INVADER_STATS[inv.type].color, size: 2 + Math.random() * 3,
            });
          }
        }
        break;
      }
    }
    if (!hit) aliveBullets.push(nb);
  }
  ns.bullets = aliveBullets;
  ns.invaders = ns.invaders.filter(inv => inv.hp > 0);

  // ── Particles ────────────────────────────────────────────────────────────
  ns.particles = ns.particles
    .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.05, life: p.life - 1 }))
    .filter(p => p.life > 0);

  return ns;
}
