import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
export function createBarrier(){
 const root=new T.Group();root.name='접이식 바리케이드 · 교체안';
 const mats=[new T.MeshStandardMaterial({color:0xa9523e,roughness:.88}),new T.MeshStandardMaterial({color:0xd6d8cb,roughness:.9}),new T.MeshStandardMaterial({color:0xe9c75e,roughness:.9}),new T.MeshStandardMaterial({color:0x303a3b,roughness:.96})];
 const buckets=mats.map(()=>[]);
 function part(g,i,p,q=null){const m=new T.Mesh(g);m.position.fromArray(p);if(q)m.quaternion.copy(q);m.updateMatrix();g.applyMatrix4(m.matrix);buckets[i].push(g);}
 function box(w,h,d,i,x,y,z){part(new T.BoxGeometry(w,h,d),i,[x,y,z]);}
 function bar(a,b,w,d,i){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);part(new T.BoxGeometry(w,v.length(),d),i,av.add(bv).multiplyScalar(.5).toArray(),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));}
 function pin(x,y,z){part(new T.CylinderGeometry(.013,.013,.08,6),3,[x,y,z],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));}
 const contacts=[];
 for(const x of [-1.5,0,1.5]){
  box(.038,.88,.038,0,x,.58,0);box(.05,.028,.48,0,x,.128,0);
  box(.041,.055,.041,2,x,.89,0);box(.041,.055,.041,2,x,.31,0);
  box(.042,.016,.042,3,x,1.028,0);
  for(const z of[-.215,.215]){
   box(.02,.045,.02,1,x,.089,z);
   for(const dx of[-.017,.017])box(.009,.038,.039,1,x+dx,.061,z);
   part(new T.CylinderGeometry(.034,.034,.027,8),3,[x,.034,z],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2));
   contacts.push([x,0,z]);
  }
 }
 const low=.23,high=.98;
 for(let i=0;i<6;i++){
  const x=-1.5+i*.5;
  for(const [ya,yb,z]of[[low,high,.029],[high,low,-.029]]){
   const a=[x,ya,z],b=[x+.5,yb,z],mid=[x+.25,(ya+yb)/2,z];
   bar(a,mid,.026,.014,0);bar(mid,b,.026,.014,1);
  }
  pin(x+.25,(low+high)/2,0);
  for(const y of[low,high])pin(x,y,0);
 }
 for(const y of[low,high])pin(1.5,y,0);
 // A carrying handle, attached at both ends to the end post.
 for(const y of[.58,.72])bar([-1.5,y,0],[-1.57,y,0],.014,.018,0);
 bar([-1.57,.58,0],[-1.57,.72,0],.014,.018,0);
 buckets.forEach((gs,i)=>{const merged=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());const mesh=new T.Mesh(merged,mats[i]);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);});
 root.userData={assetId:'prop-barrier-v1',replacementFor:'road:a72',status:'prototype',units:'m',front:'+Z',contactPoints:contacts};return root;
}
