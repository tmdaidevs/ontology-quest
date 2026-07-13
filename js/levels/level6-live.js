// level6-live.js — Bonus level: explore a REAL, live public knowledge graph (Wikidata)
// via its SPARQL endpoint. Reinforces every concept taught earlier (triples, RDF,
// multi-hop traversal) using live data instead of a static demo.
import { renderGraph, setHighlight } from '../graph-svg.js';

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
      renderGraphFor(label, rels);
      renderRelList(rels);
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

  function renderGraphFor(centerLabel, rels) {
    const width = 700, height = 380;
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) / 2 - 70;
    const nodes = [{ id: 'center', label: centerLabel, x: cx, y: cy, r: 30, icon: '🎯' }];
    const edges = [];
    rels.forEach((rel, i) => {
      const angle = (i / Math.max(rels.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      nodes.push({ id: rel.valueQid, label: rel.valueLabel, x, y, r: 22, icon: '●' });
      edges.push({ from: 'center', to: rel.valueQid, label: rel.propLabel });
    });
    const handles = renderGraph(graphEl, { nodes, edges }, { width, height });
    rels.forEach(rel => {
      const g = handles.nodeEls[rel.valueQid];
      if (g) {
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => hopTo(rel.valueQid, rel.valueLabel));
      }
    });
    // Highlight the whole neighborhood briefly so the "live" traversal reads clearly.
    setHighlight(handles, { nodes: nodes.map(n => n.id), edges: edges.map((_, i) => i), dimOthers: false });
  }

  function renderRelList(rels) {
    relListEl.innerHTML = '';
    if (!rels.length) {
      relListEl.innerHTML = '<div class="live-empty">No outgoing entity relationships found for this node.</div>';
      return;
    }
    rels.forEach(rel => {
      const item = document.createElement('div');
      item.className = 'live-rel-item';
      item.innerHTML = `<span><span class="rel-prop">${escapeHtml(rel.propLabel)}</span> → <span class="rel-val">${escapeHtml(rel.valueLabel)}</span></span><span class="rel-hop">hop →</span>`;
      item.addEventListener('click', () => hopTo(rel.valueQid, rel.valueLabel));
      relListEl.appendChild(item);
    });
  }

  sparqlToggleBtn.addEventListener('click', () => {
    sparqlVisible = !sparqlVisible;
    sparqlBox.hidden = !sparqlVisible;
    sparqlToggleBtn.textContent = sparqlVisible ? '🔎 Hide SPARQL query' : '🔎 View live SPARQL query';
  });
}
