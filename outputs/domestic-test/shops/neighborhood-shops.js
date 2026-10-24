import {applySignEmission} from './sign-lighting.js?v=73';
import * as T from 'three';
import {buildStorefront} from './storefront-models.js?v=80';
import {lightingState} from './storefront-hours.js?v=71';

const tints={convenience:'#eef5e8',laundry:'#e5efff',salon:'#ffe8cb',estate:'#f3ecd9',food:'#ffdfa9',cafe:'#ffd39d',pharmacy:'#f0f6e6',retail:'#eaf5df',bakery:'#ffe0bb',optical:'#edf1e1',telecom:'#eee7f8'};
export function createNeighborhoodShops(plan,renderer,{elevation}={}){
 const group=new T.Group();group.name='NeighborhoodStorefronts';
 const lamps=new T.Group();lamps.name='StorefrontSpillLights';lamps.userData.environmentOwned=true;
 const records=[],sources=[],baseColors=new WeakMap();let hour=12,night=0,style='color',signature='';
 for(const p of plan.placements){
  const spec={...p.spec,id:String(p.placeId),hours:p.hours},root=buildStorefront(spec,{shell:false,attachment:true});
  root.name='Shop-'+p.placeId;root.position.fromArray(p.position);root.rotation.y=p.angle;root.scale.fromArray(p.scale);
  root.userData={...root.userData,placeId:p.placeId,name:p.name,address:p.address,reference:p.reference,referenceAsset:p.assetId,match:p.match,hours:p.hours};
  root.traverse(o=>{if(o.isMesh){o.userData.storefrontPlaceId=p.placeId;if(o.userData.storefrontLightRole){o.userData.storefrontBaseColor=o.material.color.getHex();o.userData.storefrontLightKey=p.placeId+':'+o.userData.storefrontLightRole+':'+o.material.color.getHexString();} }});
  // Fill the short slope under a level shop threshold instead of floating its sill.
  const grade=p.position[1]-p.groundMin;
  if(grade>.05){
   const ps=[],heights=p.groundSamples||Array(9).fill(p.groundMin),quad=(a,b,c,d)=>ps.push(...a,...b,...c,...a,...c,...d);
   for(let i=0;i<heights.length-1;i++){
    const x0=-p.spec.width/2+p.spec.width*i/(heights.length-1),x1=-p.spec.width/2+p.spec.width*(i+1)/(heights.length-1),y0=(heights[i]-p.position[1])/p.scale[1],y1=(heights[i+1]-p.position[1])/p.scale[1];
    quad([x0,y0,.12],[x1,y1,.12],[x1,0,.12],[x0,0,.12]);
    quad([x0,0,.12],[x1,0,.12],[x1,0,-.02],[x0,0,-.02]);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.computeVertexNormals();
   root.add(new T.Mesh(g,new T.MeshStandardMaterial({color:p.spec.base||'#93978c',roughness:.95,side:T.DoubleSide})));
  }
  root.updateWorldMatrix(true,true);
  if(p.arterial&&elevation){
   const inv=root.matrixWorld.clone().invert(),floor=(x,z)=>{const w=new T.Vector3(x,0,z).applyMatrix4(root.matrixWorld);w.y=elevation(w.x,w.z)+.012;return w.applyMatrix4(inv).y;};
   const ps=[],quad=(a,b,c,d)=>ps.push(...a,...b,...c,...a,...c,...d);
   for(const o of spec.openings.filter(o=>o.door!==undefined)){
    const n=o.panes||2,pw=(o.w-(n+1)*(o.frameWidth||.045))/n,x=o.x-o.w/2+(o.frameWidth||.045)+pw/2+o.door*(pw+(o.frameWidth||.045));
    const y=o.y-o.h/2,lo=x-pw/2,hi=x+pw/2,z=.58;
    const A=[lo,y,.16],B=[hi,y,.16],C=[hi,floor(hi,z),z],D=[lo,floor(lo,z),z];
    quad(A,B,C,D);ps.push(lo,floor(lo,.16),.16,...A,...D,...B,hi,floor(hi,.16),.16,...C);
   }
   if(ps.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.computeVertexNormals();const m=new T.Mesh(g,new T.MeshStandardMaterial({color:spec.base||'#a1aaa5',roughness:.95,side:T.DoubleSide}));m.name='shop-threshold-apron';root.add(m);}
  }
  group.add(root);root.updateWorldMatrix(true,true);
  const door=spec.openings.find(o=>o.door!==undefined)||spec.openings[0],pos=new T.Vector3(door.x,Math.min(2.2,door.y+.55),.42).applyMatrix4(root.matrixWorld),target=pos.clone().add(new T.Vector3(p.n[0]*3,-1.65,p.n[1]*3));
  const source={id:'shop-'+p.placeId,kind:'shop',position:pos.toArray(),direction:target.clone().sub(pos).normalize().toArray(),range:8,intensity:18,angle:Math.PI*.42,penumbra:.8,color:tints[p.category],amount:0};sources.push(source);
  records.push({p,spec,root,source,target,state:null});
 }
 const pool=Array.from({length:2},()=>{const light=new T.SpotLight('#ffdda8',0,8,Math.PI*.42,.8,2);light.shadow.mapSize.set(512,512);light.shadow.bias=-.0001;light.shadow.normalBias=.035;light.shadow.camera.near=.1;light.shadow.camera.far=9;light.userData.environmentOwned=true;light.target.userData.environmentOwned=true;lamps.add(light,light.target);return {light,id:null};});
 let activeIds=[];
 function set(nextHour,nextNight,nextStyle,scene){
  hour=nextHour;night=nextNight;style=nextStyle;
  const map=new Map();
  for(const r of records){r.state=lightingState(r.spec,hour);r.source.amount=r.state.interior;r.root.userData.lightingPreview=r.state;map.set(r.p.placeId,r);}
  // Include the optimized spatial proxies and the color material kept for style switches.
  scene.traverse(o=>{
   const role=o.userData.storefrontLightRole,r=map.get(o.userData.storefrontPlaceId);if(!role||!r)return;
   for(const m of new Set([o.material,o._originalMaterial].filter(Boolean))){
    if(!m.emissive)continue;if(!baseColors.has(m))baseColors.set(m,m.color.clone());m.color.copy(baseColors.get(m));
    const on=role==='interior'?r.state.interior:r.state.sign,painted=m===o._originalMaterial||style==='color';
    const tint=new T.Color(role==='interior'?tints[r.p.category]:o.userData.storefrontBaseColor);
    if(role==='sign')applySignEmission(m,tint,{on:style==='line'&&m===o.material?0:on,night,monochrome:!painted});
    else{
     if(!painted)tint.setScalar((tint.r+tint.g+tint.b)/3);
     m.emissive.copy(tint);m.emissiveIntensity=style==='line'&&m===o.material?0:on*(.10+night*.72);
    }
   }
  });
  group.userData.lighting=stats();
 }
 function update(camera){
  const choices=night>.01&&style!=='line'?records.filter(r=>r.state?.interior>0).map(r=>{const p=new T.Vector3(...r.source.position),d=p.distanceTo(camera.position)*(activeIds.includes(r.source.id)?.86:1),dx=camera.position.x-p.x,dz=camera.position.z-p.z;return {r,d,front:dx*r.p.n[0]+dz*r.p.n[1]>-.1};}).filter(q=>q.front&&q.d<22).sort((a,b)=>a.d-b.d).slice(0,2):[];
  activeIds=choices.map(q=>q.r.source.id);const next=activeIds.join('|');
  for(let i=0;i<pool.length;i++){const slot=pool[i],r=choices[i]?.r;slot.light.intensity=r?18*r.state.interior*night:0;slot.light.castShadow=!!r;if(r){slot.light.position.fromArray(r.source.position);slot.light.target.position.copy(r.target);slot.light.target.updateMatrixWorld();slot.light.color.set(style==='color'?tints[r.p.category]:'#e0e0e0');}}
  if(signature!==next){signature=next;renderer.shadowMap.needsUpdate=true;return true;}return false;
 }
 function stats(){const phases={open:0,cleanup:0,closed:0};for(const r of records)if(r.state)phases[r.state.phase]++;return {...plan.qa,hour,...phases,activeSpill:activeIds.length,maxSpill:2};}
 function dispose(){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();if(o._originalMaterial&&o._originalMaterial!==o.material)o._originalMaterial.dispose();});for(const {light} of pool)light.shadow.dispose();}
 return {group,lamps,records,sources,set,update,stats,dispose,get activeIds(){return activeIds;}};
}
