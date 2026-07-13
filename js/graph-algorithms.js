// graph-algorithms.js — generic graph traversal algorithms used to visually demonstrate
// how multi-hop graph queries are actually computed under the hood (Level 7).
// Pure functions: given a graph + start node, they return the full ordered list of
// visitation steps so the UI can play them back one at a time (or all at once).

/** Builds an undirected adjacency list: { nodeId: [{ to, edgeIndex }, ...] }. Graph
 * databases commonly support traversal in either direction across a relationship,
 * so we treat edges as bidirectional for the purposes of pathfinding. */
function buildAdjacency(graph) {
  const adj = {};
  graph.nodes.forEach(n => { adj[n.id] = []; });
  graph.edges.forEach((e, i) => {
    adj[e.from].push({ to: e.to, edgeIndex: i });
    adj[e.to].push({ to: e.from, edgeIndex: i });
  });
  return adj;
}

/**
 * Breadth-First Search: explore every neighbor at the current distance before going
 * one level deeper. Uses a FIFO queue. Good for "shortest path" / nearest-connections
 * questions. Returns steps: { node, edge, frontier } where `frontier` is a snapshot of
 * the queue immediately after this node was dequeued and its new neighbors enqueued.
 */
export function bfsSteps(graph, startId) {
  const adj = buildAdjacency(graph);
  const visited = new Set([startId]);
  const queue = [startId];
  const steps = [{ node: startId, edge: null, frontier: [] }];
  while (queue.length) {
    const current = queue.shift();
    for (const { to, edgeIndex } of adj[current]) {
      if (!visited.has(to)) {
        visited.add(to);
        queue.push(to);
        steps.push({ node: to, edge: edgeIndex, frontier: [...queue] });
      }
    }
  }
  return steps;
}

/**
 * Depth-First Search (iterative pre-order): commit to one path and follow it as far as
 * possible before backtracking. Uses a LIFO call stack. Returns steps: { node, edge,
 * frontier } where `frontier` is a snapshot of the current stack (path from the root to
 * the node just visited).
 */
export function dfsSteps(graph, startId) {
  const adj = buildAdjacency(graph);
  const visited = new Set();
  const steps = [];
  const stack = [];

  function visit(nodeId, edgeIndex) {
    visited.add(nodeId);
    stack.push(nodeId);
    steps.push({ node: nodeId, edge: edgeIndex, frontier: [...stack] });
    for (const { to, edgeIndex: ei } of adj[nodeId]) {
      if (!visited.has(to)) visit(to, ei);
    }
    stack.pop();
  }
  visit(startId, null);
  return steps;
}
