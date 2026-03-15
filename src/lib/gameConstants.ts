// ─── Canvas ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// ─── Game Balance ─────────────────────────────────────────────────────────────
export const INITIAL_LIVES = 25;
export const INITIAL_MONEY = 250;
export const FIRST_WAVE_COUNTDOWN = 360; // 6s to build before wave 1
export const WAVE_COUNTDOWN = 180; // 3s between later waves
export const SPAWN_DELAY_BASE = 45; // frames between spawns (slows early, speeds up later)
export const SPAWN_DELAY_MIN = 18; // fastest spawn rate at high waves

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
  basic: { range: 100, damage: 12, fireRate: 1.2, color: '#60a5fa', label: 'Turret' },
  rapid: { range: 80, damage: 4, fireRate: 5, color: '#38bdf8', label: 'Rapid' },
  sniper: { range: 200, damage: 50, fireRate: 0.4, color: '#818cf8', label: 'Sniper' },
  slow: { range: 90, damage: 3, fireRate: 1, color: '#34d399', label: 'Freeze' },
};

// ─── Invaders ─────────────────────────────────────────────────────────────────
export const INVADER_STATS: Record<string, { hp: number; speed: number; value: number; color: string; size: number }> = {
  drone: { hp: 30, speed: 1.4, value: 5, color: '#f87171', size: 8 },
  scout: { hp: 15, speed: 2.8, value: 8, color: '#fb923c', size: 6 },
  tank: { hp: 120, speed: 0.7, value: 20, color: '#fbbf24', size: 12 },
  boss: { hp: 600, speed: 0.5, value: 100, color: '#f472b6', size: 18 },
};

// ─── Colors — Vibrant Blue ───────────────────────────────────────────────────
export const COLOR_BG = '#060a14';
export const COLOR_PATH_FILL = '#0f1728';
export const COLOR_PATH_EDGE = '#1a2744';
export const COLOR_GRID = 'rgba(96,165,250,0.04)';
export const COLOR_CITADEL = '#3b82f6';
export const COLOR_CITADEL_GLOW = 'rgba(59,130,246,0.3)';

// ─── Payment / Nostr ─────────────────────────────────────────────────────────
export const PAYMENT_AMOUNT_SATS = 100;
export const PAYMENT_RECIPIENT = 'claw@primal.net';
export const GAME_SCORE_KIND = 1448;
export const GAME_TAG = 'citadel-war';
