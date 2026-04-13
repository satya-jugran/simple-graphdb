import type { GraphData } from '../types';
import type { NodeData } from '../types';
import type { EdgeData } from '../types';
import { Node } from '../Node';
import { Edge } from '../Edge';
import { GraphIndex } from './GraphIndex';
import { GraphTraversal } from './GraphTraversal';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
} from '../errors';

/**
 * Internal class that handles graph serialization and deserialization.
 */
export class GraphSerializer {
  constructor(
    private _index: GraphIndex,
    private _traversal: GraphTraversal
  ) {}

  /**
   * Serializes the graph to a plain object for JSON storage.
   * For DAGs, nodes are serialized in topological order (dependencies first).
   * @returns GraphData representation
   */
  toJSON(): GraphData {
    const nodesArray = Array.from(this._index._nodes.values());
    const edgesArray = Array.from(this._index._edges.values());

    // For DAGs, use topological order for consistent serialization
    const topoOrder = this._traversal.topologicalSort();
    if (topoOrder) {
      const nodeMap = new Map(nodesArray.map(n => [n.id, n]));
      const sortedNodes = topoOrder
        .map(id => nodeMap.get(id))
        .filter((n): n is Node => n !== undefined)
        .map(node => node.toJSON());

      return {
        nodes: sortedNodes,
        edges: edgesArray.map(edge => edge.toJSON()),
      };
    }

    // For non-DAGs (cycles), use default order
    return {
      nodes: nodesArray.map(node => node.toJSON()),
      edges: edgesArray.map(edge => edge.toJSON()),
    };
  }

  /**
   * Creates a new Graph instance from serialized data.
   * @param data - GraphData to reconstruct from
   * @returns Object with index containing all nodes and edges
   * @throws NodeAlreadyExistsError if a node id is duplicated
   * @throws EdgeAlreadyExistsError if an edge id is duplicated
   * @throws NodeNotFoundError if an edge references a non-existent node
   */
  fromJSON(data: GraphData): void {
    // Add all nodes first with validation
    for (const nodeData of data.nodes) {
      if (this._index._nodes.has(nodeData.id)) {
        throw new NodeAlreadyExistsError(nodeData.id);
      }
      const node = new Node(nodeData.type, nodeData.properties, nodeData.id);
      this._index._nodes.set(node.id, node);

      // Update type index
      if (!this._index._nodesByType.has(nodeData.type)) {
        this._index._nodesByType.set(nodeData.type, new Set());
      }
      this._index._nodesByType.get(nodeData.type)!.add(node.id);
    }

    // Then add all edges with validation
    for (const edgeData of data.edges) {
      if (this._index._edges.has(edgeData.id)) {
        throw new EdgeAlreadyExistsError(edgeData.id);
      }
      if (!this._index._nodes.has(edgeData.sourceId)) {
        throw new NodeNotFoundError(edgeData.sourceId);
      }
      if (!this._index._nodes.has(edgeData.targetId)) {
        throw new NodeNotFoundError(edgeData.targetId);
      }
      const edge = new Edge(
        edgeData.sourceId,
        edgeData.targetId,
        edgeData.type,
        edgeData.properties,
        edgeData.id
      );
      this._index._edges.set(edge.id, edge);

      // Update adjacency maps
      if (!this._index._edgesBySource.has(edgeData.sourceId)) {
        this._index._edgesBySource.set(edgeData.sourceId, new Set());
      }
      this._index._edgesBySource.get(edgeData.sourceId)!.add(edge.id);

      if (!this._index._edgesByTarget.has(edgeData.targetId)) {
        this._index._edgesByTarget.set(edgeData.targetId, new Set());
      }
      this._index._edgesByTarget.get(edgeData.targetId)!.add(edge.id);

      // Update type index
      if (!this._index._edgesByType.has(edgeData.type)) {
        this._index._edgesByType.set(edgeData.type, new Set());
      }
      this._index._edgesByType.get(edgeData.type)!.add(edge.id);
    }
  }
}
