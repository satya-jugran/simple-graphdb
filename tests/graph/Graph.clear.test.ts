import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.clear()', () => {
  let graph: Graph;

  beforeEach(async () => {
    graph = new Graph();
  });

  it('should remove all nodes and edges', async () => {
    const aliceId = (await graph.addNode('Person', { name: 'Alice' })).id;
    const bobId = (await graph.addNode('Person', { name: 'Bob' })).id;
    await graph.addEdge(aliceId, bobId, 'KNOWS');

    await graph.clear();

    await expect(graph.getNodes()).resolves.toHaveLength(0);
    await expect(graph.getEdges()).resolves.toHaveLength(0);
  });
});
