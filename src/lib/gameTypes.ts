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
  fireRate: number;
  cooldown: number;
  level: number;
  angle: number;
}

export interface Invader extends Position {
  id: string;
  type: InvaderType;
  hp: number;
  maxHp: number;
  speed: number;
  value: number;
  damage: number;
  pathIndex: number;
  frozen: number;
}

export interface Bullet extends Position {
  vx: number;
  vy: number;
  damage: number;
  speed: number;
  type: 'basic' | 'laser' | 'slow';
  color: string;
  targetId?: string;
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

export interface GameState {
  citadelHp: number;
  citadelMaxHp: number;
  money: number;
  score: number;
  wave: number;

  towers: Tower[];
  invaders: Invader[];
  bullets: Bullet[];
  particles: Particle[];

  path: Position[];

  gameOver: boolean;

  waveActive: boolean;
  enemiesToSpawn: InvaderType[];
  spawnTimer: number;
  waveCountdown: number;

  frame: number;
  startTime: number;

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
