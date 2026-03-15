export interface Position {
  x: number;
  y: number;
}

export type TowerType = 'basic' | 'rapid' | 'sniper' | 'slow';
export type InvaderType = 'drone' | 'scout' | 'tank' | 'boss';

export interface Tower extends Position {
  id: string;
  type: TowerType;
  range: number;
  damage: number;
  fireRate: number; // shots per second
  cooldown: number; // frames until next shot
  level: number;
  active: boolean; // while placing or active
  angle: number; // turret rotation
  preview?: boolean; // is this a placement ghost?
}

export interface Invader extends Position {
  id: string;
  type: InvaderType;
  hp: number;
  maxHp: number;
  speed: number;
  value: number; // score value when destroyed
  damage: number; // damage to citadel
  pathIndex: number; // current index in path
  pathProgress: number; // 0-1 progress to next waypoint
  frozen: number; // frames frozen/slowed
  effect: 'none' | 'slowed' | 'burning';
}

export interface Bullet extends Position {
  id: string;
  targetId: string; // homing
  speed: number;
  damage: number;
  vx: number;
  vy: number;
  active: boolean;
  type: 'basic' | 'laser' | 'missile' | 'slow';
  color: string;
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
  type: 'spark' | 'smoke' | 'explosion' | 'text';
  text?: string;
}

export interface GameState {
  citadelHp: number;
  citadelMaxHp: number;
  money: number; // resources to build towers (called 'sats' in UI)
  score: number;
  wave: number;
  
  towers: Tower[];
  invaders: Invader[];
  bullets: Bullet[];
  particles: Particle[];
  
  // Game field
  width: number;
  height: number;
  path: Position[]; // Waypoints for invaders to follow
  
  gameOver: boolean;
  gameSpeed: number; // 1x, 2x, etc.
  
  // Wave management
  waveActive: boolean;
  enemiesToSpawn: InvaderType[]; // Queue of enemies
  spawnTimer: number; // frames until next spawn
  
  frame: number;
  startTime: number;
  
  // Interaction state
  selectedTowerId: string | null;
  buildingTowerType: TowerType | null;
  cursorX: number;
  cursorY: number;
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
