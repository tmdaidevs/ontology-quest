// algo-graph.js — sample data for Level 7's algorithm visualizations.
// Reuses the "isA" taxonomy idea from Level 2 so the graph itself teaches nothing new;
// the point here is purely to watch BFS/DFS/embedding-search *algorithms* operate on it.

// A small class hierarchy: Entity -> {Animal, Vehicle} -> subclasses -> leaf instances-of-classes.
// Good branching factor (2-2-2/1) so BFS and DFS visit orders diverge clearly.
export const taxonomyGraph = {
  nodes: [
    { id: 'entity', label: 'Entity', x: 350, y: 40 },
    { id: 'animal', label: 'Animal', x: 170, y: 150 },
    { id: 'vehicle', label: 'Vehicle', x: 530, y: 150 },
    { id: 'mammal', label: 'Mammal', x: 80, y: 260 },
    { id: 'bird', label: 'Bird', x: 260, y: 260 },
    { id: 'car', label: 'Car', x: 450, y: 260 },
    { id: 'truck', label: 'Truck', x: 610, y: 260 },
    { id: 'cat', label: 'Cat', x: 40, y: 355 },
    { id: 'dog', label: 'Dog', x: 140, y: 355 },
    { id: 'eagle', label: 'Eagle', x: 260, y: 355 }
  ],
  edges: [
    { from: 'animal', to: 'entity', label: 'isA' },
    { from: 'vehicle', to: 'entity', label: 'isA' },
    { from: 'mammal', to: 'animal', label: 'isA' },
    { from: 'bird', to: 'animal', label: 'isA' },
    { from: 'car', to: 'vehicle', label: 'isA' },
    { from: 'truck', to: 'vehicle', label: 'isA' },
    { from: 'cat', to: 'mammal', label: 'isA' },
    { from: 'dog', to: 'mammal', label: 'isA' },
    { from: 'eagle', to: 'bird', label: 'isA' }
  ]
};

// Simplified 2D "embedding space" — in a real system these would be high-dimensional
// (e.g. 768-d) vectors from a language model, projected down for visualization. Distances
// here stand in for semantic/cosine similarity: closer points = more similar meaning.
// "wolf" is deliberately placed near the mammal cluster with NO explicit graph edge to any
// of them, to demonstrate an "approximate hop" found purely through vector similarity.
export const embeddingPoints = [
  { id: 'cat', label: 'Cat', x: 120, y: 95, cluster: 'mammal' },
  { id: 'dog', label: 'Dog', x: 155, y: 135, cluster: 'mammal' },
  { id: 'lion', label: 'Lion', x: 95, y: 150, cluster: 'mammal' },
  { id: 'tiger', label: 'Tiger', x: 80, y: 110, cluster: 'mammal' },
  { id: 'eagle', label: 'Eagle', x: 430, y: 75, cluster: 'bird' },
  { id: 'sparrow', label: 'Sparrow', x: 470, y: 105, cluster: 'bird' },
  { id: 'hawk', label: 'Hawk', x: 445, y: 130, cluster: 'bird' },
  { id: 'car', label: 'Car', x: 250, y: 305, cluster: 'vehicle' },
  { id: 'truck', label: 'Truck', x: 295, y: 325, cluster: 'vehicle' },
  { id: 'bicycle', label: 'Bicycle', x: 215, y: 335, cluster: 'vehicle' },
  { id: 'wolf', label: 'Wolf (query)', x: 140, y: 108, cluster: 'query' }
];
