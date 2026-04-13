import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../src/index';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
} from '../src/errors';

describe('Graph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe('Node Operations', () => {
    it('should add a node without properties', () => {
      const node = graph.addNode('Person', { name: 'Alice' });
      expect(node.id).toBeDefined();
      expect(node.type).toBe('Person');
      expect(node.properties.name).toBe('Alice');
      expect(node.properties).toEqual({ name: 'Alice' });
    });

    it('should add a node with properties', () => {
      const properties = { name: 'Alice', age: 30, city: 'NYC' };
      const node = graph.addNode('Person', properties);
      expect(node.id).toBeDefined();
      expect(node.type).toBe('Person');
      expect(node.properties).toEqual({ name: 'Alice', age: 30, city: 'NYC' });
    });

    it('should retrieve a node by id', () => {
      const node = graph.addNode('Person', { name: 'Alice', age: 30 });
      const retrieved = graph.getNode(node.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(node.id);
      expect(retrieved?.properties.age).toBe(30);
    });

    it('should return undefined for non-existent node', () => {
      const node = graph.getNode('non-existent-id');
      expect(node).toBeUndefined();
    });

    it('should check if node exists by id', () => {
      const node = graph.addNode('Person', { name: 'Alice' });
      expect(graph.hasNode(node.id)).toBe(true);
      expect(graph.hasNode('non-existent-id')).toBe(false);
    });

    it('should remove a node', () => {
      const node = graph.addNode('Person', { name: 'Alice' });
      expect(graph.removeNode(node.id)).toBe(true);
      expect(graph.hasNode(node.id)).toBe(false);
    });

    it('should return false when removing non-existent node', () => {
      expect(graph.removeNode('non-existent-id')).toBe(false);
    });

    it('should cascade remove incident edges when removing node', () => {
      const alice = graph.addNode('Person', { name: 'Alice' });
      const bob = graph.addNode('Person', { name: 'Bob' });
      const edge1 = graph.addEdge(alice.id, bob.id, 'KNOWS');
      const edge2 = graph.addEdge(bob.id, alice.id, 'LIKES');

      graph.removeNode(alice.id, true);

      expect(graph.hasNode(alice.id)).toBe(false);
      expect(graph.hasEdge(edge1.id)).toBe(false);
      expect(graph.hasEdge(edge2.id)).toBe(false);
    });

    it('should not cascade remove edges by default', () => {
      const alice = graph.addNode('Person', { name: 'Alice' });
      const bob = graph.addNode('Person', { name: 'Bob' });
      const edge = graph.addEdge(alice.id, bob.id, 'KNOWS');

      graph.removeNode(alice.id);

      expect(graph.hasNode(alice.id)).toBe(false);
      expect(graph.hasEdge(edge.id)).toBe(true);
    });

    it('should get all nodes', () => {
      graph.addNode('Person', { name: 'Alice' });
      graph.addNode('Person', { name: 'Bob' });
      graph.addNode('Person', { name: 'Charlie' });

      const nodes = graph.getNodes();
      expect(nodes).toHaveLength(3);
    });

    it('should get nodes by type', () => {
      graph.addNode('Person', { name: 'Alice' });
      graph.addNode('Person', { name: 'Bob' });
      graph.addNode('Course', { name: 'Python' });

      const people = graph.getNodesByType('Person');
      expect(people).toHaveLength(2);
      expect(people.map(n => n.properties.name).sort()).toEqual(['Alice', 'Bob']);
    });

    it('should get nodes by property', () => {
      graph.addNode('Person', { name: 'Alice', age: 30 });
      graph.addNode('Person', { name: 'Bob', age: 25 });
      graph.addNode('Person', { name: 'Charlie', age: 30 });

      const thirties = graph.getNodesByProperty('age', 30);
      expect(thirties).toHaveLength(2);
      expect(thirties.map(n => n.properties.name).sort()).toEqual(['Alice', 'Charlie']);
    });

    it('should return empty array when property value does not match', () => {
      graph.addNode('Person', { name: 'Alice', age: 30 });
      graph.addNode('Person', { name: 'Bob', age: 25 });

      const nonexistent = graph.getNodesByProperty('age', 50);
      expect(nonexistent).toHaveLength(0);
    });

    it('should find nodes by string property value', () => {
      graph.addNode('Person', { name: 'Alice', city: 'NYC' });
      graph.addNode('Person', { name: 'Bob', city: 'LA' });
      graph.addNode('Person', { name: 'Charlie', city: 'NYC' });

      const nycResidents = graph.getNodesByProperty('city', 'NYC');
      expect(nycResidents).toHaveLength(2);
      expect(nycResidents.map(n => n.properties.name).sort()).toEqual(['Alice', 'Charlie']);
    });
  });

  describe('Edge Operations', () => {
    let aliceId: string;
    let bobId: string;
    let charlieId: string;

    beforeEach(() => {
      aliceId = graph.addNode('Person', { name: 'Alice' }).id;
      bobId = graph.addNode('Person', { name: 'Bob' }).id;
      charlieId = graph.addNode('Person', { name: 'Charlie' }).id;
    });

    it('should add an edge between nodes', () => {
      const edge = graph.addEdge(aliceId, bobId, 'KNOWS');
      expect(edge.id).toBeDefined();
      expect(edge.sourceId).toBe(aliceId);
      expect(edge.targetId).toBe(bobId);
      expect(edge.type).toBe('KNOWS');
    });

    it('should throw NodeNotFoundError when source does not exist', () => {
      expect(() => graph.addEdge('non-existent', bobId, 'KNOWS')).toThrow(NodeNotFoundError);
    });

    it('should throw NodeNotFoundError when target does not exist', () => {
      expect(() => graph.addEdge(aliceId, 'non-existent', 'KNOWS')).toThrow(NodeNotFoundError);
    });

    it('should get edge by id', () => {
      const edge = graph.addEdge(aliceId, bobId, 'KNOWS');
      const retrieved = graph.getEdge(edge.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(edge.id);
    });

    it('should check if edge exists by id', () => {
      const edge = graph.addEdge(aliceId, bobId, 'KNOWS');
      expect(graph.hasEdge(edge.id)).toBe(true);
      expect(graph.hasEdge('non-existent-id')).toBe(false);
    });

    it('should remove an edge', () => {
      const edge = graph.addEdge(aliceId, bobId, 'KNOWS');
      expect(graph.removeEdge(edge.id)).toBe(true);
      expect(graph.hasEdge(edge.id)).toBe(false);
    });

    it('should return false when removing non-existent edge', () => {
      expect(graph.removeEdge('non-existent-id')).toBe(false);
    });

    it('should get parents of a node', () => {
      graph.addEdge(bobId, aliceId, 'KNOWS');
      graph.addEdge(charlieId, aliceId, 'KNOWS');

      const parents = graph.getParents(aliceId);
      expect(parents).toHaveLength(2);
      expect(parents.map(n => n.properties.name).sort()).toEqual(['Bob', 'Charlie']);
    });

    it('should get children of a node', () => {
      graph.addEdge(aliceId, bobId, 'KNOWS');
      graph.addEdge(aliceId, charlieId, 'KNOWS');

      const children = graph.getChildren(aliceId);
      expect(children).toHaveLength(2);
      expect(children.map(n => n.properties.name).sort()).toEqual(['Bob', 'Charlie']);
    });

    it('should get edges from a node', () => {
      graph.addEdge(aliceId, bobId, 'KNOWS');
      graph.addEdge(aliceId, charlieId, 'LIKES');

      const edges = graph.getEdgesFrom(aliceId);
      expect(edges).toHaveLength(2);
      expect(edges.map(e => e.type).sort()).toEqual(['KNOWS', 'LIKES']);
    });

    it('should get edges to a node', () => {
      graph.addEdge(bobId, aliceId, 'KNOWS');
      graph.addEdge(charlieId, aliceId, 'LIKES');

      const edges = graph.getEdgesTo(aliceId);
      expect(edges).toHaveLength(2);
      expect(edges.map(e => e.type).sort()).toEqual(['KNOWS', 'LIKES']);
    });

    it('should get edges between two nodes', () => {
      graph.addEdge(aliceId, bobId, 'KNOWS');
      graph.addEdge(bobId, aliceId, 'KNOWS');

      const edges = graph.getDirectEdgesBetween(aliceId, bobId);
      expect(edges).toHaveLength(2);
    });

    it('should get edges by type', () => {
      graph.addEdge(aliceId, bobId, 'KNOWS');
      graph.addEdge(aliceId, charlieId, 'KNOWS');
      graph.addEdge(bobId, charlieId, 'LIKES');

      const knowsEdges = graph.getEdgesByType('KNOWS');
      expect(knowsEdges).toHaveLength(2);
    });

    it('should throw NodeNotFoundError for getParents on non-existent node', () => {
      expect(() => graph.getParents('non-existent')).toThrow(NodeNotFoundError);
    });

    it('should throw NodeNotFoundError for getChildren on non-existent node', () => {
      expect(() => graph.getChildren('non-existent')).toThrow(NodeNotFoundError);
    });
  });

  describe('traverse()', () => {
    beforeEach(() => {
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
      const a = graph.getNodesByProperty('name', 'A')[0];
      const c = graph.getNodesByProperty('name', 'C')[0];
      // Add edge that would create cycle
      const d = graph.getNodesByProperty('name', 'D')[0];
      const b = graph.getNodesByProperty('name', 'B')[0];
      graph.addEdge(d.id, b.id, 'CONNECTS');
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
  });

  describe('Serialization', () => {
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

  describe('isDAG()', () => {
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

  describe('fromJSON() validation', () => {
    it('should throw NodeAlreadyExistsError for duplicate node IDs', () => {
      const data = {
        nodes: [
          { id: 'node1', type: 'Test', properties: { name: 'A' } },
          { id: 'node1', type: 'Test', properties: { name: 'B' } },
        ],
        edges: [],
      };
      expect(() => Graph.fromJSON(data)).toThrow(NodeAlreadyExistsError);
    });

    it('should throw EdgeAlreadyExistsError for duplicate edge IDs', () => {
      const data = {
        nodes: [
          { id: 'node1', type: 'Test', properties: { name: 'A' } },
          { id: 'node2', type: 'Test', properties: { name: 'B' } },
        ],
        edges: [
          { id: 'edge1', sourceId: 'node1', targetId: 'node2', type: 'LINKS', properties: {} },
          { id: 'edge1', sourceId: 'node2', targetId: 'node1', type: 'LINKS', properties: {} },
        ],
      };
      expect(() => Graph.fromJSON(data)).toThrow(EdgeAlreadyExistsError);
    });

    it('should throw NodeNotFoundError for edge referencing non-existent source', () => {
      const data = {
        nodes: [
          { id: 'node1', type: 'Test', properties: { name: 'A' } },
        ],
        edges: [
          { id: 'edge1', sourceId: 'non-existent', targetId: 'node1', type: 'LINKS', properties: {} },
        ],
      };
      expect(() => Graph.fromJSON(data)).toThrow(NodeNotFoundError);
    });

    it('should throw NodeNotFoundError for edge referencing non-existent target', () => {
      const data = {
        nodes: [
          { id: 'node1', type: 'Test', properties: { name: 'A' } },
        ],
        edges: [
          { id: 'edge1', sourceId: 'node1', targetId: 'non-existent', type: 'LINKS', properties: {} },
        ],
      };
      expect(() => Graph.fromJSON(data)).toThrow(NodeNotFoundError);
    });

    it('should successfully create graph with valid data', () => {
      const data = {
        nodes: [
          { id: 'node1', type: 'Test', properties: { name: 'A' } },
          { id: 'node2', type: 'Test', properties: { name: 'B' } },
        ],
        edges: [
          { id: 'edge1', sourceId: 'node1', targetId: 'node2', type: 'LINKS', properties: {} },
        ],
      };
      const graph = Graph.fromJSON(data);
      expect(graph.getNodes()).toHaveLength(2);
      expect(graph.getEdges()).toHaveLength(1);
    });
  });

  describe('clear()', () => {
    it('should remove all nodes and edges', () => {
      const aliceId = graph.addNode('Person', { name: 'Alice' }).id;
      const bobId = graph.addNode('Person', { name: 'Bob' }).id;
      graph.addEdge(aliceId, bobId, 'KNOWS');

      graph.clear();

      expect(graph.getNodes()).toHaveLength(0);
      expect(graph.getEdges()).toHaveLength(0);
    });
  });
});
