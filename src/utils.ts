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
