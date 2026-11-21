import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

// Two open shelves; metre units and a base-centred origin.
export function createShoeRack() {
 const root=new T.Group();root.name='2단 신발 정리대 · 교체안';
 const materials=[
  new T.MeshStandardMaterial({color:0x394b49,roughness:.86}),
  new T.MeshStandardMaterial({color:0xaeb8b0,roughness:.72,metalness:.12}),
  new T.MeshStandardMaterial({color:0x292f30,roughness:1})
 ];
 const buckets=materials.map(()=>[]);
 function add(g,material,position,rotation=null){const m=new T.Matrix4().compose(new T.Vector3(...position),rotation||new T.Quaternion(),new T.Vector3(1,1,1));g.applyMatrix4(m);buckets[material].push(g);}
 function timber(w,h,d,x,y,z){
  const r=.0015,s=new T.Shape();s.moveTo(-w/2+r,-h/2+r);s.lineTo(w/2-r,-h/2+r);s.lineTo(w/2-r,h/2-r);s.lineTo(-w/2+r,h/2-r);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:1,steps:1,curveSegments:1});g.translate(0,0,-d/2+r);add(g,0,[x,y,z]);
 }
 const contacts=[];
 for(const x of[-.375,.375]){
  for(const z of[-.14,.14]){
   timber(.04,.367,.04,x,.1865,z);
   add(new T.BoxGeometry(.038,.003,.038),2,[x,.0015,z]);contacts.push([x,0,z]);
  }
  for(const y of[.095,.295]){
   timber(.035,.044,.28,x,y,0);
   for(const z of[-.161,.161])add(new T.CylinderGeometry(.004,.004,.002,6),1,[x,y,z],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));
  }
 }
 for(const y of[.095,.295])for(let j=0;j<5;j++){
  add(new T.CylinderGeometry(.007,.007,.752,8),1,[0,y,-.11+j*.055],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2));
 }
 buckets.forEach((gs,i)=>{const geometry=mergeGeometries(gs.map(g=>g.index?g.toNonIndexed():g),false);gs.forEach(g=>g.dispose());const m=new T.Mesh(geometry,materials[i]);m.castShadow=m.receiveShadow=true;root.add(m);});
 root.userData={assetId:'prototype:shoe-rack-v1',replacementFor:'road:a165',status:'prototype',units:'m',front:'+Z',contactPoints:contacts};return root;
}
