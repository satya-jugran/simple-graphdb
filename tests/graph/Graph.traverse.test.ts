import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.traverse()', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
    // Create a simple graph:
    //   A -> B -> C
    //   A -> D -> E
    //   D -> F
    //   B -> D (creates a cycle potential)
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    const d = graph.addNode('Node', { name: 'D' });
    const e = graph.addNode('Node', { name: 'E' });
    const f = graph.addNode('Node', { name: 'F' });

    graph.addEdge(a.id, b.id, 'CONNECTS');
    graph.addEdge(b.id, c.id, 'CONNECTS');
    graph.addEdge(a.id, d.id, 'CONNECTS');
    graph.addEdge(d.id, e.id, 'CONNECTS');
    graph.addEdge(d.id, f.id, 'CONNECTS');
    graph.addEdge(b.id, d.id, 'CONNECTS');
  });

  it('should return null when source node does not exist', () => {
    const b = graph.getNodesByProperty('name', 'B')[0];
    expect(graph.traverse('non-existent', b.id)).toBeNull();
  });

  it('should return null when target node does not exist', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    expect(graph.traverse(a.id, 'non-existent')).toBeNull();
  });

  it('should return [source] when source equals target', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    expect(graph.traverse(a.id, a.id)).toEqual([a.id]);
  });

  it('should find direct path with BFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const path = graph.traverse(a.id, b.id, { method: 'bfs' });
    expect(path).toEqual([a.id, b.id]);
  });

  it('should find multi-hop path with BFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const path = graph.traverse(a.id, c.id, { method: 'bfs' });
    expect(path).toEqual([a.id, b.id, c.id]);
  });

  it('should find path through different branches with BFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const d = graph.getNodesByProperty('name', 'D')[0];
    const f = graph.getNodesByProperty('name', 'F')[0];
    const path = graph.traverse(a.id, f.id, { method: 'bfs' });
    expect(path).toEqual([a.id, d.id, f.id]);
  });

  it('should find path with BFS (shortest)', () => {
    // A -> D -> E vs A -> B -> D -> E
    const a = graph.getNodesByProperty('name', 'A')[0];
    const d = graph.getNodesByProperty('name', 'D')[0];
    const e = graph.getNodesByProperty('name', 'E')[0];
    const path = graph.traverse(a.id, e.id, { method: 'bfs' });
    expect(path).toEqual([a.id, d.id, e.id]);
  });

  it('should find path with DFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const path = graph.traverse(a.id, c.id, { method: 'dfs' });
    expect(path).toEqual([a.id, b.id, c.id]);
  });

  it('should return null when no path exists', () => {
    // Add isolated node G with no connections
    graph.addNode('Node', { name: 'G' });
    const a = graph.getNodesByProperty('name', 'A')[0];
    const g = graph.getNodesByProperty('name', 'G')[0];
    expect(graph.traverse(a.id, g.id)).toBeNull();
  });

  it('should handle cycle without infinite loop', () => {
    // Add edge that would create cycle
    const d = graph.getNodesByProperty('name', 'D')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    graph.addEdge(d.id, b.id, 'CONNECTS');
    const a = graph.getNodesByProperty('name', 'A')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const path = graph.traverse(a.id, c.id, { method: 'bfs' });
    expect(path).toEqual([a.id, b.id, c.id]);
  });

  it('should default to BFS when method not specified', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const path = graph.traverse(a.id, c.id);
    expect(path).toEqual([a.id, b.id, c.id]);
  });

  it('should filter by nodeType during traversal', () => {
    // Create a mixed-type graph:
    //   A (TypeA) -> B (TypeA) -> C (TypeA)
    //   A (TypeA) -> D (TypeB) -> E (TypeB)
    const typeA = graph.addNode('TypeA', { name: 'A2' });
    const typeB = graph.addNode('TypeB', { name: 'B2' });
    const target = graph.addNode('TypeB', { name: 'Target' });
    graph.addEdge(typeA.id, typeB.id, 'LINKS');
    graph.addEdge(typeB.id, target.id, 'LINKS');

    // Without nodeType filter - should find path through TypeB nodes
    const pathAll = graph.traverse(typeA.id, target.id);
    expect(pathAll).toEqual([typeA.id, typeB.id, target.id]);

    // With nodeType filter - should NOT find path (blocked by TypeB intermediate)
    const pathFiltered = graph.traverse(typeA.id, target.id, { nodeType: 'TypeA' });
    expect(pathFiltered).toBeNull();
  });

  it('should filter by edgeType during traversal', () => {
    // Create a mixed-edge graph:
    //   A --PREFER--> B --AVOID--> C
    //   A --AVOID--> D --PREFER--> E
    const a = graph.addNode('Node', { name: 'X' });
    const b = graph.addNode('Node', { name: 'Y' });
    const c = graph.addNode('Node', { name: 'Z' });
    const d = graph.addNode('Node', { name: 'W' });
    const e = graph.addNode('Node', { name: 'V' });

    graph.addEdge(a.id, b.id, 'PREFER');
    graph.addEdge(b.id, c.id, 'AVOID');
    graph.addEdge(a.id, d.id, 'AVOID');
    graph.addEdge(d.id, e.id, 'PREFER');

    // Without edgeType filter - shortest path is A -> D -> E (2 hops via AVOID)
    const pathAll = graph.traverse(a.id, e.id, { method: 'bfs' });
    expect(pathAll).toEqual([a.id, d.id, e.id]);

    // With edgeType=PREFER filter - should find A -> B -> ... (blocked by AVOID edges)
    const pathPrefer = graph.traverse(a.id, e.id, { method: 'bfs', edgeType: 'PREFER' });
    expect(pathPrefer).toBeNull();
  });

  it('should combine nodeType and edgeType filters', () => {
    const testGraph = new Graph();
    const src = testGraph.addNode('Alpha', {});
    const m1 = testGraph.addNode('Beta', {});
    const tgt = testGraph.addNode('Beta', {});

    testGraph.addEdge(src.id, m1.id, 'FOO');
    testGraph.addEdge(m1.id, tgt.id, 'FOO');

    const pathAll = testGraph.traverse(src.id, tgt.id, { method: 'bfs' });
    expect(pathAll).toEqual([src.id, m1.id, tgt.id]);

    const pathBetaFoo = testGraph.traverse(src.id, tgt.id, { nodeType: 'Beta', edgeType: 'FOO' });
    expect(pathBetaFoo).toEqual([src.id, m1.id, tgt.id]);

    const pathBetaBar = testGraph.traverse(src.id, tgt.id, { nodeType: 'Beta', edgeType: 'BAR' });
    expect(pathBetaBar).toBeNull();
  });
});
