import {generationPoint,matchingScene} from './policy.js';
import {saveScene,listScenes} from './storage.js';
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
export async function generateInBrowser(point,onProgress,{signal}={}){
 point=generationPoint(point);
 const cached=(await listScenes()).find(m=>!point.force&&matchingScene(m,point));
 if(cached)return cached;
 onProgress('주변 가게를 확인하고 있습니다…',0);
 let extra;try{extra=await placesNear(point);}catch(error){extra={places:[],stations:[],exits:[],warnings:['주변 가게 정보를 받지 못해 건물과 도로만으로 배치했습니다.']};onProgress('가게 조회를 건너뛰고 건물과 도로를 만듭니다…',1);}
 if(signal?.aborted)throw new DOMException('취소했습니다.','AbortError');
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./worker.js?v=unified11',import.meta.url),{type:'module'});
  const finish=()=>{worker.terminate();signal?.removeEventListener('abort',abort);};
  const abort=()=>{finish();reject(new DOMException('동네 만들기를 취소했습니다.','AbortError'));};signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=event=>{finish();reject(Error(event.message||'동네 계산을 시작하지 못했습니다.'));};
  worker.onmessage=async({data})=>{
   if(data.type==='progress')onProgress(data.message,data.percent);
   if(data.type==='error'){finish();const error=Error(data.message);error.generationDetail={stage:data.stage,detail:data.detail};reject(error);}
   if(data.type==='complete'){finish();try{onProgress('이 브라우저에 동네를 저장하고 있습니다…',99);await saveScene(data.manifest,data.files);resolve(data.manifest);}catch(error){reject(Error('동네를 저장할 공간이 부족하거나 브라우저 저장이 차단되어 있습니다. '+error.message));}}
  };
  worker.postMessage({...point,...extra});
 });
}
