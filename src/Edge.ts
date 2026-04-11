import type { EdgeData } from './types';

/**
 * Represents a directed edge in the graph database.
 * Edges are identified by a unique name and connect two existing nodes.
 */
export class Edge {
  private readonly _name: string;
  private readonly _sourceName: string;
  private readonly _targetName: string;
  private readonly _properties: Readonly<Record<string, unknown>>;

  /**
   * Creates a new Edge instance.
   * @param name - Unique identifier for the edge
   * @param sourceName - Name of the source node
   * @param targetName - Name of the target node
   * @param properties - Optional arbitrary JSON properties
   */
  constructor(
    name: string,
    sourceName: string,
    targetName: string,
    properties: Record<string, unknown> = {}
  ) {
    this._name = name;
    this._sourceName = sourceName;
    this._targetName = targetName;
    this._properties = Object.freeze({ ...properties });
  }

  /**
   * Returns the unique name of this edge.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Returns the name of the source node.
   */
  get sourceName(): string {
    return this._sourceName;
  }

  /**
   * Returns the name of the target node.
   */
  get targetName(): string {
    return this._targetName;
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
      name: this._name,
      sourceName: this._sourceName,
      targetName: this._targetName,
      properties: { ...this._properties },
    };
  }
}
