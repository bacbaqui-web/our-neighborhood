import assert from 'node:assert/strict';
import * as T from 'three';
import {createRenderLoop} from '../outputs/domestic-test/viewer/render-loop.js';
import {createTerrainIndex,createMapProjection} from '../outputs/domestic-test/viewer/terrain-index.js';
import {disposeSceneResource,disposeSceneGroup,clearBuildingMeshes} from '../outputs/domestic-test/viewer/scene-resources.js';

const events=new EventTarget(),controls=new EventTarget();events.hidden=false;
const camera=new T.PerspectiveCamera(),host={clientWidth:800,clientHeight:400},calls=[];
let observer,frame,paused=false,weather=false,stream=true;
class ResizeObserverStub{
  constructor(callback){this.callback=callback;observer=this;}
  observe(element){assert.equal(element,host);}
  disconnect(){calls.push('disconnect');}
}
const renderer={setAnimationLoop(callback){frame=callback;},setSize(w,h){calls.push(['size',w,h]);}};
const loop=createRenderLoop({renderer,camera,controls,host,eventTarget:events,ResizeObserverClass:ResizeObserverStub,
  isPaused:()=>paused,updateNavigation:()=>calls.push('navigation'),updateWeather:()=>{calls.push('weather');return weather;},
  canStream:()=>stream,updateStream:()=>calls.push('stream'),beforeRender:()=>calls.push('prepare'),
  render:()=>calls.push('draw'),onState:active=>calls.push(active?'active':'idle')});
const drawCount=()=>calls.filter(c=>c==='draw').length;
frame(0);assert.deepEqual(calls,['navigation','weather','stream','prepare','draw','active']);
frame(80);assert.equal(calls.filter(c=>c==='stream').length,1,'Streaming uses strict >80ms');
frame(81);assert.equal(calls.filter(c=>c==='stream').length,2);
weather=true;frame(100);assert.equal(drawCount(),2);
frame(120);assert.equal(drawCount(),2,'Weather alone is capped at 24fps');
frame(142);assert.equal(drawCount(),3);
loop.requestRender();frame(143);assert.equal(drawCount(),4,'Explicit interaction bypasses weather cap');
weather=false;camera.position.x=4;frame(144);assert.equal(drawCount(),5,'Camera movement invalidates');
camera.fov=35;camera.updateProjectionMatrix();frame(145);assert.equal(drawCount(),6,'Projection change invalidates');
paused=true;loop.requestRender();const before=calls.length;frame(200);assert.equal(calls.length,before);
paused=false;events.hidden=true;frame(201);assert.equal(calls.length,before);
events.hidden=false;frame(202);assert.equal(drawCount(),7,'Paused requests survive until resumed');
observer.callback();assert.equal(camera.aspect,2);frame(203);assert.equal(drawCount(),8);
for(const name of ['click','input','change','visibilitychange']){events.dispatchEvent(new Event(name));frame(204);}
controls.dispatchEvent(new Event('change'));frame(205);assert.equal(drawCount(),13);
stream=false;frame(500);assert.equal(calls.at(-1),'idle');
const lateFrame=frame;loop.dispose();assert.equal(frame,null);assert.equal(calls.at(-1),'disconnect');
const disposedCalls=calls.length;loop.dispose();loop.requestRender();observer.callback();lateFrame(600);
assert.equal(calls.length,disposedCalls,'Disposed callbacks cannot redraw or resize');

function triangle(height,name='ground',indexed=false){
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([0,height,0,10,height,0,0,height,10],3));
  if(indexed)geometry.setIndex([0,1,2]);
  const mesh=new T.Mesh(geometry);mesh.name=name;return mesh;
}
const terrain=createTerrainIndex({fallbackHeight:(x,z)=>x+z}),root=new T.Group();
const ground=triangle(0),road=triangle(2,'road',true),upper=triangle(5,'path');road.userData.roadClass='sidewalk';
root.add(ground,road,upper);terrain.index(root,[ground,road,upper]);
assert.equal(terrain.elevation(2,2),5,'Use highest overlapping surface');
assert.equal(terrain.elevation(5,5),5,'Triangle boundary remains included');
assert.equal(terrain.roadInfo(2,2).roadClass,'sidewalk','Road query preserves first road and its classification');
assert(Math.abs(Math.hypot(terrain.roadInfo(2,2).ux,terrain.roadInfo(2,2).uz)-1)<1e-12);
assert.equal(terrain.elevation(20,20),40);assert.equal(terrain.elevation(20,20,9),9);
assert(Number.isNaN(terrain.elevation(20,20,NaN)));assert.equal(terrain.roadInfo(20,20),null);
terrain.elevation.detailRadius=100;root.position.set(5,7,-5);terrain.index(root,[road]);
assert.equal(terrain.elevation(7,-3),9,'World transform is applied when reindexing');
assert.equal(terrain.roadInfo(1,1),null,'Reindex removes old cell triangles');
assert.equal(terrain.elevation.detailRadius,100,'Caller metadata remains on the same elevation function');
const degenerate=triangle(0);degenerate.geometry.attributes.position.array.fill(0);root.add(degenerate);
terrain.index(root,[degenerate]);assert.equal(terrain.roadInfo(7,-3),null);assert.equal(terrain.elevation(7,-3),4);
const project=createMapProjection([0,0]);assert.deepEqual(project([0,0]),[0,-0]);
assert(Math.abs(project([1,1])[0]-111319.458)<1e-6);assert(Math.abs(project([1,1])[1]+110574.2727)<1e-6);

const released=[],scene={remove:o=>released.push(o)};
const resource={group:{id:'group'},lamps:{id:'lamps'},dispose:()=>released.push('resource')};
assert.equal(disposeSceneResource(scene,resource),null);assert.deepEqual(released,[resource.group,resource.lamps,'resource']);
const mesh={geometry:{dispose:()=>released.push('geometry')},material:[{dispose:()=>released.push('material')}],children:[]};
const group={traverse:fn=>fn(mesh),clear:()=>released.push('clear')};
disposeSceneGroup(scene,group);assert(released.includes('geometry')&&released.includes('material'));
clearBuildingMeshes(group,[mesh]);assert.equal(released.at(-1),'clear');
assert.equal(disposeSceneResource(scene,null),null);assert.equal(disposeSceneGroup(scene,null),null);
console.log('Viewer lifecycle: frame order, weather/stream cadence, pause/resume, invalidation/disposal, terrain and resource ownership passed.');
