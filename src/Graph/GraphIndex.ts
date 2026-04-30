import { Node } from '../Node';
import { Edge } from '../Edge';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
  NodeHasEdgesError,
} from '../errors';
import type { IStorageProvider } from '../storage/IStorageProvider';
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider';

/**
 * Internal class that manages graph operations.
 *
 * GraphIndex is the single point of access for all node/edge CRUD.
 * It delegates all persistence and index maintenance to an IStorageProvider,
 * making the backing store swappable (in-memory, SQLite, LMDB, …) without
 * any changes to Graph, GraphTraversal, or GraphAdminOps.
 *
 * The default provider is InMemoryStorageProvider, which preserves the
 * existing in-memory behaviour exactly.
 */
export class GraphIndex {
  private readonly _store: IStorageProvider;

  /**
   * @param store - Storage provider to use. Defaults to InMemoryStorageProvider.
   */
  constructor(store: IStorageProvider = new InMemoryStorageProvider()) {
    this._store = store;
  }

  /** @internal Exposes the underlying storage provider (used by Graph to wire GraphTraversal and GraphAdminOps). */
  _getStore(): IStorageProvider {
    return this._store;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Returns all nodes in the graph. */
  getNodes(): readonly Node[] {
    return this._store.getAllNodes().map(
      d => new Node(d.type, d.properties, d.id)
    );
  }

  /** Returns all edges in the graph. */
  getEdges(): readonly Edge[] {
    return this._store.getAllEdges().map(
      d => new Edge(d.sourceId, d.targetId, d.type, d.properties, d.id)
    );
  }

  /** Checks if a node exists in the graph. */
  hasNode(id: string): boolean {
    return this._store.hasNode(id);
  }

  /** Checks if an edge exists in the graph. */
  hasEdge(id: string): boolean {
    return this._store.hasEdge(id);
  }

  /**
   * Adds a new node to the graph.
   * @throws NodeAlreadyExistsError if a node with this id already exists
   */
  addNode(type: string, properties: Record<string, unknown> = {}): Node {
    const node = new Node(type, properties);
    if (this._store.hasNode(node.id)) {
      throw new NodeAlreadyExistsError(node.id);
    }
    this._store.insertNode(node.toJSON());
    return node;
  }

  /**
   * Removes a node from the graph.
   * @param cascade - If true, also removes all incident edges (default: false)
   * @throws NodeHasEdgesError if cascade is false and the node has incident edges
   */
  removeNode(id: string, cascade: boolean = false): boolean {
    if (!this._store.hasNode(id)) return false;

    const outgoing = this._store.getEdgesBySource(id);
    const incoming = this._store.getEdgesByTarget(id);

    if (cascade) {
      for (const edge of [...outgoing, ...incoming]) {
        this._store.deleteEdge(edge.id);
      }
    } else {
      const incidentCount = outgoing.length + incoming.length;
      if (incidentCount > 0) {
        throw new NodeHasEdgesError(id, incidentCount);
      }
    }

    this._store.deleteNode(id);
    return true;
  }

  /** Retrieves a node by id. */
  getNode(id: string): Node | undefined {
    const data = this._store.getNode(id);
    if (!data) return undefined;
    return new Node(data.type, data.properties, data.id);
  }

  /** Retrieves nodes by their type. */
  getNodesByType(type: string): Node[] {
    return this._store.getNodesByType(type).map(
      d => new Node(d.type, d.properties, d.id)
    );
  }

  /**
   * Retrieves nodes by a property value.
   * @param options - Optional options with nodeType filter
   */
  getNodesByProperty(key: string, value: unknown, options?: { nodeType?: string }): Node[] {
    return this._store.getNodesByProperty(key, value, options?.nodeType).map(
      d => new Node(d.type, d.properties, d.id)
    );
  }

  /**
   * Adds a new directed edge to the graph.
   * @throws NodeNotFoundError if source or target node doesn't exist
   * @throws EdgeAlreadyExistsError if an edge with this id already exists
   */
  addEdge(
    sourceId: string,
    targetId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): Edge {
    if (!this._store.hasNode(sourceId)) throw new NodeNotFoundError(sourceId);
    if (!this._store.hasNode(targetId)) throw new NodeNotFoundError(targetId);

    const edge = new Edge(sourceId, targetId, type, properties);
    if (this._store.hasEdge(edge.id)) throw new EdgeAlreadyExistsError(edge.id);

    this._store.insertEdge(edge.toJSON());
    return edge;
  }

  /**
   * Removes an edge from the graph.
   * @returns true if removed, false if not found
   */
  removeEdge(id: string): boolean {
    if (!this._store.hasEdge(id)) return false;
    this._store.deleteEdge(id);
    return true;
  }

  /** Retrieves an edge by id. */
  getEdge(id: string): Edge | undefined {
    const data = this._store.getEdge(id);
    if (!data) return undefined;
    return new Edge(data.sourceId, data.targetId, data.type, data.properties, data.id);
  }

  /**
   * Gets the parent nodes of a given node (nodes with edges pointing TO this node).
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getParents(nodeId: string, options?: { nodeType?: string; edgeType?: string }): Node[] {
    if (!this._store.hasNode(nodeId)) throw new NodeNotFoundError(nodeId);

    const nodeType = options?.nodeType ?? '*';
    const edgeType = options?.edgeType ?? '*';
    const parentIds = new Set<string>();

    for (const edge of this._store.getEdgesByTarget(nodeId)) {
      if (edgeType !== '*' && edge.type !== edgeType) continue;
      const sourceData = this._store.getNode(edge.sourceId);
      if (!sourceData) continue;
      if (nodeType !== '*' && sourceData.type !== nodeType) continue;
      parentIds.add(edge.sourceId);
    }

    return Array.from(parentIds)
      .map(id => this._store.getNode(id))
      .filter((d): d is NonNullable<typeof d> => d !== undefined)
      .map(d => new Node(d.type, d.properties, d.id));
  }

  /**
   * Gets the child nodes of a given node (nodes this node points TO).
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getChildren(nodeId: string, options?: { nodeType?: string; edgeType?: string }): Node[] {
    if (!this._store.hasNode(nodeId)) throw new NodeNotFoundError(nodeId);

    const nodeType = options?.nodeType ?? '*';
    const edgeType = options?.edgeType ?? '*';
    const childIds = new Set<string>();

    for (const edge of this._store.getEdgesBySource(nodeId)) {
      if (edgeType !== '*' && edge.type !== edgeType) continue;
      const targetData = this._store.getNode(edge.targetId);
      if (!targetData) continue;
      if (nodeType !== '*' && targetData.type !== nodeType) continue;
      childIds.add(edge.targetId);
    }

    return Array.from(childIds)
      .map(id => this._store.getNode(id))
      .filter((d): d is NonNullable<typeof d> => d !== undefined)
      .map(d => new Node(d.type, d.properties, d.id));
  }

  /**
   * Gets all outgoing edges from a node.
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesFrom(sourceId: string, options?: { edgeType?: string }): Edge[] {
    if (!this._store.hasNode(sourceId)) throw new NodeNotFoundError(sourceId);

    const edgeType = options?.edgeType ?? '*';
    return this._store.getEdgesBySource(sourceId)
      .filter(e => edgeType === '*' || e.type === edgeType)
      .map(d => new Edge(d.sourceId, d.targetId, d.type, d.properties, d.id));
  }

  /**
   * Gets all incoming edges to a node.
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesTo(targetId: string, options?: { edgeType?: string }): Edge[] {
    if (!this._store.hasNode(targetId)) throw new NodeNotFoundError(targetId);

    const edgeType = options?.edgeType ?? '*';
    return this._store.getEdgesByTarget(targetId)
      .filter(e => edgeType === '*' || e.type === edgeType)
      .map(d => new Edge(d.sourceId, d.targetId, d.type, d.properties, d.id));
  }

  /**
   * Gets all direct edges between two nodes (in either direction).
   * @throws NodeNotFoundError if either node doesn't exist
   */
  getDirectEdgesBetween(sourceId: string, targetId: string, options?: { edgeType?: string }): Edge[] {
    if (!this._store.hasNode(sourceId)) throw new NodeNotFoundError(sourceId);
    if (!this._store.hasNode(targetId)) throw new NodeNotFoundError(targetId);

    const edgeType = options?.edgeType ?? '*';
    const result: Edge[] = [];

    for (const e of this._store.getEdgesBySource(sourceId)) {
      if (e.targetId === targetId && (edgeType === '*' || e.type === edgeType)) {
        result.push(new Edge(e.sourceId, e.targetId, e.type, e.properties, e.id));
      }
    }
    for (const e of this._store.getEdgesBySource(targetId)) {
      if (e.targetId === sourceId && (edgeType === '*' || e.type === edgeType)) {
        result.push(new Edge(e.sourceId, e.targetId, e.type, e.properties, e.id));
      }
    }

    return result;
  }

  /** Gets all edges of a specific type. */
  getEdgesByType(type: string): Edge[] {
    return this._store.getEdgesByType(type).map(
      d => new Edge(d.sourceId, d.targetId, d.type, d.properties, d.id)
    );
  }

  /** Clears all data and indices. */
  clear(): void {
    this._store.clear();
  }
}
