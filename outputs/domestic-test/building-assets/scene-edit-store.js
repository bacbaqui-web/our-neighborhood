import {attachSidewalks} from './road-sidewalks.js';
import {validateRoadGroups} from './road-selection.js';
import {assetById} from './catalog.js?v=scene-edit1';
import {getScene,saveScene} from '../browser-generation/storage.js';
export function validateSceneEdits(edits){
 if(!edits||typeof edits!=='object'||Array.isArray(edits)||!edits.roads||typeof edits.roads!=='object'||Array.isArray(edits.roads)||!edits.buildings||typeof edits.buildings!=='object'||Array.isArray(edits.buildings))throw Error('도로·건물 수정 정보를 읽지 못했습니다.');
 validateRoadGroups(edits.roadGroups);
 for(const r of Object.values(edits.roads))if(!Number.isInteger(r?.grade)||r.grade<1||r.grade>4)throw Error('도로 등급은 1~4차도로 중에서 선택해 주세요.');
 for(const b of Object.values(edits.buildings)){
  if(!b||typeof b!=='object'||Array.isArray(b))throw Error('건물 정보를 다시 입력해 주세요.');
  if(b.assetId!==undefined&&!assetById[b.assetId])throw Error('건물 디자인을 목록에서 다시 선택해 주세요.');
  if(b.floors!==undefined&&(!Number.isInteger(b.floors)||b.floors<1||b.floors>200))throw Error('층수는 1~200 사이의 정수로 입력해 주세요.');
  if(b.frontEdge!==undefined&&(!Number.isInteger(b.frontEdge)||b.frontEdge<0||b.frontEdge>1000))throw Error('입구를 놓을 면을 다시 선택해 주세요.');
  if(b.styleIndex!==undefined&&(!Number.isInteger(b.styleIndex)||b.styleIndex<0||b.styleIndex>5))throw Error('건물 디자인을 다시 선택해 주세요.');
  if(b.era!==undefined&&!['old','middle','new'].includes(b.era))throw Error('건물 연식을 다시 선택해 주세요.');
  if(b.use!==undefined&&!['residential','mixed'].includes(b.use))throw Error('건물 용도를 다시 선택해 주세요.');
 }
 return edits;
}
export async function readEditorSource(context,load){
 const saved=await getScene(context.id);
 const read=async name=>{
  if(saved?.files[name])return JSON.parse(new TextDecoder().decode(saved.files[name]));
  return load('./'+name);
 };
 let input;
 if(saved?.files['generation-input.json']||context.browserFiles?.['generation-input.json'])input=await read('generation-input.json');
 else{
  const [buildingCollection,roads,shops]=await Promise.all([read('visibility-source.json').catch(()=>read('buildings-source.geojson')),read('roads-source.json'),read('shops/places.json')]);
  input={center:context.origin,radius:context.detailRadius||context.sizeMetres/2,address:context.address||context.query||'수정한 동네',view:context.view,buildingCollection,sourceRoads:roads.roads,places:shops.places||[],stations:[],exits:[]};
 }
 // Always reconstruct from the original snapshot, never from previously inferred floors.
 const edits=validateSceneEdits(input.sceneEdits||{roads:{},buildings:{}});
 const roads=await read('roads-source.json');
 for(const [i,r] of roads.roads.entries())r.editId ||= 'saved-segment-'+i;
 if(!input.sourceRoads?.every(r=>r.editId))input.sourceRoads=structuredClone(roads.roads);
 input.sourceRoads=attachSidewalks(input.sourceRoads.map(r=>({...r,...(edits.roads[r.editId]?{grade:edits.roads[r.editId].grade,gradeSource:'user'}:{})})));
 roads.roads=attachSidewalks(roads.roads);
 return {input:{...input,sceneId:context.id},edits:structuredClone(edits),roads:roads.roads};
}
export function rebuildEditedScene(source,edits,onProgress,{signal}={}){
 validateSceneEdits(edits);
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('../browser-generation/worker.js?v=scene-edit1',import.meta.url),{type:'module'});
  const finish=()=>{worker.terminate();signal?.removeEventListener('abort',abort);};
  const abort=()=>{finish();reject(new DOMException('수정을 취소했습니다. 이전 동네를 유지합니다.','AbortError'));};
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)return abort();
  worker.onerror=e=>{finish();reject(Error(e.message||'동네를 다시 계산하지 못했습니다.'));};
  worker.onmessage=async({data})=>{
   if(data.type==='progress')onProgress(data.message,data.percent);
   if(data.type==='error'){finish();reject(Error(data.message));}
   if(data.type==='complete'){
    onProgress('계산이 끝나 수정 결과를 저장하고 있습니다…',99,{saving:true});finish();try{
     data.files['visibility-source.json']=new TextEncoder().encode(JSON.stringify(source.input.buildingCollection));
     data.manifest.visibilitySource=true;data.manifest.sceneEditVersion=1;
     await saveScene(data.manifest,data.files);resolve(data.manifest);
    }catch(e){reject(Error('수정 결과를 저장하지 못했습니다. 이전 동네는 유지됩니다. '+e.message));}
   }
  };
  worker.postMessage({...structuredClone(source.input),sceneEdits:edits});
 });
}
export function nearestRoad(roads,point){
 let best=null;
 for(const road of roads){
  const ps=road.geometry.coordinates;
  for(let i=1;i<ps.length;i++){
   const a=ps[i-1],b=ps[i],dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;if(!den)continue;
   const t=Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.z-a[1])*dz)/den)),distance=Math.hypot(point.x-a[0]-t*dx,point.z-a[1]-t*dz);
   if(distance<=(road.width||5)/2+.5&&(!best||distance<best.distance))best={road,distance};
  }
 }
 const picked=best?.road;if(picked?.sidewalkParents)return roads.find(r=>picked.sidewalkParents.includes(r.editId))||null;return picked||null;
}

export function primaryBuildingRing(geometry){
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
 const area=ring=>{const [x,y]=ring[0];return Math.abs(ring.slice(1).reduce((sum,p,i)=>{const a=ring[i];return sum+(a[0]-x)*(p[1]-y)-(p[0]-x)*(a[1]-y);},0));};
 const polygonArea=p=>area(p[0])-p.slice(1).reduce((sum,r)=>sum+area(r),0);
 return polygons.reduce((best,p)=>polygonArea(p)>polygonArea(best)?p:best)[0];
}
