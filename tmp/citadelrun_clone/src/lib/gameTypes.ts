export interface Position {
  x: number;
  y: number;
}

export interface Player extends Position {
  width: number;
  height: number;
  vy: number; // vertical velocity (for jumping)
  isGrounded: boolean;
}

export interface Bullet extends Position {
  width: number;
  height: number;
  active: boolean;
}

export type ObstacleType = 'jump' | 'shoot1' | 'shoot2' | 'shoot3';

export interface Obstacle extends Position {
  width: number;
  height: number;
  type: ObstacleType;
  hp: number; // hit points remaining
  maxHp: number;
  active: boolean;
  /** Visual flash timer when hit */
  hitFlash: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GroundTile {
  x: number;
  type: number; // visual variant
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  obstacles: Obstacle[];
  stars: Star[];
  particles: Particle[];
  groundTiles: GroundTile[];
  score: number;
  destroyScore: number; // bonus points from destroying obstacles
  survivalTime: number; // seconds survived
  gameSpeed: number; // current scrolling speed (increases over time)
  speedMultiplier: number; // hazard-based speed penalty multiplier
  fuelFlashTimer: number; // frames remaining for "10% FASTER" warning flash
  fuelExplosionTimer: number; // frames remaining for fuel explosion ring effect
  fuelExplosionX: number; // last fuel explosion center X
  fuelExplosionY: number; // last fuel explosion center Y
  gameOver: boolean;
  lastBulletTime: number;
  screenShake: number;
  distanceTraveled: number;
  /** Next obstacle spawn distance threshold */
  nextObstacleAt: number;
  /** Difficulty level (increases over time) */
  difficulty: number;
  /** Frame counter */
  frame: number;
  /** Time the game started (performance.now) */
  startTime: number;
}

export type GamePhase = 'idle' | 'paying' | 'ready' | 'playing' | 'gameOver';

export interface LeaderboardEntry {
  lightning: string;
  score: number;
  timestamp: number;
  eventId: string;
}

export interface WeeklyWinner {
  lightning: string;
  score: number;
  weekStart: number;
  weekEnd: number;
}
