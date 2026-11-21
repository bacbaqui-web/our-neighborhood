import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
export function createPiloti(plans){
 const group=new T.Group(),batches=new Map();
 const box=(x,y,z,w,h,d,color,angle=0)=>{const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y+h/2,z);if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);};
 for(const p of plans){
  const [ux,uz]=p.u,[nx,nz]=p.n,angle=Math.atan2(nx,nz),at=(u,n)=>[p.origin[0]+ux*u+nx*n,p.origin[1]+uz*u+nz*n];
  const B=(u,y,n,w,h,d,c)=>{const [x,z]=at(u,n);box(x,y,z,w,h,d,c,angle);};
  const [x,z,w,d]=p.core;
  // Enclosed stair/lobby core reaches the ceiling, leaving the parking volume open.
  B(x+w/2,.1,z+d/2,w,2.7,d,p.kind===2?0x7c817b:0xbcb8a9);
  B(x+w/2,.18,z-.025,1.45,2.2,.06,0x364b4c);
  B(x+w/2,1.0,z-.065,1.23,1.2,.04,0x6c898b);
  for(const side of [-1,1])B(x+w/2+side*.73,.14,z-.08,.065,2.28,.08,0x8c9591);
  B(x+w/2,.14,z-.09,.045,2.28,.08,0x9ba5a0);
  B(x+w/2+.18,1.0,z-.15,.025,.4,.04,0xd4d5c4);
  B(x+w/2,2.42,z-.12,1.65,.12,.22,0x555d59);
  B(x+w/2,.1,z-.18,1.6,.07,.34,0xb3b3a7);
  for(const q of p.columns){box(q[0],.1,q[1],.5,2.7,.5,0xbcb8ad,p.columnAngle||0);box(q[0],.1,q[1],.52,.8,.52,0x454c4b,p.columnAngle||0);for(let y=.27;y<.85;y+=.3)box(q[0],y,q[1],.535,.1,.535,0xd2b34e,p.columnAngle||0);}
  for(const b of p.bays){const [X,Z]=b.point;box(X,2.72,Z,.12,.04,1.0,0xe6e6d6,angle);}
 }
 for(const [color,geos] of batches){group.add(new T.Mesh(mergeGeometries(geos),new T.MeshStandardMaterial({color,roughness:1})));geos.forEach(g=>g.dispose());}
 return group;
}
