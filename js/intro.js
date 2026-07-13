// js/intro.js
// Animated "What is an Ontology?" primer — a short, click-through walkthrough
// that visually builds up a knowledge graph step by step:
//   bare entities -> named classes -> is-a hierarchy -> instance triples -> full graph.
// Uses the same Cat/Dog/Animal/Mammal example universe as the Concepts level (Level 2)
// so the vocabulary stays consistent across the whole game.

const SVG_NS = 'http://www.w3.org/2000/svg';

// Shared example universe of nodes, positioned on a fixed 640x400 canvas.
const POINTS = {
  animal:   { x: 460, y: 54,  label: 'Animal',   kind: 'class' },
  mammal:   { x: 460, y: 150, label: 'Mammal',   kind: 'class' },
  cat:      { x: 350, y: 246, label: 'Cat',      kind: 'class' },
  dog:      { x: 570, y: 246, label: 'Dog',      kind: 'class' },
  person:   { x: 150, y: 130, label: 'Person',   kind: 'class' },
  company:  { x: 150, y: 246, label: 'Company',  kind: 'class' },
  alice:    { x: 60,  y: 40,  label: 'Alice',    kind: 'instance' },
  acme:     { x: 60,  y: 336, label: 'Acme Inc.', kind: 'instance' },
  whiskers: { x: 330, y: 336, label: 'Whiskers', kind: 'instance' },
};

// isA hierarchy edges (structural / taxonomy relationships).
// The optional 4th element biases the edge label along the line (t: 0-1,
// default 0.5 = midpoint). "mammal -> animal" is a near-vertical edge that
// runs straight into the underside of the Animal node, so a plain midpoint
// label sits right on top of Animal's own node label — biasing it back
// toward the child end (mammal) keeps it clear.
const HIER_EDGES = [
  ['cat', 'mammal', 'isA'],
  ['dog', 'mammal', 'isA'],
  ['mammal', 'animal', 'isA', { t: 0.32 }],
];

// Instance-level relationship + typing triples.
// "whiskers -> cat" has the same near-vertical collision as mammal->animal
// above, so it gets the same label-bias treatment.
const TRIPLE_EDGES = [
  ['alice', 'person', 'isA'],
  ['acme', 'company', 'isA'],
  ['whiskers', 'cat', 'isA', { t: 0.3 }],
  ['alice', 'acme', 'worksAt'],
  ['alice', 'whiskers', 'owns'],
];

const ALL_NODES = Object.keys(POINTS);

const STEPS = [
  {
    title: 'The world is full of things',
    caption: 'Start with raw entities — a cat, a dog, a person, a company. On their own, these are just isolated bits of data. A computer has no idea they relate to each other at all.',
    nodes: ALL_NODES,
    labeled: false,
    edges: [],
  },
  {
    title: 'Step 1 — Name things & classify them',
    caption: 'An ontology begins by naming entities and grouping them into classes: "Cat", "Dog", "Person", "Company" become recognized categories — a shared vocabulary — instead of anonymous data points.',
    nodes: ALL_NODES,
    labeled: true,
    edges: [],
  },
  {
    title: 'Step 2 — Build a hierarchy (is-a)',
    caption: 'Classes relate to each other hierarchically. A Cat IS-A Mammal, a Dog IS-A Mammal, and a Mammal IS-A Animal. This taxonomy lets us reason by inheritance: whatever is true of Animal is automatically true of Cat.',
    nodes: ALL_NODES,
    labeled: true,
    edges: HIER_EDGES,
  },
  {
    title: 'Step 3 — Connect instances (triples)',
    caption: 'Real individuals connect through typed relationships, stored as subject–predicate–object triples: (Alice, worksAt, Acme Inc.) and (Alice, owns, Whiskers). The triple is the atomic unit of every knowledge graph.',
    nodes: ALL_NODES,
    labeled: true,
    edges: [...HIER_EDGES, ...TRIPLE_EDGES],
  },
  {
    title: 'Together: a knowledge graph',
    caption: 'Classes + hierarchy + instance relationships = a knowledge graph: a formal, machine-readable model of a domain that lets software search, reason, and infer new facts. That is exactly what you will build and master across the next 5 levels.',
    nodes: ALL_NODES,
    labeled: true,
    edges: [...HIER_EDGES, ...TRIPLE_EDGES],
    finale: true,
  },
];

let stepIndex = 0;
let els = null;

function cacheEls() {
  if (els) return els;
  els = {
    overlay: document.getElementById('intro-overlay'),
    title: document.getElementById('intro-title'),
    caption: document.getElementById('intro-caption'),
    visual: document.getElementById('intro-visual'),
    dots: document.getElementById('intro-dots'),
    prev: document.getElementById('intro-prev'),
    next: document.getElementById('intro-next'),
    skip: document.getElementById('intro-skip'),
  };
  return els;
}

function renderDots(e) {
  e.dots.innerHTML = '';
  STEPS.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'intro-dot' + (i === stepIndex ? ' active' : '');
    e.dots.appendChild(dot);
  });
}

function renderVisual(e, step) {
  e.visual.innerHTML = '';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 640 400');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Edges render first so node circles sit visually on top.
  step.edges.forEach(([fromId, toId, label, labelOpts], i) => {
    const a = POINTS[fromId];
    const b = POINTS[toId];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'intro-fade-in');
    g.style.animationDelay = `${0.12 + i * 0.09}s`;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.setAttribute('stroke', label === 'isA' ? '#5b95ff' : '#ffb454');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('class', 'intro-draw');
    // Size the "draw-in" dash to this exact edge's length so the line
    // always finishes flush against its target node, however long it is —
    // a fixed dash size clips longer edges before they reach their target.
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
    g.appendChild(line);
    if (label) {
      // Labels default to the edge midpoint (t=0.5); a few near-vertical
      // edges override t via labelOpts to dodge the target node's own label.
      const t = (labelOpts && labelOpts.t) ?? 0.5;
      const mx = a.x + dx * t;
      const my = a.y + dy * t;
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', mx);
      text.setAttribute('y', my - 6);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'intro-edge-label');
      text.textContent = label;
      g.appendChild(text);
    }
    svg.appendChild(g);
  });

  // Nodes.
  step.nodes.forEach((id, i) => {
    const p = POINTS[id];
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'intro-fade-in');
    g.style.animationDelay = `${i * 0.05}s`;
    g.setAttribute('transform', `translate(${p.x},${p.y})`);
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', p.kind === 'class' ? 22 : 15);
    circle.setAttribute('fill', p.kind === 'class' ? '#132a28' : '#101f2c');
    circle.setAttribute('stroke', p.kind === 'class' ? '#2ee6c8' : '#5b95ff');
    circle.setAttribute('stroke-width', step.finale ? '2.5' : '1.5');
    g.appendChild(circle);
    if (step.labeled) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('y', p.kind === 'class' ? 38 : 30);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'intro-node-label');
      text.textContent = p.label;
      g.appendChild(text);
    }
    svg.appendChild(g);
  });

  e.visual.appendChild(svg);
}

function render() {
  const e = cacheEls();
  const step = STEPS[stepIndex];
  e.title.textContent = step.title;
  e.caption.textContent = step.caption;
  renderVisual(e, step);
  renderDots(e);
  e.prev.disabled = stepIndex === 0;
  e.next.textContent = stepIndex === STEPS.length - 1 ? 'Start Learning →' : 'Next →';
}

function closeIntro() {
  const e = cacheEls();
  e.overlay.hidden = true;
}

/** Opens the intro overlay and resets it to the first step. */
export function openIntro() {
  const e = cacheEls();
  stepIndex = 0;
  e.overlay.hidden = false;
  render();
}

/**
 * Wires up the intro overlay's controls. Call once at app startup.
 * @param {{ onFinish?: () => void }} opts - onFinish fires only when the user
 *   clicks through to the final "Start Learning" button (not on Skip/Escape),
 *   so callers can route them straight into the level map.
 */
export function initIntro(opts = {}) {
  const { onFinish } = opts;
  const e = cacheEls();

  e.next.addEventListener('click', () => {
    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      render();
    } else {
      closeIntro();
      if (onFinish) onFinish();
    }
  });
  e.prev.addEventListener('click', () => {
    if (stepIndex > 0) {
      stepIndex--;
      render();
    }
  });
  e.skip.addEventListener('click', closeIntro);
  e.overlay.addEventListener('click', (ev) => {
    if (ev.target === e.overlay) closeIntro();
  });
  document.addEventListener('keydown', (ev) => {
    if (e.overlay.hidden) return;
    if (ev.key === 'Escape') closeIntro();
    if (ev.key === 'ArrowRight') e.next.click();
    if (ev.key === 'ArrowLeft') e.prev.click();
  });
}
