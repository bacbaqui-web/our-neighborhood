import * as T from 'three';
import {FacadeBatch} from '../../korean-facades.js';
import {createHybridTrees} from '../../hybrid-tree.js';
import {inPolygon} from '../../facilities/placement.js';
export const inPlantingTrial=p=>Math.hypot(p[0]+14.5,p[1]+5)<5;
const world=(d,p)=>[d.origin[0]+Math.cos(d.angle)*p[0]+Math.sin(d.angle)*p[2],p[1],d.origin[1]-Math.sin(d.angle)*p[0]+Math.cos(d.angle)*p[2]];
export function planShrubs(d){return d.shrubs.filter(s=>inPlantingTrial(s.point)).map((s,i)=>{
 const root=world(d,[s.point[0],.17,s.point[1]]),nodes=[],paths=[],clumps=[];
 const node=(p,radius)=>{nodes.push({p:world(d,p),radius});return nodes.length-1;};
 for(let k=0;k<5;k++){
  const a=k*2.399+i*.7,h=s.height*(.78+(k%3)*.09),spread=s.radius*.56;
  const start=[s.point[0],.17,s.point[1]],fork=[start[0]+Math.cos(a)*spread*.42,.17+h*.52,start[2]+Math.sin(a)*spread*.42],tip=[start[0]+Math.cos(a)*spread,.17+h,start[2]+Math.sin(a)*spread];
  const parent=paths.length;paths.push({index:parent,parent:-1,level:0,nodes:[node(start,.018),node(fork,.011),node(tip,.003)]});
  for(let j=0;j<3;j++){
   const t=.48+j*.2,anchor=start.map((v,n)=>v+(tip[n]-v)*t),angle=a+(j%2?-.8:.8),end=[anchor[0]+Math.cos(angle)*s.radius*.28,anchor[1]+h*.17,anchor[2]+Math.sin(angle)*s.radius*.28];
   paths.push({index:paths.length,parent,level:1,nodes:[node(anchor,.007),node(end,.0015)]});
   for(const [q,center] of [anchor,end].entries())clumps.push({center:world(d,center),radius:s.radius*(q?.36:.28),variant:(i+k+j)%4,tone:.85+(j%2)*.12,roll:a+j*.6,seasonRank:.1,aspect:1,mirror:k%2?-1:1});
  }
 }
 return {id:'garden-shrub-'+i,root,height:s.height,radius:s.radius,nodes,paths,clumps,stats:{tips:15,orders:2}};
});}
function patchOld(d,texture){
 const g=new T.Group(),batch=new FacadeBatch(),o=batch.writer();g.position.set(d.origin[0],0,d.origin[1]);g.rotation.y=d.angle;
 const mat=new T.Matrix4(),geo=new T.IcosahedronGeometry(1,1);
 for(let tone=0;tone<5;tone++){
  const rows=d.shrubs.filter(s=>inPlantingTrial(s.point)&&s.tone===tone),m=new T.InstancedMesh(geo,new T.MeshStandardMaterial({color:[0x587a41,0x70904e,0x8ba359,0x537347,0x809750][tone]}),rows.length*4);
  rows.forEach((s,i)=>{i=d.shrubs.filter(v=>v.tone===tone).indexOf(s);for(let k=0;k<4;k++){mat.makeScale(s.radius*(k?.63:.85),s.height*(k?.35:.45),s.radius*.7);mat.setPosition(s.point[0]+Math.sin(i*2+k)*s.radius*.45,.2+s.height*.5+(k%2)*.1,s.point[1]+Math.cos(i+k)*s.radius*.4);m.setMatrixAt(i*4+k,mat);}});m.castShadow=true;g.add(m);
  const fs=d.flowers.filter(s=>inPlantingTrial(s.point)&&s.tone===tone),f=new T.InstancedMesh(geo,new T.MeshStandardMaterial({color:[0xe7bf67,0xcd8d9c,0xeee2c3,0xa59bbb,0xd3a0b0][tone]}),fs.length*9);
  fs.forEach((s,i)=>{i=d.flowers.filter(v=>v.tone===tone).indexOf(s);for(let k=0;k<9;k++){const x=s.point[0]+Math.sin(i+k*2.1)*.25,z=s.point[1]+Math.cos(i+k*2.1)*.25,y=.2+s.height+(k%3)*.07;o.rod([x,.18,z],[x,y,z],.012,0x63804b,4);mat.makeScale(.12,.075,.12);mat.setPosition(x,y,z);f.setMatrixAt(i*9+k,mat);}});g.add(f);
 }
 const ps=[];d.shrubs.filter(s=>inPlantingTrial(s.point)).forEach((s,i)=>{i=d.shrubs.indexOf(s);for(let k=0;k<9;k++)ps.push([s.point[0]+Math.sin(k*2.4+i)*s.radius*.55,.25+s.height*(.9+(k%3)*.08),s.point[1]+Math.cos(k*2.4+i)*s.radius*.55,s.radius*1.3,k*1.37+i]);});
 const plane=new T.PlaneGeometry(1,1),uv=plane.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.25,uv.getY(i)/3+2/3);const cards=new T.InstancedMesh(plane,new T.MeshBasicMaterial({map:texture,color:0xb9c6a5,alphaTest:.48,side:T.DoubleSide}),ps.length);
 ps.forEach(([x,y,z,size,a],i)=>{mat.compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(-Math.PI*(i%3===0?.48:.32),a,0)),new T.Vector3(size,size,1));cards.setMatrixAt(i,mat);});g.add(cards,batch.finish('기존 꽃줄기'));return g;
}
export function createPlantingTrial(d,texture){
 const before=patchOld(d,texture),plans=planShrubs(d),sys=createHybridTrees(plans,texture),after=new T.Group();after.add(sys.group);sys.setFoliage({season:'summer'});
 const batch=new FacadeBatch(),petals=[],leaves=[],centers=[];
 const path=p=>d.surfaces.paths.some(r=>inPolygon(p,r.outer)&&!r.holes.some(h=>inPolygon(p,h)));
 let floweringPlants=0;
 for(const [i,f] of d.flowers.filter(f=>inPlantingTrial(f.point)).entries())for(let k=0;k<5;k++){
  const a=k*2.4+i,x=f.point[0]+Math.cos(a)*.14,z=f.point[1]+Math.sin(a)*.14;if(path([x,z]))continue;floweringPlants++;
  const h=.26+f.height*.32+(k%3)*.035,root=world(d,[x,.17,z]),tip=world(d,[x+.04*Math.sin(a),.17+h,z+.04*Math.cos(a)]);batch.writer().rod(root,tip,.006,0x657d46,4);
  for(let j=0;j<4;j++){const t=.25+j*.15,p=root.map((v,n)=>v+(tip[n]-v)*t);leaves.push({p,a:a+j*2.4,size:.10+(j%2)*.035});}
  centers.push({p:tip,a,size:.027});for(let j=0;j<5;j++){const b=j*Math.PI*2/5;petals.push({p:[tip[0]+Math.cos(b)*.038,tip[1]+.005,tip[2]+Math.sin(b)*.038],a:b,size:.045,tone:f.tone});}
 }
 const matrix=new T.Matrix4();function discs(rows,color,leaf=false){const m=new T.InstancedMesh(new T.CircleGeometry(1,leaf?5:8),new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:1}),rows.length);rows.forEach((p,i)=>{const q=new T.Quaternion().setFromEuler(new T.Euler(leaf?-.65:-Math.PI/2,p.a,0));matrix.compose(new T.Vector3(...p.p),q,new T.Vector3(p.size,leaf?p.size*.35:p.size*.72,1));m.setMatrixAt(i,matrix);});after.add(m);}
 discs(leaves,0x789357,true);discs(centers,0xccad57);for(let t=0;t<5;t++)discs(petals.filter(p=>p.tone===t),[0xead794,0xc98f9e,0xeee7d3,0xb0a6c4,0xe1b4bf][t]);after.add(batch.finish('가지에 이어진 꽃과 잎'));
 before.visible=false;const root=new T.Group();root.name='벤치 옆 식재 비교';root.add(before,after);const qa={shrubs:plans.length,branches:plans.reduce((n,p)=>n+p.paths.length,0),leafClusters:plans.reduce((n,p)=>n+p.clumps.length,0),floweringPlants,sphereCores:0};root.userData.qa=qa;
 return {group:root,before,after,plans,qa,update(camera){if(after.visible)sys.update(camera);},setBefore(value){before.visible=value;after.visible=!value;}};
}
