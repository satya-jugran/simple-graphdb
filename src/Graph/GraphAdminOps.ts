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
 *  - `SQLiteStorageProvider`    — paged cursor reads / batched transactions
 *  - `LmdbStorageProvider`      — range-scan cursor with commit batches
 *  - `MongoStorageProvider`     — aggregation pipeline / bulkWrite
 *
 * Future providers implement `IStorageProvider.exportJSON()` and
 * `IStorageProvider.importJSON()` according to their own optimal strategy.
 */
export class GraphAdminOps {
  constructor(private readonly _store: IStorageProvider) {}

  /**
   * Exports the entire graph as a portable JSON object.
   * Delegates to the active provider's `exportJSON()` implementation.
   *
   * @returns GraphData snapshot of the current graph state
   */
  exportJSON(): GraphData {
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
  importJSON(data: GraphData): void {
    this._store.importJSON(data);
  }
}
