import {createRoadSelection,roadSelectionControls,bindRoadSelectionControls,updateRoadSelectionControls} from '../building-assets/road-selection.js';
import {drawRoadMap,roadGrade,closestMapRoad,focusedRoads} from '../building-assets/road-map.js?v=road-groups1';
import {generationPoint,matchingScene} from './policy.js';
import {listScenes,getScene} from './storage.js';
const labels=['보행 전용길','1차도로 · 사람과 차가 함께','2차도로 · 왕복 2차선과 인도','3차도로 · 왕복 4차선','4차도로 · 왕복 6차선 이상'];
export async function configureRoads(input){
 const point=generationPoint(input),radius=Math.min(100,point.radius);
 let previous;
 const existing=(await listScenes()).find(m=>matchingScene(m,point));
 if(existing){const saved=await getScene(existing.id);if(saved?.files['generation-input.json'])previous=JSON.parse(new TextDecoder().decode(saved.files['generation-input.json']));if(saved?.files['scene-edits.json'])point.sceneEdits=JSON.parse(new TextDecoder().decode(saved.files['scene-edits.json']));}
 return new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');dialog.className='road-setup';dialog.setAttribute('aria-labelledby','road-setup-title');
  dialog.innerHTML=`<style>.road-setup{width:min(960px,94vw);max-height:92dvh;box-sizing:border-box;border:1px solid #bdc8c6;border-radius:14px;padding:22px;color:#243c3a;background:#fafcf9;overscroll-behavior:contain}.road-setup::backdrop{background:#172a3277;overflow:hidden;overscroll-behavior:contain}.road-setup h2{margin:0 0 12px}.road-setup button,.road-setup select{font:inherit;padding:9px;border:1px solid #b1c2bf;border-radius:7px;background:white;color:inherit}.road-setup-body{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:16px}.road-setup svg{width:100%;height:auto;min-height:280px;aspect-ratio:640/440;align-self:start;stroke:none;border:1px solid #cbd5ce;border-radius:8px}.road-setup aside{display:grid;align-content:start;gap:12px}.road-setup select{width:100%}.road-setup footer{display:flex;justify-content:flex-end;gap:12px;margin-top:18px}.road-setup button[data-confirm]{background:#215c50;color:white}.road-setup button:disabled{opacity:.5}.road-setup [data-list]{height:230px}.road-setup [hidden]{display:none}@media(max-width:650px){.road-setup-body{grid-template-columns:1fr}.road-setup [data-list]{height:100px}}</style><h2 id="road-setup-title">주변 도로의 종류 정하기</h2><p>붉은 점이 선택한 기준점입니다. 가까운 길을 누르면 교차로를 지나 직진으로 이어지는 길까지 함께 선택됩니다.</p><p data-status role="status">도로 자료를 불러오고 있습니다…</p><div class="road-setup-body" hidden><svg aria-label="주변 도로와 선택 기준점"></svg><aside><label>도로 구간<select data-list multiple size="8" aria-label="도로 구간"></select></label><label>선택한 도로의 종류<select data-grade aria-label="선택한 도로의 종류"></select></label>${roadSelectionControls}<p>자료로 추정한 종류입니다. 큰길과 갈라지는 골목을 확인해 주세요. 건물은 확정한 도로에 맞춰 배치합니다.</p></aside></div><footer><button data-cancel>취소</button><button data-retry hidden>도로 다시 불러오기</button><button data-confirm disabled>이 도로 설정으로 동네 만들기</button></footer>`;
  document.body.append(dialog);dialog.showModal();
  const $=s=>dialog.querySelector(s);let worker,sourceRoads=[],roads=[],grades={},selection,finished=false;
  const finish=(value,error)=>{if(finished)return;finished=true;worker?.terminate();dialog.close();dialog.remove();error?reject(error):resolve(value);};
  $('[data-cancel]').onclick=()=>finish(null,new DOMException('도로 설정을 취소했습니다.','AbortError'));dialog.oncancel=e=>{e.preventDefault();$('[data-cancel]').click();};
  function redraw(){
   grades=selection.grades;
   drawRoadMap($('svg'),{radius,roads,buildings:[],position:[0,0]},selection.selected,grades,select);
   const list=$('[data-list]');list.replaceChildren();roads.forEach((r,i)=>{const group=selection.groups.findIndex(g=>g.includes(r.editId));const o=new Option(`${i+1}. ${r.properties.name||'도로'} · ${labels[selection.gradeOf(r.editId)]}${group>=0?' · 묶음 '+(group+1):''}`,r.editId);o.selected=selection.selected.has(r.editId);list.append(o);});
   updateRoadSelectionControls(dialog,selection);
   $('[data-status]').textContent=`기준점 ${radius}m 안의 도로 ${roads.length}개 · 주황색 길의 등급을 함께 바꿉니다.`;
  }
  function select(road,event){selection.select(road.editId,!!event?.shiftKey||$('[data-multi]').checked);redraw();}
  $('[data-list]').onchange=()=>{selection.selectMany([...$('[data-list]').selectedOptions].map(o=>o.value));redraw();};
  $('[data-grade]').onchange=()=>{if($('[data-grade]').value==='')return;selection.setGrade(Number($('[data-grade]').value));redraw();};
  bindRoadSelectionControls(dialog,()=>selection,redraw);
  $('[data-confirm]').onclick=()=>{if(roads.length)finish({...point,force:true,sourceRoads,sceneEdits:{...point.sceneEdits,...selection.snapshot(),buildings:point.sceneEdits?.buildings||{}}});};
  function load(){
   worker?.terminate();$('[data-retry]').hidden=true;$('[data-status]').textContent='도로 자료를 불러오고 있습니다…';
   worker=new Worker(new URL('./worker.js?v=road-groups1',import.meta.url),{type:'module'});
   const fail=message=>{worker.terminate();$('[data-status]').textContent=message;$('[data-retry]').hidden=false;};
   worker.onerror=e=>fail(e.message||'도로 자료를 불러오지 못했습니다. 다시 시도해 주세요.');
   worker.onmessage=({data})=>{
    if(finished)return;
    if(data.type==='progress')$('[data-status]').textContent=data.message;
    if(data.type==='error')fail(data.message);
    if(data.type==='roads'){
     worker.terminate();sourceRoads=data.roads;roads=focusedRoads(sourceRoads,radius);
     if(!roads.length){fail('주변 도로 자료가 없습니다. 취소한 뒤 다른 위치를 선택해 주세요.');return;}
     grades=Object.fromEntries(sourceRoads.filter(r=>r.manualGrade).map(r=>[r.editId,{grade:r.manualGrade}]));
     try{selection=createRoadSelection(sourceRoads,{roads:grades,roadGroups:point.sceneEdits?.roadGroups});}catch(e){fail(e.message);return;}selection.select((closestMapRoad(roads,[0,0],Infinity)||roads[0]).editId);$('.road-setup-body').hidden=false;$('[data-confirm]').disabled=false;redraw();
    }
   };
   worker.postMessage({...point,sourceRoads:previous?.sourceRoads,roadSetupOnly:true});
  }
  $('[data-retry]').onclick=load;load();
 });
}
