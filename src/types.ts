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
 * Data transfer object for Graph serialization
 */
export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}
