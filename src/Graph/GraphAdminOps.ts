import type { GraphData } from '../types';
import type { IStorageProvider } from '../storage/IStorageProvider';

/**
 * Internal orchestrator for graph data administration operations.
 *
 * `GraphAdminOps` is intentionally thin — it holds a reference to the active
 * `IStorageProvider` and delegates every operation to it.  This means the
 * actual import/export logic lives inside each provider:
 *
 *  - `InMemoryStorageProvider`  — single-pass full iteration (O(n + e))
 *  - `MongoStorageProvider`     — aggregation pipeline / bulkWrite
 *
 * All methods are async to support both synchronous in-memory providers
 * and asynchronous network-based providers through a unified API.
 */
export class GraphAdminOps {
  constructor(private readonly _store: IStorageProvider) {}

  /**
   * Exports the entire graph as a portable JSON object.
   * Delegates to the active provider's `exportJSON()` implementation.
   *
   * @returns GraphData snapshot of the current graph state
   */
  async exportJSON(): Promise<GraphData> {
    return this._store.exportJSON();
  }

  /**
   * Imports graph data from a portable JSON object into the backing store.
   * Delegates to the active provider's `importJSON()` implementation.
   *
   * @param data - GraphData to load
   * @throws NodeAlreadyExistsError if a node id is already present
   * @throws EdgeAlreadyExistsError if an edge id is already present
   * @throws NodeNotFoundError if an edge references a non-existent node
   */
  async importJSON(data: GraphData): Promise<void> {
    return this._store.importJSON(data);
  }
}
