import type { GraphData } from '../types';
import { Node } from '../Node';
import { Edge } from '../Edge';
import { GraphIndex } from './GraphIndex';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
} from '../errors';

/**
 * Internal class that handles graph serialization and deserialization.
 */
export class GraphSerializer {
  constructor(private _index: GraphIndex) {}

  /**
   * Serializes the graph to a plain object for JSON storage.
   * Nodes and edges are serialized in stable insertion order.
   * @returns GraphData representation
   */
  toJSON(): GraphData {
    const nodeMap = this._index._getNodeMap();
    const edgeMap = this._index._getEdgeMap();

    return {
      nodes: Array.from(nodeMap.values()).map(node => node.toJSON()),
      edges: Array.from(edgeMap.values()).map(edge => edge.toJSON()),
    };
  }

  /**
   * Populates the graph index from serialized data.
   * @param data - GraphData to reconstruct from
   * @throws NodeAlreadyExistsError if a node id is duplicated
   * @throws EdgeAlreadyExistsError if an edge id is duplicated
   * @throws NodeNotFoundError if an edge references a non-existent node
   */
  fromJSON(data: GraphData): void {
    const nodeMap = this._index._getNodeMap();
    const edgeMap = this._index._getEdgeMap();

    // Add all nodes first with validation
    for (const nodeData of data.nodes) {
      if (nodeMap.has(nodeData.id)) {
        throw new NodeAlreadyExistsError(nodeData.id);
      }
      const node = new Node(nodeData.type, nodeData.properties, nodeData.id);
      this._index._insertNode(node);
    }

    // Then add all edges with validation
    for (const edgeData of data.edges) {
      if (edgeMap.has(edgeData.id)) {
        throw new EdgeAlreadyExistsError(edgeData.id);
      }
      if (!nodeMap.has(edgeData.sourceId)) {
        throw new NodeNotFoundError(edgeData.sourceId);
      }
      if (!nodeMap.has(edgeData.targetId)) {
        throw new NodeNotFoundError(edgeData.targetId);
      }
      const edge = new Edge(
        edgeData.sourceId,
        edgeData.targetId,
        edgeData.type,
        edgeData.properties,
        edgeData.id
      );
      this._index._insertEdge(edge);
    }
  }
}
