import type {
  GameState,
  Bullet,
  Obstacle,
  ObstacleType,
  Star,
  Particle,
  GroundTile,
} from './gameTypes';

import {
  GAME_WIDTH,
  GROUND_Y,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_GROUND_Y,
  GRAVITY,
  JUMP_VELOCITY,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BULLET_SPEED,
  BULLET_COOLDOWN,
  OBSTACLE_GAP_MIN,
  OBSTACLE_GAP_MAX,
  SPIKE_WIDTH,
  SPIKE_HEIGHT,
  CRATE_WIDTH,
  CRATE_HEIGHT,
  BARREL_WIDTH,
  BARREL_HEIGHT,
  WALL_WIDTH,
  WALL_HEIGHT,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_RAMP_PER_SECOND,
  SCORE_PER_SECOND,
  SCORE_SHOOT1,
  SCORE_SHOOT2,
  SCORE_SHOOT3,
  SCORE_HIT,
  COLOR_PARTICLE_DUST,
  COLOR_CRATE,
  COLOR_BARREL,
  COLOR_WALL,
  COLOR_HIT_FLASH,
  COLOR_PLAYER_ACCENT,
} from './gameConstants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function rectCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function makeParticles(
  x: number,
  y: number,
  count: number,
  color: string,
  speedMin = 1,
  speedMax = 4,
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.8;
    const speed = rand(speedMin, speedMax);
    out.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(0, 2),
      life: 1,
      maxLife: 1,
      color,
      size: rand(2, 5),
    });
  }
  return out;
}

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 55; i++) {
    stars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GROUND_Y * 0.85,
      size: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.3 + 0.05,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
  return stars;
}

function makeGroundTiles(): GroundTile[] {
  const tiles: GroundTile[] = [];
  const tileW = 32;
  for (let x = -tileW; x < GAME_WIDTH + tileW * 2; x += tileW) {
    tiles.push({ x, type: Math.floor(Math.random() * 3) });
  }
  return tiles;
}

// ─── Obstacle spawning ───────────────────────────────────────────────────────

/**
 * Returns a list of obstacle types based on the current difficulty (0-1+).
 * Early game: mostly jump-only and single-shot.
 * Later: multi-shot obstacles appear more frequently, occasionally in clusters.
 */
function chooseObstacleTypes(difficulty: number): ObstacleType[] {
  // Single obstacles at low difficulty
  const roll = Math.random();

  if (difficulty < 0.2) {
    // Very easy — mostly jump-only spikes or easy crates
    if (roll < 0.6) return ['jump'];
    return ['shoot1'];
  }

  if (difficulty < 0.4) {
    if (roll < 0.35) return ['jump'];
    if (roll < 0.65) return ['shoot1'];
    if (roll < 0.85) return ['shoot2'];
    // small chance of pair
    return ['shoot1', 'shoot1'];
  }

  if (difficulty < 0.6) {
    if (roll < 0.25) return ['jump'];
    if (roll < 0.45) return ['shoot1'];
    if (roll < 0.65) return ['shoot2'];
    if (roll < 0.80) return ['shoot3'];
    if (roll < 0.90) return ['shoot1', 'shoot2'];
    return ['jump', 'shoot1'];
  }

  if (difficulty < 0.8) {
    if (roll < 0.15) return ['jump'];
    if (roll < 0.30) return ['shoot1'];
    if (roll < 0.48) return ['shoot2'];
    if (roll < 0.65) return ['shoot3'];
    if (roll < 0.77) return ['shoot2', 'shoot1'];
    if (roll < 0.87) return ['shoot1', 'shoot3'];
    if (roll < 0.93) return ['jump', 'shoot2'];
    return ['shoot3', 'shoot1'];
  }

  // Max difficulty — tough clusters
  if (roll < 0.10) return ['jump'];
  if (roll < 0.20) return ['shoot1'];
  if (roll < 0.35) return ['shoot3'];
  if (roll < 0.50) return ['shoot2', 'shoot2'];
  if (roll < 0.62) return ['shoot3', 'shoot1'];
  if (roll < 0.73) return ['jump', 'shoot3'];
  if (roll < 0.83) return ['shoot1', 'shoot2', 'shoot1'];
  return ['shoot3', 'shoot2'];
}

function obstacleSize(type: ObstacleType): { w: number; h: number } {
  switch (type) {
    case 'jump':   return { w: SPIKE_WIDTH, h: SPIKE_HEIGHT };
    case 'shoot1': return { w: CRATE_WIDTH, h: CRATE_HEIGHT };
    case 'shoot2': return { w: BARREL_WIDTH, h: BARREL_HEIGHT };
    case 'shoot3': return { w: WALL_WIDTH, h: WALL_HEIGHT };
  }
}

function obstacleHp(type: ObstacleType): number {
  switch (type) {
    case 'jump':   return 999; // unkillable
    case 'shoot1': return 1;
    case 'shoot2': return 2;
    case 'shoot3': return 3;
  }
}

function spawnObstacleGroup(difficulty: number, baseX: number): Obstacle[] {
  const types = chooseObstacleTypes(difficulty);
  const obstacles: Obstacle[] = [];
  let offsetX = 0;

  for (const type of types) {
    const { w, h } = obstacleSize(type);
    const hp = obstacleHp(type);
    obstacles.push({
      x: baseX + offsetX,
      y: GROUND_Y - h,
      width: w,
      height: h,
      type,
      hp,
      maxHp: hp,
      active: true,
      hitFlash: 0,
    });
    // Cluster gap between obstacles in the same group
    offsetX += w + 18;
  }

  return obstacles;
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function createInitialState(startTime: number): GameState {
  return {
    player: {
      x: PLAYER_X,
      y: PLAYER_GROUND_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vy: 0,
      isGrounded: true,
    },
    bullets: [],
    obstacles: [],
    stars: makeStars(),
    particles: [],
    groundTiles: makeGroundTiles(),
    score: 0,
    destroyScore: 0,
    survivalTime: 0,
    gameSpeed: INITIAL_SPEED,
    speedMultiplier: 1,
    fuelFlashTimer: 0,
    fuelExplosionTimer: 0,
    fuelExplosionX: 0,
    fuelExplosionY: 0,
    gameOver: false,
    lastBulletTime: 0,
    screenShake: 0,
    distanceTraveled: 0,
    nextObstacleAt: OBSTACLE_GAP_MIN + OBSTACLE_GAP_MIN * 0.5, // first obstacle a bit far
    difficulty: 0,
    frame: 0,
    startTime,
  };
}

// ─── Update ───────────────────────────────────────────────────────────────────

interface InputState {
  jump: boolean;
  shoot: boolean;
}

export function updateGame(state: GameState, input: InputState, now: number): GameState {
  if (state.gameOver) return state;

  const dt = 1; // 1 tick per frame at 60 fps
  const ns = { ...state };

  // ── Frame counter
  ns.frame = state.frame + 1;

  // decay warning/effect timers
  ns.fuelFlashTimer = Math.max(0, state.fuelFlashTimer - 1);
  ns.fuelExplosionTimer = Math.max(0, state.fuelExplosionTimer - 1);

  // ── Survival time (in seconds)
  ns.survivalTime = (now - state.startTime) / 1000;

  // ── Difficulty & speed ramp
  const elapsed = ns.survivalTime;
  ns.difficulty = Math.min(1, elapsed / 90); // reaches 1 at 90 seconds, stays there
  const baseSpeed = INITIAL_SPEED + elapsed * SPEED_RAMP_PER_SECOND;
  ns.gameSpeed = Math.min(MAX_SPEED, baseSpeed * state.speedMultiplier);

  // ── Score: survival
  ns.score = Math.floor(elapsed * SCORE_PER_SECOND) + state.destroyScore;

  // ── Player physics
  const player = { ...state.player };

  if (player.isGrounded && input.jump) {
    player.vy = JUMP_VELOCITY;
    player.isGrounded = false;
    // Dust particles at feet
    ns.particles = [
      ...state.particles,
      ...makeParticles(player.x + player.width / 2, GROUND_Y, 6, COLOR_PARTICLE_DUST, 0.5, 2.5),
    ];
  }

  if (!player.isGrounded) {
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y >= PLAYER_GROUND_Y) {
      player.y = PLAYER_GROUND_Y;
      player.vy = 0;
      player.isGrounded = true;
      // Landing puff
      ns.particles = [
        ...ns.particles,
        ...makeParticles(player.x + player.width / 2, GROUND_Y, 4, COLOR_PARTICLE_DUST, 0.3, 1.5),
      ];
    }
  }
  ns.player = player;

  // ── Shoot
  if (input.shoot && now - state.lastBulletTime > BULLET_COOLDOWN) {
    ns.bullets = [
      ...state.bullets,
      {
        x: player.x + player.width,
        y: player.y + player.height * 0.4,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        active: true,
      },
    ];
    ns.lastBulletTime = now;
  }

  // ── Move bullets
  ns.bullets = ns.bullets
    .map((b) => ({ ...b, x: b.x + BULLET_SPEED * dt }))
    .filter((b) => b.x < GAME_WIDTH + 20);

  // ── Scroll world
  const scroll = ns.gameSpeed * dt;
  ns.distanceTraveled = state.distanceTraveled + scroll;

  // Move ground tiles
  ns.groundTiles = state.groundTiles
    .map((t) => ({ ...t, x: t.x - scroll }))
    .filter((t) => t.x > -64);
  // Replenish ground tiles
  const lastTileX = Math.max(...ns.groundTiles.map((t) => t.x), -32);
  if (lastTileX < GAME_WIDTH + 32) {
    for (let xx = lastTileX + 32; xx < GAME_WIDTH + 64; xx += 32) {
      ns.groundTiles = [...ns.groundTiles, { x: xx, type: Math.floor(Math.random() * 3) }];
    }
  }

  // Scroll stars (parallax)
  ns.stars = state.stars.map((s) => {
    let nx = s.x - s.speed * ns.gameSpeed * 0.25;
    if (nx < -2) nx += GAME_WIDTH + 4;
    return { ...s, x: nx };
  });

  // ── Move existing obstacles
  let newObstacles: Obstacle[] = state.obstacles
    .map((o) => ({ ...o, x: o.x - scroll, hitFlash: Math.max(0, o.hitFlash - 1) }))
    .filter((o) => o.active && o.x > -120);

  // ── Spawn new obstacles
  const distScrolled = ns.distanceTraveled;
  if (distScrolled >= state.nextObstacleAt) {
    const gap = rand(
      OBSTACLE_GAP_MIN,
      OBSTACLE_GAP_MAX - ns.difficulty * 150, // gap shrinks with difficulty
    );
    const spawnX = GAME_WIDTH + 20;
    const newGroup = spawnObstacleGroup(ns.difficulty, spawnX);
    newObstacles = [...newObstacles, ...newGroup];
    ns.nextObstacleAt = distScrolled + Math.max(OBSTACLE_GAP_MIN, gap);
  }

  // ── Bullet vs obstacle collision
  const survivingBullets: Bullet[] = [];
  let destroyScoreGain = 0;
  let newParticles: Particle[] = [...(ns.particles ?? [])];

  for (const bullet of ns.bullets) {
    let hit = false;
    for (let i = 0; i < newObstacles.length; i++) {
      const obs = newObstacles[i];
      if (
        !obs.active ||
        obs.type === 'jump' // spikes cannot be shot
      ) continue;

      if (rectCollision(bullet.x, bullet.y, bullet.width, bullet.height,
                        obs.x, obs.y, obs.width, obs.height)) {
        hit = true;
        const newHp = obs.hp - 1;
        if (newHp <= 0) {
          // Destroyed
          newObstacles[i] = { ...obs, hp: 0, active: false };
          const points = obs.maxHp === 1 ? SCORE_SHOOT1 : obs.maxHp === 2 ? SCORE_SHOOT2 : SCORE_SHOOT3;
          destroyScoreGain += points;

          // Fuel drum penalty: exploding drums permanently accelerates the run by +10%
          if (obs.type === 'shoot2') {
            ns.speedMultiplier *= 1.1;
            const boostedBaseSpeed = INITIAL_SPEED + elapsed * SPEED_RAMP_PER_SECOND;
            ns.gameSpeed = Math.min(MAX_SPEED, boostedBaseSpeed * ns.speedMultiplier);
            ns.fuelFlashTimer = 72;
            ns.fuelExplosionTimer = 26;
            ns.fuelExplosionX = obs.x + obs.width / 2;
            ns.fuelExplosionY = obs.y + obs.height / 2;

            // Big fuel explosion particle burst
            newParticles = [
              ...newParticles,
              ...makeParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 30, COLOR_HIT_FLASH, 2.5, 7),
              ...makeParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 22, COLOR_BARREL, 2, 6),
              ...makeParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 18, COLOR_PARTICLE_DUST, 1.5, 4.5),
            ];
            ns.screenShake = 10;
          }

          const colors = [COLOR_HIT_FLASH, COLOR_CRATE, COLOR_BARREL, COLOR_WALL];
          const col = colors[Math.min(obs.maxHp - 1, 3)];
          newParticles = [
            ...newParticles,
            ...makeParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 12, col, 1.5, 5),
          ];
          ns.screenShake = Math.max(ns.screenShake, 4);
        } else {
          // Hit but not destroyed
          newObstacles[i] = { ...obs, hp: newHp, hitFlash: 8 };
          destroyScoreGain += SCORE_HIT;
          newParticles = [
            ...newParticles,
            ...makeParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, COLOR_HIT_FLASH, 1, 3),
          ];
        }
        break;
      }
    }
    if (!hit) survivingBullets.push(bullet);
  }

  ns.bullets = survivingBullets;
  ns.particles = newParticles;
  ns.destroyScore = state.destroyScore + destroyScoreGain;
  ns.score = Math.floor(ns.survivalTime * SCORE_PER_SECOND) + ns.destroyScore;
  ns.obstacles = newObstacles.filter((o) => o.active);
  ns.screenShake = Math.max(0, (ns.screenShake ?? 0) - 0.5);

  // ── Particle update
  ns.particles = ns.particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.12,
      life: p.life - 0.035,
    }))
    .filter((p) => p.life > 0);

  // ── Player vs obstacle collision → game over
  for (const obs of ns.obstacles) {
    // Slightly smaller hitbox (forgive 4px on each edge for feel)
    const shrink = 4;
    if (rectCollision(
      player.x + shrink, player.y + shrink,
      player.width - shrink * 2, player.height - shrink * 2,
      obs.x + shrink, obs.y + shrink,
      obs.width - shrink * 2, obs.height - shrink * 2,
    )) {
      ns.gameOver = true;
      ns.screenShake = 10;
      ns.particles = [
        ...ns.particles,
        ...makeParticles(player.x + player.width / 2, player.y + player.height / 2, 18, COLOR_PLAYER_ACCENT, 2, 6),
        ...makeParticles(player.x + player.width / 2, player.y + player.height / 2, 8, COLOR_PARTICLE_DUST, 1, 4),
      ];
      return ns;
    }
  }

  return ns;
}
