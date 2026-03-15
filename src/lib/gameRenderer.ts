import type { GameState, Tower, Invader, Bullet, Particle } from './gameTypes';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PATH_WIDTH,
  TOWER_SIZE,
  COLOR_BG,
  COLOR_PATH_FILL,
  COLOR_PATH_EDGE,
  COLOR_GRID,
  COLOR_CITADEL,
  COLOR_CITADEL_GLOW,
  TOWER_STATS,
  INVADER_STATS,
  TOWER_COSTS,
} from './gameConstants';
import { canPlaceTower } from './gameEngine';

// ─── Background ──────────────────────────────────────────────────────────────

function renderBg(ctx: CanvasRenderingContext2D) {
  // Dark fill
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Subtle grid
  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= GAME_HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
  }
}

// ─── Path ────────────────────────────────────────────────────────────────────

function renderPath(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  const path = state.path;
  if (path.length < 2) return;

  // Edge glow
  ctx.strokeStyle = COLOR_PATH_EDGE;
  ctx.lineWidth = PATH_WIDTH + 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();

  // Main path
  ctx.strokeStyle = COLOR_PATH_FILL;
  ctx.lineWidth = PATH_WIDTH;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();

  // Dotted direction arrows on path
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const offset = (frame * 0.5) % 20;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len;
    const ny = dy / len;
    for (let t = offset; t < len; t += 20) {
      const px = a.x + nx * t;
      const py = a.y + ny * t;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Spawn point
  const start = path[0];
  ctx.fillStyle = 'rgba(239,68,68,0.6)';
  ctx.beginPath();
  ctx.arc(start.x, start.y, 8 + Math.sin(frame * 0.08) * 2, 0, Math.PI * 2);
  ctx.fill();

  // Citadel endpoint
  const end = path[path.length - 1];
  const pulse = Math.sin(frame * 0.06) * 0.2 + 0.8;
  ctx.fillStyle = COLOR_CITADEL_GLOW;
  ctx.beginPath();
  ctx.arc(end.x, end.y, 24 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOR_CITADEL;
  ctx.beginPath();
  ctx.arc(end.x, end.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#060a14';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', end.x, end.y + 1);
}

// ─── Towers ──────────────────────────────────────────────────────────────────

function renderTower(ctx: CanvasRenderingContext2D, t: Tower) {
  const s = TOWER_STATS[t.type];

  // Base platform
  ctx.fillStyle = '#0f1f3d';
  ctx.beginPath();
  ctx.arc(t.x, t.y, TOWER_SIZE, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(96,165,250,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Turret
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.angle);

  ctx.fillStyle = s.color;
  if (t.type === 'sniper') {
    ctx.fillRect(-2, -3, 22, 6);
  } else if (t.type === 'rapid') {
    ctx.fillRect(0, -5, 14, 3);
    ctx.fillRect(0, 2, 14, 3);
  } else if (t.type === 'slow') {
    ctx.fillRect(0, -4, 16, 8);
    // Frost accent
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(12, -2, 6, 4);
  } else {
    ctx.fillRect(0, -4, 16, 8);
  }

  ctx.restore();

  // Center dot
  ctx.fillStyle = '#93c5fd';
  ctx.beginPath();
  ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Invaders ────────────────────────────────────────────────────────────────

function renderInvader(ctx: CanvasRenderingContext2D, inv: Invader, frame: number) {
  const s = INVADER_STATS[inv.type];

  // Frozen effect
  if (inv.frozen > 0) {
    ctx.fillStyle = 'rgba(59,130,246,0.25)';
    ctx.beginPath();
    ctx.arc(inv.x, inv.y, s.size + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body
  ctx.fillStyle = s.color;
  if (inv.type === 'boss') {
    const wobble = Math.sin(frame * 0.1) * 1;
    ctx.fillRect(inv.x - s.size + wobble, inv.y - s.size, s.size * 2, s.size * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(inv.x - s.size + wobble, inv.y - s.size, s.size * 2, s.size * 2);
  } else if (inv.type === 'tank') {
    ctx.fillRect(inv.x - s.size, inv.y - s.size * 0.7, s.size * 2, s.size * 1.4);
  } else {
    ctx.beginPath();
    ctx.arc(inv.x, inv.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP bar
  if (inv.hp < inv.maxHp) {
    const barW = Math.max(16, s.size * 2);
    const hpPct = inv.hp / inv.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(inv.x - barW / 2, inv.y - s.size - 9, barW, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(inv.x - barW / 2 + 0.5, inv.y - s.size - 8.5, (barW - 1) * hpPct, 3);
  }
}

// ─── Bullets ─────────────────────────────────────────────────────────────────

function renderBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 6;

  if (b.type === 'laser') {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.fillRect(-8, -1, 16, 2);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.type === 'slow' ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ─── Particles ───────────────────────────────────────────────────────────────

function renderParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ─── Ghost Tower ─────────────────────────────────────────────────────────────

function renderGhost(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.buildingTowerType) return;
  const x = state.cursorX;
  const y = state.cursorY;
  if (x < 0 || y < 0) return;

  const valid = canPlaceTower(x, y, state) && state.money >= TOWER_COSTS[state.buildingTowerType];
  const s = TOWER_STATS[state.buildingTowerType];

  // Range circle
  ctx.beginPath();
  ctx.arc(x, y, s.range, 0, Math.PI * 2);
  ctx.fillStyle = valid ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.1)';
  ctx.fill();
  ctx.strokeStyle = valid ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ghost tower
  ctx.globalAlpha = 0.5;
  renderTower(ctx, {
    id: '_ghost', type: state.buildingTowerType, x, y,
    range: s.range, damage: s.damage, fireRate: s.fireRate,
    cooldown: 0, level: 1, angle: 0,
  });
  ctx.globalAlpha = 1;

  // Invalid X
  if (!valid) {
    ctx.strokeStyle = 'rgba(239,68,68,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8);
    ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8);
    ctx.stroke();
  }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function renderHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  // Wave countdown between waves
  if (!state.waveActive && state.wave > 0 && !state.gameOver) {
    const secs = Math.ceil(state.waveCountdown / 60);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(GAME_WIDTH / 2 - 60, GAME_HEIGHT / 2 - 16, 120, 32);
    ctx.fillStyle = '#60a5fa';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`WAVE ${state.wave + 1} IN ${secs}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
  }

  // First wave prompt
  if (state.wave === 0 && !state.waveActive && !state.gameOver) {
    const secs = Math.ceil(state.waveCountdown / 60);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2 - 24, 160, 48);
    ctx.fillStyle = '#60a5fa';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUILD TOWERS!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`WAVE 1 IN ${secs}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
  }

  // Score (top right)
  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE ${state.score}`, GAME_WIDTH - 10, 10);
}

// ─── Game Over ──────────────────────────────────────────────────────────────

function renderGameOver(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#ef4444';
  ctx.font = '24px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CITADEL FALLEN', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillText(`SCORE: ${state.score}  WAVES: ${state.wave}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
}

// ─── Main Render ────────────────────────────────────────────────────────────

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, frame: number): void {
  renderBg(ctx);
  renderPath(ctx, state, frame);

  for (const t of state.towers) renderTower(ctx, t);
  for (const inv of state.invaders) renderInvader(ctx, inv, frame);
  for (const b of state.bullets) renderBullet(ctx, b);
  for (const p of state.particles) renderParticle(ctx, p);

  renderGhost(ctx, state);
  renderHUD(ctx, state);

  if (state.gameOver) renderGameOver(ctx, state);
}
