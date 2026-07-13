// timeline.js — historically-grounded content for Level 1 (History of Ontologies).

export const timelineEvents = [
  {
    id: 'aristotle',
    year: '~350 BCE',
    title: "Aristotle's Categories",
    text: `Long before computers, the philosopher Aristotle proposed a system of "categories" — substance, quantity, quality, relation, place, time, and more — as the fundamental ways to classify anything that exists. This was arguably the first formal attempt at an "ontology": a structured account of what kinds of things exist and how they relate. His hierarchical classification of living things (genus and species) is a direct ancestor of the class hierarchies used in modern ontologies.`
  },
  {
    id: 'ai-expert-systems',
    year: '1970s–1980s',
    title: 'Knowledge Representation & Expert Systems',
    text: `As Artificial Intelligence matured, researchers needed formal ways to encode human expert knowledge into computer systems. Expert systems like MYCIN (medical diagnosis) and semantic networks / frames (Minsky) represented facts as structured relationships between concepts. The AI community borrowed the philosophical term "ontology" to describe an explicit specification of the concepts, categories, and relationships within a domain — a shared vocabulary machines could reason over.`
  },
  {
    id: 'semantic-web',
    year: '2001',
    title: 'The Semantic Web (Tim Berners-Lee)',
    text: `In a landmark Scientific American article, Tim Berners-Lee (inventor of the Web), James Hendler, and Ora Lassila proposed the "Semantic Web" — a web where data itself is machine-readable and linked with explicit meaning, not just human-readable pages. This vision required standardized ways to describe data: RDF (Resource Description Framework) for representing facts as subject–predicate–object triples, and OWL (Web Ontology Language) for defining rich, logic-based ontologies that support automated reasoning and inference.`
  },
  {
    id: 'knowledge-graph',
    year: '2012',
    title: 'Google Knowledge Graph',
    text: `Google launched its "Knowledge Graph," publicly popularizing the term. It connected hundreds of millions of real-world entities (people, places, things) and the relationships between them, powering the "Knowledge Panels" you see beside search results. This showed the industry that large-scale, entity-relationship graphs — grounded in ontological schemas — could dramatically improve search, disambiguation, and reasoning at web scale. Wikidata, schema.org, and countless enterprise knowledge graphs followed.`
  },
  {
    id: 'llm-graphrag',
    year: '2020s',
    title: 'LLMs + Knowledge Graphs: GraphRAG',
    text: `Large Language Models (LLMs) are fluent but can "hallucinate" facts and struggle with precise multi-step reasoning. Today, hybrid systems combine LLMs with knowledge graphs: Retrieval-Augmented Generation (RAG) fetches relevant facts before the model answers, and "GraphRAG" specifically traverses graph relationships (multi-hop) to gather connected context that plain document search would miss. Ontologies now serve as the structured backbone that keeps AI answers grounded, explainable, and interoperable across enterprise data.`
  }
];

export const historyQuiz = [
  {
    q: 'Who is credited with an early philosophical precursor to ontologies through his system of categories?',
    options: ['Isaac Newton', 'Aristotle', 'Alan Turing', 'Charles Darwin'],
    answer: 1
  },
  {
    q: 'Which language, introduced alongside the Semantic Web vision, enables rich logic-based ontologies with automated reasoning?',
    options: ['HTML', 'OWL (Web Ontology Language)', 'CSS', 'JSON'],
    answer: 1
  },
  {
    q: 'What foundational data model represents facts as subject–predicate–object statements?',
    options: ['RDF triples', 'SQL tables', 'CSV rows', 'YAML documents'],
    answer: 0
  },
  {
    q: 'What technique lets modern LLM systems traverse a knowledge graph to gather connected, multi-hop context before answering?',
    options: ['GraphRAG', 'CSS Grid', 'OAuth', 'WebSockets'],
    answer: 0
  }
];
