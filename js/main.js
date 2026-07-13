// main.js — app shell: navigation, level map rendering, progress display, level mounting.
import * as progress from './progress.js';
import { animateCount, animateCountTargets } from './ui-utils.js';
import { openIntro, initIntro } from './intro.js';

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
document.getElementById('btn-intro').addEventListener('click', () => openIntro());
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
const mountedModules = {}; // num -> imported level module (used by Replay to re-mount without re-importing)

/** Builds the { complete, badge } API object handed to each level module's mount(). */
function buildApi(num) {
  return {
    complete: (score, meta) => {
      progress.completeLevel(num, score, TOTAL_LEVELS);
      updateTopbar();
      showToast(`Level ${num} complete! Score: ${Math.round(score)}/100`);
      showResults(num, score, meta || {});
    },
    badge: (id, name, icon) => {
      const added = progress.addBadge(id, name, icon);
      if (added) showToast(`🏅 Badge earned: ${name}`);
      updateTopbar();
      return added;
    }
  };
}

async function openLevel(num) {
  const body = document.getElementById(`level-${num}-body`);
  const bar = document.getElementById(`level-${num}-next`);
  showScreen(`level-${num}`);
  if (!mountedLevels.has(num)) {
    body.hidden = false;
    bar.hidden = true;
    bar.innerHTML = '';
    body.innerHTML = '<p style="color:var(--text-2)">Loading…</p>';
    try {
      const mod = await levelLoaders[num]();
      body.innerHTML = '';
      mod.mount(body, buildApi(num));
      mountedLevels.add(num);
      mountedModules[num] = mod;
    } catch (err) {
      console.error('Failed to load level', num, err);
      body.innerHTML = `<p style="color:var(--danger)">Failed to load this level. Please refresh and try again.</p>`;
    }
  }
  // If already mounted this session, leave body/bar state untouched — this naturally
  // re-shows either the in-progress body (not yet completed) or the last results panel
  // (already completed), whichever was left showing.
}

/** Re-mounts a level's module fresh into its body, for the results panel's "Replay" button. */
function replay(num) {
  const body = document.getElementById(`level-${num}-body`);
  const bar = document.getElementById(`level-${num}-next`);
  const mod = mountedModules[num];
  if (!mod) return;
  bar.hidden = true;
  bar.innerHTML = '';
  body.hidden = false;
  body.innerHTML = '';
  mod.mount(body, buildApi(num));
}

/**
 * Renders the unified results panel after a level is completed: hides the interactive
 * level body and shows only a score readout + optional badge/recap/checklist + actions
 * (Replay, Start Next Level, Level Map) — per the "just show results" flow.
 */
function showResults(num, score, meta) {
  const body = document.getElementById(`level-${num}-body`);
  const bar = document.getElementById(`level-${num}-next`);
  if (!bar) return;
  body.hidden = true;

  const isLastGraded = num >= TOTAL_LEVELS;
  const nextMeta = levelMeta.find(m => m.num === num + 1);
  const heading = meta.heading || 'Level complete';
  const detail = meta.detail || '';

  const badgeHtml = meta.badge
    ? `<div class="results-badge-row"><span class="badge-chip badge-pop">${meta.badge.icon} ${meta.badge.name} earned!</span></div>`
    : '';

  const recapHtml = (meta.recap && meta.recap.length)
    ? `<div class="results-recap">${meta.recap.map(r => `<div class="rc-item"><h4>${r.title}</h4><p>${r.body}</p></div>`).join('')}</div>`
    : '';

  const checklistHtml = (meta.checklist && meta.checklist.length)
    ? `<ul class="results-checklist">${meta.checklist.map(c => `<li class="${c.pass ? 'pass' : 'fail'}"><span class="cl-icon">${c.pass ? '✅' : '❌'}</span><span>${c.label}</span></li>`).join('')}</ul>`
    : '';

  const primaryNextBtn = !isLastGraded && nextMeta
    ? `<button class="btn btn-primary" id="btn-goto-next">Start: ${nextMeta.title} →</button>`
    : (num !== 6 ? `<button class="btn btn-primary" id="btn-goto-bonus">🌐 Try the Live Explorer →</button>` : '');

  bar.hidden = false;
  bar.classList.remove('pop-in');
  bar.innerHTML = `
    <div class="results-panel">
      <span class="tag-label">// Level ${num} — Results</span>
      <div class="results-score-row">
        <div>
          <h3>${heading}</h3>
          <p class="results-detail">${detail}</p>
        </div>
        <div class="results-score"><span class="count-target" data-target="${Math.max(0, Math.min(100, Math.round(score)))}">0</span><span class="results-score-max">/100</span></div>
      </div>
      ${badgeHtml}
      ${recapHtml}
      ${checklistHtml}
      <div class="results-actions">
        <button class="btn btn-ghost" id="btn-replay">↺ Replay Level</button>
        ${primaryNextBtn}
        <button class="btn btn-ghost" id="btn-goto-map">🗺️ Level Map</button>
      </div>
    </div>
  `;
  animateCountTargets(bar);
  // Force reflow so the pop-in animation class re-triggers even if the bar was already shown before.
  void bar.offsetWidth;
  bar.classList.add('pop-in');

  const nextBtn = bar.querySelector('#btn-goto-next');
  if (nextBtn) nextBtn.addEventListener('click', () => openLevel(num + 1));
  const bonusBtn = bar.querySelector('#btn-goto-bonus');
  if (bonusBtn) bonusBtn.addEventListener('click', () => openLevel(6));
  bar.querySelector('#btn-replay').addEventListener('click', () => replay(num));
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
initIntro({ onFinish: () => navTo('map') });
