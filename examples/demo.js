const { Graph } = require('../dist/index.js');

console.log('=== Simple GraphDB Demo ===\n');

// Create a new graph
const graph = new Graph();

console.log('1. Creating nodes...');
graph.addNode('Alice', { age: 30, city: 'NYC' });
graph.addNode('Bob', { age: 25, city: 'LA' });
graph.addNode('Charlie', { age: 35, city: 'Chicago' });
console.log('   Created 3 nodes: Alice, Bob, Charlie\n');

console.log('2. Creating edges (relationships)...');
graph.addEdge('Alice-likes-Bob', 'Alice', 'Bob', { since: 2020 });
graph.addEdge('Bob-loves-Charlie', 'Bob', 'Charlie', { intensity: 'high' });
graph.addEdge('Charlie-works-with-Alice', 'Charlie', 'Alice', { project: 'Alpha' });
console.log('   Created 3 edges\n');

console.log('3. Node properties:');
for (const node of graph.getNodes()) {
  console.log(`   ${node.name}:`, node.properties);
}
console.log();

console.log('4. Navigation - Children of Alice:');
const aliceChildren = graph.getChildren('Alice');
console.log(`   Alice's children: ${aliceChildren.map((n) => n.name).join(', ')}\n`);

console.log('5. Navigation - Parents of Charlie:');
const charlieParents = graph.getParents('Charlie');
console.log(`   Charlie's parents: ${charlieParents.map((n) => n.name).join(', ')}\n`);

console.log('6. Navigation - Edges from Bob:');
const bobOutgoing = graph.getEdgesFrom('Bob');
console.log(`   Bob's outgoing edges: ${bobOutgoing.map((e) => e.name).join(', ')}\n`);

console.log('7. Navigation - Edges to Charlie:');
const charlieIncoming = graph.getEdgesTo('Charlie');
console.log(`   Edges to Charlie: ${charlieIncoming.map((e) => e.name).join(', ')}\n`);

console.log('8. Serialization:');
const data = graph.toJSON();
console.log('   Graph data:', JSON.stringify(data, null, 2));
console.log();

console.log('9. Restoring graph from data:');
const restored = Graph.fromJSON(data);
console.log(`   Restored ${restored.getNodes().length} nodes and ${restored.getEdges().length} edges\n`);

console.log('10. Cascade delete demo:');
console.log('   Removing Alice with cascade=true...');
const removed = graph.removeNode('Alice', true);
console.log(`   Alice removed: ${removed}`);
console.log(`   Remaining nodes: ${graph.getNodes().map((n) => n.name).join(', ')}`);
console.log(`   Remaining edges: ${graph.getEdges().map((e) => e.name).join(', ')}\n`);

console.log('=== Demo Complete ===');
