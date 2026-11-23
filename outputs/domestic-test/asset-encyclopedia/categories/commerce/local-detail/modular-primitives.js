import * as T from 'three';
export function primitives(name){
 const root=new T.Group();root.name=name;const mats=new Map();
 const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c);};
 function box(name,x,y,z,w,h,d,c){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?mat(c):c);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
 function rod(name,a,b,r,c){const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat(c));o.name=name;o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());root.add(o);return o;}
 return {root,mat,box,rod};
}
