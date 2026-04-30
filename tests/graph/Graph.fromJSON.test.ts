import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
} from '../../src/errors';

describe('Graph.importJSON() validation', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  it('should throw NodeAlreadyExistsError for duplicate node IDs', () => {
    const data = {
      nodes: [
        { id: 'node1', type: 'Test', properties: { name: 'A' } },
        { id: 'node1', type: 'Test', properties: { name: 'B' } },
      ],
      edges: [],
    };
    expect(() => Graph.importJSON(data)).toThrow(NodeAlreadyExistsError);
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
    expect(() => Graph.importJSON(data)).toThrow(EdgeAlreadyExistsError);
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
    expect(() => Graph.importJSON(data)).toThrow(NodeNotFoundError);
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
    expect(() => Graph.importJSON(data)).toThrow(NodeNotFoundError);
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
    const graph = Graph.importJSON(data);
    expect(graph.getNodes()).toHaveLength(2);
    expect(graph.getEdges()).toHaveLength(1);
  });
});
