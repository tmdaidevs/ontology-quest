// level10-bestpractices.js — "Best Practices & Anti-Patterns": a technically valid ontology can
// still be badly designed. Four core principles (each with a before/after example — the fourth
// also gets a hand-built hierarchy-vs-composition diagram), a structural guidance reference grid,
// an anti-pattern field guide, then a gated scenario-diagnosis quiz.
import { principles, structuralGuidance, antiPatterns, bestPracticesQuiz } from '../data/best-practices.js';
import { renderGraph } from '../graph-svg.js';

export function mount(container, api) {
  const opened = new Set();

  container.innerHTML = `
    <div class="card">
      <h3>A Valid Ontology Can Still Be a Bad One</h3>
      <p>Passing a validator's checklist — has classes, has relationships, no orphan nodes — doesn't mean an ontology is <em>well designed</em>. This level is a field guide to the modeling wisdom real enterprise ontology teams rely on: four core principles, structural guidance, and the anti-patterns to recognize and avoid. Expand each principle below, then take the quiz to earn a badge.</p>
    </div>

    <div class="card">
      <h3>Four Core Principles</h3>
      <p>Click each principle to see it illustrated with a concrete before/after example.</p>
      <div id="bp-accordion"></div>
    </div>

    <div class="card">
      <h3>Structural Guidance</h3>
      <p>Practical rules of thumb for shaping classes, properties, and relationships once the principles above are second nature.</p>
      <div class="tool-explainer" id="bp-structural-grid"></div>
    </div>

    <div class="card">
      <h3>Anti-Pattern Field Guide</h3>
      <p>Recognize these shapes in the wild — they're some of the most common ways ontologies go wrong in practice.</p>
      <div class="tool-explainer" id="bp-antipattern-grid"></div>
    </div>

    <div class="card" id="bp-quiz" hidden>
      <h3>Quick Check</h3>
      <div id="bp-quiz-body"></div>
    </div>
  `;

  // ================= Principle accordion =================
  const accordion = container.querySelector('#bp-accordion');
  principles.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'accordion-item bp-item';
    item.innerHTML = `
      <div class="accordion-head cs-head">
        <span class="cs-glyph">${i + 1}</span>
        <span class="cs-head-text"><strong>${p.title}</strong><br><span class="cs-tagline">${p.summary}</span></span>
        <span class="chev">▾</span>
      </div>
      <div class="accordion-body">
        <div class="sem-compare">
          <div class="sem-compare-col">
            <h4>Before: ${p.before.title}</h4>
            <p class="sem-caption">${p.before.body}</p>
          </div>
          <div class="sem-compare-col">
            <h4>After: ${p.after.title}</h4>
            <p class="sem-caption">${p.after.body}</p>
          </div>
        </div>
        <p class="sem-line" style="margin-top:14px;"><strong>Why it matters:</strong> ${p.why}</p>
        ${p.diagrams ? `
          <div class="sem-compare" style="margin-top:16px;">
            <div class="sem-compare-col">
              <h4>Diagram: Deep Hierarchy</h4>
              <div class="graph-wrap" id="bp-diagram-hierarchy"></div>
            </div>
            <div class="sem-compare-col">
              <h4>Diagram: Composition</h4>
              <div class="graph-wrap" id="bp-diagram-composition"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    item.querySelector('.accordion-head').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.classList.toggle('open');
      if (!wasOpen) {
        opened.add(p.id);
        if (p.diagrams && !item.dataset.rendered) {
          const hierEl = item.querySelector('#bp-diagram-hierarchy');
          const compEl = item.querySelector('#bp-diagram-composition');
          renderGraph(hierEl, p.diagrams.hierarchy, { width: p.diagrams.hierarchy.width, height: p.diagrams.hierarchy.height });
          renderGraph(compEl, p.diagrams.composition, { width: p.diagrams.composition.width, height: p.diagrams.composition.height });
          item.dataset.rendered = '1';
        }
        maybeShowQuiz();
      }
    });
    accordion.appendChild(item);
  });

  // ================= Structural guidance grid =================
  const structuralGrid = container.querySelector('#bp-structural-grid');
  structuralGrid.innerHTML = structuralGuidance.map(g => `
    <div class="te-card">
      <h4>${g.title}</h4>
      <p>${g.body}</p>
    </div>
  `).join('');

  // ================= Anti-pattern field guide =================
  const antiGrid = container.querySelector('#bp-antipattern-grid');
  antiGrid.innerHTML = antiPatterns.map(a => `
    <div class="te-card te-card-warn">
      <h4>${a.name}</h4>
      <p>${a.body}</p>
    </div>
  `).join('');

  // ================= Gated quiz =================
  const quizCard = container.querySelector('#bp-quiz');
  function maybeShowQuiz() {
    if (opened.size === principles.length && quizCard.hidden) {
      quizCard.hidden = false;
      renderQuiz();
      quizCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQuiz() {
    const body = quizCard.querySelector('#bp-quiz-body');
    body.innerHTML = '';
    const answers = new Array(bestPracticesQuiz.length).fill(null);
    const hintsUsed = new Set();

    bestPracticesQuiz.forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-q';
      qDiv.innerHTML = `
        <div class="qtext-row">
          <p class="qtext">${qi + 1}. ${q.q}</p>
          <button class="hint-btn" id="bp-hint-btn-${qi}">Hint</button>
        </div>
        <div class="hint-box" id="bp-hint-box-${qi}" hidden></div>
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
          const hintBtn = qDiv.querySelector(`#bp-hint-btn-${qi}`);
          if (hintBtn) hintBtn.disabled = true;
          if (!correct) optsDiv.children[q.answer].classList.add('correct');
          checkDone();
        });
        optsDiv.appendChild(btn);
      });
      body.appendChild(qDiv);

      const hintBtn = qDiv.querySelector(`#bp-hint-btn-${qi}`);
      const hintBox = qDiv.querySelector(`#bp-hint-box-${qi}`);
      hintBtn.addEventListener('click', () => {
        hintBox.hidden = false;
        hintBox.textContent = `${q.hint}`;
        hintBtn.disabled = true;
        hintsUsed.add(qi);
      });
    });

    function checkDone() {
      if (answers.every(a => a !== null)) {
        const correctCount = answers.filter((a, i) => a === bestPracticesQuiz[i].answer).length;
        const rawScore = Math.round((correctCount / bestPracticesQuiz.length) * 100);
        const penalty = Math.min(rawScore, hintsUsed.size * 5);
        const score = Math.max(0, rawScore - penalty);
        let badge = null;
        if (score === 100) {
          const added = api.badge('pattern-guardian', 'Pattern Guardian', '');
          if (added) badge = { name: 'Pattern Guardian', icon: '' };
        }
        api.complete(score, {
          heading: (correctCount === bestPracticesQuiz.length && hintsUsed.size === 0) ? 'Perfect run!' : 'Quiz complete',
          detail: `${correctCount}/${bestPracticesQuiz.length} correct${hintsUsed.size ? ` · ${hintsUsed.size} hint${hintsUsed.size === 1 ? '' : 's'} used` : ''} — you can now spot the difference between a valid ontology and a well-designed one.`,
          badge,
          recap: principles.map(p => ({ title: p.title, body: p.summary }))
        });
      }
    }
  }
}
