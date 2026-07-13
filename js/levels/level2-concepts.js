// level2-concepts.js — Core concepts accordion + drag/connect triple-builder mini-game.
import { conceptSections, builderNodes, builderPredicates, acceptedTriples, knownWrongTriples } from '../data/concepts.js';

export function mount(container, api) {
  let sectionsOpened = new Set();
  const triples = []; // { subj, pred, obj, valid }
  let validated = false;

  container.innerHTML = `
    <div class="card">
      <h3>Core Concepts</h3>
      <p>Expand each concept to learn it. Then try the triple-builder challenge below.</p>
      <div id="accordion"></div>
    </div>
    <div class="card">
      <h3>🧪 Mini Builder: Create Semantic Triples</h3>
      <p>Pick a <strong>subject</strong>, a <strong>predicate</strong> (relationship), and an <strong>object</strong> to form a triple — just like <code>(Cat, isA, Animal)</code>. Build at least 3 triples, including one hierarchy relationship (isA / subClassOf), then click <em>Validate</em>.</p>
      <div class="triple-builder">
        <select id="sel-subj"></select>
        <span>—</span>
        <select id="sel-pred"></select>
        <span>→</span>
        <select id="sel-obj"></select>
        <button class="btn btn-secondary" id="btn-add-triple">+ Add Triple</button>
      </div>
      <div class="triple-list" id="triple-list"></div>
      <div style="margin-top:16px; display:flex; gap:10px; align-items:center;">
        <button class="btn btn-primary" id="btn-validate-triples">Validate My Ontology</button>
        <span id="builder-hint" style="color:var(--text-2); font-size:0.85rem;"></span>
      </div>
      <div id="builder-result" style="margin-top:14px;"></div>
    </div>
  `;

  // --- Accordion ---
  const accordion = container.querySelector('#accordion');
  conceptSections.forEach(sec => {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <div class="accordion-head">
        <span>${sec.title}</span>
        <span class="chev">▾</span>
      </div>
      <div class="accordion-body"><p>${sec.body}</p></div>
    `;
    item.querySelector('.accordion-head').addEventListener('click', () => {
      item.classList.toggle('open');
      sectionsOpened.add(sec.id);
      updateHint();
    });
    accordion.appendChild(item);
  });

  // --- Triple builder selects ---
  const selSubj = container.querySelector('#sel-subj');
  const selPred = container.querySelector('#sel-pred');
  const selObj = container.querySelector('#sel-obj');
  [selSubj, selObj].forEach(sel => {
    builderNodes.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n; opt.textContent = n;
      sel.appendChild(opt);
    });
  });
  builderPredicates.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    selPred.appendChild(opt);
  });
  selObj.selectedIndex = 2; // default to "Animal" so first example is meaningful

  const tripleListEl = container.querySelector('#triple-list');
  const hintEl = container.querySelector('#builder-hint');
  const resultEl = container.querySelector('#builder-result');
  const validateBtn = container.querySelector('#btn-validate-triples');

  container.querySelector('#btn-add-triple').addEventListener('click', () => {
    const subj = selSubj.value, pred = selPred.value, obj = selObj.value;
    if (subj === obj) {
      flashHint('A subject and object should usually be different things.');
      return;
    }
    triples.push({ subj, pred, obj });
    renderTriples();
    updateHint();
  });

  function renderTriples() {
    tripleListEl.innerHTML = '';
    triples.forEach((t, i) => {
      const chip = document.createElement('div');
      chip.className = 'triple-chip';
      chip.innerHTML = `
        <span class="subj">${t.subj}</span>
        <span class="pred">${t.pred}</span>
        <span class="obj">${t.obj}</span>
        <button class="remove-btn" title="Remove">✕</button>
      `;
      chip.querySelector('.remove-btn').addEventListener('click', () => {
        triples.splice(i, 1);
        renderTriples();
        updateHint();
      });
      tripleListEl.appendChild(chip);
    });
  }

  function updateHint() {
    hintEl.textContent = `${triples.length} triple(s) added.`;
  }

  function flashHint(msg) {
    hintEl.textContent = msg;
    hintEl.style.color = 'var(--danger)';
    setTimeout(() => { hintEl.style.color = 'var(--text-2)'; updateHint(); }, 1800);
  }

  validateBtn.addEventListener('click', () => {
    if (triples.length < 3) {
      resultEl.innerHTML = `<p style="color:var(--danger)">Add at least 3 triples before validating.</p>`;
      return;
    }
    let correctCount = 0;
    let hasHierarchy = false;
    triples.forEach(t => {
      const key = `${t.subj}|${t.pred}|${t.obj}`;
      const isKnownGood = acceptedTriples.has(key);
      const isKnownBad = knownWrongTriples.has(key);
      // Any triple not explicitly known-bad and structurally sound (subj !== obj) counts as plausible;
      // known-good triples are guaranteed correct, known-bad are guaranteed wrong.
      t.valid = isKnownBad ? false : true;
      if (isKnownGood) correctCount++;
      if ((t.pred === 'isA' || t.pred === 'subClassOf') && !isKnownBad) hasHierarchy = true;
    });
    renderTriplesWithValidity();

    const conceptsScore = Math.min(60, sectionsOpened.size * (60 / conceptSections.length));
    const hierarchyBonus = hasHierarchy ? 20 : 0;
    const tripleScore = Math.min(20, triples.filter(t => t.valid).length * 5);
    const score = Math.round(conceptsScore + hierarchyBonus + tripleScore);

    resultEl.innerHTML = `
      <div class="completion-banner">
        <h3>${hasHierarchy ? '✅ Nice ontology!' : '⚠️ Almost there'}</h3>
        <p class="score-line">Score: ${score} / 100</p>
        <p>${hasHierarchy ? 'You included a hierarchy relationship (isA/subClassOf) — exactly what taxonomies are built from.' : 'Tip: try adding an isA or subClassOf triple to form a class hierarchy.'}</p>
        <p>Concepts explored: ${sectionsOpened.size}/${conceptSections.length} · Valid-looking triples: ${triples.filter(t => t.valid).length}/${triples.length}</p>
      </div>
    `;
    if (hasHierarchy && sectionsOpened.size === conceptSections.length) {
      api.badge('triple-builder', 'Triple Builder', '🧩');
    }
    validated = true;
    api.complete(score);
  });

  function renderTriplesWithValidity() {
    [...tripleListEl.children].forEach((chip, i) => {
      chip.classList.toggle('valid', triples[i].valid);
      chip.classList.toggle('invalid', !triples[i].valid);
    });
  }
}
