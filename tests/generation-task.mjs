import assert from 'node:assert/strict';
import {runGenerationTask,saveGenerationResult} from '../outputs/domestic-test/browser-generation/generation-task.js';
import {generateInBrowser} from '../outputs/domestic-test/browser-generation/client.js';
import {rebuildEditedScene} from '../outputs/domestic-test/building-assets/scene-edit-store.js';
import {GENERATION_VERSION,RULESET} from '../outputs/domestic-test/browser-generation/policy.js';

const encode=value=>new TextEncoder().encode(JSON.stringify(value));
const collection={type:'FeatureCollection',features:[]};
const complete=()=>({type:'complete',manifest:{id:'scene-fixture'},files:{'generation-input.json':encode({buildingCollection:collection})}});
const workers=[];
let createError,postError,automatic;
class WorkerStub{
  constructor(url,options){if(createError)throw createError;this.url=url;this.options=options;this.terminations=0;workers.push(this);}
  postMessage(input){if(postError)throw postError;this.input=structuredClone(input);if(automatic)queueMicrotask(()=>this.emit(automatic()));}
  terminate(){this.terminations++;}
  emit(data){this.onmessage?.({data});}
}
globalThis.Worker=WorkerStub;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const newest=()=>workers.at(-1);
const cleaned=worker=>{assert.equal(worker.terminations,1);assert.equal(worker.onmessage,null);assert.equal(worker.onerror,null);assert.equal(worker.onmessageerror,null);};

let observed=[];
let task=runGenerationTask({manual:{floors:4}},(...args)=>observed.push(args));
let worker=newest(),late=worker.onmessage;
worker.emit({type:'progress',message:'기하 계산',percent:50});worker.emit(complete());
assert.equal((await task).manifest.id,'scene-fixture');cleaned(worker);
late({data:{type:'progress',message:'늦은 진행',percent:60}});late({data:complete()});await tick();
assert.equal(observed.length,1);assert.deepEqual(observed[0],['기하 계산',50,{saving:false}]);
assert.equal(worker.options.type,'module');

const already=new AbortController();already.abort();const count=workers.length;
await assert.rejects(runGenerationTask({},()=>{},{signal:already.signal}),{name:'AbortError'});assert.equal(workers.length,count);
const controller=new AbortController();task=runGenerationTask({},()=>{},{signal:controller.signal});worker=newest();late=worker.onmessage;controller.abort();
await assert.rejects(task,{name:'AbortError'});late({data:complete()});await tick();cleaned(worker);
for(const kind of ['error','messageerror','progress','async-progress','malformed','malformed-progress']){
  task=runGenerationTask({},()=>{if(kind==='async-progress')return Promise.reject(Error('async callback'));throw Error('callback');});worker=newest();
  if(kind==='error')worker.onerror({message:'worker crashed'});
  else if(kind==='messageerror')worker.onmessageerror({});
  else if(kind==='malformed')worker.emit({type:'complete',manifest:{},files:{}});
  else if(kind==='malformed-progress')worker.emit({type:'progress',message:'bad',percent:NaN});
  else{worker.emit({type:'progress',message:'step',percent:2});worker.emit(complete());}
  await assert.rejects(task);cleaned(worker);
}
task=runGenerationTask({});worker=newest();worker.emit({type:'error',message:'geometry failed',stage:'crossings',detail:'MultiPolygon'});
await assert.rejects(task,error=>error.generationDetail.stage==='crossings'&&error.generationDetail.detail==='MultiPolygon');cleaned(worker);
createError=Error('constructor');await assert.rejects(runGenerationTask({}),/constructor/);createError=null;
postError=Error('clone failed');task=runGenerationTask({});worker=newest();await assert.rejects(task,/clone failed/);cleaned(worker);postError=null;
let abortListeners=0;
const tracked=new AbortController();const add=tracked.signal.addEventListener.bind(tracked.signal),remove=tracked.signal.removeEventListener.bind(tracked.signal);
tracked.signal.addEventListener=(...args)=>{abortListeners++;return add(...args);};tracked.signal.removeEventListener=(...args)=>{abortListeners--;return remove(...args);};
task=runGenerationTask({},()=>{},{signal:tracked.signal});newest().emit(complete());await task;assert.equal(abortListeners,0);

let saves=0;const abortAtSaving=new AbortController();
await assert.rejects(saveGenerationResult(complete(),{signal:abortAtSaving.signal,onProgress:()=>abortAtSaving.abort(),prepare:r=>r,save:()=>saves++,message:'save',failureMessage:'failed'}),{name:'AbortError'});
assert.equal(saves,0);

// Minimal transactional IndexedDB adapter: writes publish only on transaction completion.
// This exercises the real storage.saveScene function and both real consumers.
const database={scenes:new Map(),catalog:new Map()};let failSave=false,holdSave=false,finishSave;
globalThis.indexedDB={open(){
  const request={};queueMicrotask(()=>{
    request.result={close(){},transaction(stores,mode){
      const tx={},pending=[];
      tx.objectStore=name=>({
        put(value){pending.push([name,structuredClone(value)]);},
        get(id){const r={};queueMicrotask(()=>{r.result=database[name].get(id);r.onsuccess?.();});return r;},
        getAll(){const r={};queueMicrotask(()=>{r.result=[...database[name].values()];r.onsuccess?.();});return r;},
      });
      if(mode==='readwrite'){
        finishSave=()=>{if(failSave){tx.error=Error('quota fixture');tx.onabort?.();}else{for(const [name,value] of pending)database[name].set(value.id,value);tx.oncomplete?.();}};
        if(!holdSave)queueMicrotask(finishSave);
      }
      return tx;
    }};request.onsuccess?.();
  });return request;
}};
globalThis.location={hostname:'localhost'};
globalThis.fetch=async()=>({ok:true,json:async()=>collection});
globalThis.kakao={maps:{Map:class{},LatLng:class{},services:{SortBy:{DISTANCE:'distance'},Places:class{
  categorySearch(category,callback){callback([],'ZERO_RESULT',{hasNextPage:false});}
  keywordSearch(query,callback){callback([],'OK',{hasNextPage:false});}
}}}};globalThis.window={kakao};
const edits={roads:{},buildings:{'17':{floors:4}}},source={input:{center:[37.6,127],radius:100,buildingCollection:collection,sceneEdits:edits}};
const consumers=[
  ['new',(progress,signal)=>generateInBrowser({center:[37.6,127],radius:100,force:true,sceneEdits:edits},progress,{signal})],
  ['edit',(progress,signal)=>rebuildEditedScene(source,edits,progress,{signal})],
];
const previous={id:'scene-fixture',manifest:{id:'scene-fixture',original:true},files:{'original.json':encode({manual:'preserved'})}};
// Forced regeneration recovers manual edits and the original building snapshot.
const preservedEdits={roads:{'road-17':{grade:2}},buildings:{'17':{floors:4}}};
const preservedCollection={type:'FeatureCollection',features:[{id:'original-building'}]},preservedRoads=[{editId:'road-17'}];
const currentManifest={id:previous.id,browserGenerationVersion:GENERATION_VERSION,ruleset:RULESET,
  streetEndContext:{version:1},junctions:{version:1},sources:{buildings:'VWorld / fixture'},sizeMetres:200,origin:[37.6,127],
  view:{mode:'visible360',version:3,heading:0,fov:90,eyeHeight:1.65}};
database.catalog.set(previous.id,currentManifest);database.scenes.set(previous.id,{id:previous.id,manifest:currentManifest,
  files:{'scene-edits.json':encode(preservedEdits),'generation-input.json':encode({buildingCollection:preservedCollection,sourceRoads:preservedRoads})}});
automatic=complete;await consumers[0][1](()=>{});
assert.deepEqual(newest().input.sceneEdits,preservedEdits);assert.deepEqual(newest().input.sourceRoads,preservedRoads);
assert.deepEqual(newest().input.editBuildingCollection,preservedCollection);
for(const [kind,consume] of consumers){
  database.scenes.set(previous.id,structuredClone(previous));database.catalog.set(previous.id,previous.manifest);
  const beforeWorkers=workers.length,preCancelled=new AbortController();preCancelled.abort();
  await assert.rejects(consume(()=>{},preCancelled.signal),{name:'AbortError'});assert.equal(workers.length,beforeWorkers);
  assert.deepEqual(database.scenes.get(previous.id),previous);
  automatic=()=>({type:'error',message:'compute failed',stage:'road',detail:'same detail'});
  await assert.rejects(consume(()=>{}),error=>error.generationDetail.stage==='road'&&error.generationDetail.detail==='same detail');
  assert.deepEqual(database.scenes.get(previous.id),previous);
  automatic=complete;failSave=true;
  await assert.rejects(consume(()=>{}),error=>error.generationDetail.stage==='save'&&error.cause.message==='quota fixture');
  assert.deepEqual(database.scenes.get(previous.id),previous);assert.deepEqual(database.catalog.get(previous.id),previous.manifest);
  failSave=false;observed=[];const manifest=await consume((...args)=>observed.push(args));
  assert.equal(manifest.visibilitySource,true);assert.equal(manifest.sceneEditVersion,kind==='edit'?1:undefined);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(database.scenes.get(previous.id).files['visibility-source.json'])),collection);
  assert.deepEqual(observed.at(-1)[2],{saving:true});assert.equal(newest().url.search,'?v=refactor-followup1');
  if(kind==='edit')assert.deepEqual(newest().input.sceneEdits,edits);
  database.scenes.set(previous.id,structuredClone(previous));database.catalog.set(previous.id,previous.manifest);
  const cancel=new AbortController();holdSave=true;observed=[];task=consume((...args)=>observed.push(args),cancel.signal);
  for(let i=0;i<10&&!observed.some(args=>args[2]?.saving);i++)await tick();
  await tick();assert(observed.some(args=>args[2]?.saving));cancel.abort();finishSave();
  assert.equal((await task).id,previous.id,'Aborting after atomic save starts is not reported as a successful cancellation');holdSave=false;
}
automatic=()=>({...complete(),files:{'generation-input.json':new TextEncoder().encode('{broken')}});
database.scenes.set(previous.id,structuredClone(previous));database.catalog.set(previous.id,previous.manifest);
await assert.rejects(consumers[0][1](()=>{}),error=>error.generationDetail.stage==='result-preparation'&&!error.message.includes('공간'));
assert.deepEqual(database.scenes.get(previous.id),previous);
automatic=complete;
await assert.rejects(rebuildEditedScene({input:{}},edits,()=>{}),error=>error.generationDetail.stage==='result-preparation');
assert.deepEqual(database.scenes.get(previous.id),previous);
const beforePreflight=workers.length;
await assert.rejects(consumers[0][1](async()=>{throw Error('preflight progress failed');}),/preflight progress failed/);
assert.equal(workers.length,beforePreflight,'Preflight progress rejection must stop before Worker creation');
assert.deepEqual(database.scenes.get(previous.id),previous);
console.log('Generation task: one settlement/cleanup, abort/error boundaries, both real consumers, preparation/save distinction and atomic previous-scene preservation passed.');
