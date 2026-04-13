import { GraphIndex } from './GraphIndex';
import type { TraversalOptions } from './TraversalOptions';

/**
 * Internal class that handles graph traversal operations.
 * Provides path finding, cycle detection, and topological sorting.
 */
export class GraphTraversal {
  constructor(private _index: GraphIndex) {}

  /**
   * Gets traversable children for a given node during type-filtered traversal.
   * @param nodeId - The source node id
   * @param nodeType - Filter for node types ('*' for all)
   * @param edgeType - Filter for edge types ('*' for all)
   * @returns Array of child node ids that pass the type filters
   */
  _getTraversableChildren(nodeId: string, nodeType: string = '*', edgeType: string = '*'): string[] {
    const edgeIds = this._index._edgesBySource.get(nodeId);
    if (!edgeIds) {
      return [];
    }

    const children: string[] = [];

    for (const edgeId of edgeIds) {
      const edge = this._index._edges.get(edgeId);
      if (!edge) continue;

      // Apply edge type filter
      if (edgeType !== '*' && edge.type !== edgeType) {
        continue;
      }

      // Apply node type filter for target node
      const targetNode = this._index._nodes.get(edge.targetId);
      if (!targetNode) continue;
      if (nodeType !== '*' && targetNode.type !== nodeType) {
        continue;
      }

      children.push(edge.targetId);
    }

    return children;
  }

  /**
   * Builds an adjacency map for traversal with type filtering.
   * @param nodeType - Filter for node types ('*' for all)
   * @param edgeType - Filter for edge types ('*' for all)
   * @returns Map of node id to array of target node ids
   */
  _buildAdjacencyMap(nodeType: string = '*', edgeType: string = '*'): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const edge of this._index._edges.values()) {
      // Apply edge type filter
      if (edgeType !== '*' && edge.type !== edgeType) {
        continue;
      }

      // Apply node type filter for target node
      const targetNode = this._index._nodes.get(edge.targetId);
      if (!targetNode) continue;
      if (nodeType !== '*' && targetNode.type !== nodeType) {
        continue;
      }

      // Apply node type filter for source node (only if not already filtered by traversal starting point)
      const sourceNode = this._index._nodes.get(edge.sourceId);
      if (!sourceNode) continue;
      if (nodeType !== '*' && sourceNode.type !== nodeType) {
        continue;
      }

      if (!adjacency.has(edge.sourceId)) {
        adjacency.set(edge.sourceId, []);
      }
      adjacency.get(edge.sourceId)!.push(edge.targetId);
    }

    return adjacency;
  }

  /**
   * Traverses the graph from source to target using the specified algorithm.
   * @param sourceId - Id of the source node
   * @param targetId - Id of the target node
   * @param options - Traversal options including method, nodeType, and edgeType filters
   * @returns Array of node ids from source to target if path exists, null otherwise
   */
  traverse(
    sourceId: string,
    targetId: string,
    options: TraversalOptions = {}
  ): string[] | null {
    const { method = 'bfs', nodeType = '*', edgeType = '*' } = options;

    if (!this._index._nodes.has(sourceId) || !this._index._nodes.has(targetId)) {
      return null;
    }

    // Apply source node type filter
    const sourceNode = this._index._nodes.get(sourceId)!;
    if (nodeType !== '*' && sourceNode.type !== nodeType) {
      return null;
    }

    // Apply target node type filter
    const targetNode = this._index._nodes.get(targetId)!;
    if (nodeType !== '*' && targetNode.type !== nodeType) {
      return null;
    }

    if (sourceId === targetId) {
      return [sourceId];
    }

    const visited = new Set<string>();
    const parent = new Map<string, string | null>();

    // Use index-based queue for BFS to avoid O(n) shift()
    const queue: string[] = [sourceId];
    const stack: string[] = [sourceId];
    let queueIndex = 0;

    parent.set(sourceId, null);
    visited.add(sourceId);

    while (method === 'bfs' ? queueIndex < queue.length : stack.length > 0) {
      const current = method === 'bfs'
        ? queue[queueIndex++]
        : stack.pop()!;

      if (current === targetId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | null = targetId;
        while (node !== null) {
          path.push(node);
          node = parent.get(node) ?? null;
        }
        return path.reverse();
      }

      // Get children with type filtering
      const children = this._getTraversableChildren(current, nodeType, edgeType);
      for (const childId of children) {
        if (!visited.has(childId)) {
          visited.add(childId);
          parent.set(childId, current);
          queue.push(childId);
          stack.push(childId);
        }
      }
    }

    return null;
  }

  /**
   * Check if graph is a Directed Acyclic Graph (no cycles).
   * Uses DFS-based cycle detection with adjacency map.
   * @returns true if the graph has no cycles, false otherwise
   */
  isDAG(): boolean {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      visiting.add(nodeId);

      // Get children from adjacency map
      const childIds = this._getTraversableChildren(nodeId);
      for (const childId of childIds) {
        if (!visited.has(childId)) {
          if (hasCycle(childId)) {
            return true;
          }
        } else if (visiting.has(childId)) {
          // Found a back edge - cycle detected
          return true;
        }
      }

      visiting.delete(nodeId);
      return false;
    };

    // Check all nodes
    for (const node of this._index._nodes.values()) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Computes a topological ordering of the graph nodes using Kahn's algorithm.
   * Returns null if the graph is not a DAG (contains cycles).
   * For DAGs, returns nodes ordered such that all dependencies come before dependents.
   * @returns Array of node ids in topological order, or null if graph has cycles
   */
  topologicalSort(): string[] | null {
    // Calculate in-degree for each node
    const inDegree = new Map<string, number>();
    for (const node of this._index._nodes.values()) {
      inDegree.set(node.id, 0);
    }

    // Build adjacency list and calculate in-degrees
    const adjacency = new Map<string, string[]>();
    for (const node of this._index._nodes.values()) {
      adjacency.set(node.id, []);
    }

    for (const edge of this._index._edges.values()) {
      // Skip edges with dangling endpoints (nodes removed without cascade)
      if (!this._index._nodes.has(edge.sourceId) || !this._index._nodes.has(edge.targetId)) {
        continue;
      }
      adjacency.get(edge.sourceId)!.push(edge.targetId);
      inDegree.set(edge.targetId, (inDegree.get(edge.targetId) ?? 0) + 1);
    }

    // Kahn's algorithm: start with nodes that have no incoming edges
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjacency.get(current) ?? [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If we didn't process all nodes, there's a cycle
    if (result.length !== this._index._nodes.size) {
      return null;
    }

    return result;
  }
}
