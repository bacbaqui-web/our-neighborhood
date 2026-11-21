import * as T from 'three';
import {FacadeBatch,facadeStyles} from './korean-facades.js?v=masonry19';
import {getFacadeTexture,wallTextureFor} from './facade-textures.js?v=masonry19';
import {rooftopCatalog,rooftopDoorX} from './rooftop-plan.js?v=151';
export {rooftopCatalog};
// Roof mass and door stay in every LOD; only small fittings disappear at distance.
export function emitRooftop(batch,plan,style){
 const {x,z,top,w,d,h,angle,kind,variation}=plan,c=Math.cos(angle),s=Math.sin(angle);
 const out=batch.writer([x,top+.025,z],c,s,-s,c),B=out.box,R=out.rod;
 const wall=style.wall,textureId=wallTextureFor(style),meters=getFacadeTexture(textureId).userData.meters;
 const W=(xx,y,zz,ww,hh,dd,color=wall,edge=true)=>B(xx,y,zz,ww,hh,dd,color,edge,false,textureId);
 const slab=[0xb5b8b0,0xaab7b1,0xc2c0b4][variation%3],metal=[0x667d78,0x777e81,0x6d736b][variation%3],door=[0x4f6d62,0x667578,0x7c776b,0x606b76][variation%4];
 function face(vertices,color,textured=false){const p=vertices.map(([xx,y,zz])=>new T.Vector3(x+c*xx-s*zz,top+.025+y,z+s*xx+c*zz)),n=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();const bucket=batch.bucket(textured?0xffffff:color,false,textured?textureId:null);for(let i=1;i<p.length-1;i++)for(const index of [0,i,i+1]){const v=p[index];bucket.p.push(v.x,v.y,v.z);bucket.n.push(n.x,n.y,n.z);bucket.inkIds.push(batch.inkObjectId??0);if(textured){const q=vertices[index];const localNX=c*n.x+s*n.z,localNZ=-s*n.x+c*n.z;bucket.uv.push((q[0]*localNZ-q[2]*localNX)/meters[0],q[1]/meters[1]);}}}
 function flat(xx,zz,ww,dd,hh,color=wall){W(xx,hh/2,zz,ww,hh,dd,color);B(xx,hh+.075,zz,ww+.24,.15,dd+.24,slab,true);}
 function slopingCap(ww,dd,yAt,color){
  const corners=[[-ww/2,dd/2],[ww/2,dd/2],[ww/2,-dd/2],[-ww/2,-dd/2]],upper=corners.map(([xx,zz])=>[xx,yAt(zz),zz]),lower=upper.map(([xx,yy,zz])=>[xx,yy-.12,zz]);
  face(upper,color);face([...lower].reverse(),color);for(let i=0;i<4;i++){const j=(i+1)%4;face([lower[i],lower[j],upper[j],upper[i]],color);}
 }
 if(kind==='compact'||kind==='brick'){
  flat(0,0,w,d,h);
  if(kind==='brick'){
   // Low coping around the access-room roof, with a single clean cap line.
   for(const side of [-1,1])W(side*(w/2-.065),h+.29,0,.13,.28,d);
   for(const side of [-1,1])W(0,h+.29,side*(d/2-.065),w-.26,.28,.13);
  }
 }else if(kind==='shed'||kind==='hatch'){
  W(0,h/2,0,w,h,d);
  const rise=kind==='hatch'?.46:.50;
  face([[-w/2,h,d/2],[-w/2,h+rise,-d/2],[-w/2,h,-d/2]],wall,true);
  face([[w/2,h,-d/2],[w/2,h+rise,-d/2],[w/2,h,d/2]],wall,true);
  W(0,h+rise/2,-d/2+.025,w,rise,.05,wall,false);
  slopingCap(w+.28,d+.28,zz=>h+.14+rise*(d/2-zz)/d,metal);
  out.detail(1,()=>{for(const xx of [-w*.30,0,w*.30])R([xx,h+.16,d/2+.14],[xx,h+.16+rise,-d/2-.14],.015,slab,4);});
 }else if(kind==='gable'){
  W(0,h/2,0,w,h,d);const rise=.62;
  face([[-w/2,h,d/2],[w/2,h,d/2],[0,h+rise,d/2]],wall,true);
  face([[w/2,h,-d/2],[-w/2,h,-d/2],[0,h+rise,-d/2]],wall,true);
  const ww=w/2+.16,dd=d/2+.16;
  for(const side of [-1,1]){
   const roof=[[-side*ww,h+.09,dd],[0,h+rise+.14,dd],[0,h+rise+.14,-dd],[-side*ww,h+.09,-dd]];
   if(side<0)roof.reverse();face(roof,metal);
   R([-side*ww,h+.09,dd],[-side*ww,h+.09,-dd],.045,metal);
   R([-side*ww,h+.09,dd],[0,h+rise+.14,dd],.035,slab);
  }
  R([0,h+rise+.14,-dd],[0,h+rise+.14,dd],.045,slab);
 }else if(kind==='elbow'){
  // Two touching volumes form an L; roof caps stop at the shared seam.
  W(0,h/2,-d*.265,w,h,d*.47);W(-w*.21,h/2,d*.235,w*.58,h,d*.53);
  B(0,h+.075,-d*.265-.06,w+.24,.15,d*.47+.12,slab,true);
  B(-w*.21,h+.075,d*.235+.06,w*.58+.24,.15,d*.53+.12,slab,true);
 }else if(kind==='stepped'){
  flat(0,-d*.23,w,d*.54,h+.85);flat(0,d*.27,w*.66,d*.46,h);
 }else if(kind==='lift'){
  // Broad machine-room mass alongside a lower, full-depth stair access wing.
  flat(w*.25,-d*.08,w*.5,d*.84,h+1.05);flat(-w*.25,0,w*.5,d,h);
  B(w*.25,h+.58,d*.34+.028,w*.32,.42,.05,0x596564,false);
  out.detail(1,()=>{for(let i=0;i<4;i++)B(w*.25,h+.44+i*.095,d*.34+.059,w*.30,.025,.025,slab,false);});
 }
 const doorX=rooftopDoorX(kind,w),doorHeight=kind==='hatch'?.93:1.93,doorWidth=kind==='hatch'?.9:.86,doorZ=d/2+.036;
 B(doorX,doorHeight/2+.07,doorZ,doorWidth,doorHeight,.07,door,true);
 for(const side of [-1,1])B(doorX+side*(doorWidth/2+.025),doorHeight/2+.07,doorZ+.007,.045,doorHeight+.10,.085,slab,false);
 B(doorX,doorHeight+.10,doorZ+.007,doorWidth,.055,.085,slab,false);
 B(doorX,.045,d/2+.17,doorWidth+.16,.09,.34,slab,true);
 out.detail(0,()=>B(doorX+doorWidth*.32,doorHeight*.5,doorZ+.065,.024,.19,.035,0xc7ccc3,false));
 if(kind!=='hatch'){
  // Opaque side light / vent is mounted proud of the wall, never coplanar.
  const sideX=-w/2-.03,sideZ=kind==='elbow'?-d*.25:-d*.18;
  B(sideX,h*.70,sideZ,.06,.48,.76,0x657b7b,false);
  out.detail(1,()=>{for(const yy of [-.27,.27])B(sideX-.01,h*.70+yy,sideZ,.075,.045,.84,slab,false);for(const zz of [-.40,.40])B(sideX-.01,h*.70,sideZ+zz,.075,.50,.045,slab,false);});
  if(variation%3===0){B(doorX,doorHeight+.27,d/2+.18,doorWidth+.38,.065,.50,metal,true);out.detail(1,()=>{for(const xx of [-.32,.32])R([doorX+xx,doorHeight+.06,d/2+.03],[doorX+xx,doorHeight+.24,d/2+.40],.016,metal);});}
 }
 if(['compact','brick','stepped'].includes(kind)&&variation%4===0){
  const yy=h+(kind==='stepped'?.85:0)+.15;
  out.detail(1,()=>{R([w*.27,yy,-d*.25],[w*.27,yy+.48,-d*.25],.07,metal);B(w*.27,yy+.50,-d*.25,.22,.055,.22,metal,false);});
 }
}
export function createRooftopAsset(id,options={}){const r=rooftopCatalog.find(r=>r.id===id);if(!r)throw Error('Unknown rooftop: '+id);const batch=new FacadeBatch();batch.inkObjectId=new T.Object3D().id;const i=rooftopCatalog.indexOf(r);const plan={...r,kind:id,x:0,z:0,top:0,angle:0,variation:i*7};emitRooftop(batch,plan,{...facadeStyles[options.styleIndex??i%6],...(options.wallTexture?{wallTexture:options.wallTexture}:{})});const group=batch.finish(r.name);group.userData={...r,units:'meters',procedural:true};return group;}
