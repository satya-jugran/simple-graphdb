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
  constructor(nodeId: string) {
    super(`Node with id '${nodeId}' already exists`);
    this.name = 'NodeAlreadyExistsError';
    Object.setPrototypeOf(this, NodeAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when attempting to add an edge that already exists
 */
export class EdgeAlreadyExistsError extends GraphError {
  constructor(edgeId: string) {
    super(`Edge with id '${edgeId}' already exists`);
    this.name = 'EdgeAlreadyExistsError';
    Object.setPrototypeOf(this, EdgeAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when a node is not found in the graph
 */
export class NodeNotFoundError extends GraphError {
  constructor(nodeId: string) {
    super(`Node with id '${nodeId}' not found`);
    this.name = 'NodeNotFoundError';
    Object.setPrototypeOf(this, NodeNotFoundError.prototype);
  }
}

/**
 * Error thrown when an edge is not found in the graph
 */
export class EdgeNotFoundError extends GraphError {
  constructor(edgeId: string) {
    super(`Edge with id '${edgeId}' not found`);
    this.name = 'EdgeNotFoundError';
    Object.setPrototypeOf(this, EdgeNotFoundError.prototype);
  }
}

/**
 * Error thrown when GraphData is invalid (malformed JSON or missing required fields)
 */
export class InvalidGraphDataError extends GraphError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGraphDataError';
    Object.setPrototypeOf(this, InvalidGraphDataError.prototype);
  }
}
