import {treePlanting,normalizeTreeHeight} from '../tree-planting.js';
import {filterInfillVisibility} from '../view-generation-visibility.js?v=view3c';
import {wallSections} from './wall-profile.mjs';
import {seatGroundAsset} from '../ground-contact.js';
import {FacadeBatch,facadeStyles} from '../korean-facades.js?v=masonry19';
import {wallTextureFor} from '../facade-textures.js?v=masonry19';
import {createUtilityNetwork} from './utility-network.js';
import {createSiteDetails} from './site-details.js?v=slope3';
import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {gardenPlant} from '../apartments/garden/garden-vegetation.js?v=view3c';
import {loadCanopyTexture,createHybridTrees} from '../hybrid-tree.js?v=view3c';
export async function createInfill(d,surface,options={}){
 const elevation=options.elevation||(()=>0);
 d=filterInfillVisibility(d,elevation);
 const ground=new T.Group(),objects=new T.Group(),batches=new Map(),masonryBatch=new FacadeBatch();
 const colors={yard:0xc8c7bd,green:0x839270,garden:0x8d9c77,wild:0x969775,construction:0xb3a58e,active:0xb3a58e,abandoned:0x8b9073,parking:0xc8c7bd,bay:0xc8c7bd,edge:0xb9bcb7};
 for(const e of d.entries||[])if(e.connector)surface(e.connector,0xc8c7bd,.115,ground);
 for(const z of d.zones)if(z.kind!=='bay')surface(z.geometry,colors[z.kind],z.kind==='yard'?.075:.10,ground);
 const pavingCanvas=document.createElement('canvas');pavingCanvas.width=pavingCanvas.height=128;const pc=pavingCanvas.getContext('2d');pc.fillStyle='#777c75';pc.fillRect(0,0,128,128);for(let row=0;row<8;row++)for(let col=-1;col<8;col++){pc.fillStyle=(row+col)%7?'#b6b4a4':'#a5a99f';pc.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);}const pavingMap=new T.CanvasTexture(pavingCanvas);pavingMap.wrapS=pavingMap.wrapT=T.RepeatWrapping;pavingMap.repeat.set(1/1.6,1/1.6);pavingMap.colorSpace=T.SRGBColorSpace;
 for(const path of d.accessPaths||[]){const first=ground.children.length;surface(path.geometry,0xffffff,.17,ground);for(const mesh of ground.children.slice(first)){const pos=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;for(let j=0;j<pos.count;j++)uv.setXY(j,pos.getX(j),pos.getZ(j));uv.needsUpdate=true;mesh.material=mesh.material.clone();mesh.material.map=pavingMap;mesh.material.needsUpdate=true;}}
 if(d.siteDetails){objects.add(createSiteDetails(d.siteDetails,elevation));for(const p of d.siteDetails.patches)surface(p.geometry,[0xb6b7ae,0xc0c0b5,0xacb0a7][p.tone],.112,ground);}
 for(const g of d.vehicleApproaches||[])surface(g,0xc8c7bd,.118,ground);
 function box(x,y,z,w,h,depth,color,angle=0){const g=new T.BoxGeometry(w,h,depth,Math.max(1,Math.ceil(w/.5)),1,Math.max(1,Math.ceil(depth/.5)));g.rotateY(angle);g.translate(x,y+h/2,z);const pos=g.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)+elevation(pos.getX(i),pos.getZ(i)));g.computeVertexNormals();if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);}

 function inRing(x,z,r){let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
 function inGeometry(x,z,g){if(g.type==='GeometryCollection')return g.geometries.some(v=>inGeometry(x,z,v));return(g.type==='Polygon'?[g.coordinates]:g.coordinates).some(r=>r.length&&inRing(x,z,r[0])&&!r.slice(1).some(h=>inRing(x,z,h)));}
 for(const g of d.gaps||[]){const [x,z]=g.a,[X,Z]=g.b,L=Math.hypot(X-x,Z-z),ux=(X-x)/L,uz=(Z-z)/L,a=-Math.atan2(uz,ux);
  if(g.kind==='passage'){
   surface(g.geometry,0xbabbb1,.16,ground);
   const width=Math.min(1.6,g.width-.45);
   for(let row=0;row<L/.21;row++){const t=row*.21+.10;for(let n=-width/2+.11+(row%2)*.105;n<width/2-.08;n+=.215)if([[-.1,-.1],[-.1,.1],[.1,-.1],[.1,.1]].every(([du,dn])=>inGeometry(x+ux*(t+du)-uz*(n+dn),z+uz*(t+du)+ux*(n+dn),g.geometry)))box(x+ux*t-uz*n,.165,z+uz*t+ux*n,.20,.012,.20,(row+Math.round(n*10))%7?0xb6b4a4:0x9fa49e,a);}
   const t=Math.min(L-1,3),n=width/2-.15,px=x+ux*t-uz*n,pz=z+uz*t+ux*n;
   box(px,.17,pz,.09,3.1,.09,0x525d58);box(px,3.27,pz,.35,.13,.25,0x535e59);box(px,3.24,pz,.28,.025,.19,0xf0e7bc);
  }else{
   if(g.kind==='wall'){masonry({...g,height:1.8,cap:true});continue;}
   if(g.kind!=='gate')box((x+X)/2,.1,(z+Z)/2,L,1.9,.12,g.kind==='wall'?facadeStyles[g.styleIndex??5].wall:0xb5b9b5,a);
   if(g.kind==='gate'){for(const t of [0,L]){box(x+ux*t,.1,z+uz*t,.12,1.95,.14,0x40514b,a);}for(let t=0;t<=L;t+=.13)box(x+ux*t,.1,z+uz*t,.025,1.8,.025,0x40514b,a);for(const y of [.15,.85,1.8])box((x+X)/2,y,(z+Z)/2,L,.045,.06,0x40514b,a);}
   if(g.kind==='shutter'){
    for(let y=.18;y<1.95;y+=.08)box((x+X)/2,y,(z+Z)/2,L,.018,.14,0x8e9694,a);
    for(const [y,c] of [[.48,0x3d6c80],[.56,0xb3a246],[.64,0x9a554d],[1.4,0x3d6c80],[1.48,0xb3a246],[1.56,0x9a554d]])box((x+X)/2,y,(z+Z)/2,L,.065,.15,c,a);
    for(const t of [0,L])box(x+ux*t,.1,z+uz*t,.12,2,.20,0x747b77,a);
    box((x+X)/2,2,(z+Z)/2,L+.12,.13,.24,0x919994,a);
   }else box((x+X)/2,2,(z+Z)/2,L,.07,.18,0xc2bfb2,a);
  }
 }
 function fixedBox(x,y,z,w,h,depth,color,a=0){if(h<=0)return;const g=new T.BoxGeometry(w,h,depth);g.rotateY(a);g.translate(x,y+h/2,z);if(!batches.has(color))batches.set(color,[]);batches.get(color).push(g);}
 function masonryBox(x,y,z,w,h,d,color,a,id){masonryBatch.writer([x,0,z],Math.cos(a),-Math.sin(a),Math.sin(a),Math.cos(a)).box(0,y+h/2,0,w,h,d,color,false,false,id);}
 function masonry(w){const style=facadeStyles[w.styleIndex??5],id=wallTextureFor(w);if(w.posts)for(const [x,z] of [w.a,w.b]){const y=elevation(x,z);masonryBox(x,y-.08,z,.26,w.height+.16,.26,style.wall,0,id);fixedBox(x,y+w.height+.08,z,.30,.07,.30,0xc2bfb2);}for(const section of wallSections(w,elevation)){
  const {a:A,b:B,top,bottom,length:L,angle:a}=section,x=(A[0]+B[0])/2,z=(A[1]+B[1])/2,ux=(B[0]-A[0])/L,uz=(B[1]-A[1])/L;
  if(w.kind==='panel')fixedBox(x,bottom,z,L+.012,top-bottom,.18,0x9baeb3,a);
  else masonryBox(x,bottom,z,L+.012,top-bottom,.18,style.wall,a,id);
  fixedBox(x,top,z,L+.025,.07,.23,w.kind==='panel'?0x657d85:0xc2bfb2,a);
  if(w.kind==='panel'){for(let t=.2;t<L;t+=.4)fixedBox(A[0]+ux*t,bottom,A[1]+uz*t,.035,top-bottom,.20,0x7e9299,a);continue;}

  if(w.rail){const rh=w.railHeight??.32;for(let t=.15;t<L;t+=.24)fixedBox(A[0]+ux*t,top+.07,A[1]+uz*t,.025,rh,.025,0x45564e,a);fixedBox(x,top+.07+rh,z,L,.035,.06,0x45564e,a);}
 }}
 for(const w of d.walls)masonry(w);
 for(const line of d.yellowLines||[])for(let i=1;i<line.length;i++){const [x,z]=line[i-1],[X,Z]=line[i],L=Math.hypot(X-x,Z-z);if(L>.03)box((x+X)/2,.035,(z+Z)/2,L,.008,.10,0xe8bb39,-Math.atan2(Z-z,X-x));}
 for(const b of d.roadBays||[]){const [x,z]=b.point,[ux,uz,nx,nz]=b.direction,W=b.width??2.2,L=b.length??6;const at=(u,n)=>[x+ux*u+nx*n,z+uz*u+nz*n];for(const u of [-W/2,W/2]){const [X,Z]=at(u,0);box(X,.045,Z,.08,.012,L,0xf1efda,Math.atan2(nx,nz));}for(const n of [-L/2,L/2]){const [X,Z]=at(0,n);box(X,.045,Z,W,.012,.08,0xf1efda,Math.atan2(nx,nz));}
  const c=document.createElement('canvas');c.width=256;c.height=128;const cx=c.getContext('2d');cx.fillStyle='#e6bd51';cx.font='bold 80px sans-serif';cx.textAlign='center';cx.fillText(String(b.number).padStart(2,'0'),128,90);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  const geo=new T.PlaneGeometry(.65,.4);geo.rotateX(-Math.PI/2);geo.rotateY(Math.atan2(nx,nz));const m=new T.Mesh(geo,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:T.DoubleSide})),[X,Z]=at(0,-L/2+.3);m.position.set(X,elevation(X,Z)+.065,Z);objects.add(m);
 }
 for(const b of d.bays){if(b.road)continue;const [x,z]=b.point,[ux,uz,nx,nz]=b.direction,a=Math.atan2(nx,nz);const at=(u,n)=>[x+ux*u+nx*n,z+uz*u+nz*n];
  for(const u of [-1.28,1.28])for(let j=0;j<8;j++){if((Math.round(x*11+z*7)+j)%11===0)continue;const [X,Z]=at(u,-2.3+j*.65);box(X,.12,Z,.065,.012,.60,0xdedfd2,a);}
  if(!b.piloti){for(const u of [-.7,.7]){const [S,V]=at(u,2.15);box(S,.13,V,.55,.12,.16,0x525a54,a);box(S,.25,V,.18,.015,.17,0xc4ae59,a);}}
  let [X,Z]=at(0,2.55);box(X,.12,Z,2.6,.015,.075,0xecebd8,a);

 }
 objects.add(createUtilityNetwork(d,elevation));
 for(const p of d.entranceDrains||[]){const [x,z]=p.a,[X,Z]=p.b,L=Math.hypot(X-x,Z-z),a=-Math.atan2(Z-z,X-x);box((x+X)/2,.12,(z+Z)/2,L,.025,.22,0x46524e,a);for(let u=.12;u<L;u+=.16)box(x+(X-x)*u/L,.148,z+(Z-z)*u/L,.025,.012,.19,0x93998e,a);}
 for(const p of d.drains){const [x,z]=p.point,a=-p.angle;box(x,.115,z,.65,.025,.40,0x46524e,a);for(let i=-2;i<=2;i++){const u=i*.11;box(x+Math.cos(p.angle)*u,.145,z+Math.sin(p.angle)*u,.035,.015,.35,0x89918b,a);}}
 for(const [color,geos] of batches){objects.add(new T.Mesh(mergeGeometries(geos),new T.MeshStandardMaterial({color,roughness:1})));geos.forEach(g=>g.dispose());}
 objects.add(masonryBatch.finish('TexturedBoundaryWalls'));
 let foliage=null;
 if(!options.skipFoliage){
 const plans=d.plants.map((p,i)=>gardenPlant({id:'infill-'+i,root:[p.point[0],elevation(...p.point)+.12,p.point[1]],height:p.height,radius:p.radius,count:p.kind==='tree'?(p.dense?160:64):(p.dense?18:24),variant:i%6,...(p.kind==='tree'?treePlanting({id:'infill-'+i,species:p.species,use:p.treeUse||'yard',radius:p.radius}):{})}));
 for(let i=0;i<plans.length;i++){const p=d.plants[i];if(p.kind==='tree'){plans[i]=normalizeTreeHeight(plans[i],plans[i].height,true);continue;}for(const c of plans[i].clumps){const room=Math.max(0,p.radius-Math.hypot(c.center[0]-p.point[0],c.center[2]-p.point[1]));c.radius=Math.min(room/(c.cardScale??1),Math.max(c.radius*(p.dense?1.6:1),Math.min(p.dense?.2:.16,room/(c.cardScale??1))));}}
 const treeTextures=new Map(await Promise.all([...new Set(plans.map(p=>p.species))].map(async id=>[id,await loadCanopyTexture(id)])));
 const overrides=new Map(),trialParams=new URLSearchParams(globalThis.location?.search||'');
 if(trialParams.get('location')==='ff486fdeb343ab9c'&&trialParams.get('leafCompare')==='new'){
  const target=plans.find(p=>p.id==='infill-0');if(!target)throw new Error('나뭇잎 비교 대상이 없습니다.');
  const trial=await new T.TextureLoader().loadAsync(new URL('../vegetation/leaf-trial/zelkova-crisp-v1.png',import.meta.url).href);
  trial.colorSpace=T.SRGBColorSpace;trial.anisotropy=4;trial.generateMipmaps=false;trial.minFilter=T.LinearFilter;
  trial.userData.frames=Array.from({length:24},()=>({rect:[0,0,1,1]}));overrides.set(target.id,trial);
 }
 foliage=createHybridTrees(plans,treeTextures,overrides);foliage.group.userData.leafTrial={ids:[...overrides.keys()],image:'zelkova-crisp-v1.png'};foliage.group.userData.treeProfiles=plans.filter((p,i)=>d.plants[i].kind==='tree').map(p=>({id:p.id,species:p.species,height:p.height}));objects.add(foliage.group);foliage.sunShadows.set({azimuth:38.66,renderElevation:54.57,castsSunShadow:true},true);
 }
 // Reuse the existing Korean passenger-car model, scaled to a real small-car envelope.
 const carSources=[['../vehicles/ray/model-painted-glass.glb',3.595],['../vehicles/sonata-dn8/model-glass.glb',4.9],['../vehicles/spark-m400/model.glb',3.595]];
 const cars=options.carModels||await Promise.all(carSources.map(async([url,length])=>{const car=(await new GLTFLoader().loadAsync(new URL(url,import.meta.url).href)).scene;let bounds=new T.Box3().setFromObject(car),size=bounds.getSize(new T.Vector3());if(size.x>size.z)car.rotation.y=Math.PI/2;car.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(car);size=bounds.getSize(new T.Vector3());const center=bounds.getCenter(new T.Vector3()),scale=length/size.z,sx=Math.min(scale,1.95/size.x);car.scale.set(sx,scale,scale);car.position.set(-center.x*sx,-bounds.min.y*scale,-center.z*scale);return car;}));
 for(const [i,b] of d.bays.filter(b=>b.occupied).entries()){const g=new T.Group();const car=options.carFactory?.(i,b)||cars[b.carModel??(i%cars.length)].clone(true);g.add(car);car.updateMatrix();if(car.userData.wheelContactPoints)g.userData.wheelContactPoints=car.userData.wheelContactPoints.map(ps=>ps.map(p=>new T.Vector3(...p).applyMatrix4(car.matrix).toArray()));g.position.set(b.point[0],(b.floorElevation??elevation(...b.point))+.13,b.point[1]);g.rotation.y=Math.atan2(b.direction[2],b.direction[3])+Math.PI;if(options.elevation)seatGroundAsset(g,(x,z)=>(b.floorElevation??elevation(x,z))+(b.road?.025:.10),{suspension:true});if(g.userData.groundFit?.maxGap>.15){continue;}objects.add(g);}

 return {ground,objects,foliage,update:camera=>foliage?.update(camera)};
}
