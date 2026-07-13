// level5-sandbox.js — Build-your-own ontology sandbox: node-link editor + validation checklist.
import { scenarios } from '../data/scenarios.js';
import { saveSandbox, loadSandbox } from '../progress.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HIERARCHY_LABELS = ['isa', 'subclassof', 'kindof', 'typeof'];

export function mount(container, api) {
  let currentScenario = null;
  let nodes = [];
  let edges = [];
  let mode = 'move'; // 'move' | 'add-class' | 'add-instance' | 'connect'
  let connectFrom = null;
  let dragNode = null;
  let dragOffset = { x: 0, y: 0 };
  let idCounter = 1;
  let validatedOnce = false;

  container.innerHTML = `
    <div class="card">
      <h3>1 · Choose a Scenario</h3>
      <div class="scenario-cards" id="scenario-cards"></div>
    </div>
    <div class="card" id="editor-card" hidden>
      <h3>2 · Design Your Ontology</h3>
      <p>Build classes, instances, and relationships. <strong>Add Class / Add Instance</strong>: click empty canvas to place a node. <strong>Connect</strong>: click a source node, then a target node, then name the relationship. <strong>Move</strong>: drag nodes around.</p>
      <div class="sandbox-toolbar">
        <button class="btn btn-secondary mode-btn" data-mode="move">🖐 Move</button>
        <button class="btn btn-secondary mode-btn" data-mode="add-class">➕ Add Class</button>
        <button class="btn btn-secondary mode-btn" data-mode="add-instance">⚫ Add Instance</button>
        <button class="btn btn-secondary mode-btn" data-mode="connect">🔗 Connect</button>
        <button class="btn btn-ghost" id="btn-delete-selected">🗑 Delete Selected</button>
        <button class="btn btn-ghost" id="btn-clear">↺ Clear All</button>
      </div>
      <div class="sandbox-canvas-wrap">
        <svg class="sandbox-svg" id="sandbox-svg"></svg>
      </div>
      <p class="sandbox-hint" id="sandbox-hint">Mode: Move — click and drag nodes to reposition them.</p>
      <div style="margin-top:14px;">
        <button class="btn btn-primary" id="btn-validate-ontology">✅ Validate My Ontology</button>
      </div>
      <ul class="checklist" id="checklist"></ul>
      <div id="l5-result" style="margin-top:14px;"></div>
    </div>
  `;

  // --- Scenario selection ---
  const scenarioCardsEl = container.querySelector('#scenario-cards');
  scenarios.forEach(s => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.innerHTML = `<h4>${s.name}</h4><p>${s.description}</p>`;
    card.addEventListener('click', () => {
      scenarioCardsEl.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      loadScenario(s);
    });
    scenarioCardsEl.appendChild(card);
  });

  const editorCard = container.querySelector('#editor-card');
  const svg = container.querySelector('#sandbox-svg');
  const hintEl = container.querySelector('#sandbox-hint');

  function loadScenario(s) {
    currentScenario = s;
    const saved = loadSandbox(s.id);
    const source = saved || s.starter;
    nodes = source.nodes.map(n => ({ ...n }));
    edges = source.edges.map(e => ({ ...e }));
    idCounter = nodes.length + 1;
    editorCard.hidden = false;
    render();
    editorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Mode buttons ---
  container.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      connectFrom = null;
      container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('btn-primary'));
      btn.classList.add('btn-primary');
      const hints = {
        move: 'Mode: Move — click and drag nodes to reposition them.',
        'add-class': 'Mode: Add Class — click empty canvas to place a new class node.',
        'add-instance': 'Mode: Add Instance — click empty canvas to place a new instance node.',
        connect: 'Mode: Connect — click a source node, then a target node, then name the relationship.'
      };
      hintEl.textContent = hints[mode];
      render();
    });
  });
  container.querySelector('[data-mode="move"]').classList.add('btn-primary');

  container.querySelector('#btn-clear').addEventListener('click', () => {
    nodes = [];
    edges = [];
    render();
  });

  let selectedNodeId = null;
  container.querySelector('#btn-delete-selected').addEventListener('click', () => {
    if (!selectedNodeId) return;
    nodes = nodes.filter(n => n.id !== selectedNodeId);
    edges = edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);
    selectedNodeId = null;
    render();
  });

  // --- SVG interaction ---
  function svgPoint(evt) {
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  svg.addEventListener('click', (evt) => {
    if (evt.target === svg && (mode === 'add-class' || mode === 'add-instance')) {
      const pt = svgPoint(evt);
      nodes.push({
        id: `n${idCounter++}`,
        label: mode === 'add-class' ? `Class${nodes.filter(n=>n.kind==='class').length + 1}` : `Instance${nodes.filter(n=>n.kind==='instance').length + 1}`,
        kind: mode === 'add-class' ? 'class' : 'instance',
        x: pt.x, y: pt.y
      });
      render();
    }
  });

  function render() {
    svg.setAttribute('viewBox', '0 0 700 480');
    svg.innerHTML = '';

    // edges
    edges.forEach((e, i) => {
      const a = nodes.find(n => n.id === e.from);
      const b = nodes.find(n => n.id === e.to);
      if (!a || !b) return;
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'g-edge');
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('marker-end', 'url(#arrow)');
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', (a.x + b.x) / 2);
      label.setAttribute('y', (a.y + b.y) / 2 - 6);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = e.label;
      g.appendChild(line);
      g.appendChild(label);
      svg.appendChild(g);
    });

    // arrow marker def
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `<marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#7c5cff"/></marker>`;
    svg.appendChild(defs);

    // nodes
    nodes.forEach(node => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'g-node');
      g.setAttribute('transform', `translate(${node.x},${node.y})`);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', 26);
      circle.setAttribute('fill', node.kind === 'class' ? '#233158' : '#1e2c4a');
      circle.setAttribute('stroke', node.kind === 'class' ? '#7c5cff' : '#22d3ee');
      if (node.id === connectFrom) circle.setAttribute('stroke', '#f472b6');
      if (node.id === selectedNodeId) circle.setAttribute('stroke-width', '4');
      const icon = document.createElementNS(SVG_NS, 'text');
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('dy', 5);
      icon.textContent = node.kind === 'class' ? '▲' : '●';
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('y', 42);
      label.textContent = node.label;
      g.appendChild(circle);
      g.appendChild(icon);
      g.appendChild(label);
      svg.appendChild(g);

      g.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
        if (mode === 'move') {
          selectedNodeId = node.id;
          dragNode = node;
          const pt = svgPoint(evt);
          dragOffset = { x: pt.x - node.x, y: pt.y - node.y };
          render();
        }
      });
      g.addEventListener('click', (evt) => {
        evt.stopPropagation();
        if (mode === 'connect') {
          if (!connectFrom) {
            connectFrom = node.id;
            render();
          } else if (connectFrom !== node.id) {
            const label = prompt('Name this relationship (e.g. isA, hasPart, worksAt):', 'relatesTo');
            if (label && label.trim()) {
              edges.push({ from: connectFrom, to: node.id, label: label.trim() });
            }
            connectFrom = null;
            render();
          }
        } else if (mode === 'move') {
          selectedNodeId = node.id;
          render();
        } else {
          // relabel on click in add modes not typical; allow rename via double concept: single click selects
          selectedNodeId = node.id;
        }
      });
      g.addEventListener('dblclick', (evt) => {
        evt.stopPropagation();
        const newLabel = prompt('Rename node:', node.label);
        if (newLabel && newLabel.trim()) {
          node.label = newLabel.trim();
          render();
        }
      });
    });

    if (currentScenario) saveSandbox(currentScenario.id, { nodes, edges });
  }

  svg.addEventListener('mousemove', (evt) => {
    if (dragNode) {
      const pt = svgPoint(evt);
      dragNode.x = pt.x - dragOffset.x;
      dragNode.y = pt.y - dragOffset.y;
      render();
    }
  });
  window.addEventListener('mouseup', () => { dragNode = null; });

  // --- Validation ---
  container.querySelector('#btn-validate-ontology').addEventListener('click', () => {
    const classCount = nodes.filter(n => n.kind === 'class').length;
    const instanceCount = nodes.filter(n => n.kind === 'instance').length;
    const hasClasses = classCount >= 3;
    const hasRelationships = edges.length >= 2;
    const hasHierarchy = edges.some(e => HIERARCHY_LABELS.includes(e.label.toLowerCase().replace(/\s+/g, '')));
    const connectedIds = new Set();
    edges.forEach(e => { connectedIds.add(e.from); connectedIds.add(e.to); });
    const orphans = nodes.filter(n => !connectedIds.has(n.id));
    const noOrphans = nodes.length > 0 && orphans.length === 0;
    const hasInstance = instanceCount >= 1;

    const checks = [
      { label: `Has at least 3 classes (found ${classCount})`, pass: hasClasses },
      { label: `Has at least 2 relationships (found ${edges.length})`, pass: hasRelationships },
      { label: 'Has at least one hierarchy relationship (isA / subClassOf)', pass: hasHierarchy },
      { label: `No orphan nodes (${orphans.length} found)`, pass: noOrphans },
      { label: `Has at least one instance (found ${instanceCount})`, pass: hasInstance }
    ];

    const checklistEl = container.querySelector('#checklist');
    checklistEl.innerHTML = '';
    checks.forEach(c => {
      const li = document.createElement('li');
      li.className = c.pass ? 'pass' : 'fail';
      li.innerHTML = `<span class="cl-icon">${c.pass ? '✅' : '❌'}</span><span>${c.label}</span>`;
      checklistEl.appendChild(li);
    });

    const passCount = checks.filter(c => c.pass).length;
    const score = Math.round((passCount / checks.length) * 100);
    container.querySelector('#l5-result').innerHTML = `
      <div class="completion-banner">
        <h3>${passCount === checks.length ? '🏆 Excellent Ontology!' : '✅ Level Complete'}</h3>
        <p class="score-line">Score: ${score} / 100 (${passCount}/${checks.length} best practices met)</p>
        <p>Scenario: ${currentScenario.name}</p>
      </div>
    `;
    if (passCount === checks.length) api.badge('ontology-architect', 'Ontology Architect', '🏗️');
    validatedOnce = true;
    api.complete(score);
    if (currentScenario) saveSandbox(currentScenario.id, { nodes, edges });
  });
}
