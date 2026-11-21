import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {expandVisibleBuildings} from '../outputs/domestic-test/visible-horizon.js';
// Exercise the real browser worker module through a Node transport.
globalThis.Worker=class{
 constructor(url){this.worker=new NodeWorker(`const{parentPort}=require('node:worker_threads');global.self={postMessage:d=>parentPort.postMessage(d)};import(${JSON.stringify(url.href)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',e=>this.onerror?.(e));}
 postMessage(d){this.worker.postMessage(d);}terminate(){this.worker.terminate();}
};
globalThis.document={hidden:false};
const controller=new AbortController(),states=[],updates=[];
let calls=0;
const config={origin:[37.62,127.02],view:{position:[0,0],eyeHeight:2},heightAt:()=>0,maxTerrain:0,terrain:{angles:4,radii:[0,10000],positions:Array(24).fill(0)},detailOwners:new Set(),initial:{features:[{type:'Feature',id:'LT_C_SPBD.1',properties:{objectid:1,gro_flo_co:10},geometry:{type:'Polygon',coordinates:[[[127.075,37.62],[127.0752,37.62],[127.0752,37.6202],[127.075,37.6202],[127.075,37.62]]]}}]},cache:false,signal:controller.signal,onUpdate:c=>updates.push(c),onProgress:s=>states.push(s)};
await assert.rejects(expandVisibleBuildings({...config,query:async()=>{calls++;throw Error('test unavailable');}}),/test unavailable/);
assert.equal(calls,1);assert.equal(states[0].visibleBuildings,1);assert(states[0].farthest>4000);assert.equal(states.at(-1).state,'incomplete');assert(!states.some(s=>s.state==='complete'));
const cancelled=new AbortController();cancelled.abort();
const result=await expandVisibleBuildings({...config,signal:cancelled.signal});assert.equal(result.state,'cancelled');
console.log('Worker transport, initial geometry, explicit source failure and cancellation passed');

let tick=0,pauses=0;const pauseController=new AbortController();
const paused=await expandVisibleBuildings({...config,initial:{features:[]},signal:pauseController.signal,now:()=>tick,query:async()=>{tick+=46000;return {features:[]};},onPause:async()=>{pauses++;pauseController.abort();}});
assert.equal(pauses,1);assert.equal(paused.state,'cancelled');assert(states.some(s=>s.state==='paused'));
