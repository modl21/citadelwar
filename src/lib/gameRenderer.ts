import type { GameState, Tower, Invader, Bullet, Particle } from './gameTypes';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE,
  COLOR_BG,
  COLOR_PATH,
  COLOR_GRID,
  COLOR_CITADEL,
  COLOR_RANGE,
  COLOR_RANGE_INVALID,
  TOWER_STATS,
  INVADER_STATS
} from './gameConstants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1;

  for (let x = 0; x <= GAME_WIDTH; x += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y <= GAME_HEIGHT; y += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }
}

function drawPath(ctx: CanvasRenderingContext2D, path: { x: number; y: number }[]) {
  if (path.length < 2) return;

  ctx.strokeStyle = COLOR_PATH;
  ctx.lineWidth = TILE_SIZE * 0.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Draw start indicator
  const start = path[0];
  ctx.fillStyle = '#ef4444'; 
  ctx.beginPath();
  ctx.arc(start.x, start.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Draw Citadel (end) indicator handled separately usually, but let's add marker
  const end = path[path.length - 1];
  ctx.fillStyle = COLOR_CITADEL;
  ctx.beginPath();
  ctx.arc(end.x, end.y, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawTower(ctx: CanvasRenderingContext2D, tower: Tower) {
  const stats = TOWER_STATS[tower.type];

  // Draw base
  ctx.fillStyle = '#334155'; // Slate-700
  ctx.fillRect(tower.x - 12, tower.y - 12, 24, 24);

  // Draw turret (rotated)
  ctx.save();
  ctx.translate(tower.x, tower.y);
  ctx.rotate(tower.angle);

  ctx.fillStyle = stats.color;
  // Simple turret shape
  if (tower.type === 'sniper') {
      ctx.fillRect(-4, -4, 24, 8); // Long barrel
  } else if (tower.type === 'rapid') {
      ctx.fillRect(-2, -6, 16, 4);
      ctx.fillRect(-2, 2, 16, 4); // Twin barrel
  } else {
      ctx.fillRect(0, -5, 16, 10);
  }

  // Center cap
  ctx.fillStyle = '#cbd5e1'; // Slate-300
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawInvader(ctx: CanvasRenderingContext2D, invader: Invader) {
  const stats = INVADER_STATS[invader.type];

  ctx.save();
  ctx.translate(invader.x, invader.y);

  ctx.fillStyle = stats.color;

  // Shape based on type
  if (invader.type === 'boss') {
      ctx.fillRect(-stats.size, -stats.size, stats.size*2, stats.size*2);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(-stats.size, -stats.size, stats.size*2, stats.size*2);
  } else if (invader.type === 'tank') {
      ctx.fillRect(-stats.size, -stats.size*0.8, stats.size*2, stats.size*1.6);
  } else {
      // Circle for basic units
      ctx.beginPath();
      ctx.arc(0, 0, stats.size, 0, Math.PI * 2);
      ctx.fill();
  }

  // Health bar
  const hpPct = invader.hp / invader.maxHp;
  ctx.fillStyle = '#000';
  ctx.fillRect(-8, -stats.size - 8, 16, 4);
  ctx.fillStyle = '#22c55e'; // Green
  ctx.fillRect(-7, -stats.size - 7, 14 * hpPct, 2);

  // Status effect overlay
  if (invader.frozen > 0) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // Blue tint
      ctx.beginPath();
      ctx.arc(0, 0, stats.size + 2, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  ctx.fillStyle = bullet.color;

  if (bullet.type === 'laser') {
      // Long beam logic would be here, but using projectile for now
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      // Align to velocity?
      ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
      ctx.fillRect(-6, -1, 12, 2);
      ctx.restore();
  } else if (bullet.type === 'missile') {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();
  } else {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  ctx.fillStyle = p.color;

  if (p.type === 'text' && p.text) {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(p.text, p.x, p.y);
  } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.globalAlpha = 1.0;
}

// ─── Main Render ──────────────────────────────────────────────────────────────

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  // Clear
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Static elements
  drawGrid(ctx);
  drawPath(ctx, state.path);

  // Dynamic Game Objects
  state.towers.forEach(t => drawTower(ctx, t));
  state.invaders.forEach(i => drawInvader(ctx, i));
  state.bullets.forEach(b => drawBullet(ctx, b));
  state.particles.forEach(p => drawParticle(ctx, p));

  // Interactions / UI Overlays

  // Ghost Tower (Placement)
  if (state.buildingTowerType) {
    const { cursorX, cursorY, buildingTowerType, money } = state;
    const stats = TOWER_STATS[buildingTowerType];
    
    // Draw Range Circle
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, stats.range, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_RANGE;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();

    // Draw ghost tower
    ctx.globalAlpha = 0.5;
    // @ts-ignore - mock tower for render
    const mockTower: Tower = { 
      id: 'ghost', type: buildingTowerType, x: cursorX, y: cursorY, 
      range: 0, damage: 0, fireRate: 0, cooldown: 0, level: 0, active: false, angle: 0 
    };
    drawTower(ctx, mockTower);
    ctx.globalAlpha = 1;
  }

  // Selected Tower Range
  if (state.selectedTowerId) {
    const t = state.towers.find(t => t.id === state.selectedTowerId);
    if (t) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // HUD
  // Citadel Health
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(10, 10, 200, 30);
  ctx.fillStyle = '#ef4444';
  const hpPct = Math.max(0, state.citadelHp / state.citadelMaxHp);
  ctx.fillRect(15, 15, 190 * hpPct, 20);
  
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText(`C-HP: ${Math.ceil(state.citadelHp)}`, 20, 30);

  // Money & Wave
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`SATS: ${state.money}`, 10, 60);
  ctx.fillStyle = '#fff';
  ctx.fillText(`WAVE: ${state.wave}`, 10, 80);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#ef4444';
    ctx.font = '30px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText("CITADEL FALLEN", GAME_WIDTH/2, GAME_HEIGHT/2);
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Final Score: ${state.score}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 40);
    ctx.textAlign = 'left';
  }
}
