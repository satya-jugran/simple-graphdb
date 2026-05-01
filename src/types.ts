/**
 * Data transfer object for Node serialization
 */
export interface NodeData {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

/**
 * Data transfer object for Edge serialization
 */
export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, unknown>;
}

/**
 * Data transfer object for Graph serialization.
 * Optionally carries the graph partition key when round-tripping through a
 * partitioned storage provider.
 */
export interface GraphData {
  /**
   * Graph partition key. Populated by exportJSON when the source provider has a
   * non-default graphId. Used as context by importJSON.
   */
  graphId?: string;
  nodes: NodeData[];
  edges: EdgeData[];
}
