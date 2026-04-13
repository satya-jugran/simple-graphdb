import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.Serialization', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  it('should serialize an empty graph', () => {
    const data = graph.toJSON();
    expect(data).toEqual({ nodes: [], edges: [] });
  });

  it('should serialize a graph with nodes and edges', () => {
    const aliceId = graph.addNode('Person', { name: 'Alice', age: 30 }).id;
    const bobId = graph.addNode('Person', { name: 'Bob', age: 25 }).id;
    const edge = graph.addEdge(aliceId, bobId, 'KNOWS', { since: 2020 });

    const data = graph.toJSON();
    expect(data.nodes).toHaveLength(2);
    expect(data.edges).toHaveLength(1);
    expect(data.nodes[0]).toEqual({ id: aliceId, type: 'Person', properties: { name: 'Alice', age: 30 } });
    expect(data.nodes[1]).toEqual({ id: bobId, type: 'Person', properties: { name: 'Bob', age: 25 } });
    expect(data.edges[0].id).toBeDefined();
    expect(data.edges[0].id).toBe(edge.id);
    expect(data.edges[0]).toEqual({
      id: edge.id,
      sourceId: aliceId,
      targetId: bobId,
      type: 'KNOWS',
      properties: { since: 2020 },
    });
  });

  it('should reconstruct graph from data', () => {
    const aliceId = graph.addNode('Person', { name: 'Alice', age: 30 }).id;
    const bobId = graph.addNode('Person', { name: 'Bob', age: 25 }).id;
    graph.addEdge(aliceId, bobId, 'KNOWS', { since: 2020 });

    const data = graph.toJSON();
    const restored = Graph.fromJSON(data);

    expect(restored.getNodes()).toHaveLength(2);
    expect(restored.getEdges()).toHaveLength(1);

    const alice = restored.getNodes().find(n => n.properties.name === 'Alice');
    expect(alice?.properties).toEqual({ name: 'Alice', age: 30 });
  });

  it('should handle round-trip serialization', () => {
    const a = graph.addNode('Node', { name: 'A' });
    const b = graph.addNode('Node', { name: 'B' });
    const c = graph.addNode('Node', { name: 'C' });
    graph.addEdge(a.id, b.id, 'CONNECTS', { label: 'first' });
    graph.addEdge(b.id, c.id, 'CONNECTS', { label: 'second' });

    const data = graph.toJSON();
    const restored = Graph.fromJSON(data);

    expect(restored.getNodes()).toHaveLength(3);
    expect(restored.getEdges()).toHaveLength(2);
  });
});
