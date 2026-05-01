import type { NodeData, EdgeData, GraphData } from '../types';

/**
 * Contract that every storage backend must fulfill.
 *
 * All methods are async (v5.0+) to support both synchronous in-memory providers
 * and asynchronous network-based providers (MongoDB, PostgreSQL, etc.) through
 * a single unified API.
 *
 * Index responsibilities:
 *  - Type index  (node/edge type → id set)
 *  - Property value index (key → value → node id set)
 *  - Adjacency index (nodeId → outgoing/incoming edge id sets)
 *
 * Each implementation owns its index maintenance internally;
 * callers (GraphIndex) only call the query / mutation methods below.
 *
 * Data portability:
 *  - exportJSON() / importJSON() are part of the provider contract so that
 *    each backend can implement the most efficient strategy for its storage
 *    model (e.g. full iteration for in-memory, bulkWrite for MongoDB).
 */
export interface IStorageProvider {
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Remove all stored nodes, edges, and index data.
   */
  clear(): Promise<void>;

  // ---------------------------------------------------------------------------
  // Node mutations
  // ---------------------------------------------------------------------------

  /**
   * Persist a node.  The node is identified by `node.id`.
   * Must update: node store, type index, property value index.
   */
  insertNode(node: NodeData): Promise<void>;

  /**
   * Remove a node by id.
   * Must update: node store, type index, property value index.
   * Does NOT touch edges — the caller (GraphIndex) handles cascade logic.
   */
  deleteNode(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Node queries
  // ---------------------------------------------------------------------------

  /** Returns true if a node with the given id exists. */
  hasNode(id: string): Promise<boolean>;

  /** Returns the NodeData for the given id, or undefined if not found. */
  getNode(id: string): Promise<NodeData | undefined>;

  /** Returns all stored nodes. */
  getAllNodes(): Promise<NodeData[]>;

  /**
   * Returns all nodes whose `type` field matches the given value.
   * Implementations must use an index (not a full scan).
   */
  getNodesByType(type: string): Promise<NodeData[]>;

  /**
   * Returns all nodes that have a property `key` equal to `value`.
   * Optionally filtered to a specific node type.
   * Implementations must use an index (not a full scan).
   */
  getNodesByProperty(key: string, value: unknown, nodeType?: string): Promise<NodeData[]>;

  // ---------------------------------------------------------------------------
  // Edge mutations
  // ---------------------------------------------------------------------------

  /**
   * Persist an edge.  The edge is identified by `edge.id`.
   * Must update: edge store, edge-type index, adjacency indexes (source + target).
   */
  insertEdge(edge: EdgeData): Promise<void>;

  /**
   * Remove an edge by id.
   * Must update: edge store, edge-type index, adjacency indexes (source + target).
   */
  deleteEdge(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Edge queries
  // ---------------------------------------------------------------------------

  /** Returns true if an edge with the given id exists. */
  hasEdge(id: string): Promise<boolean>;

  /** Returns the EdgeData for the given id, or undefined if not found. */
  getEdge(id: string): Promise<EdgeData | undefined>;

  /** Returns all stored edges. */
  getAllEdges(): Promise<EdgeData[]>;

  /**
   * Returns all edges whose `type` field matches the given value.
   * Implementations must use an index (not a full scan).
   */
  getEdgesByType(type: string): Promise<EdgeData[]>;

  /**
   * Returns all edges whose `sourceId` equals the given node id.
   * Implementations must use an adjacency index (not a full scan).
   */
  getEdgesBySource(nodeId: string): Promise<EdgeData[]>;

  /**
   * Returns all edges whose `targetId` equals the given node id.
   * Implementations must use an adjacency index (not a full scan).
   */
  getEdgesByTarget(nodeId: string): Promise<EdgeData[]>;

  // ---------------------------------------------------------------------------
  // Data portability
  // ---------------------------------------------------------------------------

  /**
   * Exports the entire graph as a portable JSON object.
   *
   * Implementations choose the most efficient strategy for their backing store:
   *  - InMemory: single full iteration over node/edge maps
   *  - MongoDB: aggregation pipeline
   *
   * @returns GraphData snapshot of the current graph state
   */
  exportJSON(): Promise<GraphData>;

  /**
   * Imports graph data from a portable JSON object into the backing store.
   *
   * Implementations choose the most efficient strategy:
   *  - InMemory: single pass insert
   *  - MongoDB: bulkWrite operations
   *
   * The implementation is responsible for referential integrity validation
   * (duplicate ids, missing source/target nodes for edges).
   *
   * @param data - GraphData to load
   * @throws NodeAlreadyExistsError if a node id is already present
   * @throws EdgeAlreadyExistsError if an edge id is already present
   * @throws NodeNotFoundError if an edge references a non-existent node
   */
  importJSON(data: GraphData): Promise<void>;
}
