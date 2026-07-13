// level1-history.js — Interactive timeline + quiz on the history of ontologies.
import { timelineEvents, historyQuiz } from '../data/timeline.js';
import { animateCountTargets } from '../ui-utils.js';

export function mount(container, api) {
  const viewed = new Set();
  container.innerHTML = `
    <div class="card">
      <h3>A Journey Through Time</h3>
      <p>Click each node on the timeline to reveal its story. Once you've explored all of them, a short quiz will unlock.</p>
      <div class="timeline">
        <div class="timeline-track" id="tl-track"></div>
      </div>
    </div>
    <div class="card" id="quiz-card" hidden></div>
  `;

  const track = container.querySelector('#tl-track');
  timelineEvents.forEach((ev, i) => {
    const node = document.createElement('div');
    node.className = 'timeline-node';
    node.dataset.id = ev.id;
    node.innerHTML = `
      <div class="dot"></div>
      <div class="tn-year">${ev.year}</div>
      <div class="tn-title">${ev.title}</div>
      <div class="tn-panel">${ev.text}</div>
    `;
    node.addEventListener('click', () => {
      const wasActive = node.classList.contains('active');
      track.querySelectorAll('.timeline-node').forEach(n => n.classList.remove('active'));
      if (!wasActive) node.classList.add('active');
      node.classList.add('viewed');
      viewed.add(ev.id);
      maybeShowQuiz();
    });
    track.appendChild(node);
  });

  const quizCard = container.querySelector('#quiz-card');

  function maybeShowQuiz() {
    if (viewed.size === timelineEvents.length && quizCard.hidden) {
      quizCard.hidden = false;
      renderQuiz();
      quizCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQuiz() {
    quizCard.innerHTML = `<h3>Quick Check</h3><div id="quiz-body"></div>`;
    const body = quizCard.querySelector('#quiz-body');
    const answers = new Array(historyQuiz.length).fill(null);
    const hintsUsed = new Set();

    historyQuiz.forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-q';
      qDiv.innerHTML = `
        <div class="qtext-row">
          <p class="qtext">${qi + 1}. ${q.q}</p>
          ${q.hint ? `<button class="hint-btn" id="hint-btn-${qi}">💡 Hint</button>` : ''}
        </div>
        <div class="hint-box" id="hint-box-${qi}" hidden></div>
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
          const hintBtn = qDiv.querySelector(`#hint-btn-${qi}`);
          if (hintBtn) hintBtn.disabled = true;
          if (!correct) {
            optsDiv.children[q.answer].classList.add('correct');
          }
          checkDone();
        });
        optsDiv.appendChild(btn);
      });
      body.appendChild(qDiv);

      if (q.hint) {
        const hintBtn = qDiv.querySelector(`#hint-btn-${qi}`);
        const hintBox = qDiv.querySelector(`#hint-box-${qi}`);
        hintBtn.addEventListener('click', () => {
          hintBox.hidden = false;
          hintBox.textContent = `💡 ${q.hint}`;
          hintBtn.disabled = true;
          hintsUsed.add(qi);
        });
      }
    });

    const resultDiv = document.createElement('div');
    resultDiv.id = 'quiz-result';
    resultDiv.style.marginTop = '16px';
    body.appendChild(resultDiv);

    function checkDone() {
      if (answers.every(a => a !== null)) {
        const correctCount = answers.filter((a, i) => a === historyQuiz[i].answer).length;
        const rawScore = Math.round((correctCount / historyQuiz.length) * 100);
        const penalty = Math.min(rawScore, hintsUsed.size * 5);
        const score = Math.max(0, rawScore - penalty);
        resultDiv.innerHTML = `
          <div class="completion-banner">
            <h3>${correctCount === historyQuiz.length && hintsUsed.size === 0 ? '🎉 Perfect!' : '✅ Level Complete'}</h3>
            <p class="score-line">Score: <span class="count-target" data-target="${score}">0</span> / 100 (${correctCount}/${historyQuiz.length} correct${hintsUsed.size ? `, ${hintsUsed.size} hint${hintsUsed.size === 1 ? '' : 's'} used` : ''})</p>
            <p>You've traced ontologies from Aristotle to GraphRAG!</p>
          </div>
        `;
        animateCountTargets(resultDiv);
        if (score === 100) api.badge('history-scholar', 'History Scholar', '📜');
        api.complete(score);
      }
    }
  }
}
