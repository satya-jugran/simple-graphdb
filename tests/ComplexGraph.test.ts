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

    it('should have all specified nodes', () => {
      const nodeNames = graph.getNodes().map((n) => n.name).sort();
      expect(nodeNames).toEqual([
        'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry',
      ]);
    });
  });

  describe('Node Properties', () => {
    it('should have correct properties for Alice', () => {
      const alice = graph.getNode('Alice');
      expect(alice?.properties).toEqual({
        age: 30,
        city: 'NYC',
        occupation: 'Engineer',
      });
    });

    it('should have correct properties for Charlie', () => {
      const charlie = graph.getNode('Charlie');
      expect(charlie?.properties.city).toBe('Chicago');
      expect(charlie?.properties.occupation).toBe('Manager');
    });

    it('should have correct properties for Eve', () => {
      const eve = graph.getNode('Eve');
      expect(eve?.properties).toEqual({
        age: 32,
        city: 'Seattle',
        occupation: 'Data Scientist',
      });
    });
  });

  describe('Management Hierarchy (manages/reports-to relationships)', () => {
    it('should identify Alice as manager of David', () => {
      const davidParents = graph.getParents('David');
      expect(davidParents.map((n) => n.name)).toContain('Alice');
    });

    it('should identify David as reporting to Alice', () => {
      const aliceChildren = graph.getChildren('Alice');
      expect(aliceChildren.map((n) => n.name)).toContain('David');
    });

    it('should identify Charlie as manager of Eve and Frank', () => {
      const charlieChildren = graph.getChildren('Charlie');
      const childNames = charlieChildren.map((n) => n.name);
      expect(childNames).toContain('Eve');
      expect(childNames).toContain('Frank');
    });

    it('should get correct edge properties for management relationship', () => {
      const managesEdge = graph.getEdge('Alice-manages-David');
      expect(managesEdge?.properties.since).toBe(2020);
      expect(managesEdge?.properties.level).toBe(1);
    });

    it('should identify David as having only one manager', () => {
      const davidParents = graph.getParents('David');
      expect(davidParents).toHaveLength(1);
    });
  });

  describe('Friendship and Social Relationships', () => {
    it('should identify Bob and Grace as friends', () => {
      const edges = graph.getEdgesBetween('Bob', 'Grace');
      expect(edges).toHaveLength(1);
      expect(edges[0].name).toBe('Bob-friends-with-Grace');
      expect(edges[0].properties.strength).toBe('close');
    });

    it('should get strength of friendship', () => {
      const edge = graph.getEdge('Bob-friends-with-Grace');
      expect(edge?.properties.since).toBe(2018);
    });
  });

  describe('Work Relationships (collaborates/works-with)', () => {
    it('should find Bob works with Henry', () => {
      const edges = graph.getEdgesBetween('Bob', 'Henry');
      expect(edges).toHaveLength(1);
      expect(edges[0].name).toBe('Bob-works-with-Henry');
      expect(edges[0].properties.project).toBe('Alpha');
    });

    it('should find Eve collaborates with Henry', () => {
      const edges = graph.getEdgesBetween('Eve', 'Henry');
      expect(edges).toHaveLength(1);
      expect(edges[0].name).toBe('Eve-collaborates-with-Henry');
      expect(edges[0].properties.project).toBe('Beta');
    });

    it('should get all edges from Bob', () => {
      const edges = graph.getEdgesFrom('Bob');
      expect(edges).toHaveLength(2); // Only outgoing edges
      expect(edges.map((e) => e.name).sort()).toEqual([
        'Bob-friends-with-Grace',
        'Bob-works-with-Henry',
      ]);
    });
  });

  describe('Incoming Edges', () => {
    it('should get all incoming edges to Alice', () => {
      const edges = graph.getEdgesTo('Alice');
      expect(edges).toHaveLength(1);
      expect(edges[0].name).toBe('David-reports-to-Alice');
    });

    it('should get all incoming edges to Grace', () => {
      const edges = graph.getEdgesTo('Grace');
      expect(edges).toHaveLength(2);
      expect(edges.map((e) => e.name).sort()).toEqual([
        'Bob-friends-with-Grace',
        'Frank-mentors-Grace',
      ]);
    });
  });

  describe('Outgoing Edges', () => {
    it('should get all outgoing edges from Charlie', () => {
      const edges = graph.getEdgesFrom('Charlie');
      expect(edges).toHaveLength(2);
      expect(edges.map((e) => e.name).sort()).toEqual([
        'Charlie-manages-Eve',
        'Charlie-manages-Frank',
      ]);
    });

    it('should get all outgoing edges from Alice', () => {
      const edges = graph.getEdgesFrom('Alice');
      expect(edges).toHaveLength(3);
      expect(edges.map((e) => e.name).sort()).toEqual([
        'Alice-knows-Bob',
        'Alice-manages-David',
        'Alice-wives-with-Eve',
      ]);
    });
  });

  describe('Personal Relationships', () => {
    it('should find Alice and Eve have a personal relationship', () => {
      const edges = graph.getEdgesBetween('Alice', 'Eve');
      expect(edges).toHaveLength(1);
      expect(edges[0].name).toBe('Alice-wives-with-Eve');
      expect(edges[0].properties.type).toBe('personal');
    });
  });

  describe('Mentorship', () => {
    it('should identify Frank as mentor of Grace', () => {
      const graceParents = graph.getParents('Grace');
      expect(graceParents.map((n) => n.name)).toContain('Frank');
    });

    it('should get mentorship edge properties', () => {
      const edge = graph.getEdge('Frank-mentors-Grace');
      expect(edge?.properties.frequency).toBe('weekly');
    });
  });

  describe('Graph Modification after Loading', () => {
    it('should allow adding new nodes', () => {
      const newNode = graph.addNode('Ivan', { age: 29, city: 'Miami' });
      expect(newNode.name).toBe('Ivan');
      expect(graph.getNode('Ivan')?.properties.city).toBe('Miami');
      expect(graph.getNodes()).toHaveLength(9);
    });

    it('should allow adding new edges between existing nodes', () => {
      graph.addEdge('Alice-mentors-Henry', 'Alice', 'Henry', { since: 2023 });
      expect(graph.getEdge('Alice-mentors-Henry')).toBeDefined();
      expect(graph.getEdges()).toHaveLength(11);
    });

    it('should allow removing nodes with cascade', () => {
      graph.removeNode('David', true);
      expect(graph.getNode('David')).toBeUndefined();
      expect(graph.getEdge('David-reports-to-Alice')).toBeUndefined();
      expect(graph.getEdge('Alice-manages-David')).toBeUndefined();
      expect(graph.getNodes()).toHaveLength(7);
      expect(graph.getEdges()).toHaveLength(8);
    });

    it('should preserve original data after modifications', () => {
      graph.addNode('NewPerson', { age: 25 });
      graph.addEdge('NewEdge', 'Alice', 'Bob', {});

      // Original nodes and edges should still exist
      expect(graph.getNode('Alice')).toBeDefined();
      expect(graph.getNode('Charlie')).toBeDefined();
      expect(graph.getEdge('Charlie-manages-Eve')).toBeDefined();
    });
  });

  describe('Re-serialization', () => {
    it('should produce valid JSON after loading and modifying', () => {
      graph.addNode('TestNode', { key: 'value' });
      const data = graph.toJSON();

      expect(data.nodes).toHaveLength(9);
      expect(data.edges).toHaveLength(10);

      // Should be able to re-create from the new data
      const reloaded = Graph.fromJSON(data);
      expect(reloaded.getNodes()).toHaveLength(9);
      expect(reloaded.getNode('TestNode')).toBeDefined();
    });

    it('should maintain edge properties through serialization round-trip', () => {
      const data = graph.toJSON();
      const reloaded = Graph.fromJSON(data);

      const originalEdge = graph.getEdge('Bob-friends-with-Grace');
      const reloadedEdge = reloaded.getEdge('Bob-friends-with-Grace');

      expect(reloadedEdge?.properties).toEqual(originalEdge?.properties);
    });
  });

  describe('Cross-relationships', () => {
    it('should find all edges between any two nodes', () => {
      // Alice has edges to: Bob, David, Eve
      const aliceChildren = graph.getChildren('Alice');
      expect(aliceChildren.map((n) => n.name).sort()).toEqual(['Bob', 'David', 'Eve']);
    });

    it('should identify multi-level relationships', () => {
      // David reports to Alice (David -> Alice means Alice is David's child)
      const davidChildren = graph.getChildren('David');
      const aliceChildren = graph.getChildren('Alice');

      expect(davidChildren.map(c => c.name)).toEqual(['Alice']);
      expect(aliceChildren).toContainEqual(expect.objectContaining({ name: 'David' }));
    });
  });
});
