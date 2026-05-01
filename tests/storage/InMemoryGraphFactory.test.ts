import { describe, expect, it } from '@jest/globals';

import { InMemoryGraphFactory } from '../../src/storage/InMemoryGraphFactory';

describe('InMemoryGraphFactory', () => {
  it('forGraph() should return a Graph instance', () => {
    const factory = new InMemoryGraphFactory();
    const graph = factory.forGraph('any-id');
    expect(graph).toBeDefined();
  });

  it('forGraph() should return independent graphs per call', async () => {
    const factory = new InMemoryGraphFactory();
    const graphA = factory.forGraph('graph-a');
    const graphB = factory.forGraph('graph-b');

    await graphA.addNode('Person', { name: 'Alice' });
    await graphB.addNode('Person', { name: 'Bob' });

    const nodesA = await graphA.getNodes();
    const nodesB = await graphB.getNodes();

    expect(nodesA).toHaveLength(1);
    expect(nodesA[0].properties.name).toBe('Alice');
    expect(nodesB).toHaveLength(1);
    expect(nodesB[0].properties.name).toBe('Bob');
  });

  it('forGraph() with no argument should default to "default" graphId', async () => {
    const factory = new InMemoryGraphFactory();
    const graphDefault = factory.forGraph();
    const graphExplicit = factory.forGraph('default');

    await graphDefault.addNode('Person', { name: 'Carol' });

    // Each forGraph() call returns an independent provider — no shared state
    expect(await graphExplicit.getNodes()).toHaveLength(0);
    expect(await graphDefault.getNodes()).toHaveLength(1);
    expect((await graphDefault.getNodes())[0].properties.name).toBe('Carol');
  });

  it('forGraph() with default graphId should isolate clear() to that graph', async () => {
    const factory = new InMemoryGraphFactory();
    const graphA = factory.forGraph('graph-a');
    const graphDefault = factory.forGraph('default');

    await graphA.addNode('Person', { name: 'Alice' });
    await graphDefault.addNode('Person', { name: 'Bob' });

    await graphA.clear();

    expect(await graphA.getNodes()).toHaveLength(0);
    expect(await graphDefault.getNodes()).toHaveLength(1);
  });

  it('each forGraph() call returns a fresh provider (no shared Maps between calls)', async () => {
    const factory = new InMemoryGraphFactory();
    const graph1 = factory.forGraph('graph-x');
    const graph2 = factory.forGraph('graph-x');

    await graph1.addNode('Person', { name: 'Dave' });

    // graph2 should be independent — empty
    expect(await graph2.getNodes()).toHaveLength(0);
  });
});
