# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-04-14

### 🚨 Breaking Changes

1. **TraversalOptions API Updated**
   - `nodeType` renamed to `nodeTypes` (array instead of single string)
   - `edgeType` renamed to `edgeTypes` (array instead of single string)
   - Default value changed from `'*'` to `['*']` (wildcard array means include all)

2. **traverse() Return Type Changed**
   - Old: `string[] | null` (single path)
   - New: `string[][] | null` (array of paths)
   - Source and target now accept wildcards: `string | string[]`

### ✨ New Features

1. **Wildcard Traversal**
   - `traverse('*', target)` - find one path for each matching source to target
   - `traverse(source, '*')` - find one path from source to each matching target
   - `traverse('*', '*')` - find one path for each matching source/target combination
   - `traverse(['a', 'b'], ['x', 'y'])` - find one path for each matching source/target pair between the provided node sets

2. **Multi-Type Filtering**
   - `nodeTypes: ['TypeA', 'TypeB']` - match nodes of type A OR B
   - `edgeTypes: ['EDGE1', 'EDGE2']` - match edges of type 1 OR 2
   - Wildcard `'*'` in array means include all types

---

## [2.1.0] - 2026-04-12

### 🚀 Performance Improvements

1. **Adjacency Maps for O(1) Lookups**
   - Added `_edgesBySource` and `_edgesByTarget` adjacency maps for constant-time edge lookups
   - Added `_nodesByType` and `_edgesByType` type index maps for fast type-based queries
   - `getParents()`, `getChildren()`, `getEdgesFrom()`, `getEdgesTo()`, `getDirectEdgesBetween()` now use adjacency maps instead of O(n) array iteration
   - `getNodesByType()`, `getEdgesByType()` now use type index maps
   - `isDAG()` uses adjacency map for cycle detection
   - `removeNode(cascade)` uses adjacency maps for efficient incident edge cleanup

### ✨ New Features

1. **Type-Filtered Traversal**
   - `traverse()` now accepts `TraversalOptions` with `nodeType` and `edgeType` filters
   - `getParents()`, `getChildren()` now accept optional `nodeType` and `edgeType` filters
   - `getEdgesFrom()`, `getEdgesTo()`, `getDirectEdgesBetween()` now accept optional `edgeType` filter
   - `getNodesByProperty()` now accepts optional `nodeType` filter

2. **Topological Sort**
   - New `topologicalSort()` method using Kahn's algorithm
   - Returns `string[]` (node IDs in dependency order) for DAGs
   - Returns `null` if graph contains cycles
   - Used by `toJSON()` to serialize DAG nodes in topological order

3. **API Renaming**
   - `getEdgesBetween()` renamed to `getDirectEdgesBetween()` for clarity (only finds direct edges, not multi-hop paths)

### 📦 Exported Types

- `TraversalOptions` interface now exported from main module

---

## [2.0.0] - 2026-04-11

### 🚨 Breaking Changes

This release introduces significant API changes.

#### Core Design Changes

**`types.ts`**
- `NodeData` now has `id`, `type`, and `properties` (removed `name`)
- `EdgeData` now has `id`, `sourceId`, `targetId`, `type`, and `properties` (removed `name`, `sourceName`, `targetName`)

**`Node` class**
- `name` property removed - use `properties.name`
- Added `id` property (auto-generated UUID or provided)
- Added `type` property (node label)
- Constructor signature: `constructor(type: string, properties?: Record<string, unknown>, id?: string)`

**`Edge` class**
- `name` property removed
- `sourceName` renamed to `sourceId`
- `targetName` renamed to `targetId`
- Added `type` property (relationship type)
- Constructor signature: `constructor(sourceId: string, targetId: string, type: string, properties?: Record<string, unknown>, id?: string)`

**`Graph` class - Updated Methods**
| Old Signature | New Signature |
|--------------|---------------|
| `addNode(name: string, properties?)` | `addNode(type: string, properties?)` |
| `getNode(name: string)` | `getNode(id: string)` |
| `hasNode(name: string)` | `hasNode(id: string)` |
| `removeNode(name: string, cascade?)` | `removeNode(id: string, cascade?)` |
| `addEdge(name: string, sourceName: string, targetName: string, properties?)` | `addEdge(sourceId: string, targetId: string, type: string, properties?)` |
| `getEdge(name: string)` | `getEdge(id: string)` |
| `hasEdge(name: string)` | `hasEdge(id: string)` |
| `removeEdge(name: string)` | `removeEdge(id: string)` |
| `getChildren(nodeName: string)` | `getChildren(nodeId: string)` |
| `getParents(nodeName: string)` | `getParents(nodeId: string)` |
| `getEdgesFrom(sourceName: string)` | `getEdgesFrom(sourceId: string)` |
| `getEdgesTo(targetName: string)` | `getEdgesTo(targetId: string)` |
| `getEdgesBetween(sourceName: string, targetName: string)` | `getEdgesBetween(sourceId: string, targetId: string)` |

**`Graph` class - New Methods**
- `getNodesByType(type: string): Node[]` - Find all nodes of a given type
- `getNodesByProperty(key: string, value: unknown): Node[]` - Find nodes by property value
- `getEdgesByType(type: string): Edge[]` - Find all edges of a relationship type
- `traverse(sourceId: string, targetId: string, method?: 'bfs' | 'dfs'): string[] | null` - Find path between nodes
- `isDAG(): boolean` - Check if graph is a Directed Acyclic Graph

**`errors.ts`**
- Error messages updated to reference `id` instead of `name`

### ✨ New Features

1. **Node Types (Labels)**
   - Nodes now have a `type` property (e.g., "Course", "Chapter", "Author")
   - Enables filtering nodes by category

2. **Edge Relationship Types**
   - Edges now have a `type` property (e.g., "CONTAINS", "AUTHOR_OF")
   - Multiple edges can share the same type
   - Enables filtering edges by relationship type

3. **Auto-generated IDs**
   - Nodes and edges auto-generate UUIDs if not provided
   - Allows deterministic IDs for testing

4. **Graph Traversal**
   - `traverse()` method to find paths between nodes
   - Supports BFS (shortest path) and DFS

5. **DAG Validation**
   - `isDAG()` method to check for cycles

### 🧪 Test Data

- **`complex-graph.json`** - Updated to new format with 8 Person nodes and 10 edges
- **`education-graph.json`** - New test data with:
  - 2 Courses (Python, NodeJS)
  - 4 Authors (2 per course)
  - 1 Publisher (shared)
  - 13 Chapters (6 Python, 7 NodeJS)
  - 39 Sections
  - 4 Exams (2 per course)
  - 14 Tests
  - 4 Tags
  - Edge types: CONTAINS, AUTHOR_OF, PUBLISHED_BY, TAGGED_WITH

### 🧪 Test Coverage

- **Graph.test.ts** - 74 tests (added 7 new tests for `isDAG()`)
- **ComplexGraph.test.ts** - Updated for new API
- **EducationGraph.test.ts** - 37 new tests for education domain

---

## [1.0.0] - Previous

- Initial release with name-based node/edge identification
