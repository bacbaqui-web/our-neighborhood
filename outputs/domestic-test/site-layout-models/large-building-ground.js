import * as T from 'three';
import {FacadeBatch} from '../korean-facades.js';
import {applyWallTexture} from '../facade-textures.js';

// Geometry comes from the fitted site plan; the same approved clearance is used
// for the visible planter, soil, planting and pedestrian/vehicle approaches.
export function createLargeBuildingGround(layouts){
 const group=new T.Group(),batch=new FacadeBatch();group.name='LargeBuildingGround';
 const surfaces=(geometry,color,y,height=0,texture=null)=>{
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates||[];
  for(const rings of polygons){if(!rings[0]?.length)continue;const shape=new T.Shape(rings[0].map(([x,z])=>new T.Vector2(x,-z)));for(const h of rings.slice(1))shape.holes.push(new T.Path(h.map(([x,z])=>new T.Vector2(x,-z))));
   const g=height?new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}):new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,y,0);
   const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.9,side:T.DoubleSide}));if(texture)applyWallTexture(mesh,texture);group.add(mesh);
  }
 };
 const sign=(text,a,u,n,x,y,z,w,h,bg='#344b4d')=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle='#f4f0df';ctx.font='600 65px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,68,480);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));mesh.rotation.y=Math.atan2(-n[0],-n[1]);mesh.position.set(a[0]+u[0]*x+n[0]*z,y,a[1]+u[1]*x+n[1]*z);group.add(mesh);
 };
 for(const p of layouts){
  const e=p.entrance,{origin:a,u,n,width:w,depth:d}=e,o=batch.writer([a[0],.07,a[1]],u[0],u[1],n[0],n[1]);batch.inkObjectId=p.owner;
  // The glass sits 1.5m behind the facade. Its sides and ceiling are real recesses.
  o.box(0,.025,d/2,w,.05,d+.04,0xc0bdae);
  o.box(0,2.66,d/2,w,.10,d+.08,0xd5d1c3);
  for(const side of [-1,1]){
   o.box(side*(w/2-.08),1.35,d/2,.16,2.7,d,0xa5aaa3,false,false,'charcoal-granite');
   o.box(side*(w/2+.10),1.35,-.025,.28,2.7,.12,0xb7bbb2,false,false,'white-granite');
  }
  // A broad glazed screen, central double doors and modest side glazing.
  o.box(0,1.24,d-.09,w-.32,2.4,.05,0x526f70);
  const doorW=Math.min(2.1,w-.8),glassBack=d-.13;
  for(const x of [-w/2+.16,-doorW/2,0,doorW/2,w/2-.16])o.box(x,1.26,glassBack,.055,2.45,.08,0xa4ada7);
  for(const y of [.045,2.45])o.box(0,y,glassBack,w-.3,.055,.09,0xa4ada7);
  for(const x of [-.16,.16])o.box(x,1.05,glassBack-.075,.028,.62,.05,0xd5d9cd);
  o.box(0,.08,d-.30,doorW,.025,.36,0x858e86);
  const cd=e.canopyDepth;o.box(0,2.75,(d-cd)/2,w+.6,.18,d+cd,0x505f60);
  o.box(0,2.85,(d-cd)/2,w+.64,.025,d+cd+.04,0xb4bbb3);
  o.box(0,2.648,-cd/2,w-.45,.025,.055,0xf6e7b9);
  o.box(0,2.79,-cd-.015,w+.6,.29,.05,0x344b4d);
  sign('공동현관',a,u,n,0,2.86,-cd-.045,Math.min(1.65,w*.45),.22);
  // Access controller, letter boxes and a mat identify a working lobby.
  o.box(w/2-.35,1.38,d-.22,.16,.32,.08,0x344844);o.box(w/2-.35,1.46,d-.267,.10,.08,.012,0x87a4a0);
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   const xx=-w/2+.4+col*.27;o.box(xx,.72+row*.26,d-.22,.24,.23,.12,0x9ba49b);o.box(xx,.78+row*.26,d-.286,.15,.018,.012,0x445550);
  }
  o.box(0,.055,d*.38,doorW,.018,.60,0x5b6962);
  surfaces(e.walk,0xd4d0c0,.052);
  for(const bed of p.beds){
   const outer=bed.geometry,soil=bed.soil;
   // The hollow rim has a textured vertical face and a thin coping.
   const outerPolys=outer.type==='Polygon'?[outer.coordinates]:outer.coordinates;
   const innerPolys=soil.type==='Polygon'?[soil.coordinates]:soil.coordinates;
   // Generated beds are individual polygons with no nested disconnected islands.
   const ring={type:'Polygon',coordinates:[outerPolys[0][0],...innerPolys.map(rs=>rs[0])]};
   surfaces(ring,0xb7bbb1,.035,bed.height-.035,'white-granite');
   surfaces(ring,0xd0d0c0,bed.height,.045);
   surfaces(soil,0x645e48,bed.height-.035);
  }
  // Bollard lighting stays beside the walkway, within the approved garden.
  for(const b of p.beds.filter(b=>b.street).slice(0,3)){
   const ring=b.soil.type==='Polygon'?b.soil.coordinates[0]:b.soil.coordinates[0][0];if(!ring?.length)continue;
   const a=ring[0],q=ring[1],x=(a[0]+q[0])/2,z=(a[1]+q[1])/2,out=batch.writer([x,.53,z],1,0,0,1);
   out.box(0,.27,0,.11,.54,.11,0x3e5151);out.box(0,.53,0,.13,.10,.13,0xdce2c6);out.box(0,.60,0,.17,.045,.17,0x3e5151);
  }
  if(p.ramp){
   const r=p.ramp,{origin:a,u,n,width:w}=r,out=batch.writer([a[0],0,a[1]],u[0],u[1],n[0],n[1]);
   surfaces(r.approach,0x9da6a0,.054);
   sign('P  지하주차장',a,u,n,w/2,2.55,-.075,w-.25,.34);
   out.box(w-.25,.58,-.2,.18,1.1,.22,0x647573);out.box(w-.25,1.08,-.34,.13,.16,.07,0x3b5052);
   for(const xx of [.12,w-.12])for(let j=0;j<4;j++)out.box(xx,.35+j*.22,-.08,.13,.10,.06,0xd8bc5c);
   // Open barrier arm: visually connected to its pedestal, clear of the lane.
   out.box(w-.29,1.75,-.21,.07,1.3,.07,0xe3e0cd);
   for(let j=0;j<4;j++)out.box(w-.29,1.26+j*.29,-.255,.072,.12,.02,0xa55b4b);
   out.box(.28,1.35,.38,.08,.18,.10,0x9ab28b);
  }
 }
 group.add(batch.finish('LargeBuildingEntranceDetails'));
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}
