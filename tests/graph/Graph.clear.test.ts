import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.clear()', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  it('should remove all nodes and edges', () => {
    const aliceId = graph.addNode('Person', { name: 'Alice' }).id;
    const bobId = graph.addNode('Person', { name: 'Bob' }).id;
    graph.addEdge(aliceId, bobId, 'KNOWS');

    graph.clear();

    expect(graph.getNodes()).toHaveLength(0);
    expect(graph.getEdges()).toHaveLength(0);
  });
});
