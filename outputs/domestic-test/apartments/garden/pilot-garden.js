import * as T from 'three';
import {FacadeBatch} from '../../korean-facades.js';
import {makeLivingAsset,addExistingFurniture} from './living-models.js';
import {createAsset} from '../../../alley-library/models.js';
import {inPolygon} from '../../facilities/placement.js';
const inside=(p,rs)=>rs.some(r=>inPolygon(p,r.outer)&&!r.holes.some(h=>inPolygon(p,h)));
export function pilotWorld(d,p){const c=Math.cos(d.angle),s=Math.sin(d.angle);return [d.origin[0]+c*p[0]+s*p[1],d.origin[1]-s*p[0]+c*p[1]];}
export function pilotContains(d,p){return inPolygon(p,d.footprint);}
export async function createPilotGarden(d){
 const root=new T.Group();root.name='놀이터와 쉼터를 묶은 정원';root.position.set(d.origin[0],0,d.origin[1]);root.rotation.y=d.angle;
 const batch=new FacadeBatch(),o=batch.writer(),B=o.box,R=o.rod;
 for(const [kind,regions] of Object.entries(d.surfaces)){const color={lawn:0x8fa773,soil:0x71634a,paths:0xc6aa94}[kind],y={lawn:.14,soil:.155,paths:.19}[kind];for(const r of regions){const s=new T.Shape(r.outer.map(p=>new T.Vector2(p[0],-p[1])));for(const h of r.holes)s.holes.push(new T.Path(h.map(p=>new T.Vector2(p[0],-p[1]))));const g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}));m.position.y=y;m.receiveShadow=true;root.add(m);}}
 // Warm paving bricks and pale edging make paths read as connected garden spaces.
 const tileRows=[[],[],[]];for(let z=-21;z<8;z+=.42)for(let x=-18+(Math.round(z/.42)%2)*.38;x<16;x+=.78){const p=[x+.38,z+.2];if([[x,z],[x+.75,z],[x+.75,z+.38],[x,z+.38]].every(p=>inside(p,d.surfaces.paths)))tileRows[Math.abs(Math.round(x*3+z*7))%3].push(p);}
 const mat=new T.Matrix4();tileRows.forEach((rows,i)=>{const m=new T.InstancedMesh(new T.BoxGeometry(.75,.035,.385),new T.MeshStandardMaterial({color:[0xbc9a82,0xc6a78b,0xb98f79][i],roughness:1}),rows.length);rows.forEach((p,j)=>{mat.makeTranslation(p[0],.208,p[1]);m.setMatrixAt(j,mat);});m.receiveShadow=true;root.add(m);});
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
 // Unequal overlapping leaf clumps avoid rows of identical green balls.
 const leafGeo=new T.IcosahedronGeometry(1,1);for(let tone=0;tone<5;tone++){const rows=d.shrubs.filter(s=>s.tone===tone),mesh=new T.InstancedMesh(leafGeo,new T.MeshStandardMaterial({color:[0x587a41,0x70904e,0x8ba359,0x537347,0x809750][tone],roughness:1}),rows.length*4);rows.forEach((s,i)=>{for(let k=0;k<4;k++){mat.makeScale(s.radius*(k? .63:.85),s.height*(k?.35:.45),s.radius*.7);mat.setPosition(s.point[0]+Math.sin(i*2+k)*s.radius*.45,.2+s.height*.5+(k%2)*.1,s.point[1]+Math.cos(i+k)*s.radius*.4);mesh.setMatrixAt(i*4+k,mat);}});mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 // Flowers form small planted drifts at path edges, with stems and several blooms.
 for(let tone=0;tone<5;tone++){const rows=d.flowers.filter(f=>f.tone===tone),mesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:[0xe7bf67,0xcd8d9c,0xeee2c3,0xa59bbb,0xd3a0b0][tone],roughness:1}),rows.length*9);rows.forEach((f,i)=>{for(let k=0;k<9;k++){const x=f.point[0]+Math.sin(i+k*2.1)*.25,z=f.point[1]+Math.cos(i+k*2.1)*.25,y=.2+f.height+(k%3)*.07;R([x,.18,z],[x,y,z],.012,0x63804b,4);mat.makeScale(.12,.075,.12);mat.setPosition(x,y,z);mesh.setMatrixAt(i*9+k,mat);}});mesh.castShadow=true;root.add(mesh);}
 // Ornamental flowering trees add a second canopy height beside the larger trees.
 for(const [i,p]of d.ornamental.entries()){R([p[0],.15,p[1]],[p[0],2.8,p[1]],.12,0x7d6d52,8);const crown=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:i===1?0xd3b6b0:0xd5c4ba,roughness:1}),110);for(let k=0;k<110;k++){const a=k*2.4,r=.3+((k*17)%11)/11*1.3,x=p[0]+Math.cos(a)*r,z=p[1]+Math.sin(a)*r,y=3.4+Math.sin(k*1.3)*.6;mat.makeScale(.32,.27,.32);mat.setPosition(x,y,z);crown.setMatrixAt(k,mat);if(k%4===0)R([p[0],1.9,p[1]],[x,y-.2,z],.035,0x7d6d52,6);}crown.castShadow=true;root.add(crown);}
 // Vines climb the pergola posts and soften its timber roof without covering it.
 const vine=new T.InstancedMesh(leafGeo,new T.MeshStandardMaterial({color:0x688947}),72);for(let k=0;k<72;k++){const a=k*2.4,x=9.5+Math.cos(a)*(1+(k%7)*.22),z=-11.5+Math.sin(a)*(1+(k%5)*.25);mat.makeScale(.28,.16,.3);mat.setPosition(x,3.25,z);vine.setMatrixAt(k,mat);}vine.castShadow=true;root.add(vine);
 root.add(batch.finish('정원 경계 꽃줄기 조명'));return root;
}
// Reuse the project's leaf texture over the shrub cores and pergola vines.
export function addPilotLeafDetail(d,root,texture){
 const positions=[];d.shrubs.forEach((s,i)=>{for(let k=0;k<9;k++)positions.push({x:s.point[0]+Math.sin(k*2.4+i)*s.radius*.55,z:s.point[1]+Math.cos(k*2.4+i)*s.radius*.55,y:.25+s.height*(.9+(k%3)*.08),size:s.radius*1.3,angle:k*1.37+i});});
 for(let k=0;k<60;k++){const a=k*2.4;positions.push({x:9.5+Math.cos(a)*(1+(k%7)*.22),z:-11.5+Math.sin(a)*(1+(k%5)*.25),y:3.53,size:.65,angle:k*.7});}
 const leafCard=new T.PlaneGeometry(1,1);const uv=leafCard.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.25,uv.getY(i)/3+2/3);const mesh=new T.InstancedMesh(leafCard,new T.MeshBasicMaterial({map:texture,color:0xb9c6a5,alphaTest:.48,side:T.DoubleSide}),positions.length),matrix=new T.Matrix4(),q=new T.Quaternion();positions.forEach((p,i)=>{q.setFromEuler(new T.Euler(-Math.PI*(i%3===0?.48:.32),p.angle,0));matrix.compose(new T.Vector3(p.x,p.y,p.z),q,new T.Vector3(p.size,p.size,1));mesh.setMatrixAt(i,matrix);});mesh.castShadow=false;mesh.receiveShadow=false;root.add(mesh);
}
