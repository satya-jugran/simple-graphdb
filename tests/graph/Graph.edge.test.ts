import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';
import { NodeNotFoundError } from '../../src/errors';

describe('Graph.Edge Operations', () => {
  let graph: Graph;
  let aliceId: string;
  let bobId: string;
  let charlieId: string;

  beforeEach(() => {
    graph = new Graph();
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
