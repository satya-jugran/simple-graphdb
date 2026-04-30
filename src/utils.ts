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
