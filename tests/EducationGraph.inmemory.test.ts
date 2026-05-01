import { describe } from '@jest/globals';
import { Graph } from '../src/index';
import { runEducationGraphScenarios } from './shared/graphScenarios';
import educationGraphData from './data/education-graph.json';

describe('Education Graph (InMemory)', () => {
  runEducationGraphScenarios(async () => {
    return await Graph.importJSON(educationGraphData);
  });
});
