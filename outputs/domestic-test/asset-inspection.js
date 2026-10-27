import * as T from 'three';
// Storefront pot geometry stays in its model; all living foliage joins the tree system.
export function collectShopPlants(root){const records=[];root.updateMatrixWorld(true);root.traverse(o=>{for(const p of o.userData.plantAnchors||[]){const scale=o.getWorldScale(new T.Vector3());records.push({...p,id:p.id+'-'+(o.userData.placeId||records.length),root:new T.Vector3(...p.root).applyMatrix4(o.matrixWorld).toArray(),height:p.height*scale.y,radius:p.radius*Math.max(scale.x,scale.z)});}});return records;}
export function installAssetInspection({placements,camera,controls,elevation,buildings,blockers=[],requestRender}){
 const section=document.createElement('section');section.id='allAssetInspection';section.style.cssText='border:1px solid #b3c7c8;padding:12px;margin:12px 0;border-radius:10px;font-size:13px';
 const title=document.createElement('b');title.textContent='동네 소품 전체 둘러보기';section.append(title);
 const intro=document.createElement('p');intro.textContent='새 소품과 기존 소품을 모두 확인합니다. 유형을 고른 뒤 같은 소품의 다른 위치로 이동할 수 있습니다.';section.append(intro);
 const select=document.createElement('select');select.id='allAssetType';select.setAttribute('aria-label','전체 소품 유형');select.style.width='100%';
 const key=p=>p.roadview50?.assetId||'legacy-'+p.id,byType=new Map();for(const p of placements){const k=key(p);if(!byType.has(k))byType.set(k,[]);byType.get(k).push(p);}
 const entries=[...byType].sort((a,b)=>a[1][0].name.localeCompare(b[1][0].name,'ko'));for(const [k,list]of entries)select.add(new Option(`${list[0].name} · ${list.length}곳 · ${k}`,k));section.append(select);
 const detail=document.createElement('p');detail.id='allAssetDetail';section.append(detail);let index=0;
 const ray=new T.Raycaster(),buildingBoxes=buildings.map(m=>new T.Box3().setFromObject(m)),boxes=blockers.map(b=>new T.Box3(new T.Vector3(...b[0]),new T.Vector3(...b[1])));
 function focus(){const list=byType.get(select.value)||[],p=list[index%list.length];if(!p)return;const height=Math.max(.3,p.height||.6),target=new T.Vector3(p.x,p.y+Math.min(height*.5,1.5),p.z),span=p.footprint?.length?Math.max(...p.footprint.map(q=>Math.hypot(q[0]-p.x,q[1]-p.z))):1,dist=Math.max(2.2,span*2.4,height*1.5);let best=null;
  for(const offset of [0,.6,-.6,1.2,-1.2,Math.PI])for(const factor of [1,.7])for(const rise of [0,1.5,4,8]){const angle=p.angle+offset,pos=new T.Vector3(p.x+Math.sin(angle)*dist*factor,p.y+Math.max(1.5,height*.8)+rise,p.z+Math.cos(angle)*dist*factor);pos.y=Math.max(pos.y,elevation(pos.x,pos.z)+1.6);const direction=pos.clone().sub(target),distance=direction.length();ray.set(target,direction.normalize());ray.far=distance;const blocked=ray.intersectObjects(buildings,true).some(h=>h.distance>.08&&h.distance<distance)||boxes.some(b=>{if(b.containsPoint(target))return false;const hit=ray.ray.intersectBox(b,new T.Vector3());return hit&&hit.distanceTo(target)<distance;});const score=(blocked?100:0)+(buildingBoxes.some(b=>b.containsPoint(pos))?200:0)+Math.abs(offset)+Math.abs(factor-1)+rise*.3;if(!best||score<best.score)best={pos,score};}
  controls.target.copy(target);camera.position.copy(best.pos);controls.update();requestRender();detail.textContent=`${index+1} / ${list.length} · ${p.name} · ${p.ruleAudit?.label||p.role||'기존 위치 규칙'} · 건물 ${p.owner}`;detail.dataset.placement=JSON.stringify(p);
 }
 select.onchange=()=>{index=0;focus();};for(const [name,step]of [['이전 위치',-1],['다음 위치',1]]){const b=document.createElement('button');b.textContent=name;b.style.marginRight='6px';b.onclick=()=>{const n=byType.get(select.value).length;index=(index+step+n)%n;focus();};section.append(b);}
 const link=document.createElement('a');link.href='https://neighborhood-lowpoly-50-oct27.bacbaqui2.chatgpt.site/#catalog';link.target='_blank';link.textContent='통합 도감 열기 ↗';link.style.cssText='display:block;margin-top:10px';section.append(link);
 document.getElementById('environmentControls').append(section);section.dataset.types=String(entries.length);section.dataset.instances=String(placements.length);
 const requested=new URLSearchParams(location.search).get('inspectAll');if(requested&&byType.has(requested)){select.value=requested;focus();}
}
