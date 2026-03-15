// ─── Canvas ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 260;

// ─── Ground ───────────────────────────────────────────────────────────────────
export const GROUND_Y = GAME_HEIGHT - 40; // y where the ground surface is
export const GROUND_HEIGHT = 40;

// ─── Player ───────────────────────────────────────────────────────────────────
export const PLAYER_X = 72;             // fixed horizontal position
export const PLAYER_WIDTH = 28;
export const PLAYER_HEIGHT = 36;
/** y when standing on ground */
export const PLAYER_GROUND_Y = GROUND_Y - PLAYER_HEIGHT;

// ─── Physics ──────────────────────────────────────────────────────────────────
export const GRAVITY = 0.55;
export const JUMP_VELOCITY = -11.5;

// ─── Bullets ──────────────────────────────────────────────────────────────────
export const BULLET_WIDTH = 14;
export const BULLET_HEIGHT = 5;
export const BULLET_SPEED = 12;         // px per frame, rightward
export const BULLET_COOLDOWN = 300;     // ms between shots

// ─── Obstacles ────────────────────────────────────────────────────────────────
/** Min/max pixel gap between obstacle spawns */
export const OBSTACLE_GAP_MIN = 260;
export const OBSTACLE_GAP_MAX = 520;

// jump-only obstacles: barbed wire — cannot be shot
export const SPIKE_WIDTH = 28;
export const SPIKE_HEIGHT = 32;

// shoot-1 obstacle: truck
export const CRATE_WIDTH = 68;
export const CRATE_HEIGHT = 68;

// shoot-2 obstacle: barrel
export const BARREL_WIDTH = 28;
export const BARREL_HEIGHT = 36;

// shoot-3 obstacle: citadel
export const WALL_WIDTH = 72;
export const WALL_HEIGHT = 117;

// ─── Background parallax ──────────────────────────────────────────────────────
export const PARALLAX_FAR_SPEED = 0.15;
export const PARALLAX_MID_SPEED = 0.45;

// ─── Difficulty ───────────────────────────────────────────────────────────────
export const INITIAL_SPEED = 3.2;           // px / frame at start
export const MAX_SPEED = 10;                // px / frame cap
export const SPEED_RAMP_PER_SECOND = 0.014; // how much speed grows per second
export const DIFFICULTY_RAMP_INTERVAL = 10; // seconds between difficulty bumps

// ─── Scoring ──────────────────────────────────────────────────────────────────
export const SCORE_PER_SECOND = 1;          // survival score
export const SCORE_SHOOT1 = 15;             // destroying 1-hit obstacle
export const SCORE_SHOOT2 = 30;             // destroying 2-hit obstacle
export const SCORE_SHOOT3 = 50;             // destroying 3-hit obstacle
export const SCORE_HIT = 5;                 // partial hit on multi-hp obstacle

// ─── Colors — Mad Max Wasteland ──────────────────────────────────────────────
export const COLOR_BG_TOP = '#120d09';        // ashen dusk sky
export const COLOR_BG_BOTTOM = '#2a1b12';     // dusty horizon haze
export const COLOR_GROUND = '#21150f';        // dry, compacted earth
export const COLOR_GROUND_LINE = '#3a281c';   // hard-packed surface edge
export const COLOR_GROUND_CRACK = '#130d09';  // crack details
export const COLOR_PLAYER = '#9f8b6d';        // sun-bleached gear tone
export const COLOR_PLAYER_COAT = '#4a3a2d';   // weathered leather coat
export const COLOR_PLAYER_ACCENT = '#b36a39'; // oxidized copper accent
export const COLOR_BULLET = '#d8a15b';        // brass projectile
export const COLOR_BULLET_TRAIL = '#8f5224';  // hot tracer trail
export const COLOR_SPIKE = '#6d655b';         // rusted wire/metal hazard
export const COLOR_CRATE = '#6b5a44';         // wrecked truck body rust
export const COLOR_BARREL = '#7b4f2b';        // old fuel drum
export const COLOR_WALL = '#514439';          // fortified scrap-concrete
export const COLOR_HIT_FLASH = '#d4b07a';     // impact spark flash
export const COLOR_PARTICLE_DUST = '#8b6a4d'; // dust particles
export const COLOR_SUN = '#d67d42';           // sun through smog
export const COLOR_MESA = '#2a1d16';          // far mesa silhouette
export const COLOR_RUIN = '#1a130f';          // distant ruins

// ─── Payment / Nostr ─────────────────────────────────────────────────────────
export const PAYMENT_AMOUNT_SATS = 100;
export const PAYMENT_RECIPIENT = 'claw@primal.net';
export const GAME_SCORE_KIND = 1448;
export const GAME_TAG = 'citadel-run';
