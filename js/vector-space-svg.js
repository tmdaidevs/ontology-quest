// vector-space-svg.js — tiny SVG scatter-plot renderer for teaching embedding-based
// similarity search: entities as points in a simplified 2D vector space. No external
// chart library — consistent with graph-svg.js, this stays fully self-contained.

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/**
 * Renders `points` ({id,label,x,y,cluster}) into an SVG scatter plot.
 * Returns handles for animation: { svg, pointEls, searchCircle, lineLayer }.
 */
export function renderVectorSpace(container, points, opts = {}) {
  const width = opts.width || 560;
  const height = opts.height || 380;
  const svg = el('svg', { class: 'vector-svg', viewBox: `0 0 ${width} ${height}` });

  const lineLayer = el('g', { class: 'vec-lines' });
  svg.appendChild(lineLayer);

  const searchCircle = el('circle', { class: 'vec-search-circle', cx: 0, cy: 0, r: 0 });
  svg.appendChild(searchCircle);

  const pointEls = {};
  points.forEach(p => {
    const g = el('g', { class: `vec-point vec-${p.cluster}`, transform: `translate(${p.x},${p.y})` });
    const circle = el('circle', { r: p.cluster === 'query' ? 8 : 6 });
    const text = el('text', { 'text-anchor': 'middle', y: -12 });
    text.textContent = p.label;
    g.appendChild(circle);
    g.appendChild(text);
    svg.appendChild(g);
    pointEls[p.id] = g;
  });

  container.innerHTML = '';
  container.appendChild(svg);
  return { svg, pointEls, searchCircle, lineLayer };
}

/** Euclidean distance between two {x,y} points — a stand-in for cosine distance
 * between real high-dimensional embedding vectors. */
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Returns the k points nearest to `queryId` (excluding itself), each annotated with
 * `dist` (raw distance) and `similarity` (a friendly 0-1 score, 1 = identical). */
export function nearestNeighbors(points, queryId, k = 3) {
  const q = points.find(p => p.id === queryId);
  const maxDist = Math.max(...points.map(p => dist(p, q)));
  return points
    .filter(p => p.id !== queryId)
    .map(p => ({ ...p, dist: dist(p, q), similarity: 1 - dist(p, q) / maxDist }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k);
}

/** Animates the search-radius circle growing from 0 to `targetR` over `duration` ms,
 * centered on the query point, via requestAnimationFrame (works consistently across
 * browsers, unlike relying on CSS transitions of the SVG `r` attribute). */
export function animateSearchCircle(handles, center, targetR, duration = 1100) {
  return new Promise(resolve => {
    handles.searchCircle.setAttribute('cx', center.x);
    handles.searchCircle.setAttribute('cy', center.y);
    handles.searchCircle.classList.add('active');
    const start = performance.now();
    function frame(now) {
      // Clamp to [0,1]: the first rAF timestamp can occasionally precede `start`
      // (yielding a tiny negative elapsed time), which would otherwise produce a
      // momentary negative radius and an invalid-attribute console error.
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      handles.searchCircle.setAttribute('r', Math.max(0, eased * targetR).toFixed(1));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}
