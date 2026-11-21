import assert from 'node:assert/strict';
import {validateSceneEdits,nearestRoad,primaryBuildingRing} from '../outputs/domestic-test/building-assets/scene-edit-store.js';
const edits={roads:{a:{grade:2}},buildings:{7:{floors:4,era:'new',styleIndex:3,frontEdge:2,use:'mixed'}}};
assert.equal(validateSceneEdits(edits),edits);
for(const floors of [0,2.5,201,NaN])assert.throws(()=>validateSceneEdits({roads:{},buildings:{7:{floors}}}));
assert.throws(()=>validateSceneEdits({roads:{a:{grade:5}},buildings:{}}));
for(const bad of [{roads:[],buildings:{}},{roads:{},buildings:[]},{roads:{},buildings:{7:[]}}])assert.throws(()=>validateSceneEdits(bad));
const roads=[{editId:'a',width:7.1,geometry:{coordinates:[[0,0],[10,0]]}},{editId:'b',width:5.2,geometry:{coordinates:[[20,0],[20,20]]}}];
assert.equal(nearestRoad(roads,{x:5,z:2}).editId,'a');assert.equal(nearestRoad(roads,{x:20,z:10}).editId,'b');assert.equal(nearestRoad(roads,{x:80,z:80}),null);
console.log('Scene editor: input validation and road hit testing passed.');

const small=[[0,0],[1,0],[1,1],[0,0]],large=[[2,2],[6,2],[6,6],[2,2]];assert.equal(primaryBuildingRing({type:'MultiPolygon',coordinates:[[small],[large]]}),large);

import {chooseBuildingAsset,defaultPalette} from '../outputs/domestic-test/building-assets/catalog.js';
const palette={enabled:true,groups:defaultPalette()};
assert.equal(chooseBuildingAsset({objectid:3,bdtyp_cd:'02000',streetProfile:{styleIndex:2}},palette,{}).category,'apartment');
assert.equal(chooseBuildingAsset({objectid:3,streetProfile:{styleIndex:2}},{enabled:false}, {'3':'home-0'}).id,'home-0');
assert.equal(chooseBuildingAsset({objectid:3,streetProfile:{styleIndex:2,resetLegacyAsset:true}},{enabled:false}, {'3':'home-0'}).id,'home-2');

const outer=[[0,0],[10,0],[10,10],[0,10],[0,0]],hole=[[.1,.1],[9.9,.1],[9.9,9.9],[.1,9.9],[.1,.1]];assert.equal(primaryBuildingRing({type:'MultiPolygon',coordinates:[[outer,hole],[large]]}),large);
