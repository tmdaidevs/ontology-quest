// level5-sandbox.js — Build-your-own ontology sandbox: node-link editor + validation checklist.
import { scenarios } from '../data/scenarios.js';
import { saveSandbox, loadSandbox } from '../progress.js';
import { toTurtle, toJsonLd, slugify, downloadTextFile } from '../ontology-export.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HIERARCHY_LABELS = ['isa', 'subclassof', 'kindof', 'typeof'];
const MAX_HISTORY = 60;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function mount(container, api) {
  let currentScenario = null;
  let nodes = [];
  let edges = [];
  let mode = 'move'; // 'move' | 'add-class' | 'add-instance' | 'connect'
  let connectFrom = null;
  let dragNode = null;
  let dragMoved = false;
  let dragOffset = { x: 0, y: 0 };
  let idCounter = 1;
  let validatedOnce = false;

  // --- Undo/redo history: a stack of deep-cloned {nodes, edges} snapshots. ---
  let history = [];
  let historyIndex = -1;

  container.innerHTML = `
    <div class="card">
      <h3>1 · Choose a Scenario</h3>
      <div class="scenario-cards" id="scenario-cards"></div>
    </div>
    <div class="card" id="editor-card" hidden>
      <h3>2 · Design Your Ontology</h3>
      <p>Build classes, instances, and relationships. <strong>Add Class / Add Instance</strong>: click empty canvas to place a node. <strong>Connect</strong>: click a source node, then a target node, then name the relationship. <strong>Move</strong>: drag nodes around.</p>
      <div class="sandbox-toolbar">
        <button class="btn btn-secondary mode-btn" data-mode="move">Move</button>
        <button class="btn btn-secondary mode-btn" data-mode="add-class">Add Class</button>
        <button class="btn btn-secondary mode-btn" data-mode="add-instance">Add Instance</button>
        <button class="btn btn-secondary mode-btn" data-mode="connect">Connect</button>
        <button class="btn btn-ghost" id="btn-delete-selected">Delete Selected</button>
        <span class="toolbar-sep"></span>
        <button class="btn btn-ghost" id="btn-undo" title="Undo (last edit)" disabled>↶ Undo</button>
        <button class="btn btn-ghost" id="btn-redo" title="Redo" disabled>↷ Redo</button>
        <button class="btn btn-ghost" id="btn-clear">↺ Clear All</button>
      </div>
      <div class="sandbox-canvas-wrap">
        <svg class="sandbox-svg" id="sandbox-svg"></svg>
      </div>
      <p class="sandbox-hint" id="sandbox-hint">Mode: Move — click and drag nodes to reposition them.</p>
      <div class="sandbox-actions">
        <button class="btn btn-primary" id="btn-validate-ontology">Validate My Ontology</button>
        <button class="btn btn-secondary" id="btn-export-turtle">Export as Turtle (.ttl)</button>
        <button class="btn btn-secondary" id="btn-export-jsonld">Export as JSON-LD (.json)</button>
      </div>
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
  const undoBtn = container.querySelector('#btn-undo');
  const redoBtn = container.querySelector('#btn-redo');

  // --- Undo/redo helpers ---
  function snapshot() {
    return { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) };
  }
  function updateUndoRedoButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
  }
  function resetHistory() {
    history = [snapshot()];
    historyIndex = 0;
    updateUndoRedoButtons();
  }
  /** Call after any completed mutation (add/delete/connect/rename/move) to record a checkpoint. */
  function commitHistory() {
    history = history.slice(0, historyIndex + 1);
    history.push(snapshot());
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
  }
  function restoreSnapshot(snap) {
    nodes = snap.nodes.map(n => ({ ...n }));
    edges = snap.edges.map(e => ({ ...e }));
    selectedNodeId = null;
    connectFrom = null;
    render();
    updateUndoRedoButtons();
  }
  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreSnapshot(history[historyIndex]);
  }
  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restoreSnapshot(history[historyIndex]);
  }
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  function loadScenario(s) {
    currentScenario = s;
    const saved = loadSandbox(s.id);
    const source = saved || s.starter;
    nodes = source.nodes.map(n => ({ ...n }));
    edges = source.edges.map(e => ({ ...e }));
    idCounter = nodes.length + 1;
    editorCard.hidden = false;
    render();
    resetHistory();
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
    if (!nodes.length && !edges.length) return;
    nodes = [];
    edges = [];
    render();
    commitHistory();
  });

  let selectedNodeId = null;
  container.querySelector('#btn-delete-selected').addEventListener('click', () => {
    if (!selectedNodeId) return;
    nodes = nodes.filter(n => n.id !== selectedNodeId);
    edges = edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);
    selectedNodeId = null;
    render();
    commitHistory();
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
      commitHistory();
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
    defs.innerHTML = `<marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#3d5058"/></marker>`;
    svg.appendChild(defs);

    // nodes
    nodes.forEach(node => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'g-node');
      g.setAttribute('transform', `translate(${node.x},${node.y})`);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', 26);
      circle.setAttribute('fill', node.kind === 'class' ? '#132a28' : '#101f2c');
      circle.setAttribute('stroke', node.kind === 'class' ? '#2ee6c8' : '#5b95ff');
      if (node.id === connectFrom) circle.setAttribute('stroke', '#ffb454');
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
          dragMoved = false;
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
              connectFrom = null;
              render();
              commitHistory();
            } else {
              connectFrom = null;
              render();
            }
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
        if (newLabel && newLabel.trim() && newLabel.trim() !== node.label) {
          node.label = newLabel.trim();
          render();
          commitHistory();
        }
      });
    });

    if (currentScenario) saveSandbox(currentScenario.id, { nodes, edges });
  }

  svg.addEventListener('mousemove', (evt) => {
    if (dragNode) {
      dragMoved = true;
      const pt = svgPoint(evt);
      dragNode.x = pt.x - dragOffset.x;
      dragNode.y = pt.y - dragOffset.y;
      render();
    }
  });
  window.addEventListener('mouseup', () => {
    if (dragNode && dragMoved) commitHistory();
    dragNode = null;
    dragMoved = false;
  });

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

    const passCount = checks.filter(c => c.pass).length;
    const score = Math.round((passCount / checks.length) * 100);

    let badge = null;
    if (passCount === checks.length) {
      const added = api.badge('ontology-architect', 'Ontology Architect', '');
      if (added) badge = { name: 'Ontology Architect', icon: '' };
    }
    validatedOnce = true;
    if (currentScenario) saveSandbox(currentScenario.id, { nodes, edges });
    api.complete(score, {
      heading: passCount === checks.length ? 'Excellent ontology!' : 'Level complete',
      detail: `Scenario: ${currentScenario.name} · ${passCount}/${checks.length} best practices met.`,
      badge,
      checklist: checks
    });
  });

  // --- Export as Turtle / JSON-LD ---
  function requireGraphOrAlert() {
    if (!currentScenario) {
      alert('Pick a scenario first to build an ontology you can export.');
      return false;
    }
    if (!nodes.length) {
      alert('Add at least one class or instance before exporting.');
      return false;
    }
    return true;
  }

  container.querySelector('#btn-export-turtle').addEventListener('click', () => {
    if (!requireGraphOrAlert()) return;
    const code = toTurtle(nodes, edges, currentScenario.name);
    openExportModal('Turtle (.ttl)', code, `${slugify(currentScenario.name)}.ttl`, 'text/turtle');
  });
  container.querySelector('#btn-export-jsonld').addEventListener('click', () => {
    if (!requireGraphOrAlert()) return;
    const code = toJsonLd(nodes, edges, currentScenario.name);
    openExportModal('JSON-LD (.json)', code, `${slugify(currentScenario.name)}.json`, 'application/ld+json');
  });

  function openExportModal(formatLabel, code, filename, mimeType) {
    document.getElementById('export-modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'export-modal-overlay';
    overlay.className = 'export-modal-overlay';
    overlay.innerHTML = `
      <div class="export-modal">
        <button class="export-modal-close" id="export-modal-close" aria-label="Close">&times;</button>
        <h3>Exported as ${escapeHtml(formatLabel)}</h3>
        <p class="export-modal-sub">Generated from your current sandbox graph — real, valid syntax you can paste into any RDF tool.</p>
        <pre class="export-code"><code>${escapeHtml(code)}</code></pre>
        <div class="export-modal-actions">
          <button class="btn btn-secondary" id="export-copy-btn">Copy to Clipboard</button>
          <button class="btn btn-primary" id="export-download-btn">Download File</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#export-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) close(); });

    overlay.querySelector('#export-copy-btn').addEventListener('click', async (evt) => {
      const btn = evt.currentTarget;
      try {
        await navigator.clipboard.writeText(code);
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = original; }, 1500);
      } catch (err) {
        alert('Could not copy automatically — please select the text manually.');
      }
    });
    overlay.querySelector('#export-download-btn').addEventListener('click', () => {
      downloadTextFile(filename, code, mimeType);
    });
  }
}
