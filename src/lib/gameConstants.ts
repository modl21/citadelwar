// ─── Canvas ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 480;

// ─── Game Balance ─────────────────────────────────────────────────────────────
export const INITIAL_LIVES = 20;
export const INITIAL_MONEY = 200;
export const WAVE_COUNTDOWN = 180; // frames (3s at 60fps) between waves
export const SPAWN_DELAY = 30; // frames between enemies in a wave

// ─── Path ─────────────────────────────────────────────────────────────────────
export const PATH_WIDTH = 28;

// ─── Towers ───────────────────────────────────────────────────────────────────
export const TOWER_SIZE = 18;
export const TOWER_COSTS: Record<string, number> = {
  basic: 40,
  rapid: 100,
  sniper: 150,
  slow: 120,
};

export const TOWER_STATS: Record<string, { range: number; damage: number; fireRate: number; color: string; label: string }> = {
  basic: { range: 100, damage: 12, fireRate: 1.2, color: '#3b82f6', label: 'Turret' },
  rapid: { range: 80, damage: 4, fireRate: 5, color: '#f59e0b', label: 'Rapid' },
  sniper: { range: 200, damage: 50, fireRate: 0.4, color: '#ef4444', label: 'Sniper' },
  slow: { range: 90, damage: 3, fireRate: 1, color: '#10b981', label: 'Freeze' },
};

// ─── Invaders ─────────────────────────────────────────────────────────────────
export const INVADER_STATS: Record<string, { hp: number; speed: number; value: number; color: string; size: number }> = {
  drone: { hp: 30, speed: 1.4, value: 5, color: '#ef4444', size: 8 },
  scout: { hp: 15, speed: 2.8, value: 8, color: '#fb923c', size: 6 },
  tank: { hp: 120, speed: 0.7, value: 20, color: '#22c55e', size: 12 },
  boss: { hp: 600, speed: 0.5, value: 100, color: '#a855f7', size: 18 },
};

// ─── Colors ──────────────────────────────────────────────────────────────────
export const COLOR_BG = '#0a0805';
export const COLOR_PATH_FILL = '#1c1510';
export const COLOR_PATH_EDGE = '#2a1f18';
export const COLOR_GRID = 'rgba(255,255,255,0.03)';
export const COLOR_CITADEL = '#f59e0b';
export const COLOR_CITADEL_GLOW = 'rgba(245,158,11,0.3)';

// ─── Payment / Nostr ─────────────────────────────────────────────────────────
export const PAYMENT_AMOUNT_SATS = 100;
export const PAYMENT_RECIPIENT = 'claw@primal.net';
export const GAME_SCORE_KIND = 1448;
export const GAME_TAG = 'citadel-war';
