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
    // edges (e.g. hubSpokeLayout) bias/stagger labels so they don't collide.
    const t = edge.labelT ?? 0.5;
    const midX = a.x + (b.x - a.x) * t;
    const midY = a.y + (b.y - a.y) * t + (edge.labelDy || 0);
    const label = el('text', { x: midX, y: midY - 6, 'text-anchor': 'middle' });
    label.textContent = edge.label || '';
    g.appendChild(line);
    g.appendChild(label);
    svg.appendChild(g);
    edgeEls[i] = g;
  });

  graph.nodes.forEach(node => {
    const g = el('g', { class: node.hub ? 'g-node hub' : 'g-node', 'data-node-id': node.id, transform: `translate(${node.x},${node.y})` });
    const circle = el('circle', { r: node.r || 24 });
    const text = el('text', { 'text-anchor': 'middle', dy: 4, y: (node.r || 24) + 16 });
    text.textContent = node.label;
    const icon = el('text', { 'text-anchor': 'middle', dy: 6, 'font-size': 18 });
    icon.textContent = node.icon || '●';
    g.appendChild(circle);
    g.appendChild(icon);
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
