// reasoning-graph.js — sample org-chart knowledge graph used in Level 4 to demonstrate
// single-hop lookup vs. multi-hop traversal/reasoning.

export const orgGraph = {
  nodes: [
    { id: 'you', label: 'You', x: 90, y: 300 },
    { id: 'mgr', label: 'Your Manager (Alice)', x: 260, y: 190 },
    { id: 'mgr2', label: "Alice's Manager (Bob)", x: 460, y: 90 },
    { id: 'peer1', label: 'Peer: Sam', x: 260, y: 320 },
    { id: 'peer2', label: 'Peer: Rae', x: 90, y: 130 },
    { id: 'colleague1', label: 'Colleague: Dee', x: 620, y: 190 },
    { id: 'colleague2', label: 'Colleague: Wes', x: 620, y: 320 },
    { id: 'colleague3', label: 'Colleague: Nia', x: 460, y: 320 }
  ],
  edges: [
    { from: 'you', to: 'mgr', label: 'reportsTo' },
    { from: 'peer1', to: 'mgr', label: 'reportsTo' },
    { from: 'peer2', to: 'mgr', label: 'reportsTo' },
    { from: 'mgr', to: 'mgr2', label: 'reportsTo' },
    { from: 'colleague3', to: 'mgr2', label: 'reportsTo' },
    { from: 'colleague1', to: 'mgr2', label: 'reportsTo' },
    { from: 'colleague2', to: 'mgr2', label: 'reportsTo' }
  ]
};

// Single-hop example: "Who is your manager?" — one edge traversal.
export const singleHopQuery = {
  question: 'Who is your manager?',
  path: [{ nodes: ['you', 'mgr'], edges: [0] }],
  answerNodeIds: ['mgr']
};

// Multi-hop example: "Who are the colleagues of my manager's manager?"
// Hop 1: you -> mgr (reportsTo)
// Hop 2: mgr -> mgr2 (reportsTo)
// Hop 3: mgr2 <- colleagues (reportsTo) -- find peers who also report to mgr2
export const multiHopQuery = {
  question: "Who are the colleagues of my manager's manager?",
  steps: [
    {
      label: 'Hop 1 — start at "You", follow reportsTo to find your manager.',
      nodes: ['you', 'mgr'],
      edges: [0]
    },
    {
      label: "Hop 2 — from your manager, follow reportsTo again to find their manager.",
      nodes: ['mgr', 'mgr2'],
      edges: [3]
    },
    {
      label: 'Hop 3 — from your manager\'s manager, follow reportsTo backwards to find everyone else who reports to them (their direct reports = colleagues at that level).',
      nodes: ['mgr2', 'mgr', 'colleague1', 'colleague2', 'colleague3'],
      edges: [3, 4, 5, 6]
    }
  ],
  answerNodeIds: ['colleague1', 'colleague2', 'colleague3']
};
