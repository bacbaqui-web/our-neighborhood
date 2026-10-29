import {pavingTexture} from './rule-scene.js';
import * as T from 'three';
import {FacadeBatch} from '../../korean-facades.js';
import {makeLivingAsset,addExistingFurniture} from './living-models.js';
import {inPolygon} from '../../facilities/placement.js';
const inside=(p,rs)=>rs.some(r=>inPolygon(p,r.outer)&&!r.holes.some(h=>inPolygon(p,h)));
export function pilotWorld(d,p){const c=Math.cos(d.angle),s=Math.sin(d.angle);return [d.origin[0]+c*p[0]+s*p[1],d.origin[1]-s*p[0]+c*p[1]];}
export function pilotContains(d,p){return inPolygon(p,d.footprint);}
export async function createPilotGarden(d){
 const root=new T.Group();root.name='놀이터와 쉼터를 묶은 정원';root.position.set(d.origin[0],0,d.origin[1]);root.rotation.y=d.angle;
 const batch=new FacadeBatch(),o=batch.writer(),B=o.box,R=o.rod,paving=pavingTexture();
 for(const [kind,regions] of Object.entries(d.surfaces)){const color={lawn:0x697453,soil:0x71634a,paths:0xc6aa94}[kind],y={lawn:.14,soil:.155,paths:.19}[kind];for(const r of regions){const s=new T.Shape(r.outer.map(p=>new T.Vector2(p[0],-p[1])));for(const h of r.holes)s.holes.push(new T.Path(h.map(p=>new T.Vector2(p[0],-p[1]))));const g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);if(kind==='paths'){const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/2.4,pos.getZ(i)/1.2);}const m=new T.Mesh(g,new T.MeshStandardMaterial({color:kind==='paths'&&paving?0xffffff:color,map:kind==='paths'?paving:null,bumpMap:kind==='paths'?paving:null,bumpScale:.012,roughness:1,side:T.DoubleSide}));m.name='garden-'+kind;m.position.y=y;m.receiveShadow=true;root.add(m);}}
 // The path is one textured surface per polygon; edging remains geometry.
 for(const r of d.surfaces.paths)for(const ring of [r.outer,...r.holes])for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.02)continue;const w=batch.writer([a[0],0,a[1]],dx/L,dz/L,-dz/L,dx/L);w.box(L/2,.23,0,L,.18,.13,0xd4c7af);}
 // A low fence and planted margins enclose the play garden, leaving the entrance clear.
 for(const [a,b] of [[[-18,6],[-2,7.8]],[[2,7.8],[16,6]],[[16,6],[16,-18]],[[-18,-18],[-18,6]]]){const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),w=batch.writer([a[0],0,a[1]],dx/L,dz/L,-dz/L,dx/L);w.box(L/2,.95,0,L,.06,.06,0x52674d);w.box(L/2,.45,0,L,.05,.05,0x52674d);for(let x=0;x<L;x+=.24)w.box(x,.65,0,.035,.7,.035,0x657b55);for(let x=0;x<L;x+=2)w.box(x,.65,0,.09,1.15,.09,0x445c45);}
 for(const p of d.lamps){B(p[0],1.6,p[1],.075,2.8,.075,0x56644f);B(p[0],3.04,p[1],.32,.12,.32,0xe3d9b6);B(p[0],3.14,p[1],.4,.06,.4,0x53684e);}
 const play=makeLivingAsset('play');play.position.set(-3,.16,-1);root.add(play);
 // Pitched tower roofs give the existing play equipment a clear silhouette.
 for(const x of [-5,-1]){const roof=new T.Mesh(new T.ConeGeometry(1.95,.85,4),new T.MeshStandardMaterial({color:x===-5?0xc99347:0x527c83}));roof.rotation.y=Math.PI/4;roof.position.set(x,3.48,-1);roof.castShadow=true;root.add(roof);}
 // Two-seat swing and tower rails complete the shared play area.
 for(const x of [-8,-4]){R([x,.2,-5.5],[x,2.8,-4],.07,0x6f7972,8);R([x,.2,-2.5],[x,2.8,-4],.07,0x6f7972,8);}R([-8,2.8,-4],[-4,2.8,-4],.08,0x9c875e,8);
 for(const x of [-7,-5]){for(const dx of [-.3,.3])R([x+dx,2.75,-4],[x+dx,.7,-4],.015,0x62655d,6);B(x,.66,-4,.8,.08,.4,0xb99850);}
 for(const x of [-5,-1])for(const side of [-1,1]){R([x+side*.85,1.7,-1.8],[x+side*.85,2.45,-1.8],.035,0x617d7b);R([x+side*.85,2.45,-1.8],[x+side*.85,2.45,-.2],.035,0x617d7b);}
 const pergola=makeLivingAsset('pergola');pergola.position.set(9.5,.16,-11.5);root.add(pergola);
 await addExistingFurniture(root,{placed:[{kind:'pergola',point:[9.5,-11.5],angle:0},{kind:'play',point:[-3,-1],angle:0}]});
 for(const b of d.benches){const bench=makeLivingAsset('bench');bench.position.set(b.point[0],.24,b.point[1]);bench.rotation.y=b.angle;root.add(bench);}
 // Vegetation is now generated in garden-vegetation.js using the tree pipeline.
 root.add(batch.finish('정원 경계 꽃줄기 조명'));return root;
}
// Kept as a compatibility hook; current vegetation is rendered by the shared tree system.
export function addPilotLeafDetail(){}
