# simple-graphdb

A lightweight in-memory graph database.

## Installation

```bash
npm install simple-graphdb
```

## Quick Start

```typescript
import { Graph } from 'simple-graphdb';

// Create a new graph
const graph = new Graph();

// Add nodes with properties
graph.addNode('Alice', { age: 30, city: 'NYC' });
graph.addNode('Bob', { age: 25, city: 'LA' });
graph.addNode('Charlie', { age: 35, city: 'Chicago' });

// Add directed edges (relationships)
graph.addEdge('Alice-likes-Bob', 'Alice', 'Bob', { since: 2020 });
graph.addEdge('Bob-loves-Charlie', 'Bob', 'Charlie', { intensity: 'high' });

// Navigate the graph
const aliceChildren = graph.getChildren('Alice');  // [Bob]
const charlieParents = graph.getParents('Charlie'); // [Bob]
```

## API Reference

### Graph Class

#### Node Operations

| Method | Description |
|--------|-------------|
| `addNode(name: string, properties?: Record<string, unknown>): Node` | Add a new node |
| `removeNode(name: string, cascade?: boolean): boolean` | Remove node; cascade removes incident edges |
| `getNode(name: string): Node \| undefined` | Get node by name |
| `hasNode(name: string): boolean` | Check if node exists |
| `getNodes(): readonly Node[]` | Get all nodes |

#### Edge Operations

| Method | Description |
|--------|-------------|
| `addEdge(name: string, sourceName: string, targetName: string, properties?: Record<string, unknown>): Edge` | Add a directed edge |
| `removeEdge(name: string): boolean` | Remove edge by name |
| `getEdge(name: string): Edge \| undefined` | Get edge by name |
| `hasEdge(name: string): boolean` | Check if edge exists |
| `getEdges(): readonly Edge[]` | Get all edges |

#### Navigation

| Method | Description |
|--------|-------------|
| `getParents(nodeName: string): Node[]` | Get nodes with edges pointing TO this node |
| `getChildren(nodeName: string): Node[]` | Get nodes this node points TO |
| `getEdgesFrom(nodeName: string): Edge[]` | Get outgoing edges from a node |
| `getEdgesTo(nodeName: string): Edge[]` | Get incoming edges to a node |
| `getEdgesBetween(nodeA: string, nodeB: string): Edge[]` | Get edges between two nodes |

#### Serialization

| Method | Description |
|--------|-------------|
| `toJSON(): GraphData` | Serialize graph to JSON-compatible format |
| `static fromJSON(data: GraphData): Graph` | Reconstruct graph from data |
| `clear(): void` | Remove all nodes and edges |

### Node Class

```typescript
const node = graph.getNode('Alice');
node.name;       // 'Alice'
node.properties;  // { age: 30, city: 'NYC' }
node.toJSON();   // { name: 'Alice', properties: { age: 30, city: 'NYC' } }
```

### Edge Class

```typescript
const edge = graph.getEdge('Alice-likes-Bob');
edge.name;        // 'Alice-likes-Bob'
edge.sourceName;  // 'Alice'
edge.targetName;  // 'Bob'
edge.properties;  // { since: 2020 }
edge.toJSON();    // { name: 'Alice-likes-Bob', sourceName: 'Alice', targetName: 'Bob', properties: { since: 2020 } }
```

## Error Handling

```typescript
import { Graph, NodeAlreadyExistsError, NodeNotFoundError } from 'simple-graphdb';

const graph = new Graph();
graph.addNode('Alice');

try {
  graph.addNode('Alice'); // Throws NodeAlreadyExistsError
} catch (e) {
  if (e instanceof NodeAlreadyExistsError) {
    console.log(e.message); // "Node with name 'Alice' already exists"
  }
}

try {
  graph.getNode('NonExistent'); // Returns undefined
  graph.addEdge('knows', 'NonExistent', 'Bob'); // Throws NodeNotFoundError
} catch (e) {
  if (e instanceof NodeNotFoundError) {
    console.log(e.message); // "Node with name 'NonExistent' not found"
  }
}
```

Available errors:
- `NodeAlreadyExistsError`
- `EdgeAlreadyExistsError`
- `NodeNotFoundError`
- `EdgeNotFoundError`

## Serialization & Persistence

```typescript
// Save graph to JSON
const data = graph.toJSON();
const jsonString = JSON.stringify(data, null, 2);

// Persist to storage
fs.writeFileSync('graph.json', jsonString);

// Load graph from JSON
const jsonString = fs.readFileSync('graph.json', 'utf-8');
const data = JSON.parse(jsonString);
const restored = Graph.fromJSON(data);
```

## Cascade Delete

By default, removing a node does not remove incident edges. Use `cascade: true` to remove them:

```typescript
graph.addNode('A');
graph.addNode('B');
graph.addEdge('knows', 'A', 'B');

// Without cascade - edge remains
graph.removeNode('A');
graph.hasEdge('knows'); // true

// With cascade - edge is also removed
graph.removeNode('B', { cascade: true });
graph.hasEdge('knows'); // false
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests (65 tests total)
npm test
```

## Testing

The test suite includes:
- `tests/Graph.test.ts` - Core functionality tests (34 tests)
- `tests/ComplexGraph.test.ts` - Complex graph loaded from JSON (31 tests)
- `tests/data/complex-graph.json` - Sample graph data with 8 nodes and 10 edges

## License

MIT
