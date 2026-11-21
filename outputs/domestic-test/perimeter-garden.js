import {treePlanting,normalizeTreeHeight} from './tree-planting.js';
import * as T from 'three';
import {applyWallTexture} from './facade-textures.js?v=masonry19';
import {createDetails} from './site-layout-models/piloti-details.js?v=recess22';
import {gardenPlant} from './apartments/garden/garden-vegetation.js';
import {planPlantCanopies} from './plant-canopy-layout.js';
import {createHybridTrees,loadCanopyTexture} from './hybrid-tree.js';

// Local catalog prototypes. Dimensions are art-direction defaults, not measured
// cadastral boundaries or legal landscaping requirements.
export const perimeterGardenCatalog=[
 {id:'straight',name:'건물 옆 좁은 화단',note:'폭 1.2m의 긴 화단입니다. 낮은 턱 안에 관목과 낮은 풀을 섞습니다.'},
 {id:'corner-sparse',name:'흙이 드러난 모서리 화단',note:'사진처럼 낮은 석재 턱이 모서리를 따라 이어집니다. 흙과 드문 관목이 보입니다.'},
 {id:'corner-green',name:'식물이 채워진 모서리 화단',note:'같은 모서리 화단에 관목·낮은 풀·작은 나무를 더한 모습입니다.'},
 {id:'entrance',name:'현관 양옆 화단',note:'현관 앞 1.8m 통로를 비우고 양옆에만 화단을 만듭니다.'},
 {id:'building-sparse',name:'큰 건물과 낮은 외곽 화단',note:'건물 앞과 옆을 화단으로 구분합니다. 현관 통로와 오른쪽 차량 진입 공간은 비웁니다.'},
 {id:'building-green',name:'큰 건물과 풍성한 외곽 화단',note:'같은 건물에 식물을 더한 모습입니다. 작은 나무는 넓은 모서리에만 둡니다.'},
];
let textures=null,loading=null;
export async function preparePerimeterGardens(){
 if(textures)return textures;
 if(!loading)loading=Promise.all(['fringe','zelkova','maple'].map(async id=>[id,await loadCanopyTexture(id)])).then(rows=>textures=new Map(rows)).catch(error=>{loading=null;throw error;});
 return loading;
}
const rect=(x0,z0,x1,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
// All garden corners are right-angle miters: one closed wall mesh, no rounded
// contour, duplicated corner posts, or separate overlapping wall strips.
function inset(ring,d){return ring.map((p,i)=>{const a=ring[(i+ring.length-1)%ring.length],b=ring[(i+1)%ring.length],u=new T.Vector2(p[0]-a[0],p[1]-a[1]).normalize(),v=new T.Vector2(b[0]-p[0],b[1]-p[1]).normalize();return [p[0]+(-u.y-v.y)*d,p[1]+(u.x+v.x)*d];});}
const shapeOf=ring=>new T.Shape(ring.map(p=>new T.Vector2(p[0],-p[1])));
function polygon(ring,y,h,color,hole=null){const shape=shapeOf(ring);if(hole)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p[0],-p[1]))));const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,y,0);const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:1}));m.castShadow=m.receiveShadow=true;return m;}
function box(parent,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.95}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
export function planPerimeterGarden(id='corner-green',options={}){
 const building=id.startsWith('building'),corner=id.includes('corner')||building,entry=id==='entrance'||building;
 const width=Number.isFinite(options.width)?Math.max(4,Math.min(16,options.width)):building?10:6;
 const depth=Number.isFinite(options.depth)?Math.max(.75,Math.min(1.8,options.depth)):1.2;
 const height=Number.isFinite(options.height)?Math.max(.25,Math.min(.7,options.height)):.48;
 const sideLength=building?6:3.2,left=-width/2,right=width/2,gap=1.8,entryX=building?Math.min(width*.18,right-gap/2-.7):0;
 const beds=[];
 if(corner){const end=entry?entryX-gap/2:right;beds.push([[left-depth,-sideLength],[left,-sideLength],[left,0],[end,0],[end,depth],[left-depth,depth]]);}
 else beds.push(rect(left,0,entry?entryX-gap/2:right,depth));
 if(entry)beds.push(rect(entryX+gap/2,0,right,depth));
 const surfaces=beds.map(outer=>({outer,inner:inset(outer,.14)}));
 const green=!id.includes('sparse'),plants=[],soilY=height-.09,clear=(p,r)=>surfaces.some(b=>[p,...Array.from({length:8},(_,k)=>[p[0]+r*Math.cos(k*Math.PI/4),p[1]+r*Math.sin(k*Math.PI/4)])].every(q=>inside(q,b.inner)));
 const zones=[];
 const frontEnd=entry?entryX-gap/2:right;
 zones.push(rect(corner?left-depth:left,0,frontEnd,depth));
 if(corner)zones.push(rect(left-depth,-sideLength,left,0));
 if(entry)zones.push(rect(entryX+gap/2,0,right,depth));
 let k=0;
 for(const zone of zones){const xs=zone.map(p=>p[0]),zs=zone.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
  const step=green?.52:1.7,margin=.40,nx=Math.max(1,Math.floor((x1-x0-2*margin)/step)+1),nz=Math.max(1,Math.floor((z1-z0-2*margin)/step)+1);
  for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
   const x=nx===1?(x0+x1)/2:x0+margin+(x1-x0-2*margin)*ix/(nx-1),z=nz===1?(z0+z1)/2:z0+margin+(z1-z0-2*margin)*iz/(nz-1);
   const p=[x+Math.sin(k*2.7)*.035,z+Math.cos(k*1.9)*.035];k++;
   if(!clear(p,.24))continue;
   plants.push({id:'edge-shrub-'+k,root:[p[0],soilY,p[1]],height:green?.28+(k%3)*.12:.18+(k%2)*.12,radius:green?.29+(k%3)*.025:.18,kind:'shrub'});
  }
 }
 const trees=[];
 if(corner&&green&&depth>=1.1){const p=[left-depth/2,depth/2];if(clear(p,.32))trees.push({id:'corner-tree',root:[p[0],soilY,p[1]],height:2.5,radius:.85,count:22,variant:2});}
 // A tree's crown may extend over the outer wall, while its trunk remains in soil.
 const paths=entry?[rect(entryX-gap/2,-.05,entryX+gap/2,depth+.6)]:[];
 const driveway=building?rect(right+.15,-sideLength,right+3.45,depth+.6):null;
 return {id,width,depth,height,soilY,beds:surfaces,plants,trees,paths,driveway,building,entryX,sideLength,wallTexture:options.wallTexture||'beige-large-stone',green};
}
function addBuilding(root,p){
 const left=-p.width/2,right=p.width/2,D=p.sideLength,H=9.6;
 const body=polygon(rect(left,-D,right,0),0,H,0xffffff);applyWallTexture(body,p.wallTexture);body.userData.windowShell=true;body.userData.windowOwner=231;root.add(body);
 const points=rect(left,-D,right,0),frontEdge=2,entry=right-p.entryX;
 root.add(createDetails([{inkObjectId:1,points,base:0,top:H,floor:3.2,levels:3,styleIndex:3,wallTexture:p.wallTexture,seed:231,frontEdge,frontage:{entry},hasEntry:true,sideServices:true,holes:false,holePoints:[]}],()=>0,{structures:[]},{shells:root}));
 // Single closed roof parapet with the same facade finish.
 const parapet=polygon(points,H,.55,0xffffff,inset(points,.16));applyWallTexture(parapet,p.wallTexture);root.add(parapet);
 root.add(polygon(points,H+.55,.045,0xbcc0b5,inset(points,.18)));
}
export function createPerimeterGarden(id='corner-green',options={}){
 const plan=planPerimeterGarden(id,options),root=new T.Group();root.name=perimeterGardenCatalog.find(r=>r.id===id)?.name||'건물 외곽 화단';
 root.userData={partType:'perimeter-garden',plan,leafMethod:'existing compact tree crowns and species atlas',mapPlacementApplied:false};
 for(const [i,bed] of plan.beds.entries()){
  const wall=polygon(bed.outer,0,plan.height,0xffffff,bed.inner);wall.name='직선 화단 턱-'+i;applyWallTexture(wall,plan.wallTexture);root.add(wall);
  const cap=polygon(bed.outer,plan.height,.035,0xc3c5ba,bed.inner);cap.name='연속 화단 덮개-'+i;root.add(cap);
  const soil=polygon(bed.inner,plan.soilY-.035,.035,0xa59679);soil.name='화단 흙-'+i;root.add(soil);
 }
 // Small flush inspection cover and drainage slot belong to the soil, not the road.
 const b=plan.beds.at(-1).inner,c=b[0];box(root,c[0]+.28,plan.soilY+.012,c[1]+.23,.27,.025,.30,0x9caaa2);
 const plantPlans=planPlantCanopies(plan.plants),treePlans=plan.trees.map(t=>{const p=gardenPlant({...t,...treePlanting({id:t.id,use:'yard',radius:t.radius})});return normalizeTreeHeight(p,p.height,true);});
 const maps=options.textures||textures,systems=[];
 if(maps){for(const list of [plantPlans,treePlans])if(list.length){const sys=createHybridTrees(list,maps);sys.setFoliage({season:'summer'});root.add(sys.group);systems.push(sys);}}
 root.userData.foliageReady=!!maps;root.userData.plants=plan.plants.length;root.userData.trees=plan.trees.length;root.userData.leafClusters=[...plantPlans,...treePlans].reduce((sum,p)=>sum+p.clumps.length,0);
 for(const path of plan.paths){const m=polygon(path,0,.025,0xbec1b6);m.name='비워 둔 현관 통로';root.add(m);}
 if(plan.building){
  addBuilding(root,plan);
  const minX=-plan.width/2-plan.depth;
  box(root,(minX+plan.width/2)/2,-.055,plan.depth+.24,plan.width+plan.depth,.08,.45,0xb9bdb5);
  box(root,(minX+plan.width/2)/2,-.105,plan.depth+1.6,plan.width+plan.depth+1.5,.10,2.3,0x77828a);
  const drive=polygon(plan.driveway,-.02,.025,0xbec1b6);drive.name='비워 둔 차량 진입 공간';root.add(drive);
 }
 root.updatePreview=camera=>systems.forEach(s=>s.update(camera));
 root.prepareExport=camera=>{root.updatePreview(camera);for(const s of systems){const g=s.exportGroup();root.remove(s.group);root.add(g);s.dispose();}root.updatePreview=null;return root;};
 const cam=new T.PerspectiveCamera();cam.position.set(8,6,12);cam.lookAt(0,.6,0);cam.updateMatrixWorld();root.updatePreview(cam);root.updateMatrixWorld(true);
 return root;
}
