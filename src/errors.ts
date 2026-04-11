/**
 * Base class for all graph-related errors
 */
export class GraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphError';
    Object.setPrototypeOf(this, GraphError.prototype);
  }
}

/**
 * Error thrown when attempting to add a node that already exists
 */
export class NodeAlreadyExistsError extends GraphError {
  constructor(nodeName: string) {
    super(`Node with name '${nodeName}' already exists`);
    this.name = 'NodeAlreadyExistsError';
    Object.setPrototypeOf(this, NodeAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when attempting to add an edge that already exists
 */
export class EdgeAlreadyExistsError extends GraphError {
  constructor(edgeName: string) {
    super(`Edge with name '${edgeName}' already exists`);
    this.name = 'EdgeAlreadyExistsError';
    Object.setPrototypeOf(this, EdgeAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when a node is not found in the graph
 */
export class NodeNotFoundError extends GraphError {
  constructor(nodeName: string) {
    super(`Node with name '${nodeName}' not found`);
    this.name = 'NodeNotFoundError';
    Object.setPrototypeOf(this, NodeNotFoundError.prototype);
  }
}

/**
 * Error thrown when an edge is not found in the graph
 */
export class EdgeNotFoundError extends GraphError {
  constructor(edgeName: string) {
    super(`Edge with name '${edgeName}' not found`);
    this.name = 'EdgeNotFoundError';
    Object.setPrototypeOf(this, EdgeNotFoundError.prototype);
  }
}
