import { beforeEach, describe, expect, it } from '@jest/globals';
import { Graph } from '../src/index';
import educationGraphData from './data/education-graph.json';

describe('Education Graph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = Graph.fromJSON(educationGraphData);
  });

  describe('Graph Structure', () => {
    it('should have 2 courses', () => {
      const courses = graph.getNodesByType('Course');
      expect(courses).toHaveLength(2);
    });

    it('should have 4 authors', () => {
      const authors = graph.getNodesByType('Author');
      expect(authors).toHaveLength(4);
    });

    it('should have 1 publisher', () => {
      const publishers = graph.getNodesByType('Publisher');
      expect(publishers).toHaveLength(1);
    });

    it('should have 6 chapters for Python', () => {
      const pythonCourse = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(pythonCourse!.id).filter(n => n.type === 'Chapter');
      expect(chapters).toHaveLength(6);
    });

    it('should have 7 chapters for NodeJS', () => {
      const nodejsCourse = graph.getNodes().find(n => n.properties.name === 'NodeJS');
      const chapters = graph.getChildren(nodejsCourse!.id).filter(n => n.type === 'Chapter');
      expect(chapters).toHaveLength(7);
    });

    it('should have 4 tags', () => {
      const tags = graph.getNodesByType('Tag');
      expect(tags).toHaveLength(4);
    });
  });

  describe('Course Content', () => {
    it('should have correct Python course properties', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      expect(python?.properties.duration).toBe(40);
    });

    it('should have correct NodeJS course properties', () => {
      const nodejs = graph.getNodes().find(n => n.properties.name === 'NodeJS');
      expect(nodejs?.properties.duration).toBe(35);
    });

    it('should have chapters with order property', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      const orderedChapters = chapters.sort((a, b) =>
        (a.properties.order as number) - (b.properties.order as number)
      );
      expect(orderedChapters[0]?.properties.name).toBe('Python Basics');
      expect(orderedChapters[4]?.properties.name).toBe('OOP');
      expect(orderedChapters[5]?.properties.name).toBe('Modules');
    });
  });

  describe('Chapters and Sections', () => {
    it('should have sections within Python chapters', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      const firstChapter = chapters.find(n => n.properties.name === 'Python Basics');
      const sections = graph.getChildren(firstChapter!.id);
      expect(sections).toHaveLength(3);
    });

    it('should have at least 2 sections per chapter', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      
      for (const chapter of chapters) {
        const sections = graph.getChildren(chapter.id);
        expect(sections.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have sections with duration property', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      const firstChapter = chapters.find(n => n.properties.name === 'Python Basics');
      const sections = graph.getChildren(firstChapter!.id);
      expect(sections[0]?.properties.duration).toBeDefined();
    });
  });

  describe('Exams and Tests', () => {
    it('should have 2 exams per course', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const exams = graph.getChildren(python!.id).filter(n => n.type === 'Exam');
      expect(exams).toHaveLength(2);
    });

    it('should have 3-4 tests per Python exam', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const exams = graph.getChildren(python!.id).filter(n => n.type === 'Exam');
      
      for (const exam of exams) {
        const tests = graph.getChildren(exam.id).filter(n => n.type === 'Test');
        expect(tests.length).toBeGreaterThanOrEqual(3);
        expect(tests.length).toBeLessThanOrEqual(4);
      }
    });

    it('should have tests with questions property', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const exams = graph.getChildren(python!.id).filter(n => n.type === 'Exam');
      const firstExam = exams[0];
      const tests = graph.getChildren(firstExam!.id);
      expect(tests[0]?.properties.questions).toBeDefined();
    });
  });

  describe('Authors and Publishers', () => {
    it('should have 2 authors per course', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const nodejs = graph.getNodes().find(n => n.properties.name === 'NodeJS');
      
      const pythonAuthors = graph.getParents(python!.id).filter(n => n.type === 'Author');
      const nodejsAuthors = graph.getParents(nodejs!.id).filter(n => n.type === 'Author');
      
      expect(pythonAuthors).toHaveLength(2);
      expect(nodejsAuthors).toHaveLength(2);
    });

    it('should have correct author names', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const authors = graph.getParents(python!.id).filter(n => n.type === 'Author');
      const authorNames = authors.map(a => a.properties.name);
      expect(authorNames).toContain('John Doe');
      expect(authorNames).toContain('Jane Smith');
    });

    it('should share same publisher for both courses', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const nodejs = graph.getNodes().find(n => n.properties.name === 'NodeJS');
      
      const pythonPublishers = graph.getParents(python!.id).filter(n => n.type === 'Publisher');
      const nodejsPublishers = graph.getParents(nodejs!.id).filter(n => n.type === 'Publisher');
      
      expect(pythonPublishers).toHaveLength(1);
      expect(nodejsPublishers).toHaveLength(1);
      expect(pythonPublishers[0]?.id).toBe(nodejsPublishers[0]?.id);
    });

    it('should have correct publisher name', () => {
      const publisher = graph.getNodesByType('Publisher')[0];
      expect(publisher?.properties.name).toBe("O'Reilly Media");
    });
  });

  describe('Tags', () => {
    it('should tag courses with programming tags', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const tags = graph.getChildren(python!.id).filter(n => n.type === 'Tag');
      const tagNames = tags.map(t => t.properties.name);
      
      expect(tagNames).toContain('Programming');
      expect(tagNames).toContain('Backend');
    });

    it('should tag NodeJS with web development tags', () => {
      const nodejs = graph.getNodes().find(n => n.properties.name === 'NodeJS');
      const tags = graph.getChildren(nodejs!.id).filter(n => n.type === 'Tag');
      const tagNames = tags.map(t => t.properties.name);
      
      expect(tagNames).toContain('Programming');
      expect(tagNames).toContain('Backend');
      expect(tagNames).toContain('Frontend');
      expect(tagNames).toContain('Web Development');
    });

    it('should have correct tag names', () => {
      const tags = graph.getNodesByType('Tag');
      const tagNames = tags.map(t => t.properties.name).sort();
      expect(tagNames).toEqual(['Backend', 'Frontend', 'Programming', 'Web Development']);
    });
  });

  describe('Edge Types', () => {
    it('should have CONTAINS edges for course content', () => {
      const containsEdges = graph.getEdgesByType('CONTAINS');
      expect(containsEdges.length).toBeGreaterThan(0);
    });

    it('should have AUTHOR_OF edges for authors', () => {
      const authorEdges = graph.getEdgesByType('AUTHOR_OF');
      expect(authorEdges).toHaveLength(4);
    });

    it('should have PUBLISHED_BY edges for publisher', () => {
      const publishedEdges = graph.getEdgesByType('PUBLISHED_BY');
      expect(publishedEdges).toHaveLength(2);
    });

    it('should have TAGGED_WITH edges for tags', () => {
      const taggedEdges = graph.getEdgesByType('TAGGED_WITH');
      expect(taggedEdges).toHaveLength(6);
    });
  });

  describe('traverse()', () => {
    it('should find path from course to chapter', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      const firstChapter = chapters[0];
      
      const path = graph.traverse(python!.id, firstChapter!.id, { method: 'bfs' });
      expect(path).toEqual([python!.id, firstChapter!.id]);
    });

    it('should find path from course to section (multi-hop)', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      const firstChapter = chapters[0];
      const sections = graph.getChildren(firstChapter!.id);
      const firstSection = sections[0];
      
      const path = graph.traverse(python!.id, firstSection!.id, { method: 'bfs' });
      expect(path).toEqual([python!.id, firstChapter!.id, firstSection!.id]);
    });

    it('should find path from course to exam', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const exams = graph.getChildren(python!.id).filter(n => n.type === 'Exam');
      const firstExam = exams[0];
      
      const path = graph.traverse(python!.id, firstExam!.id, { method: 'bfs' });
      expect(path).toEqual([python!.id, firstExam!.id]);
    });

    it('should find path from exam to test', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const exams = graph.getChildren(python!.id).filter(n => n.type === 'Exam');
      const firstExam = exams[0];
      const tests = graph.getChildren(firstExam!.id);
      const firstTest = tests[0];
      
      const path = graph.traverse(firstExam!.id, firstTest!.id, { method: 'bfs' });
      expect(path).toEqual([firstExam!.id, firstTest!.id]);
    });

    it('should find path from author to course', () => {
      const author = graph.getNodes().find(n => n.properties.name === 'John Doe');
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      
      const path = graph.traverse(author!.id, python!.id, { method: 'bfs' });
      expect(path).toEqual([author!.id, python!.id]);
    });

    it('should find path from publisher to course', () => {
      const publisher = graph.getNodes().find(n => n.properties.name === "O'Reilly Media");
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      
      const path = graph.traverse(publisher!.id, python!.id, { method: 'bfs' });
      expect(path).toEqual([publisher!.id, python!.id]);
    });

    it('should find path from course to tag', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const tags = graph.getChildren(python!.id).filter(n => n.type === 'Tag');
      const firstTag = tags[0];
      
      const path = graph.traverse(python!.id, firstTag!.id, { method: 'bfs' });
      expect(path).toEqual([python!.id, firstTag!.id]);
    });

    it('should return null when no path exists', () => {
      // From one course's exam to another course's chapter (no connection)
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const pythonExams = graph.getChildren(python!.id).filter(n => n.type === 'Exam');
      const pythonExam = pythonExams[0];
      
      const nodejs = graph.getNodes().find(n => n.properties.name === 'NodeJS');
      const nodejsChapters = graph.getChildren(nodejs!.id).filter(n => n.type === 'Chapter');
      const nodejsChapter = nodejsChapters[0];
      
      const path = graph.traverse(pythonExam!.id, nodejsChapter!.id, { method: 'bfs' });
      expect(path).toBeNull();
    });

    it('should use DFS traversal', () => {
      const python = graph.getNodes().find(n => n.properties.name === 'Python');
      const chapters = graph.getChildren(python!.id).filter(n => n.type === 'Chapter');
      const firstChapter = chapters[0];
      
      const path = graph.traverse(python!.id, firstChapter!.id, { method: 'dfs' });
      expect(path).toEqual([python!.id, firstChapter!.id]);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const data = graph.toJSON();
      const restored = Graph.fromJSON(data);
      
      expect(restored.getNodesByType('Course')).toHaveLength(2);
      expect(restored.getNodesByType('Author')).toHaveLength(4);
      expect(restored.getNodesByType('Publisher')).toHaveLength(1);
      expect(restored.getNodesByType('Chapter')).toHaveLength(13);
      expect(restored.getNodesByType('Section')).toHaveLength(39);
      expect(restored.getNodesByType('Exam')).toHaveLength(4);
      expect(restored.getNodesByType('Test')).toHaveLength(14);
    });

    it('should maintain edge types through serialization', () => {
      const data = graph.toJSON();
      const restored = Graph.fromJSON(data);
      
      const containsEdges = restored.getEdgesByType('CONTAINS');
      expect(containsEdges.length).toBeGreaterThan(0);
    });
  });
});
