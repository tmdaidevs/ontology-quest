// share-card.js — renders a shareable "score card" PNG summarizing a player's
// progress (score, level completion, badges) on an off-screen canvas, entirely
// client-side. No server round-trip — the PNG is produced with canvas.toBlob()
// and offered as a same-page download.
import * as progress from './progress.js';

const W = 1200;
const H = 630; // social-share-friendly aspect ratio

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCorner(ctx, x, y, dx, dy, len = 26) {
  ctx.strokeStyle = '#2ee6c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + dy * len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * len, y);
  ctx.stroke();
}

const CORE_LEVELS = [
  { n: 1, label: 'History' },
  { n: 2, label: 'Concepts' },
  { n: 3, label: 'Tools' },
  { n: 4, label: 'Reasoning' },
  { n: 5, label: 'Build' }
];

function generate() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);

  // Faint technical grid backdrop.
  ctx.strokeStyle = 'rgba(46,230,200,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 36) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }

  // Soft glow behind the score.
  const grad = ctx.createRadialGradient(W - 260, 190, 20, W - 260, 190, 340);
  grad.addColorStop(0, 'rgba(46,230,200,0.16)');
  grad.addColorStop(1, 'rgba(46,230,200,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Frame + HUD corner brackets.
  ctx.strokeStyle = '#2ee6c8';
  ctx.lineWidth = 2;
  roundRect(ctx, 20, 20, W - 40, H - 40, 14);
  ctx.stroke();
  drawCorner(ctx, 36, 36, 1, 1);
  drawCorner(ctx, W - 36, 36, -1, 1);
  drawCorner(ctx, 36, H - 36, 1, -1);
  drawCorner(ctx, W - 36, H - 36, -1, -1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#2ee6c8';
  ctx.font = '600 20px "IBM Plex Mono", monospace';
  ctx.fillText('// ONTOLOGY QUEST — PROGRESS REPORT', 64, 92);

  ctx.fillStyle = '#e9f1f3';
  ctx.font = '700 40px "IBM Plex Sans", sans-serif';
  ctx.fillText('Knowledge Graph Explorer', 64, 140);

  // Score, right-aligned.
  const totalScore = progress.totalScore();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#2ee6c8';
  ctx.font = '700 128px "IBM Plex Mono", monospace';
  ctx.fillText(String(totalScore), W - 64, 210);
  ctx.fillStyle = '#5b6c74';
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.fillText('/ 500 TOTAL SCORE', W - 66, 240);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(61,80,88,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(64, 280); ctx.lineTo(W - 64, 280); ctx.stroke();

  // Level completion pills.
  const pillY = 316, gap = 16;
  const pillW = (W - 128 - gap * 4) / 5;
  const pillH = 92;
  CORE_LEVELS.forEach((lv, i) => {
    const x = 64 + i * (pillW + gap);
    const done = progress.isCompleted(lv.n);
    const score = progress.getScore(lv.n);
    ctx.fillStyle = done ? 'rgba(46,230,200,0.08)' : 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = done ? '#2ee6c8' : '#253039';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#5b6c74';
    ctx.font = '600 13px "IBM Plex Mono", monospace';
    ctx.fillText(`LV ${lv.n}`, x + 14, pillY + 26);
    ctx.fillStyle = '#e9f1f3';
    ctx.font = '600 16px "IBM Plex Sans", sans-serif';
    ctx.fillText(lv.label, x + 14, pillY + 50);
    ctx.fillStyle = done ? '#35d488' : '#3d5058';
    ctx.font = '700 22px "IBM Plex Mono", monospace';
    ctx.fillText(done ? `${score}%` : '—', x + 14, pillY + 78);
  });

  // Badge chips row.
  const badges = progress.getBadges();
  ctx.fillStyle = '#93a7b0';
  ctx.font = '600 16px "IBM Plex Mono", monospace';
  ctx.fillText(`BADGES EARNED (${badges.length})`, 64, 452);

  const rowY = 470, rowH = 42;
  ctx.font = '20px "IBM Plex Sans", sans-serif';
  if (badges.length === 0) {
    ctx.fillStyle = '#5b6c74';
    ctx.fillText('No badges yet — keep playing!', 64, rowY + 27);
  } else {
    let bx = 64;
    let by = rowY;
    badges.slice(0, 10).forEach(b => {
      const label = `${b.icon} ${b.name}`;
      const w = ctx.measureText(label).width + 30;
      if (bx + w > W - 64) { bx = 64; by += rowH + 10; }
      ctx.fillStyle = 'rgba(46,230,200,0.08)';
      ctx.strokeStyle = '#2ee6c8';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, w, rowH, 21);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e9f1f3';
      ctx.fillText(label, bx + 15, by + 27);
      bx += w + 12;
    });
  }

  // Footer.
  ctx.fillStyle = '#5b6c74';
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ontology-quest \u2014 tmdaidevs.github.io/ontology-quest', 64, H - 50);
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 64, H - 50);
  ctx.textAlign = 'left';

  return canvas;
}

/** Renders and downloads the score card as a PNG file. */
export async function downloadShareCard() {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* best effort */ }
  }
  const canvas = generate();
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ontology-quest-score-card.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
