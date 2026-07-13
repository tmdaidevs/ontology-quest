// level1-history.js — Interactive timeline + quiz on the history of ontologies.
import { timelineEvents, historyQuiz } from '../data/timeline.js';

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

    historyQuiz.forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-q';
      qDiv.innerHTML = `<p class="qtext">${qi + 1}. ${q.q}</p><div class="quiz-options"></div>`;
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
          if (!correct) {
            optsDiv.children[q.answer].classList.add('correct');
          }
          checkDone();
        });
        optsDiv.appendChild(btn);
      });
      body.appendChild(qDiv);
    });

    const resultDiv = document.createElement('div');
    resultDiv.id = 'quiz-result';
    resultDiv.style.marginTop = '16px';
    body.appendChild(resultDiv);

    function checkDone() {
      if (answers.every(a => a !== null)) {
        const correctCount = answers.filter((a, i) => a === historyQuiz[i].answer).length;
        const score = Math.round((correctCount / historyQuiz.length) * 100);
        resultDiv.innerHTML = `
          <div class="completion-banner">
            <h3>${correctCount === historyQuiz.length ? '🎉 Perfect!' : '✅ Level Complete'}</h3>
            <p class="score-line">Score: ${score} / 100 (${correctCount}/${historyQuiz.length} correct)</p>
            <p>You've traced ontologies from Aristotle to GraphRAG!</p>
          </div>
        `;
        if (score === 100) api.badge('history-scholar', 'History Scholar', '📜');
        api.complete(score);
      }
    }
  }
}
