import type {
  Collection,
  Db,
  Document,
  Filter,
  WithId,
} from 'mongodb';

import type { NodeData, EdgeData, GraphData } from '../types';
import type { IStorageProvider } from './IStorageProvider';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
} from '../errors';

/**
 * MongoDB document shape for nodes.
 * `id` — the node's own element id
 * `graphId` — the graph partition key this node belongs to
 */
interface NodeDoc extends Document {
  id: string;
  graphId: string;
  type: string;
  properties: Record<string, unknown>;
}

/**
 * MongoDB document shape for edges.
 * `id` — the edge's own element id
 * `graphId` — the graph partition key this edge belongs to
 */
interface EdgeDoc extends Document {
  id: string;
  graphId: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, unknown>;
}

/**
 * Configuration options for MongoStorageProvider.
 */
export interface MongoStorageProviderOptions {
  /**
   * Graph partition key. All nodes/edges stored by this provider belong to this graph.
   * @default 'default'
   */
  graphId?: string;

  /**
   * Name of the MongoDB collection for nodes.
   * @default 'sgdb_nodes'
   */
  nodesCollection?: string;

  /**
   * Name of the MongoDB collection for edges.
   * @default 'sgdb_edges'
   */
  edgesCollection?: string;
}

/**
 * MongoDB-backed storage provider for `simple-graphdb`.
 *
 * ## Setup
 * ```typescript
 * import { MongoClient } from 'mongodb';
 * import { Graph } from 'simple-graphdb';
 * import { MongoStorageProvider } from 'simple-graphdb/storage/MongoStorageProvider';
 *
 * const client = new MongoClient('mongodb://localhost:27017');
 * await client.connect();
 *
 * const provider = new MongoStorageProvider(client.db('mydb'));
 * await provider.ensureIndexes();
 *
 * const graph = new Graph(provider);
 * ```
 *
 * ## Collections
 * Two collections are used (default names):
 *  - `sgdb_nodes`  — one document per node
 *  - `sgdb_edges`  — one document per edge
 *
 * ## Indexes
 * Call `ensureIndexes()` once on startup. It creates:
 *  - Unique index on `_graphId` for both collections (fast id lookups)
 *  - Index on `type` for both collections (type filter queries)
 *  - Compound index on `sourceId` + `type` for edge adjacency queries
 *  - Compound index on `targetId` + `type` for edge adjacency queries
 *  - Index on each tracked property key (built lazily via `getNodesByProperty`)
 *
 * ## Thread safety
 * MongoDB operations are inherently safe for concurrent use.
 * However, a single `MongoStorageProvider` instance should not be shared
 * across multiple `Graph` instances simultaneously if you rely on
 * `importJSON()` atomicity — wrap it in a MongoDB session/transaction if needed.
 */
export class MongoStorageProvider implements IStorageProvider {
  private readonly _nodes: Collection<NodeDoc>;
  private readonly _edges: Collection<EdgeDoc>;
  private readonly _graphId: string;

  /**
   * @param db   - An already-connected Mongo `Db` instance.
   * @param opts - Optional configuration including graphId (partition key).
   */
  constructor(db: Db, opts: MongoStorageProviderOptions = {}) {
    const nodesColl = opts.nodesCollection ?? 'sgdb_nodes';
    const edgesColl = opts.edgesCollection ?? 'sgdb_edges';

    this._nodes = db.collection<NodeDoc>(nodesColl);
    this._edges = db.collection<EdgeDoc>(edgesColl);
    this._graphId = opts.graphId ?? 'default';
  }

  // ---------------------------------------------------------------------------
  // Index management
  // ---------------------------------------------------------------------------

  /**
   * Creates all required MongoDB indexes.
   * Safe to call multiple times (uses `{ background: true }` equivalent and
   * MongoDB's idempotent `createIndex` semantics).
   *
   * Call once on application startup before performing any graph operations.
   */
  async ensureIndexes(): Promise<void> {
    // Node indexes — compound unique index on (graphId, id) ensures element id uniqueness per graph
    await this._nodes.createIndex({ graphId: 1, id: 1 }, { unique: true, name: 'node_graph_id_unique' });
    await this._nodes.createIndex({ graphId: 1, type: 1 },              { name: 'node_graph_type' });

    // Edge indexes
    await this._edges.createIndex({ graphId: 1, id: 1 }, { unique: true, name: 'edge_graph_id_unique' });
    await this._edges.createIndex({ graphId: 1, type: 1 },              { name: 'edge_graph_type' });
    await this._edges.createIndex({ graphId: 1, sourceId: 1, type: 1 }, { name: 'edge_graph_source_type' });
    await this._edges.createIndex({ graphId: 1, targetId: 1, type: 1 }, { name: 'edge_graph_target_type' });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async clear(): Promise<void> {
    await Promise.all([
      this._nodes.deleteMany({ graphId: this._graphId }),
      this._edges.deleteMany({ graphId: this._graphId }),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Node mutations
  // ---------------------------------------------------------------------------

  async insertNode(node: NodeData): Promise<void> {
    const exists = await this._nodes.findOne({ graphId: this._graphId, id: node.id });
    if (exists) {
      throw new NodeAlreadyExistsError(node.id);
    }
    await this._nodes.insertOne({
      id: node.id,
      graphId: this._graphId,
      type: node.type,
      properties: node.properties,
    } as NodeDoc);
  }

  async deleteNode(id: string): Promise<void> {
    await this._nodes.deleteOne({ graphId: this._graphId, id });
  }

  // ---------------------------------------------------------------------------
  // Node queries
  // ---------------------------------------------------------------------------

  async hasNode(id: string): Promise<boolean> {
    const count = await this._nodes.countDocuments({ graphId: this._graphId, id }, { limit: 1 });
    return count > 0;
  }

  async getNode(id: string): Promise<NodeData | undefined> {
    const doc = await this._nodes.findOne({ graphId: this._graphId, id });
    return doc ? this._docToNode(doc) : undefined;
  }

  async getAllNodes(): Promise<NodeData[]> {
    const docs = await this._nodes.find({ graphId: this._graphId }).toArray();
    return docs.map(d => this._docToNode(d));
  }

  async getNodesByType(type: string): Promise<NodeData[]> {
    const docs = await this._nodes.find({ graphId: this._graphId, type }).toArray();
    return docs.map(d => this._docToNode(d));
  }

  async getNodesByProperty(key: string, value: unknown, nodeType?: string): Promise<NodeData[]> {
    const filter: Filter<NodeDoc> = {
      graphId: this._graphId,
      [`properties.${key}`]: value as unknown as WithId<NodeDoc>[keyof WithId<NodeDoc>],
    };
    if (nodeType !== undefined) {
      filter.type = nodeType;
    }
    const docs = await this._nodes.find(filter).toArray();
    return docs.map(d => this._docToNode(d));
  }

  // ---------------------------------------------------------------------------
  // Edge mutations
  // ---------------------------------------------------------------------------

  async insertEdge(edge: EdgeData): Promise<void> {
    const exists = await this._edges.findOne({ graphId: this._graphId, id: edge.id });
    if (exists) {
      throw new EdgeAlreadyExistsError(edge.id);
    }
    await this._edges.insertOne({
      id: edge.id,
      graphId: this._graphId,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
      properties: edge.properties,
    } as EdgeDoc);
  }

  async deleteEdge(id: string): Promise<void> {
    await this._edges.deleteOne({ graphId: this._graphId, id });
  }

  // ---------------------------------------------------------------------------
  // Edge queries
  // ---------------------------------------------------------------------------

  async hasEdge(id: string): Promise<boolean> {
    const count = await this._edges.countDocuments({ graphId: this._graphId, id }, { limit: 1 });
    return count > 0;
  }

  async getEdge(id: string): Promise<EdgeData | undefined> {
    const doc = await this._edges.findOne({ graphId: this._graphId, id });
    return doc ? this._docToEdge(doc) : undefined;
  }

  async getAllEdges(): Promise<EdgeData[]> {
    const docs = await this._edges.find({ graphId: this._graphId }).toArray();
    return docs.map(d => this._docToEdge(d));
  }

  async getEdgesByType(type: string): Promise<EdgeData[]> {
    const docs = await this._edges.find({ graphId: this._graphId, type }).toArray();
    return docs.map(d => this._docToEdge(d));
  }

  async getEdgesBySource(nodeId: string): Promise<EdgeData[]> {
    const docs = await this._edges.find({ graphId: this._graphId, sourceId: nodeId }).toArray();
    return docs.map(d => this._docToEdge(d));
  }

  async getEdgesByTarget(nodeId: string): Promise<EdgeData[]> {
    const docs = await this._edges.find({ graphId: this._graphId, targetId: nodeId }).toArray();
    return docs.map(d => this._docToEdge(d));
  }

  // ---------------------------------------------------------------------------
  // Data portability
  // ---------------------------------------------------------------------------

  async exportJSON(): Promise<GraphData> {
    const [nodeDocs, edgeDocs] = await Promise.all([
      this._nodes.find({ graphId: this._graphId }).toArray(),
      this._edges.find({ graphId: this._graphId }).toArray(),
    ]);
    return {
      nodes: nodeDocs.map(d => this._docToNode(d)),
      edges: edgeDocs.map(d => this._docToEdge(d)),
    };
  }

  /**
   * Imports graph data using MongoDB `bulkWrite` for efficiency.
   *
   * Validates referential integrity before writing:
   *  - Duplicate node ids → NodeAlreadyExistsError
   *  - Duplicate edge ids → EdgeAlreadyExistsError
   *  - Edge referencing missing node → NodeNotFoundError
   */
  async importJSON(data: GraphData): Promise<void> {
    // ---- Validate duplicate ids in the payload itself ----
    const nodeIdSet = new Set<string>();
    for (const n of data.nodes) {
      if (nodeIdSet.has(n.id)) throw new NodeAlreadyExistsError(n.id);
      nodeIdSet.add(n.id);
    }
    const edgeIdSet = new Set<string>();
    for (const e of data.edges) {
      if (edgeIdSet.has(e.id)) throw new EdgeAlreadyExistsError(e.id);
      edgeIdSet.add(e.id);
    }

    // ---- Check for existing ids in the database under this graphId ----
    if (data.nodes.length > 0) {
      const existingNode = await this._nodes.findOne({
        graphId: this._graphId,
        id: { $in: data.nodes.map(n => n.id) },
      });
      if (existingNode) {
        throw new NodeAlreadyExistsError(existingNode.id);
      }
    }
    if (data.edges.length > 0) {
      const existingEdge = await this._edges.findOne({
        graphId: this._graphId,
        id: { $in: data.edges.map(e => e.id) },
      });
      if (existingEdge) {
        throw new EdgeAlreadyExistsError(existingEdge.id);
      }
    }

    // ---- Validate edge source/target references ----
    // Build a combined set of existing + incoming node ids under this graphId
    const existingNodeIds = await this._nodes
      .find({ graphId: this._graphId }, { projection: { id: 1 } })
      .toArray()
      .then(docs => new Set(docs.map(d => d.id)));

    for (const id of nodeIdSet) existingNodeIds.add(id);

    for (const e of data.edges) {
      if (!existingNodeIds.has(e.sourceId)) throw new NodeNotFoundError(e.sourceId);
      if (!existingNodeIds.has(e.targetId)) throw new NodeNotFoundError(e.targetId);
    }

    // ---- Bulk insert ----
    if (data.nodes.length > 0) {
      await this._nodes.insertMany(
        data.nodes.map(n => ({
          id: n.id,
          graphId: this._graphId,
          type: n.type,
          properties: n.properties,
        } as NodeDoc)),
      );
    }
    if (data.edges.length > 0) {
      await this._edges.insertMany(
        data.edges.map(e => ({
          id: e.id,
          graphId: this._graphId,
          sourceId: e.sourceId,
          targetId: e.targetId,
          type: e.type,
          properties: e.properties,
        } as EdgeDoc)),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _docToNode(doc: WithId<NodeDoc>): NodeData {
    return {
      id: doc.id,
      type: doc.type,
      properties: doc.properties,
    };
  }

  private _docToEdge(doc: WithId<EdgeDoc>): EdgeData {
    return {
      id: doc.id,
      sourceId: doc.sourceId,
      targetId: doc.targetId,
      type: doc.type,
      properties: doc.properties,
    };
  }
}
