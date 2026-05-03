import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

import { MongoStorageProvider } from '../../src/storage/MongoStorageProvider';
import type { NodeData, EdgeData, GraphData } from '../../src/types';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
  EdgeNotFoundError,
  PropertyAlreadyExistsError,
  PropertyNotFoundError,
  InvalidPropertyError,
} from '../../src/errors';

describe('MongoStorageProvider', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let provider: MongoStorageProvider;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    provider = new MongoStorageProvider(client.db('test'), { graphId: 'default' });
    await provider.ensureIndexes();
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all known graph partitions to ensure test isolation
    await provider.clear();
    const providerA = new MongoStorageProvider(client.db('test'), { graphId: 'graph-a' });
    const providerB = new MongoStorageProvider(client.db('test'), { graphId: 'graph-b' });
    await Promise.all([providerA.clear(), providerB.clear()]);
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  it('clear() should remove all nodes and edges', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertEdge({
      id: 'e1',
      sourceId: 'n1',
      targetId: 'n2',
      type: 'KNOWS',
      properties: {},
    });

    await provider.clear();

    expect(await provider.getAllNodes()).toEqual([]);
    expect(await provider.getAllEdges()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Node mutations
  // ---------------------------------------------------------------------------

  it('insertNode() should persist a node', async () => {
    const node: NodeData = { id: 'n1', type: 'Person', properties: { name: 'Alice' } };
    await provider.insertNode(node);

    const retrieved = await provider.getNode('n1');
    expect(retrieved).toEqual(node);
  });

  it('insertNode() should throw NodeAlreadyExistsError on duplicate id', async () => {
    const node: NodeData = { id: 'n1', type: 'Person', properties: {} };
    await provider.insertNode(node);

    await expect(provider.insertNode(node)).rejects.toThrow(NodeAlreadyExistsError);
  });

  it('deleteNode() should remove a node by id', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.deleteNode('n1');

    expect(await provider.getNode('n1')).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Node queries
  // ---------------------------------------------------------------------------

  it('hasNode() should return true for existing node', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await expect(provider.hasNode('n1')).resolves.toBe(true);
    await expect(provider.hasNode('non-existent')).resolves.toBe(false);
  });

  it('getNode() should return undefined for non-existent node', async () => {
    expect(await provider.getNode('non-existent')).toBeUndefined();
  });

  it('getAllNodes() should return all nodes', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Place', properties: {} });

    const nodes = await provider.getAllNodes();
    expect(nodes).toHaveLength(2);
    expect(nodes.map(n => n.id).sort()).toEqual(['n1', 'n2']);
  });

  it('getNodesByType() should filter by type', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n3', type: 'Place', properties: {} });

    const persons = await provider.getNodesByType('Person');
    expect(persons).toHaveLength(2);
    expect(persons.every(n => n.type === 'Person')).toBe(true);
  });

  it('getNodesByProperty() should filter by property key and value', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { city: 'NYC' } });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: { city: 'LA' } });
    await provider.insertNode({ id: 'n3', type: 'Person', properties: { city: 'NYC' } });

    const nycNodes = await provider.getNodesByProperty('city', 'NYC');
    expect(nycNodes).toHaveLength(2);
    expect(nycNodes.every(n => n.properties.city === 'NYC')).toBe(true);
  });

  it('getNodesByProperty() should combine property filter with nodeType', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { city: 'NYC' } });
    await provider.insertNode({ id: 'n2', type: 'Place', properties: { city: 'NYC' } });

    const results = await provider.getNodesByProperty('city', 'NYC', 'Person');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('Person');
  });

  // ---------------------------------------------------------------------------
  // Edge mutations
  // ---------------------------------------------------------------------------

  it('insertEdge() should persist an edge', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    const edge: EdgeData = {
      id: 'e1',
      sourceId: 'n1',
      targetId: 'n2',
      type: 'KNOWS',
      properties: { since: 2020 },
    };
    await provider.insertEdge(edge);

    const retrieved = await provider.getEdge('e1');
    expect(retrieved).toEqual(edge);
  });

  it('insertEdge() should throw EdgeAlreadyExistsError on duplicate id', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    const edge: EdgeData = { id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} };
    await provider.insertEdge(edge);

    await expect(provider.insertEdge(edge)).rejects.toThrow(EdgeAlreadyExistsError);
  });


  it('deleteEdge() should remove an edge by id', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });

    await provider.deleteEdge('e1');

    expect(await provider.getEdge('e1')).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Edge queries
  // ---------------------------------------------------------------------------

  it('hasEdge() should return true for existing edge', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });

    await expect(provider.hasEdge('e1')).resolves.toBe(true);
    await expect(provider.hasEdge('non-existent')).resolves.toBe(false);
  });

  it('getEdge() should return undefined for non-existent edge', async () => {
    expect(await provider.getEdge('non-existent')).toBeUndefined();
  });

  it('getAllEdges() should return all edges', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });
    await provider.insertEdge({ id: 'e2', sourceId: 'n2', targetId: 'n1', type: 'KNOWS', properties: {} });

    const edges = await provider.getAllEdges();
    expect(edges).toHaveLength(2);
  });

  it('getEdgesByType() should filter by edge type', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });
    await provider.insertEdge({ id: 'e2', sourceId: 'n2', targetId: 'n1', type: 'LIKES', properties: {} });

    const knowsEdges = await provider.getEdgesByType('KNOWS');
    expect(knowsEdges).toHaveLength(1);
    expect(knowsEdges[0].type).toBe('KNOWS');
  });

  it('getEdgesBySource() should return outgoing edges', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n3', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });
    await provider.insertEdge({ id: 'e2', sourceId: 'n1', targetId: 'n3', type: 'KNOWS', properties: {} });
    await provider.insertEdge({ id: 'e3', sourceId: 'n2', targetId: 'n3', type: 'KNOWS', properties: {} });

    const outgoing = await provider.getEdgesBySource('n1');
    expect(outgoing).toHaveLength(2);
    expect(outgoing.every(e => e.sourceId === 'n1')).toBe(true);
  });

  it('getEdgesByTarget() should return incoming edges', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n3', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n3', type: 'KNOWS', properties: {} });
    await provider.insertEdge({ id: 'e2', sourceId: 'n2', targetId: 'n3', type: 'KNOWS', properties: {} });
    await provider.insertEdge({ id: 'e3', sourceId: 'n3', targetId: 'n1', type: 'KNOWS', properties: {} });

    const incoming = await provider.getEdgesByTarget('n3');
    expect(incoming).toHaveLength(2);
    expect(incoming.every(e => e.targetId === 'n3')).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Data portability
  // ---------------------------------------------------------------------------

  it('exportJSON() should return a valid GraphData snapshot', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: { name: 'Bob' } });
    await provider.insertEdge({
      id: 'e1',
      sourceId: 'n1',
      targetId: 'n2',
      type: 'KNOWS',
      properties: { since: 2020 },
    });

    const data = await provider.exportJSON();

    expect(data.nodes).toHaveLength(2);
    expect(data.edges).toHaveLength(1);
    expect(data.nodes.find(n => n.id === 'n1')?.properties.name).toBe('Alice');
    expect(data.edges[0].type).toBe('KNOWS');
  });

  it('exportJSON() should return empty arrays for empty graph', async () => {
    const data = await provider.exportJSON();
    expect(data.nodes).toEqual([]);
    expect(data.edges).toEqual([]);
  });

  it('importJSON() should bulk-load nodes and edges', async () => {
    const data: GraphData = {
      nodes: [
        { id: 'n1', type: 'Person', properties: { name: 'Alice' } },
        { id: 'n2', type: 'Person', properties: { name: 'Bob' } },
      ],
      edges: [
        { id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: { since: 2020 } },
      ],
    };

    await provider.importJSON(data);

    expect(await provider.getAllNodes()).toHaveLength(2);
    expect(await provider.getAllEdges()).toHaveLength(1);
    expect(await provider.getNode('n1')).toBeDefined();
    expect(await provider.getEdge('e1')).toBeDefined();
  });

  it('importJSON() should throw NodeAlreadyExistsError for duplicate node ids', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    const data: GraphData = {
      nodes: [{ id: 'n1', type: 'Person', properties: {} }],
      edges: [],
    };

    await expect(provider.importJSON(data)).rejects.toThrow(NodeAlreadyExistsError);
  });

  it('importJSON() should throw EdgeAlreadyExistsError for duplicate edge ids', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });
    const data: GraphData = {
      nodes: [],
      edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} }],
    };

    await expect(provider.importJSON(data)).rejects.toThrow(EdgeAlreadyExistsError);
  });

  it('importJSON() should throw NodeNotFoundError when edge references non-existent node', async () => {
    const data: GraphData = {
      nodes: [{ id: 'n1', type: 'Person', properties: {} }],
      edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} }],
    };

    await expect(provider.importJSON(data)).rejects.toThrow(NodeNotFoundError);
  });

  it('importJSON() should throw NodeNotFoundError for duplicate ids within the payload itself', async () => {
    const data: GraphData = {
      nodes: [
        { id: 'n1', type: 'Person', properties: {} },
        { id: 'n1', type: 'Person', properties: {} },
      ],
      edges: [],
    };

    await expect(provider.importJSON(data)).rejects.toThrow(NodeAlreadyExistsError);
  });

  it('exportJSON() + importJSON() should survive a round-trip', async () => {
    // Build a small graph
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Alice', age: 30 } });
    await provider.insertNode({ id: 'n2', type: 'Person', properties: { name: 'Bob', age: 25 } });
    await provider.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: { since: 2020 } });

    // Export, clear, re-import
    const snapshot = await provider.exportJSON();
    await provider.clear();
    await provider.importJSON(snapshot);

    const nodes = await provider.getAllNodes();
    const edges = await provider.getAllEdges();
    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    expect(nodes.find(n => n.id === 'n1')?.properties.name).toBe('Alice');
    expect(edges[0].properties.since).toBe(2020);
  });

  // ---------------------------------------------------------------------------
  // Multi-graph isolation
  // ---------------------------------------------------------------------------

  it('two providers with different graphId should not see each others nodes', async () => {
    const providerA = new MongoStorageProvider(client.db('test'), { graphId: 'graph-a' });
    const providerB = new MongoStorageProvider(client.db('test'), { graphId: 'graph-b' });

    await providerA.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
    await providerB.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Bob' } }); // same id, different graph

    expect((await providerA.getNode('n1'))?.properties.name).toBe('Alice');
    expect((await providerB.getNode('n1'))?.properties.name).toBe('Bob');
    expect(await providerA.getAllNodes()).toHaveLength(1);
    expect(await providerB.getAllNodes()).toHaveLength(1);
  });

  it('two providers with different graphId should not see each others edges', async () => {
    const providerA = new MongoStorageProvider(client.db('test'), { graphId: 'graph-a' });
    const providerB = new MongoStorageProvider(client.db('test'), { graphId: 'graph-b' });

    await providerA.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await providerA.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await providerA.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'KNOWS', properties: {} });

    await providerB.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await providerB.insertNode({ id: 'n2', type: 'Person', properties: {} });
    await providerB.insertEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'LIKES', properties: {} });

    const edgesA = await providerA.getAllEdges();
    const edgesB = await providerB.getAllEdges();
    expect(edgesA).toHaveLength(1);
    expect(edgesA[0].type).toBe('KNOWS');
    expect(edgesB).toHaveLength(1);
    expect(edgesB[0].type).toBe('LIKES');
  });

  it('clear() should only remove nodes/edges for its own graphId', async () => {
    const providerA = new MongoStorageProvider(client.db('test'), { graphId: 'graph-a' });
    const providerB = new MongoStorageProvider(client.db('test'), { graphId: 'graph-b' });

    await providerA.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await providerB.insertNode({ id: 'n1', type: 'Person', properties: {} });

    await providerA.clear();

    expect(await providerA.getAllNodes()).toHaveLength(0);
    expect(await providerB.getAllNodes()).toHaveLength(1);
  });

  it('duplicate id within same graphId should throw NodeAlreadyExistsError', async () => {
    const providerA = new MongoStorageProvider(client.db('test'), { graphId: 'graph-a' });

    await providerA.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await expect(
      providerA.insertNode({ id: 'n1', type: 'Person', properties: {} })
    ).rejects.toThrow(NodeAlreadyExistsError);
  });

  it('same id in different graphId should not throw on insert', async () => {
    const providerA = new MongoStorageProvider(client.db('test'), { graphId: 'graph-a' });
    const providerB = new MongoStorageProvider(client.db('test'), { graphId: 'graph-b' });

    await providerA.insertNode({ id: 'n1', type: 'Person', properties: {} });
    // Should not throw — different graph partition
    await expect(
      providerB.insertNode({ id: 'n1', type: 'Person', properties: {} })
    ).resolves.toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Property mutations
  // ---------------------------------------------------------------------------

  it('addProperty() should add a property to a node', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await provider.addProperty('node', 'n1', 'name', 'Alice');

    const node = await provider.getNode('n1');
    expect(node?.properties.name).toBe('Alice');
  });

  it('addProperty() should throw PropertyAlreadyExistsError if property already exists', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
    await expect(
      provider.addProperty('node', 'n1', 'name', 'Bob')
    ).rejects.toThrow(PropertyAlreadyExistsError);
  });

  it('addProperty() should throw NodeNotFoundError for non-existent node', async () => {
    await expect(
      provider.addProperty('node', 'non-existent', 'name', 'Alice')
    ).rejects.toThrow(NodeNotFoundError);
  });

  it('addProperty() should throw EdgeNotFoundError for non-existent edge', async () => {
    await expect(
      provider.addProperty('edge', 'non-existent', 'weight', 5)
    ).rejects.toThrow(EdgeNotFoundError);
  });

  it('addProperty() should throw InvalidPropertyError for non-primitive value', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await expect(
      provider.addProperty('node', 'n1', 'meta', { nested: true })
    ).rejects.toThrow(InvalidPropertyError);
  });

  it('updateProperty() should update an existing property', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { age: 25 } });
    await provider.updateProperty('node', 'n1', 'age', 30);

    const node = await provider.getNode('n1');
    expect(node?.properties.age).toBe(30);
  });

  it('updateProperty() should throw PropertyNotFoundError if property does not exist', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: {} });
    await expect(
      provider.updateProperty('node', 'n1', 'name', 'Alice')
    ).rejects.toThrow(PropertyNotFoundError);
  });

  it('updateProperty() should throw NodeNotFoundError for non-existent node', async () => {
    await expect(
      provider.updateProperty('node', 'non-existent', 'name', 'Alice')
    ).rejects.toThrow(NodeNotFoundError);
  });

  it('deleteProperty() should remove a property from a node', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Alice', age: 25 } });
    await provider.deleteProperty('node', 'n1', 'name');

    const node = await provider.getNode('n1');
    expect(node?.properties).toEqual({ age: 25 });
  });

  it('clearProperties() should remove all properties from a node', async () => {
    await provider.insertNode({ id: 'n1', type: 'Person', properties: { name: 'Alice', age: 25 } });
    await provider.clearProperties('node', 'n1');

    const node = await provider.getNode('n1');
    expect(node?.properties).toEqual({});
  });

  it('clearProperties() should throw NodeNotFoundError for non-existent node', async () => {
    await expect(
      provider.clearProperties('node', 'non-existent')
    ).rejects.toThrow(NodeNotFoundError);
  });

  // ---------------------------------------------------------------------------
  // createIndex
  // ---------------------------------------------------------------------------

  it('createIndex() should create a simple index on node property', async () => {
    await provider.createIndex('node', 'email');
    // Index creation is idempotent — calling again should not throw
    await expect(provider.createIndex('node', 'email')).resolves.toBeUndefined();
  });

  it('createIndex() should create a compound index on node property with type', async () => {
    await provider.createIndex('node', 'email', 'Person');
    await expect(provider.createIndex('node', 'email', 'Person')).resolves.toBeUndefined();
  });

  it('createIndex() should create a simple index on edge property', async () => {
    await provider.createIndex('edge', 'weight');
    await expect(provider.createIndex('edge', 'weight')).resolves.toBeUndefined();
  });

  it('createIndex() should create a compound index on edge property with type', async () => {
    await provider.createIndex('edge', 'weight', 'LIKES');
    await expect(provider.createIndex('edge', 'weight', 'LIKES')).resolves.toBeUndefined();
  });
});
