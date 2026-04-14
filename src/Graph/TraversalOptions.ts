/**
 * Traversal options for graph traversal methods.
 */
export interface TraversalOptions {
  /** Traversal method: 'bfs' (breadth-first search) or 'dfs' (depth-first search). Default: 'bfs' */
  method?: 'bfs' | 'dfs';
  /** Node type filter - only traverse through nodes of these types. Use '*' for all types (default: ['*']) */
  nodeTypes?: string[];
  /** Edge type filter - only follow edges of these types. Use '*' for all types (default: ['*']) */
  edgeTypes?: string[];
}
