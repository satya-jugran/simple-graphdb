import { Graph } from '../src/index';
import type { GraphMeta } from './graphGenerator';
import type { BenchmarkScenario } from './benchmarkRunner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick a node id at a deterministic offset (avoids random overhead in hot loop) */
function pickId(meta: GraphMeta, offset: number): string {
  return meta.nodeIds[offset % meta.nodeIds.length];
}

// ─── Scenario Definitions ─────────────────────────────────────────────────────

export function buildScenarios(nodeCount: number): BenchmarkScenario[] {
  // Scale iteration counts to graph size — fewer for expensive ops
  const isLarge = nodeCount >= 50_000;

  return [
    // ── Write: Graph Construction ─────────────────────────────────────────
    {
      category: 'Write',
      name: 'Graph Construction',
      setup: () => new Graph(), // return fresh graph; ignored — perfTest handles this
      run: (_graph, meta) => {
        // Build a small fresh graph each iteration to benchmark construction cost
        const g = new Graph();
        const ids: string[] = [];
        const batch = Math.min(500, Math.floor(meta.nodeCount / 20));
        for (let i = 0; i < batch; i++) {
          const n = g.addNode('Person', { index: i, label: `node-${i}` });
          ids.push(n.id);
        }
        const edgeBatch = Math.min(batch * 2, ids.length - 1);
        for (let i = 0; i < edgeBatch; i++) {
          g.addEdge(ids[i], ids[(i + 1) % ids.length], 'KNOWS');
        }
        return g;
      },
      iterations: isLarge ? 5 : 10,
    },

    // ── Write: addNode ────────────────────────────────────────────────────
    {
      category: 'Write',
      name: 'addNode (single)',
      setup: () => {
        // Return a fresh graph that we'll add nodes into
        return new Graph();
      },
      run: (graph, _meta) => {
        graph.addNode('Product', { label: `product-${Math.random()}`, score: 99 });
      },
      iterations: 10_000,
    },

    // ── Write: addEdge ────────────────────────────────────────────────────
    {
      category: 'Write',
      name: 'addEdge (single)',
      setup: (meta) => {
        // Build a small pool of nodes to connect
        const g = new Graph();
        const pool = 500;
        for (let i = 0; i < pool; i++) {
          g.addNode('Person', { index: i });
        }
        // Store pool ids in a stable location
        (meta as GraphMeta & { _edgePool?: string[] })._edgePool = g.getNodes().map(n => n.id);
        return g;
      },
      run: (graph, meta) => {
        const pool = (meta as GraphMeta & { _edgePool?: string[] })._edgePool!;
        const src = pool[Math.floor(Math.random() * pool.length)];
        const tgt = pool[Math.floor(Math.random() * pool.length)];
        if (src !== tgt) {
          try { graph.addEdge(src, tgt, 'KNOWS'); } catch { /* dup — skip */ }
        }
      },
      iterations: 5_000,
    },

    // ── Read: getNode by id ────────────────────────────────────────────────
    {
      category: 'Read',
      name: 'getNode (by id)',
      run: (graph, meta) => {
        return graph.getNode(pickId(meta, 42));
      },
      iterations: isLarge ? 50_000 : 100_000,
    },

    // ── Read: hasNode ──────────────────────────────────────────────────────
    {
      category: 'Read',
      name: 'hasNode',
      run: (graph, meta) => {
        return graph.hasNode(pickId(meta, 7777));
      },
      iterations: isLarge ? 50_000 : 100_000,
    },

    // ── Read: getNodesByType ───────────────────────────────────────────────
    {
      category: 'Read',
      name: 'getNodesByType',
      run: (graph, _meta) => {
        return graph.getNodesByType('Person');
      },
      iterations: isLarge ? 50 : 100,
    },

    // ── Read: getNodesByProperty ───────────────────────────────────────────
    {
      category: 'Read',
      name: 'getNodesByProperty',
      run: (graph, _meta) => {
        return graph.getNodesByProperty('active', true);
      },
      iterations: isLarge ? 10 : 20,
    },

    // ── Read: getNodes (full scan) ─────────────────────────────────────────
    {
      category: 'Read',
      name: 'getNodes (all)',
      run: (graph, _meta) => {
        return graph.getNodes();
      },
      iterations: isLarge ? 10 : 40,
    },

    // ── Navigation: getChildren ────────────────────────────────────────────
    {
      category: 'Navigation',
      name: 'getChildren',
      run: (graph, meta) => {
        return graph.getChildren(pickId(meta, 1234));
      },
      iterations: isLarge ? 1_000 : 2_000,
    },

    // ── Navigation: getParents ─────────────────────────────────────────────
    {
      category: 'Navigation',
      name: 'getParents',
      run: (graph, meta) => {
        return graph.getParents(pickId(meta, 5678));
      },
      iterations: isLarge ? 1_000 : 2_000,
    },

    // ── Navigation: getEdgesFrom ───────────────────────────────────────────
    {
      category: 'Navigation',
      name: 'getEdgesFrom',
      run: (graph, meta) => {
        return graph.getEdgesFrom(pickId(meta, 999));
      },
      iterations: isLarge ? 1_000 : 2_000,
    },

    // ── Navigation: getEdgesTo ─────────────────────────────────────────────
    {
      category: 'Navigation',
      name: 'getEdgesTo',
      run: (graph, meta) => {
        return graph.getEdgesTo(pickId(meta, 333));
      },
      iterations: isLarge ? 1_000 : 2_000,
    },

    // ── Navigation: getDirectEdgesBetween ─────────────────────────────────
    {
      category: 'Navigation',
      name: 'getDirectEdgesBetween',
      run: (graph, meta) => {
        const [src, tgt] = meta.traversalPairs[0];
        return graph.getDirectEdgesBetween(src, tgt);
      },
      iterations: isLarge ? 1_000 : 3_000,
    },

    // ── Traversal: BFS ─────────────────────────────────────────────────────
    {
      category: 'Traversal',
      name: 'traverse BFS',
      run: (graph, meta) => {
        const [src, tgt] = meta.traversalPairs[0];
        return graph.traverse(src, tgt, { method: 'bfs' });
      },
      iterations: isLarge ? 20 : 100,
    },

    // ── Traversal: DFS ─────────────────────────────────────────────────────
    {
      category: 'Traversal',
      name: 'traverse DFS',
      run: (graph, meta) => {
        const [src, tgt] = meta.traversalPairs[1];
        return graph.traverse(src, tgt, { method: 'dfs' });
      },
      iterations: isLarge ? 20 : 100,
    },

    // ── Traversal: BFS with type filters ──────────────────────────────────
    {
      category: 'Traversal',
      name: 'traverse BFS (typed)',
      run: (graph, meta) => {
        const [src, tgt] = meta.traversalPairs[2];
        return graph.traverse(src, tgt, { method: 'bfs', nodeTypes: ['Person', 'Product'], edgeTypes: ['KNOWS', 'BOUGHT'] });
      },
      iterations: isLarge ? 20 : 100,
    },

    // ── Traversal: Wildcard ────────────────────────────────────────────────
    {
      category: 'Traversal',
      name: 'traverse wildcard src',
      run: (graph, meta) => {
        const tgt = pickId(meta, 500);
        return graph.traverse('*', tgt, { method: 'bfs', maxResults: 10 });
      },
      iterations: isLarge ? 5 : 10,
    },

    // ── Analysis: isDAG ───────────────────────────────────────────────────
    {
      category: 'Analysis',
      name: 'isDAG (DAG graph)',
      run: (_graph, meta) => {
        return meta.dagGraph.isDAG();
      },
      iterations: isLarge ? 10 : 30,
    },

    // ── Analysis: isDAG on cyclic ─────────────────────────────────────────
    {
      category: 'Analysis',
      name: 'isDAG (cyclic graph)',
      run: (graph, _meta) => {
        return graph.isDAG();
      },
      iterations: isLarge ? 5 : 15,
    },

    // ── Analysis: topologicalSort ─────────────────────────────────────────
    {
      category: 'Analysis',
      name: 'topologicalSort (DAG)',
      run: (_graph, meta) => {
        return meta.dagGraph.topologicalSort();
      },
      iterations: isLarge ? 10 : 30,
    },

    // ── Serialization: exportJSON ─────────────────────────────────────────
    {
      category: 'Serialization',
      name: 'exportJSON',
      run: (graph, _meta) => {
        return graph.exportJSON();
      },
      iterations: isLarge ? 3 : 8,
    },

    // ── Serialization: importJSON ─────────────────────────────────────────
    {
      category: 'Serialization',
      name: 'importJSON',
      setup: (meta) => {
        // Pre-serialize once; importJSON is the only timed op
        (meta as GraphMeta & { _serialized?: unknown })._serialized = meta.graph.exportJSON();
      },
      run: (_graph, meta) => {
        const data = (meta as GraphMeta & { _serialized?: unknown })._serialized as Parameters<typeof Graph.importJSON>[0];
        return Graph.importJSON(data);
      },
      iterations: isLarge ? 3 : 8,
    },

    // ── Mutation: removeEdge ──────────────────────────────────────────────
    {
      category: 'Mutation',
      name: 'removeEdge',
      setup: (meta) => {
        // Build a disposable graph with fresh edges to remove
        const g = new Graph();
        const ids: string[] = [];
        const n = 2_000;
        for (let i = 0; i < n; i++) {
          ids.push(g.addNode('Person', { i }).id);
        }
        const edgeIds: string[] = [];
        for (let i = 0; i < n - 1; i++) {
          edgeIds.push(g.addEdge(ids[i], ids[i + 1], 'KNOWS').id);
        }
        (meta as GraphMeta & { _removeEdgeGraph?: Graph; _removeEdgeIds?: string[] })._removeEdgeGraph = g;
        (meta as GraphMeta & { _removeEdgeGraph?: Graph; _removeEdgeIds?: string[] })._removeEdgeIds = edgeIds;
        return g;
      },
      run: (_graph, meta) => {
        const m = meta as GraphMeta & { _removeEdgeGraph?: Graph; _removeEdgeIds?: string[] };
        const ids = m._removeEdgeIds!;
        if (ids.length > 0) {
          const id = ids.pop()!;
          m._removeEdgeGraph!.removeEdge(id);
        }
      },
      iterations: 1_000,
    },

    // ── Mutation: removeNode (cascade) ────────────────────────────────────
    {
      category: 'Mutation',
      name: 'removeNode (cascade)',
      setup: (meta) => {
        const g = new Graph();
        const ids: string[] = [];
        const n = 2_000;
        for (let i = 0; i < n; i++) {
          ids.push(g.addNode('Person', { i }).id);
        }
        for (let i = 0; i < n - 1; i++) {
          g.addEdge(ids[i], ids[i + 1], 'KNOWS');
        }
        (meta as GraphMeta & { _removeCascadeGraph?: Graph; _removeCascadeIds?: string[] })._removeCascadeGraph = g;
        (meta as GraphMeta & { _removeCascadeGraph?: Graph; _removeCascadeIds?: string[] })._removeCascadeIds = [...ids];
        return g;
      },
      run: (_graph, meta) => {
        const m = meta as GraphMeta & { _removeCascadeGraph?: Graph; _removeCascadeIds?: string[] };
        const ids = m._removeCascadeIds!;
        if (ids.length > 0) {
          const id = ids.pop()!;
          if (m._removeCascadeGraph!.hasNode(id)) {
            m._removeCascadeGraph!.removeNode(id, true);
          }
        }
      },
      iterations: 1_000,
    },

    // ── Mutation: clear ───────────────────────────────────────────────────
    {
      category: 'Mutation',
      name: 'clear (full graph)',
      setup: (meta) => {
        // Each run re-populates and clears a copy — use meta to pass state
        const size = Math.min(1000, Math.floor(meta.nodeCount / 10));
        (meta as GraphMeta & { _clearSize?: number })._clearSize = size;
      },
      run: (_graph, meta) => {
        const size = (meta as GraphMeta & { _clearSize?: number })._clearSize!;
        const g = new Graph();
        const ids: string[] = [];
        for (let i = 0; i < size; i++) ids.push(g.addNode('Person', { i }).id);
        for (let i = 0; i < size - 1; i++) g.addEdge(ids[i], ids[i + 1], 'KNOWS');
        g.clear();
      },
      iterations: isLarge ? 10 : 30,
    },
  ];
}
