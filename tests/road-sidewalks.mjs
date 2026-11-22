import assert from 'node:assert/strict';
import {attachSidewalks} from '../outputs/domestic-test/building-assets/road-sidewalks.js';
import {focusedRoads} from '../outputs/domestic-test/building-assets/road-map.js';
const main={editId:'main',grade:3,width:12,sidewalkEachSide:3,properties:{class:'primary',width:12},geometry:{type:'LineString',coordinates:[[-60,0],[60,0]]}};
const walk={editId:'walk',grade:0,width:2.2,properties:{class:'path',subclass:'footway'},geometry:{type:'LineString',coordinates:[[-50,8],[50,8]]}};
const result=attachSidewalks([main,walk]);assert.deepEqual(result[1].sidewalkParents,['main']);assert.equal(focusedRoads(result,100).length,1);assert.equal(walk.sidewalkParents,undefined,'Original input preserved');
for(const props of [{subclass:'steps'},{subclass:'cycleway'},{name:'공원길'},{layer:1},{footway:'crossing'}])assert.equal(attachSidewalks([main,{...walk,properties:{...walk.properties,...props}}])[1].sidewalkParents,undefined);
assert.equal(attachSidewalks([main,{...walk,grade:1,gradeSource:'user'}])[1].sidewalkParents,undefined);
console.log('Roadside sidewalk selection exclusion, independent paths, steps, crossing, grade separation and manual edits passed');
