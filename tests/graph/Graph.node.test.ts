import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../../src/index';

describe('Graph.Node Operations', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  it('should add a node without properties', () => {
    const node = graph.addNode('Person', { name: 'Alice' });
    expect(node.id).toBeDefined();
    expect(node.type).toBe('Person');
    expect(node.properties.name).toBe('Alice');
    expect(node.properties).toEqual({ name: 'Alice' });
  });

  it('should add a node with properties', () => {
    const properties = { name: 'Alice', age: 30, city: 'NYC' };
    const node = graph.addNode('Person', properties);
    expect(node.id).toBeDefined();
    expect(node.type).toBe('Person');
    expect(node.properties).toEqual({ name: 'Alice', age: 30, city: 'NYC' });
  });

  it('should retrieve a node by id', () => {
    const node = graph.addNode('Person', { name: 'Alice', age: 30 });
    const retrieved = graph.getNode(node.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(node.id);
    expect(retrieved?.properties.age).toBe(30);
  });

  it('should return undefined for non-existent node', () => {
    const node = graph.getNode('non-existent-id');
    expect(node).toBeUndefined();
  });

  it('should check if node exists by id', () => {
    const node = graph.addNode('Person', { name: 'Alice' });
    expect(graph.hasNode(node.id)).toBe(true);
    expect(graph.hasNode('non-existent-id')).toBe(false);
  });

  it('should remove a node', () => {
    const node = graph.addNode('Person', { name: 'Alice' });
    expect(graph.removeNode(node.id)).toBe(true);
    expect(graph.hasNode(node.id)).toBe(false);
  });

  it('should return false when removing non-existent node', () => {
    expect(graph.removeNode('non-existent-id')).toBe(false);
  });

  it('should cascade remove incident edges when removing node', () => {
    const alice = graph.addNode('Person', { name: 'Alice' });
    const bob = graph.addNode('Person', { name: 'Bob' });
    const edge1 = graph.addEdge(alice.id, bob.id, 'KNOWS');
    const edge2 = graph.addEdge(bob.id, alice.id, 'LIKES');

    graph.removeNode(alice.id, true);

    expect(graph.hasNode(alice.id)).toBe(false);
    expect(graph.hasEdge(edge1.id)).toBe(false);
    expect(graph.hasEdge(edge2.id)).toBe(false);
  });

  it('should not cascade remove edges by default', () => {
    const alice = graph.addNode('Person', { name: 'Alice' });
    const bob = graph.addNode('Person', { name: 'Bob' });
    const edge = graph.addEdge(alice.id, bob.id, 'KNOWS');

    graph.removeNode(alice.id);

    expect(graph.hasNode(alice.id)).toBe(false);
    expect(graph.hasEdge(edge.id)).toBe(true);
  });

  it('should get all nodes', () => {
    graph.addNode('Person', { name: 'Alice' });
    graph.addNode('Person', { name: 'Bob' });
    graph.addNode('Person', { name: 'Charlie' });

    const nodes = graph.getNodes();
    expect(nodes).toHaveLength(3);
  });

  it('should get nodes by type', () => {
    graph.addNode('Person', { name: 'Alice' });
    graph.addNode('Person', { name: 'Bob' });
    graph.addNode('Course', { name: 'Python' });

    const people = graph.getNodesByType('Person');
    expect(people).toHaveLength(2);
    expect(people.map(n => n.properties.name).sort()).toEqual(['Alice', 'Bob']);
  });

  it('should get nodes by property', () => {
    graph.addNode('Person', { name: 'Alice', age: 30 });
    graph.addNode('Person', { name: 'Bob', age: 25 });
    graph.addNode('Person', { name: 'Charlie', age: 30 });

    const thirties = graph.getNodesByProperty('age', 30);
    expect(thirties).toHaveLength(2);
    expect(thirties.map(n => n.properties.name).sort()).toEqual(['Alice', 'Charlie']);
  });

  it('should return empty array when property value does not match', () => {
    graph.addNode('Person', { name: 'Alice', age: 30 });
    graph.addNode('Person', { name: 'Bob', age: 25 });

    const nonexistent = graph.getNodesByProperty('age', 50);
    expect(nonexistent).toHaveLength(0);
  });

  it('should find nodes by string property value', () => {
    graph.addNode('Person', { name: 'Alice', city: 'NYC' });
    graph.addNode('Person', { name: 'Bob', city: 'LA' });
    graph.addNode('Person', { name: 'Charlie', city: 'NYC' });

    const nycResidents = graph.getNodesByProperty('city', 'NYC');
    expect(nycResidents).toHaveLength(2);
    expect(nycResidents.map(n => n.properties.name).sort()).toEqual(['Alice', 'Charlie']);
  });
});
