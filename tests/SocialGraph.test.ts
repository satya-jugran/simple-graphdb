import { beforeAll, describe, expect, it } from '@jest/globals';
import { Graph } from '../src/index';
import type { Node, Edge } from '../src/index';

/**
 * Facebook-like Social Graph Test Suite
 * 
 * Graph Structure:
 * - 10 People: Alice, Bob, Charlie, David, Eve, Frank, Grace, Henry, Ivan, Julia
 * - 7 Posts: Hello World, Check This Link, Happy Birthday, Weekend Plans, Travel Story, Work Update, Memory Lane
 * - 5 Photos: Beach Vacation, Party Night, Graduation Day, Food Festival, Mountain Hike
 * - 20 Comments distributed across posts and photos
 * 
 * This is a comprehensive regression test that creates the entire graph from scratch.
 */
describe('Facebook Social Graph', () => {
  let graph: Graph;
  
  // Node collections for easy access
  let people: Record<string, Node>;
  let posts: Record<string, Node>;
  let photos: Record<string, Node>;
  let comments: Record<string, Node>;
  
  beforeAll(() => {
    graph = new Graph();
    
    // Initialize collections
    people = {};
    posts = {};
    photos = {};
    comments = {};
    
    // ========================================
    // CREATE PEOPLE (10 nodes)
    // ========================================
    people.alice = graph.addNode('Person', { name: 'Alice', age: 28, city: 'NYC', occupation: 'Engineer' });
    people.bob = graph.addNode('Person', { name: 'Bob', age: 25, city: 'LA', occupation: 'Designer' });
    people.charlie = graph.addNode('Person', { name: 'Charlie', age: 32, city: 'Chicago', occupation: 'Manager' });
    people.david = graph.addNode('Person', { name: 'David', age: 29, city: 'Seattle', occupation: 'Developer' });
    people.eve = graph.addNode('Person', { name: 'Eve', age: 27, city: 'Boston', occupation: 'Data Scientist' });
    people.frank = graph.addNode('Person', { name: 'Frank', age: 35, city: 'Austin', occupation: 'Director' });
    people.grace = graph.addNode('Person', { name: 'Grace', age: 26, city: 'Denver', occupation: 'Designer' });
    people.henry = graph.addNode('Person', { name: 'Henry', age: 31, city: 'Portland', occupation: 'Engineer' });
    people.ivan = graph.addNode('Person', { name: 'Ivan', age: 30, city: 'Phoenix', occupation: 'Analyst' });
    people.julia = graph.addNode('Person', { name: 'Julia', age: 28, city: 'Miami', occupation: 'Marketing' });
    
    // ========================================
    // CREATE POSTS (7 nodes)
    // ========================================
    posts.hello = graph.addNode('Post', { 
      content: 'Just joined the social network!', 
      timestamp: '2024-01-01',
      type: 'status'
    });
    posts.link = graph.addNode('Post', { 
      content: 'Interesting article about graphs', 
      timestamp: '2024-02-15',
      type: 'link'
    });
    posts.birthday = graph.addNode('Post', { 
      content: 'Wishing everyone a great day!', 
      timestamp: '2024-03-20',
      type: 'status'
    });
    posts.weekend = graph.addNode('Post', { 
      content: 'Any recommendations for a weekend getaway?', 
      timestamp: '2024-04-10',
      type: 'question'
    });
    posts.travel = graph.addNode('Post', { 
      content: 'My amazing trip to Europe', 
      timestamp: '2024-05-25',
      type: 'travel'
    });
    posts.work = graph.addNode('Post', { 
      content: 'Excited about the new project launch', 
      timestamp: '2024-06-18',
      type: 'work'
    });
    posts.memory = graph.addNode('Post', { 
      content: 'Remember when we all met?', 
      timestamp: '2024-07-01',
      type: 'memory'
    });
    
    // ========================================
    // CREATE PHOTOS (5 nodes)
    // ========================================
    photos.beach = graph.addNode('Photo', { 
      caption: 'Amazing day at the beach!', 
      date: '2024-06-15',
      location: 'Hawaii'
    });
    photos.party = graph.addNode('Photo', { 
      caption: 'Friday night vibes', 
      date: '2024-07-20',
      location: 'LA'
    });
    photos.graduation = graph.addNode('Photo', { 
      caption: 'We made it!', 
      date: '2024-05-30',
      location: 'Boston'
    });
    photos.food = graph.addNode('Photo', { 
      caption: 'Yummy food!', 
      date: '2024-08-10',
      location: 'NYC'
    });
    photos.mountain = graph.addNode('Photo', { 
      caption: 'Conquered the peak!', 
      date: '2024-07-05',
      location: 'Rocky Mountains'
    });
    
    // ========================================
    // CREATE COMMENTS (20 nodes)
    // ========================================
    comments.c1 = graph.addNode('Comment', { content: 'Welcome to the network!', date: '2024-01-01' });
    comments.c2 = graph.addNode('Comment', { content: 'Congrats on joining!', date: '2024-01-02' });
    comments.c3 = graph.addNode('Comment', { content: 'Great read, thanks for sharing!', date: '2024-02-16' });
    comments.c4 = graph.addNode('Comment', { content: 'I agree with this!', date: '2024-02-17' });
    comments.c5 = graph.addNode('Comment', { content: 'Very informative post.', date: '2024-02-18' });
    comments.c6 = graph.addNode('Comment', { content: 'Happy birthday to you too!', date: '2024-03-21' });
    comments.c7 = graph.addNode('Comment', { content: 'Wish you all the best!', date: '2024-03-22' });
    comments.c8 = graph.addNode('Comment', { content: 'Thanks for the birthday wishes!', date: '2024-03-23' });
    comments.c9 = graph.addNode('Comment', { content: 'Try the mountains!', date: '2024-04-11' });
    comments.c10 = graph.addNode('Comment', { content: 'Beach is always a good choice.', date: '2024-04-12' });
    comments.c11 = graph.addNode('Comment', { content: 'Europe sounds amazing!', date: '2024-05-26' });
    comments.c12 = graph.addNode('Comment', { content: 'Good luck with the launch!', date: '2024-06-19' });
    comments.c13 = graph.addNode('Comment', { content: 'Stunning beach!', date: '2024-06-16' });
    comments.c14 = graph.addNode('Comment', { content: 'Looks like a fun party!', date: '2024-07-21' });
    comments.c15 = graph.addNode('Comment', { content: 'Congrats on graduation!', date: '2024-05-31' });
    comments.c16 = graph.addNode('Comment', { content: 'What a feast!', date: '2024-08-11' });
    comments.c17 = graph.addNode('Comment', { content: 'Great hike!', date: '2024-07-06' });
    comments.c18 = graph.addNode('Comment', { content: 'Wish I was there!', date: '2024-06-17' });
    comments.c19 = graph.addNode('Comment', { content: 'You guys look great!', date: '2024-07-22' });
    comments.c20 = graph.addNode('Comment', { content: 'Beautiful scenery!', date: '2024-05-31' });
    
    // ========================================
    // CREATE FRIENDSHIP RELATIONSHIPS (28 edges - bidirectional)
    // ========================================
    // Alice friendships (Alice->X and X->Alice)
    graph.addEdge(people.alice.id, people.bob.id, 'FRIENDS_WITH', { since: 2020, context: 'college' });
    graph.addEdge(people.bob.id, people.alice.id, 'FRIENDS_WITH', { since: 2020, context: 'college' });
    graph.addEdge(people.alice.id, people.charlie.id, 'FRIENDS_WITH', { since: 2019, context: 'work' });
    graph.addEdge(people.charlie.id, people.alice.id, 'FRIENDS_WITH', { since: 2019, context: 'work' });
    graph.addEdge(people.alice.id, people.eve.id, 'FRIENDS_WITH', { since: 2021, context: 'neighbors' });
    graph.addEdge(people.eve.id, people.alice.id, 'FRIENDS_WITH', { since: 2021, context: 'neighbors' });
    graph.addEdge(people.alice.id, people.julia.id, 'FRIENDS_WITH', { since: 2018, context: 'highschool' });
    graph.addEdge(people.julia.id, people.alice.id, 'FRIENDS_WITH', { since: 2018, context: 'highschool' });
    
    // Bob friendships
    graph.addEdge(people.bob.id, people.charlie.id, 'FRIENDS_WITH', { since: 2020, context: 'gym' });
    graph.addEdge(people.charlie.id, people.bob.id, 'FRIENDS_WITH', { since: 2020, context: 'gym' });
    graph.addEdge(people.bob.id, people.david.id, 'FRIENDS_WITH', { since: 2019, context: 'coding' });
    graph.addEdge(people.david.id, people.bob.id, 'FRIENDS_WITH', { since: 2019, context: 'coding' });
    
    // Charlie friendships
    graph.addEdge(people.charlie.id, people.frank.id, 'FRIENDS_WITH', { since: 2018, context: 'business' });
    graph.addEdge(people.frank.id, people.charlie.id, 'FRIENDS_WITH', { since: 2018, context: 'business' });
    
    // David friendships
    graph.addEdge(people.david.id, people.grace.id, 'FRIENDS_WITH', { since: 2022, context: 'hiking' });
    graph.addEdge(people.grace.id, people.david.id, 'FRIENDS_WITH', { since: 2022, context: 'hiking' });
    
    // Eve friendships
    graph.addEdge(people.eve.id, people.frank.id, 'FRIENDS_WITH', { since: 2020, context: 'bookclub' });
    graph.addEdge(people.frank.id, people.eve.id, 'FRIENDS_WITH', { since: 2020, context: 'bookclub' });
    graph.addEdge(people.eve.id, people.grace.id, 'FRIENDS_WITH', { since: 2021, context: 'yoga' });
    graph.addEdge(people.grace.id, people.eve.id, 'FRIENDS_WITH', { since: 2021, context: 'yoga' });
    
    // Frank friendships
    graph.addEdge(people.frank.id, people.ivan.id, 'FRIENDS_WITH', { since: 2019, context: 'mentor' });
    graph.addEdge(people.ivan.id, people.frank.id, 'FRIENDS_WITH', { since: 2019, context: 'mentor' });
    
    // Grace friendships
    graph.addEdge(people.grace.id, people.henry.id, 'FRIENDS_WITH', { since: 2021, context: 'photography' });
    graph.addEdge(people.henry.id, people.grace.id, 'FRIENDS_WITH', { since: 2021, context: 'photography' });
    
    // Henry friendships
    graph.addEdge(people.henry.id, people.julia.id, 'FRIENDS_WITH', { since: 2020, context: 'music' });
    graph.addEdge(people.julia.id, people.henry.id, 'FRIENDS_WITH', { since: 2020, context: 'music' });
    
    // Ivan friendships
    graph.addEdge(people.ivan.id, people.julia.id, 'FRIENDS_WITH', { since: 2019, context: 'travel' });
    graph.addEdge(people.julia.id, people.ivan.id, 'FRIENDS_WITH', { since: 2019, context: 'travel' });
    
    // Total: 28 FRIENDS_WITH edges (bidirectional)
    
    // ========================================
    // CREATE POSTED RELATIONSHIPS (7 edges)
    // ========================================
    graph.addEdge(people.alice.id, posts.hello.id, 'POSTED', { timestamp: '2024-01-01T10:00:00Z' });
    graph.addEdge(people.bob.id, posts.link.id, 'POSTED', { timestamp: '2024-02-15T14:30:00Z' });
    graph.addEdge(people.charlie.id, posts.birthday.id, 'POSTED', { timestamp: '2024-03-20T08:15:00Z' });
    graph.addEdge(people.david.id, posts.weekend.id, 'POSTED', { timestamp: '2024-04-10T19:45:00Z' });
    graph.addEdge(people.eve.id, posts.travel.id, 'POSTED', { timestamp: '2024-05-25T16:20:00Z' });
    graph.addEdge(people.frank.id, posts.work.id, 'POSTED', { timestamp: '2024-06-18T11:00:00Z' });
    graph.addEdge(people.julia.id, posts.memory.id, 'POSTED', { timestamp: '2024-07-01T22:30:00Z' });
    
    // ========================================
    // CREATE PHOTO_UPLOADED RELATIONSHIPS (5 edges)
    // ========================================
    graph.addEdge(people.alice.id, photos.beach.id, 'PHOTO_UPLOADED', { timestamp: '2024-06-15T18:00:00Z' });
    graph.addEdge(people.bob.id, photos.party.id, 'PHOTO_UPLOADED', { timestamp: '2024-07-20T23:00:00Z' });
    graph.addEdge(people.charlie.id, photos.graduation.id, 'PHOTO_UPLOADED', { timestamp: '2024-05-30T20:00:00Z' });
    graph.addEdge(people.grace.id, photos.food.id, 'PHOTO_UPLOADED', { timestamp: '2024-08-10T13:30:00Z' });
    graph.addEdge(people.ivan.id, photos.mountain.id, 'PHOTO_UPLOADED', { timestamp: '2024-07-05T15:45:00Z' });
    
    // ========================================
    // CREATE LIKES_POST RELATIONSHIPS (20 edges)
    // ========================================
    // Post: Hello World (4 likes)
    graph.addEdge(people.bob.id, posts.hello.id, 'LIKES_POST', { timestamp: '2024-01-02T09:00:00Z' });
    graph.addEdge(people.charlie.id, posts.hello.id, 'LIKES_POST', { timestamp: '2024-01-02T10:30:00Z' });
    graph.addEdge(people.david.id, posts.hello.id, 'LIKES_POST', { timestamp: '2024-01-02T11:00:00Z' });
    graph.addEdge(people.eve.id, posts.hello.id, 'LIKES_POST', { timestamp: '2024-01-02T12:15:00Z' });
    
    // Post: Check This Link (3 likes)
    graph.addEdge(people.alice.id, posts.link.id, 'LIKES_POST', { timestamp: '2024-02-16T08:00:00Z' });
    graph.addEdge(people.charlie.id, posts.link.id, 'LIKES_POST', { timestamp: '2024-02-16T09:30:00Z' });
    graph.addEdge(people.grace.id, posts.link.id, 'LIKES_POST', { timestamp: '2024-02-16T10:00:00Z' });
    
    // Post: Happy Birthday (3 likes)
    graph.addEdge(people.alice.id, posts.birthday.id, 'LIKES_POST', { timestamp: '2024-03-21T07:00:00Z' });
    graph.addEdge(people.bob.id, posts.birthday.id, 'LIKES_POST', { timestamp: '2024-03-21T08:30:00Z' });
    graph.addEdge(people.frank.id, posts.birthday.id, 'LIKES_POST', { timestamp: '2024-03-21T09:00:00Z' });
    
    // Post: Weekend Plans (2 likes)
    graph.addEdge(people.grace.id, posts.weekend.id, 'LIKES_POST', { timestamp: '2024-04-11T08:00:00Z' });
    graph.addEdge(people.henry.id, posts.weekend.id, 'LIKES_POST', { timestamp: '2024-04-11T09:30:00Z' });
    
    // Post: Travel Story (2 likes)
    graph.addEdge(people.ivan.id, posts.travel.id, 'LIKES_POST', { timestamp: '2024-05-26T17:00:00Z' });
    graph.addEdge(people.julia.id, posts.travel.id, 'LIKES_POST', { timestamp: '2024-05-26T18:30:00Z' });
    
    // Post: Work Update (2 likes)
    graph.addEdge(people.alice.id, posts.work.id, 'LIKES_POST', { timestamp: '2024-06-19T12:00:00Z' });
    graph.addEdge(people.eve.id, posts.work.id, 'LIKES_POST', { timestamp: '2024-06-19T13:30:00Z' });
    
    // Post: Memory Lane (2 likes)
    graph.addEdge(people.david.id, posts.memory.id, 'LIKES_POST', { timestamp: '2024-07-02T08:00:00Z' });
    graph.addEdge(people.grace.id, posts.memory.id, 'LIKES_POST', { timestamp: '2024-07-02T09:30:00Z' });
    
    // Total: 20 LIKES_POST edges
    
    // ========================================
    // CREATE LIKES_PHOTO RELATIONSHIPS (9 edges)
    // ========================================
    // Photo: Beach (3 likes)
    graph.addEdge(people.david.id, photos.beach.id, 'LIKES_PHOTO', { timestamp: '2024-06-16T08:00:00Z' });
    graph.addEdge(people.eve.id, photos.beach.id, 'LIKES_PHOTO', { timestamp: '2024-06-16T09:30:00Z' });
    graph.addEdge(people.grace.id, photos.beach.id, 'LIKES_PHOTO', { timestamp: '2024-06-16T10:00:00Z' });
    
    // Photo: Party (2 likes)
    graph.addEdge(people.alice.id, photos.party.id, 'LIKES_PHOTO', { timestamp: '2024-07-21T08:00:00Z' });
    graph.addEdge(people.charlie.id, photos.party.id, 'LIKES_PHOTO', { timestamp: '2024-07-21T09:30:00Z' });
    
    // Photo: Graduation (2 likes)
    graph.addEdge(people.henry.id, photos.graduation.id, 'LIKES_PHOTO', { timestamp: '2024-05-31T21:00:00Z' });
    graph.addEdge(people.julia.id, photos.graduation.id, 'LIKES_PHOTO', { timestamp: '2024-05-31T22:30:00Z' });
    
    // Photo: Food (1 like)
    graph.addEdge(people.bob.id, photos.food.id, 'LIKES_PHOTO', { timestamp: '2024-08-11T14:00:00Z' });
    
    // Photo: Mountain (1 like)
    graph.addEdge(people.eve.id, photos.mountain.id, 'LIKES_PHOTO', { timestamp: '2024-07-06T16:00:00Z' });
    
    // Total: 9 LIKES_PHOTO edges
    
    // ========================================
    // CREATE COMMENTED_ON_POST + ON_POST RELATIONSHIPS (24 edges)
    // ========================================
    // Post: Hello World has comments C1, C2
    graph.addEdge(people.bob.id, comments.c1.id, 'COMMENTED_ON_POST', { timestamp: '2024-01-01T11:00:00Z' });
    graph.addEdge(comments.c1.id, posts.hello.id, 'ON_POST', {});
    
    graph.addEdge(people.david.id, comments.c2.id, 'COMMENTED_ON_POST', { timestamp: '2024-01-02T14:00:00Z' });
    graph.addEdge(comments.c2.id, posts.hello.id, 'ON_POST', {});
    
    // Post: Check This Link has comments C3, C4, C5
    graph.addEdge(people.eve.id, comments.c3.id, 'COMMENTED_ON_POST', { timestamp: '2024-02-16T11:00:00Z' });
    graph.addEdge(comments.c3.id, posts.link.id, 'ON_POST', {});
    
    graph.addEdge(people.grace.id, comments.c4.id, 'COMMENTED_ON_POST', { timestamp: '2024-02-17T09:00:00Z' });
    graph.addEdge(comments.c4.id, posts.link.id, 'ON_POST', {});
    
    graph.addEdge(people.alice.id, comments.c5.id, 'COMMENTED_ON_POST', { timestamp: '2024-02-18T16:00:00Z' });
    graph.addEdge(comments.c5.id, posts.link.id, 'ON_POST', {});
    
    // Post: Happy Birthday has comments C6, C7, C8
    graph.addEdge(people.bob.id, comments.c6.id, 'COMMENTED_ON_POST', { timestamp: '2024-03-21T10:00:00Z' });
    graph.addEdge(comments.c6.id, posts.birthday.id, 'ON_POST', {});
    
    graph.addEdge(people.charlie.id, comments.c7.id, 'COMMENTED_ON_POST', { timestamp: '2024-03-22T08:30:00Z' });
    graph.addEdge(comments.c7.id, posts.birthday.id, 'ON_POST', {});
    
    graph.addEdge(people.david.id, comments.c8.id, 'COMMENTED_ON_POST', { timestamp: '2024-03-23T15:00:00Z' });
    graph.addEdge(comments.c8.id, posts.birthday.id, 'ON_POST', {});
    
    // Post: Weekend Plans has comments C9, C10
    graph.addEdge(people.eve.id, comments.c9.id, 'COMMENTED_ON_POST', { timestamp: '2024-04-11T12:00:00Z' });
    graph.addEdge(comments.c9.id, posts.weekend.id, 'ON_POST', {});
    
    graph.addEdge(people.frank.id, comments.c10.id, 'COMMENTED_ON_POST', { timestamp: '2024-04-12T09:00:00Z' });
    graph.addEdge(comments.c10.id, posts.weekend.id, 'ON_POST', {});
    
    // Post: Travel Story has comment C11
    graph.addEdge(people.ivan.id, comments.c11.id, 'COMMENTED_ON_POST', { timestamp: '2024-05-26T19:00:00Z' });
    graph.addEdge(comments.c11.id, posts.travel.id, 'ON_POST', {});
    
    // Post: Work Update has comment C12
    graph.addEdge(people.julia.id, comments.c12.id, 'COMMENTED_ON_POST', { timestamp: '2024-06-19T14:00:00Z' });
    graph.addEdge(comments.c12.id, posts.work.id, 'ON_POST', {});
    
    // ========================================
    // CREATE COMMENTED_ON_PHOTO + ON_PHOTO RELATIONSHIPS (16 edges)
    // ========================================
    // Photo: Beach has comments C13, C18
    graph.addEdge(people.alice.id, comments.c13.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-06-16T19:00:00Z' });
    graph.addEdge(comments.c13.id, photos.beach.id, 'ON_PHOTO', {});
    
    graph.addEdge(people.grace.id, comments.c18.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-06-17T10:00:00Z' });
    graph.addEdge(comments.c18.id, photos.beach.id, 'ON_PHOTO', {});
    
    // Photo: Party has comments C14, C19
    graph.addEdge(people.charlie.id, comments.c14.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-07-21T08:00:00Z' });
    graph.addEdge(comments.c14.id, photos.party.id, 'ON_PHOTO', {});
    
    graph.addEdge(people.henry.id, comments.c19.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-07-22T09:30:00Z' });
    graph.addEdge(comments.c19.id, photos.party.id, 'ON_PHOTO', {});
    
    // Photo: Graduation has comments C15, C20
    graph.addEdge(people.david.id, comments.c15.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-05-31T21:00:00Z' });
    graph.addEdge(comments.c15.id, photos.graduation.id, 'ON_PHOTO', {});
    
    graph.addEdge(people.ivan.id, comments.c20.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-05-31T22:00:00Z' });
    graph.addEdge(comments.c20.id, photos.graduation.id, 'ON_PHOTO', {});
    
    // Photo: Food has comment C16
    graph.addEdge(people.eve.id, comments.c16.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-08-11T14:30:00Z' });
    graph.addEdge(comments.c16.id, photos.food.id, 'ON_PHOTO', {});
    
    // Photo: Mountain has comment C17
    graph.addEdge(people.frank.id, comments.c17.id, 'COMMENTED_ON_PHOTO', { timestamp: '2024-07-06T17:00:00Z' });
    graph.addEdge(comments.c17.id, photos.mountain.id, 'ON_PHOTO', {});
  });

  // ========================================
  // A. GRAPH STRUCTURE TESTS
  // ========================================
  describe('A. Graph Structure', () => {
    it('should have exactly 42 nodes total', () => {
      expect(graph.getNodes()).toHaveLength(42);
    });

    it('should have exactly 10 people', () => {
      const peopleNodes = graph.getNodesByType('Person');
      expect(peopleNodes).toHaveLength(10);
    });

    it('should have exactly 7 posts', () => {
      const postNodes = graph.getNodesByType('Post');
      expect(postNodes).toHaveLength(7);
    });

    it('should have exactly 5 photos', () => {
      const photoNodes = graph.getNodesByType('Photo');
      expect(photoNodes).toHaveLength(5);
    });

    it('should have exactly 20 comments', () => {
      const commentNodes = graph.getNodesByType('Comment');
      expect(commentNodes).toHaveLength(20);
    });

    it('should have all 10 people with correct names', () => {
      const peopleNodes = graph.getNodesByType('Person');
      const names = peopleNodes.map(n => n.properties.name as string).sort();
      expect(names).toEqual([
        'Alice', 'Bob', 'Charlie', 'David', 'Eve',
        'Frank', 'Grace', 'Henry', 'Ivan', 'Julia'
      ]);
    });

    it('should have correct properties for Alice', () => {
      expect(people.alice.properties.name).toBe('Alice');
      expect(people.alice.properties.age).toBe(28);
      expect(people.alice.properties.city).toBe('NYC');
      expect(people.alice.properties.occupation).toBe('Engineer');
    });

    it('should have correct properties for Charlie', () => {
      expect(people.charlie.properties.name).toBe('Charlie');
      expect(people.charlie.properties.age).toBe(32);
      expect(people.charlie.properties.city).toBe('Chicago');
    });

    it('should verify node IDs are unique', () => {
      const allNodes = graph.getNodes();
      const ids = allNodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allNodes.length);
    });
  });

  // ========================================
  // B. FRIENDSHIP NETWORK TESTS
  // ========================================
  describe('B. Friendship Network', () => {
    it('should have 28 friendship edges (bidirectional)', () => {
      const friendships = graph.getEdgesByType('FRIENDS_WITH');
      expect(friendships).toHaveLength(28);
    });

    it('should verify Alice has 4 friends', () => {
      const aliceFriends = graph.getChildren(people.alice.id, { edgeType: 'FRIENDS_WITH' });
      expect(aliceFriends).toHaveLength(4);
      const friendNames = aliceFriends.map(n => n.properties.name).sort();
      expect(friendNames).toEqual(expect.arrayContaining(['Bob', 'Charlie', 'Eve', 'Julia']));
    });

    it('should verify Bob has 3 friends', () => {
      const bobFriends = graph.getChildren(people.bob.id, { edgeType: 'FRIENDS_WITH' });
      expect(bobFriends).toHaveLength(3);
      const friendNames = bobFriends.map(n => n.properties.name).sort();
      expect(friendNames).toEqual(expect.arrayContaining(['Alice', 'Charlie', 'David']));
    });

    it('should find Alice is friend with Bob', () => {
      const aliceChildren = graph.getChildren(people.alice.id, { edgeType: 'FRIENDS_WITH' });
      const bobAsFriend = aliceChildren.find(n => n.properties.name === 'Bob');
      expect(bobAsFriend).toBeDefined();
    });

    it('should find Bob has Alice as a parent friend (incoming edge)', () => {
      const bobParents = graph.getParents(people.bob.id, { edgeType: 'FRIENDS_WITH' });
      const aliceAsFriend = bobParents.find(n => n.properties.name === 'Alice');
      expect(aliceAsFriend).toBeDefined();
    });

    it('should find the most social person (most friendships)', () => {
      const allPeople = graph.getNodesByType('Person');
      let maxFriends = 0;
      let mostSocial: string = '';
      
      for (const person of allPeople) {
        const friends = graph.getChildren(person.id, { edgeType: 'FRIENDS_WITH' });
        if (friends.length > maxFriends) {
          maxFriends = friends.length;
          mostSocial = person.properties.name as string;
        }
      }
      
      expect(mostSocial).toBe('Alice');
      expect(maxFriends).toBe(4);
    });

    it('should get friends of friends for Alice (2nd degree connections)', () => {
      const aliceFriends = graph.getChildren(people.alice.id, { edgeType: 'FRIENDS_WITH' });
      const friendsOfFriends = new Set<string>();
      
      for (const friend of aliceFriends) {
        const theirFriends = graph.getChildren(friend.id, { edgeType: 'FRIENDS_WITH' });
        for (const fof of theirFriends) {
          if (fof.properties.name !== 'Alice') {
            friendsOfFriends.add(fof.properties.name as string);
          }
        }
      }
      
      // Alice's friends: Bob, Charlie, Eve, Julia
      // Friends of friends should include David, Frank, Grace, Henry, Ivan
      expect(friendsOfFriends.size).toBeGreaterThanOrEqual(4);
    });
  });

  // ========================================
  // C. CONTENT POSTING TESTS
  // ========================================
  describe('C. Content & Posting', () => {
    it('should have 7 posted edges', () => {
      const postedEdges = graph.getEdgesByType('POSTED');
      expect(postedEdges).toHaveLength(7);
    });

    it('should have 5 photo uploaded edges', () => {
      const uploadedEdges = graph.getEdgesByType('PHOTO_UPLOADED');
      expect(uploadedEdges).toHaveLength(5);
    });

    it('should find Alice as author of Hello World post', () => {
      const helloParents = graph.getParents(posts.hello.id, { edgeType: 'POSTED' });
      expect(helloParents).toHaveLength(1);
      expect(helloParents[0].properties.name).toBe('Alice');
    });

    it('should find Charlie as author of Birthday post', () => {
      const birthdayParents = graph.getParents(posts.birthday.id, { edgeType: 'POSTED' });
      expect(birthdayParents).toHaveLength(1);
      expect(birthdayParents[0].properties.name).toBe('Charlie');
    });

    it('should find Alice as uploader of Beach photo', () => {
      const beachParents = graph.getParents(photos.beach.id, { edgeType: 'PHOTO_UPLOADED' });
      expect(beachParents).toHaveLength(1);
      expect(beachParents[0].properties.name).toBe('Alice');
    });

    it('should find Grace as uploader of Food photo', () => {
      const foodParents = graph.getParents(photos.food.id, { edgeType: 'PHOTO_UPLOADED' });
      expect(foodParents).toHaveLength(1);
      expect(foodParents[0].properties.name).toBe('Grace');
    });

    it('should find all posts by Alice', () => {
      const aliceChildren = graph.getChildren(people.alice.id, { edgeType: 'POSTED' });
      expect(aliceChildren).toHaveLength(1);
      expect(aliceChildren[0].properties.content).toContain('Just joined');
    });

    it('should have posts with correct timestamps', () => {
      const workPost = graph.getChildren(people.frank.id, { edgeType: 'POSTED' })[0];
      expect(workPost.properties.timestamp).toBe('2024-06-18');
    });
  });

  // ========================================
  // D. LIKES & ENGAGEMENT TESTS
  // ========================================
  describe('D. Likes & Engagement', () => {
    it('should have 18 likes on posts', () => {
      const likesOnPosts = graph.getEdgesByType('LIKES_POST');
      expect(likesOnPosts).toHaveLength(18);
    });

    it('should have 9 likes on photos', () => {
      const likesOnPhotos = graph.getEdgesByType('LIKES_PHOTO');
      expect(likesOnPhotos).toHaveLength(9);
    });

    it('should find Hello World post has 4 likes', () => {
      const helloLikes = graph.getEdgesTo(posts.hello.id, { edgeType: 'LIKES_POST' });
      expect(helloLikes).toHaveLength(4);
    });

    it('should find Beach photo has 3 likes', () => {
      const beachLikes = graph.getEdgesTo(photos.beach.id, { edgeType: 'LIKES_PHOTO' });
      expect(beachLikes).toHaveLength(3);
    });

    it('should find most liked post (Hello World with 4)', () => {
      const allPosts = graph.getNodesByType('Post');
      let maxLikes = 0;
      let mostLikedPost: string = '';
      
      for (const post of allPosts) {
        const likes = graph.getEdgesTo(post.id, { edgeType: 'LIKES_POST' });
        if (likes.length > maxLikes) {
          maxLikes = likes.length;
          mostLikedPost = post.properties.content as string;
        }
      }
      
      expect(mostLikedPost).toContain('Just joined');
      expect(maxLikes).toBe(4);
    });

    it('should find who liked the Travel Story post', () => {
      const travelLikers = graph.getEdgesTo(posts.travel.id, { edgeType: 'LIKES_POST' });
      const likerNames = travelLikers.map(e => {
        const liker = graph.getNode(e.sourceId);
        return liker?.properties.name;
      });
      
      expect(likerNames).toContain('Ivan');
      expect(likerNames).toContain('Julia');
    });

    it('should verify Alice liked the Check This Link post', () => {
      const aliceLikes = graph.getEdgesFrom(people.alice.id, { edgeType: 'LIKES_POST' });
      const likedLink = aliceLikes.some(e => e.targetId === posts.link.id);
      expect(likedLink).toBe(true);
    });

    it('should find person who liked most posts', () => {
      const allPeople = graph.getNodesByType('Person');
      let maxLikes = 0;
      let mostActiveLiker: string = '';
      
      for (const person of allPeople) {
        const likes = graph.getEdgesFrom(person.id, { edgeType: 'LIKES_POST' });
        if (likes.length > maxLikes) {
          maxLikes = likes.length;
          mostActiveLiker = person.properties.name as string;
        }
      }
      
      expect(maxLikes).toBeGreaterThanOrEqual(3);
    });
  });

  // ========================================
  // E. COMMENTS TESTS
  // ========================================
  describe('E. Comments', () => {
    it('should have 12 commented on post edges', () => {
      const commentPostEdges = graph.getEdgesByType('COMMENTED_ON_POST');
      expect(commentPostEdges).toHaveLength(12);
    });

    it('should have 12 on post edges', () => {
      const onPostEdges = graph.getEdgesByType('ON_POST');
      expect(onPostEdges).toHaveLength(12);
    });

    it('should have 8 commented on photo edges', () => {
      const commentPhotoEdges = graph.getEdgesByType('COMMENTED_ON_PHOTO');
      expect(commentPhotoEdges).toHaveLength(8);
    });

    it('should have 8 on photo edges', () => {
      const onPhotoEdges = graph.getEdgesByType('ON_PHOTO');
      expect(onPhotoEdges).toHaveLength(8);
    });

    it('should find Hello World post has 2 comments', () => {
      // Find comments ON this post - ON_POST edges go from Comment to Post
      const commentsOnHello = graph.getParents(posts.hello.id, { edgeType: 'ON_POST' });
      expect(commentsOnHello).toHaveLength(2);
    });

    it('should find Happy Birthday post has 3 comments', () => {
      const commentsOnBirthday = graph.getParents(posts.birthday.id, { edgeType: 'ON_POST' });
      expect(commentsOnBirthday).toHaveLength(3);
    });

    it('should find Beach photo has 2 comments', () => {
      const commentsOnBeach = graph.getParents(photos.beach.id, { edgeType: 'ON_PHOTO' });
      expect(commentsOnBeach).toHaveLength(2);
    });

    it('should have comments with correct content', () => {
      // Find comment C1
      const c1 = comments.c1;
      expect(c1.properties.content).toBe('Welcome to the network!');
    });

    it('should find who commented on Check This Link post', () => {
      // Get comments on the post - ON_POST goes from Comment to Post
      const commentsOnPost = graph.getParents(posts.link.id, { edgeType: 'ON_POST' });
      const commenterIds = commentsOnPost.map(c => {
        // Find who made this comment - COMMENTED_ON_POST goes from Person to Comment
        const parents = graph.getParents(c.id, { edgeType: 'COMMENTED_ON_POST' });
        return parents[0]?.id;
      }).filter(id => id);
      
      const commenterNames = commenterIds.map(id => {
        const person = graph.getNode(id);
        return person?.properties.name;
      });
      
      expect(commenterNames).toContain('Eve');
      expect(commenterNames).toContain('Grace');
      expect(commenterNames).toContain('Alice');
    });

    it('should find most commented post has 3 comments', () => {
      const allPosts = graph.getNodesByType('Post');
      let maxComments = 0;
      
      for (const post of allPosts) {
        const commentsOnPost = graph.getParents(post.id, { edgeType: 'ON_POST' });
        if (commentsOnPost.length > maxComments) {
          maxComments = commentsOnPost.length;
        }
      }
      
      expect(maxComments).toBe(3);
    });

    it('should find Bob commented on Hello World', () => {
      // Bob should have a comment edge to some comment on Hello World
      const bobComments = graph.getChildren(people.bob.id, { edgeType: 'COMMENTED_ON_POST' });
      // Hello Comments are parents of the post (ON_POST goes Comment -> Post)
      const helloComments = graph.getParents(posts.hello.id, { edgeType: 'ON_POST' });
      const helloCommentIds = new Set(helloComments.map(c => c.id));
      
      const bobCommentedOnHello = bobComments.some(c => helloCommentIds.has(c.id));
      expect(bobCommentedOnHello).toBe(true);
    });
  });

  // ========================================
  // F. COMPLEX TRAVERSAL QUERY TESTS
  // ========================================
  describe('F. Complex Traversal Queries', () => {
    it('should find path from Alice to David via friends (Alice -> Bob -> David)', () => {
      // Alice -> Bob -> David
      const paths = graph.traverse(people.alice.id, people.david.id, { 
        method: 'bfs',
        edgeTypes: ['FRIENDS_WITH']
      });
      
      // Path should exist since: Alice -> Bob (FRIENDS_WITH), Bob -> David (FRIENDS_WITH)
      expect(paths).not.toBeNull();
      if (paths) {
        expect(paths.length).toBeGreaterThan(0);
        // Verify path contains Alice and David
        expect(paths[0]).toContain(people.alice.id);
        expect(paths[0]).toContain(people.david.id);
      }
    });

    it('should find path from Ivan to Alice via friendships', () => {
      // Ivan -> Julia -> Alice OR Ivan -> Frank -> Charlie -> Alice
      const paths = graph.traverse(people.ivan.id, people.alice.id, {
        method: 'bfs',
        edgeTypes: ['FRIENDS_WITH']
      });
      
      expect(paths).not.toBeNull();
      if (paths) {
        expect(paths.length).toBeGreaterThan(0);
        // Ivan should reach Alice within 4 hops
        expect(paths[0].length).toBeLessThanOrEqual(4);
      }
    });

    it('should find all people who liked Alice posts', () => {
      // Step 1: Find all posts by Alice
      const alicePosts = graph.getChildren(people.alice.id, { edgeType: 'POSTED' });
      const likerNames = new Set<string>();
      
      // Step 2: For each post, find who liked it
      for (const post of alicePosts) {
        const likes = graph.getEdgesTo(post.id, { edgeType: 'LIKES_POST' });
        for (const like of likes) {
          const liker = graph.getNode(like.sourceId);
          likerNames.add(liker!.properties.name as string);
        }
      }
      
      // Alice's posts: Hello World
      // Hello World was liked by: Bob, Charlie, David, Eve
      expect(likerNames.size).toBeGreaterThanOrEqual(3);
    });

    it('should find all comments on Bob uploaded photos', () => {
      // Step 1: Find photos uploaded by Bob
      const bobPhotos = graph.getChildren(people.bob.id, { edgeType: 'PHOTO_UPLOADED' });
      
      let totalComments = 0;
      for (const photo of bobPhotos) {
        // ON_PHOTO edges go from Comment to Photo, so use getParents
        const photoComments = graph.getParents(photo.id, { edgeType: 'ON_PHOTO' });
        totalComments += photoComments.length;
      }
      
      // Bob uploaded Party photo which has 2 comments
      expect(bobPhotos.length).toBe(1);
      expect(totalComments).toBe(2);
    });

    it('should find mutual friends between Alice and Frank', () => {
      // Alice's friends: Bob, Charlie, Eve, Julia
      // Frank's friends: Charlie, Eve, Ivan
      // Mutual: Charlie, Eve
      
      const aliceFriends = graph.getChildren(people.alice.id, { edgeType: 'FRIENDS_WITH' });
      const frankFriends = graph.getChildren(people.frank.id, { edgeType: 'FRIENDS_WITH' });
      
      const aliceFriendIds = new Set(aliceFriends.map(n => n.id));
      const mutualFriends = frankFriends.filter(n => aliceFriendIds.has(n.id));
      const mutualNames = mutualFriends.map(n => n.properties.name);
      
      expect(mutualNames).toContain('Charlie');
      expect(mutualNames).toContain('Eve');
      expect(mutualNames).toHaveLength(2);
    });

    it('should traverse from person to their engagement (likes + comments)', () => {
      // Find Grace's engagement on the network
      const graceLikes = graph.getEdgesFrom(people.grace.id, { edgeType: 'LIKES_POST' });
      const graceComments = graph.getChildren(people.grace.id, { edgeType: 'COMMENTED_ON_POST' });
      
      // Grace should have liked multiple posts and commented on some
      expect(graceLikes.length).toBeGreaterThanOrEqual(3);
      expect(graceComments.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================
  // G. SERIALIZATION ROUND-TRIP TESTS
  // ========================================
  describe('G. Serialization Round-trip', () => {
    it('should serialize graph to JSON correctly', () => {
      const json = graph.toJSON();
      
      expect(json.nodes).toBeDefined();
      expect(json.edges).toBeDefined();
      expect(json.nodes).toHaveLength(42);
      expect(json.edges.length).toBeGreaterThan(60);
    });

    it('should preserve all node types during serialization', () => {
      const json = graph.toJSON();
      
      const personNodes = json.nodes.filter(n => n.type === 'Person');
      const postNodes = json.nodes.filter(n => n.type === 'Post');
      const photoNodes = json.nodes.filter(n => n.type === 'Photo');
      const commentNodes = json.nodes.filter(n => n.type === 'Comment');
      
      expect(personNodes).toHaveLength(10);
      expect(postNodes).toHaveLength(7);
      expect(photoNodes).toHaveLength(5);
      expect(commentNodes).toHaveLength(20);
    });

    it('should reconstruct graph from JSON with all nodes intact', () => {
      const json = graph.toJSON();
      const reconstructed = Graph.fromJSON(json);
      
      expect(reconstructed.getNodes()).toHaveLength(42);
      expect(reconstructed.getEdges().length).toBeGreaterThan(60);
    });

    it('should preserve relationships after serialization', () => {
      const json = graph.toJSON();
      const reconstructed = Graph.fromJSON(json);
      
      // Find Alice's friends in reconstructed graph
      const aliceNode = reconstructed.getNodes().find(n => n.properties.name === 'Alice');
      expect(aliceNode).toBeDefined();
      
      const aliceFriends = reconstructed.getChildren(aliceNode!.id, { edgeType: 'FRIENDS_WITH' });
      expect(aliceFriends.length).toBe(4);
    });

    it('should preserve node properties after serialization', () => {
      const json = graph.toJSON();
      const reconstructed = Graph.fromJSON(json);
      
      const charlieNode = reconstructed.getNodes().find(n => n.properties.name === 'Charlie');
      expect(charlieNode?.properties.age).toBe(32);
      expect(charlieNode?.properties.city).toBe('Chicago');
      expect(charlieNode?.properties.occupation).toBe('Manager');
    });

    it('should preserve edge properties after serialization', () => {
      const json = graph.toJSON();
      const reconstructed = Graph.fromJSON(json);
      
      const friendshipEdges = reconstructed.getEdgesByType('FRIENDS_WITH');
      const aliceBobEdge = friendshipEdges.find(e => {
        const source = reconstructed.getNode(e.sourceId);
        const target = reconstructed.getNode(e.targetId);
        return source?.properties.name === 'Alice' && target?.properties.name === 'Bob';
      });
      
      expect(aliceBobEdge?.properties.since).toBe(2020);
      expect(aliceBobEdge?.properties.context).toBe('college');
    });

    it('should handle empty graph serialization', () => {
      const emptyGraph = new Graph();
      const json = emptyGraph.toJSON();
      
      expect(json.nodes).toHaveLength(0);
      expect(json.edges).toHaveLength(0);
      
      const reconstructed = Graph.fromJSON(json);
      expect(reconstructed.getNodes()).toHaveLength(0);
    });
  });

  // ========================================
  // H. EDGE CASES AND ERROR HANDLING
  // ========================================
  describe('H. Edge Cases', () => {
    it('should return undefined for non-existent node', () => {
      const node = graph.getNode('non-existent-id');
      expect(node).toBeUndefined();
    });

    it('should return undefined for non-existent edge', () => {
      const edge = graph.getEdge('non-existent-edge-id');
      expect(edge).toBeUndefined();
    });

    it('should find node by property value', () => {
      const results = graph.getNodesByProperty('name', 'Grace');
      expect(results).toHaveLength(1);
      expect(results[0].properties.city).toBe('Denver');
    });

    it('should find nodes by type with multiple results', () => {
      const allPersons = graph.getNodesByType('Person');
      expect(allPersons.length).toBe(10);
    });

    it('should return empty for getNodesByProperty with no matches', () => {
      const results = graph.getNodesByProperty('name', 'NonExistent');
      expect(results).toHaveLength(0);
    });

    it('should filter edges by type correctly', () => {
      const allEdges = graph.getEdges();
      const friendships = graph.getEdgesByType('FRIENDS_WITH');
      const likesPost = graph.getEdgesByType('LIKES_POST');
      
      expect(allEdges.length).toBeGreaterThan(friendships.length);
      expect(friendships).toHaveLength(28);
      expect(likesPost).toHaveLength(18);
    });

    it('should get direct edges between two nodes', () => {
      const aliceBobEdges = graph.getDirectEdgesBetween(people.alice.id, people.bob.id);
      expect(aliceBobEdges.length).toBeGreaterThanOrEqual(1);
      expect(aliceBobEdges[0].type).toBe('FRIENDS_WITH');
    });
  });

  // ========================================
  // I. GRAPH ALGORITHM TESTS  
  // ========================================
  describe('I. Graph Algorithm Tests', () => {
    it('should run isDAG and get valid boolean result', () => {
      // The graph may or may not be a DAG depending on friendships
      const isDAG = graph.isDAG();
      expect(typeof isDAG).toBe('boolean');
    });

    it('should find paths from one person to another when path exists', () => {
      // Alice -> Bob exists, so path should be found
      const paths = graph.traverse(people.alice.id, people.bob.id, { method: 'bfs' });
      expect(paths).not.toBeNull();
      expect(paths!.length).toBeGreaterThan(0);
    });

    it('should return null when no path exists between disconnected nodes', () => {
      // Note: This test depends on graph structure
      // If all nodes are connected, this test would need adjustment
      const result = graph.traverse(people.alice.id, people.david.id, { method: 'bfs' });
      // Result could be null or array depending on whether path exists with default edge types
      expect(result === null || Array.isArray(result)).toBe(true);
    });

    it('should handle edge type filtering in traversal', () => {
      // Traverse only FRIENDS_WITH edges from Alice
      const paths = graph.traverse(people.alice.id, people.bob.id, {
        method: 'bfs',
        edgeTypes: ['FRIENDS_WITH']
      });
      
      // Alice -> Bob is a FRIENDS_WITH edge, so path should exist
      expect(paths).not.toBeNull();
    });

    it('should handle node type filtering in traversal', () => {
      // Find path from Alice to David (both Person nodes)
      const paths = graph.traverse(people.alice.id, people.david.id, {
        method: 'bfs',
        nodeTypes: ['Person']
      });
      
      // Result should be null or array
      expect(paths === null || Array.isArray(paths)).toBe(true);
    });
  });

  // ========================================
  // J. CLEAR OPERATION (must be last)
  // ========================================
  describe('J. Node and Edge Removal Operations', () => {
    it('should return false when removing non-existent node', () => {
      expect(graph.removeNode('fake-id')).toBe(false);
    });

    it('should return false when removing non-existent edge', () => {
      expect(graph.removeEdge('fake-edge-id')).toBe(false);
    });

    it('should remove an edge and verify it is deleted', () => {
      // Get initial edge count
      const initialEdgeCount = graph.getEdges().length;
      
      // Find a FRIENDS_WITH edge
      const friendshipEdge = graph.getEdgesByType('FRIENDS_WITH')[0];
      expect(friendshipEdge).toBeDefined();
      
      // Remove the edge
      const result = graph.removeEdge(friendshipEdge.id);
      expect(result).toBe(true);
      
      // Verify edge is gone
      expect(graph.getEdge(friendshipEdge.id)).toBeUndefined();
      expect(graph.getEdges().length).toBe(initialEdgeCount - 1);
    });

    it('should remove a node without cascade (preserve edges)', () => {
      // Get initial counts
      const initialNodeCount = graph.getNodes().length;
      const initialEdgeCount = graph.getEdges().length;
      
      // Create a simple node with no connections
      const standaloneNode = graph.addNode('Test', { name: 'standalone' });
      
      // Remove it
      const result = graph.removeNode(standaloneNode.id);
      expect(result).toBe(true);
      
      // Verify node is gone
      expect(graph.getNode(standaloneNode.id)).toBeUndefined();
      expect(graph.getNodes().length).toBe(initialNodeCount);
    });

    it('should remove a node with cascade (remove all incident edges)', () => {
      // Get initial counts
      const initialNodeCount = graph.getNodes().length;
      const initialEdgeCount = graph.getEdges().length;
      
      // Alice has many connections - find her
      const alice = graph.getNodes().find(n => n.properties.name === 'Alice');
      expect(alice).toBeDefined();
      
      // Count Alice's incident edges
      const aliceOutgoing = graph.getEdgesFrom(alice!.id).length;
      const aliceIncoming = graph.getEdgesTo(alice!.id).length;
      const aliceTotalEdges = aliceOutgoing + aliceIncoming;
      
      // Remove with cascade
      const result = graph.removeNode(alice!.id, true);
      expect(result).toBe(true);
      
      // Verify node is gone
      expect(graph.getNode(alice!.id)).toBeUndefined();
      
      // Verify node count decreased by 1
      expect(graph.getNodes().length).toBe(initialNodeCount - 1);
      
      // Verify edge count decreased by the incident edges
      expect(graph.getEdges().length).toBe(initialEdgeCount - aliceTotalEdges);
    });

    it('should verify node removal affects relationship queries', () => {
      // After removing Alice in previous test, verify relationships changed
      const bob = graph.getNodes().find(n => n.properties.name === 'Bob');
      expect(bob).toBeDefined();
      
      // Bob's friendships should be different now
      const bobFriends = graph.getChildren(bob!.id, { edgeType: 'FRIENDS_WITH' });
      const friendNames = bobFriends.map(n => n.properties.name);
      
      // Alice should no longer be in Bob's friends
      expect(friendNames).not.toContain('Alice');
    });

    it('should clear graph completely', () => {
      graph.clear();
      expect(graph.getNodes()).toHaveLength(0);
      expect(graph.getEdges()).toHaveLength(0);
    });
  });
});
