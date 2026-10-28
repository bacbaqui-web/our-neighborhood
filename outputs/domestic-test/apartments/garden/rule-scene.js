import * as T from 'three';
import {FacadeBatch} from '../../korean-facades.js';
import {makeLivingAsset,addExistingFurniture} from './living-models.js';
import {createAsset} from '../../../alley-library/models.js';
import {inPolygon} from '../../facilities/placement.js';
const contains=(p,regions)=>regions.some(r=>inPolygon(p,r.outer)&&!r.holes.some(h=>inPolygon(p,h)));
export function createRuleGround(data){
 const root=new T.Group(),batch=new FacadeBatch();root.name='건물 기준 정원 보도 차도 주차장';
 const styles={site:[0xc3c6b6,.005],garden:[0x91a67b,.035],walk:[0xd3c5b2,.09],road:[0x68716e,.025],parking:[0x737a75,.03],crosswalk:[0xe4e0cc,.055]};
 for(const [kind,regions]of Object.entries(data.surfaces)){const [color,y]=styles[kind],mat=new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide});for(const r of regions){const shape=new T.Shape(r.outer.map(p=>new T.Vector2(p[0],-p[1])));for(const h of r.holes)shape.holes.push(new T.Path(h.map(p=>new T.Vector2(p[0],-p[1]))));const geom=new T.ShapeGeometry(shape);geom.rotateX(-Math.PI/2);const mesh=new T.Mesh(geom,mat);mesh.position.y=y;mesh.receiveShadow=true;mesh.name=kind;root.add(mesh);}}
 // Continuous curb stones follow the actual polygon edge, including bends.
 for(const r of data.surfaces.walk)for(const ring of [r.outer,...r.holes])for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.08)continue;const o=batch.writer([a[0],0,a[1]],dx/L,dz/L,-dz/L,dx/L);for(let x=0;x<L;x+=1.2)o.box(x+Math.min(1.17,L-x)/2,.11,0,Math.min(1.17,L-x),.18,.15,0xbbb9a9);}
 // Fine paving joints lie on pedestrian surfaces only; no loose checkerboard islands.
 const walkIndex=new Map();for(const r of data.surfaces.walk){const xs=r.outer.map(p=>p[0]),zs=r.outer.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/10);x<=Math.floor(Math.max(...xs)/10);x++)for(let z=Math.floor(Math.min(...zs)/10);z<=Math.floor(Math.max(...zs)/10);z++){const key=x+','+z;if(!walkIndex.has(key))walkIndex.set(key,[]);walkIndex.get(key).push(r);}}
 const onWalk=p=>contains(p,walkIndex.get(Math.floor(p[0]/10)+','+Math.floor(p[1]/10))||[]);
 const verts=[],bounds=data.bounds;
 for(let x=Math.floor(bounds.minX);x<bounds.maxX;x+=.8)for(let z=Math.floor(bounds.minZ);z<bounds.maxZ;z+=.4){const p=[x+.4,z+.2];if(!onWalk(p))continue;for(const [a,b]of [[[x,z],[x+.8,z]],[[x,z],[x,z+.4]]]){if(!onWalk(a)||!onWalk(b))continue;verts.push(a[0],.095,a[1],b[0],.095,b[1]);}}
 const joints=new T.BufferGeometry();joints.setAttribute('position',new T.Float32BufferAttribute(verts,3));root.add(new T.LineSegments(joints,new T.LineBasicMaterial({color:0xb2a795,transparent:true,opacity:.35})));
 for(const bay of data.parking){const s=Math.sin(bay.angle),c=Math.cos(bay.angle),o=batch.writer([bay.point[0],0,bay.point[1]],c,-s,s,c);for(const x of [-bay.width/2+.05,bay.width/2-.05])o.box(x,.065,0,.07,.02,5,0xe8e7d8);o.box(0,.065,-2.45,bay.width,.02,.07,0xe8e7d8);for(const x of [-.65,.65]){o.box(x,.14,-1.85,.45,.16,.16,0x414a42);o.box(x,.23,-1.85,.2,.02,.17,0xd4bd6f);}}
 for(const p of data.lamps){const o=batch.writer([p[0],0,p[1]]);o.box(0,1.7,0,.08,3.4,.08,0x596b60);o.box(0,3.45,0,.36,.13,.36,0xe7e1c2);}
 for(const entry of data.entries){const dx=entry.end[0]-entry.point[0],dz=entry.end[1]-entry.point[1],L=Math.hypot(dx,dz),o=batch.writer([entry.point[0],0,entry.point[1]],dz/L,-dx/L,dx/L,dz/L);for(const x of [-.95,.95]){o.box(x,.4,2.3,.12,.8,.12,0x65766b);o.box(x,.73,2.3,.14,.07,.14,0xece4c6);}}
 const shrubGeo=new T.IcosahedronGeometry(1,1),matrix=new T.Matrix4();for(let tone=0;tone<4;tone++){const shrubs=data.shrubs.filter(s=>s.tone===tone),mesh=new T.InstancedMesh(shrubGeo,new T.MeshStandardMaterial({color:[0x668151,0x778d5e,0x839768,0x718756][tone]}),shrubs.length);shrubs.forEach((s,i)=>{matrix.makeScale(s.radius,s.height,s.radius*.85);matrix.setPosition(s.point[0],s.height*.65,s.point[1]);mesh.setMatrixAt(i,matrix);});mesh.castShadow=true;root.add(mesh);}
 root.add(batch.finish('보도 경계석 주차선 조명'));return root;
}
export async function createRuleFacilities(data){const root=new T.Group();for(const f of data.facilities){const m=makeLivingAsset(f.kind);m.position.set(f.point[0],.12,f.point[1]);m.rotation.y=f.angle;root.add(m);}await addExistingFurniture(root,{placed:data.facilities});for(const b of data.benches){const m=createAsset(126);m.position.set(b.point[0],.12,b.point[1]);m.rotation.y=b.angle;root.add(m);}return root;}
