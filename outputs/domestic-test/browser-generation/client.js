import {runGenerationTask,saveGenerationResult,throwIfGenerationAborted} from './generation-task.js';
import {loadBuildings} from './vworld.js';
import {generationPoint,matchingScene} from './policy.js';
import {saveScene,listScenes,getScene} from './storage.js';
import {loadSDK} from '../map-picker.js?v=unified11';
async function placesNear(point){
 await loadSDK();const service=new kakao.maps.services.Places(),found=new Map(),warnings=[];
 const options={location:new kakao.maps.LatLng(...point.center),radius:Math.ceil(point.radius*Math.SQRT2),sort:kakao.maps.services.SortBy.DISTANCE,size:15};
 await Promise.all(['CS2','FD6','CE7','MT1','PM9'].map(async category=>{
  for(let page=1;page<=3;page++){
   const result=await new Promise(resolve=>service.categorySearch(category,(rows,status,pagination)=>resolve({rows,status,pagination}),{...options,page}));
   if(result.status==='ZERO_RESULT')break;
   if(result.status!=='OK'){warnings.push('일부 상가 정보를 받지 못했습니다.');break;}
   for(const row of result.rows)found.set(row.id,row);if(!result.pagination.hasNextPage)break;
  }
 }));
 for(const query of ['미용실','세탁소','부동산']){
  const result=await new Promise(resolve=>service.keywordSearch(query,(rows,status)=>resolve({rows,status}),options));
  if(result.status==='OK')for(const row of result.rows)found.set(row.id,row);
 }
 const stations=await new Promise(resolve=>service.categorySearch('SW8',(rows,status)=>resolve(status==='OK'?rows:[]),{...options,radius:500}));
 const exits=[];for(const station of stations.slice(0,2)){const rows=await new Promise(resolve=>service.keywordSearch(station.place_name.split(' ')[0]+' 출구',(rows,status)=>resolve(status==='OK'?rows:[]),{...options,radius:400}));exits.push(...rows);}
 return {places:[...found.values()],stations,exits,warnings:[...new Set(warnings)]};
}
export async function generateInBrowser(point,onProgress=()=>{},{signal}={}){
 throwIfGenerationAborted(signal);
 point=generationPoint(point);
 const existing=(await listScenes()).find(m=>m.streetEndContext?.version===1&&m.sources?.buildings?.startsWith('VWorld /')&&matchingScene(m,point));
 throwIfGenerationAborted(signal);
 if(existing&&!point.force&&existing.junctions?.version===1)return existing;
 let sceneEdits,sourceRoads,editBuildingCollection;
 if(existing){const saved=await getScene(existing.id),bytes=saved?.files['scene-edits.json'];if(bytes)sceneEdits=JSON.parse(new TextDecoder().decode(bytes));const input=saved?.files['generation-input.json'];if(input){const previous=JSON.parse(new TextDecoder().decode(input));editBuildingCollection=previous.buildingCollection;if(Object.keys(sceneEdits?.roads||{}).length)sourceRoads=previous.sourceRoads;}}
 if(point.sourceRoads){sourceRoads=point.sourceRoads;sceneEdits={...sceneEdits,...point.sceneEdits,buildings:{...sceneEdits?.buildings,...point.sceneEdits?.buildings}};}
 await onProgress('주변 가게를 확인하고 있습니다…',0);
 let extra;try{extra=await placesNear(point);}catch(error){extra={places:[],stations:[],exits:[],warnings:['주변 가게 정보를 받지 못해 건물과 도로만으로 배치했습니다.']};await onProgress('가게 조회를 건너뛰고 건물과 도로를 만듭니다…',1);}
 if(signal?.aborted)throw new DOMException('취소했습니다.','AbortError');
 await onProgress('건물 모양과 층수를 조회하고 있습니다…',1);
 const buildingCollection=await loadBuildings(point,{signal});
 const result=await runGenerationTask({...point,...extra,buildingCollection,editBuildingCollection,sceneEdits,sourceRoads},onProgress,{signal});
 return saveGenerationResult(result,{signal,onProgress,save:saveScene,
  message:'이 브라우저에 동네를 저장하고 있습니다…',failureMessage:'동네를 저장하지 못했습니다. 이전 동네는 유지됩니다.',
  prepare:({manifest,files})=>{
   const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(files['generation-input.json']));
   if(input.buildingCollection?.type!=='FeatureCollection'||!Array.isArray(input.buildingCollection.features))throw Error('생성 원본 건물 정보가 없습니다.');
   return {manifest:{...manifest,visibilitySource:true},files:{...files,'visibility-source.json':new TextEncoder().encode(JSON.stringify(input.buildingCollection))}};
  },
 });
}
