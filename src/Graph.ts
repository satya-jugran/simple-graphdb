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
   * @param name - Name of the node
   */
  hasNode(name: string): boolean {
    return this._nodes.has(name);
  }

  /**
   * Checks if an edge exists in the graph.
   * @param name - Name of the edge
   */
  hasEdge(name: string): boolean {
    return this._edges.has(name);
  }

  /**
   * Adds a new node to the graph.
   * @param name - Unique name for the node
   * @param properties - Optional JSON properties
   * @returns The newly created Node
   * @throws NodeAlreadyExistsError if a node with this name already exists
   */
  addNode(name: string, properties: Record<string, unknown> = {}): Node {
    if (this._nodes.has(name)) {
      throw new NodeAlreadyExistsError(name);
    }
    const node = new Node(name, properties);
    this._nodes.set(name, node);
    return node;
  }

  /**
   * Removes a node from the graph.
   * @param name - Name of the node to remove
   * @param cascade - If true, also removes all incident edges (default: false)
   * @returns true if the node was removed, false if it didn't exist
   */
  removeNode(name: string, cascade: boolean = false): boolean {
    const node = this._nodes.get(name);
    if (!node) {
      return false;
    }

    if (cascade) {
      // Remove all edges incident to this node
      const edgesToRemove = Array.from(this._edges.values()).filter(
        (edge) => edge.sourceName === name || edge.targetName === name
      );
      for (const edge of edgesToRemove) {
        this._edges.delete(edge.name);
      }
    }

    this._nodes.delete(name);
    return true;
  }

  /**
   * Retrieves a node by name.
   * @param name - Name of the node
   * @returns The Node if found, undefined otherwise
   */
  getNode(name: string): Node | undefined {
    return this._nodes.get(name);
  }

  /**
   * Adds a new directed edge to the graph.
   * @param name - Unique name for the edge
   * @param sourceName - Name of the source node
   * @param targetName - Name of the target node
   * @param properties - Optional JSON properties
   * @returns The newly created Edge
   * @throws NodeNotFoundError if source or target node doesn't exist
   * @throws EdgeAlreadyExistsError if an edge with this name already exists
   */
  addEdge(
    name: string,
    sourceName: string,
    targetName: string,
    properties: Record<string, unknown> = {}
  ): Edge {
    if (!this._nodes.has(sourceName)) {
      throw new NodeNotFoundError(sourceName);
    }
    if (!this._nodes.has(targetName)) {
      throw new NodeNotFoundError(targetName);
    }
    if (this._edges.has(name)) {
      throw new EdgeAlreadyExistsError(name);
    }

    const edge = new Edge(name, sourceName, targetName, properties);
    this._edges.set(name, edge);
    return edge;
  }

  /**
   * Removes an edge from the graph.
   * @param name - Name of the edge to remove
   * @returns true if the edge was removed, false if it didn't exist
   */
  removeEdge(name: string): boolean {
    return this._edges.delete(name);
  }

  /**
   * Retrieves an edge by name.
   * @param name - Name of the edge
   * @returns The Edge if found, undefined otherwise
   */
  getEdge(name: string): Edge | undefined {
    return this._edges.get(name);
  }

  /**
   * Gets the parent nodes of a given node.
   * Parents are nodes that have edges pointing TO this node.
   * @param nodeName - Name of the target node
   * @returns Array of parent Nodes
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getParents(nodeName: string): Node[] {
    if (!this._nodes.has(nodeName)) {
      throw new NodeNotFoundError(nodeName);
    }

    const parentNames = new Set<string>();
    for (const edge of this._edges.values()) {
      if (edge.targetName === nodeName) {
        parentNames.add(edge.sourceName);
      }
    }

    return Array.from(parentNames)
      .map((name) => this._nodes.get(name)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Gets the child nodes of a given node.
   * Children are nodes that this node points TO.
   * @param nodeName - Name of the source node
   * @returns Array of child Nodes
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getChildren(nodeName: string): Node[] {
    if (!this._nodes.has(nodeName)) {
      throw new NodeNotFoundError(nodeName);
    }

    const childNames = new Set<string>();
    for (const edge of this._edges.values()) {
      if (edge.sourceName === nodeName) {
        childNames.add(edge.targetName);
      }
    }

    return Array.from(childNames)
      .map((name) => this._nodes.get(name)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Gets all edges originating from a node (outgoing edges).
   * @param sourceName - Name of the source node
   * @returns Array of outgoing Edges
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesFrom(sourceName: string): Edge[] {
    if (!this._nodes.has(sourceName)) {
      throw new NodeNotFoundError(sourceName);
    }

    return Array.from(this._edges.values()).filter(
      (edge) => edge.sourceName === sourceName
    );
  }

  /**
   * Gets all edges pointing to a node (incoming edges).
   * @param targetName - Name of the target node
   * @returns Array of incoming Edges
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesTo(targetName: string): Edge[] {
    if (!this._nodes.has(targetName)) {
      throw new NodeNotFoundError(targetName);
    }

    return Array.from(this._edges.values()).filter(
      (edge) => edge.targetName === targetName
    );
  }

  /**
   * Gets all edges between two nodes (in either direction).
   * @param sourceName - Name of the first node
   * @param targetName - Name of the second node
   * @returns Array of Edges between the nodes
   * @throws NodeNotFoundError if either node doesn't exist
   */
  getEdgesBetween(sourceName: string, targetName: string): Edge[] {
    if (!this._nodes.has(sourceName)) {
      throw new NodeNotFoundError(sourceName);
    }
    if (!this._nodes.has(targetName)) {
      throw new NodeNotFoundError(targetName);
    }
    return Array.from(this._edges.values()).filter(
      (edge) =>
        (edge.sourceName === sourceName && edge.targetName === targetName) ||
        (edge.sourceName === targetName && edge.targetName === sourceName)
    );
  }

  /**
   * Removes all nodes and edges from the graph.
   */
  clear(): void {
    this._nodes.clear();
    this._edges.clear();
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
   */
  static fromJSON(data: GraphData): Graph {
    const graph = new Graph();

    // Add all nodes first
    for (const nodeData of data.nodes) {
      graph.addNode(nodeData.name, nodeData.properties);
    }

    // Then add all edges (nodes must exist first)
    for (const edgeData of data.edges) {
      graph.addEdge(
        edgeData.name,
        edgeData.sourceName,
        edgeData.targetName,
        edgeData.properties
      );
    }

    return graph;
  }
}
