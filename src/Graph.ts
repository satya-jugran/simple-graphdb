import type { GraphData } from './types';
import { Node } from './Node';
import { Edge } from './Edge';
import { GraphIndex } from './Graph/GraphIndex';
import { GraphTraversal } from './Graph/GraphTraversal';
import { GraphSerializer } from './Graph/GraphSerializer';
import type { TraversalOptions } from './Graph/TraversalOptions';

// Re-export for external use
export type { TraversalOptions } from './Graph/TraversalOptions';

/**
 * An in-memory graph database with basic features.
 * Manages nodes and directed edges with arbitrary JSON properties.
 * Uses adjacency maps and type indexes for O(1) lookups.
 */
export class Graph {
  private readonly _index: GraphIndex;
  private readonly _traversal: GraphTraversal;
  private readonly _serializer: GraphSerializer;

  constructor() {
    this._index = new GraphIndex();
    this._traversal = new GraphTraversal(this._index);
    this._serializer = new GraphSerializer(this._index, this._traversal);
  }

  /**
   * Returns all nodes in the graph.
   */
  getNodes(): readonly Node[] {
    return this._index.getNodes();
  }

  /**
   * Returns all edges in the graph.
   */
  getEdges(): readonly Edge[] {
    return this._index.getEdges();
  }

  /**
   * Checks if a node exists in the graph.
   * @param id - Id of the node
   */
  hasNode(id: string): boolean {
    return this._index.hasNode(id);
  }

  /**
   * Checks if an edge exists in the graph.
   * @param id - Id of the edge
   */
  hasEdge(id: string): boolean {
    return this._index.hasEdge(id);
  }

  /**
   * Adds a new node to the graph.
   * @param type - The type (label) of the node
   * @param properties - Optional JSON properties
   * @returns The newly created Node
   */
  addNode(type: string, properties: Record<string, unknown> = {}): Node {
    return this._index.addNode(type, properties);
  }

  /**
   * Removes a node from the graph.
   * @param id - Id of the node to remove
   * @param cascade - If true, also removes all incident edges (default: false)
   * @returns true if the node was removed, false if it didn't exist
   */
  removeNode(id: string, cascade: boolean = false): boolean {
    return this._index.removeNode(id, cascade);
  }

  /**
   * Retrieves a node by id.
   * @param id - Id of the node
   * @returns The Node if found, undefined otherwise
   */
  getNode(id: string): Node | undefined {
    return this._index.getNode(id);
  }

  /**
   * Retrieves nodes by their type.
   * @param type - The node type to filter by
   * @returns Array of Nodes with the specified type
   */
  getNodesByType(type: string): Node[] {
    return this._index.getNodesByType(type);
  }

  /**
   * Retrieves nodes by a property value.
   * @param key - The property key to search
   * @param value - The property value to match
   * @param options - Optional options with nodeType filter
   * @returns Array of Nodes with the specified property value
   */
  getNodesByProperty(key: string, value: unknown, options?: { nodeType?: string }): Node[] {
    return this._index.getNodesByProperty(key, value, options);
  }

  /**
   * Adds a new directed edge to the graph.
   * @param sourceId - Id of the source node
   * @param targetId - Id of the target node
   * @param type - The relationship type
   * @param properties - Optional JSON properties
   * @returns The newly created Edge
   */
  addEdge(
    sourceId: string,
    targetId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): Edge {
    return this._index.addEdge(sourceId, targetId, type, properties);
  }

  /**
   * Removes an edge from the graph.
   * @param id - Id of the edge to remove
   * @returns true if the edge was removed, false if it didn't exist
   */
  removeEdge(id: string): boolean {
    return this._index.removeEdge(id);
  }

  /**
   * Retrieves an edge by id.
   * @param id - Id of the edge
   * @returns The Edge if found, undefined otherwise
   */
  getEdge(id: string): Edge | undefined {
    return this._index.getEdge(id);
  }

  /**
   * Gets the parent nodes of a given node.
   * Parents are nodes that have edges pointing TO this node.
   * @param nodeId - Id of the target node
   * @param options - Optional traversal options with nodeType and edgeType filters
   * @returns Array of parent Nodes
   */
  getParents(nodeId: string, options?: { nodeType?: string; edgeType?: string }): Node[] {
    return this._index.getParents(nodeId, options);
  }

  /**
   * Gets the child nodes of a given node.
   * Children are nodes that this node points TO.
   * @param nodeId - Id of the source node
   * @param options - Optional traversal options with nodeType and edgeType filters
   * @returns Array of child Nodes
   */
  getChildren(nodeId: string, options?: { nodeType?: string; edgeType?: string }): Node[] {
    return this._index.getChildren(nodeId, options);
  }

  /**
   * Gets all edges originating from a node (outgoing edges).
   * @param sourceId - Id of the source node
   * @param options - Optional traversal options with edgeType filter
   * @returns Array of outgoing Edges
   */
  getEdgesFrom(sourceId: string, options?: { edgeType?: string }): Edge[] {
    return this._index.getEdgesFrom(sourceId, options);
  }

  /**
   * Gets all edges pointing to a node (incoming edges).
   * @param targetId - Id of the target node
   * @param options - Optional traversal options with edgeType filter
   * @returns Array of incoming Edges
   */
  getEdgesTo(targetId: string, options?: { edgeType?: string }): Edge[] {
    return this._index.getEdgesTo(targetId, options);
  }

  /**
   * Gets all direct edges between two nodes (in either direction).
   * Only returns edges where the two nodes are directly connected.
   * @param sourceId - Id of the first node
   * @param targetId - Id of the second node
   * @param options - Optional traversal options with edgeType filter
   * @returns Array of Edges between the nodes
   */
  getDirectEdgesBetween(sourceId: string, targetId: string, options?: { edgeType?: string }): Edge[] {
    return this._index.getDirectEdgesBetween(sourceId, targetId, options);
  }

  /**
   * Gets all edges of a specific type.
   * @param type - The edge type to filter by
   * @returns Array of Edges with the specified type
   */
  getEdgesByType(type: string): Edge[] {
    return this._index.getEdgesByType(type);
  }

  /**
   * Traverses the graph from source to target using the specified algorithm.
   * @param sourceId - Id of the source node
   * @param targetId - Id of the target node
   * @param options - Traversal options including method, nodeType, and edgeType filters
   * @returns Array of node ids from source to target if path exists, null otherwise
   */
  traverse(
    sourceId: string,
    targetId: string,
    options: TraversalOptions = {}
  ): string[] | null {
    return this._traversal.traverse(sourceId, targetId, options);
  }

  /**
   * Check if graph is a Directed Acyclic Graph (no cycles).
   * @returns true if the graph has no cycles, false otherwise
   */
  isDAG(): boolean {
    return this._traversal.isDAG();
  }

  /**
   * Computes a topological ordering of the graph nodes using Kahn's algorithm.
   * Returns null if the graph is not a DAG (contains cycles).
   * @returns Array of node ids in topological order, or null if graph has cycles
   */
  topologicalSort(): string[] | null {
    return this._traversal.topologicalSort();
  }

  /**
   * Removes all nodes and edges from the graph.
   */
  clear(): void {
    this._index.clear();
  }

  /**
   * Serializes the graph to a plain object for JSON storage.
   * @returns GraphData representation
   */
  toJSON(): GraphData {
    return this._serializer.toJSON();
  }

  /**
   * Creates a new Graph instance from serialized data.
   * @param data - GraphData to reconstruct from
   * @returns A new Graph instance with all nodes and edges
   */
  static fromJSON(data: GraphData): Graph {
    const graph = new Graph();
    graph._serializer.fromJSON(data);
    return graph;
  }
}
