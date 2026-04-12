# simple-graphdb

A lightweight in-memory graph database with a Neo4j-like design.

## Installation

```bash
npm install simple-graphdb
```

## Quick Start

```typescript
import { Graph } from 'simple-graphdb';

// Create a new graph
const graph = new Graph();

// Add nodes with type and properties
const pythonCourse = graph.addNode('Course', { name: 'Python', duration: 40 });
const chapter1 = graph.addNode('Chapter', { name: 'Basics', order: 1 });
const author = graph.addNode('Author', { name: 'John Doe' });

// Add directed edges with relationship types
graph.addEdge(pythonCourse.id, chapter1.id, 'CONTAINS');
graph.addEdge(author.id, pythonCourse.id, 'AUTHOR_OF');

// Navigate the graph
const chapters = graph.getChildren(pythonCourse.id);  // [chapter1]
const courses = graph.getParents(author.id);         // [pythonCourse]

// Find nodes by type
const courses = graph.getNodesByType('Course');

// Find path between nodes
const path = graph.traverse(pythonCourse.id, chapter1.id, 'bfs'); // [courseId, chapterId]

// Check if graph is a DAG
graph.isDAG(); // true
```

## API Reference

### Graph Class

#### Node Operations

| Method | Description |
|--------|-------------|
| `addNode(type: string, properties?: Record<string, unknown>): Node` | Add a new node with type label |
| `removeNode(id: string, cascade?: boolean): boolean` | Remove node; cascade removes incident edges |
| `getNode(id: string): Node \| undefined` | Get node by id |
| `hasNode(id: string): boolean` | Check if node exists |
| `getNodes(): readonly Node[]` | Get all nodes |
| `getNodesByType(type: string): Node[]` | Get all nodes of a given type |
| `getNodesByProperty(key: string, value: unknown): Node[]` | Get nodes by property value |

#### Edge Operations

| Method | Description |
|--------|-------------|
| `addEdge(sourceId: string, targetId: string, type: string, properties?: Record<string, unknown>): Edge` | Add a directed edge with relationship type |
| `removeEdge(id: string): boolean` | Remove edge by id |
| `getEdge(id: string): Edge \| undefined` | Get edge by id |
| `hasEdge(id: string): boolean` | Check if edge exists |
| `getEdges(): readonly Edge[]` | Get all edges |
| `getEdgesByType(type: string): Edge[]` | Get all edges of a given relationship type |

#### Navigation

| Method | Description |
|--------|-------------|
| `getParents(nodeId: string): Node[]` | Get nodes with edges pointing TO this node |
| `getChildren(nodeId: string): Node[]` | Get nodes this node points TO |
| `getEdgesFrom(sourceId: string): Edge[]` | Get outgoing edges from a node |
| `getEdgesTo(targetId: string): Edge[]` | Get incoming edges to a node |
| `getEdgesBetween(sourceId: string, targetId: string): Edge[]` | Get edges between two nodes |

#### Traversal & Analysis

| Method | Description |
|--------|-------------|
| `traverse(sourceId: string, targetId: string, method?: 'bfs' \| 'dfs'): string[] \| null` | Find path between nodes using BFS (default) or DFS |
| `isDAG(): boolean` | Check if graph is a Directed Acyclic Graph |

#### Serialization

| Method | Description |
|--------|-------------|
| `toJSON(): GraphData` | Serialize graph to JSON-compatible format |
| `static fromJSON(data: GraphData): Graph` | Reconstruct graph from data |
| `clear(): void` | Remove all nodes and edges |

### Node Class

```typescript
const node = graph.addNode('Course', { name: 'Python', duration: 40 });

node.id;         // 'uuid-xxxx-xxxx'
node.type;       // 'Course'
node.properties; // { name: 'Python', duration: 40 }
node.toJSON();   // { id: '...', type: 'Course', properties: { name: 'Python', duration: 40 } }
```

### Edge Class

```typescript
const edge = graph.addEdge(sourceId, targetId, 'CONTAINS', { order: 1 });

edge.id;         // 'uuid-xxxx-xxxx'
edge.sourceId;   // 'source-node-id'
edge.targetId;   // 'target-node-id'
edge.type;       // 'CONTAINS'
edge.properties;  // { order: 1 }
edge.toJSON();   // { id: '...', sourceId: '...', targetId: '...', type: 'CONTAINS', properties: { order: 1 } }
```

## Error Handling

```typescript
import { Graph, NodeAlreadyExistsError, NodeNotFoundError, EdgeAlreadyExistsError } from 'simple-graphdb';

const graph = new Graph();
const node = graph.addNode('Course', { name: 'Python' });

try {
  // Node IDs are auto-generated, so duplicates come from JSON
  const data = { nodes: [{ id: 'same-id', type: 'A', properties: {} }, { id: 'same-id', type: 'B', properties: {} }], edges: [] };
  Graph.fromJSON(data); // Throws NodeAlreadyExistsError
} catch (e) {
  if (e instanceof NodeAlreadyExistsError) {
    console.log(e.message); // "Node with id 'same-id' already exists"
  }
}

try {
  // Missing node reference
  const data = { nodes: [{ id: 'node1', type: 'Test', properties: {} }], edges: [{ id: 'e1', sourceId: 'non-existent', targetId: 'node1', type: 'LINKS', properties: {} }] };
  Graph.fromJSON(data); // Throws NodeNotFoundError
} catch (e) {
  if (e instanceof NodeNotFoundError) {
    console.log(e.message); // "Node with id 'non-existent' not found"
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
const a = graph.addNode('Person', { name: 'A' });
const b = graph.addNode('Person', { name: 'B' });
const edgeId = graph.addEdge(a.id, b.id, 'KNOWS').id;

// Without cascade - edge remains
graph.removeNode(a.id);
graph.hasEdge(edgeId); // true

// With cascade - edge is also removed
graph.removeNode(b.id, true);
graph.hasEdge(edgeId); // false
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests (126 tests total)
npm test
```

## Testing

The test suite includes:
- `tests/Graph.test.ts` - Core functionality tests (76 tests)
- `tests/ComplexGraph.test.ts` - Complex graph loaded from JSON (12 tests)
- `tests/EducationGraph.test.ts` - Education domain graph tests (37 tests)
- `tests/data/complex-graph.json` - Sample graph data with 8 Person nodes
- `tests/data/education-graph.json` - Education domain graph with Courses, Chapters, Sections, Exams, Tests, Authors, Publishers, and Tags

## License

MIT
