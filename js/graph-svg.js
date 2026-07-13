// graph-svg.js — tiny reusable helper for rendering node-link graphs as SVG.
// No external dependencies (D3-free) so the game stays fully self-contained.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.appendChild(c);
  return node;
}

/**
 * Render a graph of { nodes: [{id,label,x,y}], edges: [{from,to,label}] } into an SVG.
 * Returns handles for highlighting: { svg, nodeEls, edgeEls }
 *
 * Per-node label placement can be overridden (used by radialLayout() below) via:
 *   labelAnchor: 'start' | 'middle' | 'end' — SVG text-anchor for the label
 *   labelDx / labelDy: offset (in SVG units) from the node's center for the label
 *   fullLabel: full untruncated text shown as a native tooltip when `label` was shortened
 * Nodes that omit these simply get the original "centered label below the circle" default.
 */
export function renderGraph(container, graph, opts = {}) {
  const width = opts.width || 640;
  const height = opts.height || 360;
  const svg = el('svg', {
    class: 'graph-svg',
    viewBox: `0 0 ${width} ${height}`,
    xmlns: SVG_NS
  });

  const edgeEls = {};
  const nodeEls = {};

  // Draw edges first so nodes sit on top.
  graph.edges.forEach((edge, i) => {
    const a = graph.nodes.find(n => n.id === edge.from);
    const b = graph.nodes.find(n => n.id === edge.to);
    if (!a || !b) return;
    const g = el('g', { class: 'g-edge', 'data-edge-index': i });
    const line = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    // labelT (0-1, default middle) and labelDy let callers with many fan-out
    // edges (e.g. hubSpokeLayout/radialLayout) bias/stagger labels so they don't collide.
    const t = edge.labelT ?? 0.5;
    const midX = a.x + (b.x - a.x) * t;
    const midY = a.y + (b.y - a.y) * t + (edge.labelDy || 0);
    const label = el('text', { x: midX, y: midY - 6, 'text-anchor': 'middle' });
    label.textContent = edge.label || '';
    g.appendChild(line);
    if (edge.fullLabel && edge.fullLabel !== edge.label) {
      const title = el('title', {});
      title.textContent = edge.fullLabel;
      g.appendChild(title);
    }
    g.appendChild(label);
    svg.appendChild(g);
    edgeEls[i] = g;
  });

  graph.nodes.forEach(node => {
    const g = el('g', { class: node.hub ? 'g-node hub' : 'g-node', 'data-node-id': node.id, transform: `translate(${node.x},${node.y})` });
    const circle = el('circle', { r: node.r || 24 });
    const anchor = node.labelAnchor || 'middle';
    const defaultDy = anchor === 'middle' ? (node.r || 24) + 16 : 0;
    const dx = node.labelDx ?? (anchor === 'start' ? (node.r || 24) + 10 : anchor === 'end' ? -((node.r || 24) + 10) : 0);
    const dy = node.labelDy ?? defaultDy;
    const text = el('text', { 'text-anchor': anchor, dy: dy + 4, x: dx });
    text.textContent = node.label;
    g.appendChild(circle);
    if (node.fullLabel && node.fullLabel !== node.label) {
      const title = el('title', {});
      title.textContent = node.fullLabel;
      g.appendChild(title);
    }
    g.appendChild(text);
    svg.appendChild(g);
    nodeEls[node.id] = g;
  });

  container.innerHTML = '';
  container.appendChild(svg);
  return { svg, nodeEls, edgeEls };
}

export function setHighlight(handles, { nodes = [], edges = [], dimOthers = true } = {}) {
  Object.entries(handles.nodeEls).forEach(([id, g]) => {
    g.classList.toggle('highlight', nodes.includes(id));
    g.classList.toggle('dim', dimOthers && !nodes.includes(id));
  });
  Object.entries(handles.edgeEls).forEach(([idx, g]) => {
    const on = edges.includes(Number(idx));
    g.classList.toggle('highlight', on);
    g.classList.toggle('dim', dimOthers && !on);
  });
}

export function clearHighlight(handles) {
  Object.values(handles.nodeEls).forEach(g => g.classList.remove('highlight', 'dim'));
  Object.values(handles.edgeEls).forEach(g => g.classList.remove('highlight', 'dim'));
}

/**
 * Computes a simple hub-and-spoke layout — one hub node at the top, with N spoke
 * nodes spread evenly across a row beneath it — and returns a { nodes, edges }
 * graph ready for renderGraph(). Used for small "ontology snapshot" diagrams
 * where hand-placing pixel coordinates for every node isn't worth it (e.g.
 * Level 8's case-study cards). A single spread-out row (rather than a tight
 * circle) keeps node/edge labels from colliding near the hub.
 */
export function hubSpokeLayout(hub, spokes, opts = {}) {
  const width = opts.width || 500;
  const height = opts.height || 200;
  const hubY = opts.hubY ?? 32;
  const spokeY = opts.spokeY ?? 152;
  const marginX = opts.marginX ?? 55;
  const n = spokes.length;
  const usableWidth = Math.max(0, width - marginX * 2);
  const nodes = [{ id: hub.id, label: hub.label, x: width / 2, y: hubY, r: 21, hub: true }];
  const edges = [];
  spokes.forEach((s, i) => {
    const x = n > 1 ? marginX + (usableWidth * i) / (n - 1) : width / 2;
    nodes.push({ id: s.id, label: s.label, x, y: spokeY, r: 17 });
    // Bias the relationship label toward the spoke end (rather than the true
    // midpoint) and stagger it up/down per-edge. Since every edge fans out from
    // the same hub point, plain midpoints bunch together right under the hub —
    // biasing + staggering spreads labels out as much as the spokes themselves.
    edges.push({ from: hub.id, to: s.id, label: s.rel, labelT: 0.6, labelDy: i % 2 === 0 ? -6 : 8 });
  });
  return { nodes, edges };
}

/** Shortens a label to `max` characters (word-safe-ish) with an ellipsis, for use as the
 * rendered node label when the full text should still be reachable via a hover tooltip. */
function truncateLabel(label, max) {
  if (!label || label.length <= max) return label;
  return label.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Computes a radial hub-and-spoke layout: one center node with N spoke nodes evenly
 * spaced around it in a full circle. Unlike a naive fixed-radius circle, this:
 *   - scales the radius (and overall canvas) with the spoke count, so labels have
 *     room to breathe even with 8-10 spokes;
 *   - points each spoke's label radially OUTWARD (away from the hub) instead of
 *     always centering it below the node, so labels fan out instead of colliding
 *     with the hub's own label or with each other;
 *   - truncates long labels and attaches the full text as a native tooltip.
 * Built for Level 6's live Wikidata explorer, where spoke count and label length are
 * unpredictable (real entity names/relations), but generic enough for any hub graph.
 */
export function radialLayout(hub, spokes, opts = {}) {
  const n = Math.max(spokes.length, 1);
  const hubR = hub.r ?? 30;
  const spokeR = opts.spokeR ?? 20;
  const maxLabelChars = opts.maxLabelChars ?? 20;
  const maxEdgeLabelChars = opts.maxEdgeLabelChars ?? 24;
  // More spokes need a bigger circle so their labels don't run into each other.
  const radius = Math.max(opts.minRadius ?? 128, hubR + spokeR + 26, 30 * n);
  // The pad must fit the longest possible truncated label at its full reach — a spoke
  // sitting almost exactly on the horizontal (cos≈1) gets almost none of its label's
  // room "for free" from the circle's curvature, so the pad alone has to cover it.
  const CHAR_W = 7.4; // ~ single monospace-bold character width at the 12px label font size
  const labelReach = spokeR + 10 + maxLabelChars * CHAR_W;
  const pad = Math.max(opts.pad ?? 0, labelReach + 16);
  const size = Math.round(radius * 2 + pad * 2);
  const cx = size / 2, cy = size / 2;

  const nodes = [{
    id: hub.id,
    label: truncateLabel(hub.label, maxLabelChars + 6),
    fullLabel: hub.label,
    x: cx, y: cy, r: hubR, hub: true
  }];
  const edges = [];

  spokes.forEach((s, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = cx + radius * cos;
    const y = cy + radius * sin;

    // Radial label placement: right half of the circle -> label grows rightward,
    // left half -> grows leftward, near-vertical top/bottom -> centered above/below.
    let labelAnchor = 'middle';
    let labelDx;
    let labelDy;
    if (cos > 0.3) {
      labelAnchor = 'start';
    } else if (cos < -0.3) {
      labelAnchor = 'end';
    } else {
      labelDy = sin < 0 ? -(spokeR + 14) : spokeR + 16;
      labelDx = 0;
    }

    nodes.push({
      id: s.id,
      label: truncateLabel(s.label, maxLabelChars),
      fullLabel: s.label,
      x, y, r: spokeR,
      labelAnchor, labelDx, labelDy
    });
    // Bias the relationship label away from the crowded hub center, toward the spoke.
    // Truncated (with the full text in a tooltip) since — unlike node labels, which grow
    // outward in one direction — this text is centered on its point and would otherwise
    // spread both ways far enough to intrude on a neighboring spoke's label.
    edges.push({
      from: hub.id, to: s.id,
      label: truncateLabel(s.rel, maxEdgeLabelChars),
      fullLabel: s.rel,
      labelT: 0.68
    });
  });

  return { nodes, edges, size };
}
