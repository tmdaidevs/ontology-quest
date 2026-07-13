// main.js — app shell: navigation, level map rendering, progress display, level mounting.
import * as progress from './progress.js';
import { animateCount } from './ui-utils.js';

const TOTAL_LEVELS = 5;

const levelMeta = [
  { num: 1, id: 'level-1', icon: '📜', title: 'The History of Ontologies', desc: 'From Aristotle to GraphRAG — a timeline of ideas.' },
  { num: 2, id: 'level-2', icon: '🧩', title: 'Core Concepts', desc: 'Classes, triples, taxonomies, and why they matter.' },
  { num: 3, id: 'level-3', icon: '🛠️', title: 'Tools & Standards', desc: 'RDF, OWL, SPARQL, Neo4j, Wikidata & more.' },
  { num: 4, id: 'level-4', icon: '🔍', title: 'Multi-Hop Reasoning', desc: 'How graphs are queried, traversed & reasoned over.' },
  { num: 5, id: 'level-5', icon: '🏗️', title: 'Build Your Own Ontology', desc: 'Design a knowledge graph in a sandbox.' },
  { num: 6, id: 'level-6', icon: '🌐', title: 'Live Knowledge Graph Explorer', desc: 'Query real live data from Wikidata\'s public ontology.', bonus: true }
];

// Lazily import level modules only when needed to keep initial load light.
const levelLoaders = {
  1: () => import('./levels/level1-history.js'),
  2: () => import('./levels/level2-concepts.js'),
  3: () => import('./levels/level3-solutions.js'),
  4: () => import('./levels/level4-technical.js'),
  5: () => import('./levels/level5-sandbox.js'),
  6: () => import('./levels/level6-live.js')
};

const screens = {
  landing: document.getElementById('screen-landing'),
  map: document.getElementById('screen-map')
};
for (let i = 1; i <= 6; i++) {
  screens[`level-${i}`] = document.getElementById(`screen-level-${i}`);
}

function showScreen(name) {
  Object.values(screens).forEach(s => s && s.classList.remove('active'));
  if (screens[name]) screens[name].classList.add('active');
  document.getElementById('topbar-stats').hidden = name === 'landing';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navTo(name) {
  if (name === 'map') renderMap();
  showScreen(name);
}

document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', () => navTo(el.dataset.nav));
});
document.getElementById('btn-start').addEventListener('click', () => navTo('map'));
document.getElementById('btn-map').addEventListener('click', () => navTo('map'));
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('Reset all progress, scores, and badges? This cannot be undone.')) {
    progress.resetProgress();
    updateTopbar();
    renderMap();
    showToast('Progress reset.');
  }
});

let lastKnownScore = 0;
function updateTopbar() {
  const scoreEl = document.getElementById('stat-score');
  const newScore = progress.totalScore();
  if (newScore !== lastKnownScore) {
    animateCount(scoreEl, newScore, { from: lastKnownScore, duration: 700 });
    lastKnownScore = newScore;
  } else {
    scoreEl.textContent = newScore;
  }
  document.getElementById('stat-badges').textContent = progress.getBadges().length;
}

function renderMap() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';
  levelMeta.forEach((meta, i) => {
    const unlocked = meta.bonus ? true : progress.isUnlocked(meta.num);
    const completed = progress.isCompleted(meta.num);
    const score = progress.getScore(meta.num);
    const card = document.createElement('div');
    card.className = 'level-card' + (unlocked ? '' : ' locked') + (meta.bonus ? ' bonus-card' : '');
    card.style.animationDelay = `${i * 70}ms`;
    card.innerHTML = `
      ${meta.bonus ? '<span class="lv-num bonus-tag">✨ Bonus</span>' : `<span class="lv-num">Level ${meta.num}</span>`}
      <span class="lv-icon">${unlocked ? meta.icon : '🔒'}</span>
      <h3>${meta.title}</h3>
      <p>${meta.desc}</p>
      <div class="lv-status">
        <span>${meta.bonus ? (completed ? '✅ Explored' : 'Explore anytime') : (completed ? '✅ Completed' : (unlocked ? 'Ready to play' : 'Locked'))}</span>
        ${completed && !meta.bonus ? `<span class="lv-score">${score}%</span>` : ''}
      </div>
    `;
    if (unlocked) {
      card.addEventListener('click', () => openLevel(meta.num));
    }
    grid.appendChild(card);
  });

  const badgeShelf = document.getElementById('badge-shelf');
  const badges = progress.getBadges();
  badgeShelf.innerHTML = badges.length
    ? badges.map((b, i) => `<span class="badge-chip badge-pop" style="animation-delay:${i * 60}ms">${b.icon} ${b.name}</span>`).join('')
    : '<span style="color:var(--text-2)">No badges yet — complete levels perfectly to earn them!</span>';

  updateTopbar();
}

const mountedLevels = new Set();

async function openLevel(num) {
  const body = document.getElementById(`level-${num}-body`);
  const nextBar = document.getElementById(`level-${num}-next`);
  if (nextBar) { nextBar.hidden = true; nextBar.innerHTML = ''; }
  showScreen(`level-${num}`);
  if (!mountedLevels.has(num)) {
    body.innerHTML = '<p style="color:var(--text-2)">Loading…</p>';
    try {
      const mod = await levelLoaders[num]();
      body.innerHTML = '';
      mod.mount(body, {
        complete: (score) => {
          progress.completeLevel(num, score, TOTAL_LEVELS);
          updateTopbar();
          showToast(`Level ${num} complete! Score: ${Math.round(score)}/100`);
          showNextBar(num);
        },
        badge: (id, name, icon) => {
          const added = progress.addBadge(id, name, icon);
          if (added) showToast(`🏅 Badge earned: ${name}`);
          updateTopbar();
        }
      });
      mountedLevels.add(num);
    } catch (err) {
      console.error('Failed to load level', num, err);
      body.innerHTML = `<p style="color:var(--danger)">Failed to load this level. Please refresh and try again.</p>`;
    }
  }
}

function showNextBar(num) {
  const bar = document.getElementById(`level-${num}-next`);
  if (!bar) return;
  const isLastGraded = num >= TOTAL_LEVELS;
  const nextMeta = levelMeta.find(m => m.num === num + 1);
  bar.hidden = false;
  bar.classList.remove('pop-in');
  bar.innerHTML = `
    <div class="next-bar-inner">
      <span class="next-bar-msg">🎉 Level ${num} complete!</span>
      <div class="next-bar-actions">
        ${!isLastGraded && nextMeta ? `<button class="btn btn-primary" id="btn-goto-next">Next: ${nextMeta.title} →</button>` : `<button class="btn btn-primary" id="btn-goto-bonus">🌐 Try the Live Explorer →</button>`}
        <button class="btn btn-ghost" id="btn-goto-map">🗺️ Level Map</button>
      </div>
    </div>
  `;
  // Force reflow so the animation class re-triggers even if the bar was already shown before.
  void bar.offsetWidth;
  bar.classList.add('pop-in');

  const nextBtn = bar.querySelector('#btn-goto-next');
  if (nextBtn) nextBtn.addEventListener('click', () => openLevel(num + 1));
  const bonusBtn = bar.querySelector('#btn-goto-bonus');
  if (bonusBtn) bonusBtn.addEventListener('click', () => openLevel(6));
  bar.querySelector('#btn-goto-map').addEventListener('click', () => navTo('map'));
  bar.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Initial boot.
lastKnownScore = progress.totalScore();
updateTopbar();
