// ui-utils.js — small shared UI helpers (animated counters, etc.) reused across levels.

/** Animate a number counting up inside `el`, from `from` (default 0) to `to`. */
export function animateCount(el, to, opts = {}) {
  if (!el) return;
  const duration = opts.duration || 800;
  const from = opts.from ?? 0;
  const suffix = opts.suffix || '';
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.round(from + (to - from) * eased);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** Animate every element matching `.count-target` inside `container`, using its data-target attribute. */
export function animateCountTargets(container, opts = {}) {
  container.querySelectorAll('.count-target').forEach(el => {
    const to = Number(el.dataset.target || 0);
    animateCount(el, to, opts);
  });
}
