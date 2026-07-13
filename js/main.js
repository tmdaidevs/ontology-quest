// main.js — app shell: navigation, level map rendering, progress display, level mounting.
import * as progress from './progress.js';
import { animateCount, animateCountTargets } from './ui-utils.js';
import { openIntro, initIntro } from './intro.js';
import { sfx, isMuted, toggleMuted } from './sound.js';
import { burstConfetti } from './confetti.js';
import { mount as mountDaily } from './daily-challenge.js';
import { init as initBgConstellation, start as startBgConstellation, stop as stopBgConstellation } from './bg-constellation.js';
import { downloadShareCard } from './share-card.js';
import { openCertificateModal, coreLevelsComplete } from './certificate.js';

const TOTAL_LEVELS = 5;

const levelMeta = [
  { num: 1, id: 'level-1', title: 'The History of Ontologies', desc: 'From Aristotle to GraphRAG — a timeline of ideas.' },
  { num: 2, id: 'level-2', title: 'Core Concepts', desc: 'Classes, triples, taxonomies, and why they matter.' },
  { num: 3, id: 'level-3', title: 'Tools & Standards', desc: 'RDF, OWL, SPARQL, Neo4j, Wikidata & more.' },
  { num: 4, id: 'level-4', title: 'Multi-Hop Reasoning', desc: 'How graphs are queried, traversed & reasoned over.' },
  { num: 5, id: 'level-5', title: 'Build Your Own Ontology', desc: 'Design a knowledge graph in a sandbox.' },
  { num: 6, id: 'level-6', title: 'Live Knowledge Graph Explorer', desc: 'Query real live data from Wikidata\'s public ontology.', bonus: true },
  { num: 7, id: 'level-7', title: 'Algorithms Visualized', desc: 'Watch BFS, DFS, embedding search & GraphRAG animated step-by-step.', bonus: true },
  { num: 8, id: 'level-8', title: 'Enterprise Case Studies', desc: 'How Google, Amazon, LinkedIn, healthcare, Microsoft & Palantir use knowledge graphs at scale.', bonus: true }
];

// Lazily import level modules only when needed to keep initial load light.
const levelLoaders = {
  1: () => import('./levels/level1-history.js'),
  2: () => import('./levels/level2-concepts.js'),
  3: () => import('./levels/level3-solutions.js'),
  4: () => import('./levels/level4-technical.js'),
  5: () => import('./levels/level5-sandbox.js'),
  6: () => import('./levels/level6-live.js'),
  7: () => import('./levels/level7-algorithms.js'),
  8: () => import('./levels/level8-enterprise.js')
};

const screens = {
  landing: document.getElementById('screen-landing'),
  map: document.getElementById('screen-map')
};
for (let i = 1; i <= 8; i++) {
  screens[`level-${i}`] = document.getElementById(`screen-level-${i}`);
}

function showScreen(name) {
  Object.values(screens).forEach(s => s && s.classList.remove('active'));
  if (screens[name]) screens[name].classList.add('active');
  document.getElementById('topbar-stats').hidden = name === 'landing';
  // The ambient constellation animation only ever needs to run behind the landing hero.
  if (name === 'landing') startBgConstellation(); else stopBgConstellation();
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

// --- sound mute toggle (always visible in the topbar, independent of level progress) ---
const muteBtn = document.getElementById('btn-mute');
function updateMuteBtn() {
  muteBtn.textContent = isMuted() ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-pressed', String(isMuted()));
  muteBtn.title = isMuted() ? 'Unmute sound effects' : 'Mute sound effects';
}
muteBtn.addEventListener('click', () => { toggleMuted(); updateMuteBtn(); });
updateMuteBtn();

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
      ${meta.bonus ? '<span class="lv-num bonus-tag">Bonus</span>' : `<span class="lv-num">Level ${meta.num}</span>`}
      <h3>${meta.title}</h3>
      <p>${meta.desc}</p>
      <div class="lv-status">
        <span>${meta.bonus ? (completed ? 'Explored' : 'Explore anytime') : (completed ? 'Completed' : (unlocked ? 'Ready to play' : 'Locked'))}</span>
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
    ? badges.map((b, i) => `<span class="badge-chip badge-pop" style="animation-delay:${i * 60}ms">${b.name}</span>`).join('')
    : '<span style="color:var(--text-2)">No badges yet — complete levels perfectly to earn them!</span>';

  renderProgressRail();
  renderAchievementsRow();
  updateTopbar();
}

/** A connected "graph" of nodes/edges showing the core 1→5 progression at a glance. */
function renderProgressRail() {
  const rail = document.getElementById('progress-rail');
  if (!rail) return;
  const core = levelMeta.filter(m => !m.bonus);
  rail.innerHTML = core.map((m, i) => {
    const completed = progress.isCompleted(m.num);
    const unlocked = progress.isUnlocked(m.num);
    const state = completed ? 'done' : (unlocked ? 'active' : 'locked');
    const seg = i > 0 ? `<span class="rail-seg ${progress.isCompleted(core[i - 1].num) ? 'seg-filled' : ''}"></span>` : '';
    return `${seg}<span class="rail-node ${state}" title="${m.title}">${completed ? '✓' : m.num}</span>`;
  }).join('');
}

/** Share Score Card is always available; the Certificate unlocks once all 5 core levels are done. */
function renderAchievementsRow() {
  const row = document.getElementById('achievements-row');
  if (!row) return;
  const unlocked = coreLevelsComplete();
  row.innerHTML = `
    <button class="btn btn-ghost" id="btn-share-card">🖼️ Share Score Card</button>
    <button class="btn ${unlocked ? 'btn-primary' : 'btn-ghost'}" id="btn-certificate" ${unlocked ? '' : 'disabled'} title="${unlocked ? 'Download your certificate' : 'Complete all 5 core levels to unlock'}">🎓 ${unlocked ? 'Get Your Certificate' : 'Certificate (locked)'}</button>
  `;
  row.querySelector('#btn-share-card').addEventListener('click', () => downloadShareCard());
  if (unlocked) row.querySelector('#btn-certificate').addEventListener('click', () => openCertificateModal());
}

const mountedLevels = new Set();
const mountedModules = {}; // num -> imported level module (used by Replay to re-mount without re-importing)

// In-memory (not persisted) per-attempt tracking used only to award meta-badges below.
// Reset whenever a level is freshly mounted or replayed; never reset on a plain re-visit.
const levelStartTimes = {};
const levelHintsUsed = {};
const ALL_LEVEL_NUMS = levelMeta.map(m => m.num);
const CORE_LEVEL_NUMS = levelMeta.filter(m => !m.bonus).map(m => m.num);

function resetAttempt(num) {
  levelStartTimes[num] = Date.now();
  levelHintsUsed[num] = 0;
}

/**
 * Attaches ONE delegated click listener directly to a level's persistent body container
 * (guarded so it's only ever attached once, even across replays that clear body.innerHTML).
 * Because this listener runs in the bubble phase, by the time it fires, any click handler
 * on the actual clicked element (e.g. a level's own quiz-option handler that toggles the
 * .correct/.wrong class) has already run — so it can safely read the resulting classList to
 * play the right sound, without any level module needing to know sound/hints exist at all.
 */
function attachLevelDelegation(body, num) {
  if (body.dataset.delegated === '1') return;
  body.dataset.delegated = '1';
  body.addEventListener('click', (e) => {
    const quizOpt = e.target.closest('.quiz-opt');
    if (quizOpt) {
      if (quizOpt.classList.contains('correct')) sfx.correct();
      else if (quizOpt.classList.contains('wrong')) sfx.wrong();
      return;
    }
    const hintBtn = e.target.closest('.hint-btn');
    if (hintBtn) {
      levelHintsUsed[num] = (levelHintsUsed[num] || 0) + 1;
      sfx.hint();
      return;
    }
    const gNode = e.target.closest('.g-node');
    if (gNode && gNode.style.cursor === 'pointer') sfx.hop();
  });
}

/** Awards cross-level "meta" badges based on this completion + overall progress state. */
function computeMetaBadges({ score, elapsedMs, hintsUsed }) {
  const earned = [];
  const tryAward = (id, name, icon) => { if (progress.addBadge(id, name, icon)) earned.push({ name, icon }); };
  if (hintsUsed === 0 && score >= 90) tryAward('sharp-mind', 'Sharp Mind', '💡');
  if (elapsedMs !== null && elapsedMs < 60000 && score >= 70) tryAward('speedrunner', 'Speedrunner', '⚡');
  if (CORE_LEVEL_NUMS.every(n => progress.getScore(n) === 100)) tryAward('perfectionist', 'Perfectionist', '💎');
  if (ALL_LEVEL_NUMS.every(n => progress.isCompleted(n))) tryAward('completionist', 'Completionist', '🏆');
  return earned;
}

/** Builds the { complete, badge } API object handed to each level module's mount(). */
function buildApi(num) {
  return {
    complete: (score, meta) => {
      const elapsedMs = levelStartTimes[num] ? Date.now() - levelStartTimes[num] : null;
      const hintsUsed = levelHintsUsed[num] || 0;
      progress.completeLevel(num, score, TOTAL_LEVELS);
      sfx.levelComplete();
      burstConfetti({ gold: score >= 90 });
      const metaBadges = computeMetaBadges({ score, elapsedMs, hintsUsed });
      metaBadges.forEach(b => showToast(`🏅 Badge earned: ${b.name}`));
      updateTopbar();
      showToast(`Level ${num} complete! Score: ${Math.round(score)}/100`);
      showResults(num, score, meta || {}, metaBadges);
    },
    badge: (id, name, icon) => {
      const added = progress.addBadge(id, name, icon);
      if (added) { showToast(`🏅 Badge earned: ${name}`); sfx.badge(); }
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
      resetAttempt(num);
      attachLevelDelegation(body, num);
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
  resetAttempt(num);
  attachLevelDelegation(body, num);
  mod.mount(body, buildApi(num));
}

/**
 * Renders the unified results panel after a level is completed: hides the interactive
 * level body and shows only a score readout + optional badge/recap/checklist + actions
 * (Replay, Start Next Level, Level Map) — per the "just show results" flow.
 */
function showResults(num, score, meta, extraBadges) {
  const body = document.getElementById(`level-${num}-body`);
  const bar = document.getElementById(`level-${num}-next`);
  if (!bar) return;
  body.hidden = true;

  const isLastGraded = num >= TOTAL_LEVELS;
  const nextMeta = levelMeta.find(m => m.num === num + 1 && !m.bonus);
  const heading = meta.heading || 'Level complete';
  const detail = meta.detail || '';

  const allBadges = [...(meta.badge ? [meta.badge] : []), ...(extraBadges || [])];
  const badgeHtml = allBadges.length
    ? `<div class="results-badge-row">${allBadges.map(b => `<span class="badge-chip badge-pop">${b.icon} ${b.name} earned!</span>`).join('')}</div>`
    : '';

  const recapHtml = (meta.recap && meta.recap.length)
    ? `<div class="results-recap">${meta.recap.map(r => `<div class="rc-item"><h4>${r.title}</h4><p>${r.body}</p></div>`).join('')}</div>`
    : '';

  const checklistHtml = (meta.checklist && meta.checklist.length)
    ? `<ul class="results-checklist">${meta.checklist.map(c => `<li class="${c.pass ? 'pass' : 'fail'}"><span class="cl-icon">${c.pass ? '✅' : '❌'}</span><span>${c.label}</span></li>`).join('')}</ul>`
    : '';

  // Next-step button(s): a core level offers the next core level; finishing the
  // last graded level (5) offers both bonus levels as optional side quests;
  // finishing a bonus level itself offers no forced next step.
  let nextButtonsHtml = '';
  if (!isLastGraded && nextMeta) {
    nextButtonsHtml = `<button class="btn btn-primary" id="btn-goto-next">Start: ${nextMeta.title} →</button>`;
  } else if (num === TOTAL_LEVELS) {
    nextButtonsHtml = levelMeta
      .filter(m => m.bonus)
      .map(b => `<button class="btn btn-primary" data-bonus-num="${b.num}">Try: ${b.title} →</button>`)
      .join('');
  }

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
        ${nextButtonsHtml}
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
  const bonusBtns = bar.querySelectorAll('[data-bonus-num]');
  bonusBtns.forEach(btn => btn.addEventListener('click', () => openLevel(Number(btn.dataset.bonusNum))));
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

// Ambient background animation + Daily Challenge card both live on the landing screen.
initBgConstellation(document.getElementById('landing-bg-canvas'));
if (screens.landing && screens.landing.classList.contains('active')) startBgConstellation();
const dailySlot = document.getElementById('daily-challenge-slot');
if (dailySlot) mountDaily(dailySlot);
