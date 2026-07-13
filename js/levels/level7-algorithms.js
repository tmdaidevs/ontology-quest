// level7-algorithms.js — "Algorithms Visualized": animates the actual algorithms behind
// multi-hop reasoning — BFS vs. DFS graph traversal, embedding-based similarity search,
// and the hybrid symbolic+vector retrieval pipeline used by GraphRAG.
import { renderGraph, setHighlight, clearHighlight } from '../graph-svg.js';
import { taxonomyGraph, embeddingPoints } from '../data/algo-graph.js';
import { bfsSteps, dfsSteps } from '../graph-algorithms.js';
import { renderVectorSpace, nearestNeighbors, animateSearchCircle } from '../vector-space-svg.js';

export function mount(container, api) {
  let bfsDone = false;
  let dfsDone = false;
  let vectorDone = false;
  let pipelineDone = false;
  let quizAnswered = false;

  container.innerHTML = `
    <div class="card">
      <h3>Two Ways to Walk a Graph: BFS vs. DFS</h3>
      <p>Answering a multi-hop question means deciding <em>which order</em> to visit connected nodes. <strong>Breadth-First Search (BFS)</strong> explores every neighbor at the current distance before going one level deeper, using a queue — ideal for shortest-path questions. <strong>Depth-First Search (DFS)</strong> commits to one branch and follows it all the way down before backtracking, using a stack. Pick a mode and step through the same class hierarchy to see how the visit order differs.</p>
      <div class="algo-tabs" id="algo-tabs">
        <button class="algo-tab active" data-mode="bfs">Breadth-First (BFS)</button>
        <button class="algo-tab" data-mode="dfs">Depth-First (DFS)</button>
      </div>
      <div class="graph-wrap" id="graph-traversal"></div>
      <div class="traversal-readout">
        <div class="tr-row"><span class="tr-label" id="tr-frontier-label">Queue</span><div class="tr-values" id="tr-frontier">—</div></div>
        <div class="tr-row"><span class="tr-label">Visit order</span><div class="visit-trail" id="tr-trail"></div></div>
      </div>
      <div class="hop-controls">
        <button class="btn btn-primary" id="btn-trav-step">Step</button>
        <button class="btn btn-secondary" id="btn-trav-play">Auto-Play</button>
        <button class="btn btn-ghost" id="btn-trav-reset">↺ Reset</button>
        <span class="hop-step-label" id="trav-status"></span>
      </div>
    </div>

    <div class="card">
      <h3>Embedding-Based Similarity Search</h3>
      <p>Not all connections are explicit graph edges. Modern systems also compute <strong>vector embeddings</strong> for entities — coordinates in a "meaning space" where similar concepts sit close together. Below, "Wolf" has no graph edge to any of these animals, yet similarity search still finds its nearest neighbors — an <strong>approximate hop</strong> based purely on learned meaning, useful when relationships aren't explicitly modeled.</p>
      <div class="graph-wrap vec-wrap" id="graph-vector"></div>
      <div class="hop-controls">
        <button class="btn btn-primary" id="btn-vec-search">Find Nearest Neighbors to "Wolf"</button>
        <span class="hop-step-label" id="vec-status">Click to run an approximate-nearest-neighbor query.</span>
      </div>
      <div class="vec-results" id="vec-results"></div>
    </div>

    <div class="card">
      <h3>Hybrid Retrieval: How GraphRAG Combines Both</h3>
      <p>Real systems like GraphRAG rarely rely on just one method. They combine <strong>fast approximate vector search</strong> (to find relevant starting points) with <strong>precise graph traversal</strong> (to gather structured, explainable multi-hop context), then hand the assembled facts to an LLM. Step through the pipeline:</p>
      <div class="pipeline" id="rag-pipeline">
        <div class="pipeline-stage" data-stage="0"><div class="ps-icon">?</div><div class="ps-label">User Question</div></div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage" data-stage="1"><div class="ps-icon">≈</div><div class="ps-label">Vector Search<br><small>find seed entities</small></div></div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage" data-stage="2"><div class="ps-icon">⇄</div><div class="ps-label">Graph Traversal<br><small>expand multi-hop context</small></div></div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage" data-stage="3"><div class="ps-icon">▤</div><div class="ps-label">Assembled Context<br><small>ranked facts</small></div></div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage" data-stage="4"><div class="ps-icon">▣</div><div class="ps-label">LLM Answer<br><small>grounded response</small></div></div>
      </div>
      <p class="pipeline-caption" id="pipeline-caption">Click "Next Stage" to walk through how a GraphRAG query gets answered end-to-end.</p>
      <div class="hop-controls">
        <button class="btn btn-secondary" id="btn-pipe-next">Next Stage</button>
        <button class="btn btn-ghost" id="btn-pipe-reset">↺ Reset</button>
      </div>
    </div>

    <div class="card" id="l7-quiz" hidden>
      <h3>Quick Check</h3>
      <div class="quiz-q">
        <div class="qtext-row">
          <p class="qtext">Why does GraphRAG use BOTH vector similarity search AND graph traversal, instead of just one?</p>
          <button class="hint-btn" id="l7-hint-btn">Hint</button>
        </div>
        <div class="hint-box" id="l7-hint-box" hidden></div>
        <div class="quiz-options" id="l7-quiz-opts"></div>
      </div>
    </div>
  `;

  // ================= Section 1: BFS vs DFS =================
  const graphEl = container.querySelector('#graph-traversal');
  const handles = renderGraph(graphEl, taxonomyGraph, { width: 700, height: 400 });
  const frontierLabel = container.querySelector('#tr-frontier-label');
  const frontierEl = container.querySelector('#tr-frontier');
  const trailEl = container.querySelector('#tr-trail');
  const travStatus = container.querySelector('#trav-status');
  const btnStep = container.querySelector('#btn-trav-step');
  const btnPlay = container.querySelector('#btn-trav-play');
  const btnReset = container.querySelector('#btn-trav-reset');
  const tabs = container.querySelectorAll('.algo-tab');

  let mode = 'bfs';
  let steps = bfsSteps(taxonomyGraph, 'entity');
  let stepIndex = -1;
  let playTimer = null;

  const labelFor = id => taxonomyGraph.nodes.find(n => n.id === id).label;

  function stopPlay() {
    clearInterval(playTimer);
    playTimer = null;
    btnPlay.textContent = 'Auto-Play';
  }

  function resetTraversal() {
    stepIndex = -1;
    clearHighlight(handles);
    trailEl.innerHTML = '';
    frontierEl.textContent = '—';
    btnStep.disabled = false;
    btnPlay.disabled = false;
    stopPlay();
    travStatus.textContent = mode === 'bfs'
      ? 'Step through — watch the queue (FIFO) grow and shrink, level by level.'
      : 'Step through — watch the stack (LIFO) dive down one branch before backtracking.';
  }

  function doStep() {
    if (stepIndex >= steps.length - 1) { stopPlay(); return; }
    stepIndex++;
    const step = steps[stepIndex];
    const visitedNodes = steps.slice(0, stepIndex + 1).map(s => s.node);
    const visitedEdges = steps.slice(0, stepIndex + 1).map(s => s.edge).filter(e => e !== null);
    setHighlight(handles, { nodes: visitedNodes, edges: visitedEdges });

    const chip = document.createElement('span');
    chip.className = 'visit-chip visit-pop';
    chip.textContent = `${stepIndex + 1}. ${labelFor(step.node)}`;
    trailEl.appendChild(chip);

    frontierEl.textContent = step.frontier.length ? step.frontier.map(labelFor).join(', ') : '(empty)';

    if (stepIndex === steps.length - 1) {
      travStatus.textContent = `Traversal complete — visited all ${steps.length} nodes via ${mode === 'bfs' ? 'BFS' : 'DFS'}.`;
      stopPlay();
      btnStep.disabled = true;
      btnPlay.disabled = true;
      if (mode === 'bfs') bfsDone = true; else dfsDone = true;
      maybeShowQuiz();
    } else {
      travStatus.textContent = `Visited "${labelFor(step.node)}" (step ${stepIndex + 1} of ${steps.length}).`;
    }
  }

  btnStep.addEventListener('click', doStep);
  btnPlay.addEventListener('click', () => {
    if (playTimer) { stopPlay(); return; }
    btnPlay.textContent = 'Pause';
    playTimer = setInterval(() => {
      doStep();
      if (stepIndex >= steps.length - 1) stopPlay();
    }, 700);
  });
  btnReset.addEventListener('click', resetTraversal);
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.mode === mode) return;
      mode = tab.dataset.mode;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      steps = mode === 'bfs' ? bfsSteps(taxonomyGraph, 'entity') : dfsSteps(taxonomyGraph, 'entity');
      frontierLabel.textContent = mode === 'bfs' ? 'Queue' : 'Stack';
      resetTraversal();
    });
  });
  resetTraversal();

  // ================= Section 2: Embedding similarity search =================
  const vecGraphEl = container.querySelector('#graph-vector');
  let vecHandles = renderVectorSpace(vecGraphEl, embeddingPoints, { width: 560, height: 380 });
  const vecResultsEl = container.querySelector('#vec-results');
  const vecStatus = container.querySelector('#vec-status');
  const btnVecSearch = container.querySelector('#btn-vec-search');

  async function runVectorSearch() {
    btnVecSearch.disabled = true;
    vecStatus.textContent = 'Computing nearest neighbors by embedding distance…';
    vecHandles.lineLayer.innerHTML = '';
    vecResultsEl.innerHTML = '';
    Object.values(vecHandles.pointEls).forEach(g => g.classList.remove('highlight', 'dim'));
    vecHandles.searchCircle.setAttribute('r', 0);
    vecHandles.searchCircle.classList.remove('active');

    const query = embeddingPoints.find(p => p.id === 'wolf');
    const neighbors = nearestNeighbors(embeddingPoints, 'wolf', 3);
    const maxNeighborDist = Math.max(...neighbors.map(n => n.dist));
    await animateSearchCircle(vecHandles, query, maxNeighborDist + 14);

    neighbors.forEach(n => {
      vecHandles.pointEls[n.id].classList.add('highlight');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', query.x);
      line.setAttribute('y1', query.y);
      line.setAttribute('x2', n.x);
      line.setAttribute('y2', n.y);
      line.setAttribute('class', 'vec-sim-line');
      vecHandles.lineLayer.appendChild(line);
    });
    Object.entries(vecHandles.pointEls).forEach(([id, g]) => {
      if (id !== 'wolf' && !neighbors.some(n => n.id === id)) g.classList.add('dim');
    });

    vecResultsEl.innerHTML = neighbors
      .map(n => `<div class="vec-result-row"><span>${n.label}</span><span class="vec-sim-score">${Math.round(n.similarity * 100)}% similar</span></div>`)
      .join('');
    vecStatus.textContent = `Found ${neighbors.length} nearest neighbors — none connected to "Wolf" by an explicit graph edge, yet found instantly through vector similarity.`;
    btnVecSearch.disabled = false;
    vectorDone = true;
    maybeShowQuiz();
  }
  btnVecSearch.addEventListener('click', runVectorSearch);

  // ================= Section 3: Hybrid GraphRAG pipeline =================
  const stages = container.querySelectorAll('.pipeline-stage');
  const pipelineCaption = container.querySelector('#pipeline-caption');
  const btnPipeNext = container.querySelector('#btn-pipe-next');
  const btnPipeReset = container.querySelector('#btn-pipe-reset');
  let pipeStep = -1;
  const captions = [
    'The user asks a natural-language question that requires connecting multiple pieces of information — something a flat keyword search would struggle with.',
    'An embedding model converts the question into a vector and runs a similarity search — just like the "Wolf" demo above — to find the most semantically relevant seed entities, even without exact keyword overlap.',
    'Starting from those seed entities, the system traverses the knowledge graph outward — typically BFS-style, bounded by a max hop count — to gather precisely connected, explainable facts, just like the traversal demo above.',
    'The retrieved triples/facts are ranked and assembled into a compact, structured context block — far more precise and compact than raw document chunks.',
    'The assembled context is inserted into the LLM prompt, producing an answer that is both fluent AND grounded in verifiable graph facts — the core idea behind GraphRAG.'
  ];

  function renderPipeline() {
    stages.forEach((s, i) => {
      s.classList.toggle('active', i === pipeStep);
      s.classList.toggle('done', i < pipeStep);
    });
    pipelineCaption.textContent = pipeStep === -1
      ? 'Click "Next Stage" to walk through how a GraphRAG query gets answered end-to-end.'
      : captions[pipeStep];
  }
  btnPipeNext.addEventListener('click', () => {
    if (pipeStep >= stages.length - 1) return;
    pipeStep++;
    renderPipeline();
    if (pipeStep === stages.length - 1) {
      pipelineDone = true;
      btnPipeNext.disabled = true;
      maybeShowQuiz();
    }
  });
  btnPipeReset.addEventListener('click', () => {
    pipeStep = -1;
    btnPipeNext.disabled = false;
    renderPipeline();
  });
  renderPipeline();

  // ================= Final quiz gate =================
  const quizCard = container.querySelector('#l7-quiz');
  function maybeShowQuiz() {
    if (bfsDone && dfsDone && vectorDone && pipelineDone && quizCard.hidden) {
      quizCard.hidden = false;
      renderQuiz();
      quizCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQuiz() {
    const opts = [
      'Graph traversal replaces the need for embeddings entirely.',
      'Vector search quickly finds relevant starting points; graph traversal then follows precise, explainable relationships from there.',
      'BFS and DFS always visit nodes in the exact same order.',
      'Vector search is only used for storing passwords securely.'
    ];
    const answerIdx = 1;
    const optsEl = container.querySelector('#l7-quiz-opts');
    let hintUsed = false;
    const hintBtn = container.querySelector('#l7-hint-btn');
    const hintBox = container.querySelector('#l7-hint-box');
    hintBtn.addEventListener('click', () => {
      hintBox.hidden = false;
      hintBox.textContent = 'Think about what each technique is best at: one is fuzzy/semantic (great at finding a starting point), the other is precise/structural (great at following exact relationships).';
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
          const added = api.badge('algorithm-adept', 'Algorithm Adept', '');
          if (added) badge = { name: 'Algorithm Adept', icon: '' };
        }
        api.complete(score, {
          heading: correct && !hintUsed ? 'Correct!' : 'Level complete',
          detail: 'You\'ve watched BFS and DFS traverse a graph, seen embedding-based similarity search find an "approximate hop," and walked through the full hybrid GraphRAG pipeline.',
          badge
        });
      });
      optsEl.appendChild(btn);
    });
  }
}
