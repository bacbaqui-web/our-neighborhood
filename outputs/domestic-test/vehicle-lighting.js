import * as T from 'three';

// Normalized registered vehicles face +Z. Fractions refer to their original
// body bounds; attachment depth is sampled from the actual GLB surface.
export const LAMP_LAYOUTS={
 'city-bus':{front:[.34,.19,.20,.16],rear:[.37,.45,.13,.20]},
 porter2:{front:[.34,.43,.20,.25],rear:[.37,.18,.18,.09]},
 'porter2-delivery':{front:[.34,.31,.20,.15],rear:[.34,.13,.19,.07]},
 'sonata-dn8':{front:[.35,.51,.30,.095],rear:[.32,.65,.22,.055]},
 ray:{front:[.34,.49,.16,.23],rear:[.34,.53,.10,.19]},
 'carnival-ka4':{front:[.34,.50,.31,.10],rear:[.33,.64,.25,.06]},
 'grandeur-ig':{front:[.35,.46,.31,.12],rear:[.33,.61,.26,.07]},
 'spark-m400':{front:[.34,.48,.23,.16],rear:[.34,.55,.12,.18]},
 'grand-starex-school':{front:[.35,.43,.19,.28],rear:[.34,.43,.10,.23]},
};
function glowTexture(){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5-size/2)/(size/2),v=(y+.5-size/2)/(size/2),r=Math.hypot(u,v);
  const halo=Math.exp(-r*r*15)*.45+Math.exp(-r*6)*.25;
  const flare=Math.exp(-Math.abs(v)*65-Math.abs(u)*7)*.22;
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.min(1,(halo+flare)*Math.max(0,1-r))*255);
 }
 const texture=new T.DataTexture(data,size,size);texture.magFilter=texture.minFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}
const visibleInScene=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
export function createVehicleLighting(scene,onShadowChange=()=>{}){
 const rigs=new Map(),geometries=new Map(),frontMaterial=new T.MeshBasicMaterial({color:0xfff1cc,toneMapped:false,side:T.FrontSide}),rearMaterial=new T.MeshBasicMaterial({color:0xff1810,toneMapped:false,side:T.FrontSide});
 const glowMap=glowTexture();
 const pool=Array.from({length:4},()=>{
  const light=new T.SpotLight(0xffefd4,0,30,Math.PI/6,.8,2);
  light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-.00008;light.shadow.normalBias=.025;light.shadow.camera.near=.1;light.shadow.camera.far=30;
  light.userData.environmentOwned=true;scene.add(light,light.target);return light;
 });
 let strength=0;
 function attach(root){
  const layout=LAMP_LAYOUTS[root.userData.vehicleFamily],size=root.userData.dimensions;if(!layout||!size)return;
  const [w,h,l]=size,group=new T.Group();group.name='차량 전조등·미등';group.userData.environmentOwned=true;
  root.updateWorldMatrix(true,true);
  const body=[];root.traverse(o=>{if(o.isMesh&&!o.userData.environmentOwned)body.push(o);});
  const ray=new T.Raycaster(),anchors=[],halos=[];
  for(const [kind,sign] of [['front',1],['rear',-1]]){
   const [x,y,width,height]=layout[kind];
   for(const side of [-1,1]){
    const origin=root.localToWorld(new T.Vector3(side*w*x,h*y,sign*(l/2+1)));
    const direction=new T.Vector3(0,0,-sign).transformDirection(root.matrixWorld);ray.set(origin,direction);
    const hit=ray.intersectObjects(body,false)[0];
    // No guessed floating lamps when a model has no surface at this anchor.
    if(!hit)continue;
    const local=root.worldToLocal(hit.point.clone());local.z+=sign*.018;
    const key=[root.userData.vehicleFamily,...size,kind,side].join(':');
    let geometry=geometries.get(key);
    if(!geometry){
     geometry=new T.CircleGeometry(.5,12);const vertices=geometry.attributes.position;
     for(let i=0;i<vertices.count;i++){
      const x=local.x+vertices.getX(i)*width,y=local.y+vertices.getY(i)*height;
      ray.set(root.localToWorld(new T.Vector3(x,y,sign*(l/2+1))),direction);
      const sample=ray.intersectObjects(body,false)[0];
      const z=sample?root.worldToLocal(sample.point.clone()).z+sign*.018:local.z;
      vertices.setXYZ(i,x,y,z);
     }
     if(sign<0){const ix=geometry.index;for(let i=0;i<ix.count;i+=3){const v=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,v);}}
     geometry.computeVertexNormals();geometries.set(key,geometry);
    }
    const lens=new T.Mesh(geometry,kind==='front'?frontMaterial:rearMaterial);lens.userData={environmentOwned:true,noInk:true,vehicleLamp:kind};group.add(lens);
    const material=new T.SpriteMaterial({map:glowMap,color:kind==='front'?0xfff3db:0xff1d0a,blending:T.AdditiveBlending,transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
    const halo=new T.Sprite(material);halo.position.copy(local);halo.position.z+=sign*.025;halo.scale.setScalar(kind==='front'?1.15:.55);halo.userData={environmentOwned:true,noInk:true,vehicleGlow:kind};group.add(halo);halos.push({halo,sign});
    if(kind==='front')anchors.push(local.clone().add(new T.Vector3(0,0,.055)));
   }
  }
  root.add(group);group.visible=strength>.01;
  const origin=anchors.length?anchors.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/anchors.length):null;
  rigs.set(root,{group,origin,anchors,halos});
 }
 function sync(){
  const found=new Set();scene.traverse(o=>{if(o.userData.memoVehicle&&o.userData.dimensions)found.add(o);});
  for(const [root,rig]of rigs)if(!found.has(root)){root.remove(rig.group);for(const {halo}of rig.halos)halo.material.dispose();rigs.delete(root);}
  for(const root of found)if(!rigs.has(root))attach(root);
 }
 function set(night,style='color'){
  strength=style==='line'?0:T.MathUtils.clamp(night,0,1);sync();
  for(const {group}of rigs.values())group.visible=strength>.01;
  frontMaterial.color.setRGB(1,.93,.76).multiplyScalar(.45+strength*.55);
  rearMaterial.color.setRGB(1,.025,.012).multiplyScalar(.35+strength*.65);
  if(strength<=.01)for(const light of pool)light.intensity=0;
 }
 function update(camera){
  const candidates=[];
  if(strength>.01)for(const [root,rig]of rigs){
   if(!rig.origin||!visibleInScene(root))continue;
   root.updateWorldMatrix(true,false);const origin=root.localToWorld(rig.origin.clone());
   const forward=new T.Vector3(0,0,1).transformDirection(root.matrixWorld);
   for(const {halo,sign}of rig.halos){
    const toward=camera.position.clone().sub(root.localToWorld(halo.position.clone())).normalize();
    const facing=T.MathUtils.smoothstep(toward.dot(forward)*sign,.02,.7);
    halo.visible=facing>.001;halo.material.opacity=strength*facing*(sign===1?1:.65);
   }
   const distance=origin.distanceToSquared(camera.position);if(distance<38*38)candidates.push({root,origin,distance,rig});
  }
  candidates.sort((a,b)=>a.distance-b.distance);
  let changed=false;
  pool.forEach((light,i)=>{
   const previous=light.userData.pose;
   const selected=candidates[Math.floor(i/2)],anchor=selected?.rig.anchors[i%2];light.intensity=anchor?100*strength:0;
   if(!anchor){if(previous!=='off')changed=true;light.userData.pose='off';return;}
   light.position.copy(selected.root.localToWorld(anchor.clone()));light.target.position.copy(selected.root.localToWorld(anchor.clone().add(new T.Vector3(i%2?.35:-.35,-.8,10))));light.target.updateMatrixWorld();const pose=[light.intensity,...light.position.toArray(),...light.target.position.toArray()].join(',');if(previous!==pose){changed=true;light.shadow.needsUpdate=true;}light.userData.pose=pose;
  });
  if(changed)onShadowChange();
  return pool.filter(l=>l.intensity>0).length;
 }
 return {set,update,stats:()=>({vehicles:rigs.size,lamps:[...rigs.values()].reduce((n,r)=>n+r.group.children.filter(o=>o.isMesh).length,0),litVehicles:[...rigs.values()].filter(r=>visibleInScene(r.group)).length,night:strength,activeLights:pool.filter(l=>l.intensity>0).length}),dispose(){for(const[root,{group,halos}]of rigs){root.remove(group);for(const {halo}of halos)halo.material.dispose();}rigs.clear();for(const light of pool){scene.remove(light,light.target);light.dispose();}for(const geometry of geometries.values())geometry.dispose();geometries.clear();glowMap.dispose();frontMaterial.dispose();rearMaterial.dispose();}};
}
