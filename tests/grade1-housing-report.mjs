import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {cases,photos} from '../outputs/domestic-test/grade1-housing-report/cases.js';
import {createCaseModel} from '../outputs/domestic-test/grade1-housing-report/models.js';
assert.equal(cases.length,6);assert.equal(photos.length,12);
for(const p of photos)assert.ok((await stat(new URL('../outputs/domestic-test/grade1-housing-report/'+p.file,import.meta.url))).size>1000);
for(const c of cases){
 assert.ok(c.photos.every(id=>photos.some(p=>p.id===id)));assert.equal(c.points.length,3);
 for(const height of [1.2,1.8,2.2]){
  const m=createCaseModel(c.id,{height});let meshes=0;
  m.root.traverse(o=>{if(!o.isMesh)return;meshes++;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v),c.id+' has finite geometry');});
  assert.ok(meshes>50,c.id+' includes modeled details');assert.ok(m.paths.children.length>0);assert.equal(m.problems.visible,false);
  assert.ok(m.problems.children.length>0);assert.equal(m.root.userData.assumedMetres,true);
 }
}
const passage=createCaseModel('passage');assert.equal(passage.walls.children.length,0,'open connecting gap must not receive a wall');
const piloti=createCaseModel('piloti');assert.ok(piloti.paths.children.some(o=>o.userData.role==='vehicle-clearance'));
const garage=createCaseModel('garage');assert.ok(garage.shutter);assert.ok(garage.paths.children.some(o=>o.userData.role==='pedestrian-access'));
const slope=createCaseModel('wall-mix',{slope:true});assert.equal(slope.ground(0,-10),.8);
const page=await readFile(new URL('../outputs/domestic-test/grade1-housing-report/index.html',import.meta.url),'utf8');assert.ok(page.includes('실측이 아닌 제작 가정'));assert.ok(page.includes('조사 시작점'));
console.log('Housing report: 6 cases, 12 photos, finite geometry at 3 heights, open passage, parking and slope checks passed');
