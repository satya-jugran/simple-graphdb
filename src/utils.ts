/**
 * Returns a deep clone of a value.
 * Uses the native `structuredClone` API when available (Node 17+, modern
 * browsers) and falls back to a JSON round-trip for older runtimes.
 * Graph node/edge properties must be JSON-serialisable by contract, so the
 * fallback is always safe for NodeData / EdgeData objects.
 * @param obj - The value to clone
 * @returns A structurally identical but fully independent copy
 */
export function deepClone<T>(obj: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Recursively freezes an object and all nested plain-object/array values.
 * Primitives and already-frozen values are returned as-is.
 * @param obj - The object to deep-freeze
 * @returns The same object, fully frozen
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj;
  }

  // Freeze nested values first (depth-first)
  for (const value of Object.values(obj as object)) {
    deepFreeze(value);
  }

  return Object.freeze(obj);
}

/**
 * Checks if a value is a supported primitive property type
  * (string, number, boolean, null, undefined).
  * Excludes `bigint` and `symbol`, which are primitive in JavaScript but are
  * not supported by the current JSON-based storage/indexing implementation.
  * @param value - The value to check
  * @returns true if the value is a supported primitive property type
 */
export function isPrimitive(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  const type = typeof value;
  return type === 'string' || type === 'number' || type === 'boolean';
}

/**
 * Validates that all property values in a record are supported primitive types.
 * This enforces a flat structure for efficient indexing.
 * @param properties - The properties record to validate
 * @returns true if all values are supported primitives
 */
export function isFlatRecord(properties: Record<string, unknown>): boolean {
  return Object.values(properties).every(value => isPrimitive(value));
}
