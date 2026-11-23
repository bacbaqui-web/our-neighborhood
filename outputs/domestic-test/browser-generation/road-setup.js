import {createRoadSelection} from '../building-assets/road-selection.js';
import {generationPoint,matchingScene} from './policy.js';
import {listScenes,getScene} from './storage.js';
import {loadBuildings} from './vworld.js';
import {localPolygons} from '../building-assets/preview-data.js';
import {createPreparationMap,gradeColors,gradeLabels} from './preparation-map.js';
const stylesheet=new URL('./map-preparation.css',import.meta.url);
export async function configureRoads(input){
 const point=generationPoint(input);let previous;
 const existing=(await listScenes()).find(m=>matchingScene(m,point));
 if(existing){const saved=await getScene(existing.id);if(saved?.files['generation-input.json'])previous=JSON.parse(new TextDecoder().decode(saved.files['generation-input.json']));if(saved?.files['scene-edits.json'])point.sceneEdits=JSON.parse(new TextDecoder().decode(saved.files['scene-edits.json']));}
 return new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');dialog.className='map-preparation';dialog.setAttribute('aria-labelledby','map-preparation-title');
  dialog.innerHTML=`<link rel="stylesheet" href="${stylesheet}"><header><h2 id="map-preparation-title">생성할 지도 정돈</h2><span data-step>1 · 도로</span></header><div class="preparation-map-wrap"><div class="preparation-canvas"><svg tabindex="0" aria-label="도로와 건물 정돈 지도"></svg><span class="preparation-north" aria-hidden="true">북 ↑</span><div class="preparation-legend">${gradeLabels.map((s,i)=>`<span><i style="background:${gradeColors[i]}"></i>${s}</span>`).join('')}<span><i style="background:#d9c7a1"></i>인도 예정 공간</span></div></div><section data-panel hidden aria-label="선택 항목 설정"></section></div><p data-candidate hidden>진한 건물은 평면 직선으로 보이는 예상 후보입니다. 높이는 반영하지 않았습니다.</p><p data-status role="status"></p><footer><button data-cancel>취소</button><button data-back hidden>도로 정돈으로</button><button data-retry hidden>다시 불러오기</button><button data-confirm disabled>동네 만들기</button></footer>`;
  document.body.append(dialog);dialog.showModal();
  const $=s=>dialog.querySelector(s),controller=new AbortController();let finished=false,worker,waiting,busy=true,sourceRoads=[],sourceBuildings,layout,selection,buildingEdits=structuredClone(point.sceneEdits?.buildings||{}),stage='roads',selectedBuilding=null,lastGood;
  const status=text=>{$('[data-status]').textContent=text;};
  const finish=(value,error)=>{if(finished)return;finished=true;controller.abort();resizeObserver.disconnect();worker?.terminate();dialog.close();dialog.remove();error?reject(error):resolve(value);};
  const setBusy=value=>{busy=value;map.setBusy(value);$('[data-confirm]').disabled=value||!layout||(stage==='buildings'&&!!layout.conflicts?.length);$('[data-back]').disabled=value;dialog.toggleAttribute('data-busy',value);$('svg').setAttribute('aria-busy',String(value));for(const el of $('[data-panel]').querySelectorAll('button,select'))el.disabled=value;};
  $('[data-cancel]').onclick=()=>finish(null,new DOMException('지도 정돈을 취소했습니다.','AbortError'));
  dialog.oncancel=e=>{e.preventDefault();if(!$('[data-panel]').hidden){$('[data-panel]').hidden=true;$('svg').focus();}else $('[data-cancel]').click();};
  const map=createPreparationMap($('svg'),{radius:Math.max(100,point.radius),origin:point.center,onRoad:(id,e)=>{if(busy)return;selection.select(id,!!e.shiftKey);selectedBuilding=null;redraw();$('svg').focus({preventScroll:true});showPanel();},onBuilding:id=>{if(busy)return;selectedBuilding=id;redraw();$('svg').focus({preventScroll:true});showPanel();},onFront:(id,edge)=>{if(busy)return;selectedBuilding=id;$('svg').focus({preventScroll:true});buildingEdits[id]={...buildingEdits[id],frontEdge:edge};refresh();},onMove:(id,delta)=>{if(busy){redraw();return;}selectedBuilding=id;const old=buildingEdits[id]?.positionOffset||[0,0];buildingEdits[id]={...buildingEdits[id],positionOffset:[old[0]+delta[0],old[1]+delta[1]]};refresh();},onBlank:()=>{$('[data-panel]').hidden=true;},onView:()=>{if(!$('[data-panel]').hidden)placePanel();}});
  function redraw(){if(!selection)return;map.render({roads:layout?.roads||sourceRoads,buildings:layout?.buildings,visibility:layout?.visibility,selection,stage,selectedBuilding,busy,reservation:layout?.reservation,conflicts:layout?.conflicts});if(!$('[data-panel]').hidden)placePanel();}
  function placePanel(){
   const panel=$('[data-panel]'),wrap=$('.preparation-map-wrap'),svg=$('svg');panel.classList.remove('docked');
   const wr=wrap.getBoundingClientRect(),pr=panel.getBoundingClientRect(),nodes=stage==='roads'?[...svg.querySelectorAll('[data-road]')].filter(n=>selection?.selected.has(n.dataset.road)):[...svg.querySelectorAll('path[data-building]')].filter(n=>n.dataset.building===selectedBuilding);
   const targets=nodes.map(n=>n.getBoundingClientRect());const gap=14,w=pr.width,h=pr.height;
   const positions=[[wr.width-w-gap,gap],[gap,gap],[wr.width-w-gap,wr.height-h-gap],[gap,wr.height-h-gap]];
   const fit=positions.find(([x,y])=>x>=0&&y>=0&&targets.every(r=>wr.left+x+w+gap<r.left||wr.left+x-gap>r.right||wr.top+y+h+gap<r.top||wr.top+y-gap>r.bottom));
   if(fit){panel.style.left=fit[0]+'px';panel.style.top=fit[1]+'px';}else{panel.classList.add('docked');panel.style.left='';panel.style.top='';}
  }
  function showPanel(){
   const panel=$('[data-panel]');panel.replaceChildren();
   if(stage==='roads'){
    if(!selection.selected.size){panel.hidden=true;return;}
    const label=document.createElement('label');label.textContent='도로 등급';const select=document.createElement('select');select.setAttribute('aria-label','도로 등급');
    if(selection.grade===null)select.add(new Option('등급 선택',''));
    for(let i=0;i<5;i++)select.add(new Option(gradeLabels[i],String(i)));
    select.value=selection.grade===null?'':String(selection.grade);select.onchange=()=>{if(select.value==='')return;try{selection.setGrade(Number(select.value));refresh();}catch(e){status(e.message);}};label.append(select);panel.append(label);
   }else{
    const f=layout.buildings.features.find(f=>String(f.properties.objectid)===selectedBuilding);if(!f){panel.hidden=true;return;}const id=selectedBuilding,p=f.properties.streetProfile;
    const useLabel=document.createElement('label');useLabel.textContent='건물 용도';const use=document.createElement('select');use.setAttribute('aria-label','건물 용도');use.add(new Option('일반 가정집 · 주거 중심','residential'));use.add(new Option('상가주택 · 1층 상가','mixed'));use.value=p.use;use.onchange=()=>{buildingEdits[id]={...buildingEdits[id],use:use.value};refresh();};useLabel.append(use);panel.append(useLabel);
    const frontLabel=document.createElement('label');frontLabel.textContent='입구 면';const front=document.createElement('select');front.setAttribute('aria-label','입구 면');const ring=localPolygons(f,point.center)[0][0];
    ring.forEach((a,i)=>{const b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length>2.4)front.add(new Option(`${i+1}번 면 · ${length.toFixed(1)}m`,String(i)));});front.value=String(p.frontEdge);front.onchange=()=>{buildingEdits[id]={...buildingEdits[id],frontEdge:Number(front.value)};refresh();};frontLabel.append(front);panel.append(frontLabel);
    const hint=document.createElement('small');hint.textContent='숫자는 외벽 면 번호입니다. 번호를 누르면 입구가 옮겨집니다. 건물은 끌거나 방향키로 1m씩 이동합니다.';panel.append(hint);
    if(buildingEdits[id]?.positionOffset?.some(Boolean)){const reset=document.createElement('button');reset.textContent='건물 이동 되돌리기';reset.onclick=()=>{delete buildingEdits[id].positionOffset;refresh();};panel.append(reset);}
   }
   panel.hidden=false;setBusy(busy);placePanel();
  }
  function task(payload){return new Promise((res,rej)=>{waiting={res,rej};worker.postMessage({...point,...payload});});}
  function startWorker(){worker?.terminate();worker=new Worker(new URL('./worker.js?v=map-preparation1',import.meta.url),{type:'module'});const current=worker;worker.onmessage=({data})=>{if(finished||worker!==current)return;if(data.type==='progress'){status(data.message);return;}if(!waiting)return;const pending=waiting;waiting=null;if(data.type==='error')pending.rej(Error(data.message));else pending.res(data);};worker.onerror=e=>{if(finished||worker!==current)return;waiting?.rej(Error(e.message||'지도 계산을 시작하지 못했습니다.'));waiting=null;};}
  const resizeObserver=new ResizeObserver(()=>{if(!$('[data-panel]').hidden)placePanel();});resizeObserver.observe($('svg'));
  async function refresh(){
   setBusy(true);$('[data-retry]').hidden=true;status('도로에 맞춰 건물 배치를 계산하고 있습니다…');
   try{
    const response=await task({mapSetupOnly:true,sourceRoads,sourceBuildingCollection:sourceBuildings,buildingCollection:sourceBuildings,editBuildingCollection:layout?.buildings||previous?.buildingCollection,sceneEdits:{...point.sceneEdits,...selection.snapshot(),buildings:buildingEdits}});
    if(finished)return;if(response.type!=='map'||!response.layout?.buildings?.features)throw Error('지도 계산 결과를 읽지 못했습니다.');
    dialog.dataset.calculationMs=String(response.elapsedMs);layout=response.layout;buildingEdits=structuredClone(layout.sceneEdits.buildings);lastGood={selection:selection.snapshot(),buildingEdits:structuredClone(buildingEdits)};
    status(layout.conflicts?.length?`빨간 부분 ${layout.conflicts.length}곳이 겹칩니다. 건물을 옮기거나 삭제한 뒤 만들어 주세요.`:layout.reservation.qa.omittedBuildings?`도로 밖에 놓을 공간이 없는 건물 ${layout.reservation.qa.omittedBuildings}동은 제외했습니다.`:'');$('[data-candidate]').hidden=false;
   }catch(e){if(finished)return;status(e.message);if(lastGood){selection=createRoadSelection(sourceRoads,lastGood.selection);buildingEdits=structuredClone(lastGood.buildingEdits);}else $('[data-retry]').hidden=false;}
   setBusy(false);redraw();if(!$('[data-panel]').hidden)showPanel();
  }
  async function load(){
   setBusy(true);$('[data-retry]').hidden=true;startWorker();
   try{
    // Observe both failures immediately; source lookup and road preparation are independent.
    const [response,buildings]=await Promise.all([task({sourceRoads:previous?.sourceRoads,roadSetupOnly:true,sceneEdits:point.sceneEdits}),loadBuildings(point,{signal:controller.signal})]);
    if(finished)return;if(response.type!=='roads'||!Array.isArray(response.roads)||!response.roads.length)throw Error('주변 도로 자료가 없습니다. 다른 위치를 선택해 주세요.');
    sourceRoads=response.roads;sourceBuildings=buildings;selection=createRoadSelection(sourceRoads,{...point.sceneEdits,roads:{...Object.fromEntries(sourceRoads.filter(r=>r.manualGrade!==undefined).map(r=>[r.editId,{grade:r.manualGrade}])),...point.sceneEdits?.roads}});await refresh();
   }catch(e){if(finished)return;worker?.terminate();status(e.message);$('[data-retry]').hidden=false;setBusy(false);}
  }
  $('[data-retry]').onclick=load;
  $('[data-back]').onclick=()=>{stage='roads';selectedBuilding=null;$('[data-step]').textContent='1 · 도로';$('[data-back]').hidden=true;$('[data-confirm]').textContent='동네 만들기';$('[data-panel]').hidden=true;setBusy(false);redraw();};
  $('[data-confirm]').onclick=()=>{if(busy||!layout)return;if(stage==='roads'){stage='buildings';selection.selected.clear();$('[data-step]').textContent='2 · 건물';$('[data-back]').hidden=false;$('[data-confirm]').textContent='이 지도로 동네 만들기';$('[data-panel]').hidden=true;setBusy(false);redraw();return;}if(layout.conflicts?.length){status('빨간 겹침을 수정한 뒤 동네를 만들어 주세요.');return;}finish({...point,force:true,sourceRoads,sourceBuildingCollection:sourceBuildings,buildingCollection:sourceBuildings,editBuildingCollection:layout.buildings,sceneEdits:{...point.sceneEdits,...selection.snapshot(),buildings:buildingEdits}});};
  dialog.addEventListener('keydown',e=>{if(busy||!selection||e.repeat||e.isComposing||e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(!e.metaKey&&!e.ctrlKey&&!e.altKey&&['Delete','Backspace'].includes(e.key)){e.preventDefault();if(stage==='roads'){if(!selection.selected.size)return;selection.remove();}else{if(!selectedBuilding)return;buildingEdits[selectedBuilding]={...buildingEdits[selectedBuilding],deleted:true};selectedBuilding=null;}$('[data-panel]').hidden=true;refresh();return;}if(stage!=='roads')return;if((e.metaKey||e.ctrlKey)&&!e.altKey&&e.key.toLowerCase()==='g'&&!e.target.closest('input,textarea,select')){e.preventDefault();if(selection.selected.size<2)return;try{selection.group();refresh();}catch(error){status(error.message);}}});
  load();
 });
}
