// concepts.js — content for Level 2 (Core Concepts) and the triple-builder mini-game.

export const conceptSections = [
  {
    id: 'what-is-ontology',
    title: 'What is an ontology?',
    body: `In knowledge representation, an <strong>ontology</strong> is a formal, explicit specification of the concepts (classes), individuals (instances), properties, and relationships that exist within a domain — plus the rules that constrain how they relate. Think of it as a shared, machine-readable "vocabulary and rulebook" for a subject area, so that both humans and software agree on what terms mean and how facts connect.`
  },
  {
    id: 'classes-entities',
    title: 'Classes / Entities',
    body: `A <strong>class</strong> (also called a "type" or "concept") represents a category of things, e.g. <em>Person</em>, <em>Movie</em>, <em>Organization</em>. An <strong>entity</strong> (or <strong>instance</strong>) is a specific real thing that belongs to a class, e.g. <em>"Marie Curie"</em> is an instance of the class <em>Person</em>. Classes can form hierarchies: <em>Dog</em> is a subclass of <em>Mammal</em>, which is a subclass of <em>Animal</em>.`
  },
  {
    id: 'properties-relationships',
    title: 'Properties / Relationships',
    body: `<strong>Properties</strong> connect things to values or to each other. A <em>datatype property</em> links an entity to a literal value (e.g. <em>Person hasAge 34</em>). An <em>object property</em> (relationship) links two entities (e.g. <em>Marie_Curie worksAt Sorbonne</em>). Relationships are what turn a flat list of facts into a connected <strong>graph</strong>.`
  },
  {
    id: 'taxonomy-vs-ontology',
    title: 'Taxonomy vs. Ontology',
    body: `A <strong>taxonomy</strong> is a simple hierarchical classification — just "is-a" relationships (like a folder tree). An <strong>ontology</strong> is richer: besides hierarchy, it captures many kinds of relationships (part-of, causes, worksFor...), formal constraints (a Person can only have one biological mother), and supports logical <strong>inference</strong>. Every taxonomy can be seen as a minimal ontology, but not every ontology is just a taxonomy.`
  },
  {
    id: 'triples',
    title: 'Triples: Subject–Predicate–Object',
    body: `The atomic unit of most knowledge graphs is the <strong>triple</strong>: <code>(subject, predicate, object)</code>. For example: <code>(Cat, isA, Animal)</code> or <code>(Paris, capitalOf, France)</code>. RDF (Resource Description Framework) represents the entire graph as a set of such triples — millions of them link up to form a rich web of facts.`
  },
  {
    id: 'schemas-instances',
    title: 'Schemas vs. Instances',
    body: `The <strong>schema</strong> (or "TBox" — terminological box) defines the classes, properties, and rules — the blueprint. The <strong>instance data</strong> (or "ABox" — assertional box) is the actual facts that use that blueprint — e.g. schema says "a Movie hasDirector a Person"; instance data says "Inception hasDirector Christopher_Nolan". Ontologies define the schema; knowledge graphs are typically full of instance data conforming to that schema.`
  },
  {
    id: 'why-it-matters',
    title: 'Why ontologies matter',
    body: `Ontologies provide: <strong>shared vocabulary</strong> (everyone means the same thing by "customer"), <strong>interoperability</strong> (systems can exchange data meaningfully), <strong>reasoning &amp; inference</strong> (a computer can derive that "Fido isA Dog isA Mammal" therefore "Fido isA Mammal" without being told directly), <strong>data integration</strong> (linking disparate databases via common concepts), <strong>reduced ambiguity</strong> (precise, agreed meaning for terms), and increasingly, <strong>grounding for AI/LLMs</strong> — giving generative models a factual, structured backbone to check against.`
  }
];

// Nodes and allowed predicates for the drag/connect triple-builder mini-game.
export const builderNodes = ['Cat', 'Dog', 'Animal', 'Mammal', 'Paris', 'France', 'Person', 'Marie_Curie'];
export const builderPredicates = ['isA', 'subClassOf', 'capitalOf', 'livesIn', 'instanceOf', 'partOf'];

// A triple is "valid" if it appears in this accepted set (semantically true / sensible).
export const acceptedTriples = new Set([
  'Cat|isA|Animal',
  'Cat|isA|Mammal',
  'Cat|instanceOf|Animal',
  'Dog|isA|Animal',
  'Dog|isA|Mammal',
  'Dog|instanceOf|Animal',
  'Mammal|subClassOf|Animal',
  'Mammal|isA|Animal',
  'Paris|capitalOf|France',
  'Marie_Curie|instanceOf|Person',
  'Marie_Curie|livesIn|Paris',
  'Person|isA|Animal',
  'Paris|partOf|France'
]);

// Triples that are structurally plausible but logically backwards / wrong — used to give good feedback.
export const knownWrongTriples = new Set([
  'Animal|isA|Cat',
  'Animal|isA|Dog',
  'France|capitalOf|Paris',
  'Mammal|isA|Cat'
]);
