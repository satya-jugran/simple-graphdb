import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../src/index';
import complexGraphData from './data/complex-graph.json';

describe('Complex Graph from JSON', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = Graph.fromJSON(complexGraphData);
  });

  describe('Graph Structure', () => {
    it('should have 8 nodes', () => {
      expect(graph.getNodes()).toHaveLength(8);
    });

    it('should have 10 edges', () => {
      expect(graph.getEdges()).toHaveLength(10);
    });

    it('should have all specified nodes by name', () => {
      const allNodes = graph.getNodes();
      expect(allNodes).toHaveLength(8);
      const nodeNames = allNodes.map(n => n.properties.name).sort();
      expect(nodeNames).toEqual([
        'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry',
      ]);
    });
  });

  describe('Node Properties', () => {
    it('should have correct properties for Alice', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      expect(alice?.properties).toEqual({
        name: 'Alice',
        age: 30,
        city: 'NYC',
        occupation: 'Engineer',
      });
    });

    it('should have correct properties for Charlie', () => {
      const charlie = graph.getNodes().find(n => n.properties.name === 'Charlie');
      expect(charlie?.properties.city).toBe('Chicago');
      expect(charlie?.properties.occupation).toBe('Manager');
    });

    it('should have correct properties for Eve', () => {
      const eve = graph.getNodes().find(n => n.properties.name === 'Eve');
      expect(eve?.properties).toEqual({
        name: 'Eve',
        age: 32,
        city: 'Seattle',
        occupation: 'Data Scientist',
      });
    });

    it('should get nodes by type', () => {
      const people = graph.getNodesByType('Person');
      expect(people).toHaveLength(8);
    });
  });

  describe('Management Hierarchy (manages/reports-to relationships)', () => {
    it('should identify Alice as manager of David', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const david = graph.getNodes().find(n => n.properties.name === 'David');
      const davidParents = graph.getParents(david!.id);
      expect(davidParents.map(n => n.properties.name)).toContain('Alice');
    });

    it('should identify David as reporting to Alice', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const david = graph.getNodes().find(n => n.properties.name === 'David');
      const aliceChildren = graph.getChildren(alice!.id);
      expect(aliceChildren.map(n => n.properties.name)).toContain('David');
    });

    it('should identify Charlie as manager of Eve and Frank', () => {
      const charlie = graph.getNodes().find(n => n.properties.name === 'Charlie');
      const charlieChildren = graph.getChildren(charlie!.id);
      const childNames = charlieChildren.map(n => n.properties.name);
      expect(childNames).toContain('Eve');
      expect(childNames).toContain('Frank');
    });

    it('should get correct edge properties for management relationship', () => {
      const managesEdge = graph.getEdges().find(e => e.type === 'MANAGES');
      expect(managesEdge?.properties).toBeDefined();
    });

    it('should identify David as having only one manager', () => {
      const david = graph.getNodes().find(n => n.properties.name === 'David');
      const davidParents = graph.getParents(david!.id);
      expect(davidParents).toHaveLength(1);
    });
  });

  describe('Friendship and Social Relationships', () => {
    it('should identify Bob and Grace as friends', () => {
      const edges = graph.getEdgesByType('FRIENDS_WITH');
      expect(edges).toHaveLength(1);
    });

    it('should get strength of friendship', () => {
      const edge = graph.getEdges().find(e => e.type === 'FRIENDS_WITH');
      expect(edge?.properties.since).toBe(2018);
    });
  });

  describe('Work Relationships (collaborates/works-with)', () => {
    it('should find Bob works with Henry', () => {
      const bob = graph.getNodes().find(n => n.properties.name === 'Bob');
      const henry = graph.getNodes().find(n => n.properties.name === 'Henry');
      const edges = graph.getDirectEdgesBetween(bob!.id, henry!.id);
      expect(edges).toHaveLength(1);
    });
  });

  describe('traverse()', () => {
    // Graph structure:
    // Alice --MANAGES--> David --REPORTS_TO--> Alice (cycle)
    // Alice --KNOWS--> Bob --FRIENDS_WITH--> Grace
    // Bob --WORKS_WITH--> Henry
    // Charlie --MANAGES--> Eve --COLLABORATES_WITH--> Henry
    // Charlie --MANAGES--> Frank --MENTORS--> Grace
    // Alice --WIVES_WITH--> Eve

    it('should find path from Alice to Grace via Bob', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const grace = graph.getNodes().find(n => n.properties.name === 'Grace');
      const path = graph.traverse(alice!.id, grace!.id, { method: 'bfs' });
      expect(path).toBeDefined();
      expect(path).toContain(alice!.id);
      expect(path).toContain(grace!.id);
    });

    it('should find path from Charlie to Henry via Eve', () => {
      const charlie = graph.getNodes().find(n => n.properties.name === 'Charlie');
      const henry = graph.getNodes().find(n => n.properties.name === 'Henry');
      const path = graph.traverse(charlie!.id, henry!.id, { method: 'bfs' });
      expect(path).toBeDefined();
      expect(path).toContain(charlie!.id);
      expect(path).toContain(henry!.id);
    });

    it('should handle cycle without infinite loop', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const david = graph.getNodes().find(n => n.properties.name === 'David');
      const path = graph.traverse(alice!.id, david!.id, { method: 'bfs' });
      expect(path).toBeDefined();
    });

    it('should return null when no path exists', () => {
      const grace = graph.getNodes().find(n => n.properties.name === 'Grace');
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      // Grace has no outgoing edges, so cannot reach Alice
      const path = graph.traverse(grace!.id, alice!.id, { method: 'bfs' });
      expect(path).toBeNull();
    });

    it('should return [source] when source equals target', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const path = graph.traverse(alice!.id, alice!.id, { method: 'bfs' });
      expect(path).toEqual([alice!.id]);
    });

    it('should find direct neighbor path', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const bob = graph.getNodes().find(n => n.properties.name === 'Bob');
      const path = graph.traverse(alice!.id, bob!.id, { method: 'bfs' });
      expect(path).toEqual([alice!.id, bob!.id]);
    });

    it('should find multi-hop path with DFS', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const grace = graph.getNodes().find(n => n.properties.name === 'Grace');
      const path = graph.traverse(alice!.id, grace!.id, { method: 'dfs' });
      expect(path).toBeDefined();
      expect(path).toContain(alice!.id);
      expect(path).toContain(grace!.id);
    });

    it('should default to BFS', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const bob = graph.getNodes().find(n => n.properties.name === 'Bob');
      const path = graph.traverse(alice!.id, bob!.id);
      expect(path).toEqual([alice!.id, bob!.id]);
    });

    it('should return null for non-existent source', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      expect(graph.traverse('non-existent-id', alice!.id)).toBeNull();
    });

    it('should return null for non-existent target', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      expect(graph.traverse(alice!.id, 'non-existent-id')).toBeNull();
    });
  });

  describe('Serialization', () => {
    it('should serialize an empty graph', () => {
      const emptyGraph = new Graph();
      const data = emptyGraph.toJSON();
      expect(data).toEqual({ nodes: [], edges: [] });
    });

    it('should serialize a graph with nodes and edges', () => {
      const data = graph.toJSON();
      expect(data.nodes).toHaveLength(8);
      expect(data.edges).toHaveLength(10);
    });

    it('should reconstruct graph from data', () => {
      const data = graph.toJSON();
      const restored = Graph.fromJSON(data);
      expect(restored.getNodes()).toHaveLength(8);
      expect(restored.getEdges()).toHaveLength(10);
    });

    it('should maintain edge type through serialization round-trip', () => {
      const data = graph.toJSON();
      const restored = Graph.fromJSON(data);
      const originalEdge = graph.getEdges()[0];
      const restoredEdge = restored.getEdges().find(e => e.id === originalEdge.id);
      expect(restoredEdge?.type).toEqual(originalEdge.type);
    });
  });

  describe('Cross-relationships', () => {
    it('should find all edges between any two nodes', () => {
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const aliceChildren = graph.getChildren(alice!.id);
      expect(aliceChildren.map(n => n.properties.name).sort()).toEqual(['Bob', 'David', 'Eve']);
    });

    it('should identify multi-level relationships', () => {
      const david = graph.getNodes().find(n => n.properties.name === 'David');
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      const davidChildren = graph.getChildren(david!.id);
      const aliceChildren = graph.getChildren(alice!.id);
      expect(davidChildren.map(n => n.properties.name)).toEqual(['Alice']);
      expect(aliceChildren.map(n => n.properties.name)).toContain('David');
    });
  });
});
