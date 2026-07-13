// confetti.js — lightweight canvas confetti burst with zero dependencies.
// Fully self-cleaning: it owns a single full-viewport canvas that removes itself
// (and cancels its own animation frame) once the burst finishes, so replaying a
// level repeatedly never leaks canvases or animation loops.

const COLORS = ['#2ee6c8', '#5b95ff', '#ffb454', '#ff6b81', '#c792ea'];
const GOLD_COLORS = ['#ffd76a', '#ffb454', '#fff3c4', '#2ee6c8'];

export function burstConfetti({ count = 140, gold = false } = {}) {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const palette = gold ? GOLD_COLORS : COLORS;

  const particles = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 260,
    y: canvas.height * 0.28 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -9 - 4,
    size: Math.random() * 6 + 4,
    color: palette[Math.floor(Math.random() * palette.length)],
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    shape: Math.random() < 0.5 ? 'rect' : 'circle'
  }));

  const gravity = 0.28;
  const drag = 0.995;
  const lifespanMs = 2400;
  const startedAt = performance.now();
  let raf = null;

  function frame(now) {
    const elapsed = now - startedAt;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fade = Math.max(0, 1 - elapsed / lifespanMs);
    particles.forEach(p => {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (elapsed < lifespanMs) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  }
  raf = requestAnimationFrame(frame);
}
