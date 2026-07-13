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
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const label = el('text', { x: midX, y: midY - 6, 'text-anchor': 'middle' });
    label.textContent = edge.label || '';
    g.appendChild(line);
    g.appendChild(label);
    svg.appendChild(g);
    edgeEls[i] = g;
  });

  graph.nodes.forEach(node => {
    const g = el('g', { class: 'g-node', 'data-node-id': node.id, transform: `translate(${node.x},${node.y})` });
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
