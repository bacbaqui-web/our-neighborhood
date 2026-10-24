import * as T from 'three';
import {setupNumberScrub} from './ui-controls.js?v=37';

export function setupWalk({camera,controls,renderer,host,elevation,roadInfo,getGround,getBuildings,getBoundarySegments=()=>[],isLoaded}){
 const canvas=renderer.domElement,walkButton=document.getElementById('walk');
 let mode='off',eyeHeight=1.65,yaw=0,pitch=0,drag=null,saved=null,last=performance.now();
 const keys=new Set(),ray=new T.Raycaster(),mouse=new T.Vector2();
 const hud=document.createElement('div');hud.id='walkHUD';hud.hidden=true;
 hud.innerHTML=`<div class="walk-info"><strong id="walkTitle">출발할 골목을 클릭하세요</strong>
  <div class="walk-eye-row"><label for="walkEyeHeight">눈높이</label><span class="number-field"><input id="walkEyeHeight" type="number" min="0.3" max="10" step="0.05" value="1.65" aria-label="걷기 눈높이" title="지면 기준 높이 · 직접 입력 / 휠 / 드래그로 조절"><span aria-hidden="true">m</span></span><button id="walkEyeReset" type="button" class="small-reset" aria-label="눈높이 1.65m로 초기화" title="기본 눈높이 1.65m">↺</button></div>
  <p id="walkHelp"></p></div>
  <div class="buttons"><button id="walkMap" type="button">위에서 위치 고르기</button><button id="walkExit" type="button">걷기 종료</button></div>
  <div id="walkPad"><button type="button" data-move="ArrowUp">앞으로 ↑</button><button type="button" data-move="ArrowLeft">← 왼쪽</button><button type="button" data-move="ArrowDown">뒤로 ↓</button><button type="button" data-move="ArrowRight">오른쪽 →</button></div>`;
 host.append(hud);
 const title=hud.querySelector('#walkTitle'),help=hud.querySelector('#walkHelp'),heightInput=hud.querySelector('#walkEyeHeight');
 function report(){host.dataset.walkState=JSON.stringify({mode,eyeHeight,position:camera.position.toArray(),ground:elevation(camera.position.x,camera.position.z),yaw,pitch});}
 function clearInput(){keys.clear();if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;}
 function mapHelp(){help.textContent=`도로를 클릭하면 설정한 눈높이 ${eyeHeight.toFixed(2)}m로 내려갑니다.`;}
 const setNumber=setupNumberScrub(heightInput,value=>{eyeHeight=value;if(mode==='walk')camera.position.y=elevation(camera.position.x,camera.position.z)+eyeHeight;else if(mode==='pick')mapHelp();report();});
 hud.querySelector('#walkEyeReset').onclick=()=>{setNumber(1.65);eyeHeight=1.65;if(mode==='walk')camera.position.y=elevation(camera.position.x,camera.position.z)+eyeHeight;else if(mode==='pick')mapHelp();report();};
 function blocked(x,z){
  if(Math.abs(x)>140||Math.abs(z)>140)return true;
  for(const s of getBoundarySegments()){
   if(x<Math.min(s.a[0],s.b[0])-.5||x>Math.max(s.a[0],s.b[0])+.5||z<Math.min(s.a[1],s.b[1])-.5||z>Math.max(s.a[1],s.b[1])+.5)continue;
   const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],l=dx*dx+dz*dz,t=l?T.MathUtils.clamp(((x-s.a[0])*dx+(z-s.a[1])*dz)/l,0,1):0;
   if(Math.hypot(x-s.a[0]-dx*t,z-s.a[1]-dz*t)<s.width/2+.3)return true;
  }
  for(const [dx,dz] of [[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3]]){ray.set(new T.Vector3(x+dx,1000,z+dz),new T.Vector3(0,-1,0));if(ray.intersectObjects(getBuildings(),false).length)return true;}
  return false;
 }
 function setView(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);report();}
 function map(){
  if(!saved)saved={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};
  mode='pick';host.dataset.walkMode=mode;walkButton.setAttribute('aria-pressed','true');walkButton.classList.add('active');clearInput();controls.enabled=false;hud.hidden=false;host.classList.add('walking');
  title.textContent='출발할 골목을 클릭하세요';mapHelp();hud.querySelector('#walkPad').hidden=true;
  camera.fov=43;camera.updateProjectionMatrix();camera.position.set(0,Math.max(430,430/camera.aspect),.01);camera.lookAt(0,0,0);report();
 }
 function exit(){
  if(mode==='off')return;mode='off';host.dataset.walkMode=mode;walkButton.setAttribute('aria-pressed','false');clearInput();hud.hidden=true;host.classList.remove('walking');controls.enabled=true;
  if(saved){camera.fov=saved.fov;camera.updateProjectionMatrix();camera.position.copy(saved.pos);controls.target.copy(saved.target);controls.update();saved=null;}
  walkButton.classList.remove('active');report();
 }
 function enter(x,z){
  if(!roadInfo(x,z)||blocked(x,z)){help.textContent='건물 안이나 막힌 곳은 선택할 수 없습니다. 도로의 가운데를 클릭하세요.';return;}
  mode='walk';host.dataset.walkMode=mode;yaw=0;let best=-1;
  for(let i=0;i<24;i++){const angle=i*Math.PI/12;let distance=0;for(let d=.5;d<18;d+=.75){if(!roadInfo(x-Math.sin(angle)*d,z-Math.cos(angle)*d))break;distance=d;}if(distance>best){best=distance;yaw=angle;}}
  pitch=0;camera.fov=65;camera.updateProjectionMatrix();camera.position.set(x,elevation(x,z)+eyeHeight,z);setView();title.textContent='골목 걷기';help.textContent='장면 클릭 후 WASD / 방향키: 이동 · 드래그: 둘러보기 · Esc: 종료';hud.querySelector('#walkPad').hidden=false;canvas.focus({preventScroll:true});
 }
 canvas.tabIndex=0;
 canvas.addEventListener('pointerdown',e=>{if(mode==='off')return;e.stopImmediatePropagation();if(e.button!==0)return;canvas.focus({preventScroll:true});if(mode==='walk'){drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);}},true);
 canvas.addEventListener('pointermove',e=>{if(mode==='walk'&&drag){yaw-=(e.clientX-drag.x)*.004;pitch=T.MathUtils.clamp(pitch-(e.clientY-drag.y)*.004,-1.15,1.15);drag.x=e.clientX;drag.y=e.clientY;setView();}},true);
 canvas.addEventListener('pointerup',e=>{if(mode==='off')return;e.stopImmediatePropagation();if(e.button===0&&mode==='pick'){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(getGround(),false)[0];if(hit)enter(hit.point.x,hit.point.z);}if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;},true);
 for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
 // UI keyboard events belong to settings, numeric fields and dialogs. Resume
 // walking only after the canvas receives focus again; held keys never stick.
 document.addEventListener('focusin',e=>{if(e.target!==canvas)clearInput();});
 document.addEventListener('pointerdown',e=>{if(e.target!==canvas)clearInput();},true);
 window.addEventListener('keydown',e=>{
  if(mode==='off'||document.querySelector('dialog[open]')||e.target!==canvas)return;
  if(e.code==='Escape'){e.preventDefault();exit();return;}
  if(mode==='walk'&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
 });
 window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
 for(const b of hud.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);});for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,()=>keys.delete(b.dataset.move));}
 hud.querySelector('#walkMap').onclick=map;hud.querySelector('#walkExit').onclick=exit;walkButton.onclick=()=>{if(isLoaded())map();};
 function update(now){
  const dt=Math.min((now-last)/1000,.05);last=now;if(mode!=='walk')return;
  if(document.querySelector('dialog[open]')){clearInput();return;}
  const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  if(!forward&&!side)return;
  const norm=Math.hypot(forward,side),speed=6.6*dt/norm,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
  for(const axis of [0,1]){const x=camera.position.x+(axis===0?dx:0),z=camera.position.z+(axis===1?dz:0);if(blocked(x,z)||Math.abs(elevation(x,z)-(camera.position.y-eyeHeight))>.3)continue;camera.position.set(x,elevation(x,z)+eyeHeight,z);}
  report();
 }
 return{update,exit,start(x,z,direction,tilt=0){map();enter(x,z);if(mode==='walk'&&Number.isFinite(direction)){yaw=direction;pitch=T.MathUtils.clamp(Number.isFinite(tilt)?tilt:0,-1.15,1.15);setView();}},isActive:()=>mode!=='off'};
}
