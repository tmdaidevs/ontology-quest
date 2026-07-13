// level4-technical.js — Animated multi-hop graph traversal + guided UI mockup walkthrough.
import { renderGraph, setHighlight, clearHighlight } from '../graph-svg.js';
import { orgGraph, singleHopQuery, multiHopQuery } from '../data/reasoning-graph.js';

export function mount(container, api) {
  let singleHopViewed = false;
  let multiHopStep = -1;
  let multiHopFinished = false;
  let walkthroughStep = -1;
  let walkthroughFinished = false;
  let quizAnswered = false;

  container.innerHTML = `
    <div class="card">
      <h3>How a Knowledge Graph is Stored</h3>
      <p>A knowledge graph stores data as <strong>nodes</strong> (entities, e.g. people) connected by <strong>edges</strong> (relationships, e.g. "reportsTo"). Unlike a table of rows and columns, a graph makes relationships first-class — so following connections ("traversal") is fast and natural, no expensive JOINs required.</p>
    </div>

    <div class="card">
      <h3>Single-Hop Lookup</h3>
      <p><strong>Query:</strong> "${singleHopQuery.question}"</p>
      <p>A single-hop lookup follows just <strong>one</strong> relationship edge from the starting node to find the answer directly.</p>
      <div class="graph-wrap" id="graph-single"></div>
      <div class="hop-controls">
        <button class="btn btn-secondary" id="btn-single-run">Run Single-Hop Query</button>
        <span class="hop-step-label" id="single-status"></span>
      </div>
    </div>

    <div class="card">
      <h3>Multi-Hop Reasoning</h3>
      <p><strong>Query:</strong> "${multiHopQuery.question}"</p>
      <p>This requires traversing <strong>multiple</strong> edges in sequence — a chain of hops — to reach entities that aren't directly connected to the start. This is exactly the kind of question a flat keyword search cannot answer, but a graph traversal can.</p>
      <div class="graph-wrap" id="graph-multi"></div>
      <div class="hop-controls">
        <button class="btn btn-primary" id="btn-multi-next">Start / Next Hop</button>
        <button class="btn btn-ghost" id="btn-multi-reset">↺ Reset</button>
        <span class="hop-step-label" id="multi-status">Click "Start" to begin the traversal.</span>
      </div>
    </div>

    <div class="card">
      <h3>The Algorithms Behind It</h3>
      <div id="algo-accordion"></div>
    </div>

    <div class="card">
      <h3>A Guided Tour: What an Ontology-Driven App UI Looks Like</h3>
      <p>Most knowledge-graph applications share four common UI building blocks. Click "Next" to walk through them.</p>
      <div class="ui-mock" id="ui-mock">
        <div class="mock-panel" data-mp="search">
          <div class="mp-label">1 · Entity Search</div>
          <div class="mock-search-bar"><input type="text" placeholder="Search entities... e.g. 'Marie Curie'" disabled /><button class="btn btn-secondary" disabled>Search</button></div>
        </div>
        <div class="mock-panel" data-mp="browser">
          <div class="mp-label">2 · Relationship Browser</div>
          <div class="mock-rel-list"><span>worksAt</span><span>bornIn</span><span>discoveredBy</span><span>fieldOfStudy</span></div>
        </div>
        <div class="mock-panel" data-mp="viz">
          <div class="mp-label">3 · Graph Visualization Panel</div>
          <div style="height:60px;display:flex;align-items:center;justify-content:center;color:var(--text-2);">interactive node-link canvas</div>
        </div>
        <div class="mock-panel" data-mp="query">
          <div class="mp-label">4 · Query Builder</div>
          <div style="color:var(--text-2); font-family:monospace; font-size:0.85rem;">SELECT ?person WHERE { ?person :worksAt :Sorbonne }</div>
        </div>
        <div class="mock-tooltip" id="mock-tooltip" hidden></div>
      </div>
      <div class="hop-controls">
        <button class="btn btn-secondary" id="btn-tour-next">Next</button>
        <span class="hop-step-label" id="tour-status"></span>
      </div>
    </div>

    <div class="card" id="l4-quiz" hidden>
      <h3>Quick Check</h3>
      <div class="quiz-q">
        <div class="qtext-row">
          <p class="qtext">Which retrieval approach lets an LLM gather connected, multi-hop context from a knowledge graph instead of relying only on document similarity search?</p>
          <button class="hint-btn" id="l4-hint-btn">Hint</button>
        </div>
        <div class="hint-box" id="l4-hint-box" hidden></div>
        <div class="quiz-options" id="l4-quiz-opts"></div>
      </div>
    </div>
  `;

  // --- Single-hop demo ---
  const singleGraphEl = container.querySelector('#graph-single');
  const singleHandles = renderGraph(singleGraphEl, orgGraph, { width: 700, height: 380 });
  container.querySelector('#btn-single-run').addEventListener('click', () => {
    const step = singleHopQuery.path[0];
    setHighlight(singleHandles, { nodes: step.nodes, edges: step.edges });
    container.querySelector('#single-status').textContent = `Answer: ${orgGraph.nodes.find(n => n.id === 'mgr').label} (1 hop)`;
    singleHopViewed = true;
    maybeShowQuiz();
  });

  // --- Multi-hop demo ---
  const multiGraphEl = container.querySelector('#graph-multi');
  const multiHandles = renderGraph(multiGraphEl, orgGraph, { width: 700, height: 380 });
  const multiStatus = container.querySelector('#multi-status');
  const btnMultiNext = container.querySelector('#btn-multi-next');

  btnMultiNext.addEventListener('click', () => {
    if (multiHopStep >= multiHopQuery.steps.length - 1) {
      // finished — restart
      multiHopStep = -1;
      clearHighlight(multiHandles);
      multiStatus.textContent = 'Click "Start" to begin the traversal.';
      btnMultiNext.textContent = 'Start / Next Hop';
      return;
    }
    multiHopStep++;
    const step = multiHopQuery.steps[multiHopStep];
    setHighlight(multiHandles, { nodes: step.nodes, edges: step.edges });
    multiStatus.textContent = step.label;
    btnMultiNext.textContent = multiHopStep < multiHopQuery.steps.length - 1 ? 'Next Hop' : '↺ Restart';
    if (multiHopStep === multiHopQuery.steps.length - 1) {
      multiHopFinished = true;
      maybeShowQuiz();
    }
  });

  container.querySelector('#btn-multi-reset').addEventListener('click', () => {
    multiHopStep = -1;
    clearHighlight(multiHandles);
    multiStatus.textContent = 'Click "Start" to begin the traversal.';
    btnMultiNext.textContent = 'Start / Next Hop';
  });

  // --- Algorithm explainer accordion ---
  // Each card pairs its explainer paragraph with a small, auto-looping, pure-CSS
  // animation (no JS timers — safe to leave running indefinitely and immune to
  // leaks across "Replay Level" remounts) that visually echoes the concept.
  const bfsDfsViz = `
    <div class="mini-viz mini-traverse-compare" aria-hidden="true">
      <div class="mv-panel mv-bfs">
        <div class="mv-panel-label"><span class="mv-dot bfs"></span>BFS — level by level</div>
        <svg viewBox="0 0 220 150" class="mv-svg">
          <line x1="110" y1="20" x2="60" y2="75" class="mv-edge" style="--d:0.4s"/>
          <line x1="110" y1="20" x2="160" y2="75" class="mv-edge" style="--d:0.4s"/>
          <line x1="60" y1="75" x2="30" y2="128" class="mv-edge" style="--d:0.8s"/>
          <line x1="60" y1="75" x2="90" y2="128" class="mv-edge" style="--d:0.8s"/>
          <line x1="160" y1="75" x2="130" y2="128" class="mv-edge" style="--d:0.8s"/>
          <line x1="160" y1="75" x2="190" y2="128" class="mv-edge" style="--d:0.8s"/>
          <circle cx="110" cy="20" r="11" class="mv-node" style="--d:0s"/>
          <circle cx="60" cy="75" r="10" class="mv-node" style="--d:0.4s"/>
          <circle cx="160" cy="75" r="10" class="mv-node" style="--d:0.4s"/>
          <circle cx="30" cy="128" r="9" class="mv-node" style="--d:0.8s"/>
          <circle cx="90" cy="128" r="9" class="mv-node" style="--d:0.8s"/>
          <circle cx="130" cy="128" r="9" class="mv-node" style="--d:0.8s"/>
          <circle cx="190" cy="128" r="9" class="mv-node" style="--d:0.8s"/>
        </svg>
      </div>
      <div class="mv-panel mv-dfs">
        <div class="mv-panel-label"><span class="mv-dot dfs"></span>DFS — dive deep first</div>
        <svg viewBox="0 0 220 150" class="mv-svg">
          <line x1="110" y1="20" x2="60" y2="75" class="mv-edge" style="--d:0.4s"/>
          <line x1="60" y1="75" x2="30" y2="128" class="mv-edge" style="--d:0.8s"/>
          <line x1="60" y1="75" x2="90" y2="128" class="mv-edge" style="--d:1.2s"/>
          <line x1="110" y1="20" x2="160" y2="75" class="mv-edge" style="--d:1.6s"/>
          <line x1="160" y1="75" x2="130" y2="128" class="mv-edge" style="--d:2.0s"/>
          <line x1="160" y1="75" x2="190" y2="128" class="mv-edge" style="--d:2.4s"/>
          <circle cx="110" cy="20" r="11" class="mv-node" style="--d:0s"/>
          <circle cx="60" cy="75" r="10" class="mv-node" style="--d:0.4s"/>
          <circle cx="30" cy="128" r="9" class="mv-node" style="--d:0.8s"/>
          <circle cx="90" cy="128" r="9" class="mv-node" style="--d:1.2s"/>
          <circle cx="160" cy="75" r="10" class="mv-node" style="--d:1.6s"/>
          <circle cx="130" cy="128" r="9" class="mv-node" style="--d:2.0s"/>
          <circle cx="190" cy="128" r="9" class="mv-node" style="--d:2.4s"/>
        </svg>
      </div>
    </div>`;
  const embeddingViz = `
    <div class="mini-viz mini-vector-radar" aria-hidden="true">
      <svg viewBox="0 0 320 170" class="mv-svg radar-svg">
        <circle cx="40" cy="30" r="5" class="radar-dot dim"/>
        <circle cx="270" cy="35" r="5" class="radar-dot dim"/>
        <circle cx="255" cy="140" r="5" class="radar-dot dim"/>
        <circle cx="35" cy="135" r="5" class="radar-dot dim"/>
        <circle cx="225" cy="115" r="5" class="radar-dot dim"/>
        <circle cx="55" cy="105" r="5" class="radar-dot dim"/>
        <line x1="150" y1="85" x2="95" y2="55" class="radar-line" style="--d:0.9s"/>
        <line x1="150" y1="85" x2="100" y2="120" class="radar-line" style="--d:1.1s"/>
        <line x1="150" y1="85" x2="185" y2="58" class="radar-line" style="--d:0.85s"/>
        <circle cx="95" cy="55" r="6" class="radar-dot neighbor" style="--d:0.9s"/>
        <circle cx="100" cy="120" r="6" class="radar-dot neighbor" style="--d:1.1s"/>
        <circle cx="185" cy="58" r="6" class="radar-dot neighbor" style="--d:0.85s"/>
        <circle cx="150" cy="85" r="0" class="radar-ring" style="--rd:0s"/>
        <circle cx="150" cy="85" r="0" class="radar-ring" style="--rd:1.5s"/>
        <circle cx="150" cy="85" r="7" class="radar-query"/>
      </svg>
      <div class="mv-caption">A similarity "ping" radiates from the query — nearest neighbors light up with no explicit graph edge required.</div>
    </div>`;
  const pipelineViz = `
    <div class="mini-viz mini-pipeline-flow" aria-hidden="true">
      <div class="pf-track">
        <div class="pf-node" style="--d:0.0s">?</div>
        <div class="pf-node" style="--d:0.8s">≈</div>
        <div class="pf-node" style="--d:1.6s">⇄</div>
        <div class="pf-node" style="--d:2.4s">▤</div>
        <div class="pf-node" style="--d:3.2s">▣</div>
        <div class="pf-dot"></div>
      </div>
      <div class="mv-caption">One query flowing through: seed via vectors → expand via graph → assemble → grounded answer.</div>
    </div>`;
  const inferenceViz = `
    <div class="mini-viz mini-inference-chain" aria-hidden="true">
      <svg viewBox="0 0 340 190" class="mv-svg">
        <line x1="55" y1="120" x2="170" y2="120" class="inf-edge inf-explicit" style="--d:0.3s"/>
        <text x="112" y="108" class="inf-edge-label" style="--d:0.3s">isA</text>
        <line x1="170" y1="120" x2="285" y2="120" class="inf-edge inf-explicit" style="--d:1.5s"/>
        <text x="227" y="108" class="inf-edge-label" style="--d:1.5s">isA</text>
        <path d="M55,120 Q170,20 285,120" class="inf-edge inf-inferred" style="--d:0s"/>
        <text x="170" y="34" class="inf-edge-label inferred" style="--d:0s">isA (inferred)</text>
        <circle cx="55" cy="120" r="13" class="inf-node" style="--d:0s"/>
        <text x="55" y="148" class="inf-node-label" style="--d:0s">Cat</text>
        <circle cx="170" cy="120" r="15" class="inf-node" style="--d:0.6s"/>
        <text x="170" y="148" class="inf-node-label" style="--d:0.6s">Mammal</text>
        <circle cx="285" cy="120" r="15" class="inf-node" style="--d:1.8s"/>
        <text x="285" y="148" class="inf-node-label" style="--d:1.8s">Animal</text>
      </svg>
      <div class="mv-caption">An RDFS/OWL reasoner applies rules like <em>transitivity</em> automatically: from the two stated facts "Cat isA Mammal" and "Mammal isA Animal", it derives the new fact "Cat isA Animal" — without anyone writing that triple down.</div>
    </div>`;
  const algoItems = [
    { title: 'Graph Traversal: BFS & DFS', body: 'To find multi-hop answers, engines walk the graph using Breadth-First Search (explore all neighbors at the current depth before going deeper — great for "shortest path" / nearest connections) or Depth-First Search (follow one path as far as possible before backtracking). Most graph query engines use BFS-style traversal bounded by a max hop count for performance.', viz: bfsDfsViz },
    { title: 'Embedding-Based Similarity Search', body: 'Not all "hops" are explicit graph edges. Modern systems also compute vector embeddings for nodes and text, allowing "approximate hops" via nearest-neighbor similarity search — useful when relationships are implicit or the graph is incomplete.', viz: embeddingViz },
    { title: 'Hybrid Symbolic + Vector Retrieval (GraphRAG)', body: 'GraphRAG combines symbolic graph traversal (precise, explainable, rule-based) with vector similarity search (fuzzy, semantic) — first identifying relevant entities via embeddings, then traversing the graph from those entities to gather multi-hop connected context, which is fed into the LLM prompt for a grounded answer.', viz: pipelineViz },
    { title: 'Transitive Inference: RDFS & OWL Reasoning', body: 'RDFS and OWL let you declare a property "transitive" (like isA / subClassOf). A reasoner then walks the asserted triples and materializes new ones that were never written down — this is how ontologies support automated logical inference, not just storage and lookup.', viz: inferenceViz }
  ];
  const algoAccordion = container.querySelector('#algo-accordion');
  algoItems.forEach(it => {
    const item = document.createElement('div');
    item.className = 'accordion-item algo-item';
    item.innerHTML = `<div class="accordion-head"><span>${it.title}</span><span class="chev">▾</span></div><div class="accordion-body"><p>${it.body}</p>${it.viz}</div>`;
    item.querySelector('.accordion-head').addEventListener('click', () => item.classList.toggle('open'));
    algoAccordion.appendChild(item);
  });

  // --- UI mockup guided tour ---
  const tourSteps = [
    { mp: 'search', text: 'Entity Search: users start by searching for a known entity (a person, product, or concept) by name — resolved against the graph\'s labels/aliases.' },
    { mp: 'browser', text: 'Relationship Browser: once an entity is found, users see the relationships (predicates) available for it, letting them explore outward one hop at a time.' },
    { mp: 'viz', text: 'Graph Visualization Panel: a node-link diagram renders the neighborhood around the selected entity, making multi-hop structure visually intuitive.' },
    { mp: 'query', text: 'Query Builder: power users write formal graph queries (SPARQL, Cypher, Gremlin) directly, often assisted by autocomplete grounded in the ontology schema.' }
  ];
  const tourStatus = container.querySelector('#tour-status');
  const tooltip = container.querySelector('#mock-tooltip');
  container.querySelector('#btn-tour-next').addEventListener('click', () => {
    walkthroughStep = (walkthroughStep + 1) % tourSteps.length;
    const step = tourSteps[walkthroughStep];
    container.querySelectorAll('.mock-panel').forEach(p => p.classList.toggle('highlighted', p.dataset.mp === step.mp));
    tooltip.hidden = false;
    tooltip.textContent = step.text;
    tourStatus.textContent = `Step ${walkthroughStep + 1} / ${tourSteps.length}`;
    if (walkthroughStep === tourSteps.length - 1) {
      walkthroughFinished = true;
      maybeShowQuiz();
    }
  });

  // --- Final quiz gate ---
  const quizCard = container.querySelector('#l4-quiz');
  function maybeShowQuiz() {
    if (singleHopViewed && multiHopFinished && walkthroughFinished && quizCard.hidden) {
      quizCard.hidden = false;
      renderQuiz();
      quizCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQuiz() {
    const opts = ['Plain keyword search', 'GraphRAG (hybrid graph traversal + vector retrieval)', 'Random sampling', 'CSS selectors'];
    const answerIdx = 1;
    const optsEl = container.querySelector('#l4-quiz-opts');
    let hintUsed = false;
    const hintBtn = container.querySelector('#l4-hint-btn');
    const hintBox = container.querySelector('#l4-hint-box');
    hintBtn.addEventListener('click', () => {
      hintBox.hidden = false;
      hintBox.textContent = 'It\'s the same term you saw on the History timeline — a hybrid of "Retrieval-Augmented Generation" and graph traversal.';
      hintBtn.disabled = true;
      hintUsed = true;
    });
    opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (quizAnswered) return;
        quizAnswered = true;
        hintBtn.disabled = true;
        const correct = i === answerIdx;
        btn.classList.add(correct ? 'correct' : 'wrong');
        [...optsEl.children].forEach(c => c.classList.add('disabled'));
        if (!correct) optsEl.children[answerIdx].classList.add('correct');
        const base = correct ? 100 : 75;
        const score = Math.max(0, base - (hintUsed ? 5 : 0));
        let badge = null;
        if (correct) {
          const added = api.badge('graph-navigator', 'Graph Navigator', '');
          if (added) badge = { name: 'Graph Navigator', icon: '' };
        }
        api.complete(score, {
          heading: correct && !hintUsed ? 'Correct!' : 'Level complete',
          detail: `You've seen how single-hop lookups differ from multi-hop graph reasoning, and how GraphRAG blends symbolic and vector retrieval.`,
          badge
        });
      });
      optsEl.appendChild(btn);
    });
  }
}
