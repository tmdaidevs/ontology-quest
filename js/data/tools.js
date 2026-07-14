// tools.js — content for Level 3 (Tools & Standards comparison / matching game).

// Each entry: a tool/standard paired with its best-fit use case, plus an explainer shown afterward.
export const toolPairs = [
  {
    id: 'rdf',
    tool: 'RDF (Resource Description Framework)',
    useCase: 'Representing facts as simple subject–predicate–object triples for the Web',
    explainer: 'RDF is the foundational W3C data model for the Semantic Web: every fact is a triple. It is format-agnostic (Turtle, RDF/XML, JSON-LD are all serializations of the same triples).'
  },
  {
    id: 'rdfs',
    tool: 'RDFS (RDF Schema)',
    useCase: 'Defining basic class hierarchies and property relationships on top of RDF',
    explainer: 'RDFS adds lightweight schema vocabulary to RDF — rdfs:Class, rdfs:subClassOf, rdfs:domain/range — enabling simple taxonomies and basic inference.'
  },
  {
    id: 'jsonld',
    tool: 'JSON-LD',
    useCase: 'Embedding linked-data facts directly inside ordinary JSON that web/API developers already use',
    explainer: 'JSON-LD is the RDF serialization built to feel like plain JSON — add an "@context" mapping familiar keys to real vocabulary terms and any JSON payload becomes valid RDF. That low barrier to entry is exactly why it, not Turtle or RDF/XML, became the dominant serialization in the wild: it is what schema.org markup and most production knowledge-graph APIs actually ship.'
  },
  {
    id: 'owl',
    tool: 'OWL (Web Ontology Language)',
    useCase: 'Expressing rich logical constraints and enabling automated reasoning/inference',
    explainer: 'OWL extends RDFS with description-logic features: cardinality, disjointness, equivalence, transitive/symmetric properties — allowing reasoners to infer new facts and detect inconsistencies.'
  },
  {
    id: 'shacl',
    tool: 'SHACL (Shapes Constraint Language)',
    useCase: 'Validating that RDF data actually satisfies required shapes before trusting it — a closed-world data-quality gate',
    explainer: 'SHACL flips OWL\'s assumptions on their head. OWL is open-world (a reasoner infers new facts and never concludes something is false just because it\'s absent); SHACL is closed-world constraint checking — "every Person MUST have exactly one email" — that either passes or fails, like a schema validator. Ontologies often pair the two: OWL for meaning and inference, SHACL for guaranteeing the data feeding it is actually well-formed.'
  },
  {
    id: 'skos',
    tool: 'SKOS (Simple Knowledge Organization System)',
    useCase: 'Modeling thesauri, taxonomies, and controlled vocabularies (broader/narrower terms)',
    explainer: 'SKOS is a lighter-weight W3C standard for concept schemes like thesauri and subject-heading lists, using relations like skos:broader and skos:narrower rather than full OWL logic.'
  },
  {
    id: 'sparql',
    tool: 'SPARQL',
    useCase: 'Querying RDF graphs with a SQL-like pattern-matching query language',
    explainer: 'SPARQL is the standard query language for RDF: you write graph patterns (triples with variables) and the engine returns matching bindings — the RDF equivalent of SQL.'
  },
  {
    id: 'property-graph',
    tool: 'Neo4j / Property Graphs',
    useCase: 'Storing richly-attributed nodes and edges for fast relationship traversal in apps',
    explainer: 'Property graphs (Neo4j, Amazon Neptune in PG mode) attach key-value properties directly to nodes and edges and use languages like Cypher/Gremlin — popular for app-level graph databases, often less formally logic-based than OWL.'
  },
  {
    id: 'wikidata',
    tool: 'Wikidata',
    useCase: 'A free, collaboratively-edited, general-purpose public knowledge graph',
    explainer: 'Wikidata is a massive, community-curated knowledge base of entities and relationships (people, places, concepts) that powers Wikipedia infoboxes and countless external applications via SPARQL.'
  },
  {
    id: 'schemaorg',
    tool: 'schema.org',
    useCase: 'Marking up web pages so search engines understand entities like products, recipes, events',
    explainer: 'schema.org is a shared vocabulary (backed by Google, Microsoft, Yahoo, Yandex) that website owners embed as structured data (JSON-LD) so search engines can build rich results and knowledge panels.'
  },
  {
    id: 'protege',
    tool: 'Protégé',
    useCase: 'A free desktop tool for visually building and editing OWL ontologies',
    explainer: 'Protégé (Stanford) is the most widely used ontology editor — letting domain experts define classes, properties, and axioms with a GUI, then export standard OWL files.'
  },
  {
    id: 'stardog',
    tool: 'Stardog',
    useCase: 'An enterprise knowledge graph platform combining RDF storage, reasoning, and virtualization',
    explainer: 'Stardog is a commercial enterprise knowledge graph platform supporting RDF/OWL, SPARQL, built-in reasoning, and "data virtualization" that queries across existing enterprise databases without copying data.'
  },
  {
    id: 'neptune',
    tool: 'Amazon Neptune',
    useCase: 'A managed cloud graph database supporting both RDF/SPARQL and property-graph/Gremlin',
    explainer: 'Amazon Neptune is a fully-managed AWS graph database that uniquely supports both the RDF/SPARQL world and the openCypher/Gremlin property-graph world on the same service.'
  },
  {
    id: 'cosmos-gremlin',
    tool: 'Azure Cosmos DB (Gremlin API)',
    useCase: 'A globally-distributed, low-latency property graph database for cloud applications',
    explainer: 'Azure Cosmos DB\'s Gremlin API lets developers store and query property graphs with global distribution and elastic scale, integrating naturally with the wider Azure ecosystem.'
  },
  {
    id: 'graphrag',
    tool: 'GraphRAG (LLM + Knowledge Graph)',
    useCase: 'Improving LLM answers by retrieving connected, multi-hop facts from a knowledge graph before generating text',
    explainer: 'GraphRAG augments Retrieval-Augmented Generation by traversing graph relationships (not just similarity search over documents) so the LLM receives connected context spanning multiple hops — reducing hallucination on relational questions.'
  }
];
