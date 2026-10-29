import * as T from 'three';
import {planCanopy} from '../../canopy-growth.js';
import {createHybridTrees,loadCanopyTexture} from '../../hybrid-tree.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
// Use the actual street-tree growth pipeline and species atlas. Compact plants
// keep selected twig groups and their parent axes, rather than a solid core.
const prototypes=new Map();
function prototype(species,variant,count){
 const key=[species,variant,count].join(':');if(prototypes.has(key))return prototypes.get(key);
 const src=planCanopy({species,id:key,seed:'garden-growth:'+key,height:4,radius:2});
 const clumps=[];for(let k=0;k<Math.min(count,src.clumps.length);k++)clumps.push(src.clumps[Math.floor(k*src.clumps.length/Math.min(count,src.clumps.length))]);
 const axes=new Set([0]);for(const c of clumps){let path=src.nodes[c.node].path;while(path>=0&&!axes.has(path)){axes.add(path);path=src.paths[path].parent;}}
 const paths=src.paths.filter(p=>axes.has(p.index)).map(p=>({...p,nodes:[...new Set([p.nodes[0],p.nodes[Math.floor(p.nodes.length/2)],p.nodes.at(-1),...clumps.filter(c=>src.nodes[c.node].path===p.index).map(c=>c.node)])].sort((a,b)=>a-b)}));
 const ids=[...new Set(paths.flatMap(p=>p.nodes))].sort((a,b)=>a-b),map=new Map(ids.map((id,i)=>[id,i]));
 const nodes=ids.map(id=>{const n=src.nodes[id];let parent=n.parent;while(parent>=0&&!map.has(parent))parent=src.nodes[parent].parent;return {...n,parent:parent<0?-1:map.get(parent)};});
 const out={...src,nodes,paths:paths.map(p=>({...p,nodes:p.nodes.map(n=>map.get(n))})),clumps:clumps.map(c=>({...c,node:map.get(c.node)}))};
 out.bounds={r:Math.max(...src.clumps.map(c=>Math.hypot(c.center[0],c.center[2])+c.radius*c.cardScale)),h:src.stats.actualTop};prototypes.set(key,out);return out;
}
export function gardenPlant({id,root,height,radius,species='zelkova',variant=0,count=16}){
 const src=prototype(species,variant,count),sx=radius/src.bounds.r,sy=height/src.bounds.h,a=variant*1.7,c=Math.cos(a),s=Math.sin(a),point=p=>[root[0]+(p[0]*c-p[2]*s)*sx,root[1]+p[1]*sy,root[2]+(p[0]*s+p[2]*c)*sx];
 const scale=Math.min(sx,sy),nodes=src.nodes.map(n=>({...n,p:point(n.p),radius:n.radius*scale}));
 const clumps=src.clumps.map(v=>({...v,center:point(v.center),radius:v.radius*scale,lightingCenter:point(v.lightingCenter),lightingRadius:v.lightingRadius*scale}));
 return {...src,id,root,height,radius,nodes,clumps,stats:{...src.stats,actualTop:height,sourceEngine:src.stats.engine,compactGardenPlant:true}};
}
export function planGardenVegetation(d,pilot){
 const green=[],bloom=[],point=(p,y=.17)=>[pilot.origin[0]+Math.cos(pilot.angle)*p[0]+Math.sin(pilot.angle)*p[1],y,pilot.origin[1]-Math.sin(pilot.angle)*p[0]+Math.cos(pilot.angle)*p[1]];
 d.shrubs.forEach((p,i)=>green.push(gardenPlant({id:'ground-'+i,root:[p.point[0],.14,p.point[1]],height:p.height+.15,radius:p.radius,variant:i%6,count:8})));
 pilot.shrubs.forEach((p,i)=>green.push(gardenPlant({id:'garden-'+i,root:point(p.point),height:p.height*(i%3===0?.65:1),radius:p.radius,variant:i%6,count:24})));
 // Low flowering clumps and evergreen groundcover use the same rooted tree
 // skeleton/atlas renderer at a low, broad scale; no polygon leaves or balls.
 pilot.flowers.forEach((p,i)=>{
  bloom.push(gardenPlant({id:'flower-'+i,root:point(p.point),height:.24+p.height*.28,radius:.29+(i%3)*.035,species:'cherry',variant:i%6,count:18}));
  green.push(gardenPlant({id:'underleaf-'+i,root:point(p.point),height:.16,radius:.32,variant:i%6,count:12}));
 });
 pilot.ornamental.forEach((p,i)=>bloom.push(gardenPlant({id:'ornamental-'+i,root:point(p),height:4.3+i*.15,radius:1.8,species:'cherry',variant:i,count:120})));
 for(let i=0;i<28;i++){const a=i*2.4,p=[9.5+Math.cos(a)*(1+(i%7)*.22),-11.5+Math.sin(a)*(1+(i%5)*.25)];green.push(gardenPlant({id:'pergola-leaf-'+i,root:point(p,3.1),height:.35,radius:.55,variant:i%6,count:12}));}
 return {green,bloom,qa:{groundShrubs:d.shrubs.length,gardenShrubs:pilot.shrubs.length,flowerClumps:pilot.flowers.length,ornamentalTrees:pilot.ornamental.length,leafClusters:[...green,...bloom].reduce((n,p)=>n+p.clumps.length,0),sphereCores:0,source:'planCanopy → createTreeWood + createHybridTrees / species-v65'}};
}
function mergeWood(sys){for(const b of sys.batches){const meshes=b.wood.children.filter(x=>x.isMesh);if(!meshes.length)continue;const geo=mergeGeometries(meshes.map(m=>m.geometry)),m=new T.Mesh(geo,meshes[0].material);m.castShadow=m.receiveShadow=true;b.wood.clear();b.wood.add(m);meshes.forEach(x=>x.geometry.dispose());}}
export async function createGardenVegetation(d,pilot){
 const plans=planGardenVegetation(d,pilot),textures=new Map(await Promise.all(['zelkova','cherry'].map(async id=>[id,await loadCanopyTexture(id)]))),green=createHybridTrees(plans.green,textures),bloom=createHybridTrees(plans.bloom,textures);green.setFoliage({season:'summer'});bloom.setFoliage({season:'spring'});mergeWood(green);mergeWood(bloom);
 const group=new T.Group();group.name='나무 생성 규칙을 공유하는 정원 식재';group.add(green.group,bloom.group);group.userData.qa=plans.qa;
 return {group,plans,update(camera){green.update(camera);bloom.update(camera);}};
}
