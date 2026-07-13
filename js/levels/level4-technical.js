// level4-technical.js — Animated multi-hop graph traversal + guided UI mockup walkthrough.
import { renderGraph, setHighlight, clearHighlight } from '../graph-svg.js';
import { orgGraph, singleHopQuery, multiHopQuery } from '../data/reasoning-graph.js';
import { animateCountTargets } from '../ui-utils.js';

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
        <button class="btn btn-secondary" id="btn-single-run">▶ Run Single-Hop Query</button>
        <span class="hop-step-label" id="single-status"></span>
      </div>
    </div>

    <div class="card">
      <h3>Multi-Hop Reasoning</h3>
      <p><strong>Query:</strong> "${multiHopQuery.question}"</p>
      <p>This requires traversing <strong>multiple</strong> edges in sequence — a chain of hops — to reach entities that aren't directly connected to the start. This is exactly the kind of question a flat keyword search cannot answer, but a graph traversal can.</p>
      <div class="graph-wrap" id="graph-multi"></div>
      <div class="hop-controls">
        <button class="btn btn-primary" id="btn-multi-next">▶ Start / Next Hop</button>
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
          <div style="height:60px;display:flex;align-items:center;justify-content:center;color:var(--text-2);">🕸️ interactive node-link canvas</div>
        </div>
        <div class="mock-panel" data-mp="query">
          <div class="mp-label">4 · Query Builder</div>
          <div style="color:var(--text-2); font-family:monospace; font-size:0.85rem;">SELECT ?person WHERE { ?person :worksAt :Sorbonne }</div>
        </div>
        <div class="mock-tooltip" id="mock-tooltip" hidden></div>
      </div>
      <div class="hop-controls">
        <button class="btn btn-secondary" id="btn-tour-next">▶ Next</button>
        <span class="hop-step-label" id="tour-status"></span>
      </div>
    </div>

    <div class="card" id="l4-quiz" hidden>
      <h3>Quick Check</h3>
      <div class="quiz-q">
        <div class="qtext-row">
          <p class="qtext">Which retrieval approach lets an LLM gather connected, multi-hop context from a knowledge graph instead of relying only on document similarity search?</p>
          <button class="hint-btn" id="l4-hint-btn">💡 Hint</button>
        </div>
        <div class="hint-box" id="l4-hint-box" hidden></div>
        <div class="quiz-options" id="l4-quiz-opts"></div>
      </div>
      <div id="l4-result"></div>
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
      btnMultiNext.textContent = '▶ Start / Next Hop';
      return;
    }
    multiHopStep++;
    const step = multiHopQuery.steps[multiHopStep];
    setHighlight(multiHandles, { nodes: step.nodes, edges: step.edges });
    multiStatus.textContent = step.label;
    btnMultiNext.textContent = multiHopStep < multiHopQuery.steps.length - 1 ? '▶ Next Hop' : '↺ Restart';
    if (multiHopStep === multiHopQuery.steps.length - 1) {
      multiHopFinished = true;
      maybeShowQuiz();
    }
  });

  container.querySelector('#btn-multi-reset').addEventListener('click', () => {
    multiHopStep = -1;
    clearHighlight(multiHandles);
    multiStatus.textContent = 'Click "Start" to begin the traversal.';
    btnMultiNext.textContent = '▶ Start / Next Hop';
  });

  // --- Algorithm explainer accordion ---
  const algoItems = [
    { title: 'Graph Traversal: BFS & DFS', body: 'To find multi-hop answers, engines walk the graph using Breadth-First Search (explore all neighbors at the current depth before going deeper — great for "shortest path" / nearest connections) or Depth-First Search (follow one path as far as possible before backtracking). Most graph query engines use BFS-style traversal bounded by a max hop count for performance.' },
    { title: 'Embedding-Based Similarity Search', body: 'Not all "hops" are explicit graph edges. Modern systems also compute vector embeddings for nodes and text, allowing "approximate hops" via nearest-neighbor similarity search — useful when relationships are implicit or the graph is incomplete.' },
    { title: 'Hybrid Symbolic + Vector Retrieval (GraphRAG)', body: 'GraphRAG combines symbolic graph traversal (precise, explainable, rule-based) with vector similarity search (fuzzy, semantic) — first identifying relevant entities via embeddings, then traversing the graph from those entities to gather multi-hop connected context, which is fed into the LLM prompt for a grounded answer.' }
  ];
  const algoAccordion = container.querySelector('#algo-accordion');
  algoItems.forEach(it => {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `<div class="accordion-head"><span>${it.title}</span><span class="chev">▾</span></div><div class="accordion-body"><p>${it.body}</p></div>`;
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
      hintBox.textContent = '💡 It\'s the same term you saw on the History timeline — a hybrid of "Retrieval-Augmented Generation" and graph traversal.';
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
        const resultEl = container.querySelector('#l4-result');
        resultEl.innerHTML = `
          <div class="completion-banner">
            <h3>${correct && !hintUsed ? '🎉 Correct!' : '✅ Level Complete'}</h3>
            <p class="score-line">Score: <span class="count-target" data-target="${score}">0</span> / 100</p>
            <p>You've seen how single-hop lookups differ from multi-hop graph reasoning, and how GraphRAG blends symbolic and vector retrieval.</p>
          </div>
        `;
        animateCountTargets(resultEl);
        if (correct) api.badge('graph-navigator', 'Graph Navigator', '🧭');
        api.complete(score);
      });
      optsEl.appendChild(btn);
    });
  }
}
