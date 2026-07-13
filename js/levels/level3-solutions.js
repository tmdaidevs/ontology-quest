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
    const score = Math.max(20, 100 - mistakes * 8);
    let badge = null;
    if (mistakes === 0) {
      const added = api.badge('perfect-matcher', 'Perfect Matcher', '🎯');
      if (added) badge = { name: 'Perfect Matcher', icon: '🎯' };
    }
    api.complete(score, {
      heading: mistakes === 0 ? '🏆 Flawless match!' : '✅ Level complete',
      detail: `${mistakes} mistake${mistakes === 1 ? '' : 's'} · all ${toolPairs.length} tools matched to their use case.`,
      badge,
      recap: toolPairs.map(p => ({ title: p.tool, body: p.explainer }))
    });
  }
}
