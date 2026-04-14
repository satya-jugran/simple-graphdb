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
    expect(graph.traverse(a.id, a.id)).toEqual([[a.id]]);
  });

  it('should find direct path with BFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const paths = graph.traverse(a.id, b.id, { method: 'bfs' });
    expect(paths).toEqual([[a.id, b.id]]);
  });

  it('should find multi-hop path with BFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const paths = graph.traverse(a.id, c.id, { method: 'bfs' });
    expect(paths).toEqual([[a.id, b.id, c.id]]);
  });

  it('should find path through different branches with BFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const d = graph.getNodesByProperty('name', 'D')[0];
    const f = graph.getNodesByProperty('name', 'F')[0];
    const paths = graph.traverse(a.id, f.id, { method: 'bfs' });
    expect(paths).toEqual([[a.id, d.id, f.id]]);
  });

  it('should find path with BFS (shortest)', () => {
    // A -> D -> E vs A -> B -> D -> E
    const a = graph.getNodesByProperty('name', 'A')[0];
    const d = graph.getNodesByProperty('name', 'D')[0];
    const e = graph.getNodesByProperty('name', 'E')[0];
    const paths = graph.traverse(a.id, e.id, { method: 'bfs' });
    expect(paths).toEqual([[a.id, d.id, e.id]]);
  });

  it('should find path with DFS', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const paths = graph.traverse(a.id, c.id, { method: 'dfs' });
    expect(paths).toEqual([[a.id, b.id, c.id]]);
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
    const paths = graph.traverse(a.id, c.id, { method: 'bfs' });
    expect(paths).toEqual([[a.id, b.id, c.id]]);
  });

  it('should default to BFS when method not specified', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const paths = graph.traverse(a.id, c.id);
    expect(paths).toEqual([[a.id, b.id, c.id]]);
  });

  it('should filter by nodeTypes during traversal', () => {
    // Create a mixed-type graph:
    //   A (TypeA) -> B (TypeA) -> C (TypeA)
    //   A (TypeA) -> D (TypeB) -> E (TypeB)
    const typeA = graph.addNode('TypeA', { name: 'A2' });
    const typeB = graph.addNode('TypeB', { name: 'B2' });
    const target = graph.addNode('TypeB', { name: 'Target' });
    graph.addEdge(typeA.id, typeB.id, 'LINKS');
    graph.addEdge(typeB.id, target.id, 'LINKS');

    // Without nodeTypes filter - should find path through TypeB nodes
    const pathAll = graph.traverse(typeA.id, target.id);
    expect(pathAll).toEqual([[typeA.id, typeB.id, target.id]]);

    // With nodeTypes filter - should NOT find path (blocked by TypeB intermediate)
    const pathFiltered = graph.traverse(typeA.id, target.id, { nodeTypes: ['TypeA'] });
    expect(pathFiltered).toBeNull();
  });

  it('should filter by edgeTypes during traversal', () => {
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

    // Without edgeTypes filter - shortest path is A -> D -> E (2 hops via AVOID)
    const pathAll = graph.traverse(a.id, e.id, { method: 'bfs' });
    expect(pathAll).toEqual([[a.id, d.id, e.id]]);

    // With edgeTypes=PREFER filter - should find A -> B -> ... (blocked by AVOID edges)
    const pathPrefer = graph.traverse(a.id, e.id, { method: 'bfs', edgeTypes: ['PREFER'] });
    expect(pathPrefer).toBeNull();
  });

  it('should combine nodeTypes and edgeTypes filters', () => {
    const testGraph = new Graph();
    const src = testGraph.addNode('Alpha', {});
    const m1 = testGraph.addNode('Beta', {});
    const tgt = testGraph.addNode('Beta', {});

    testGraph.addEdge(src.id, m1.id, 'FOO');
    testGraph.addEdge(m1.id, tgt.id, 'FOO');

    const pathAll = testGraph.traverse(src.id, tgt.id, { method: 'bfs' });
    expect(pathAll).toEqual([[src.id, m1.id, tgt.id]]);

    const pathBetaFoo = testGraph.traverse(src.id, tgt.id, { nodeTypes: ['Beta'], edgeTypes: ['FOO'] });
    expect(pathBetaFoo).toEqual([[src.id, m1.id, tgt.id]]);

    const pathBetaBar = testGraph.traverse(src.id, tgt.id, { nodeTypes: ['Beta'], edgeTypes: ['BAR'] });
    expect(pathBetaBar).toBeNull();
  });

  it('should filter by multiple nodeTypes and edgeTypes', () => {
    // Create a graph with multiple node and edge types:
    //   A (TypeX) --EDGE1--> B (TypeY) --EDGE2--> C (TypeZ)
    //   A (TypeX) --EDGE3--> D (TypeY) --EDGE4--> E (TypeZ)
    const a = graph.addNode('TypeX', { name: 'A' });
    const b = graph.addNode('TypeY', { name: 'B' });
    const c = graph.addNode('TypeZ', { name: 'C' });
    const d = graph.addNode('TypeY', { name: 'D' });
    const e = graph.addNode('TypeZ', { name: 'E' });

    graph.addEdge(a.id, b.id, 'EDGE1');
    graph.addEdge(b.id, c.id, 'EDGE2');
    graph.addEdge(a.id, d.id, 'EDGE3');
    graph.addEdge(d.id, e.id, 'EDGE4');

    // Without any filters - shortest path is A -> D -> E (2 hops)
    const pathAll = graph.traverse(a.id, e.id, { method: 'bfs' });
    expect(pathAll).toEqual([[a.id, d.id, e.id]]);

    // With multiple edge types including EDGE3 and EDGE4 - should find path A -> D -> E
    const pathMultiEdge = graph.traverse(a.id, e.id, { method: 'bfs', edgeTypes: ['EDGE3', 'EDGE4', 'OTHER'] });
    expect(pathMultiEdge).toEqual([[a.id, d.id, e.id]]);

    // With multiple node types including TypeY and TypeZ - should find path
    const pathMultiNode = graph.traverse(a.id, e.id, { method: 'bfs', nodeTypes: ['TypeX', 'TypeY', 'TypeZ'] });
    expect(pathMultiNode).toEqual([[a.id, d.id, e.id]]);

    // With both multiple nodeTypes and edgeTypes - should find path
    const pathBothMulti = graph.traverse(a.id, e.id, {
      method: 'bfs',
      nodeTypes: ['TypeX', 'TypeY', 'TypeZ'],
      edgeTypes: ['EDGE3', 'EDGE4']
    });
    expect(pathBothMulti).toEqual([[a.id, d.id, e.id]]);

    // With edgeTypes NOT including EDGE3 - should fail (blocked by wrong edge type)
    const pathWrongEdge = graph.traverse(a.id, e.id, {
      method: 'bfs',
      edgeTypes: ['EDGE1', 'EDGE2', 'OTHER']
    });
    expect(pathWrongEdge).toBeNull();

    // With nodeTypes NOT including TypeY - should fail (blocked by intermediate node type)
    const pathWrongNode = graph.traverse(a.id, e.id, {
      method: 'bfs',
      nodeTypes: ['TypeX', 'TypeZ']  // Missing TypeY
    });
    expect(pathWrongNode).toBeNull();

    // With wildcard '*' in nodeTypes - should include all nodes
    const pathWildcardNode = graph.traverse(a.id, e.id, {
      method: 'bfs',
      nodeTypes: ['*']
    });
    expect(pathWildcardNode).toEqual([[a.id, d.id, e.id]]);

    // With wildcard '*' in edgeTypes - should include all edges
    const pathWildcardEdge = graph.traverse(a.id, e.id, {
      method: 'bfs',
      edgeTypes: ['*']
    });
    expect(pathWildcardEdge).toEqual([[a.id, d.id, e.id]]);
  });

  it('should find all paths using wildcard source', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const d = graph.getNodesByProperty('name', 'D')[0];
    const e = graph.getNodesByProperty('name', 'E')[0];
    const f = graph.getNodesByProperty('name', 'F')[0];

    // Find all paths from A to any node
    const paths = graph.traverse(a.id, '*');
    
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThan(0);
    
    const targets = paths!.map(p => p[p.length - 1]);
    expect(targets).toContain(b.id);
    expect(targets).toContain(c.id);
    expect(targets).toContain(d.id);
    expect(targets).toContain(e.id);
    expect(targets).toContain(f.id);
  });

  it('should find all paths using wildcard target', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const d = graph.getNodesByProperty('name', 'D')[0];

    // Find all paths to D from any node
    const paths = graph.traverse('*', d.id);
    
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThan(0);
    
    const sources = paths!.map(p => p[0]);
    expect(sources).toContain(a.id);
    expect(sources).toContain(b.id);
  });

  it('should find all paths using wildcard source and target', () => {
    const paths = graph.traverse('*', '*');
    
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThan(0);
    
    // Each path should have at least 1 node (source = target for single node)
    paths!.forEach(p => {
      expect(p.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should find all paths using array of sources', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const e = graph.getNodesByProperty('name', 'E')[0];

    // Find paths from [A, B] to E
    const paths = graph.traverse([a.id, b.id], e.id);
    
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThan(0);
    
    const sources = paths!.map(p => p[0]);
    expect(sources).toContain(a.id);
    expect(sources).toContain(b.id);
    paths!.forEach(p => {
      expect(p[p.length - 1]).toBe(e.id);
    });
  });

  it('should find all paths using array of sources and targets', () => {
    const a = graph.getNodesByProperty('name', 'A')[0];
    const b = graph.getNodesByProperty('name', 'B')[0];
    const c = graph.getNodesByProperty('name', 'C')[0];
    const e = graph.getNodesByProperty('name', 'E')[0];
    const f = graph.getNodesByProperty('name', 'F')[0];

    // Find paths from [A, B] to [C, E, F]
    const paths = graph.traverse([a.id, b.id], [c.id, e.id, f.id]);
    
    expect(paths).not.toBeNull();
    expect(paths!.length).toBeGreaterThan(0);
    
    paths!.forEach(p => {
      expect([a.id, b.id]).toContain(p[0]);
      expect([c.id, e.id, f.id]).toContain(p[p.length - 1]);
    });
  });
});
