# 🕸️ Ontology Quest

**Ontology Quest** is a free, single-page, browser-based educational game that teaches **ontologies**, **knowledge graphs**, and the standards/technologies (RDF, OWL, SPARQL, GraphRAG, and more) behind them — through five short, interactive levels.

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
| 4 | 🔍 **Under the Hood: Multi-Hop Reasoning** | See how a knowledge graph is stored as nodes & edges, watch an animated single-hop lookup vs. a 3-hop traversal ("Who are the colleagues of my manager's manager?"), learn the algorithms behind it (BFS/DFS traversal, embedding similarity, hybrid symbolic+vector retrieval used in GraphRAG), and take a guided tour of a typical ontology-driven app UI (entity search, relationship browser, graph visualization, query builder). |
| 5 | 🏗️ **Build Your Own Ontology** | Design your own ontology in a sandbox node-link editor — add classes, instances, and labeled relationships on an interactive canvas. Pick from 3 starter scenarios (Org Chart, Movie Recommendation System, Customer Support KB) or start fully custom, then validate against ontology best practices (has classes, has relationships, has a hierarchy, no orphan nodes, has instances) for a score. |

Progress, best scores, and badges are tracked per level and persisted in `localStorage` — no account required. Levels unlock sequentially, and can be replayed anytime to improve your score.

## Tech stack

- Vanilla HTML5 / CSS3 / JavaScript (ES modules) — no framework, no bundler, no build step.
- Inline SVG for all graph/node-link visualizations (no external chart library dependency).
- `localStorage` for progress, scores, and badges.
- Deployed via **GitHub Pages** using a GitHub Actions workflow (`.github/workflows/deploy.yml`).

## Project structure

```
index.html                # Single-page app shell (landing, level map, 5 level screens)
css/style.css             # Dark theme, animations, responsive layout
js/
  main.js                 # Navigation, level map rendering, level mounting
  progress.js              # localStorage-backed progress/score/badge tracking
  graph-svg.js             # Small reusable SVG node-link rendering helper
  data/                    # Content data per level (timeline, concepts, tools, graphs, scenarios)
  levels/                  # One module per level (level1-history.js … level5-sandbox.js)
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
