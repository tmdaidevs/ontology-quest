// progress.js — localStorage-backed game state: unlocked levels, scores, badges.

const STORAGE_KEY = 'ontologyQuest.progress.v1';

const defaultState = () => ({
  unlockedLevel: 1,      // highest level number the player may play
  completed: {},         // { 1: true, 2: true, ... }
  scores: {},            // { 1: 80, 2: 100, ... } best score per level (0-100)
  badges: [],            // [{ id, name, icon }]
  sandbox: {}            // persisted sandbox ontologies keyed by scenario id
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    console.warn('Failed to load progress, resetting.', e);
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState() {
  return state;
}

export function isUnlocked(levelNum) {
  return levelNum <= state.unlockedLevel;
}

export function isCompleted(levelNum) {
  return !!state.completed[levelNum];
}

export function getScore(levelNum) {
  return state.scores[levelNum] || 0;
}

export function totalScore() {
  return Object.values(state.scores).reduce((a, b) => a + b, 0);
}

export function completeLevel(levelNum, score, totalLevels) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  state.completed[levelNum] = true;
  state.scores[levelNum] = Math.max(state.scores[levelNum] || 0, clamped);
  if (levelNum >= state.unlockedLevel && levelNum < totalLevels) {
    state.unlockedLevel = levelNum + 1;
  } else if (levelNum === totalLevels) {
    state.unlockedLevel = Math.max(state.unlockedLevel, totalLevels);
  }
  save();
}

export function addBadge(id, name, icon) {
  if (state.badges.some(b => b.id === id)) return false;
  state.badges.push({ id, name, icon });
  save();
  return true;
}

export function getBadges() {
  return state.badges;
}

export function saveSandbox(scenarioId, ontology) {
  state.sandbox[scenarioId] = ontology;
  save();
}

export function loadSandbox(scenarioId) {
  return state.sandbox[scenarioId] || null;
}

export function resetProgress() {
  state = defaultState();
  save();
}
