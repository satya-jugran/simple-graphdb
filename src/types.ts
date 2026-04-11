/**
 * Data transfer object for Node serialization
 */
export interface NodeData {
  name: string;
  properties: Record<string, unknown>;
}

/**
 * Data transfer object for Edge serialization
 */
export interface EdgeData {
  name: string;
  sourceName: string;
  targetName: string;
  properties: Record<string, unknown>;
}

/**
 * Data transfer object for Graph serialization
 */
export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}
