// main.js — app shell: navigation, level map rendering, progress display, level mounting.
import * as progress from './progress.js';

const TOTAL_LEVELS = 5;

const levelMeta = [
  { num: 1, id: 'level-1', icon: '📜', title: 'The History of Ontologies', desc: 'From Aristotle to GraphRAG — a timeline of ideas.' },
  { num: 2, id: 'level-2', icon: '🧩', title: 'Core Concepts', desc: 'Classes, triples, taxonomies, and why they matter.' },
  { num: 3, id: 'level-3', icon: '🛠️', title: 'Tools & Standards', desc: 'RDF, OWL, SPARQL, Neo4j, Wikidata & more.' },
  { num: 4, id: 'level-4', icon: '🔍', title: 'Multi-Hop Reasoning', desc: 'How graphs are queried, traversed & reasoned over.' },
  { num: 5, id: 'level-5', icon: '🏗️', title: 'Build Your Own Ontology', desc: 'Design a knowledge graph in a sandbox.' }
];

// Lazily import level modules only when needed to keep initial load light.
const levelLoaders = {
  1: () => import('./levels/level1-history.js'),
  2: () => import('./levels/level2-concepts.js'),
  3: () => import('./levels/level3-solutions.js'),
  4: () => import('./levels/level4-technical.js'),
  5: () => import('./levels/level5-sandbox.js')
};

const screens = {
  landing: document.getElementById('screen-landing'),
  map: document.getElementById('screen-map')
};
for (let i = 1; i <= TOTAL_LEVELS; i++) {
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

function updateTopbar() {
  document.getElementById('stat-score').textContent = progress.totalScore();
  document.getElementById('stat-badges').textContent = progress.getBadges().length;
}

function renderMap() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';
  levelMeta.forEach(meta => {
    const unlocked = progress.isUnlocked(meta.num);
    const completed = progress.isCompleted(meta.num);
    const score = progress.getScore(meta.num);
    const card = document.createElement('div');
    card.className = 'level-card' + (unlocked ? '' : ' locked');
    card.innerHTML = `
      <span class="lv-num">Level ${meta.num}</span>
      <span class="lv-icon">${unlocked ? meta.icon : '🔒'}</span>
      <h3>${meta.title}</h3>
      <p>${meta.desc}</p>
      <div class="lv-status">
        <span>${completed ? '✅ Completed' : (unlocked ? 'Ready to play' : 'Locked')}</span>
        ${completed ? `<span class="lv-score">${score}%</span>` : ''}
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
    ? badges.map(b => `<span class="badge-chip">${b.icon} ${b.name}</span>`).join('')
    : '<span style="color:var(--text-2)">No badges yet — complete levels perfectly to earn them!</span>';

  updateTopbar();
}

const mountedLevels = new Set();

async function openLevel(num) {
  const body = document.getElementById(`level-${num}-body`);
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

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Initial boot.
updateTopbar();
