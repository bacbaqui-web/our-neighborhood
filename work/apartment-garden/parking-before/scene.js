import * as T from 'three';
import {FacadeBatch} from '../../korean-facades.js';
export function gardenSurfaces(plan,layout){
 const ground=new T.Group(),props=new T.Group(),batch=new FacadeBatch(),layers=new Map();ground.name='지도에 맞춘 단지 바닥';
 const material=color=>new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide});
 for(const ring of plan.boundary){const s=new T.Shape(ring.map(p=>new T.Vector2(p[0],-p[1]))),g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,material(0xc4c8ba));m.receiveShadow=true;ground.add(m);}
 const bounds=layout.bounds,step=.65;
 for(let x=bounds.minX;x<bounds.maxX;x+=step)for(let z=bounds.minZ;z<bounds.maxZ;z+=step){const p=[x+step/2,z+step/2];if(!layout.inside(p)||layout.occupied(p))continue;const corners=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]];if(corners.some(p=>layout.occupied(p)||!layout.inside(p)))continue;const r=layout.roadDistance(p),path=layout.pathDistance(p),green=layout.green(p);let col=r<-.45?0x65716f:path<0?0xd2cbbb:r<1.4?0xc5c3b5:green?0x849b73:null;if(col===null)continue;if(!layers.has(col))layers.set(col,[]);const v=layers.get(col);for(const k of [0,1,2,0,2,3])v.push(corners[k][0],.045,corners[k][1]);}
 for(const [c,points]of layers){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.computeVertexNormals();const m=new T.Mesh(g,material(c));m.receiveShadow=true;ground.add(m);}
 // Continuous ribbons cover the sampled asphalt edge, avoiding a tiled silhouette.
 const ribbon=[];
 for(const r of [...layout.roads,...layout.connections]){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],L=Math.hypot(dx,dz),nx=-dz/L,nz=dx/L,n=Math.ceil(L),half=r.width/2;for(let i=0;i<n;i++){const a=[r.a[0]+dx*i/n,r.a[1]+dz*i/n],b=[r.a[0]+dx*(i+1)/n,r.a[1]+dz*(i+1)/n],ps=[[a[0]+nx*half,a[1]+nz*half],[b[0]+nx*half,b[1]+nz*half],[b[0]-nx*half,b[1]-nz*half],[a[0]-nx*half,a[1]-nz*half]];if(ps.some(p=>!layout.inside(p)||layout.occupied(p)))continue;const color=r.owner?0xd2cbbb:0x65716f;for(const k of [0,1,2,0,2,3])ribbon.push({p:[ps[k][0],.085,ps[k][1]],color});}
 for(const p of [r.a,r.b]){if(!layout.inside(p)||layout.wallDistance(p)<half+.2)continue;const pts=Array.from({length:18},(_,i)=>[p[0]+Math.cos(i*Math.PI/9)*half,p[1]+Math.sin(i*Math.PI/9)*half]);if(pts.some(q=>!layout.inside(q)))continue;for(let i=0;i<18;i++)for(const q of [p,pts[i],pts[(i+1)%18]])ribbon.push({p:[q[0],.086,q[1]],color:r.owner?0xd2cbbb:0x65716f});}}
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(ribbon.flatMap(v=>v.p),3));rg.setAttribute('color',new T.Float32BufferAttribute(ribbon.flatMap(v=>new T.Color(v.color).toArray()),3));rg.computeVertexNormals();const rm=new T.Mesh(rg,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));rm.receiveShadow=true;ground.add(rm);
 const B=batch.writer().box;
 for(const f of layout.fences){const dx=f.b[0]-f.a[0],dz=f.b[1]-f.a[1],L=Math.hypot(dx,dz),o=batch.writer([f.a[0],0,f.a[1]],dx/L,dz/L,-dz/L,dx/L);o.box(L/2,.21,0,L,.42,.3,0xa3a493);o.box(L/2,1.37,0,L,.07,.08,0x526a5a);o.box(L/2,.6,0,L,.05,.06,0x526a5a);for(let x=0;x<L;x+=.25)o.box(x,.95,0,.04,.86,.045,0x607460);o.box(0,.79,0,.09,1.5,.09,0x526a5a);}
 for(const b of layout.benches){const c=Math.cos(b.angle),s=Math.sin(b.angle),o=batch.writer([b.point[0],0,b.point[1]],c,s,-s,c);for(const z of [-.22,0,.22])o.box(0,.5,z,1.9,.08,.17,0xa58b69);for(const x of [-.7,.7])o.box(x,.26,0,.09,.5,.5,0x596458);o.box(0,.85,.29,1.9,.48,.08,0xa58b69);}
 for(const p of layout.lamps){B(p[0],1.8,p[1],.09,3.6,.09,0x5e6c63);B(p[0],3.65,p[1],.4,.18,.4,0xe2dfc4);}
 for(const [i,b]of layout.parking.entries()){const s=Math.sin(b.angle),c=Math.cos(b.angle),o=batch.writer([b.point[0],0,b.point[1]],c,-s,s,c);o.box(0,.055,0,2.7,.035,5,0x8d948c);for(const x of [-1.3,1.3])o.box(x,.08,0,.06,.03,4.8,0xe0ddca);o.box(0,.62,0,1.7,.9,3.8,[0x93a6a0,0xc4c5b8,0x687e86][i%3]);o.box(0,1.15,-.15,1.5,.45,1.9,0x70888a);for(const x of [-.86,.86])for(const z of [-1.25,1.2])o.box(x,.32,z,.17,.48,.55,0x3c4944);}

 // One play area at the east courtyard visible in the aerial reference; equipment is stylized.
 const center=layout.playground?.point;
 if(center){const o=batch.writer([center[0],.06,center[1]]);o.box(0,0,0,13,.08,11,0xb29a7e);for(const x of [-2,2]){for(const z of [-1,1])o.box(x,.95,z,.13,1.9,.13,0x9c7c59);o.box(x,1.7,0,2.3,.15,2.4,0x939f78);o.box(x,2.9,0,2.8,.18,2.9,0xaa775d);}o.box(0,1.7,0,2.8,.12,1.5,0x9c8e70);o.rod([-2,1.7,1.1],[-2,.25,4],.18,0xb7a978);}
 // Low planting softens the lawn edge without changing the mapped garden zones.
 const shrubGeometry=new T.IcosahedronGeometry(1,1),matrix=new T.Matrix4(),q=new T.Quaternion();
 for(let tone=0;tone<4;tone++){const rows=(layout.shrubs||[]).filter(s=>s.tone===tone),mesh=new T.InstancedMesh(shrubGeometry,new T.MeshStandardMaterial({color:[0x738860,0x81946e,0x617c59,0x959e75][tone],roughness:1}),rows.length);rows.forEach((s,i)=>{q.setFromAxisAngle(new T.Vector3(0,1,0),i*2.4);matrix.compose(new T.Vector3(s.point[0],s.height*.5+.09,s.point[1]),q,new T.Vector3(s.radius,s.height*.7,s.radius*.85));mesh.setMatrixAt(i,matrix);});mesh.castShadow=true;mesh.receiveShadow=true;props.add(mesh);}
 for(const t of layout.trees){const m=new T.Mesh(new T.CircleGeometry(.8,14),new T.MeshStandardMaterial({color:0x8b846a,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(t.root[0],.065,t.root[2]);ground.add(m);}
 props.add(batch.finish('울타리와 단지 시설'));
 return {ground,props};
}
