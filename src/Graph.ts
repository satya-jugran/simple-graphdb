import type { GraphData } from './types';
import type { NodeData } from './types';
import type { EdgeData } from './types';
import { Node } from './Node';
import { Edge } from './Edge';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
  EdgeNotFoundError,
} from './errors';

/**
 * An in-memory graph database with basic features.
 * Manages nodes and directed edges with arbitrary JSON properties.
 */
export class Graph {
  private readonly _nodes: Map<string, Node> = new Map();
  private readonly _edges: Map<string, Edge> = new Map();

  constructor() {}

  /**
   * Returns all nodes in the graph.
   */
  getNodes(): readonly Node[] {
    return Array.from(this._nodes.values());
  }

  /**
   * Returns all edges in the graph.
   */
  getEdges(): readonly Edge[] {
    return Array.from(this._edges.values());
  }

  /**
   * Checks if a node exists in the graph.
   * @param id - Id of the node
   */
  hasNode(id: string): boolean {
    return this._nodes.has(id);
  }

  /**
   * Checks if an edge exists in the graph.
   * @param id - Id of the edge
   */
  hasEdge(id: string): boolean {
    return this._edges.has(id);
  }

  /**
   * Adds a new node to the graph.
   * @param type - The type (label) of the node
   * @param properties - Optional JSON properties
   * @returns The newly created Node
   * @throws NodeAlreadyExistsError if a node with this id already exists
   */
  addNode(type: string, properties: Record<string, unknown> = {}): Node {
    const node = new Node(type, properties);
    if (this._nodes.has(node.id)) {
      throw new NodeAlreadyExistsError(node.id);
    }
    this._nodes.set(node.id, node);
    return node;
  }

  /**
   * Removes a node from the graph.
   * @param id - Id of the node to remove
   * @param cascade - If true, also removes all incident edges (default: false)
   * @returns true if the node was removed, false if it didn't exist
   */
  removeNode(id: string, cascade: boolean = false): boolean {
    const node = this._nodes.get(id);
    if (!node) {
      return false;
    }

    if (cascade) {
      // Remove all edges incident to this node
      const edgesToRemove = Array.from(this._edges.values()).filter(
        (edge) => edge.sourceId === id || edge.targetId === id
      );
      for (const edge of edgesToRemove) {
        this._edges.delete(edge.id);
      }
    }

    this._nodes.delete(id);
    return true;
  }

  /**
   * Retrieves a node by id.
   * @param id - Id of the node
   * @returns The Node if found, undefined otherwise
   */
  getNode(id: string): Node | undefined {
    return this._nodes.get(id);
  }

  /**
   * Retrieves nodes by their type.
   * @param type - The node type to filter by
   * @returns Array of Nodes with the specified type
   */
  getNodesByType(type: string): Node[] {
    return Array.from(this._nodes.values()).filter((node) => node.type === type);
  }

  /**
   * Retrieves nodes by a property value.
   * @param key - The property key to search
   * @param value - The property value to match
   * @returns Array of Nodes with the specified property value
   */
  getNodesByProperty(key: string, value: unknown): Node[] {
    return Array.from(this._nodes.values()).filter(
      (node) => node.properties[key] === value
    );
  }

  /**
   * Adds a new directed edge to the graph.
   * @param sourceId - Id of the source node
   * @param targetId - Id of the target node
   * @param type - The relationship type
   * @param properties - Optional JSON properties
   * @returns The newly created Edge
   * @throws NodeNotFoundError if source or target node doesn't exist
   * @throws EdgeAlreadyExistsError if an edge with this id already exists
   */
  addEdge(
    sourceId: string,
    targetId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): Edge {
    if (!this._nodes.has(sourceId)) {
      throw new NodeNotFoundError(sourceId);
    }
    if (!this._nodes.has(targetId)) {
      throw new NodeNotFoundError(targetId);
    }

    const edge = new Edge(sourceId, targetId, type, properties);
    if (this._edges.has(edge.id)) {
      throw new EdgeAlreadyExistsError(edge.id);
    }
    this._edges.set(edge.id, edge);
    return edge;
  }

  /**
   * Removes an edge from the graph.
   * @param id - Id of the edge to remove
   * @returns true if the edge was removed, false if it didn't exist
   */
  removeEdge(id: string): boolean {
    return this._edges.delete(id);
  }

  /**
   * Retrieves an edge by id.
   * @param id - Id of the edge
   * @returns The Edge if found, undefined otherwise
   */
  getEdge(id: string): Edge | undefined {
    return this._edges.get(id);
  }

  /**
   * Gets the parent nodes of a given node.
   * Parents are nodes that have edges pointing TO this node.
   * @param nodeId - Id of the target node
   * @returns Array of parent Nodes
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getParents(nodeId: string): Node[] {
    if (!this._nodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const parentIds = new Set<string>();
    for (const edge of this._edges.values()) {
      if (edge.targetId === nodeId) {
        parentIds.add(edge.sourceId);
      }
    }

    return Array.from(parentIds)
      .map((id) => this._nodes.get(id)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Gets the child nodes of a given node.
   * Children are nodes that this node points TO.
   * @param nodeId - Id of the source node
   * @returns Array of child Nodes
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getChildren(nodeId: string): Node[] {
    if (!this._nodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const childIds = new Set<string>();
    for (const edge of this._edges.values()) {
      if (edge.sourceId === nodeId) {
        childIds.add(edge.targetId);
      }
    }

    return Array.from(childIds)
      .map((id) => this._nodes.get(id)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Gets all edges originating from a node (outgoing edges).
   * @param sourceId - Id of the source node
   * @returns Array of outgoing Edges
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesFrom(sourceId: string): Edge[] {
    if (!this._nodes.has(sourceId)) {
      throw new NodeNotFoundError(sourceId);
    }

    return Array.from(this._edges.values()).filter(
      (edge) => edge.sourceId === sourceId
    );
  }

  /**
   * Gets all edges pointing to a node (incoming edges).
   * @param targetId - Id of the target node
   * @returns Array of incoming Edges
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesTo(targetId: string): Edge[] {
    if (!this._nodes.has(targetId)) {
      throw new NodeNotFoundError(targetId);
    }

    return Array.from(this._edges.values()).filter(
      (edge) => edge.targetId === targetId
    );
  }

  /**
   * Gets all edges between two nodes (in either direction).
   * @param sourceId - Id of the first node
   * @param targetId - Id of the second node
   * @returns Array of Edges between the nodes
   * @throws NodeNotFoundError if either node doesn't exist
   */
  getEdgesBetween(sourceId: string, targetId: string): Edge[] {
    if (!this._nodes.has(sourceId)) {
      throw new NodeNotFoundError(sourceId);
    }
    if (!this._nodes.has(targetId)) {
      throw new NodeNotFoundError(targetId);
    }
    return Array.from(this._edges.values()).filter(
      (edge) =>
        (edge.sourceId === sourceId && edge.targetId === targetId) ||
        (edge.sourceId === targetId && edge.targetId === sourceId)
    );
  }

  /**
   * Gets all edges of a specific type.
   * @param type - The edge type to filter by
   * @returns Array of Edges with the specified type
   */
  getEdgesByType(type: string): Edge[] {
    return Array.from(this._edges.values()).filter((edge) => edge.type === type);
  }

  /**
   * Traverses the graph from source to target using the specified algorithm.
   * @param sourceId - Id of the source node
   * @param targetId - Id of the target node
   * @param method - Traversal method: 'bfs' (breadth-first search) or 'dfs' (depth-first search). Default: 'bfs'
   * @returns Array of node ids from source to target if path exists, null otherwise
   */
  traverse(
    sourceId: string,
    targetId: string,
    method: 'bfs' | 'dfs' = 'bfs'
  ): string[] | null {
    if (!this._nodes.has(sourceId) || !this._nodes.has(targetId)) {
      return null;
    }

    if (sourceId === targetId) {
      return [sourceId];
    }

    const visited = new Set<string>();
    const parent = new Map<string, string | null>();
    const queueOrStack: string[] = [sourceId];

    parent.set(sourceId, null);
    visited.add(sourceId);

    while (queueOrStack.length > 0) {
      const current = method === 'bfs'
        ? queueOrStack.shift()!
        : queueOrStack.pop()!;

      if (current === targetId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | null = targetId;
        while (node !== null) {
          path.push(node);
          node = parent.get(node) ?? null;
        }
        return path.reverse();
      }

      // Get children (nodes this node points to)
      for (const edge of this._edges.values()) {
        if (edge.sourceId === current && !visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          parent.set(edge.targetId, current);
          queueOrStack.push(edge.targetId);
        }
      }
    }

    return null;
  }

  /**
   * Removes all nodes and edges from the graph.
   */
  clear(): void {
    this._nodes.clear();
    this._edges.clear();
  }

  /**
   * Check if graph is a Directed Acyclic Graph (no cycles).
   * Uses DFS-based cycle detection.
   * @returns true if the graph has no cycles, false otherwise
   */
  isDAG(): boolean {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      visiting.add(nodeId);

      // Check all edges from this node
      for (const edge of this._edges.values()) {
        if (edge.sourceId !== nodeId) continue;

        if (!visited.has(edge.targetId)) {
          if (hasCycle(edge.targetId)) {
            return true;
          }
        } else if (visiting.has(edge.targetId)) {
          // Found a back edge - cycle detected
          return true;
        }
      }

      visiting.delete(nodeId);
      return false;
    };

    // Check all nodes
    for (const node of this._nodes.values()) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Serializes the graph to a plain object for JSON storage.
   * @returns GraphData representation
   */
  toJSON(): GraphData {
    return {
      nodes: Array.from(this._nodes.values()).map((node) => node.toJSON()),
      edges: Array.from(this._edges.values()).map((edge) => edge.toJSON()),
    };
  }

  /**
   * Creates a new Graph instance from serialized data.
   * @param data - GraphData to reconstruct from
   * @returns A new Graph instance with all nodes and edges
   * @throws NodeAlreadyExistsError if a node id is duplicated
   * @throws EdgeAlreadyExistsError if an edge id is duplicated
   * @throws NodeNotFoundError if an edge references a non-existent node
   */
  static fromJSON(data: GraphData): Graph {
    const graph = new Graph();

    // Add all nodes first with validation
    for (const nodeData of data.nodes) {
      if (graph._nodes.has(nodeData.id)) {
        throw new NodeAlreadyExistsError(nodeData.id);
      }
      const node = new Node(nodeData.type, nodeData.properties, nodeData.id);
      graph._nodes.set(node.id, node);
    }

    // Then add all edges with validation
    for (const edgeData of data.edges) {
      if (graph._edges.has(edgeData.id)) {
        throw new EdgeAlreadyExistsError(edgeData.id);
      }
      if (!graph._nodes.has(edgeData.sourceId)) {
        throw new NodeNotFoundError(edgeData.sourceId);
      }
      if (!graph._nodes.has(edgeData.targetId)) {
        throw new NodeNotFoundError(edgeData.targetId);
      }
      const edge = new Edge(
        edgeData.sourceId,
        edgeData.targetId,
        edgeData.type,
        edgeData.properties,
        edgeData.id
      );
      graph._edges.set(edge.id, edge);
    }

    return graph;
  }
}
