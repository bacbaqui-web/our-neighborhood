import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
export function createSiteDetails(d,elevation=()=>0){
 const group=new T.Group(),batches=new Map();
 const add=(g,c)=>{if(!batches.has(c))batches.set(c,[]);batches.get(c).push(g);};
 const box=(x,y,z,w,h,depth,c,a=0)=>{const g=new T.BoxGeometry(w,h,depth,Math.max(1,Math.ceil(w/.5)),1,Math.max(1,Math.ceil(depth/.5)));g.rotateY(a);g.translate(x,y+h/2,z);const pos=g.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)+elevation(pos.getX(i),pos.getZ(i)));g.computeVertexNormals();add(g,c);};
 const beam=(a,b,w,c)=>{const A=new T.Vector3(a[0],a[1]+elevation(a[0],a[2]),a[2]),B=new T.Vector3(b[0],b[1]+elevation(b[0],b[2]),b[2]),delta=B.clone().sub(A),g=new T.BoxGeometry(w,delta.length(),w);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());add(g,c);};
 for(const f of d.fences){const [x,z]=f.a,[X,Z]=f.b,L=Math.hypot(X-x,Z-z),a=-Math.atan2(Z-z,X-x);for(let t=0;t<=L;t+=Math.min(2,L)){box(x+(X-x)*t/L,.1,z+(Z-z)*t/L,.055,f.height,.055,0x64786f);}
  for(let y=.15;y<=f.height;y+=.28)box((x+X)/2,y,(z+Z)/2,L,.016,.016,0x728579,a);
  for(let t=.15;t<L;t+=.3)box(x+(X-x)*t/L,.12,z+(Z-z)*t/L,.014,f.height-.1,.014,0x728579);
 }
 for(const gate of d.gates||[]){const [x,z]=gate.a,[X,Z]=gate.b,L=Math.hypot(X-x,Z-z),a=-Math.atan2(Z-z,X-x);box((x+X)/2,.1,(z+Z)/2,L,gate.height,.12,0x66828a,a);for(let t=.15;t<L;t+=.25)box(x+(X-x)*t/L,.1,z+(Z-z)*t/L,.028,gate.height,.15,0x6e8991,a);for(const t of [0,.5,1])box(x+(X-x)*t,.1,z+(Z-z)*t,.09,gate.height,.18,0x536e77,a);for(const y of [.25,2.85])box((x+X)/2,y,(z+Z)/2,L,.09,.19,0x536e77,a);box((x+X)/2,1.25,(z+Z)/2,.28,.06,.23,0x424d49,a);}
 for(const p of d.booths||[]){const [x,z]=p.point;box(x,.1,z,1.9,2.35,2.2,0xc2c8c3);box(x,2.45,z,2.1,.12,2.4,0x586e74);for(const side of [-1,1]){box(x+side*.956,1.1,z,.025,.95,1.6,0x54777c);box(x,1.1,z+side*1.106,1.4,.95,.025,0x54777c);}box(x+.4,.12,z+1.12,.65,1.95,.05,0x758883);box(x+.62,.95,z+1.16,.035,.22,.035,0xd1d5c9);}
 for(const p of d.props){const [x,z]=p.point,B=(u,y,v,w,h,d,c)=>box(x+u,y+.1,z+v,w,h,d,c);
  if(p.type==='excavator'){
   for(const v of [-1,1]){B(0,.05,v,.65,.48,2.9,0x343b38);for(let t=-1.25;t<1.4;t+=.22)B(0,.53,v,.69,.04,.1,0x69716b);}
   B(0,.5,0,1.75,.4,2.1,0xc99a37);B(-.3,.9,-.55,.9,1.2,.95,0xd6b14c);B(-.3,1.05,-.56,.76,.87,1.0,0x506b70);B(-.3,2.12,-.55,1.02,.1,1.08,0xd2aa42);B(-.4,.9,.65,1.0,.55,.8,0xc49a32);
   beam([x+.4,1,z],[x+1.2,2.7,z],.28,0xd4a434);beam([x+1.2,2.7,z],[x+2.05,.6,z],.23,0xd4a434);beam([x+.5,1.15,z+.2],[x+1.08,2.1,z+.2],.075,0x777f79);B(2,.12,0,.7,.42,.8,0x4d534c);
  }else if(p.type==='foundation'||p.type==='ruin'){
   const r=p.type==='ruin'?1.35:2.05;
   for(const v of [-r,r]){B(0,0,v,r*2+.2,.35,.22,0xaaa99e);B(v,0,0,.22,.35,r*2+.2,0xaaa99e);}
   B(0,0,0,r*2,.035,r*2,0x8e8170);
   for(const u of [-r,r])for(const v of [-r,r])for(const s of [-.06,.06])B(u+s,.3,v,.028,p.type==='ruin'?.65:1.4,.028,0x765b49);
  }else if(p.type==='materials'){
   for(let j=0;j<5;j++){B(0,j*.14,0,2.2,.09,1.2,j%2?0x9e8b6a:0xb6a17c);for(const t of [-.7,.7])B(t,j*.14+.08,0,.1,.055,1.3,0x6f7368);}
   for(let j=0;j<4;j++)B(-.8+j*.45,0,.85,.35,.55,.35,0xa4aaa4);
  }else if(p.type==='soil'){
   const g=new T.ConeGeometry(1.25,.85,7);g.translate(x,.5+elevation(x,z),z);add(g,0x9c8668);
   for(let j=0;j<5;j++)B(Math.sin(j*2)*.95,0,Math.cos(j*2)*.85,.3,.18,.25,0x7f7b6e);
  }
 }
 for(const [color,gs] of batches){group.add(new T.Mesh(mergeGeometries(gs),new T.MeshStandardMaterial({color,roughness:1})));gs.forEach(g=>g.dispose());}return group;
}
