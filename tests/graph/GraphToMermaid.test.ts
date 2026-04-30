import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph, GraphToMermaid } from '../../src/index';

describe('GraphToMermaid', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe('constructor', () => {
    it('should create from a Graph instance', () => {
      const nodeId = graph.addNode('Person', { name: 'Alice' }).id;
      graph.addNode('Person', { name: 'Bob' });
      graph.addEdge(nodeId, graph.getNodes()[1].id, 'KNOWS');

      const mermaid = new GraphToMermaid(graph);
      expect(mermaid.toString()).toContain('flowchart TD');
      expect(mermaid.toString()).toContain('Person');
    });

    it('should create from a JSON string', () => {
      const jsonData = JSON.stringify({
        nodes: [
          { id: 'node1', type: 'Course', properties: { name: 'Test' } },
        ],
        edges: [],
      });

      const mermaid = new GraphToMermaid(jsonData);
      expect(mermaid.toString()).toContain('flowchart TD');
    });
  });

  describe('toString', () => {
    it('should generate mermaid syntax for an empty graph', () => {
      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      expect(result).toBe('flowchart TD');
    });

    it('should generate node definitions with id and type', () => {
      const courseId = graph.addNode('Course', { name: 'Python' }).id;
      const chapterId = graph.addNode('Chapter', { name: 'Basics' }).id;
      graph.addEdge(courseId, chapterId, 'CONTAINS');

      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      expect(result).toContain('Course');
      expect(result).toContain('Chapter');
      expect(result).toContain('CONTAINS');
    });

    it('should use node id as identifier', () => {
      const course = graph.addNode('Course', { name: 'Python' });
      const chapter = graph.addNode('Chapter', { name: 'Basics' });

      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      // Node id should appear in the output (as part of the label)
      expect(result).toContain(course.id);
    });

    it('should generate directed edges with labels', () => {
      const sourceId = graph.addNode('Course', { name: 'Python' }).id;
      const targetId = graph.addNode('Chapter', { name: 'Basics' }).id;
      graph.addEdge(sourceId, targetId, 'CONTAINS');

      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      expect(result).toContain('-->|"CONTAINS"|');
    });

    it('should generate directed edges without labels when includeEdgeLabels is false', () => {
      const sourceId = graph.addNode('Course', { name: 'Python' }).id;
      const targetId = graph.addNode('Chapter', { name: 'Basics' }).id;
      graph.addEdge(sourceId, targetId, 'CONTAINS');

      const mermaid = new GraphToMermaid(graph, { includeEdgeLabels: false });
      const result = mermaid.toString();

      expect(result).toContain('-->');
      expect(result).not.toContain('CONTAINS');
    });

    it('should respect direction option TD (top-down)', () => {
      const nodeId = graph.addNode('Course', {}).id;

      const mermaid = new GraphToMermaid(graph, { direction: 'TD' });
      const result = mermaid.toString();

      expect(result).toContain('flowchart TD');
    });

    it('should respect direction option LR (left-right)', () => {
      const nodeId = graph.addNode('Course', {}).id;

      const mermaid = new GraphToMermaid(graph, { direction: 'LR' });
      const result = mermaid.toString();

      expect(result).toContain('flowchart LR');
    });
  });

  describe('node label formatting', () => {
    it('should not include properties by default', () => {
      graph.addNode('Course', { name: 'Python', duration: 40 });

      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      expect(result).toContain('Course');
      // The label should just be "Course | <id>" without property content
      expect(result).not.toMatch(/Course.*duration/);
    });

    it('should include properties when showProperties is true', () => {
      graph.addNode('Course', { name: 'Python', duration: 40 });

      const mermaid = new GraphToMermaid(graph, { showProperties: true });
      const result = mermaid.toString();

      expect(result).toContain('duration');
      expect(result).toContain('40');
    });

    it('should limit properties to first 3 when showProperties is true', () => {
      graph.addNode('Course', {
        prop1: 'a',
        prop2: 'b',
        prop3: 'c',
        prop4: 'd',
        prop5: 'e',
      });

      const mermaid = new GraphToMermaid(graph, { showProperties: true });
      const result = mermaid.toString();

      expect(result).toContain('prop1');
      expect(result).toContain('prop2');
      expect(result).toContain('prop3');
      expect(result).not.toContain('prop4');
      expect(result).not.toContain('prop5');
    });
  });

  describe('id sanitization', () => {
    it('should handle special characters in node ids via JSON constructor', () => {
      const jsonData = JSON.stringify({
        nodes: [
          { id: 'node-with-dashes', type: 'Course', properties: {} },
          { id: 'node_with_underscores', type: 'Course', properties: {} },
          { id: 'node.with.dots', type: 'Course', properties: {} },
        ],
        edges: [],
      });

      const mermaid = new GraphToMermaid(jsonData);
      const result = mermaid.toString();

      // Should not throw and should contain sanitized ids (dots converted to underscores)
      expect(result).toContain('node-with-dashes');
      expect(result).toContain('node_with_underscores');
      expect(result).toContain('node_with_dots');
    });

    it('should escape spaces and special characters via JSON constructor', () => {
      const jsonData = JSON.stringify({
        nodes: [
          { id: 'node with spaces', type: 'Course', properties: {} },
        ],
        edges: [],
      });

      const mermaid = new GraphToMermaid(jsonData);
      const result = mermaid.toString();

      expect(result).toContain('node_with_spaces');
    });
  });

  describe('edge cases', () => {
    it('should handle nodes without edges', () => {
      graph.addNode('Course', { name: 'Python' });
      graph.addNode('Chapter', { name: 'Basics' });

      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      expect(result).toContain('Course');
      expect(result).toContain('Chapter');
    });

    it('should handle multiple edges from same source', () => {
      const courseId = graph.addNode('Course', {}).id;
      const ch1 = graph.addNode('Chapter', { name: 'Ch1' }).id;
      const ch2 = graph.addNode('Chapter', { name: 'Ch2' }).id;
      const ch3 = graph.addNode('Chapter', { name: 'Ch3' }).id;

      graph.addEdge(courseId, ch1, 'CONTAINS');
      graph.addEdge(courseId, ch2, 'CONTAINS');
      graph.addEdge(courseId, ch3, 'CONTAINS');

      const mermaid = new GraphToMermaid(graph);
      const result = mermaid.toString();

      const containsCount = (result.match(/CONTAINS/g) || []).length;
      expect(containsCount).toBe(3);
    });
  });

  describe('integration with Graph serialization', () => {
    it('should work with Graph.exportJSON() output', () => {
      const courseId = graph.addNode('Course', { name: 'Python' }).id;
      const chapterId = graph.addNode('Chapter', { name: 'Basics' }).id;
      graph.addEdge(courseId, chapterId, 'CONTAINS');

      const jsonData = graph.exportJSON();
      const mermaid = new GraphToMermaid(JSON.stringify(jsonData));
      const result = mermaid.toString();

      expect(result).toContain('Course');
      expect(result).toContain('Chapter');
      expect(result).toContain('CONTAINS');
    });
  });
});
