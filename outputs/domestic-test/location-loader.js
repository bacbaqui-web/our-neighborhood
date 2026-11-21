import {currentScene} from './browser-generation/policy.js';
import {chooseMapPoint} from './map-picker.js?v=unified11';
import {browserContext,listScenes} from './browser-generation/storage.js';
import {createNeighborhood} from './browser-generation/progress.js?v=unified11';
import {normalizeRadius,selectedRadius} from './scene-budget.js?v=151';
const original={id:'original',address:'서울 강북구 솔매로17가길 7',origin:[37.626469,127.015677],sizeMetres:300,roadAddress:{road_name:'솔매로17가길',main_building_no:'7',sub_building_no:''}};
const key='neighborhood-last-location-v74';
const deployment=fetch(new URL('./deployment.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('배포 설정을 불러오지 못했습니다.');return r.json();});
const api=new URL('../api/neighborhoods',import.meta.url);
const savedLocations=deployment.then(async config=>{
 const url=config.mode==='local'?api:new URL('./locations.json',import.meta.url);
 const response=await fetch(url,{cache:'no-cache'});
 if(!response.ok)throw Error('저장된 동네 목록을 불러오지 못했습니다.');
 return [original,...await response.json(),...await listScenes().catch(()=>[])];
});
// The UI reports failures when needed; do not emit an unhandled rejection at startup.
savedLocations.catch(()=>{});
function requireVisibleScene(scene){
 if(currentScene(scene))return scene;
 const target=new URL('./start.html',import.meta.url);
 target.searchParams.set('query',scene.address||'');
 target.searchParams.set('radius',normalizeRadius(new URLSearchParams(location.search).get('radius')||100));
 target.searchParams.set('selectPoint','1');
 location.replace(target.href);
 return new Promise(()=>{});
}
export async function readLocation(){
 const requested=new URLSearchParams(location.search).get('location');
 // Every entry, including old bookmarks, must satisfy the visible360 contract.
 let id=requested;try{if(!id)id=localStorage.getItem(key);}catch{}
 if(!id||id==='original')return requireVisibleScene(original);
 if(!/^[a-f0-9]{16}$/.test(id))throw Error('지역 주소가 올바르지 않습니다. 주소를 다시 입력해 주세요.');
 const local=await browserContext(id);if(local)return requireVisibleScene(local);
 const base=new URL(`../generated-neighborhoods/${id}/data/`,import.meta.url).href,r=await fetch(base+'manifest.json',{cache:'no-cache'});
 if(!r.ok)throw Error('저장된 지역을 찾지 못했습니다. 주소를 다시 입력해 주세요.');
 const m=await r.json();if(m.id!==id||!Array.isArray(m.origin)||m.origin.length!==2||!m.origin.every(Number.isFinite))throw Error('지역 정보가 올바르지 않습니다.');
 return requireVisibleScene({...m,base});
}
export function dataUrl(context,name){const file=name.split('?')[0].replace(/^\.\//,'');if(context.browserFiles){const path=(context.arterial?.overrides?.includes(file)?'arterial/':'')+file;if(!context.browserFiles[path])throw Error('저장된 동네 파일이 없습니다: '+file);return context.browserFiles[path];}return context.base?context.base+(context.arterial?.overrides.includes(file)?'arterial/':'')+file:name;}
export function rememberLocation(context){try{localStorage.setItem(key,context.id);}catch{}}
export function setupLocationSearch(context,getHour){
 const input=document.getElementById('address'),button=document.getElementById('findAddress'),status=document.getElementById('status'),form=document.getElementById('addressForm'),history=document.getElementById('locationHistory');
 input.disabled=button.disabled=false;if(context.address)input.value=context.address;
 const range=document.getElementById('detailRadius');range.value=selectedRadius(context);range.title='길 위 관찰 지점에서 보이는 대상을 확인할 거리 · 50m 단위';
 range.addEventListener('change',()=>{range.value=normalizeRadius(range.value,Number(range.max));});
 let busy=false;
 const message=text=>{status.textContent=text;};
 function visit(id){const url=new URL(location.href);url.searchParams.set('location',id);url.searchParams.set('hour',getHour());url.searchParams.set('radius',normalizeRadius(range.value));url.searchParams.delete('shop');location.assign(url.href);}
 history?.addEventListener('change',()=>{if(history.value)visit(history.value);});
 savedLocations.then(rows=>{
  for(const row of rows.filter(currentScene)){const o=document.createElement('option');o.value=row.id;o.textContent=row.address+` · ${(row.sizeMetres||300)/2}m`+(!currentScene(row)?' · 이전 기록':'');history?.append(o);const suggestion=document.createElement('option');suggestion.value=row.address;document.getElementById('addresses')?.append(suggestion);}
  if(history)history.value=context.id||'';
 }).catch(()=>{});
 const rebuild=document.createElement('button');rebuild.type='button';rebuild.style.cssText='background:#254653;color:#fff;border:1px solid #45606c;border-radius:7px;padding:8px 10px;white-space:nowrap';rebuild.textContent='이 위치 다시 만들기';rebuild.title='현재 중심 위치를 유지하고 최신 규칙으로 다시 만듭니다.';form.append(rebuild);
 rebuild.onclick=async()=>{
  if(busy)return;busy=true;rebuild.disabled=button.disabled=true;
  try{const result=await createNeighborhood({address:context.address,center:context.origin,radius:normalizeRadius(range.value),view:context.view,force:true});visit(result.id);}
  catch(error){message(error.name==='AbortError'?'동네 만들기를 취소했습니다.':'동네를 만들지 못했습니다. '+error.message);}
  finally{busy=false;rebuild.disabled=button.disabled=false;}
 };
 // Preserve historical records; do not silently launch a different generator.
 if(!currentScene(context)){
  const notice=document.createElement('p');notice.textContent='이전 생성 기록입니다. 이 위치 다시 만들기를 누르면 길 위에서 보이는 곳을 360도로 만듭니다.';notice.style.cssText='font-size:12px;color:#fff';form.append(notice);
 }
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;let address=input.value.trim();let center=null;
  const point=await chooseMapPoint({query:address,origin:context.origin,radius:Number(range.value)});if(!point)return;address=point.address;center=point.center;range.value=point.radius;input.value=address;
  if(!address){input.focus();return;}
  busy=true;button.disabled=true;input.readOnly=true;if(history)history.disabled=true;form.setAttribute('aria-busy','true');message('주소를 확인하고 새 동네 생성을 시작합니다…');
  try{
   const result=await createNeighborhood(point);visit(result.id);
  }catch(error){message(error.name==='AbortError'?'동네 만들기를 취소했습니다.':'동네를 만들지 못했습니다. '+error.message);}
  finally{busy=false;input.readOnly=false;button.disabled=false;if(history)history.disabled=false;form.removeAttribute('aria-busy');}
 };
}
