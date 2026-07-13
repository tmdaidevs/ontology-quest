// level6-live.js — Bonus level: explore a REAL, live public knowledge graph (Wikidata)
// via its SPARQL endpoint. Reinforces every concept taught earlier (triples, RDF,
// multi-hop traversal) using live data instead of a static demo.
import { renderGraph, radialLayout } from '../graph-svg.js';

const WD_SEARCH_URL = 'https://www.wikidata.org/w/api.php';
const WD_SPARQL_URL = 'https://query.wikidata.org/sparql';
const FETCH_TIMEOUT_MS = 15000;

const CHIP_LABELS = ['Marie Curie', 'Albert Einstein', 'Ada Lovelace', 'Python (programming language)', 'Semantic Web', 'Tokyo'];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Aborts `controller` with a distinct 'TimeoutError' (rather than the default 'AbortError')
// after `ms`, so callers can tell "superseded by a newer request" apart from "network hung".
// Returns a cleanup function that must be called once the request settles.
function armTimeout(controller, ms = FETCH_TIMEOUT_MS) {
  const id = setTimeout(() => {
    try { controller.abort(new DOMException('Request timed out', 'TimeoutError')); }
    catch { controller.abort(); }
  }, ms);
  return () => clearTimeout(id);
}

async function searchEntities(term, signal) {
  const url = `${WD_SEARCH_URL}?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&origin=*&limit=8`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Search request failed');
  const data = await res.json();
  return data.search || [];
}

function buildSparql(qid) {
  return `SELECT ?propLabel ?valueLabel ?value WHERE {
  wd:${qid} ?p ?value .
  ?prop wikibase:directClaim ?p .
  FILTER(isIRI(?value))
  FILTER(STRSTARTS(STR(?value), "http://www.wikidata.org/entity/Q"))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 50`;
}

async function fetchRelations(qid, signal) {
  const query = buildSparql(qid);
  const url = `${WD_SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { Accept: 'application/sparql-results+json' }, signal });
  if (!res.ok) throw new Error('SPARQL request failed');
  const data = await res.json();
  const rows = data.results?.bindings || [];
  const seenProps = new Set();
  const rels = [];
  for (const row of rows) {
    const propLabel = row.propLabel?.value;
    const valueLabel = row.valueLabel?.value;
    const valueUri = row.value?.value;
    if (!propLabel || !valueUri || seenProps.has(propLabel)) continue;
    const qidMatch = valueUri.match(/Q\d+$/);
    if (!qidMatch) continue;
    seenProps.add(propLabel);
    rels.push({ propLabel, valueLabel: valueLabel || qidMatch[0], valueQid: qidMatch[0] });
    if (rels.length >= 10) break;
  }
  return { query, rels };
}

export function mount(container, api) {
  container.innerHTML = `
    <div class="mode-toggle" id="l6-mode-toggle">
      <button class="mode-tab active" data-mode="free" type="button">🔭 Free Explore</button>
      <button class="mode-tab" data-mode="challenge" type="button">🔗 Six-Hop Challenge</button>
    </div>

    <div id="l6-free-panel">
      <div class="card">
        <h3>🌐 Live Knowledge Graph Explorer</h3>
        <p>Every other level used curated examples. This one is <strong>live</strong> — you're querying <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a>, a real public knowledge graph of 100M+ entities, through its actual SPARQL endpoint, in your browser, right now. Search for a person, place, or concept, then click any related entity to <strong>hop</strong> across real RDF relationships — the same multi-hop traversal you saw simulated in Level 4.</p>
        <div class="live-search-row">
          <input type="text" id="l6-search-input" placeholder="Search Wikidata… e.g. 'Ada Lovelace'" autocomplete="off" />
        </div>
        <div class="live-status-row" id="l6-search-status"></div>
        <div class="live-chips" id="l6-chips"></div>
        <div class="live-results" id="l6-results"></div>
      </div>

      <div class="card" id="l6-explore-card" hidden>
        <h3>Live Traversal</h3>
        <div class="live-breadcrumbs" id="l6-breadcrumbs"></div>
        <div class="live-status-row" id="l6-status"></div>
        <div class="graph-wrap" id="l6-graph"></div>
        <p style="color:var(--text-2); font-size:0.85rem; margin-top:10px;">Click a node above, or an item below, to hop one relationship deeper.</p>
        <div class="live-rel-list" id="l6-rel-list"></div>
        <div class="sparql-toggle">
          <button class="btn btn-ghost" id="l6-toggle-sparql">🔎 View live SPARQL query</button>
          <div class="sparql-box" id="l6-sparql-box" hidden></div>
        </div>
      </div>
    </div>

    <div id="l6-challenge-panel" hidden>
      <div class="card">
        <h3>🔗 Six-Hop Challenge</h3>
        <p>Starting from a random <strong>live</strong> Wikidata entity, hop across real relationships without ever revisiting a node — reach <strong>6 hops</strong> to complete the challenge. If every remaining relationship leads back to somewhere you've already been, the run ends there and you're scored on hops achieved.</p>
        <div class="challenge-hud" id="l6-challenge-hud" hidden>
          <div class="chud-stat"><span class="chud-label">Hops</span><span class="chud-value" id="l6-chud-hops">0 / 6</span></div>
          <div class="challenge-trail" id="l6-challenge-trail"></div>
        </div>
        <div class="live-status-row" id="l6-challenge-status"></div>
        <div class="hop-controls">
          <button class="btn btn-primary" id="l6-challenge-start" type="button">🎲 Start Challenge</button>
        </div>
      </div>
      <div class="card" id="l6-challenge-explore-card" hidden>
        <div class="graph-wrap" id="l6-challenge-graph"></div>
        <p style="color:var(--text-2); font-size:0.85rem; margin-top:10px;">Click an <strong>unvisited</strong> node above, or an item below, to take your next hop.</p>
        <div class="live-rel-list" id="l6-challenge-rel-list"></div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#l6-search-input');
  const searchStatusEl = container.querySelector('#l6-search-status');
  const chipsEl = container.querySelector('#l6-chips');
  const resultsEl = container.querySelector('#l6-results');
  const exploreCard = container.querySelector('#l6-explore-card');
  const breadcrumbsEl = container.querySelector('#l6-breadcrumbs');
  const statusEl = container.querySelector('#l6-status');
  const graphEl = container.querySelector('#l6-graph');
  const relListEl = container.querySelector('#l6-rel-list');
  const sparqlToggleBtn = container.querySelector('#l6-toggle-sparql');
  const sparqlBox = container.querySelector('#l6-sparql-box');

  let trail = []; // [{ qid, label }]
  let searchTimer = null;
  let searchController = null;
  let exploreController = null;
  let sparqlVisible = false;
  let badgeEarned = false;

  // --- status helpers ---
  function setStatus(el, text, loading = false, isError = false) {
    el.innerHTML = '';
    if (loading) {
      const spinner = document.createElement('div');
      spinner.className = 'live-spinner';
      el.appendChild(spinner);
    }
    const span = document.createElement('span');
    span.textContent = text;
    if (isError) span.style.color = 'var(--danger)';
    el.appendChild(span);
  }

  // --- mode toggle: Free Explore vs Six-Hop Challenge (share the search/fetch helpers below) ---
  const modeToggleEl = container.querySelector('#l6-mode-toggle');
  const freePanel = container.querySelector('#l6-free-panel');
  const challengePanel = container.querySelector('#l6-challenge-panel');
  modeToggleEl.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;
      modeToggleEl.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      freePanel.hidden = mode !== 'free';
      challengePanel.hidden = mode !== 'challenge';
    });
  });

  // --- shared graph/rel-list renderers used by BOTH Free Explore and the Challenge ---
  // `visited`, when provided, marks already-visited entities as non-clickable (Challenge mode's no-repeat rule).
  function renderGraphInto(targetEl, centerLabel, rels, onHop, visited) {
    // Node ids must be unique per RELATION, not per target entity: Wikidata sometimes
    // returns two different properties pointing at the same object (e.g. Tokyo's
    // "country" and "located in the administrative territorial entity" both -> Japan).
    // Keying nodes by valueQid alone would silently collapse those into one node id,
    // and renderGraph's edge lookup (which finds the FIRST node with a matching id)
    // would then draw both edges on top of each other.
    const graphNodeId = (rel, i) => `${rel.valueQid}#${i}`;
    const graph = radialLayout(
      { id: 'center', label: centerLabel, r: 30 },
      rels.map((rel, i) => ({ id: graphNodeId(rel, i), label: rel.valueLabel, rel: rel.propLabel })),
      { spokeR: 20, maxLabelChars: 18 }
    );
    const handles = renderGraph(targetEl, graph, { width: graph.size, height: graph.size });
    rels.forEach((rel, i) => {
      const g = handles.nodeEls[graphNodeId(rel, i)];
      if (!g) return;
      if (visited && visited.has(rel.valueQid)) {
        g.classList.add('visited');
      } else {
        g.classList.add('clickable');
        g.addEventListener('click', () => onHop(rel.valueQid, rel.valueLabel));
      }
    });
    // Give the center node a calm, static emphasis (no permanent pulsing on every
    // spoke — that reads as busy/noisy with up to 10 of them on screen at once).
    const centerG = handles.nodeEls.center;
    if (centerG) centerG.classList.add('highlight');
  }

  function renderRelListInto(targetEl, rels, onHop, visited) {
    targetEl.innerHTML = '';
    if (!rels.length) {
      targetEl.innerHTML = '<div class="live-empty">No outgoing entity relationships found for this node.</div>';
      return;
    }
    rels.forEach(rel => {
      const isVisited = !!(visited && visited.has(rel.valueQid));
      const item = document.createElement('div');
      item.className = 'live-rel-item' + (isVisited ? ' visited' : '');
      item.innerHTML = `<span><span class="rel-prop">${escapeHtml(rel.propLabel)}</span> → <span class="rel-val">${escapeHtml(rel.valueLabel)}</span></span><span class="rel-hop">${isVisited ? 'already visited' : 'hop →'}</span>`;
      if (!isVisited) item.addEventListener('click', () => onHop(rel.valueQid, rel.valueLabel));
      targetEl.appendChild(item);
    });
  }

  // --- search ---
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const term = searchInput.value.trim();
    if (!term) { resultsEl.innerHTML = ''; setStatus(searchStatusEl, ''); return; }
    searchTimer = setTimeout(() => runSearch(term), 350);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchTimer);
      const term = searchInput.value.trim();
      if (term) runSearch(term);
    }
  });

  async function runSearch(term) {
    if (searchController) searchController.abort();
    searchController = new AbortController();
    const clearSearchTimeout = armTimeout(searchController);
    setStatus(searchStatusEl, 'Searching Wikidata…', true);
    try {
      const results = await searchEntities(term, searchController.signal);
      setStatus(searchStatusEl, '');
      renderResults(results);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.name === 'TimeoutError') setStatus(searchStatusEl, '⏱️ Search timed out — Wikidata may be slow right now. Try again.', false, true);
      else setStatus(searchStatusEl, '⚠️ Search failed — check your connection and try again.', false, true);
    } finally {
      clearSearchTimeout();
    }
  }

  function renderResults(results) {
    resultsEl.innerHTML = '';
    if (!results.length) {
      resultsEl.innerHTML = '<div class="live-empty">No matches. Try a different search term.</div>';
      return;
    }
    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'live-result-item';
      item.innerHTML = `<span class="lr-label">${escapeHtml(r.label)}</span><span class="lr-desc">${escapeHtml(r.description || '')}</span>`;
      item.addEventListener('click', () => {
        resultsEl.innerHTML = '';
        searchInput.value = '';
        setStatus(searchStatusEl, '');
        startExploration(r.id, r.label);
      });
      resultsEl.appendChild(item);
    });
  }

  // --- quick-start chips ---
  CHIP_LABELS.forEach(label => {
    const chip = document.createElement('button');
    chip.className = 'live-chip';
    chip.textContent = label;
    chip.addEventListener('click', () => quickStart(label));
    chipsEl.appendChild(chip);
  });

  async function quickStart(label) {
    if (searchController) searchController.abort();
    searchController = new AbortController();
    const clearQuickTimeout = armTimeout(searchController);
    setStatus(searchStatusEl, `Looking up "${label}"…`, true);
    try {
      const results = await searchEntities(label, searchController.signal);
      setStatus(searchStatusEl, '');
      if (results.length) {
        resultsEl.innerHTML = '';
        startExploration(results[0].id, results[0].label);
      } else {
        setStatus(searchStatusEl, `No match found for "${label}".`, false, true);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.name === 'TimeoutError') setStatus(searchStatusEl, '⏱️ Lookup timed out — Wikidata may be slow right now. Try again.', false, true);
      else setStatus(searchStatusEl, '⚠️ Search failed — check your connection and try again.', false, true);
    } finally {
      clearQuickTimeout();
    }
  }

  // --- exploration / hopping ---
  function startExploration(qid, label) {
    trail = [{ qid, label }];
    loadEntity(qid, label);
  }

  function hopTo(qid, label) {
    trail.push({ qid, label });
    loadEntity(qid, label);
  }

  function jumpToBreadcrumb(index) {
    trail = trail.slice(0, index + 1);
    const { qid, label } = trail[index];
    loadEntity(qid, label);
  }

  async function loadEntity(qid, label) {
    if (exploreController) exploreController.abort();
    exploreController = new AbortController();
    const clearExploreTimeout = armTimeout(exploreController);
    exploreCard.hidden = false;
    renderBreadcrumbs();
    setStatus(statusEl, `Querying live SPARQL endpoint for "${label}"…`, true);
    graphEl.innerHTML = '';
    relListEl.innerHTML = '';
    exploreCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try {
      const { query, rels } = await fetchRelations(qid, exploreController.signal);
      renderGraphInto(graphEl, label, rels, hopTo, null);
      renderRelListInto(relListEl, rels, hopTo, null);
      sparqlBox.textContent = query;
      setStatus(
        statusEl,
        rels.length
          ? `Found ${rels.length} live relationship${rels.length === 1 ? '' : 's'} for "${label}" (hop ${trail.length}).`
          : `No outgoing entity relationships found for "${label}" — try hopping back or searching another entity.`
      );
      if (!badgeEarned) {
        badgeEarned = true;
        api.badge('live-explorer', 'Live Data Explorer', '🌐');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.name === 'TimeoutError') {
        setStatus(statusEl, '⏱️ The Wikidata SPARQL endpoint is taking too long to respond. Please try again in a moment.', false, true);
      } else {
        setStatus(statusEl, '⚠️ Could not reach the Wikidata SPARQL endpoint right now. Please try again in a moment.', false, true);
      }
    } finally {
      clearExploreTimeout();
    }
  }

  function renderBreadcrumbs() {
    breadcrumbsEl.innerHTML = '';
    trail.forEach((t, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'live-crumb-sep';
        sep.textContent = '→';
        breadcrumbsEl.appendChild(sep);
      }
      const crumb = document.createElement('span');
      const isCurrent = i === trail.length - 1;
      crumb.className = 'live-crumb' + (isCurrent ? ' current' : '');
      crumb.textContent = (i === 0 ? '🎯 ' : '') + t.label;
      if (!isCurrent) crumb.addEventListener('click', () => jumpToBreadcrumb(i));
      breadcrumbsEl.appendChild(crumb);
    });
  }

  sparqlToggleBtn.addEventListener('click', () => {
    sparqlVisible = !sparqlVisible;
    sparqlBox.hidden = !sparqlVisible;
    sparqlToggleBtn.textContent = sparqlVisible ? '🔎 Hide SPARQL query' : '🔎 View live SPARQL query';
  });

  // --- Six-Hop Challenge: chain live hops without ever revisiting a node ---
  const challengeHud = container.querySelector('#l6-challenge-hud');
  const chudHops = container.querySelector('#l6-chud-hops');
  const challengeTrailEl = container.querySelector('#l6-challenge-trail');
  const challengeStatusEl = container.querySelector('#l6-challenge-status');
  const challengeStartBtn = container.querySelector('#l6-challenge-start');
  const challengeExploreCard = container.querySelector('#l6-challenge-explore-card');
  const challengeGraphEl = container.querySelector('#l6-challenge-graph');
  const challengeRelListEl = container.querySelector('#l6-challenge-rel-list');

  let challengeVisited = new Set();
  let challengeTrail = []; // ordered [{ qid, label }]
  let challengeHops = 0;
  let challengeController = null;
  let challengeDone = false;

  challengeStartBtn.addEventListener('click', startChallenge);

  async function startChallenge() {
    if (challengeController) challengeController.abort();
    challengeDone = false;
    challengeHops = 0;
    challengeVisited = new Set();
    challengeTrail = [];
    challengeHud.hidden = false;
    challengeExploreCard.hidden = false;
    challengeStartBtn.textContent = '🎲 New Random Start';
    updateChallengeHud();
    renderChallengeTrail();
    challengeGraphEl.innerHTML = '';
    challengeRelListEl.innerHTML = '';
    const pick = CHIP_LABELS[Math.floor(Math.random() * CHIP_LABELS.length)];
    setStatus(challengeStatusEl, `Looking up a random start entity ("${pick}")…`, true);
    challengeController = new AbortController();
    const clearStartTimeout = armTimeout(challengeController);
    try {
      const results = await searchEntities(pick, challengeController.signal);
      if (!results.length) { setStatus(challengeStatusEl, 'Could not find a start entity — try again.', false, true); return; }
      const start = results[0];
      challengeVisited.add(start.id);
      challengeTrail.push({ qid: start.id, label: start.label });
      renderChallengeTrail();
      await loadChallengeEntity(start.id, start.label);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setStatus(challengeStatusEl, '⚠️ Could not reach Wikidata right now. Please try again.', false, true);
    } finally {
      clearStartTimeout();
    }
  }

  function hopToChallenge(qid, label) {
    if (challengeDone || challengeVisited.has(qid)) return;
    challengeVisited.add(qid);
    challengeHops++;
    challengeTrail.push({ qid, label });
    updateChallengeHud();
    renderChallengeTrail();
    loadChallengeEntity(qid, label);
  }

  async function loadChallengeEntity(qid, label) {
    setStatus(challengeStatusEl, `Querying live SPARQL endpoint for "${label}"…`, true);
    challengeGraphEl.innerHTML = '';
    challengeRelListEl.innerHTML = '';
    if (challengeController) challengeController.abort();
    challengeController = new AbortController();
    const clearHopTimeout = armTimeout(challengeController);
    try {
      const { rels } = await fetchRelations(qid, challengeController.signal);
      renderGraphInto(challengeGraphEl, label, rels, hopToChallenge, challengeVisited);
      renderRelListInto(challengeRelListEl, rels, hopToChallenge, challengeVisited);
      if (!badgeEarned) {
        badgeEarned = true;
        api.badge('live-explorer', 'Live Data Explorer', '🌐');
      }
      const unvisited = rels.filter(r => !challengeVisited.has(r.valueQid));
      if (challengeHops >= 6) {
        finishChallenge(true);
      } else if (!unvisited.length) {
        finishChallenge(false);
      } else {
        setStatus(challengeStatusEl, `Hop ${challengeHops} of 6 — choose an unvisited entity below to continue.`);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.name === 'TimeoutError') {
        setStatus(challengeStatusEl, '⏱️ The Wikidata SPARQL endpoint is taking too long to respond. Please try again.', false, true);
      } else {
        setStatus(challengeStatusEl, '⚠️ Could not reach the Wikidata SPARQL endpoint right now. Please try again.', false, true);
      }
    } finally {
      clearHopTimeout();
    }
  }

  function updateChallengeHud() {
    chudHops.textContent = `${challengeHops} / 6`;
  }

  function renderChallengeTrail() {
    challengeTrailEl.innerHTML = challengeTrail
      .map((t, i) => `<span class="ct-node">${i === 0 ? '🎯 ' : ''}${escapeHtml(t.label)}</span>`)
      .join('<span class="ct-arrow">→</span>');
  }

  function finishChallenge(success) {
    challengeDone = true;
    const score = Math.max(0, Math.min(100, Math.round((challengeHops / 6) * 100)));
    let badge = null;
    if (success) {
      const added = api.badge('six-hop-voyager', 'Six-Hop Voyager', '🔗');
      if (added) badge = { name: 'Six-Hop Voyager', icon: '🔗' };
    }
    setStatus(
      challengeStatusEl,
      success
        ? '🎉 You reached all 6 live hops without repeating a node!'
        : `⛓️ Every remaining relationship led back to an already-visited node — the run ends at ${challengeHops} hop${challengeHops === 1 ? '' : 's'}.`
    );
    api.complete(score, {
      heading: success ? '🎉 Six-Hop Challenge complete!' : 'Challenge ended — nice run',
      detail: `You chained ${challengeHops} live Wikidata relationship${challengeHops === 1 ? '' : 's'} in a row without ever revisiting a node.`,
      badge,
      recap: [
        { title: 'Hops achieved', body: `${challengeHops} / 6` },
        { title: 'Path taken', body: challengeTrail.map(t => t.label).join(' → ') }
      ]
    });
  }
}
