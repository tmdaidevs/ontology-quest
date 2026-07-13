# 🕸️ Ontology Quest

**Ontology Quest** is a free, single-page, browser-based educational game that teaches **ontologies**, **knowledge graphs**, and the standards/technologies (RDF, OWL, SPARQL, GraphRAG, and more) behind them — through five short, interactive levels, plus four bonus levels: one that queries a **real, live public knowledge graph**, one that animates the **algorithms** powering multi-hop reasoning, one that tours **real enterprise knowledge graphs** at scale, and one that untangles **semantic models vs. ontologies**.

No backend, no build step, no login. Everything runs as static HTML/CSS/JS and your progress is saved locally in your browser (`localStorage`).

▶️ **Play it live:** https://tmdaidevs.github.io/ontology-quest/

## What you'll learn

Ontologies are formal, explicit specifications of the concepts, relationships, and rules within a domain — the backbone of the Semantic Web, modern knowledge graphs, and today's LLM+graph ("GraphRAG") systems. Ontology Quest walks you through the whole story, hands-on.

## The 5 Levels

| # | Level | What you do |
|---|-------|--------------|
| 1 | 📜 **The History of Ontologies** | Explore an interactive timeline — Aristotle's Categories → 1980s AI expert systems → Tim Berners-Lee's Semantic Web (RDF/OWL) → Google's Knowledge Graph → modern LLM+KG hybrids (GraphRAG) — then take a short quiz. |
| 2 | 🧩 **Core Concepts** | Learn classes, instances, properties/relationships, triples (subject–predicate–object), taxonomies vs. ontologies, schemas vs. instance data, and why ontologies matter. Then build your own triples in a mini "ontology builder" mini-game. |
| 3 | 🛠️ **Tools & Standards** | Match real-world technologies — RDF, RDFS, OWL, SKOS, SPARQL, Neo4j, Wikidata, schema.org, Protégé, Stardog, Amazon Neptune, Azure Cosmos DB Gremlin API, and GraphRAG — to their best-fit use cases in a matching game, then read short explainers for each. |
| 4 | 🔍 **Under the Hood: Multi-Hop Reasoning** | See how a knowledge graph is stored as nodes & edges, watch an animated single-hop lookup vs. a 3-hop traversal ("Who are the colleagues of my manager's manager?"), learn the algorithms behind it (BFS/DFS traversal, embedding similarity, hybrid symbolic+vector retrieval used in GraphRAG), explore how **RDFS/OWL transitive inference** lets a reasoner derive new facts that were never explicitly stated (e.g. `subClassOf` chains), and take a guided tour of a typical ontology-driven app UI (entity search, relationship browser, graph visualization, query builder). |
| 5 | 🏗️ **Build Your Own Ontology** | Design your own ontology in a sandbox node-link editor — add classes, instances, and labeled relationships on an interactive canvas. Pick from 3 starter scenarios (Org Chart, Movie Recommendation System, Customer Support KB) or start fully custom, then validate against ontology best practices (has classes, has relationships, has a hierarchy, no orphan nodes, has instances) for a score. |
| ✨ | 🌐 **Bonus: Live Knowledge Graph Explorer** | Always unlocked. Query **[Wikidata](https://www.wikidata.org)** — a real public knowledge graph of 100M+ entities — live, straight from your browser via its actual SPARQL endpoint. **Free Explore**: search any person, place, or concept and hop across real RDF relationships, viewing the live SPARQL query behind every hop. **Six-Hop Challenge**: start from a random live entity and try to reach 6 hops without ever revisiting a node — a race against a real, unpredictable graph. |
| ✨ | **Bonus: Algorithms Visualized** | Always unlocked. Watch the actual algorithms behind graph reasoning run step-by-step: toggle between **BFS** (queue) and **DFS** (stack) and step or auto-play a traversal across the same class hierarchy to see how visit order differs; run a live **embedding similarity search** that finds "Wolf"'s nearest neighbors by vector distance alone (no explicit graph edge required) with an animated radiating search circle; then walk through the full **5-stage hybrid GraphRAG pipeline** (question → vector search → graph traversal → assembled context → LLM answer) that ties both techniques together. |
| ✨ | 🏢 **Bonus: Enterprise Case Studies** | Always unlocked. See ontologies at production scale: a log-scale bar chart comparing entity/fact counts across real deployments, then six expandable case studies — Google Knowledge Graph, Amazon's Product Graph, LinkedIn's Economic Graph, SNOMED CT (healthcare), Microsoft Graph, and Palantir's Foundry Ontology — each with verified stats, a narrative, an "ontology snapshot" mini-diagram of how it's actually modeled, and its tech stack. Finish with a 6-question quiz to earn the Enterprise Analyst badge. |
| ✨ | 🔬 **Bonus: Semantic Models vs. Ontologies** | Always unlocked. Untangle one of the most overloaded terms in data & AI: click through an interactive 6-stage **spectrum of semantic precision** (tags → controlled vocabulary → taxonomy → thesaurus → BI-style semantic model → formal ontology), then compare the exact same org-chart facts modeled two ways — a Power BI-style semantic model side by side with a formal OWL ontology where you can **run a live reasoner** and watch it infer a brand-new fact from an axiom. Sort 8 real-world artifacts into the correct bucket, then take a 5-question quiz to earn the Semantic Analyst badge. |

Every level's quiz includes an optional **hint button** (small score penalty) if you get stuck, and a **"Next Level →" button** appears the moment you finish, so you can keep moving without returning to the map.

Progress, best scores, and badges are tracked per level and persisted in `localStorage` — no account required. Levels unlock sequentially, and can be replayed anytime to improve your score.

## Beyond the levels

Ontology Quest also layers in a handful of engagement features on top of the core curriculum:

- 🔊 **Sound design** — short synthesized SFX (Web Audio API, no audio files) for correct/wrong answers, hints, graph hops, badges, and level completion, with a one-click mute toggle that's remembered between visits.
- 🌌 **Living background** — a subtle animated constellation of drifting, connecting nodes behind the landing screen, echoing the "everything is a graph" theme from the first frame.
- 🎉 **Confetti celebrations** — a canvas-based confetti burst plays whenever you complete a level, with a richer gold burst for a perfect score.
- 🕸️ **Progress rail** — the level-select map shows your 5 core levels as a connected node chain (done ✓ / active / locked), so your journey reads like the graphs you're learning about.
- 🏅 **Badges** — per-level badges (History Scholar, Triple Builder, Perfect Matcher, Graph Navigator, Ontology Architect, Live Explorer, Six-Hop Voyager, Algorithm Adept, Enterprise Analyst, Semantic Analyst) plus cross-level **meta-badges** for skilled play: Sharp Mind 💡 (no hints, 90+ score), Speedrunner ⚡ (under a minute, 70+ score), Perfectionist 💎 (100% on every core level), and Completionist 🏆 (finish all 9 levels).
- 🖼️ **Shareable score card** — generate a PNG snapshot of your score and badges to share anywhere.
- 🎓 **Certificate of completion** — once all 5 core levels are done, download a personalized "Ontology Quest — Certificate of Completion" PNG with your name, score, and badge count — ready to attach to a LinkedIn "Licenses & Certifications" entry.

## Tech stack

- Vanilla HTML5 / CSS3 / JavaScript (ES modules) — no framework, no bundler, no build step.
- Inline SVG + `<canvas>` for all graph visualizations, animations, confetti, and generated images (no external chart/graphics library dependency).
- Web Audio API for synthesized sound effects (no audio files shipped).
- Live data via the public [Wikidata](https://www.wikidata.org) Search API and SPARQL endpoint (Live Knowledge Graph Explorer bonus level) — no API key required.
- `localStorage` for progress, scores, badges, and sandbox ontologies.
- Deployed via **GitHub Pages** using a GitHub Actions workflow (`.github/workflows/deploy.yml`).

## Project structure

```
index.html                # Single-page app shell (landing, level map, 9 level/bonus screens)
css/style.css             # Dark theme, animations, responsive layout
js/
  main.js                  # Navigation, level map rendering, level mounting, next-level flow, badges
  progress.js              # localStorage-backed progress/score/badge tracking
  graph-svg.js             # Small reusable SVG node-link rendering helper (+ hub-spoke layout)
  graph-algorithms.js      # Pure BFS/DFS traversal step generators (Level 7)
  vector-space-svg.js      # SVG embedding scatter-plot + nearest-neighbor + search-circle animation (Level 7)
  ui-utils.js              # Shared animated count-up helper for scores
  sound.js                 # Web Audio SFX helper (correct/wrong/hint/hop/badge/level-complete) + mute toggle
  confetti.js              # Lightweight canvas confetti burst
  bg-constellation.js      # Animated drifting node/edge background for the landing screen
  share-card.js            # Canvas-rendered shareable score/badge PNG
  certificate.js           # Canvas-rendered "Certificate of Completion" PNG + modal UI
  data/                    # Content data per level (timeline, concepts, tools, graphs, scenarios, algo-graph.js, case-studies.js, semantic-models.js)
  levels/                  # One module per level (level1-history.js … level5-sandbox.js, level6-live.js, level7-algorithms.js, level8-enterprise.js, level9-semantic.js bonus levels)
.github/workflows/deploy.yml  # GitHub Pages deployment workflow
```

## Running locally

Any static file server works, e.g.:

```bash
npx http-server -p 8080
# or
python -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

## Deployment

This repo is deployed automatically to GitHub Pages on every push to `main` via GitHub Actions (see `.github/workflows/deploy.yml`), serving the repository root as a static site.

## Credits

Built by **Tobi Müller** — [LinkedIn](https://www.linkedin.com/in/tobias-m/) · [GitHub](https://github.com/tmdaidevs)
