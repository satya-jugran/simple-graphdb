import type { NodeData } from './types';

/**
 * Represents a node in the graph database.
 * Nodes are identified by a unique name and can store arbitrary JSON properties.
 */
export class Node {
  private readonly _name: string;
  private readonly _properties: Readonly<Record<string, unknown>>;

  /**
   * Creates a new Node instance.
   * @param name - Unique identifier for the node
   * @param properties - Optional arbitrary JSON properties
   */
  constructor(name: string, properties: Record<string, unknown> = {}) {
    this._name = name;
    this._properties = Object.freeze({ ...properties });
  }

  /**
   * Returns the unique name of this node.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Returns a read-only copy of this node's properties.
   */
  get properties(): Readonly<Record<string, unknown>> {
    return this._properties;
  }

  /**
   * Serializes this node to a plain object for JSON storage.
   * @returns NodeData representation
   */
  toJSON(): NodeData {
    return {
      name: this._name,
      properties: { ...this._properties },
    };
  }
}
