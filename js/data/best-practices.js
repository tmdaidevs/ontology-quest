// best-practices.js — data for Level 10: "Best Practices & Anti-Patterns". A technically valid
// ontology can still be badly designed. This level distills widely-recognized ontology / knowledge
// graph modeling wisdom — used across real enterprise deployments (see the Enterprise Case Studies
// level for examples like Palantir's Foundry Ontology) — into four core principles, a structural
// guidance reference, and a field guide of common anti-patterns. All explanations below are original
// paraphrasing of general, industry-standard modeling wisdom (domain-driven design, DRY / rule-of-
// three, the open/closed principle, composition-over-inheritance) applied specifically to ontology
// engineering — not reproduced from any single source.

// Hand-placed small diagram for the 4th principle: a brittle, 6-level-deep subClassOf chain.
export const hierarchyDiagram = {
  width: 220, height: 380,
  nodes: [
    { id: 'h-thing', label: 'Thing', x: 100, y: 24, r: 15 },
    { id: 'h-vehicle', label: 'Vehicle', x: 100, y: 88, r: 15 },
    { id: 'h-motorvehicle', label: 'MotorVehicle', x: 100, y: 152, r: 15 },
    { id: 'h-car', label: 'Car', x: 100, y: 216, r: 15 },
    { id: 'h-sedancar', label: 'SedanCar', x: 100, y: 280, r: 15 },
    { id: 'h-luxurymodel3', label: 'LuxuryModel3', x: 100, y: 344, r: 15 }
  ],
  edges: [
    { from: 'h-thing', to: 'h-vehicle', label: 'subClassOf' },
    { from: 'h-vehicle', to: 'h-motorvehicle', label: 'subClassOf' },
    { from: 'h-motorvehicle', to: 'h-car', label: 'subClassOf' },
    { from: 'h-car', to: 'h-sedancar', label: 'subClassOf' },
    { from: 'h-sedancar', to: 'h-luxurymodel3', label: 'subClassOf' }
  ]
};

// Same information, modeled as a shallow 2-level hierarchy plus composable object properties.
// Edge labels for the three siblings fanning out from "Car" are biased toward their own
// spoke (labelT) and staggered up/down (labelDy) — mirroring hubSpokeLayout()'s approach in
// graph-svg.js — since the default shared-midpoint label placement collides badly when three
// edges all originate from the same hub node. Canvas height is 380 (not the tighter 300 the
// unstaggered version used) so the bottom-most node's label has room and isn't clipped.
export const compositionDiagram = {
  width: 320, height: 380,
  nodes: [
    { id: 'c-thing', label: 'Thing', x: 160, y: 24, r: 14 },
    { id: 'c-car', label: 'Car', x: 160, y: 86, r: 17 },
    { id: 'c-luxury', label: 'Luxury', x: 48, y: 206, r: 13 },
    { id: 'c-sedan', label: 'Sedan', x: 160, y: 206, r: 13 },
    { id: 'c-tesla', label: 'Tesla', x: 272, y: 206, r: 13 },
    { id: 'c-model3', label: 'Model3', x: 160, y: 316, r: 13 }
  ],
  edges: [
    { from: 'c-thing', to: 'c-car', label: 'subClassOf' },
    { from: 'c-car', to: 'c-luxury', label: 'hasFeature', labelT: 0.68, labelDy: -8 },
    { from: 'c-car', to: 'c-sedan', label: 'hasBodyStyle', labelT: 0.68, labelDy: 10 },
    { from: 'c-car', to: 'c-tesla', label: 'manufacturedBy', labelT: 0.68, labelDy: -8 },
    { from: 'c-model3', to: 'c-car', label: 'instanceOf', labelT: 0.25, labelDy: 10 }
  ]
};

export const principles = [
  {
    id: 'domain-driven',
    title: 'Model the Domain, Not the Database',
    summary: 'Name every class and property the way a subject-matter expert would say it out loud — not after whatever table, column, or system happened to produce the data.',
    before: { title: 'Source-System Naming', body: 'Classes and properties inherited straight from a database export: SAP_TBL_4021, tbl_cust_v2, col_14, FLAG_A. Anyone outside the original data team has to reverse-engineer what these actually mean.' },
    after: { title: 'Domain Vocabulary', body: 'Customer, PurchaseOrder, hasShippingAddress — names a business user recognizes immediately, regardless of which system the underlying rows came from.' },
    why: 'A domain-driven ontology stays meaningful and queryable long after the source system that produced the data has been replaced — the vocabulary describes the business, not a snapshot of a database schema.'
  },
  {
    id: 'reuse-first',
    title: 'Reuse Before You Rebuild',
    summary: "Before minting a new class or property, check whether an existing one — in this ontology or a standard vocabulary — already captures the same concept. Only generalize once a pattern has genuinely repeated (the classic \"rule of three\").",
    before: { title: 'Duplicated Ad Hoc Properties', body: "Employee.managerName, Team.leadName, and Project.ownerName — three separate string properties independently reinventing the same \"who's in charge\" relationship, each queried differently." },
    after: { title: 'One Reusable Relationship', body: 'A single reportsTo object property (Person → Person), reused everywhere a management relationship exists — on employees, team leads, and project owners alike.' },
    why: "Every duplicate property is a place the \"same\" concept can quietly drift out of sync, and a place every downstream query has to special-case. Reuse keeps the graph consistent and reasoning simple."
  },
  {
    id: 'open-closed',
    title: 'Open for Extension, Closed for Modification',
    summary: 'Let new cases be added by extending the ontology — a new subclass, a new instance — rather than redefining what an existing class or property already means.',
    before: { title: 'Silent Redefinition', body: "A PaymentType free-text property whose accepted values quietly change over time — 'CreditCard' today, 'credit_card_v2' next quarter — silently breaking every query and rule written against the old values." },
    after: { title: 'Extend via Subclassing', body: 'Payment modeled as a class hierarchy — CreditCardPayment, WireTransferPayment, CryptoPayment. A new payment method becomes a new subclass; nothing about the existing ones changes.' },
    why: "Borrowed from the classic Open/Closed Principle in software design: a schema that can only grow by extension, never by silently rewriting existing meaning, keeps old queries and reasoning rules working as the domain evolves."
  },
  {
    id: 'composition',
    title: 'Prefer Composition Over Deep Hierarchies',
    summary: 'A tall chain of subClassOf relationships is brittle — one wrong assumption near the root breaks every descendant. Favor a shallow class hierarchy plus object properties that compose the same distinctions as facts, not tree depth.',
    before: { title: 'Deep Hierarchy (6 levels)', body: 'Thing → Vehicle → MotorVehicle → Car → SedanCar → LuxuryModel3 — six levels just to describe one car, and every new variant needs a brand-new branch decided in advance.' },
    after: { title: 'Shallow + Composition (2 levels)', body: 'Thing → Car, with Car connected via object properties: hasFeature → Luxury, hasBodyStyle → Sedan, manufacturedBy → Tesla. Same distinctions, expressed as composable facts instead of tree depth.' },
    why: '"Which branch does this really belong to?" gets harder to answer every time the domain grows in a direction nobody anticipated. Shallow hierarchies plus composition sidestep the question entirely.',
    diagrams: { hierarchy: hierarchyDiagram, composition: compositionDiagram }
  }
];

export const structuralGuidance = [
  { id: 'kinds-not-records', title: 'Classes Represent Kinds, Not One-Off Records', body: 'A class should describe a repeatable kind of thing — Invoice, Employee, Shipment. One specific invoice is an instance of that class, never a class of its own. Creating a new class per row means you actually need instances, not more classes.' },
  { id: 'properties-on-owner', title: 'Attach Properties Where the Fact Is True', body: 'Put bornOn on Person, not copied onto every class that happens to reference a person. Scalar facts belong on the class they are actually about — duplicating them elsewhere invites drift.' },
  { id: 'name-both-directions', title: 'Give Every Relationship a Clear Direction (and Inverse)', body: 'Model worksAt (Person → Company) alongside its inverse employs (Company → Person). Readers and query authors should not have to remember which way a relationship "really" goes.' },
  { id: 'stable-identity', title: 'Separate Stable Identity From Mutable Labels', body: "A Person's identity should not hinge on their current display name. Keep a stable identifier distinct from mutable properties like name or title, so renames never break references." },
  { id: 'version-schema', title: 'Version Your Schema Like You Version Code', body: 'Track when classes and properties are added, deprecated, or renamed. An ontology that changes meaning silently, with no history, breaks every downstream consumer that assumed the old meaning still held.' },
  { id: 'document-inline', title: 'Document Intent on the Class Itself', body: 'A one-line description attached directly to the class or property — not just a wiki page — survives long after the tribal knowledge that explained it has moved to a different team.' }
];

export const antiPatterns = [
  { id: 'system-silos', name: 'System Silos', body: "A separate, disconnected ontology per source system instead of one shared model — five different \"Customer\" concepts that never reference each other, defeating the entire point of building an ontology: interoperability." },
  { id: 'kitchen-sink', name: 'The Kitchen Sink', body: 'Cramming every conceivable attribute onto one giant class "just in case" instead of decomposing into related classes — a Customer class with 200 properties, most of them null for any given instance.' },
  { id: 'department-silos', name: 'Department Silos', body: "The same real-world concept modeled independently and incompatibly by each team — Sales' \"Account\" and Support's \"Account\" mean subtly different things because no shared ontology governance exists across teams." },
  { id: 'god-object', name: 'The God Object', body: 'One mega-class that tries to represent almost everything, distinguished only by a generic type string field standing in for real subclasses — you lose the ability to apply class-specific constraints or reasoning.' },
  { id: 'golden-hammer', name: 'The Golden Hammer', body: 'Reflexively modeling every relationship as a generic relatedTo or associatedWith edge instead of naming what it actually means — technically connected, but useless for real querying or inference.' },
  { id: 'action-sprawl', name: 'Action Sprawl', body: 'Every business process gets its own bespoke, one-off property — didThing1, handledCaseA, processedFormB — instead of a consistent, reusable pattern for modeling actions or events.' },
  { id: 'time-machine', name: 'The Time Machine', body: "Overwriting a fact in place instead of modeling it as time-bound — updating Employee.title directly erases \"was a Manager until last March, now a Director,\" destroying history the ontology often exists specifically to preserve." },
  { id: 'misnomer', name: 'The Misnomer', body: 'Naming a class or property after an implementation detail or internal jargon instead of the real-world concept it represents — flag_3, tbl_join_x — the exact opposite of domain-driven modeling.' }
];

export const bestPracticesQuiz = [
  {
    q: "Three different teams each store their own version of a 'Customer' entity, and none of them connect to or reference each other's data.",
    options: ['System Silos', 'The God Object', 'The Time Machine', 'The Misnomer'],
    answer: 0,
    hint: "Think about what's missing between the three versions — any shared connection at all."
  },
  {
    q: "A single 'Thing' class has a generic type string field ('customer', 'invoice', 'product') instead of real subclasses, so nothing can apply class-specific rules.",
    options: ['The Golden Hammer', 'The God Object', 'Action Sprawl', 'Department Silos'],
    answer: 1,
    hint: 'The class tries to represent almost anything at once — that\'s the giveaway.'
  },
  {
    q: "Every relationship in the graph — 'works at', 'purchased', 'located in' — is modeled using the exact same generic relatedTo edge.",
    options: ['The Kitchen Sink', 'The Misnomer', 'The Golden Hammer', 'The Time Machine'],
    answer: 2,
    hint: 'One generic tool being reached for, no matter what the job actually calls for.'
  },
  {
    q: "An employee's job title is updated in place when they get promoted, so the ontology can no longer answer 'what was their title in 2022?'",
    options: ['The Time Machine', 'System Silos', 'Action Sprawl', 'The Misnomer'],
    answer: 0,
    hint: 'The problem here is about losing access to a previous point in time.'
  },
  {
    q: "A property is literally named col_14 because that's what the source spreadsheet called it.",
    options: ['Open for Extension, Closed for Modification', 'Model the Domain, Not the Database', 'Reuse Before You Rebuild', 'Composition Over Deep Hierarchies'],
    answer: 1,
    hint: 'The name reflects the source system, not what a domain expert would actually call it.'
  },
  {
    q: 'A Vehicle class hierarchy is six levels deep by the time you reach a specific trim, and nobody agrees which branch a new vehicle type belongs under.',
    options: ['Composition Over Deep Hierarchies', 'Reuse Before You Rebuild', 'Model the Domain, Not the Database', 'Open for Extension, Closed for Modification'],
    answer: 0,
    hint: 'The problem is hierarchy depth, not naming or duplication.'
  }
];
