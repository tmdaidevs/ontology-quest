// level8-enterprise.js — "Enterprise Case Studies": real-world knowledge graph deployments
// at scale (Google, Amazon, LinkedIn, healthcare, Microsoft, Palantir). A log-scale size
// comparison, six expandable case-study cards with mini "ontology snapshot" diagrams, and
// a gated multi-question quiz.
import { caseStudies, caseStudyQuiz, scaleAtAGlance } from '../data/case-studies.js';
import { renderGraph, hubSpokeLayout } from '../graph-svg.js';
import { animateCountTargets } from '../ui-utils.js';

export function mount(container, api) {
  const opened = new Set();

  container.innerHTML = `
    <div class="card">
      <h3>Knowledge Graphs at Enterprise Scale</h3>
      <p>Ontologies aren't just a classroom exercise — they run some of the biggest platforms on Earth. Expand each case study below to see how real organizations model their world, then take the quiz to earn a badge.</p>
    </div>

    <div class="card">
      <h3>Scale at a Glance</h3>
      <p class="scale-caption">Bars use a <strong>log scale</strong> — each gridline is 10&times; the previous one, so a short-looking bar can still mean tens of millions. Amazon, Microsoft, and Palantir aren't plotted here because none of them publish one precise, comparable entity count — see their case studies below for why that itself is a real design pattern.</p>
      <div class="scale-chart" id="scale-chart"></div>
    </div>

    <div class="card">
      <h3>Explore the Case Studies</h3>
      <p>Click each card to expand its story, key stats, and a small "ontology snapshot" showing how it's actually modeled as classes and relationships.</p>
      <div id="cs-accordion"></div>
    </div>

    <div class="card" id="cs-quiz" hidden>
      <h3>Quick Check</h3>
      <div id="cs-quiz-body"></div>
    </div>
  `;

  // ================= Scale at a glance (log-scale bar chart) =================
  const chartEl = container.querySelector('#scale-chart');
  const { domainMinLog, domainMaxLog, entries } = scaleAtAGlance;
  chartEl.innerHTML = entries.map(e => {
    const pct = Math.max(2, Math.min(100, ((Math.log10(e.value) - domainMinLog) / (domainMaxLog - domainMinLog)) * 100));
    return `
      <div class="scale-row">
        <span class="scale-label">${e.label}</span>
        <div class="scale-track">
          <div class="scale-fill" data-pct="${pct}" style="width:0%">
            <span class="scale-value">${e.display}</span>
          </div>
        </div>
      </div>`;
  }).join('');
  // Grow bars on the next paint so the 0% -> target% width change actually transitions.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      chartEl.querySelectorAll('.scale-fill').forEach(fill => {
        fill.style.width = `${fill.dataset.pct}%`;
      });
    });
  });

  // ================= Case-study accordion =================
  const accordion = container.querySelector('#cs-accordion');
  caseStudies.forEach(cs => {
    const item = document.createElement('div');
    item.className = 'accordion-item cs-item';

    const statsHtml = cs.stats && cs.stats.length
      ? `<div class="cs-stats">${cs.stats.map(s => `
          <div class="cs-stat">
            <span class="cs-stat-num count-target" data-target="${s.target}" data-suffix="${s.suffix}">0</span>
            <span class="cs-stat-label">${s.label}</span>
          </div>`).join('')}</div>`
      : (cs.qualStat
          ? `<div class="cs-stats"><div class="cs-stat"><span class="cs-stat-num">${cs.qualStat.display}</span><span class="cs-stat-label">${cs.qualStat.label}</span></div></div>`
          : '');
    const tagsHtml = cs.techStack.map(t => `<span class="cs-tag">${t}</span>`).join('');

    item.innerHTML = `
      <div class="accordion-head cs-head">
        <span class="cs-glyph">${cs.glyph}</span>
        <span class="cs-head-text"><strong>${cs.name}</strong><br><span class="cs-tagline">${cs.tagline}</span></span>
        <span class="chev">▾</span>
      </div>
      <div class="accordion-body cs-body">
        ${statsHtml}
        <p>${cs.narrative}</p>
        <div class="graph-wrap cs-diagram"></div>
        <div class="cs-tags">${tagsHtml}</div>
      </div>
    `;

    item.querySelector('.accordion-head').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.classList.toggle('open');
      if (!wasOpen) {
        opened.add(cs.id);
        const diagramEl = item.querySelector('.cs-diagram');
        if (!diagramEl.dataset.rendered) {
          const graph = hubSpokeLayout(cs.schema.hub, cs.schema.spokes, { width: 500, height: 200 });
          renderGraph(diagramEl, graph, { width: 500, height: 200 });
          diagramEl.dataset.rendered = '1';
        }
        if (!item.dataset.counted) {
          item.dataset.counted = '1';
          animateCountTargets(item, { duration: 900 });
        }
        maybeShowQuiz();
      }
    });
    accordion.appendChild(item);
  });

  // ================= Gated quiz =================
  const quizCard = container.querySelector('#cs-quiz');
  function maybeShowQuiz() {
    if (opened.size === caseStudies.length && quizCard.hidden) {
      quizCard.hidden = false;
      renderQuiz();
      quizCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQuiz() {
    const body = quizCard.querySelector('#cs-quiz-body');
    body.innerHTML = '';
    const answers = new Array(caseStudyQuiz.length).fill(null);
    const hintsUsed = new Set();

    caseStudyQuiz.forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-q';
      qDiv.innerHTML = `
        <div class="qtext-row">
          <p class="qtext">${qi + 1}. ${q.q}</p>
          <button class="hint-btn" id="cs-hint-btn-${qi}">💡 Hint</button>
        </div>
        <div class="hint-box" id="cs-hint-box-${qi}" hidden></div>
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
          const hintBtn = qDiv.querySelector(`#cs-hint-btn-${qi}`);
          if (hintBtn) hintBtn.disabled = true;
          if (!correct) optsDiv.children[q.answer].classList.add('correct');
          checkDone();
        });
        optsDiv.appendChild(btn);
      });
      body.appendChild(qDiv);

      const hintBtn = qDiv.querySelector(`#cs-hint-btn-${qi}`);
      const hintBox = qDiv.querySelector(`#cs-hint-box-${qi}`);
      hintBtn.addEventListener('click', () => {
        hintBox.hidden = false;
        hintBox.textContent = `💡 ${q.hint}`;
        hintBtn.disabled = true;
        hintsUsed.add(qi);
      });
    });

    function checkDone() {
      if (answers.every(a => a !== null)) {
        const correctCount = answers.filter((a, i) => a === caseStudyQuiz[i].answer).length;
        const rawScore = Math.round((correctCount / caseStudyQuiz.length) * 100);
        const penalty = Math.min(rawScore, hintsUsed.size * 5);
        const score = Math.max(0, rawScore - penalty);
        let badge = null;
        if (score === 100) {
          const added = api.badge('enterprise-analyst', 'Enterprise Analyst', '🏢');
          if (added) badge = { name: 'Enterprise Analyst', icon: '🏢' };
        }
        api.complete(score, {
          heading: (correctCount === caseStudyQuiz.length && hintsUsed.size === 0) ? '🎉 Perfect run!' : '✅ Quiz complete',
          detail: `${correctCount}/${caseStudyQuiz.length} correct${hintsUsed.size ? ` · ${hintsUsed.size} hint${hintsUsed.size === 1 ? '' : 's'} used` : ''} — you've toured six production knowledge graphs, from Google's knowledge panels to Palantir's Ontology.`,
          badge,
          recap: caseStudies.map(cs => ({ title: cs.name, body: cs.tagline }))
        });
      }
    }
  }
}
