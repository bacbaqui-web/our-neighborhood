import {applyRepresentative,representativeAudit} from './representative-assets.js?v=151';
import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Deterministic, inferred shop-side dressing; never claims surveyed object locations.
export async function installSimReadyPreview(ctx){
 const {scene,assetParent,camera,controls,shopPlan,elevation,requestRender,renderer,applyStyle,obstacles=[],benchmark}=ctx;
 const loader=new GLTFLoader(),templates={};
 await Promise.all(['chair','bin'].map(async id=>{templates[id]=(await loader.loadAsync(id==='bin'?'./memo-131/simready-bin.glb':'./simready/'+id+'-1000.glb')).scene;}));
 // Procedural props based on visible forms in June 2026 Kakao Roadview; no photo textures.
 function part(g,geo,color,x,y,z){const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.92}));m.position.set(x,y,z);g.add(m);return m;}
 const planter=new T.Group();
 part(planter,new T.CylinderGeometry(.15,.11,.24,12),0x243b40,0,.12,0);
 part(planter,new T.TorusGeometry(.147,.012,4,12),0x334c50,0,.24,0).rotation.x=Math.PI/2;
 part(planter,new T.CylinderGeometry(.135,.135,.012,12),0x514238,0,.237,0);

 templates.planter=planter;
 const ac=new T.Group();part(ac,new T.BoxGeometry(.76,.51,.29),0xb5b3a1,0,.31,0);
 for(const x of[-.27,.27])part(ac,new T.BoxGeometry(.08,.055,.36),0x777b78,x,.027,0);
 part(ac,new T.CylinderGeometry(.19,.19,.015,20),0x686f69,-.1,.32,.154).rotation.x=Math.PI/2;
 for(let i=0;i<8;i++)part(ac,new T.BoxGeometry(.37,.012,.014),0xa5aa9d,-.1,.16+i*.045,.17);
 for(let i=0;i<7;i++)part(ac,new T.BoxGeometry(.11,.009,.012),0x7b817a,.26,.17+i*.042,.154);
 part(ac,new T.BoxGeometry(.1,.025,.012),0x667f85,.25,.49,.155);templates.ac=ac;
 const triangleCounts=Object.fromEntries(Object.entries(templates).map(([id,g])=>{let n=0;g.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3});return[id,n]}));
 await Promise.all([['cone','a46'],['ladder','a49'],['crate','a43']].map(async([id,file])=>{templates[id]=(await loader.loadAsync('./roadview50/'+file+'.glb')).scene;let n=0;templates[id].traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3});triangleCounts[id]=n;}));
 const root=new T.Group();root.name='SimReadyStreetLife';root.userData={creator:'NVIDIA',license:'CC-BY-4.0',source:'https://huggingface.co/datasets/nvidia/simready-assets',changes:'Simplified static geometry, flat materials, inferred placement, bin scaled 1.35x'};
 const records=[],rejected=[],collisionMeshes=[],ray=new T.Raycaster();
 for(const group of obstacles){group.updateWorldMatrix(true,true);group.traverseVisible(o=>{if(o.isMesh&&!o.userData.surfaceOverlay&&!o.userData.isBillboardShadow&&!o.userData.isVegetationBillboard&&!o.userData.isPedestrianBillboard)collisionMeshes.push(o);});}
 const forward=new T.Vector3(),tangent=new T.Vector3(),up=new T.Vector3(0,1,0);
 function clearFootprint(pos,radius,height){
  // Rays cross the footprint from outside, detecting front-facing surfaces on either side.
  for(const y of [.18,Math.min(height*.7,.65)])for(let a=0;a<4;a++){
   const d=new T.Vector3(Math.cos(a*Math.PI/4),0,Math.sin(a*Math.PI/4));
   for(const sign of[-1,1]){ray.set(pos.clone().addScaledVector(up,y).addScaledVector(d,-radius*sign),d.clone().multiplyScalar(sign));ray.far=radius*2;if(ray.intersectObjects(collisionMeshes,false).length)return false;}
  }
  return true;
 }
 for(const p of shopPlan.placements){
  if(p.width<2.8)continue;
  tangent.set(Math.cos(p.angle),0,-Math.sin(p.angle));forward.set(p.n[0],0,p.n[1]);
  const shopRoot=new T.Group();shopRoot.name='SimReadyShop-'+p.placeId;const seed=Number(p.placeId)%17;
  // Directly inspected frontages: preserve empty paths instead of generic repeated chairs.
  const plans=[];
  if(p.placeId==='1793458469')plans.push({id:'planter',side:-1,d:.48,inset:.65});
  if(p.placeId==='20557922')plans.push({id:'cone',side:seed%2?-1:1,d:.42});
  if(p.placeId==='10553321')plans.push({id:'ladder',side:seed%2?1:-1,d:.75});
  if(p.placeId==='1880724608')plans.push({id:'crate',side:-1,d:.65});
  for(const plan of plans){
   const radius={fridge:.52,chair:.36,bin:.19,planter:.16,ac:.41,cone:.18,ladder:.3,crate:.25}[plan.id],height={fridge:1.74,chair:.81,bin:.38,planter:.38,ac:.57,cone:.6,ladder:1.8,crate:.3}[plan.id];
   let placed=false;
   for(const inset of[plan.inset||.65,(plan.inset||.65)+.45,(plan.inset||.65)+.9]){
    const x=plan.side*(p.width/2-inset);
    if(Math.abs(x)<.8)continue;
    // Keep a full approach corridor in front of each actual door pane.
    const blocksDoor=(p.spec?.openings||[]).some(o=>{if(o.door===undefined)return false;const n=o.panes||2,pw=o.w/n,doorX=o.x-o.w/2+(o.door+.5)*pw;return Math.abs(x-doorX)<pw/2+radius+.45;});
    if(blocksDoor)continue;
    const pos=new T.Vector3(...p.position).addScaledVector(tangent,x).addScaledVector(forward,plan.d);
    const heights=[elevation(pos.x,pos.z),...[-1,1].flatMap(a=>[-1,1].map(b=>elevation(pos.x+a*radius*.65,pos.z+b*radius*.65)))];
    if(Math.max(...heights)-Math.min(...heights)>.14)continue;
    pos.y=Math.max(...heights)+.008;
    if(records.some(r=>Math.hypot(r.position[0]-pos.x,r.position[2]-pos.z)<r.radius+radius+.12))continue;
    if(!clearFootprint(pos,radius,height))continue;
    const m=templates[plan.id].clone(true);m.name='SimReady-'+plan.id;m.position.copy(pos);m.rotation.y=p.angle+(plan.rot||0);m.scale.setScalar(plan.scale||1);shopRoot.add(m);
    records.push({id:plan.id,shop:p.name,placeId:p.placeId,category:p.category,evidence:['1793458469','20557922','10553321','1880724608'].includes(p.placeId)?'Kakao Roadview 2026-06: form observed, position fitted to approximate facade':'inferred',position:pos.toArray(),radius,rotation:m.rotation.y,scale:plan.scale||1});placed=true;break;
   }
   if(!placed)rejected.push({shop:p.name,id:plan.id,reason:'entrance / obstacle / slope / overlap clearance'});
  }
  if(!shopRoot.children.length)continue;
  // One vertex-colored draw per shop, instead of dozens of material draws per prop.
  for(const obj of shopRoot.children){const id=obj.name.replace('SimReady-','');applyRepresentative(obj,({cone:'a46',ladder:'a49',crate:'a43',planter:'a01',ac:'a11'})[id]||'simready-'+id);triangleCounts[id]=0;obj.traverse(o=>{if(o.isMesh)triangleCounts[id]+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});}
  shopRoot.updateWorldMatrix(true,true);const geometries=[];
  shopRoot.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const n=geo.attributes.position.count,colors=new Float32Array(n*3),ids=new Float32Array(n).fill(o.parent.id);
   const materials=Array.isArray(o.material)?o.material:[o.material];const groups=geo.groups.length?geo.groups:[{start:0,count:n,materialIndex:0}];
   for(const group of groups){const c=(materials[group.materialIndex||0]||materials[0]).color;for(let i=group.start;i<group.start+group.count;i++){colors[i*3]=c.r*(geo.attributes.color?.getX(i)??1);colors[i*3+1]=c.g*(geo.attributes.color?.getY(i)??1);colors[i*3+2]=c.b*(geo.attributes.color?.getZ(i)??1);}}
   for(const key of Object.keys(geo.attributes))if(!['position','normal'].includes(key))geo.deleteAttribute(key);
   geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setAttribute('inkObjectId',new T.BufferAttribute(ids,1));geo.clearGroups();geometries.push(geo);
  });
  const geometry=mergeGeometries(geometries,false);geometry.computeBoundingBox();geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.85}));mesh.name=shopRoot.name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);geometries.forEach(g=>g.dispose());
 }
 root.userData.roadview={date:'2026-06',observed:['1793458469','16063164'],notes:'Yoon: remove chairs; dark planter beside shutter. Minji: remove chair; outdoor AC form. Approximate geometry and fitted positions, not surveyed reconstruction.'};root.userData.placements=records;root.userData.rejected=rejected;assetParent.add(root);
 const summary={count:records.length,byType:Object.fromEntries(Object.keys(templates).map(id=>[id,records.filter(p=>p.id===id).length])),triangles:records.reduce((n,p)=>n+triangleCounts[p.id],0),draws:root.children.length,placements:records,rejected};
 document.getElementById('view').dataset.representatives=JSON.stringify(representativeAudit());
 document.getElementById('view').dataset.simready=JSON.stringify(summary);
 const section=document.createElement('section');section.style.cssText='padding:12px;border:1px solid #b3c7c8;border-radius:10px;margin:12px 0;font-size:13px';
 section.innerHTML=`<b>가게 앞 생활 소품</b><p>${summary.count}개 · ${summary.triangles.toLocaleString()} 삼각형 · ${summary.draws}개 묶음</p><label><input id="lifeVisible" type="checkbox" checked> 생활 소품 표시</label><p><select id="lifeLocation" aria-label="생활 소품 위치"></select></p><button id="lifeBenchmark">추가 전후 성능 비교</button><p id="lifeResult" role="status">로드뷰에서 확인한 종류를 후보로 삼고 통행·경사 검사를 통과한 소품만 배치했습니다. 위치·치수는 추정입니다.</p><small>NVIDIA · <a href="./simready/CREDITS.txt">소재 출처·변경 사항</a> · CC BY 4.0</small>`;
 document.getElementById('environmentControls').append(section);
 const select=document.getElementById('lifeLocation');select.add(new Option('배치한 가게 보기',''));
 const views=shopPlan.placements.filter(p=>records.some(r=>r.placeId===p.placeId));for(const p of views)select.add(new Option(p.name,p.placeId));
 function focus(p){const normal=new T.Vector3(p.n[0],0,p.n[1]),t=new T.Vector3(Math.cos(p.angle),0,-Math.sin(p.angle)),target=new T.Vector3(...p.position).addScaledVector(normal,.7);target.y=elevation(target.x,target.z)+1.1;controls.target.copy(target);camera.position.copy(target).addScaledVector(normal,4.5).addScaledVector(t,1.5).add(new T.Vector3(0,1.5,0));controls.update();requestRender();}
 select.onchange=()=>{const p=views.find(p=>p.placeId===select.value);if(p)focus(p)};
 const toggle=document.getElementById('lifeVisible');toggle.onchange=()=>{root.visible=toggle.checked;renderer.shadowMap.needsUpdate=true;requestRender();};
 const button=document.getElementById('lifeBenchmark'),out=document.getElementById('lifeResult');
 button.onclick=async()=>{button.disabled=true;toggle.disabled=true;select.disabled=true;try{const report=await benchmark({root,views,focus,summary,out});out.dataset.result=JSON.stringify(report);out.textContent=report.views.map(v=>`${v.name}: ${v.before.medianMs.toFixed(1)} → ${v.after.medianMs.toFixed(1)} ms`).join(' / ');}catch(e){out.textContent='측정 실패: '+e.message;console.error(e);}finally{button.disabled=false;toggle.disabled=false;select.disabled=false;}};
 applyStyle('color');renderer.shadowMap.needsUpdate=true;requestRender();
 if(new URLSearchParams(location.search).get('simready')==='1'){const p=views.find(p=>p.name==='약수슈퍼')||views[0];if(p){focus(p);select.value=p.placeId;}}
 return{root,summary};
}
