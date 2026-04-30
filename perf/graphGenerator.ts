import { Graph } from '../src/index';

export interface GraphMeta {
  graph: Graph;
  nodeIds: string[];
  nodeCount: number;
  edgeCount: number;
  /** Pairs of [sourceId, targetId] guaranteed to be 3+ hops apart for traversal benchmarks */
  traversalPairs: Array<[string, string]>;
  /** A separate small DAG graph for isDAG / topologicalSort benchmarks */
  dagGraph: Graph;
  dagNodeIds: string[];
  heapFootprintBytes: number;
}

const NODE_TYPES = ['Person', 'Product', 'Category', 'Tag', 'Order'];
const EDGE_TYPES = ['KNOWS', 'BOUGHT', 'TAGGED_WITH', 'IN_CATEGORY', 'PLACED'];

/** Simple seeded pseudo-random number generator (mulberry32) for reproducibility */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return function (): number {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pickRandom<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Builds a random directed graph with the given node and edge counts.
 * Returns the graph plus useful metadata for benchmarks.
 */
export function buildGraph(nodeCount: number, edgesPerNode: number, seed = 42): GraphMeta {
  const rng = makeRng(seed);

  // ── Graph footprint snapshot ──────────────────────────────────────────────
  if (typeof global.gc === 'function') global.gc();
  const heapBefore = process.memoryUsage().heapUsed;

  const graph = new Graph();
  const nodeIds: string[] = [];

  // Add nodes
  for (let i = 0; i < nodeCount; i++) {
    const type = NODE_TYPES[i % NODE_TYPES.length];
    const node = graph.addNode(type, {
      index: i,
      label: `${type}-${i}`,
      score: Math.round(rng() * 1000) / 10,
      active: rng() > 0.2,
    });
    nodeIds.push(node.id);
  }

  // Add edges — each node gets `edgesPerNode` random outgoing edges (avg)
  let edgeCount = 0;
  for (let i = 0; i < nodeCount; i++) {
    const numEdges = randInt(rng, Math.max(1, edgesPerNode - 1), edgesPerNode + 1);
    const sourceId = nodeIds[i];
    for (let j = 0; j < numEdges; j++) {
      let targetIdx = randInt(rng, 0, nodeCount - 1);
      // Avoid self-loops
      if (targetIdx === i) targetIdx = (targetIdx + 1) % nodeCount;
      const targetId = nodeIds[targetIdx];
      const type = EDGE_TYPES[Math.floor(rng() * EDGE_TYPES.length)];
      try {
        graph.addEdge(sourceId, targetId, type, { weight: Math.round(rng() * 100) });
        edgeCount++;
      } catch {
        // Duplicate edge id is extremely rare but skip silently
      }
    }
  }

  if (typeof global.gc === 'function') global.gc();
  const heapAfter = process.memoryUsage().heapUsed;
  const heapFootprintBytes = Math.max(0, heapAfter - heapBefore);

  // ── Pick traversal pairs ──────────────────────────────────────────────────
  // Sample 10 random (source, target) pairs from different parts of the graph
  const traversalPairs: Array<[string, string]> = [];
  const step = Math.floor(nodeCount / 12);
  for (let k = 0; k < 10; k++) {
    const srcIdx = (k * step) % nodeCount;
    const tgtIdx = (srcIdx + Math.floor(nodeCount * 0.3) + k * 97) % nodeCount;
    traversalPairs.push([nodeIds[srcIdx], nodeIds[tgtIdx]]);
  }

  // ── Build a separate DAG for isDAG / topologicalSort ──────────────────────
  const dagSize = Math.min(5000, Math.floor(nodeCount * 0.05));
  const { graph: dagGraph, nodeIds: dagNodeIds } = buildDag(dagSize, rng);

  return {
    graph,
    nodeIds,
    nodeCount,
    edgeCount,
    traversalPairs,
    dagGraph,
    dagNodeIds,
    heapFootprintBytes,
  };
}

/** Builds a pure DAG (linear layers with forward-only edges) */
function buildDag(
  nodeCount: number,
  rng: () => number,
): { graph: Graph; nodeIds: string[] } {
  const dagGraph = new Graph();
  const dagNodeIds: string[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const node = dagGraph.addNode('DAGNode', { index: i });
    dagNodeIds.push(node.id);
  }

  // Only add edges from lower-index → higher-index nodes to guarantee no cycles
  for (let i = 0; i < nodeCount - 1; i++) {
    const numEdges = randInt(rng, 1, 3);
    for (let j = 0; j < numEdges; j++) {
      const targetIdx = randInt(rng, i + 1, Math.min(nodeCount - 1, i + 10));
      try {
        dagGraph.addEdge(dagNodeIds[i], dagNodeIds[targetIdx], 'DEP');
      } catch {
        // ignore duplicate
      }
    }
  }

  return { graph: dagGraph, nodeIds: dagNodeIds };
}
