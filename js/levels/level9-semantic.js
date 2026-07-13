// level9-semantic.js — "Semantic Models vs Ontologies": clears up one of the most
// overloaded terms in data & AI. Walks the spectrum from tags to formal ontologies,
// contrasts a BI-style semantic model against a formal OWL ontology using the same
// org-chart example (with a live "run the reasoner" inference animation), a side-by-side
// comparison table, a sort-the-real-world classification game, then a gated quiz.
import { spectrumStages, orgChartExample, comparisonRows, classificationItems, semanticQuiz } from '../data/semantic-models.js';
import { renderGraph } from '../graph-svg.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mount(container, api) {
  let reasonerRun = false;
  let placedCount = 0;
  const placedIds = new Set();

  container.innerHTML = `
    <div class="card">
      <h3>One Term, Many Meanings: What Is a "Semantic Model"?</h3>
      <p>In data & AI conversations, "semantic model" gets used two very different ways: sometimes loosely, for <em>any</em> structure that adds meaning to raw data (a BI report model, an ER diagram, even a glossary) — and sometimes as shorthand for a formal <strong>ontology</strong>. They overlap, but they are not the same thing. This level draws a precise line between them.</p>
    </div>

    <div class="card">
      <h3>The Spectrum of Semantic Precision</h3>
      <p>Click each stage below. Every stage keeps the structure of the one before it and adds one new capability — from a bare hashtag all the way to machine-checkable logic.</p>
      <div class="pipeline sem-spectrum" id="sem-spectrum"></div>
      <div class="pipeline-caption" id="sem-spectrum-caption"></div>
    </div>

    <div class="card">
      <h3>Same World, Two Models: An Org Chart</h3>
      <p>Here is the exact same fact pattern — an employee, a team, and a department — modeled two ways. Try running the reasoner on the ontology side.</p>
      <div class="sem-compare">
        <div class="sem-compare-col">
          <h4>📊 BI-Style Semantic Model</h4>
          <div id="sem-bi-tables"></div>
          <p class="sem-line"><strong>Relationship:</strong> ${orgChartExample.biModel.relationship}</p>
          <p class="sem-line"><strong>Measure:</strong> <code>${orgChartExample.biModel.measure}</code></p>
          <p class="sem-caption">${orgChartExample.biModel.caption}</p>
        </div>
        <div class="sem-compare-col">
          <h4>🧠 Formal Ontology</h4>
          <div class="graph-wrap" id="sem-onto-graph"></div>
          <div class="hop-controls">
            <button class="btn btn-primary" id="btn-run-reasoner">▶ Run Reasoner</button>
            <span class="hop-step-label" id="reasoner-status">Two facts are stated. Run the reasoner to see what it infers.</span>
          </div>
          <p class="sem-axiom" id="sem-axiom" hidden>⚙️ ${orgChartExample.ontology.axiom}</p>
          <p class="sem-caption">${orgChartExample.ontology.caption}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Side-by-Side Comparison</h3>
      <div class="table-scroll">
        <table class="sem-table">
          <thead>
            <tr><th>Aspect</th><th>Taxonomy</th><th>BI-Style Semantic Model</th><th>Formal Ontology</th></tr>
          </thead>
          <tbody id="sem-table-body"></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Sort the Real World</h3>
      <p>Click an item, then click the bucket it belongs in. Sort all ${classificationItems.length} to unlock the quiz.</p>
      <div class="item-pool" id="sem-item-pool"></div>
      <div class="bucket-row">
        <div class="bucket-box" data-bucket="semantic">
          <h4>📊 Semantic Model <small>(informal / BI-style)</small></h4>
          <div class="bucket-list" id="bucket-semantic-list"></div>
        </div>
        <div class="bucket-box" data-bucket="ontology">
          <h4>🧠 Formal Ontology</h4>
          <div class="bucket-list" id="bucket-ontology-list"></div>
        </div>
      </div>
    </div>

    <div class="card" id="sem-quiz" hidden>
      <h3>Quick Check</h3>
      <div id="sem-quiz-body"></div>
    </div>
  `;

  // ================= Spectrum stepper =================
  const spectrumEl = container.querySelector('#sem-spectrum');
  const captionEl = container.querySelector('#sem-spectrum-caption');
  spectrumStages.forEach((stage, i) => {
    const stageEl = document.createElement('div');
    stageEl.className = 'pipeline-stage sem-stage';
    stageEl.dataset.stageId = stage.id;
    stageEl.innerHTML = `<div class="ps-icon">${stage.icon}</div><div class="ps-label">${stage.label}</div>`;
    stageEl.addEventListener('click', () => selectStage(stage.id));
    spectrumEl.appendChild(stageEl);
    if (i < spectrumStages.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'pipeline-arrow';
      arrow.textContent = '→';
      spectrumEl.appendChild(arrow);
    }
  });
  function selectStage(id) {
    const stage = spectrumStages.find(s => s.id === id);
    spectrumEl.querySelectorAll('.sem-stage').forEach(el => el.classList.toggle('active', el.dataset.stageId === id));
    captionEl.innerHTML = `<strong>${stage.label}:</strong> ${stage.detail}`;
  }
  selectStage(spectrumStages[0].id);

  // ================= BI-style table mockup =================
  const biTablesEl = container.querySelector('#sem-bi-tables');
  biTablesEl.innerHTML = orgChartExample.biModel.tables.map(t => `
    <div class="bi-table-mockup">
      <div class="bi-table-name">🗄 ${t.name}</div>
      <ul class="bi-table-cols">${t.columns.map(c => `<li>${c}</li>`).join('')}</ul>
    </div>
  `).join('');

  // ================= Ontology graph + reasoner =================
  const ontoGraphEl = container.querySelector('#sem-onto-graph');
  const baseGraph = orgChartExample.ontology.graph;
  renderGraph(ontoGraphEl, baseGraph, { width: 600, height: 220 });

  const reasonerBtn = container.querySelector('#btn-run-reasoner');
  const reasonerStatus = container.querySelector('#reasoner-status');
  const axiomEl = container.querySelector('#sem-axiom');
  reasonerBtn.addEventListener('click', () => {
    if (reasonerRun) return;
    reasonerRun = true;
    const extendedGraph = {
      nodes: baseGraph.nodes,
      edges: [...baseGraph.edges, orgChartExample.ontology.inferredEdge]
    };
    const handles = renderGraph(ontoGraphEl, extendedGraph, { width: 600, height: 220 });
    const inferredIdx = extendedGraph.edges.length - 1;
    const inferredG = handles.edgeEls[inferredIdx];
    if (inferredG) inferredG.classList.add('inferred', 'anim-pop');
    [baseGraph.nodes[0].id, baseGraph.nodes[2].id].forEach(id => {
      const n = handles.nodeEls[id];
      if (n) n.classList.add('highlight');
    });
    axiomEl.hidden = false;
    reasonerStatus.textContent = '✅ Inferred: "Ada worksIn Engineering" — never stated, logically derived.';
    reasonerBtn.disabled = true;
  });

  // ================= Comparison table =================
  const tableBody = container.querySelector('#sem-table-body');
  tableBody.innerHTML = comparisonRows.map(r => `
    <tr><td>${r.aspect}</td><td>${r.taxonomy}</td><td>${r.biModel}</td><td>${r.ontology}</td></tr>
  `).join('');

  // ================= Classification ("sort the real world") game =================
  const pool = container.querySelector('#sem-item-pool');
  const bucketSemanticList = container.querySelector('#bucket-semantic-list');
  const bucketOntologyList = container.querySelector('#bucket-ontology-list');
  let selectedItem = null;

  shuffle(classificationItems).forEach(item => {
    const chip = document.createElement('button');
    chip.className = 'item-chip';
    chip.dataset.id = item.id;
    chip.textContent = item.text;
    chip.addEventListener('click', () => {
      if (chip.classList.contains('placed')) return;
      pool.querySelectorAll('.item-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedItem = item;
    });
    pool.appendChild(chip);
  });

  container.querySelectorAll('.bucket-box').forEach(box => {
    box.addEventListener('click', () => {
      if (!selectedItem) return;
      const chip = pool.querySelector(`.item-chip[data-id="${CSS.escape(selectedItem.id)}"]`);
      if (selectedItem.bucket === box.dataset.bucket) {
        chip.classList.add('placed');
        chip.classList.remove('selected');
        const list = box.dataset.bucket === 'semantic' ? bucketSemanticList : bucketOntologyList;
        const li = document.createElement('div');
        li.className = 'bucket-item anim-pop';
        li.textContent = `✓ ${selectedItem.text}`;
        list.appendChild(li);
        placedIds.add(selectedItem.id);
        placedCount++;
        selectedItem = null;
        if (placedCount === classificationItems.length) maybeShowQuiz();
      } else {
        box.classList.add('shake');
        if (chip) chip.classList.add('shake');
        setTimeout(() => {
          box.classList.remove('shake');
          if (chip) chip.classList.remove('shake');
        }, 400);
      }
    });
  });

  // ================= Gated quiz =================
  const quizCard = container.querySelector('#sem-quiz');
  function maybeShowQuiz() {
    if (quizCard.hidden) {
      quizCard.hidden = false;
      renderQuiz();
      quizCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQuiz() {
    const body = quizCard.querySelector('#sem-quiz-body');
    body.innerHTML = '';
    const answers = new Array(semanticQuiz.length).fill(null);
    const hintsUsed = new Set();

    semanticQuiz.forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-q';
      qDiv.innerHTML = `
        <div class="qtext-row">
          <p class="qtext">${qi + 1}. ${q.q}</p>
          <button class="hint-btn" id="sem-hint-btn-${qi}">💡 Hint</button>
        </div>
        <div class="hint-box" id="sem-hint-box-${qi}" hidden></div>
        <div class="quiz-options"></div>
      `;
      const optsDiv = qDiv.querySelector('.quiz-options');
      q.options.forEach((opt, oi) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          if (answers[qi] !== null) return;
          answers[qi] = oi;
          const correct = oi === q.answer;
          btn.classList.add(correct ? 'correct' : 'wrong');
          [...optsDiv.children].forEach(c => c.classList.add('disabled'));
          const hintBtn = qDiv.querySelector(`#sem-hint-btn-${qi}`);
          if (hintBtn) hintBtn.disabled = true;
          if (!correct) optsDiv.children[q.answer].classList.add('correct');
          checkDone();
        });
        optsDiv.appendChild(btn);
      });
      body.appendChild(qDiv);

      const hintBtn = qDiv.querySelector(`#sem-hint-btn-${qi}`);
      const hintBox = qDiv.querySelector(`#sem-hint-box-${qi}`);
      hintBtn.addEventListener('click', () => {
        hintBox.hidden = false;
        hintBox.textContent = `💡 ${q.hint}`;
        hintBtn.disabled = true;
        hintsUsed.add(qi);
      });
    });

    function checkDone() {
      if (answers.every(a => a !== null)) {
        const correctCount = answers.filter((a, i) => a === semanticQuiz[i].answer).length;
        const rawScore = Math.round((correctCount / semanticQuiz.length) * 100);
        const penalty = Math.min(rawScore, hintsUsed.size * 5);
        const score = Math.max(0, rawScore - penalty);
        let badge = null;
        if (score === 100) {
          const added = api.badge('semantic-analyst', 'Semantic Analyst', '🔬');
          if (added) badge = { name: 'Semantic Analyst', icon: '🔬' };
        }
        api.complete(score, {
          heading: (correctCount === semanticQuiz.length && hintsUsed.size === 0) ? '🎉 Perfect run!' : '✅ Quiz complete',
          detail: `${correctCount}/${semanticQuiz.length} correct${hintsUsed.size ? ` · ${hintsUsed.size} hint${hintsUsed.size === 1 ? '' : 's'} used` : ''} — you can now tell a BI-style semantic model from a formal ontology, and explain why only one of them reasons.`,
          badge,
          recap: spectrumStages.map(s => ({ title: s.label, body: s.short }))
        });
      }
    }
  }
}
