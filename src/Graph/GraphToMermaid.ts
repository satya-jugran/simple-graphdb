import type { GraphData, NodeData, EdgeData } from '../types';
import { Graph } from '../Graph';
import { InvalidGraphDataError } from '../errors';

/**
 * Options for Mermaid diagram generation.
 */
export interface MermaidOptions {
  /**
   * Show node properties in the node label (default: false)
   */
  showProperties?: boolean;
  /**
   * Show edge type as label on the arrow (default: true)
   */
  includeEdgeLabels?: boolean;
  /**
   * Direction of the flowchart: TD (top-down) or LR (left-right) (default: TD)
   */
  direction?: 'TD' | 'LR';
}

/**
 * Converts a Graph to Mermaid diagram syntax for visualization.
 * Supports both Graph instances and serialized JSON data.
 */
export class GraphToMermaid {
  private readonly _graphData: GraphData;
  private readonly _options: Required<MermaidOptions>;

  /**
   * Creates a new GraphToMermaid converter from a Graph instance.
   * @param graph - The Graph to convert
   * @param options - Optional configuration options
   */
  constructor(graph: Graph, options?: MermaidOptions);

  /**
   * Creates a new GraphToMermaid converter from a JSON string.
   * @param jsonString - JSON serialized GraphData
   * @param options - Optional configuration options
   */
  constructor(jsonString: string, options?: MermaidOptions);

  constructor(graphOrJson: Graph | string, options?: MermaidOptions) {
    if (typeof graphOrJson === 'string') {
      try {
        const parsed = JSON.parse(graphOrJson);
        this._validateGraphData(parsed);
        this._graphData = parsed;
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new InvalidGraphDataError(`Invalid JSON: ${e.message}`);
        }
        throw e;
      }
    } else {
      this._graphData = graphOrJson.toJSON();
    }

    this._options = {
      showProperties: options?.showProperties ?? false,
      includeEdgeLabels: options?.includeEdgeLabels ?? true,
      direction: options?.direction ?? 'TD',
    };
  }

  /**
   * Validates that the parsed data has the required GraphData structure.
   */
  private _validateGraphData(data: unknown): asserts data is GraphData {
    if (typeof data !== 'object' || data === null) {
      throw new InvalidGraphDataError('GraphData must be an object');
    }
    if (!Array.isArray((data as GraphData).nodes)) {
      throw new InvalidGraphDataError('GraphData must have a nodes array');
    }
    if (!Array.isArray((data as GraphData).edges)) {
      throw new InvalidGraphDataError('GraphData must have an edges array');
    }
  }

  /**
   * Converts the graph to Mermaid diagram syntax.
   * @returns Mermaid flowchart diagram string
   */
  toString(): string {
    const lines: string[] = [];

    // flowchart directive
    lines.push(`flowchart ${this._options.direction}`);

    // Generate node definitions
    for (const node of this._graphData.nodes) {
      lines.push(this._nodeToMermaid(node));
    }

    // Generate edge definitions
    for (const edge of this._graphData.edges) {
      lines.push(this._edgeToMermaid(edge));
    }

    return lines.join('\n');
  }

  /**
   * Generates the Mermaid syntax for a single node.
   * @param node - The node data
   * @returns Mermaid node definition
   */
  private _nodeToMermaid(node: NodeData): string {
    const safeId = this._sanitizeId(node.id);
    const label = this._buildNodeLabel(node);
    return `    ${safeId}${label}`;
  }

  /**
   * Builds the label content for a node.
   * @param node - The node data
   * @returns Label string in Mermaid format
   */
  private _buildNodeLabel(node: NodeData): string {
    const parts: string[] = [
      this._escapeMermaidText(node.type),
      this._escapeMermaidText(node.id),
    ];

    if (this._options.showProperties && Object.keys(node.properties).length > 0) {
      const props = Object.entries(node.properties)
        .slice(0, 3) // Limit to first 3 properties to avoid overly long labels
        .map(([k, v]) => `${this._escapeMermaidText(k)}: ${this._escapeMermaidText(this._truncateValue(v))}`)
        .join(', ');
      parts.push(`{${props}}`);
    }

    return `["${parts.join(' | ')}"]`;
  }

  /**
   * Generates the Mermaid syntax for a single edge.
   * @param edge - The edge data
   * @returns Mermaid edge definition
   */
  private _edgeToMermaid(edge: EdgeData): string {
    const sourceSafe = this._sanitizeId(edge.sourceId);
    const targetSafe = this._sanitizeId(edge.targetId);

    if (this._options.includeEdgeLabels && edge.type) {
      return `    ${sourceSafe} -->|"${this._escapeMermaidText(edge.type)}"| ${targetSafe}`;
    }

    return `    ${sourceSafe} --> ${targetSafe}`;
  }

  /**
   * Escapes Mermaid-significant characters in text to prevent injection.
   * @param text - The text to escape
   * @returns Escaped text safe for use in Mermaid labels
   */
  private _escapeMermaidText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/"/g, '\\"')   // Escape double quotes
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/]/g, '\\]');   // Escape closing brackets
  }

  /**
   * Sanitizes an ID for use in Mermaid syntax.
   * Mermaid IDs must be alphanumeric and may contain hyphens and underscores.
   * @param id - The original node/edge id
   * @returns Sanitized id safe for Mermaid
   */
  private _sanitizeId(id: string): string {
    // Replace any non-alphanumeric characters (except hyphen and underscore) with underscores
    return id.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Truncates a value for display in node labels.
   * @param value - The value to truncate
   * @returns Truncated string representation
   */
  private _truncateValue(value: unknown): string {
    const str = String(value);
    if (str.length > 20) {
      return str.slice(0, 17) + '...';
    }
    return str;
  }
}
