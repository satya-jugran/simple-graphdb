import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.isDAG()', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  it('should return true for empty graph', () => {
    expect(graph.isDAG()).toBe(true);
  });

  it('should return true for single node', () => {
    graph.addNode('Node', { name: 'A' });
    expect(graph.isDAG()).toBe(true);
  });

  it('should return true for acyclic graph', () => {
    // A -> B -> C
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(b.id, c.id, 'LINKS');
    expect(graph.isDAG()).toBe(true);
  });

  it('should return true for disconnected acyclic graph', () => {
    // A -> B and C -> D (two separate chains)
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    const d = graph.addNode('Node', { name: 'D' });
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(c.id, d.id, 'LINKS');
    expect(graph.isDAG()).toBe(true);
  });

  it('should return false for graph with cycle', () => {
    // A -> B -> C -> A
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(b.id, c.id, 'LINKS');
    graph.addEdge(c.id, a.id, 'LINKS');
    expect(graph.isDAG()).toBe(false);
  });

  it('should return false for self-loop', () => {
    const a = graph.addNode('Node', { name: 'A' });
    graph.addEdge(a.id, a.id, 'LINKS');
    expect(graph.isDAG()).toBe(false);
  });

  it('should return true for diamond graph (no cycles)', () => {
    //     A
    //    / \
    //   B   C
    //    \ /
    //     D
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    const d = graph.addNode('Node', { name: 'D' });
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(a.id, c.id, 'LINKS');
    graph.addEdge(b.id, d.id, 'LINKS');
    graph.addEdge(c.id, d.id, 'LINKS');
    expect(graph.isDAG()).toBe(true);
  });

  it('should return false when cycle is not reachable from start', () => {
    // A -> B (no cycle) and separate C -> D -> C (cycle)
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    const d = graph.addNode('Node', { name: 'D' });
    graph.addEdge(a.id, b.id, 'LINKS');
    graph.addEdge(c.id, d.id, 'LINKS');
    graph.addEdge(d.id, c.id, 'LINKS');
    expect(graph.isDAG()).toBe(false);
  });
});
