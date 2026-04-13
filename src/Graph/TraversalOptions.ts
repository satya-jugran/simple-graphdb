/**
 * Traversal options for graph traversal methods.
 */
export interface TraversalOptions {
  /** Traversal method: 'bfs' (breadth-first search) or 'dfs' (depth-first search). Default: 'bfs' */
  method?: 'bfs' | 'dfs';
  /** Node type filter - only traverse through nodes of this type. Use '*' for all types (default) */
  nodeType?: string;
  /** Edge type filter - only follow edges of this type. Use '*' for all types (default) */
  edgeType?: string;
}
