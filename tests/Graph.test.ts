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
      const node = graph.addNode('Alice');
      expect(node.name).toBe('Alice');
      expect(node.properties).toEqual({});
    });

    it('should add a node with properties', () => {
      const properties = { age: 30, city: 'NYC' };
      const node = graph.addNode('Alice', properties);
      expect(node.name).toBe('Alice');
      expect(node.properties).toEqual({ age: 30, city: 'NYC' });
    });

    it('should retrieve a node by name', () => {
      graph.addNode('Alice', { age: 30 });
      const node = graph.getNode('Alice');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Alice');
      expect(node?.properties).toEqual({ age: 30 });
    });

    it('should return undefined for non-existent node', () => {
      const node = graph.getNode('NonExistent');
      expect(node).toBeUndefined();
    });

    it('should check if node exists', () => {
      graph.addNode('Alice');
      expect(graph.hasNode('Alice')).toBe(true);
      expect(graph.hasNode('Bob')).toBe(false);
    });

    it('should throw NodeAlreadyExistsError when adding duplicate node', () => {
      graph.addNode('Alice');
      expect(() => graph.addNode('Alice')).toThrow(NodeAlreadyExistsError);
    });

    it('should remove a node', () => {
      graph.addNode('Alice');
      expect(graph.removeNode('Alice')).toBe(true);
      expect(graph.hasNode('Alice')).toBe(false);
    });

    it('should return false when removing non-existent node', () => {
      expect(graph.removeNode('NonExistent')).toBe(false);
    });

    it('should cascade remove incident edges when removing node', () => {
      graph.addNode('Alice');
      graph.addNode('Bob');
      graph.addEdge('knows', 'Alice', 'Bob');
      graph.addEdge('likes', 'Bob', 'Alice');

      graph.removeNode('Alice', true);

      expect(graph.hasNode('Alice')).toBe(false);
      expect(graph.hasEdge('knows')).toBe(false);
      expect(graph.hasEdge('likes')).toBe(false);
    });

    it('should not cascade remove edges by default', () => {
      graph.addNode('Alice');
      graph.addNode('Bob');
      graph.addEdge('knows', 'Alice', 'Bob');

      graph.removeNode('Alice');

      expect(graph.hasNode('Alice')).toBe(false);
      expect(graph.hasEdge('knows')).toBe(true);
    });

    it('should get all nodes', () => {
      graph.addNode('Alice');
      graph.addNode('Bob');
      graph.addNode('Charlie');

      const nodes = graph.getNodes();
      expect(nodes).toHaveLength(3);
      expect(nodes.map((n) => n.name).sort()).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });

  describe('Edge Operations', () => {
    beforeEach(() => {
      graph.addNode('Alice');
      graph.addNode('Bob');
      graph.addNode('Charlie');
    });

    it('should add an edge without properties', () => {
      const edge = graph.addEdge('knows', 'Alice', 'Bob');
      expect(edge.name).toBe('knows');
      expect(edge.sourceName).toBe('Alice');
      expect(edge.targetName).toBe('Bob');
      expect(edge.properties).toEqual({});
    });

    it('should add an edge with properties', () => {
      const properties = { since: 2020, intensity: 'high' };
      const edge = graph.addEdge('knows', 'Alice', 'Bob', properties);
      expect(edge.name).toBe('knows');
      expect(edge.properties).toEqual({ since: 2020, intensity: 'high' });
    });

    it('should retrieve an edge by name', () => {
      graph.addEdge('knows', 'Alice', 'Bob');
      const edge = graph.getEdge('knows');
      expect(edge).toBeDefined();
      expect(edge?.name).toBe('knows');
      expect(edge?.sourceName).toBe('Alice');
      expect(edge?.targetName).toBe('Bob');
    });

    it('should return undefined for non-existent edge', () => {
      const edge = graph.getEdge('NonExistent');
      expect(edge).toBeUndefined();
    });

    it('should check if edge exists', () => {
      graph.addEdge('knows', 'Alice', 'Bob');
      expect(graph.hasEdge('knows')).toBe(true);
      expect(graph.hasEdge('likes')).toBe(false);
    });

    it('should throw NodeNotFoundError when source node does not exist', () => {
      expect(() => graph.addEdge('knows', 'NonExistent', 'Bob')).toThrow(
        NodeNotFoundError
      );
    });

    it('should throw NodeNotFoundError when target node does not exist', () => {
      expect(() => graph.addEdge('knows', 'Alice', 'NonExistent')).toThrow(
        NodeNotFoundError
      );
    });

    it('should throw EdgeAlreadyExistsError when adding duplicate edge', () => {
      graph.addEdge('knows', 'Alice', 'Bob');
      expect(() => graph.addEdge('knows', 'Alice', 'Bob')).toThrow(EdgeAlreadyExistsError);
    });

    it('should remove an edge', () => {
      graph.addEdge('knows', 'Alice', 'Bob');
      expect(graph.removeEdge('knows')).toBe(true);
      expect(graph.hasEdge('knows')).toBe(false);
    });

    it('should return false when removing non-existent edge', () => {
      expect(graph.removeEdge('NonExistent')).toBe(false);
    });

    it('should get all edges', () => {
      graph.addEdge('knows', 'Alice', 'Bob');
      graph.addEdge('likes', 'Bob', 'Charlie');

      const edges = graph.getEdges();
      expect(edges).toHaveLength(2);
      expect(edges.map((e) => e.name).sort()).toEqual(['knows', 'likes']);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      graph.addNode('Alice');
      graph.addNode('Bob');
      graph.addNode('Charlie');
      graph.addNode('David');
      graph.addEdge('knows-ab', 'Alice', 'Bob');
      graph.addEdge('likes-ac', 'Alice', 'Charlie');
      graph.addEdge('loves-bc', 'Bob', 'Charlie');
      graph.addEdge('knows-da', 'David', 'Alice');
    });

    it('should get parent nodes', () => {
      const parents = graph.getParents('Alice');
      expect(parents.map((n) => n.name).sort()).toEqual(['David']);
    });

    it('should get child nodes', () => {
      const children = graph.getChildren('Alice');
      expect(children.map((n) => n.name).sort()).toEqual(['Bob', 'Charlie']);
    });

    it('should get edges from a node', () => {
      const edges = graph.getEdgesFrom('Alice');
      expect(edges.map((e) => e.name).sort()).toEqual(['knows-ab', 'likes-ac']);
    });

    it('should get edges to a node', () => {
      const edges = graph.getEdgesTo('Charlie');
      expect(edges.map((e) => e.name).sort()).toEqual(['likes-ac', 'loves-bc']);
    });

    it('should get edges between two nodes', () => {
      const edges = graph.getEdgesBetween('Alice', 'Bob');
      expect(edges.map((e) => e.name)).toEqual(['knows-ab']);
    });

    it('should throw NodeNotFoundError for getEdgesBetween when source does not exist', () => {
      expect(() => graph.getEdgesBetween('NonExistent', 'Bob')).toThrow(NodeNotFoundError);
    });

    it('should throw NodeNotFoundError for getEdgesBetween when target does not exist', () => {
      expect(() => graph.getEdgesBetween('Alice', 'NonExistent')).toThrow(NodeNotFoundError);
    });

    it('should throw NodeNotFoundError for getParents on non-existent node', () => {
      expect(() => graph.getParents('NonExistent')).toThrow(NodeNotFoundError);
    });

    it('should throw NodeNotFoundError for getChildren on non-existent node', () => {
      expect(() => graph.getChildren('NonExistent')).toThrow(NodeNotFoundError);
    });
  });

  describe('Serialization', () => {
    it('should serialize an empty graph', () => {
      const data = graph.toJSON();
      expect(data).toEqual({ nodes: [], edges: [] });
    });

    it('should serialize a graph with nodes and edges', () => {
      graph.addNode('Alice', { age: 30 });
      graph.addNode('Bob', { age: 25 });
      graph.addEdge('knows', 'Alice', 'Bob', { since: 2020 });

      const data = graph.toJSON();
      expect(data.nodes).toHaveLength(2);
      expect(data.edges).toHaveLength(1);
      expect(data.nodes[0]).toEqual({ name: 'Alice', properties: { age: 30 } });
      expect(data.nodes[1]).toEqual({ name: 'Bob', properties: { age: 25 } });
      expect(data.edges[0]).toEqual({
        name: 'knows',
        sourceName: 'Alice',
        targetName: 'Bob',
        properties: { since: 2020 },
      });
    });

    it('should reconstruct graph from data', () => {
      graph.addNode('Alice', { age: 30 });
      graph.addNode('Bob', { age: 25 });
      graph.addEdge('knows', 'Alice', 'Bob', { since: 2020 });

      const data = graph.toJSON();
      const restored = Graph.fromJSON(data);

      expect(restored.getNodes()).toHaveLength(2);
      expect(restored.getEdges()).toHaveLength(1);

      const alice = restored.getNode('Alice');
      expect(alice?.properties).toEqual({ age: 30 });

      const knows = restored.getEdge('knows');
      expect(knows?.sourceName).toBe('Alice');
      expect(knows?.targetName).toBe('Bob');
    });

    it('should handle round-trip serialization', () => {
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addEdge('e1', 'A', 'B', { label: 'first' });
      graph.addEdge('e2', 'B', 'C', { label: 'second' });

      const data = graph.toJSON();
      const restored = Graph.fromJSON(data);

      expect(restored.getNodes()).toHaveLength(3);
      expect(restored.getEdges()).toHaveLength(2);
      expect(restored.getChildren('A').map((n) => n.name)).toEqual(['B']);
      expect(restored.getParents('C').map((n) => n.name)).toEqual(['B']);
    });
  });

  describe('clear()', () => {
    it('should remove all nodes and edges', () => {
      graph.addNode('Alice');
      graph.addNode('Bob');
      graph.addEdge('knows', 'Alice', 'Bob');

      graph.clear();

      expect(graph.getNodes()).toHaveLength(0);
      expect(graph.getEdges()).toHaveLength(0);
    });
  });
});
