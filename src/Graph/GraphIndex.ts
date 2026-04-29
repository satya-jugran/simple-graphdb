import { Node } from '../Node';
import { Edge } from '../Edge';
import {
  NodeAlreadyExistsError,
  EdgeAlreadyExistsError,
  NodeNotFoundError,
  NodeHasEdgesError,
} from '../errors';

/**
 * Internal class that manages graph indices and data storage.
 * Handles all index maps for O(1) lookups and provides data access methods.
 */
export class GraphIndex {
  private readonly _nodes: Map<string, Node> = new Map();
  private readonly _edges: Map<string, Edge> = new Map();

  // Type index maps for O(1) type-based queries
  private readonly _nodesByType: Map<string, Set<string>> = new Map();
  private readonly _edgesByType: Map<string, Set<string>> = new Map();

  // Adjacency maps for O(1) edge lookups
  private readonly _edgesBySource: Map<string, Set<string>> = new Map();
  private readonly _edgesByTarget: Map<string, Set<string>> = new Map();

  // Property value index: propKey -> serializedValue -> Set<nodeId>
  private readonly _nodesByProperty: Map<string, Map<string, Set<string>>> = new Map();

  // -------------------------------------------------------------------------
  // Package-internal read accessors (used by GraphTraversal / GraphSerializer)
  // -------------------------------------------------------------------------

  /** @internal Returns the raw node map (read-only view). */
  _getNodeMap(): ReadonlyMap<string, Node> {
    return this._nodes;
  }

  /** @internal Returns the raw edge map (read-only view). */
  _getEdgeMap(): ReadonlyMap<string, Edge> {
    return this._edges;
  }

  /** @internal Returns outgoing edge-id set for a node (read-only view). */
  _getEdgesBySource(nodeId: string): ReadonlySet<string> {
    return this._edgesBySource.get(nodeId) ?? new Set();
  }

  /** @internal Returns incoming edge-id set for a node (read-only view). */
  _getEdgesByTarget(nodeId: string): ReadonlySet<string> {
    return this._edgesByTarget.get(nodeId) ?? new Set();
  }

  /** @internal Serializes a property value to a stable string key for indexing. */
  private _propKey(value: unknown): string {
    return JSON.stringify(value) ?? 'undefined';
  }

  /** @internal Adds a node to the property value index for all its properties. */
  private _indexNodeProperties(node: Node): void {
    for (const [key, value] of Object.entries(node.properties)) {
      const serialized = this._propKey(value);
      if (!this._nodesByProperty.has(key)) {
        this._nodesByProperty.set(key, new Map());
      }
      const valueMap = this._nodesByProperty.get(key)!;
      if (!valueMap.has(serialized)) {
        valueMap.set(serialized, new Set());
      }
      valueMap.get(serialized)!.add(node.id);
    }
  }

  /** @internal Removes a node from the property value index for all its properties. */
  private _unindexNodeProperties(node: Node): void {
    for (const [key, value] of Object.entries(node.properties)) {
      const serialized = this._propKey(value);
      const valueMap = this._nodesByProperty.get(key);
      if (!valueMap) continue;
      const idSet = valueMap.get(serialized);
      if (!idSet) continue;
      idSet.delete(node.id);
      if (idSet.size === 0) {
        valueMap.delete(serialized);
        if (valueMap.size === 0) {
          this._nodesByProperty.delete(key);
        }
      }
    }
  }

  /** @internal Directly inserts a pre-constructed Node and updates all indexes (used by deserialization). */
  _insertNode(node: Node): void {
    this._nodes.set(node.id, node);
    if (!this._nodesByType.has(node.type)) {
      this._nodesByType.set(node.type, new Set());
    }
    this._nodesByType.get(node.type)!.add(node.id);
    this._indexNodeProperties(node);
  }

  /** @internal Directly inserts a pre-constructed Edge and updates all indexes (used by deserialization). */
  _insertEdge(edge: Edge): void {
    this._edges.set(edge.id, edge);

    if (!this._edgesBySource.has(edge.sourceId)) {
      this._edgesBySource.set(edge.sourceId, new Set());
    }
    this._edgesBySource.get(edge.sourceId)!.add(edge.id);

    if (!this._edgesByTarget.has(edge.targetId)) {
      this._edgesByTarget.set(edge.targetId, new Set());
    }
    this._edgesByTarget.get(edge.targetId)!.add(edge.id);

    if (!this._edgesByType.has(edge.type)) {
      this._edgesByType.set(edge.type, new Set());
    }
    this._edgesByType.get(edge.type)!.add(edge.id);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Returns all nodes in the graph.
   */
  getNodes(): readonly Node[] {
    return Array.from(this._nodes.values());
  }

  /**
   * Returns all edges in the graph.
   */
  getEdges(): readonly Edge[] {
    return Array.from(this._edges.values());
  }

  /**
   * Checks if a node exists in the graph.
   * @param id - Id of the node
   */
  hasNode(id: string): boolean {
    return this._nodes.has(id);
  }

  /**
   * Checks if an edge exists in the graph.
   * @param id - Id of the edge
   */
  hasEdge(id: string): boolean {
    return this._edges.has(id);
  }

  /**
   * Adds a new node to the graph.
   * @param type - The type (label) of the node
   * @param properties - Optional JSON properties
   * @returns The newly created Node
   * @throws NodeAlreadyExistsError if a node with this id already exists
   */
  addNode(type: string, properties: Record<string, unknown> = {}): Node {
    const node = new Node(type, properties);
    if (this._nodes.has(node.id)) {
      throw new NodeAlreadyExistsError(node.id);
    }
    this._nodes.set(node.id, node);

    // Update type index
    if (!this._nodesByType.has(type)) {
      this._nodesByType.set(type, new Set());
    }
    this._nodesByType.get(type)!.add(node.id);

    // Update property value index
    this._indexNodeProperties(node);

    return node;
  }

  /**
   * Removes a node from the graph.
   * @param id - Id of the node to remove
   * @param cascade - If true, also removes all incident edges (default: false)
   * @returns true if the node was removed, false if it didn't exist
   */
  removeNode(id: string, cascade: boolean = false): boolean {
    const node = this._nodes.get(id);
    if (!node) {
      return false;
    }

    const outgoingEdgeIds = this._edgesBySource.get(id) ?? new Set();
    const incomingEdgeIds = this._edgesByTarget.get(id) ?? new Set();

    if (cascade) {
      // Remove all edges incident to this node using adjacency maps
      for (const edgeId of [...outgoingEdgeIds]) {
        this._removeEdgeInternal(edgeId);
      }
      for (const edgeId of [...incomingEdgeIds]) {
        this._removeEdgeInternal(edgeId);
      }
    } else {
      // Guard: refuse to leave dangling edges in the edge map
      const incidentCount = outgoingEdgeIds.size + incomingEdgeIds.size;
      if (incidentCount > 0) {
        throw new NodeHasEdgesError(id, incidentCount);
      }
    }

    // Remove from type index
    const typeSet = this._nodesByType.get(node.type);
    if (typeSet) {
      typeSet.delete(id);
      if (typeSet.size === 0) {
        this._nodesByType.delete(node.type);
      }
    }

    // Remove from property value index
    this._unindexNodeProperties(node);

    this._nodes.delete(id);
    return true;
  }

  /**
   * Internal method to remove an edge without cascade checks.
   */
  _removeEdgeInternal(edgeId: string): void {
    const edge = this._edges.get(edgeId);
    if (!edge) return;

    // Remove from adjacency maps
    const sourceEdges = this._edgesBySource.get(edge.sourceId);
    if (sourceEdges) {
      sourceEdges.delete(edgeId);
      if (sourceEdges.size === 0) {
        this._edgesBySource.delete(edge.sourceId);
      }
    }

    const targetEdges = this._edgesByTarget.get(edge.targetId);
    if (targetEdges) {
      targetEdges.delete(edgeId);
      if (targetEdges.size === 0) {
        this._edgesByTarget.delete(edge.targetId);
      }
    }

    // Remove from type index
    const typeSet = this._edgesByType.get(edge.type);
    if (typeSet) {
      typeSet.delete(edgeId);
      if (typeSet.size === 0) {
        this._edgesByType.delete(edge.type);
      }
    }

    this._edges.delete(edgeId);
  }

  /**
   * Retrieves a node by id.
   * @param id - Id of the node
   * @returns The Node if found, undefined otherwise
   */
  getNode(id: string): Node | undefined {
    return this._nodes.get(id);
  }

  /**
   * Retrieves nodes by their type.
   * @param type - The node type to filter by
   * @returns Array of Nodes with the specified type
   */
  getNodesByType(type: string): Node[] {
    const nodeIds = this._nodesByType.get(type);
    if (!nodeIds) {
      return [];
    }
    return Array.from(nodeIds)
      .map((id) => this._nodes.get(id)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Retrieves nodes by a property value.
   * @param key - The property key to search
   * @param value - The property value to match
   * @param options - Optional options with nodeType filter
   * @returns Array of Nodes with the specified property value
   */
  getNodesByProperty(key: string, value: unknown, options?: { nodeType?: string }): Node[] {
    const nodeType = options?.nodeType ?? '*';
    const serialized = this._propKey(value);

    const valueMap = this._nodesByProperty.get(key);
    if (!valueMap) return [];

    const nodeIds = valueMap.get(serialized);
    if (!nodeIds) return [];

    return Array.from(nodeIds)
      .map((id) => this._nodes.get(id))
      .filter((node): node is Node => node !== undefined)
      .filter((node) => nodeType === '*' || node.type === nodeType);
  }

  /**
   * Adds a new directed edge to the graph.
   * @param sourceId - Id of the source node
   * @param targetId - Id of the target node
   * @param type - The relationship type
   * @param properties - Optional JSON properties
   * @returns The newly created Edge
   * @throws NodeNotFoundError if source or target node doesn't exist
   * @throws EdgeAlreadyExistsError if an edge with this id already exists
   */
  addEdge(
    sourceId: string,
    targetId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): Edge {
    if (!this._nodes.has(sourceId)) {
      throw new NodeNotFoundError(sourceId);
    }
    if (!this._nodes.has(targetId)) {
      throw new NodeNotFoundError(targetId);
    }

    const edge = new Edge(sourceId, targetId, type, properties);
    if (this._edges.has(edge.id)) {
      throw new EdgeAlreadyExistsError(edge.id);
    }
    this._edges.set(edge.id, edge);

    // Update adjacency maps
    if (!this._edgesBySource.has(sourceId)) {
      this._edgesBySource.set(sourceId, new Set());
    }
    this._edgesBySource.get(sourceId)!.add(edge.id);

    if (!this._edgesByTarget.has(targetId)) {
      this._edgesByTarget.set(targetId, new Set());
    }
    this._edgesByTarget.get(targetId)!.add(edge.id);

    // Update type index
    if (!this._edgesByType.has(type)) {
      this._edgesByType.set(type, new Set());
    }
    this._edgesByType.get(type)!.add(edge.id);

    return edge;
  }

  /**
   * Removes an edge from the graph.
   * @param id - Id of the edge to remove
   * @returns true if the edge was removed, false if it didn't exist
   */
  removeEdge(id: string): boolean {
    const edge = this._edges.get(id);
    if (!edge) {
      return false;
    }
    this._removeEdgeInternal(id);
    return true;
  }

  /**
   * Retrieves an edge by id.
   * @param id - Id of the edge
   * @returns The Edge if found, undefined otherwise
   */
  getEdge(id: string): Edge | undefined {
    return this._edges.get(id);
  }

  /**
   * Gets the parent nodes of a given node.
   * Parents are nodes that have edges pointing TO this node.
   * @param nodeId - Id of the target node
   * @param options - Optional traversal options with nodeType and edgeType filters
   * @returns Array of parent Nodes
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getParents(nodeId: string, options?: { nodeType?: string; edgeType?: string }): Node[] {
    if (!this._nodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const edgeIds = this._edgesByTarget.get(nodeId) ?? new Set();
    const parentIds = new Set<string>();
    const nodeType = options?.nodeType ?? '*';
    const edgeType = options?.edgeType ?? '*';

    for (const edgeId of edgeIds) {
      const edge = this._edges.get(edgeId);
      if (!edge) continue;
      
      const sourceNode = this._nodes.get(edge.sourceId);
      if (!sourceNode) continue;
      
      if (edgeType !== '*' && edge.type !== edgeType) {
        continue;
      }
      if (nodeType !== '*' && sourceNode.type !== nodeType) {
        continue;
      }
      
      parentIds.add(edge.sourceId);
    }

    return Array.from(parentIds)
      .map((id) => this._nodes.get(id)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Gets the child nodes of a given node.
   * Children are nodes that this node points TO.
   * @param nodeId - Id of the source node
   * @param options - Optional traversal options with nodeType and edgeType filters
   * @returns Array of child Nodes
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getChildren(nodeId: string, options?: { nodeType?: string; edgeType?: string }): Node[] {
    if (!this._nodes.has(nodeId)) {
      throw new NodeNotFoundError(nodeId);
    }

    const edgeIds = this._edgesBySource.get(nodeId) ?? new Set();
    const childIds = new Set<string>();
    const nodeType = options?.nodeType ?? '*';
    const edgeType = options?.edgeType ?? '*';

    for (const edgeId of edgeIds) {
      const edge = this._edges.get(edgeId);
      if (!edge) continue;
      
      const targetNode = this._nodes.get(edge.targetId);
      if (!targetNode) continue;
      
      if (edgeType !== '*' && edge.type !== edgeType) {
        continue;
      }
      if (nodeType !== '*' && targetNode.type !== nodeType) {
        continue;
      }
      
      childIds.add(edge.targetId);
    }

    return Array.from(childIds)
      .map((id) => this._nodes.get(id)!)
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * Gets all edges originating from a node (outgoing edges).
   * @param sourceId - Id of the source node
   * @param options - Optional traversal options with edgeType filter
   * @returns Array of outgoing Edges
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesFrom(sourceId: string, options?: { edgeType?: string }): Edge[] {
    if (!this._nodes.has(sourceId)) {
      throw new NodeNotFoundError(sourceId);
    }

    const edgeIds = this._edgesBySource.get(sourceId) ?? new Set();
    const edgeType = options?.edgeType ?? '*';

    return Array.from(edgeIds)
      .map((id) => this._edges.get(id))
      .filter((edge): edge is Edge => edge !== undefined)
      .filter((edge) => edgeType === '*' || edge.type === edgeType);
  }

  /**
   * Gets all edges pointing to a node (incoming edges).
   * @param targetId - Id of the target node
   * @param options - Optional traversal options with edgeType filter
   * @returns Array of incoming Edges
   * @throws NodeNotFoundError if the node doesn't exist
   */
  getEdgesTo(targetId: string, options?: { edgeType?: string }): Edge[] {
    if (!this._nodes.has(targetId)) {
      throw new NodeNotFoundError(targetId);
    }

    const edgeIds = this._edgesByTarget.get(targetId) ?? new Set();
    const edgeType = options?.edgeType ?? '*';

    return Array.from(edgeIds)
      .map((id) => this._edges.get(id))
      .filter((edge): edge is Edge => edge !== undefined)
      .filter((edge) => edgeType === '*' || edge.type === edgeType);
  }

  /**
   * Gets all direct edges between two nodes (in either direction).
   * Only returns edges where the two nodes are directly connected.
   * @param sourceId - Id of the first node
   * @param targetId - Id of the second node
   * @param options - Optional traversal options with edgeType filter
   * @returns Array of Edges between the nodes
   * @throws NodeNotFoundError if either node doesn't exist
   */
  getDirectEdgesBetween(sourceId: string, targetId: string, options?: { edgeType?: string }): Edge[] {
    if (!this._nodes.has(sourceId)) {
      throw new NodeNotFoundError(sourceId);
    }
    if (!this._nodes.has(targetId)) {
      throw new NodeNotFoundError(targetId);
    }

    const outgoingEdgeIds = this._edgesBySource.get(sourceId) ?? new Set();
    const incomingEdgeIds = this._edgesBySource.get(targetId) ?? new Set();
    const edgeType = options?.edgeType ?? '*';

    const result: Edge[] = [];

    // Check edges from sourceId to targetId
    for (const edgeId of outgoingEdgeIds) {
      const edge = this._edges.get(edgeId);
      if (!edge) continue;
      if (edge.targetId === targetId && (edgeType === '*' || edge.type === edgeType)) {
        result.push(edge);
      }
    }

    // Check edges from targetId to sourceId
    for (const edgeId of incomingEdgeIds) {
      const edge = this._edges.get(edgeId);
      if (!edge) continue;
      if (edge.targetId === sourceId && (edgeType === '*' || edge.type === edgeType)) {
        result.push(edge);
      }
    }

    return result;
  }

  /**
   * Gets all edges of a specific type.
   * @param type - The edge type to filter by
   * @returns Array of Edges with the specified type
   */
  getEdgesByType(type: string): Edge[] {
    const edgeIds = this._edgesByType.get(type);
    if (!edgeIds) {
      return [];
    }
    return Array.from(edgeIds)
      .map((id) => this._edges.get(id)!)
      .filter((edge): edge is Edge => edge !== undefined);
  }

  /**
   * Clears all data and indices.
   */
  clear(): void {
    this._nodes.clear();
    this._edges.clear();
    this._nodesByType.clear();
    this._edgesByType.clear();
    this._edgesBySource.clear();
    this._edgesByTarget.clear();
    this._nodesByProperty.clear();
  }
}
