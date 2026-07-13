// semantic-models.js — content for Level 9: "Semantic Models vs Ontologies".
// "Semantic model" is one of the most overloaded terms in data & AI — it is an umbrella
// word that covers everything from a hashtag to a fully axiomatized OWL ontology. This
// data grounds that spectrum, contrasts a BI-style semantic model (e.g. Power BI, dbt,
// LookML) against a formal ontology using the same org-chart example, and quizzes on the
// distinction. Sources: Gruber (1993) "A translation approach to portable ontology
// specifications"; ISO 25964-1:2011 (thesauri); W3C RDFS/OWL/SKOS recommendations;
// public documentation of Power BI / Analysis Services "semantic models" and dbt's
// semantic layer.

// The spectrum of semantic precision, from loosest to most formal. Each stage keeps the
// structure/relationships of the one before it and adds one new capability.
export const spectrumStages = [
  {
    id: 'tags',
    icon: '#',
    label: 'Tags & Keywords',
    short: 'Free-text labels, no agreed structure.',
    detail: 'Anyone can attach any word to anything — a "folksonomy" like social-media hashtags. There is no shared structure and no way to tell that "NLP" and "Natural Language Processing" mean the same thing, or that "Java" might mean coffee, an island, or a programming language.'
  },
  {
    id: 'vocab',
    icon: '📖',
    label: 'Controlled Vocabulary',
    short: 'A fixed, agreed list of terms with definitions.',
    detail: 'A closed, curated list of approved terms — e.g. a company\'s official product names, or a style guide\'s preferred spellings. This removes wording ambiguity, but the terms still just sit in a flat list with no relationships between them.'
  },
  {
    id: 'taxonomy',
    icon: '🌳',
    label: 'Taxonomy',
    short: 'A strict "is-a" hierarchy — one parent per node.',
    detail: 'Terms are arranged into a tree using broader/narrower ("is-a") relationships — think biological classification, a product-category tree, or a file-folder structure. Simple and easy to browse, but each node typically has exactly one parent and there is no logic beyond "this is a kind of that."'
  },
  {
    id: 'thesaurus',
    icon: '🔗',
    label: 'Thesaurus',
    short: 'Adds synonyms & "related term" links.',
    detail: 'Standardized by ISO 25964 and modeled on the Web with SKOS, a thesaurus keeps the taxonomy\'s hierarchy but adds associative relationships: synonyms ("use / used for"), broader/narrower terms, and "related term" links. Library of Congress Subject Headings and MeSH (medical subject headings) are classic examples — richer than a taxonomy, but still no formal logic.'
  },
  {
    id: 'bi-model',
    icon: '📊',
    label: 'BI-Style Semantic Model',
    short: 'Tables, relationships, hierarchies & measures for analytics.',
    detail: 'This is what most people in data & analytics mean when they say "semantic model" today — a Power BI / Analysis Services semantic model, a dbt or Looker (LookML) semantic layer, or a classic entity-relationship diagram. It maps raw tables to business-friendly entities, joins them with relationships, and defines calculated measures (e.g. DAX). It is genuinely semantic — it gives data business meaning — but that meaning lives in relationships and formulas a person wrote down, not in machine-checkable logic.'
  },
  {
    id: 'ontology',
    icon: '🧠',
    label: 'Formal Ontology',
    short: 'Classes, properties & logical axioms a machine can reason over.',
    detail: 'Built with W3C standards like RDFS and OWL, a formal ontology defines classes, properties, and logical axioms — equivalence, disjointness, cardinality, transitivity, property chains. A reasoner can process those axioms to check consistency and infer brand-new facts that were never explicitly stated. Gene Ontology and SNOMED CT are real-world examples used for exactly this kind of automated inference.'
  }
];

// The "Same World, Two Models" side-by-side: an org-chart, modeled two ways. Deliberately
// reuses the org-chart theme from Level 5's sandbox scenarios for continuity.
export const orgChartExample = {
  biModel: {
    tables: [
      { name: 'Employee', columns: ['EmployeeID (PK)', 'Name', 'DeptID (FK)'] },
      { name: 'Department', columns: ['DeptID (PK)', 'Name', 'ParentDeptID (FK)'] }
    ],
    relationship: 'Employee[DeptID] → Department[DeptID]  (many-to-one)',
    measure: 'Employee Count := COUNTROWS(Employee)',
    caption: 'Relationships route filters between tables for reports and dashboards. There is no automatic logical inference here — if you want "everyone under the VP of Engineering, including sub-departments," a person has to write that logic themselves, e.g. a recursive DAX measure or a nested query.'
  },
  ontology: {
    // Explicit facts, shown before reasoning.
    graph: {
      nodes: [
        { id: 'ada', label: 'Ada', x: 95, y: 150, r: 22 },
        { id: 'platform', label: 'Platform Team', x: 300, y: 58, r: 22 },
        { id: 'engineering', label: 'Engineering', x: 505, y: 150, r: 24, hub: true }
      ],
      edges: [
        { from: 'ada', to: 'platform', label: 'worksIn' },
        { from: 'platform', to: 'engineering', label: 'partOf' }
      ]
    },
    // The inferred edge, appended only after "Run Reasoner" is clicked.
    inferredEdge: { from: 'ada', to: 'engineering', label: 'worksIn (inferred)' },
    axiom: 'Property-chain axiom: worksIn(x, y) ∧ partOf(y, z) → worksIn(x, z)',
    caption: 'A reasoner applies the ontology\'s axioms to the stated facts and derives new ones automatically. "Ada worksIn Engineering" was never written down anywhere — it logically follows from the two edges above. This automated-inference capability is the single biggest technical difference from a BI-style semantic model.'
  }
};

// Aspect-by-aspect comparison table.
export const comparisonRows = [
  { aspect: 'Structure', taxonomy: 'Single hierarchy (tree)', biModel: 'Tables + relationships + hierarchies', ontology: 'Graph of classes, properties & individuals' },
  { aspect: 'Relationships', taxonomy: '"is-a" / broader-narrower only', biModel: 'Foreign keys, 1:N / N:N joins', ontology: 'Typed, directional object & data properties' },
  { aspect: 'Logic / axioms', taxonomy: 'None', biModel: 'None — business logic lives in measures/queries', ontology: 'Equivalence, disjointness, cardinality, transitivity' },
  { aspect: 'Reasoning', taxonomy: 'None', biModel: 'None — you write the query/logic yourself', ontology: 'Automated — a reasoner infers new facts & checks consistency' },
  { aspect: 'Primary goal', taxonomy: 'Simple classification & navigation', biModel: 'A governed, usable layer for analytics & reporting', ontology: 'Shared, machine-interpretable meaning + inference' },
  { aspect: 'Typical tooling', taxonomy: 'Category trees, site navigation', biModel: 'Power BI / Analysis Services, dbt, Looker, Cube', ontology: 'Protégé, RDFS/OWL, SPARQL reasoners (Pellet, HermiT)' },
  { aspect: 'Example', taxonomy: 'Product category tree', biModel: 'A Power BI "Sales" semantic model', ontology: 'Gene Ontology, SNOMED CT' }
];

// Classification mini-game: sort each real-world artifact into the correct bucket.
export const classificationItems = [
  { id: 'pbi', text: 'A Power BI semantic model with Sales/Customer tables and DAX measures', bucket: 'semantic' },
  { id: 'go', text: 'Gene Ontology (GO) — OWL classes with formal logical axioms', bucket: 'ontology' },
  { id: 'dbt', text: 'A dbt semantic layer defining reusable business metrics on a warehouse', bucket: 'semantic' },
  { id: 'snomed', text: 'SNOMED CT clinical terminology, used by automated reasoners', bucket: 'ontology' },
  { id: 'lookml', text: 'A LookML model with explores, dimensions, and measures', bucket: 'semantic' },
  { id: 'schemaowl', text: 'schema.org vocabulary extended with OWL for automated product-data reasoning', bucket: 'ontology' },
  { id: 'excel', text: 'A spreadsheet-based "semantic layer" mapping raw column names to business terms', bucket: 'semantic' },
  { id: 'reasoner', text: 'An OWL ontology whose reasoner infers "Ada worksIn Engineering" from two stated facts', bucket: 'ontology' }
];

export const semanticQuiz = [
  {
    q: 'What is the single biggest technical capability a formal ontology (OWL) adds that a typical BI-style semantic model does not?',
    options: ['Nicer-looking dashboards', 'Automated logical reasoning/inference from axioms', 'Faster query performance', 'Built-in encryption'],
    answer: 1,
    hint: 'Think about what happened when you clicked "Run Reasoner" in the demo above.'
  },
  {
    q: 'Which of these terms is technically the broadest, capable of describing anything from a simple ER diagram to a full OWL ontology?',
    options: ['Taxonomy', 'Thesaurus', 'Semantic model', 'SPARQL'],
    answer: 2,
    hint: 'One of these is an umbrella category; the rest are specific points along the spectrum.'
  },
  {
    q: 'A company\'s Power BI model has a "Sales" table linked to a "Customer" table via a relationship, plus a few DAX measures. In this level\'s terms, that is best described as...',
    options: ['A formal ontology', 'A BI-style semantic model', 'A thesaurus', 'A folksonomy'],
    answer: 1,
    hint: 'Does it have logical axioms a reasoner can process, or just relationships and calculations a person defined?'
  },
  {
    q: 'In the org-chart example, "Ada worksIn Engineering" was never explicitly stated. How did the reasoner produce it?',
    options: ['It guessed based on text similarity', 'By applying a property-chain axiom over two stated facts (worksIn + partOf)', 'By querying a search engine', 'A person added the edge manually'],
    answer: 1,
    hint: 'Look at the two explicit edges before you clicked "Run Reasoner": Ada→Platform Team, Platform Team→Engineering.'
  },
  {
    q: 'Where does a taxonomy sit relative to a thesaurus and a formal ontology on the spectrum of semantic precision?',
    options: ['It is the most formal of the three', 'It is the least formal — just an is-a hierarchy, with no synonyms or logical axioms', 'All three are exactly equivalent', 'A thesaurus is more formal than an ontology'],
    answer: 1,
    hint: 'Which one only has parent-child links, without "related term" links or logical axioms?'
  }
];
