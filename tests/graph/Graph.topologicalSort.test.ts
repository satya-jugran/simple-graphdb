import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.topologicalSort()', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  it('should return empty array for empty graph', () => {
    const result = graph.topologicalSort();
    expect(result).toEqual([]);
  });

  it('should return array with single node when no edges', () => {
    const node = graph.addNode('Test', { name: 'A' });
    const result = graph.topologicalSort();
    expect(result).toEqual([node.id]);
  });

  it('should return nodes in topological order for linear chain', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });
    const c = graph.addNode('Test', { name: 'C' });

    // A -> B -> C
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(b.id, c.id, 'LINKS');

    const result = graph.topologicalSort()!;
    expect(result).toHaveLength(3);
    expect(result.indexOf(a.id)).toBeLessThan(result.indexOf(b.id));
    expect(result.indexOf(b.id)).toBeLessThan(result.indexOf(c.id));
  });

  it('should handle multiple roots (nodes with no incoming edges)', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });
    const c = graph.addNode('Test', { name: 'C' });

    // A -> C and B -> C (A and B are both roots)
    graph.addEdge(a.id, c.id, 'LINKS');
    graph.addEdge(b.id, c.id, 'LINKS');

    const result = graph.topologicalSort()!;
    expect(result).toHaveLength(3);
    expect(result).toContain(a.id);
    expect(result).toContain(b.id);
    expect(result).toContain(c.id);
    // Both A and B should come before C
    expect(result.indexOf(c.id)).toBeGreaterThan(result.indexOf(a.id));
    expect(result.indexOf(c.id)).toBeGreaterThan(result.indexOf(b.id));
  });

  it('should return null for graph with cycle', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });
    const c = graph.addNode('Test', { name: 'C' });

    // A -> B -> C -> A (cycle)
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(b.id, c.id, 'LINKS');
    graph.addEdge(c.id, a.id, 'LINKS');

    const result = graph.topologicalSort();
    expect(result).toBeNull();
  });

  it('should return null for self-referencing cycle', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });

    // A -> A (self-loop)
    graph.addEdge(a.id, a.id, 'LINKS');

    const result = graph.topologicalSort();
    expect(result).toBeNull();
  });

  it('should handle diamond dependency structure', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });
    const c = graph.addNode('Test', { name: 'C' });
    const d = graph.addNode('Test', { name: 'D' });

    // A -> B -> D
    // A -> C -> D
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(b.id, d.id, 'LINKS');
    graph.addEdge(a.id, c.id, 'LINKS');
    graph.addEdge(c.id, d.id, 'LINKS');

    const result = graph.topologicalSort()!;
    expect(result).toHaveLength(4);
    // A must come before both B and C
    expect(result.indexOf(a.id)).toBeLessThan(result.indexOf(b.id));
    expect(result.indexOf(a.id)).toBeLessThan(result.indexOf(c.id));
    // Both B and C must come before D
    expect(result.indexOf(b.id)).toBeLessThan(result.indexOf(d.id));
    expect(result.indexOf(c.id)).toBeLessThan(result.indexOf(d.id));
  });

  it('should handle isolated nodes (no edges)', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });
    const c = graph.addNode('Test', { name: 'C' });

    const result = graph.topologicalSort();
    expect(result).toHaveLength(3);
    expect(result).toContain(a.id);
    expect(result).toContain(b.id);
    expect(result).toContain(c.id);
  });

  it('should correctly sort after cascade-removing a middle node', () => {
    const a = graph.addNode('Test', { name: 'A' });
    const b = graph.addNode('Test', { name: 'B' });
    const c = graph.addNode('Test', { name: 'C' });

    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(b.id, c.id, 'LINKS');

    // Remove B with cascade — both incident edges are also removed
    graph.removeNode(b.id, true);

    const result = graph.topologicalSort();
    expect(result).toHaveLength(2);
    expect(result).toContain(a.id);
    expect(result).toContain(c.id);
  });
});
