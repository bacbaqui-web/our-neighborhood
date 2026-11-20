import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
export function builder(name,colors){
 const root=new T.Group();root.name=name;
 const mats=colors.map(color=>new T.MeshStandardMaterial({color,roughness:.85})),bins=colors.map(()=>[]);
 const add=(g,i,p=[0,0,0],q=new T.Quaternion())=>{g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),q,new T.Vector3(1,1,1)));bins[i].push(g);};
 const box=(w,h,d,i,x,y,z)=>add(new T.BoxGeometry(w,h,d),i,[x,y,z]);
 function rod(a,b,r,i,n=6){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);add(new T.CylinderGeometry(r,r,v.length(),n),i,av.add(bv).multiplyScalar(.5).toArray(),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));}
 function bar(a,b,w,d,i){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);add(new T.BoxGeometry(w,v.length(),d),i,av.add(bv).multiplyScalar(.5).toArray(),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));}
 function panel(w,h,d,r,i,x,y,z){
  const s=new T.Shape(),l=-w/2,b=-h/2;
  s.moveTo(l+r,b);s.lineTo(l+w-r,b);s.quadraticCurveTo(l+w,b,l+w,b+r);s.lineTo(l+w,b+h-r);s.quadraticCurveTo(l+w,b+h,l+w-r,b+h);s.lineTo(l+r,b+h);s.quadraticCurveTo(l,b+h,l,b+h-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);
  const g=new T.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:false,curveSegments:3});g.translate(0,0,-d/2);add(g,i,[x,y,z]);
 }
 function finish(data){bins.forEach((gs,i)=>{if(!gs.length)return;const flat=gs.map(g=>g.index?g.toNonIndexed():g);const mesh=new T.Mesh(mergeGeometries(flat,false),mats[i]);new Set([...gs,...flat]).forEach(g=>g.dispose());mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);});root.userData={units:'m',front:'+Z',status:'prototype',...data};return root;}
 return {root,add,box,rod,bar,panel,finish};
}
