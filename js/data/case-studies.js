// case-studies.js — data for Level 8: real-world enterprise knowledge graph deployments.
// All figures are drawn from publicly published sources (see README/commit notes for citations
// at time of writing); where a company has never published a precise count (Amazon, Microsoft,
// Palantir), we describe scale and architecture qualitatively rather than inventing a number.

// Log-scale "scale at a glance" bars — only figures with a citable public source are plotted.
// Domain runs 10^4 .. 10^9 so even the smallest verified figure (SNOMED concepts) reads as a
// real, non-zero bar instead of vanishing next to billion-scale entity counts.
export const scaleAtAGlance = {
  domainMinLog: 4,
  domainMaxLog: 9,
  entries: [
    { id: 'snomed', label: 'SNOMED CT clinical concepts', value: 365000, display: '365K+' },
    { id: 'li-companies', label: 'LinkedIn companies tracked', value: 57000000, display: '57M+' },
    { id: 'li-members', label: 'LinkedIn members', value: 950000000, display: '950M+' },
    { id: 'google-kg', label: 'Google Knowledge Graph entities (2016, last official figure)', value: 1000000000, display: '1B+' }
  ]
};

export const caseStudies = [
  {
    id: 'google-kg',
    name: 'Google Knowledge Graph',
    glyph: 'G',
    tagline: 'Turning search from "strings" into "things" — since 2012.',
    stats: [
      { target: 1, suffix: 'B+', label: 'entities (2016, last official figure)' },
      { target: 70, suffix: 'B+', label: 'facts connecting them' }
    ],
    narrative: 'Launched in 2012, the Google Knowledge Graph let search move beyond matching keyword strings to understanding real-world "things" — people, places, organizations — and the facts connecting them. At launch it held roughly 500 million entities and 3.5 billion facts; by 2016 (the last year Google published official figures) it had grown to over 1 billion entities and 70+ billion facts. It powers the "knowledge panels" you see beside search results, letting Google answer a question directly instead of just linking to a page.',
    techStack: ['Curated + web-derived entity data', 'Semantic search ranking', 'Knowledge panels', 'Entity disambiguation'],
    schema: {
      hub: { id: 'obama', label: 'Barack Obama' },
      spokes: [
        { id: 'person', label: 'Person', rel: 'is a' },
        { id: 'honolulu', label: 'Honolulu', rel: 'born in' },
        { id: 'michelle', label: 'Michelle Obama', rel: 'spouse' },
        { id: 'potus', label: 'U.S. President', rel: 'held role' }
      ]
    }
  },
  {
    id: 'amazon-product-graph',
    name: 'Amazon Product Graph',
    glyph: 'A',
    tagline: 'Hundreds of millions of products, connected — and deliberately incomplete.',
    stats: [],
    qualStat: { display: 'Hundreds of millions', label: 'of products in the catalog (no precise public count)' },
    narrative: 'Amazon\'s researchers have published on building a large-scale "Product Graph" that links products to categories, attributes, and each other through relations like "compatible with," "is a variant of," and "frequently bought with" — powering search and recommendations. Because manually curating relationships for hundreds of millions of listings is infeasible, this graph is inherently incomplete by design. Amazon Science papers describe using embedding-based link-prediction models (the same family of technique behind the "approximate hop" you saw in the Algorithms level) to automatically infer missing relationships at scale.',
    techStack: ['Property-graph-style product relations', 'Embedding-based link prediction', 'NLP attribute extraction', 'Search & recommendations'],
    schema: {
      hub: { id: 'case', label: 'iPhone 15 Case' },
      spokes: [
        { id: 'category', label: 'Phone Case', rel: 'is a' },
        { id: 'iphone', label: 'iPhone 15', rel: 'compatible with' },
        { id: 'apple', label: 'Apple Inc.', rel: 'made by' },
        { id: 'screenprotector', label: 'Screen Protector', rel: 'bought together' }
      ]
    }
  },
  {
    id: 'linkedin-economic-graph',
    name: 'LinkedIn Economic Graph',
    glyph: 'L',
    tagline: 'A digital map of the global economy: people, jobs, skills, companies.',
    stats: [
      { target: 950, suffix: 'M+', label: 'members worldwide' },
      { target: 57, suffix: 'M+', label: 'companies tracked' }
    ],
    narrative: 'LinkedIn\'s Economic Graph connects four core entity types — members, jobs, skills, and companies — into a single structural map of the labor market. A member links to the skills they claim, the companies they\'ve worked at, and the schools they attended; a job links to the skills it requires and the company posting it. That connected structure is what powers talent matching, skills-gap analysis, and labor-market insights shared with policymakers and workforce researchers — not just "who do you know," but "how do people, skills, and jobs relate."',
    techStack: ['Member / job / skill / company graph', 'Talent-matching & search', 'Labor-market analytics', 'Skills taxonomy'],
    schema: {
      hub: { id: 'member', label: 'Member Profile' },
      spokes: [
        { id: 'skill', label: 'Data Analysis', rel: 'has skill' },
        { id: 'company', label: 'Acme Corp', rel: 'works at' },
        { id: 'job', label: 'Data Scientist Job', rel: 'matches' },
        { id: 'school', label: 'State University', rel: 'studied at' }
      ]
    }
  },
  {
    id: 'snomed-ct',
    name: 'SNOMED CT (Healthcare Ontology)',
    glyph: '+',
    tagline: 'One shared clinical vocabulary so hospitals and countries can actually understand each other.',
    stats: [
      { target: 365, suffix: 'K+', label: 'clinical concepts' },
      { target: 80, suffix: '+', label: 'countries using it' }
    ],
    narrative: 'SNOMED CT is a formal clinical ontology maintained by SNOMED International, a not-for-profit with 40+ member countries. It contains 365,000+ precisely defined clinical concepts — diagnoses, procedures, findings, body structures — linked through "is a" hierarchies and defining relationships (e.g. Type 2 Diabetes "is a" Diabetes Mellitus, with finding site Pancreas). Because every hospital and country maps its own records to this shared vocabulary, patient data — diagnoses, allergies, procedures — can be exchanged between electronic health record systems without ambiguity, even across languages and borders.',
    techStack: ['Formal is-a hierarchies', 'Defining relationships (RDF/OWL-compatible)', 'EHR interoperability', 'Clinical decision support'],
    schema: {
      hub: { id: 't2d', label: 'Type 2 Diabetes' },
      spokes: [
        { id: 'dm', label: 'Diabetes Mellitus', rel: 'is a' },
        { id: 'pancreas', label: 'Pancreas', rel: 'finding site' },
        { id: 'insulinres', label: 'Insulin Resistance', rel: 'associated with' },
        { id: 'metformin', label: 'Metformin', rel: 'treated by' }
      ]
    }
  },
  {
    id: 'microsoft-graph',
    name: 'Microsoft Graph',
    glyph: 'M',
    tagline: 'One API surface unifying Microsoft 365 — now the grounding layer for Copilot.',
    stats: [],
    qualStat: { display: 'One unified API', label: 'connecting users, files, mail, chats & more across Microsoft 365' },
    narrative: 'Microsoft Graph is a single REST API that connects the entities of Microsoft 365 — users, files, mail, calendar events, Teams chats, and more — as one navigable, permission-aware graph instead of siloed products. Its most consequential modern role is grounding: Microsoft 365 Copilot uses Microsoft Graph to retrieve an organization\'s actual documents, emails, and conversations so its answers reference real content the requesting user is already allowed to see, rather than the model guessing from training data alone — all governed by existing Microsoft 365 permissions and compliance controls.',
    techStack: ['Unified REST graph API', 'Permission-aware entity access', 'Copilot grounding', 'Cross-app (Outlook/Teams/SharePoint) data'],
    schema: {
      hub: { id: 'user', label: 'User Account' },
      spokes: [
        { id: 'team', label: 'Engineering Team', rel: 'member of' },
        { id: 'file', label: 'Q3 Report.docx', rel: 'owns file' },
        { id: 'chat', label: 'Copilot Chat', rel: 'grounds response' },
        { id: 'event', label: 'Sprint Planning', rel: 'has event' }
      ]
    }
  },
  {
    id: 'palantir-ontology',
    name: "Palantir's Ontology (Foundry)",
    glyph: 'P',
    tagline: 'A "digital twin" of an organization — objects, links, and governed actions.',
    stats: [],
    qualStat: { display: 'Semantic + kinetic layer', label: 'modeling both the state and the allowed changes to an organization\'s data' },
    narrative: 'Palantir Foundry\'s Ontology layer maps raw datasets onto real-world business concepts: Object Types (e.g. Shipment, Vessel) are schema definitions whose instances are Objects; Properties describe their attributes; Link Types define relationships between Object Types, exactly like the predicate in a subject-predicate-object triple. Crucially, the Ontology is more than a passive map — Action Types define governed, permissioned edits that can be made to objects and links, so applications and AI agents interact with meaningful business objects (and can safely act on them) instead of raw, disconnected tables.',
    techStack: ['Object / Property / Link Types', 'Action Types (governed edits)', 'Functions (server-side logic)', 'Interfaces (polymorphism across types)'],
    schema: {
      hub: { id: 'shipment', label: 'Shipment #4471' },
      spokes: [
        { id: 'vessel', label: 'Cargo Vessel', rel: 'link: transported by' },
        { id: 'port', label: 'Port of Rotterdam', rel: 'link: destined for' },
        { id: 'delay', label: 'Delay Alert', rel: 'action: triggers' },
        { id: 'status', label: 'Customs Status', rel: 'property: has' }
      ]
    }
  }
];

export const caseStudyQuiz = [
  {
    q: 'What made Google\'s Knowledge Graph a landmark moment for search?',
    options: [
      'It let Google return direct facts and relationships about entities, not just links to pages',
      'It replaced keyword search with a phone directory',
      'It only worked for searching movies',
      'It was the very first ontology ever created'
    ],
    answer: 0,
    hint: 'Think about the "knowledge panel" boxes you see next to search results with facts about a person or place.'
  },
  {
    q: 'Why is a graph like Amazon\'s Product Graph inherently "incomplete," and how do engineers deal with it?',
    options: [
      'It\'s a bug Amazon has never noticed',
      'Because manually cataloging every relationship among hundreds of millions of products is infeasible, so embedding-based models predict missing links',
      'Amazon doesn\'t use knowledge graphs at all',
      'Customers are allowed to delete relationships from the catalog'
    ],
    answer: 1,
    hint: 'Recall "embedding-based similarity search" from the Algorithms level — the same idea helps fill gaps in a graph at massive scale.'
  },
  {
    q: 'What core entity types does LinkedIn\'s Economic Graph connect to map the global economy?',
    options: [
      'Only job postings',
      'Only companies and their stock prices',
      'Members, jobs, skills, and companies',
      'Only universities and degrees'
    ],
    answer: 2,
    hint: 'Think about everything linked from your own LinkedIn profile.'
  },
  {
    q: 'Why do healthcare systems rely on a shared ontology like SNOMED CT instead of each hospital inventing its own terms?',
    options: [
      'It\'s required by hardware manufacturers',
      'A shared, standardized set of clinical concepts lets different systems and countries exchange patient data unambiguously',
      'It makes medical billing more expensive',
      'It only applies to veterinary medicine'
    ],
    answer: 1,
    hint: 'This is the "shared vocabulary / interoperability" benefit from the Concepts level, applied to hospitals and health records.'
  },
  {
    q: 'How does Microsoft Graph help "ground" Microsoft 365 Copilot\'s answers?',
    options: [
      'By letting Copilot generate answers at random',
      'By replacing the need for any AI model entirely',
      'By storing only publicly available web data',
      'By giving Copilot secure, permission-respecting access to an org\'s real files, mail, and chats so answers reference actual content'
    ],
    answer: 3,
    hint: '"Grounding" means tying an LLM\'s answer to real, verifiable data instead of letting it guess from training data alone.'
  },
  {
    q: 'In Palantir\'s Ontology, what does a "Link Type" represent?',
    options: [
      'A hyperlink on a public webpage',
      'A schema-level definition of a relationship between two Object Types — playing the same role as a predicate in a triple',
      'A type of software license',
      'A password-reset link'
    ],
    answer: 1,
    hint: 'Recall RDF triples: subject–predicate–object. A Link Type plays the predicate\'s role, but between two Object Types.'
  }
];
