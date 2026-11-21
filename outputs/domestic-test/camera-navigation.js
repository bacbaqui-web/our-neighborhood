import * as T from 'three';

export function setupCameraNavigation({camera,controls,canvas,host,isWalking,isReady,getMap}){
 const panel=document.createElement('div');panel.className='neighborhood-minimap';
 panel.innerHTML='<canvas width="360" height="360" role="img" aria-label="동네 미니맵. 주황색 점은 처음 선택한 생성 기준점, 화살표는 현재 위치입니다."></canvas><span>북 ↑ · ● 기준점 · ▲ 현재 위치</span>';
 const map=panel.querySelector('canvas');map.style.cssText='width:100%;height:auto;display:block';panel.querySelector('span').style.cssText='display:block;text-align:center;font-size:11px;color:#254650';host.append(panel);
 const ctx=map.getContext('2d'),base=document.createElement('canvas');base.width=base.height=360;const b=base.getContext('2d');
 const keys=new Set(),direction=new T.Vector3(),right=new T.Vector3();let drag=null,last=0,baked=false,radius=100,lastMap=0;
 canvas.tabIndex=0;controls.maxPolarAngle=Math.PI-.05;controls.minPolarAngle=.05;
 const editable=()=>document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]');
 const clear=()=>{keys.clear();if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;};
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 window.addEventListener('keydown',e=>{if(isWalking()||!isReady()||editable()||!['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;e.preventDefault();keys.add(e.code);});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 canvas.addEventListener('pointerdown',e=>{if(isWalking()||!isReady()||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},true);
 canvas.addEventListener('pointermove',e=>{
  if(!drag||isWalking())return;e.stopImmediatePropagation();camera.getWorldDirection(direction);
  const yaw=Math.atan2(direction.x,direction.z)-(e.clientX-drag.x)*.004;
  const pitch=T.MathUtils.clamp(Math.asin(direction.y)-(e.clientY-drag.y)*.004,-1.45,1.35);
  const distance=Math.max(5,camera.position.distanceTo(controls.target));
  direction.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));controls.target.copy(camera.position).addScaledVector(direction,distance);camera.lookAt(controls.target);drag.x=e.clientX;drag.y=e.clientY;
 },true);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;},true);
 function point(x,z){return [180+x/radius*165,180+z/radius*165];}
 function bake(){
  const data=getMap();radius=Math.max(50,data.radius,Math.abs(camera.position.x)*1.15,Math.abs(camera.position.z)*1.15);b.fillStyle='#dce5dc';b.fillRect(0,0,360,360);
  b.save();b.beginPath();b.arc(180,180,165,0,Math.PI*2);b.clip();
  for(const mesh of data.ground){if(!['road','path'].includes(mesh.name))continue;mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position,ix=mesh.geometry.index;b.fillStyle='#8b969c';
   for(let i=0;i<(ix?ix.count:p.count);i+=3){b.beginPath();for(let j=0;j<3;j++){direction.fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld);const q=point(direction.x,direction.z);j?b.lineTo(...q):b.moveTo(...q);}b.closePath();b.fill();}
  }
  b.fillStyle='#bbc4b7';b.strokeStyle='#667b77';b.lineWidth=1;
  for(const polygon of data.buildings){b.beginPath();polygon.forEach((v,i)=>{const p=point(...v);i?b.lineTo(...p):b.moveTo(...p);});b.closePath();b.fill();b.stroke();}b.restore();b.strokeStyle='#80958b';b.beginPath();b.arc(180,180,165,0,Math.PI*2);b.stroke();const origin=point(0,0);b.fillStyle='#b84624';b.strokeStyle='white';b.lineWidth=3;b.beginPath();b.arc(...origin,7,0,Math.PI*2);b.fill();b.stroke();b.fillStyle='#713319';b.font='bold 18px system-ui';b.fillText('기준점',origin[0]+11,origin[1]-9);baked=true;
 }
 function update(now){
  const dt=Math.min((now-(last||now))/1000,.05);last=now;if(!isReady())return;
  if(isWalking()||editable())keys.clear();
  if(keys.size){camera.getWorldDirection(direction);direction.y=0;if(direction.lengthSq()<.001)direction.set(0,0,-1);direction.normalize();right.crossVectors(direction,camera.up).normalize();
   const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),s=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));const movement=direction.clone().multiplyScalar(f).addScaledVector(right,s);if(movement.lengthSq()){movement.normalize().multiplyScalar(6.6*dt);camera.position.add(movement);controls.target.add(movement);}
  }
  if(!baked)bake();if(now-lastMap<100)return;lastMap=now;ctx.clearRect(0,0,360,360);ctx.drawImage(base,0,0);camera.getWorldDirection(direction);const q=point(camera.position.x,camera.position.z),x=T.MathUtils.clamp(q[0],10,350),y=T.MathUtils.clamp(q[1],10,350);
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(direction.x,-direction.z));ctx.fillStyle='#087a93';ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(10,10);ctx.lineTo(0,5);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  map.dataset.position=[camera.position.x,camera.position.z].map(v=>v.toFixed(2)).join(',');
 }
 return {update};
}
