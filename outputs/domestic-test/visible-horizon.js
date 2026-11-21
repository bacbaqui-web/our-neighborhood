import {loadBuildingsInBounds} from './browser-generation/vworld.js?v=horizon1';
import {createTileFrontier,tileBounds} from './visible-horizon-policy.js';

const CACHE='neighborhood-building-tiles-v2',TTL=7*24*3600*1000;
async function cacheDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(CACHE,1);r.onupgradeneeded=()=>r.result.createObjectStore('tiles',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function cached(key,value){const db=await cacheDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('tiles',value?'readwrite':'readonly'),store=tx.objectStore('tiles'),r=value?store.put({key,at:Date.now(),value}):store.get(key);let result;r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(value?value:(result&&Date.now()-result.at<TTL?result.value:null));tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function trimCache(){const db=await cacheDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('tiles','readwrite'),store=tx.objectStore('tiles'),r=store.getAll();r.onsuccess=()=>{const rows=r.result.sort((a,b)=>b.at-a.at);for(const row of rows.slice(128))store.delete(row.key);};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export async function yieldBackground(signal){
 signal?.throwIfAborted();
 if(globalThis.scheduler?.postTask)await scheduler.postTask(()=>{},{priority:'background',signal});
 else await new Promise(resolve=>setTimeout(resolve,0));
 signal?.throwIfAborted();
}
async function visibleTab(signal){while(document.hidden){await new Promise(resolve=>{const done=()=>{document.removeEventListener('visibilitychange',done);signal.removeEventListener('abort',done);resolve();};document.addEventListener('visibilitychange',done,{once:true});signal.addEventListener('abort',done,{once:true});});signal.throwIfAborted();}}
export async function expandVisibleBuildings({origin,view,heightAt,maxTerrain=0,terrainRadii=[],initial,terrain,detailOwners,onUpdate,onProgress,onPause,signal,query=loadBuildingsInBounds,cache=true,now=()=>performance.now()}){
 const frontier=createTileFrontier(view.position),stats={state:'loading',queries:0,cacheHits:0,tiles:0,skipped:0,visibleBuildings:0,farthest:0,storageWarning:false};
 const worker=new Worker(new URL('./visible-horizon-worker.js',import.meta.url),{type:'module'}),pending=new Map();let sequence=0,failed=null,lastModels=null;
 worker.onmessage=({data})=>{const task=pending.get(data.id);if(!task)return;pending.delete(data.id);data.error?task.reject(Error(data.error)):task.resolve(data.result);};
 const stop=error=>{failed=error;worker.terminate();for(const task of pending.values())task.reject(error);pending.clear();};
 worker.onerror=()=>stop(Error('먼 건물 계산을 완료하지 못했습니다. 다시 시도해 주세요.'));
 const abort=()=>stop(signal.reason);signal.addEventListener('abort',abort,{once:true});
 const call=(type,data={})=>new Promise((resolve,reject)=>{signal.throwIfAborted();if(failed){reject(failed);return;}const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({type,id,...data});});
 const update=async (collection,emit=true)=>{const result=await call('insert',{features:collection.features}),visible=result.visible.filter(b=>!detailOwners.has(b.owner));stats.sourceBuildings=result.sourceBuildings;stats.visibleBuildings=new Set(visible.map(b=>b.owner)).size;stats.farthest=visible.reduce((d,b)=>Math.max(d,b.distance),0);const signature=visible.map(b=>b.key).join("|");if(emit&&signature!==lastModels){lastModels=signature;onUpdate({buildings:visible,roads:[]},stats);}};
 let tile,activeMs=0;
 try{
  await call("init",{origin,view,terrain,maxTerrain,eyeY:heightAt(...view.position)+(view.eyeHeight||2)});
  if(initial)await update(initial);onProgress({...stats});
  while((tile=frontier.next())){
   signal.throwIfAborted();await visibleTab(signal);await yieldBackground(signal);
   const minFloors=await call("tile",tile);if(minFloors===null){stats.skipped++;continue;}
   if(activeMs>=45000&&onPause){stats.state="paused";onProgress({...stats});await onPause();signal.throwIfAborted();activeMs=0;stats.state="loading";}
   const started=now();
   const bbox=tileBounds(origin,tile.x,tile.z);
   if(bbox[0]<=124||bbox[2]>=132||bbox[1]<=33||bbox[3]>=39.5){stats.sourceBoundary=true;continue;}
   const key=bbox.map(n=>n.toFixed(8)).join(',')+':'+minFloors;let collection;
   if(cache)try{collection=await cached(key);}catch{stats.storageWarning=true;}
   if(collection)stats.cacheHits++;
   else {collection=await query(bbox,{signal,minFloors});stats.queries++;signal.throwIfAborted();if(cache)try{await cached(key,collection);if(stats.queries%8===0)await trimCache();}catch{stats.storageWarning=true;}}
   stats.tiles++;frontier.expand(tile);await yieldBackground(signal);await update(collection);activeMs+=now()-started;onProgress({...stats});
  }
  stats.state=stats.sourceBoundary?'source-boundary':'complete';onProgress({...stats});return stats;
 }catch(error){stats.state=signal.aborted?'cancelled':'incomplete';onProgress({...stats,error:signal.aborted?null:error.message});if(!signal.aborted)throw error;return stats;}finally{signal.removeEventListener("abort",abort);worker.terminate();}
}
