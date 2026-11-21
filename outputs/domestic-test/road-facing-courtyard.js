import {treePlanting,normalizeTreeHeight} from './tree-planting.js';
import * as T from 'three';
import {applyWallTexture} from './facade-textures.js?v=masonry19';
import {createDetails} from './site-layout-models/piloti-details.js?v=recess22';
import {preparePerimeterGardens} from './perimeter-garden.js?v=garden21';
import {planPlantCanopies} from './plant-canopy-layout.js';
import {gardenPlant} from './apartments/garden/garden-vegetation.js';
import {createHybridTrees} from './hybrid-tree.js';

// Road-relative assembly. These are display dimensions, not surveyed parcels.
// The street stays on z >= 0; rotating the house never rotates the front wall.
export const courtyardCatalog=[
 {id:'angled',name:'비스듬한 집과 길 쪽 담',angle:24,minDepth:1.4,note:'집은 비스듬하게, 담과 대문은 길 방향으로 놓습니다. 그 사이에 마당과 현관 통로가 생깁니다.'},
 {id:'opposite',name:'반대 방향으로 기운 마당집',angle:-28,minDepth:1.4,note:'집이 기운 방향이 바뀌면 넓은 마당 쪽도 바뀝니다. 대문은 현관과 연결하고 넓게 남은 곳에 나무를 둡니다.'},
 {id:'compact',name:'폭이 좁은 앞마당',angle:15,minDepth:.9,note:'좁은 쪽은 통로로 남기고, 넓어지는 쪽에 작은 화단을 모읍니다. 집 둘레를 따라 담을 꺾지 않습니다.'},
];
let textures;
export async function prepareCourtyards(){textures=await preparePerimeterGardens();}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const mul=(a,k)=>[a[0]*k,a[1]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const unit=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1]);return[(b[0]-a[0])/l,(b[1]-a[1])/l];};
const rect=(x,z,X,Z)=>[[x,z],[X,z],[X,Z],[x,Z]];
export function courtyardContains(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function clip(ring,n,d){const out=[];for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],da=dot(a,n)-d,db=dot(b,n)-d;if(da>=-1e-9)out.push(a);if((da<0)!==(db<0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
function ribbon(points,width){
 const normals=points.slice(1).map((b,i)=>{const u=unit(points[i],b);return[-u[1],u[0]];});
 const side=sign=>points.map((p,i)=>{let n=i===0?normals[0]:normals[i-1],scale=width/2;if(i>0&&i<points.length-1){n=add(normals[i-1],normals[i]);const len=Math.hypot(...n);n=mul(n,1/len);scale/=dot(n,normals[i]);}return add(p,mul(n,sign*scale));});
 return [...side(1),...side(-1).reverse()];
}
export function planRoadFacingCourtyard(id='angled',options={}){
 const preset=courtyardCatalog.find(c=>c.id===id)||courtyardCatalog[0];
 const angle=clamp(Number(options.angle??preset.angle),-35,35),theta=angle*Math.PI/180;
 const width=clamp(Number(options.width??8),6,12),depth=5.2;
 const minDepth=clamp(Number(options.minDepth??preset.minDepth),.9,4);
 const offset=-minDepth-Math.abs(Math.sin(theta))*width/2;
 const u=[Math.cos(theta),Math.sin(theta)],n=[-u[1],u[0]];
 const at=(x,z)=>[u[0]*x+n[0]*z,u[1]*x+n[1]*z+offset];
 const footprint=rect(-width/2,-depth,width/2,0).map(p=>at(...p));
 const left=at(-width/2,0),right=at(width/2,0),roadLeft=[left[0]-.5,-.18],roadRight=[right[0]+.5,-.18];
 const yard=[left,right,roadRight,roadLeft];
 const side=angle<0?-1:1,door=at(side*width*.23,0),gateX=door[0],gateWidth=1.5;
 const gateA=[gateX-gateWidth/2,-.18],gateB=[gateX+gateWidth/2,-.18];
 const walk=[add(door,mul(u,-.70)),add(door,mul(u,.70)),[gateB[0],.45],[gateA[0],.45]];
 // Two continuous bent wall bodies meet the house, with one intended gate gap.
 const wallChains=[[left,roadLeft,gateA],[gateB,roadRight,right]];
 const walls=wallChains.map(chain=>clip(ribbon(chain,.20),n,dot(left,n)));
 const beds=[];
 // Concentrate soil on the roomy side. Everything else remains paved courtyard.
 const bx0=side===1?left[0]+.65:gateB[0]+.55,bx1=side===1?gateA[0]-.55:right[0]-.65;
 if(bx1-bx0>1.1){
  const outer=rect(bx0,-1.65,bx1,-.58),inner=rect(bx0+.1,-1.55,bx1-.1,-.68);
  if(outer.every(p=>courtyardContains(p,yard)))beds.push({outer,inner});
 }
 const plants=[],trees=[];
 for(const bed of beds){const [a,,c]=bed.inner;let k=0;for(let x=a[0]+.3;x<c[0]-.2;x+=.48)plants.push({id:'yard-shrub-'+k++,root:[x,.18,(a[1]+c[1])/2],height:.35+(k%3)*.12,radius:.32,kind:'shrub'});
  if(id!=='compact'&&c[0]-a[0]>1.7)trees.push({id:'yard-tree',root:[(a[0]+c[0])/2,.18,(a[1]+c[1])/2],height:3.8,radius:1.35,count:28,variant:3});
 }
 return {id,angle,theta,width,depth,minDepth,offset,u,n,footprint,yard,door,entry:width/2-side*width*.23,walk,gate:{a:gateA,b:gateB,width:gateWidth,height:1.65},walls,wallChains,beds,plants,trees,
  height:clamp(Number(options.wallHeight??1.65),1.2,1.89),wallTexture:options.wallTexture||'red-brick',gateOpen:options.gateOpen!==false,road:rect(roadLeft[0]-1,.45,roadRight[0]+1,3.6)};
}
function polygon(ring,y,h,color,hole){const s=new T.Shape(ring.map(p=>new T.Vector2(p[0],-p[1])));if(hole)s.holes.push(new T.Path(hole.map(p=>new T.Vector2(p[0],-p[1]))));const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);g.translate(0,y,0);const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:1}));m.castShadow=m.receiveShadow=true;return m;}
function box(root,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y,z);root.add(m);m.castShadow=m.receiveShadow=true;return m;}
export function createRoadFacingCourtyard(id='angled',options={}){
 const p=planRoadFacingCourtyard(id,options),root=new T.Group();root.name=courtyardCatalog.find(r=>r.id===id)?.name||'길 쪽 담과 마당';root.userData={partType:'road-facing-courtyard',plan:p,mapPlacementApplied:false};
 const addMesh=(mesh,name)=>{mesh.name=name;root.add(mesh);return mesh;};
 const masonry=(ring,y,h,name)=>{const m=polygon(ring,y,h,0xffffff);applyWallTexture(m,p.wallTexture);return addMesh(m,name);};
 addMesh(polygon(p.road,-.12,.10,0x77828a),'아스팔트 도로');
 const [rl,rr]=[p.wallChains[0][1],p.wallChains[1][1]];
 addMesh(polygon(rect(rl[0]-.1,-.05,rr[0]+.1,.45),-.03,.05,0xb8bcb4),'폭 50cm 시멘트 구역');
 addMesh(polygon(p.yard,-.02,.07,0xb9b8ab),'집과 길 사이 시멘트 마당');
 addMesh(polygon(p.walk,.05,.012,0xd0d0c4),'대문에서 현관까지 이어지는 통로');
 // A real rectangular house retains its own angle; no tapered building shell.
 const house=masonry(p.footprint,.05,6.2,'집 외벽');house.userData.windowShell=true;house.userData.windowOwner=14;
 const at=(x,z)=>[p.u[0]*x+p.n[0]*z,p.u[1]*x+p.n[1]*z+p.offset];
 const inset=rect(-p.width/2+.17,-p.depth+.17,p.width/2-.17,-.17).map(q=>at(...q));
 const parapet=polygon(p.footprint,6.25,.5,0xffffff,inset);applyWallTexture(parapet,p.wallTexture);addMesh(parapet,'연속 옥상 담');
 addMesh(polygon(inset,6.251,.015,0x829588),'옥상 바닥');addMesh(polygon(p.footprint,6.75,.06,0xc8c7b9,inset),'옥상 담 덮개');
 root.add(createDetails([{inkObjectId:1,points:p.footprint,base:.05,top:6.25,floor:3.1,levels:2,styleIndex:0,wallTexture:p.wallTexture,seed:14,frontEdge:2,frontage:{entry:p.entry},hasEntry:true,sideServices:true,holes:false,holePoints:[]}],()=>.05,{structures:[]},{shells:root}));
 for(const [i,ring] of p.walls.entries()){masonry(ring,.05,p.height,'길 방향 담과 옆 연결 담-'+i);addMesh(polygon(ring,.05+p.height,.055,0xcbcbbb),'이어진 담 덮개-'+i);}
 const {a,b,width,height}=p.gate;
 for(const [pt,sign] of [[a,-1],[b,1]]){
  const x=pt[0]+sign*.13,m=box(root,x,.05+(height+.15)/2,pt[1],.26,height+.15,.30,0xffffff);applyWallTexture(m,p.wallTexture);m.name='집과 같은 벽돌 문기둥';
  box(root,x,height+.245,pt[1],.32,.08,.36,0xcdccbf);
  const leaf=new T.Group();leaf.name='철제 대문 문짝';leaf.position.set(pt[0],.08,pt[1]);leaf.rotation.y=p.gateOpen?-sign*Math.PI/2:0;root.add(leaf);
  const direction=-sign,L=width/2-.012;
  box(leaf,direction*L/2,height/2,0,L,height,.055,0x233737);
  for(let x=.07;x<L;x+=.15)box(leaf,direction*x,height/2,.037,.025,height-.13,.025,0x344744);
  for(const y of [.08,height-.07])box(leaf,direction*L/2,y,.04,L,.045,.035,0x3b5049);
  box(leaf,direction*(L-.1),height*.52,.07,.055,.19,.045,0xadb0a0);
 }
 // Intercom and letterbox remain separate modeled pieces.
 box(root,b[0]+.13,1.18,.005,.13,.23,.065,0xb5b5a5);
 box(root,b[0]+.13,.96,.005,.14,.07,.065,0x404c48);
 for(const bed of p.beds){addMesh(polygon(bed.outer,.05,.15,0xbbb8a6,bed.inner),'마당 구석 화단 턱');addMesh(polygon(bed.inner,.15,.03,0x95866a),'마당 구석 흙');}
 const maps=options.textures||textures,plantPlans=planPlantCanopies(p.plants),treePlans=p.trees.map(t=>{const p=gardenPlant({...t,...treePlanting({id:t.id,use:'yard',radius:t.radius})});return normalizeTreeHeight(p,p.height,true);}),systems=[];
 if(maps)for(const list of [plantPlans,treePlans])if(list.length){const s=createHybridTrees(list,maps);s.setFoliage({season:'summer'});root.add(s.group);systems.push(s);}
 root.userData.leafClusters=[...plantPlans,...treePlans].reduce((sum,t)=>sum+t.clumps.length,0);
 root.updatePreview=cam=>systems.forEach(s=>s.update(cam));
 root.prepareExport=cam=>{root.updatePreview(cam);for(const s of systems){root.remove(s.group);root.add(s.exportGroup());s.dispose();}root.updatePreview=null;return root;};
 const cam=new T.PerspectiveCamera();cam.position.set(-10,9,14);cam.lookAt(0,2,-2);cam.updateMatrixWorld();root.updatePreview(cam);root.updateMatrixWorld(true);return root;
}
