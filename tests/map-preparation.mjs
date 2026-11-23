import assert from 'node:assert/strict';
import {createRoadSelection} from '../outputs/domestic-test/building-assets/road-selection.js';
const roads=[{editId:'a',grade:1},{editId:'b',grade:2}];
const m=createRoadSelection(roads);m.select('a');m.select('b',true);m.group();m.setGrade(0);
assert.deepEqual(m.snapshot().roads,{a:{grade:0},b:{grade:0}});
const restored=createRoadSelection(roads,m.snapshot());restored.select('b');assert.equal(restored.selected.size,2);assert.equal(restored.grade,0);
restored.setGrade(3);assert.equal(restored.grade,3);
console.log('Map preparation: grouping, pedestrian conversion, saved restoration passed.');
