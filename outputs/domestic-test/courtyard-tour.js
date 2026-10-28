import * as T from 'three';
export function installCourtyardTour({report,camera,controls,buildings,blockers,elevation,requestRender}){
 const box=document.createElement('section');box.style.cssText='padding:12px;border:1px solid #b7cac7;border-radius:10px;margin:12px 0;font-size:13px';box.id='courtyardRepairPanel';
 const title=document.createElement('b');title.textContent='담장 연결·생활마당 수정';box.append(title);
 const summary=document.createElement('p'),bridges=report.courtyardRepair.bridges,pockets=report.courtyardPockets;summary.textContent=`담장 연결 ${bridges.length}곳 · 생활 공간 ${pockets.length}곳 · 출입 통로와 주차 진입부 보호`;box.append(summary);
 const views=bridges.filter(b=>b.length>.45&&b.height>.4).map(b=>{const x=(b.a[0]+b.b[0])/2,z=(b.a[1]+b.b[1])/2;return {x,z,y:elevation(x,z),angle:Math.atan2(-(b.b[1]-b.a[1]),b.b[0]-b.a[0]),span:Math.max(4,b.length*2),label:`담장 연결 ${b.length.toFixed(1)}m · ${b.owner}`,owner:b.owner};}).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)).slice(0,8);
 for(const pocket of pockets){const p=pocket.members[0];views.push({...p,span:5,label:pocket.label+' · '+p.name,owner:pocket.owner});}
 const select=document.createElement('select');select.id='courtyardRepairView';select.style.width='100%';select.add(new Option('수정한 공간 보기',''));views.forEach((v,i)=>select.add(new Option(v.label,String(i))));box.append(select);
 const note=document.createElement('p');note.id='courtyardRepairNote';note.textContent='담장은 기존 높이·재질을 잇고, 소품은 벽 옆에 접지합니다. 실제 현장을 그대로 복원한 위치는 아닙니다.';box.append(note);
 const ray=new T.Raycaster(),bb=buildings.map(m=>new T.Box3().setFromObject(m)),walls=(blockers||[]).map(b=>new T.Box3(new T.Vector3(...b[0]),new T.Vector3(...b[1])));
 select.onchange=()=>{if(select.value==='')return;const p=views[Number(select.value)],target=new T.Vector3(p.x,p.y+.65,p.z);let best=null;
  for(const offset of [0,.65,-.65,1.3,-1.3,Math.PI])for(const rise of [2.4,4.5,7]){const angle=p.angle+offset,position=new T.Vector3(p.x+Math.sin(angle)*p.span,p.y+rise,p.z+Math.cos(angle)*p.span);position.y=Math.max(position.y,elevation(position.x,position.z)+1.7);const direction=position.clone().sub(target),distance=direction.length();ray.set(target,direction.normalize());ray.far=distance;
   const hidden=ray.intersectObjects(buildings,true).some(h=>h.distance>.15&&h.distance<distance)||walls.some(b=>{if(b.distanceToPoint(target)<.5)return false;const hit=ray.ray.intersectBox(b,new T.Vector3());return hit&&hit.distanceTo(target)<distance;});const score=(hidden?100:0)+(bb.some(b=>b.containsPoint(position))?200:0)+Math.abs(offset)+rise*.25;if(!best||score<best.score)best={position,score};
  }controls.target.copy(target);camera.position.copy(best.position);controls.update();requestRender();note.textContent=p.label;note.dataset.view=JSON.stringify({...p,camera:best.position.toArray(),score:best.score});
 };
 const seenOwners=new Set(pockets.map(p=>p.owner));function update(rows){for(const pocket of rows){if(seenOwners.has(pocket.owner))continue;seenOwners.add(pocket.owner);const p=pocket.members[0];const v={...p,span:5,label:pocket.label+' · '+p.name,owner:pocket.owner};views.push(v);select.add(new Option(v.label,String(views.length-1)));}summary.textContent=`담장 연결 ${bridges.length}곳 · 둘러본 생활 공간 ${seenOwners.size}곳 · 현재 불러온 공간 ${rows.length}곳`;}
 document.getElementById('environmentControls').append(box);const requested=new URLSearchParams(location.search).get('courtyard');if(requested!==null&&views[Number(requested)]){select.value=requested;select.onchange();}return {update};
}
