// ─── Canvas ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 40;

// ─── Game Balance ─────────────────────────────────────────────────────────────
export const INITIAL_LIVES = 20;
export const INITIAL_MONEY = 150;
export const WAVE_DELAY = 600; // frames between waves
export const SPAWN_DELAY = 45; // frames between enemies in a wave

// ─── Towers ───────────────────────────────────────────────────────────────────
export const TOWER_COSTS = {
  basic: 50,
  rapid: 120,
  sniper: 200,
  slow: 150
};

export const TOWER_STATS = {
  basic: { range: 120, damage: 10, fireRate: 1.5, color: '#3b82f6' },
  rapid: { range: 100, damage: 4, fireRate: 5, color: '#f59e0b' },
  sniper: { range: 250, damage: 40, fireRate: 0.5, color: '#ef4444' },
  slow: { range: 100, damage: 5, fireRate: 1, color: '#10b981' }
};

// ─── Invaders ─────────────────────────────────────────────────────────────────
export const INVADER_STATS = {
  drone: { hp: 20, speed: 2, value: 5, color: '#ef4444', size: 12 },
  scout: { hp: 10, speed: 4, value: 8, color: '#f59e0b', size: 10 },
  tank: { hp: 100, speed: 1, value: 20, color: '#10b981', size: 16 },
  boss: { hp: 500, speed: 0.8, value: 100, color: '#8b5cf6', size: 24 }
};

// ���── Colors ──────────────────────────────────────────────────────────────────
export const COLOR_BG = '#0d0700';
export const COLOR_PATH = '#1f1610';
export const COLOR_GRID = '#1a1209';
export const COLOR_CITADEL = '#f59e0b';
export const COLOR_RANGE = 'rgba(255, 255, 255, 0.1)';
export const COLOR_RANGE_INVALID = 'rgba(239, 68, 68, 0.2)';

// ─── Payment / Nostr ─────────────────────────────────────────────────────────
export const PAYMENT_AMOUNT_SATS = 100;
export const PAYMENT_RECIPIENT = 'claw@primal.net';
export const GAME_SCORE_KIND = 1448;
export const GAME_TAG = 'citadel-war';

