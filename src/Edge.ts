import type { EdgeData } from './types';

/**
 * Represents a directed edge (relationship) in the graph database.
 * Edges connect two nodes and have a type (relationship type).
 */
export class Edge {
  private readonly _id: string;
  private readonly _sourceId: string;
  private readonly _targetId: string;
  private readonly _type: string;
  private readonly _properties: Readonly<Record<string, unknown>>;

  /**
   * Creates a new Edge instance.
   * @param sourceId - The id of the source node
   * @param targetId - The id of the target node
   * @param type - The relationship type (e.g., "CONTAINS", "AUTHOR_OF")
   * @param properties - Optional arbitrary JSON properties
   * @param id - Optional id. If not provided, a UUID will be generated.
   */
  constructor(
    sourceId: string,
    targetId: string,
    type: string,
    properties: Record<string, unknown> = {},
    id?: string
  ) {
    this._id = id ?? crypto.randomUUID();
    this._sourceId = sourceId;
    this._targetId = targetId;
    this._type = type;
    this._properties = Object.freeze({ ...properties });
  }

  /**
   * Returns the unique id of this edge.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Returns the id of the source node.
   */
  get sourceId(): string {
    return this._sourceId;
  }

  /**
   * Returns the id of the target node.
   */
  get targetId(): string {
    return this._targetId;
  }

  /**
   * Returns the type (relationship type) of this edge.
   */
  get type(): string {
    return this._type;
  }

  /**
   * Returns a read-only copy of this edge's properties.
   */
  get properties(): Readonly<Record<string, unknown>> {
    return this._properties;
  }

  /**
   * Serializes this edge to a plain object for JSON storage.
   * @returns EdgeData representation
   */
  toJSON(): EdgeData {
    return {
      id: this._id,
      sourceId: this._sourceId,
      targetId: this._targetId,
      type: this._type,
      properties: { ...this._properties },
    };
  }
}
