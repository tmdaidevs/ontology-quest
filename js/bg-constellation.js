// bg-constellation.js — ambient "knowledge graph" particle-network animation used
// behind the landing screen hero. Pure canvas, zero dependencies. Exposes start()/
// stop() so main.js can pause the loop whenever the landing screen isn't visible
// (saves CPU/battery) and respects prefers-reduced-motion by only ever painting a
// single static frame for users who asked for less motion.

let canvas = null;
let ctx = null;
let raf = null;
let nodes = [];
let running = false;

const NODE_COUNT_DESKTOP = 46;
const NODE_COUNT_MOBILE = 22;
const LINK_DIST = 150;

function reducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function seedNodes(w, h) {
  const count = w < 640 ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    r: Math.random() * 1.6 + 1
  }));
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < LINK_DIST) {
        ctx.strokeStyle = `rgba(46, 230, 200, ${0.16 * (1 - dist / LINK_DIST)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = 'rgba(46, 230, 200, 0.55)';
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function step() {
  if (!running) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  nodes.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;
  });
  draw();
  raf = requestAnimationFrame(step);
}

function resize() {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedNodes(rect.width, rect.height);
  draw();
}

/** Call once at boot with the target <canvas>. Paints an initial static frame. */
export function init(canvasEl) {
  canvas = canvasEl;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

export function start() {
  if (running || !canvas || reducedMotion()) return;
  running = true;
  raf = requestAnimationFrame(step);
}

export function stop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
}
