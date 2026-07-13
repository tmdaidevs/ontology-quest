// daily-challenge.js — a single date-seeded question shown on the landing screen.
// Every player sees the same question on a given calendar day (deterministic hash
// of the date string), and a day-streak is tracked via progress.js/localStorage.
// Self-contained: uses its own question pool (distinct from in-level quizzes) so
// it can be mounted straight into a landing-page slot with no level dependency.
import * as progress from './progress.js';
import { sfx } from './sound.js';

const POOL = [
  { q: 'In an RDF triple, what are the three parts called?', options: ['Subject, Predicate, Object', 'Node, Edge, Weight', 'Class, Instance, Literal', 'Head, Body, Tail'], answer: 0, why: 'RDF models every fact as subject–predicate–object, e.g. "Cat —isA→ Animal".' },
  { q: 'Who is credited with proposing the Semantic Web vision in a 2001 article?', options: ['Alan Turing', 'Tim Berners-Lee', 'Marvin Minsky', 'Larry Page'], answer: 1, why: 'Tim Berners-Lee (with Hendler & Lassila) outlined the Semantic Web in a 2001 Scientific American article.' },
  { q: 'Which ancient philosopher first proposed a system of categories for classifying all things?', options: ['Plato', 'Socrates', 'Aristotle', 'Pythagoras'], answer: 2, why: 'Aristotle\'s "Categories" (~4th century BC) is considered an early ancestor of modern ontological classification.' },
  { q: 'What distinguishes an ontology from a simple taxonomy?', options: ['Ontologies only allow one root node', 'Ontologies add relationships & rules beyond a hierarchy', 'Taxonomies are always bigger', 'There is no real difference'], answer: 1, why: 'A taxonomy is just an is-a hierarchy; an ontology adds richer relationships, properties, and logical constraints.' },
  { q: 'Which W3C language adds formal logic (cardinality, disjointness, equivalence) on top of RDFS?', options: ['SPARQL', 'OWL', 'JSON-LD', 'XML Schema'], answer: 1, why: 'OWL (Web Ontology Language) extends RDFS with description-logic constructs for richer reasoning.' },
  { q: 'What does SPARQL let you do?', options: ['Style web pages', 'Query RDF graphs', 'Compile OWL to binaries', 'Render 3D graphics'], answer: 1, why: 'SPARQL is the standard query language for RDF, similar in spirit to SQL for relational tables.' },
  { q: 'Google Knowledge Graph, launched in 2012, primarily helps search by...', options: ['Ranking pages by backlinks only', 'Understanding entities and their relationships, not just keywords', 'Compressing images', 'Translating languages'], answer: 1, why: 'It shifted search from "strings" to "things" — entities connected by real-world relationships.' },
  { q: 'In GraphRAG, what does the "graph" part typically add over plain vector-search RAG?', options: ['Nothing, it is the same thing', 'Explicit multi-hop relationships between entities for structured retrieval', 'Faster GPU rendering', 'It removes the need for an LLM'], answer: 1, why: 'GraphRAG combines a knowledge graph\'s explicit relationships with embedding similarity, enabling multi-hop, structured retrieval.' },
  { q: 'A query like "colleagues of my manager\'s manager" requires traversing how many graph edges (hops)?', options: ['1', '2', '3', '5'], answer: 2, why: 'manager → manager\'s manager → their colleagues = 3 hops, a classic multi-hop reasoning example.' },
  { q: 'Which free, collaboratively-edited knowledge graph powers many Wikipedia infoboxes?', options: ['Wikidata', 'DBpedia only', 'Freebase (still active)', 'schema.org'], answer: 0, why: 'Wikidata is a structured, community-edited knowledge base with billions of triples, queryable via SPARQL.' },
  { q: 'What is schema.org mainly used for?', options: ['A programming language', 'Shared vocabulary websites embed so search engines understand page content', 'A graph database engine', 'A W3C reasoning standard like OWL'], answer: 1, why: 'schema.org is a shared vocabulary (co-founded by Google, Microsoft, Yahoo, Yandex) for structured data markup on web pages.' },
  { q: 'Neo4j is best described as a...', options: ['RDF triple store', 'Labeled-property graph database', 'Relational database', 'Vector database'], answer: 1, why: 'Neo4j uses the property-graph model (nodes/edges with key-value properties), distinct from RDF triple stores.' },
  { q: 'SKOS is mainly designed to represent...', options: ['Neural network weights', 'Controlled vocabularies, taxonomies & thesauri', 'SQL schemas', '3D scene graphs'], answer: 1, why: 'SKOS (Simple Knowledge Organization System) models concept schemes like thesauri and taxonomies for the Semantic Web.' },
  { q: 'What does an ontology give an LLM-based system that pure text retrieval alone doesn\'t?', options: ['Faster tokenization', 'A structured, explicit map of entities & relationships to ground answers in facts', 'Lower hosting costs', 'Automatic translation'], answer: 1, why: 'A shared, explicit schema of entities/relationships reduces ambiguity and lets systems reason & ground answers rather than guess from text alone.' },
  { q: 'Which traversal strategy explores a graph level-by-level, ideal for finding the shortest hop path?', options: ['Depth-First Search (DFS)', 'Breadth-First Search (BFS)', 'Bubble sort', 'Binary search'], answer: 1, why: 'BFS expands outward one hop at a time, so the first time it reaches a target it has found a shortest path.' },
  { q: 'Embedding-based similarity search finds related entities by...', options: ['Exact string matching only', 'Comparing vector representations for closeness in meaning', 'Counting shared letters', 'Following explicit graph edges only'], answer: 1, why: 'Embeddings place semantically similar entities near each other in vector space, enabling "approximate hops" beyond explicit edges.' },
  { q: 'In ontology terms, "Cat" is an instance of the class...', options: ['Instance', 'Animal', 'Predicate', 'Literal'], answer: 1, why: '"Animal" is the class (category); a specific cat is an instance of it.' },
  { q: 'Protégé is best known as a...', options: ['Graph query language', 'Free, widely-used ontology editor from Stanford', 'Cloud database service', 'JavaScript charting library'], answer: 1, why: 'Protégé is a long-running, free open-source tool for building and editing OWL ontologies.' },
  { q: 'One core benefit of ontologies for organizations is...', options: ['They replace the need for any database', 'Interoperability — different systems can share one consistent vocabulary of meaning', 'They make all data public', 'They eliminate the need for security'], answer: 1, why: 'A shared ontology lets otherwise-siloed systems agree on what terms like "Customer" or "Product" mean, enabling integration.' },
  { q: 'RDFS (RDF Schema) primarily adds which capability on top of plain RDF?', options: ['Encryption', 'Basic class/property hierarchies (subClassOf, subPropertyOf, domain, range)', 'Real-time streaming', 'Image recognition'], answer: 1, why: 'RDFS introduces a lightweight vocabulary for describing classes, properties, and simple hierarchies over raw RDF triples.' }
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic pick so every player sees the same question on a given date. */
function pickForToday() {
  const key = todayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return POOL[hash % POOL.length];
}

export function mount(container) {
  const today = todayKey();
  let state = progress.getDailyState();
  let doneToday = state.lastDate === today;
  const q = pickForToday();

  function render() {
    container.innerHTML = `
      <div class="daily-card ${doneToday ? 'done' : ''}">
        <div class="daily-head">
          <span class="tag-label">// Daily Challenge</span>
          <span class="daily-streak" title="Current streak">🔥 ${state.streak || 0}-day streak</span>
        </div>
        ${doneToday ? `
          <p class="daily-msg">✅ Today's challenge is complete — come back tomorrow for a new question.</p>
        ` : `
          <p class="daily-q">${q.q}</p>
          <div class="daily-opts">
            ${q.options.map((opt, i) => `<button class="btn btn-ghost quiz-opt daily-opt" data-i="${i}">${opt}</button>`).join('')}
          </div>
          <div class="daily-feedback" id="daily-feedback" hidden></div>
        `}
      </div>
    `;
    if (!doneToday) {
      container.querySelectorAll('.daily-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.i);
          const correct = i === q.answer;
          container.querySelectorAll('.daily-opt').forEach(b => { b.disabled = true; });
          btn.classList.add(correct ? 'correct' : 'wrong');
          if (!correct) {
            const correctBtn = container.querySelector(`.daily-opt[data-i="${q.answer}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
          }
          const streak = progress.completeDaily(today);
          state = { lastDate: today, streak };
          doneToday = true;
          container.querySelector('.daily-card').classList.add('done');
          const fb = container.querySelector('#daily-feedback');
          fb.hidden = false;
          fb.innerHTML = `<p>${correct ? '✅ Correct!' : '❌ Not quite.'} ${q.why}</p><p class="daily-streak-update">🔥 Streak: ${streak} day${streak === 1 ? '' : 's'}</p>`;
          container.querySelector('.daily-head .daily-streak').textContent = `🔥 ${streak}-day streak`;
          if (correct) sfx.correct(); else sfx.wrong();
        }, { once: true });
      });
    }
  }
  render();
}
