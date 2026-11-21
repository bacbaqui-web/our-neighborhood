import * as T from 'three';
import {categories,assetById,inferCategory,readPalette,readEdits} from './catalog.js?v=scene-edit1';
import {createPreview} from './preview.js?v=context-preview1';
import {readEditorSource,rebuildEditedScene,nearestRoad} from './scene-edit-store.js';
import {localPolygons,editorContext,previewSpecs,eraStyle} from './preview-data.js';
import {drawContextMap} from './context-map.js';
const CAMERA='neighborhood-building-edit-camera-v1';
export function restoreEditCamera({id,camera,controls,walking}){const raw=sessionStorage.getItem(CAMERA);if(!raw)return;sessionStorage.removeItem(CAMERA);let s;try{s=JSON.parse(raw);}catch{return;}if(s.id!==id||!Array.isArray(s.position)||s.position.length!==3||!s.position.every(Number.isFinite)||!Number.isFinite(s.yaw)||!Number.isFinite(s.pitch))return;if(s.walking)walking.start(s.position[0],s.position[2],s.yaw,s.pitch);else{camera.position.fromArray(s.position);const dir=new T.Vector3(0,0,-1).applyEuler(new T.Euler(s.pitch,s.yaw,0,'YXZ'));controls.target.copy(camera.position).addScaledVector(dir,10);controls.update();}}
export function installBuildingEditor({canvas,scene,camera,controls,getBuildings,host,id,walking,render,context,load,elevation}){
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./style.css?v=context-preview1',import.meta.url).href;document.head.append(css);
 const dialog=document.createElement('dialog');dialog.className='building-editor';dialog.setAttribute('aria-labelledby','buildingEditTitle');
 dialog.innerHTML=`<form aria-labelledby="buildingEditTitle"><div class="heading"><h2 id="buildingEditTitle">건물 정보 수정</h2><button type="button" data-close>닫기</button></div><p data-address></p><p data-info class="muted"></p>
 <fieldset data-road hidden><legend>도로 등급</legend><label>길 종류<select name="grade" data-grade autofocus><option value="1">1차도로 · 사람과 차가 함께 다니는 길</option><option value="2">2차도로 · 왕복 2차선과 인도</option><option value="3">3차도로 · 왕복 4차선과 인도</option><option value="4">4차도로 · 왕복 6차선 이상과 인도</option></select></label><p>적용하면 이 도로에 접한 건물의 정면·용도·외관과 주변 배치를 자동으로 다시 만듭니다. 직접 지정한 건물 정보는 유지합니다.</p></fieldset>
 <fieldset data-building><legend>건물 구성</legend><div class="fields"><label>건물 분류<select name="category" data-category></select></label><label>디자인<select name="asset" data-asset></select></label><label>층수<input name="floors" data-floors type="number" min="1" max="200" step="1" required></label><label>연식<select name="era" data-era><option value="old">오래된 건물</option><option value="middle">중간 연식 건물</option><option value="new">신식 건물</option></select></label><label>용도<select name="use" data-use><option value="residential">주거 중심</option><option value="mixed">1층 상가 · 위층 주거·업무</option></select></label></div>
 <p>주변 도로와 이웃 건물을 보면서 입구 면을 선택하세요. 위쪽은 북쪽입니다.</p><svg data-footprint viewBox="0 0 240 180" role="img" aria-label="주변 도로와 이웃 건물, 선택한 건물의 입구 방향"></svg><p class="map-legend">청록색: 선택한 건물 · 회색: 이웃 건물 · 진회색: 도로 · 화살표: 입구</p><label>입구 방향<select name="frontEdge" data-front></select></label><h3>건물 외형 미리보기</h3><p class="muted" data-preview-info></p><div class="preview" data-preview aria-label="선택한 건물의 외형 미리보기"></div><p class="muted">드래그하면 회전하고 휠로 확대할 수 있습니다. 부지·상가 입구·주차는 적용할 때 주변 공간에 맞춰 계산합니다.</p></fieldset>
 <div class="actions"><button type="submit" data-apply class="primary">수정하고 자동 갱신</button><button type="button" data-reset>이 대상의 자동 설정으로 복원</button></div><p data-status role="status" aria-live="polite"></p></form>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s),form=$('form'),category=$('[data-category]'),model=$('[data-asset]'),status=$('[data-status]');
 for(const c of categories)category.add(new Option(c.name,c.id));
 let selected=null,selectedRoad=null,preview=null,marker=null,wasEnabled=true,palette,source=null,dirty=new Set(),busy=false,saving=false,controller=null,previewTimer=null,mapContext=null;
 const sourcePromise=readEditorSource(context,load).then(s=>source=s);
 sourcePromise.catch(()=>{});
 function clearMarker(){if(!marker)return;scene.remove(marker);marker.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});marker=null;render();}
 function close(){if(busy){if(!saving)controller?.abort();return;}dialog.close();}
 $('[data-close]').onclick=close;
 dialog.addEventListener('cancel',e=>{if(busy){e.preventDefault();if(!saving)controller?.abort();}});
 dialog.addEventListener('close',()=>{clearTimeout(previewTimer);preview?.dispose();preview=null;clearMarker();controls.enabled=wasEnabled;render();});
 function options(preferred){model.replaceChildren();let ids=palette.groups[category.value];if(assetById[preferred]?.category===category.value&&!ids.includes(preferred))ids=[preferred,...ids];for(const key of ids)model.add(new Option(assetById[key].name,key));if(ids.includes(preferred))model.value=preferred;updatePreview();}
 category.onchange=()=>{options(null);dirty.add('assetId');};model.onchange=()=>{dirty.add('assetId');updatePreview();};
 for(const key of ['floors','era','use','front'])$('[data-'+key+']').addEventListener('input',()=>{dirty.add(key==='front'?'frontEdge':key);if(key==='front')drawFootprint();else{clearTimeout(previewTimer);previewTimer=setTimeout(updatePreview,120);}});
 function feature(){const f=source.input.buildingCollection.features.find(f=>String(f.properties.objectid)===String(selected.userData.objectid));if(!f)throw Error('선택한 건물의 원본을 찾지 못했습니다.');return f;}
 function ring(){return localPolygons(feature(),context.origin)[0][0];}
 function updatePreview(){
  if(!preview||!selected||!$('[data-floors]').checkValidity())return;
  const floors=Number($('[data-floors]').value),frontEdge=Number($('[data-front]').value),era=$('[data-era]').value,use=$('[data-use]').value;
  const owner=String(selected.userData.objectid),edit=source.edits.buildings[owner]||{},legacy=!edit.resetLegacyAsset&&readEdits()[owner];
  if(dirty.has('era')&&!dirty.has('assetId')&&!edit.assetId&&edit.styleIndex===undefined&&!legacy&&model.value.startsWith('home-')){const predicted='home-'+eraStyle(owner,era);if(![...model.options].some(o=>o.value===predicted))model.add(new Option(assetById[predicted].name,predicted));model.value=predicted;}
  const specs=previewSpecs(feature(),context.origin,{floors,frontEdge,era,use});
  try{preview.show(assetById[model.value],specs);$('[data-preview-info]').textContent=`실제 건물 윤곽 · ${floors}층 · ${assetById[model.value].name} · 입구 면 ${frontEdge+1}`;}
  catch(e){$('[data-preview-info]').textContent='미리보기를 표시하지 못했습니다. '+e.message;}
 }
 function drawFootprint(){
  const ps=ring(),edge=Number($('[data-front]').value);
  drawContextMap($('[data-footprint]'),mapContext,edge,i=>{if(busy)return;$('[data-front]').value=String(i);dirty.add('frontEdge');drawFootprint();});
  clearMarker();const a=ps[edge],b=ps[(edge+1)%ps.length];marker=new T.Line(new T.BufferGeometry().setFromPoints([a,b].map(([x,z])=>new T.Vector3(x,elevation(x,z)+.5,z))),new T.LineBasicMaterial({color:0x087e84,depthTest:false}));marker.renderOrder=1000;scene.add(marker);render();updatePreview();
 }
 async function open(mesh,road){
  try{
   await sourcePromise;selected=mesh;selectedRoad=road;dirty.clear();status.textContent='';palette=readPalette();wasEnabled=controls.enabled;controls.enabled=false;
   const isRoad=!!road;$('[data-road]').hidden=!isRoad;$('[data-road]').disabled=!isRoad;$('[data-building]').hidden=isRoad;$('[data-building]').disabled=isRoad;
   $('#buildingEditTitle').textContent=isRoad?'도로 정보 수정':'건물 정보 수정';
   $('[data-address]').textContent=isRoad?(road.properties.name||'선택한 도로 구간'):[mesh.userData.street_name,mesh.userData.house_number].filter(Boolean).join(' ')||'선택한 건물';
   if(isRoad){
    const grade=source.edits.roads[road.editId]?.grade||road.grade||({'tertiary':2,'primary':3,'secondary':3,'trunk':3}[road.properties.class]||1);$('[data-grade]').value=String(grade);
    $('[data-info]').textContent=(source.edits.roads[road.editId]?'사용자 지정':'자동 추정')+' · 표시한 도로 구간 전체에 적용합니다.';
    clearMarker();marker=new T.Line(new T.BufferGeometry().setFromPoints(road.geometry.coordinates.map(([x,z])=>new T.Vector3(x,elevation(x,z)+.25,z))),new T.LineBasicMaterial({color:0x087e84,depthTest:false}));scene.add(marker);
   }else{
    const p=mesh.userData,profile=p.streetProfile||{},edit=source.edits.buildings[String(p.objectid)]||{},asset=assetById[edit.assetId||(!edit.resetLegacyAsset&&readEdits()[String(p.objectid)])||p.buildingAsset||'home-'+(profile.styleIndex??Math.abs(Number(p.objectid))%6)];
    category.value=asset?.category||inferCategory(p);$('[data-floors]').value=edit.floors??p.gro_flo_co??1;$('[data-era]').value=edit.era||profile.era||'old';$('[data-use]').value=edit.use||profile.use||'residential';
    const front=$('[data-front]');const ps=ring();front.replaceChildren(...ps.map((a,i)=>{const b=ps[(i+1)%ps.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),o=new Option('면 '+(i+1)+' · '+length.toFixed(1)+'m'+(length<=2.4?' (입구 공간 부족)':''),i);o.disabled=length<=2.4;return o;}));front.value=String(edit.frontEdge??profile.frontEdge??p.editFrontEdge??0);
    $('[data-info]').textContent=`층수: ${edit.floors!==undefined?'사용자 지정':p.floorsEstimated?'자동 추정':'원본 자료'} · 연결 도로: ${profile.grade?profile.grade+'차도로':'미확인'} · 디자인·연식·입구: ${Object.keys(edit).length?'사용자 지정 항목 포함':'자동 추정'}`;
    mapContext=editorContext(feature(),source.input.buildingCollection.features,source.roads,context.origin);dialog.showModal();preview=createPreview($('[data-preview]'));options(asset?.id);drawFootprint();dialog.dataset.owner=String(p.objectid);return;
   }
   dialog.showModal();render();
  }catch(e){if(dialog.open)status.textContent=e.message;else document.getElementById('status').textContent='편집을 열지 못했습니다. '+e.message;controls.enabled=wasEnabled;}
 }
 async function apply(reset=false){
  if(busy||(!reset&&!form.reportValidity()))return;
  const edits=structuredClone(source.edits);
  if(selectedRoad){if(reset)delete edits.roads[selectedRoad.editId];else edits.roads[selectedRoad.editId]={grade:Number($('[data-grade]').value)};}
  else{
   const owner=String(selected.userData.objectid);
   if(reset)edits.buildings[owner]={resetLegacyAsset:true};
   else{
    const edit={...edits.buildings[owner]};for(const key of dirty){if(key==='assetId'){edit.assetId=model.value;const asset=assetById[model.value];if(asset.styleIndex!==undefined)edit.styleIndex=asset.styleIndex;else delete edit.styleIndex;}else edit[key]=['floors','frontEdge'].includes(key)?Number($('[data-'+(key==='frontEdge'?'front':key)+']').value):$('[data-'+key+']').value;}
    edits.buildings[owner]=edit;
   }
  }
  busy=true;$('[data-road]').disabled=true;$('[data-building]').disabled=true;controller=new AbortController();$('[data-apply]').disabled=true;$('[data-reset]').disabled=true;$('[data-close]').textContent='계산 취소';
  try{
   await rebuildEditedScene(source,edits,(message,percent,phase)=>{saving=!!phase?.saving;$('[data-close]').disabled=saving;status.textContent=`${message} ${percent}%`;},{signal:controller.signal});
   const angle=new T.Euler().setFromQuaternion(camera.quaternion,'YXZ');sessionStorage.setItem(CAMERA,JSON.stringify({id,position:camera.position.toArray(),yaw:angle.y,pitch:angle.x,walking:walking.isActive()}));
   const url=new URL(location.href);url.searchParams.set('location',id);location.assign(url);
  }catch(e){status.textContent=e.message+' 다시 적용할 수 있습니다.';}
  finally{busy=false;saving=false;$('[data-close]').disabled=false;$('[data-road]').disabled=!selectedRoad;$('[data-building]').disabled=!!selectedRoad;controller=null;$('[data-apply]').disabled=false;$('[data-reset]').disabled=false;$('[data-close]').textContent='닫기';}
 }
 form.addEventListener('submit',e=>{e.preventDefault();apply();});$('[data-reset]').onclick=()=>apply(true);
 const ray=new T.Raycaster(),point=new T.Vector2();let start=null;
 window.addEventListener('pointerdown',e=>{if(e.target!==canvas||e.button!==0||!e.shiftKey||dialog.open)return;start=[e.clientX,e.clientY];e.preventDefault();e.stopImmediatePropagation();},true);
 window.addEventListener('pointerup',async e=>{if(!start)return;const from=start;start=null;e.preventDefault();e.stopImmediatePropagation();if(e.target!==canvas||Math.hypot(e.clientX-from[0],e.clientY-from[1])>5)return;
  const r=canvas.getBoundingClientRect();point.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(point,camera);const meshes=getBuildings(),byInk=new Map(meshes.map(m=>[m.id,m])),byOwner=new Map(meshes.map(m=>[Number(m.userData.objectid),m]));const candidates=[];
  scene.traverseVisible(o=>{if(o.isMesh&&!o.userData.isBillboardShadow&&!o.userData.isPedestrianShadow&&!o.userData.isVegetationSunCaster)candidates.push(o);});
  try{await sourcePromise;for(const hit of ray.intersectObjects(candidates,false)){
   let chosen=null,o=hit.object;const attr=o.geometry?.getAttribute('inkObjectId');if(attr&&hit.face)chosen=byInk.get(Math.round(attr.getX(hit.face.a)))||byOwner.get(Math.round(attr.getX(hit.face.a)));
   for(;o&&!chosen;o=o.parent)chosen=byOwner.get(Number(o.userData.objectid??o.userData.windowOwner??o.userData.owner));
   if(chosen){await open(chosen,null);return;}if(hit.object.material?.opacity===0)continue;
   const road=nearestRoad(source.roads,hit.point);if(road&&/road|asphalt|ground|surface|arterial|wear/i.test(hit.object.name)){await open(null,road);return;}break;
  }document.getElementById('status').textContent='도로 표면이나 건물 벽을 Shift + 클릭하세요.';
  }catch(error){document.getElementById('status').textContent='수정 자료를 읽지 못했습니다. '+error.message;}
 },true);
 window.addEventListener('blur',()=>start=null);window.addEventListener('pointercancel',()=>start=null);
}
