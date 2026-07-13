// level3-solutions.js — Match tool/standard to its best-fit use case, then show explainer cards.
import { toolPairs } from '../data/tools.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mount(container, api) {
  container.innerHTML = `
    <div class="card">
      <h3>Match the Tool to Its Use Case</h3>
      <p>Click a tool on the left, then click the matching use case on the right. Match all ${toolPairs.length} pairs to complete the level. Fewer mistakes = higher score.</p>
      <div class="match-grid">
        <div class="match-col" id="col-tools"></div>
        <div class="match-col" id="col-uses"></div>
      </div>
    </div>
    <div class="card" id="explainer-card" hidden>
      <h3>What You Learned</h3>
      <div class="tool-explainer" id="explainer-grid"></div>
      <div id="level3-result" style="margin-top:16px;"></div>
    </div>
  `;

  const colTools = container.querySelector('#col-tools');
  const colUses = container.querySelector('#col-uses');
  const shuffledTools = shuffle(toolPairs);
  const shuffledUses = shuffle(toolPairs);

  let selectedTool = null;
  let selectedUse = null;
  let matchedCount = 0;
  let mistakes = 0;

  shuffledTools.forEach(pair => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.id = pair.id;
    card.textContent = pair.tool;
    card.addEventListener('click', () => {
      if (card.classList.contains('matched')) return;
      colTools.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTool = pair.id;
      tryMatch();
    });
    colTools.appendChild(card);
  });

  shuffledUses.forEach(pair => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.id = pair.id;
    card.textContent = pair.useCase;
    card.addEventListener('click', () => {
      if (card.classList.contains('matched')) return;
      colUses.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedUse = pair.id;
      tryMatch();
    });
    colUses.appendChild(card);
  });

  function tryMatch() {
    if (selectedTool === null || selectedUse === null) return;
    const toolCard = colTools.querySelector(`[data-id="${CSS.escape(selectedTool)}"]`);
    const useCard = colUses.querySelector(`[data-id="${CSS.escape(selectedUse)}"]`);
    if (selectedTool === selectedUse) {
      toolCard.classList.add('matched');
      useCard.classList.add('matched');
      toolCard.classList.remove('selected');
      useCard.classList.remove('selected');
      matchedCount++;
      if (matchedCount === toolPairs.length) showExplainers();
    } else {
      mistakes++;
      [toolCard, useCard].forEach(c => {
        c.classList.add('shake');
        setTimeout(() => c.classList.remove('shake', 'selected'), 400);
      });
    }
    selectedTool = null;
    selectedUse = null;
  }

  function showExplainers() {
    const explCard = container.querySelector('#explainer-card');
    explCard.hidden = false;
    const grid = container.querySelector('#explainer-grid');
    toolPairs.forEach(p => {
      const div = document.createElement('div');
      div.className = 'te-card';
      div.innerHTML = `<h4>${p.tool}</h4><p>${p.explainer}</p>`;
      grid.appendChild(div);
    });
    const score = Math.max(20, 100 - mistakes * 8);
    container.querySelector('#level3-result').innerHTML = `
      <div class="completion-banner">
        <h3>${mistakes === 0 ? '🏆 Flawless Match!' : '✅ Level Complete'}</h3>
        <p class="score-line">Score: ${score} / 100 (${mistakes} mistake${mistakes === 1 ? '' : 's'})</p>
      </div>
    `;
    if (mistakes === 0) api.badge('perfect-matcher', 'Perfect Matcher', '🎯');
    api.complete(score);
    explCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
