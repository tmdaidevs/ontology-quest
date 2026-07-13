// scenarios.js — starter templates for Level 5 sandbox (Build Your Own Ontology).

export const scenarios = [
  {
    id: 'org-chart',
    name: "Company Org Chart",
    description: 'Model employees, roles, and departments in an organization.',
    starter: {
      nodes: [
        { id: 'n1', label: 'Employee', kind: 'class', x: 140, y: 90 },
        { id: 'n2', label: 'Manager', kind: 'class', x: 140, y: 200 },
        { id: 'n3', label: 'Department', kind: 'class', x: 380, y: 90 },
        { id: 'n4', label: 'Alice (Manager)', kind: 'instance', x: 140, y: 310 }
      ],
      edges: [
        { from: 'n2', to: 'n1', label: 'subClassOf' },
        { from: 'n4', to: 'n2', label: 'instanceOf' },
        { from: 'n1', to: 'n3', label: 'belongsTo' }
      ]
    }
  },
  {
    id: 'movie-recs',
    name: 'Movie Recommendation System',
    description: 'Model movies, genres, actors, and user ratings.',
    starter: {
      nodes: [
        { id: 'n1', label: 'Movie', kind: 'class', x: 140, y: 90 },
        { id: 'n2', label: 'Genre', kind: 'class', x: 380, y: 90 },
        { id: 'n3', label: 'Person', kind: 'class', x: 380, y: 220 },
        { id: 'n4', label: 'Inception', kind: 'instance', x: 140, y: 220 }
      ],
      edges: [
        { from: 'n4', to: 'n1', label: 'instanceOf' },
        { from: 'n1', to: 'n2', label: 'hasGenre' },
        { from: 'n1', to: 'n3', label: 'hasDirector' }
      ]
    }
  },
  {
    id: 'support-kb',
    name: 'Customer Support Knowledge Base',
    description: 'Model products, issues, solutions, and articles.',
    starter: {
      nodes: [
        { id: 'n1', label: 'Product', kind: 'class', x: 140, y: 90 },
        { id: 'n2', label: 'Issue', kind: 'class', x: 380, y: 90 },
        { id: 'n3', label: 'Solution', kind: 'class', x: 380, y: 220 },
        { id: 'n4', label: 'Article', kind: 'class', x: 140, y: 220 }
      ],
      edges: [
        { from: 'n1', to: 'n2', label: 'hasIssue' },
        { from: 'n2', to: 'n3', label: 'resolvedBy' },
        { from: 'n3', to: 'n4', label: 'documentedIn' }
      ]
    }
  },
  {
    id: 'custom',
    name: 'Fully Custom',
    description: 'Start from a blank canvas and design any ontology you like.',
    starter: { nodes: [], edges: [] }
  }
];
