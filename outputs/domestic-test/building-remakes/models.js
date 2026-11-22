import {emitReplacementCivicFace} from './replacement-civic.js?v=replacements3';
import {emitReplacementRetailFace} from './replacement-retail.js?v=replacements3';
import {emitReplacementShopsFace} from './replacement-shops.js?v=replacements3';
import {identityWindowWriter} from './identity.js?v=replacements3';
import {emitWindow} from '../korean-facades.js?v=recess22';
import {emitFacadeTexture} from '../facade-textures.js?v=masonry19';
import {windowOpening,WINDOW_RECESS} from '../window-recess.js?v=recess22';
import {inPolygon} from '../geometry/polygon.js';
import {emitApprovedCivicFace} from './civic-residential.js?v=replacements3';
import {emitApprovedRetailFace} from './retail.js?v=replacements3';
import {emitApprovedStorefrontFace} from './storefronts.js?v=replacements3';
import {approvedBuildingProfiles} from './profiles.js?v=replacements3';
export {approvedBuildingProfiles} from './profiles.js?v=replacements3';
export function approvedBuildingId(b){const id=b.assetChoice?'building:'+b.assetChoice:'facility:'+b.facility?.id;return approvedBuildingProfiles[id]?id:null;}
function clipped(rect,cuts){let pieces=[rect];for(const [l,r,b,t] of cuts)pieces=pieces.flatMap(([a,c,d,e])=>{if(c<=l||a>=r||e<=b||d>=t)return[[a,c,d,e]];const left=Math.max(a,l),right=Math.min(c,r);return[[a,left,d,e],[right,c,d,e],[left,right,d,Math.max(d,b)],[left,right,Math.min(e,t),e]].filter(q=>q[1]-q[0]>.001&&q[3]-q[2]>.001)});return pieces;}
// A roof core must fit the whole polygon, including concave notches and holes.
export function roofCoreFits(points,holes,cx,cz,w,d){
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[cx+x*w/2,cz+z*d/2]);
 if(!corners.every(p=>inPolygon(p,points)&&!holes.some(h=>inPolygon(p,h))))return false;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const intersects=(a,b,c,d)=>Math.max(a[0],b[0])>=Math.min(c[0],d[0])&&Math.max(c[0],d[0])>=Math.min(a[0],b[0])&&Math.max(a[1],b[1])>=Math.min(c[1],d[1])&&Math.max(c[1],d[1])>=Math.min(a[1],b[1])&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;
 for(const ring of [points,...holes])for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length];if(Math.abs(a[0]-cx)<w/2&&Math.abs(a[1]-cz)<d/2)return false;
  if(corners.some((c,j)=>intersects(a,b,c,corners[(j+1)%4])))return false;
 }
 return true;
}
export function emitApprovedBuilding(batch,b,buildings,elevation,options={}){
 const id=approvedBuildingId(b);if(!id)return null;
 const profile=approvedBuildingProfiles[id],{points,base,top}=b,H=top-base,levels=Math.max(1,Math.round(b.levels)),fh=H/levels;
 if(!Number.isFinite(H)||H<=0||!points?.length)throw Error('승인 건물의 크기를 확인해 주세요.');
 const winding=Math.sign(points.reduce((s,a,i)=>{const c=points[(i+1)%points.length];return s+a[0]*c[1]-c[0]*a[1]},0))||1;
 let windows=0;const features=[],signs=[];
 for(let edge=0;edge<points.length;edge++){
  const a=points[edge],c=points[(edge+1)%points.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<.6)continue;
  const ux=(c[0]-a[0])/L,uz=(c[1]-a[1])/L,nx=uz*winding,nz=-ux*winding;
  if([.2,.5,.8].every(t=>buildings.some(o=>o!==b&&inPolygon([a[0]+ux*L*t+nx*.15,a[1]+uz*L*t+nz*.15],o.points))))continue;
  const out=batch.writer([a[0],base,a[1]],ux,uz,nx,nz),cuts=[],panels=[],front=edge===(b.facility.frontEdge??b.frontEdge??0),ground=Math.max(0,elevation(a[0]+ux*L/2,a[1]+uz*L/2)-base);
  const box=(x,y,z,w,h,d,color)=>{if([x,y,z,w,h,d].some(v=>!Number.isFinite(v)))throw Error('승인 건물 부품 좌표 오류');if(w>.005&&h>.005&&d>.005)out.box(x,y,z,w,h,d,color);};
  const surface=(x,y,w,h,color,z=.014)=>{if(w>0&&h>0)panels.push({rect:[Math.max(.015,x-w/2),Math.min(L-.015,x+w/2),Math.max(ground,y-h/2),Math.min(H,y+h/2)],color,z});};
  const window=(x,y,w,h,kind='white-slider',frame=0xc5cbc3,glass=profile.glass)=>{
   const lo=Math.max(.12,x-w/2),hi=Math.min(L-.12,x+w/2),bottom=Math.max(ground+.035,y-h/2),ceiling=Math.min(H-.18,y+h/2);w=hi-lo;h=ceiling-bottom;if(w<.3||h<.35)return;x=(lo+hi)/2;y=(bottom+ceiling)/2;
   if(cuts.some(([l,r,bt,t])=>Math.min(hi,r)-Math.max(lo,l)>.01&&Math.min(ceiling,t)-Math.max(bottom,bt)>.01))return;
   if(options.windowOpenings){const rect=windowOpening(out,options.windowOpenings,b,edge,a,[ux,uz],[nx,nz],x,base+y,w,h,profile.wall);cuts.push([rect[0],rect[1],rect[2]-base,rect[3]-base]);}
   else cuts.push([lo,hi,bottom,ceiling]);
   emitWindow(identityWindowWriter(out.at(x,y,0),glass),kind,w,h,windows%7,frame,b.seed*997+edge*131+windows,{...(options.windowOpenings?{recess:WINDOW_RECESS}:{}),accessories:false});windows++;
  };
  const sign=(key,x,y,w,h,z=.3,options={})=>signs.push({key,x:a[0]+ux*x+nx*z,y:base+y,z:a[1]+uz*x+nz*z,w,h,angle:Math.atan2(nx,nz),options,owner:b.seed});
  const face=(vertices,color)=>{const q=vertices.map(([x,y,z])=>[a[0]+ux*x+nx*z,base+y,a[1]+uz*x+nz*z]);out.reveal(q[0],q[1],q[2],q[3]||q[2],color);};
  const projected=points.map(p=>[(p[0]-a[0])*ux+(p[1]-a[1])*uz,-((p[0]-a[0])*nx+(p[1]-a[1])*nz)]),depth=Math.max(...projected.map(p=>p[1]));
  const roofDepth=points.length===4&&!b.holePoints?.length&&projected.every(([x,z])=>(Math.abs(x)<.01||Math.abs(x-L)<.01)&&(Math.abs(z)<.01||Math.abs(z-depth)<.01))?depth:0;
  const ctx={id,L,H,levels,fh,front,edge,ground,out,window,surface,box,sign,face,roofDepth};
  if(!emitReplacementCivicFace(ctx)&&!emitReplacementRetailFace(ctx)&&!emitReplacementShopsFace(ctx)&&!emitApprovedCivicFace(ctx)&&!emitApprovedRetailFace(ctx)&&!emitApprovedStorefrontFace(ctx))throw Error('승인된 건물 생성기가 없습니다: '+id);
  // Keep only one exterior finish at a point; all finishes share aperture cuts.
  const wallCuts=[...cuts,...panels.map(p=>p.rect)];
  if(profile.texture)emitFacadeTexture(batch,out,{width:L,bottom:ground,top:H,id:profile.texture,cuts:wallCuts});
  else for(const [l,r,bt,t] of clipped([.015,L-.015,ground,H],wallCuts))out.quad((l+r)/2,(bt+t)/2,.010,r-l,t-bt,profile.wall,true);
  for(const panel of panels)for(const [l,r,bt,t] of clipped(panel.rect,cuts))out.quad((l+r)/2,(bt+t)/2,panel.z,r-l,t-bt,panel.color,true);
  // Parapet sits inside the footprint, with a cap instead of a floating roof slab.
  if(profile.parapet!==false){box(L/2,H+.25,-.10,L,.5,.20,profile.wall);box(L/2,H+.52,-.10,L+.02,.055,.25,0x8c9891);}
  if(L>3){const x=front?L-.17:.17;out.rod([x,ground+.12,.075],[x,H-.06,.075],.045,0x818e86,6);for(let y=ground+.45;y<H;y+=2.1)box(x,y,.06,.14,.065,.15,0x74827a);}
  features.push({edge,front,openings:cuts.length});
 }
 // Small service core and connected ventilation, placed entirely inside the roof.
 const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minZ=Math.min(...points.map(p=>p[1])),maxZ=Math.max(...points.map(p=>p[1]));
 const cw=Math.min(3,(maxX-minX)*.23),cd=Math.min(2.6,(maxZ-minZ)*.25),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
 if(profile.roofCore!==false&&cw>.8&&cd>.8&&roofCoreFits(points,b.holePoints||[],cx,cz,cw,cd)){
  const roof=batch.writer([cx,base,cz]);roof.box(0,H+.95,0,cw,1.9,cd,profile.wall);roof.box(0,H+1.93,0,cw+.12,.08,cd+.12,0x858f85);roof.box(0,H+.85,cd/2+.015,.75,1.65,.03,0x61716c);roof.box(.25,H+.9,cd/2+.05,.035,.16,.045,0xced4ca);for(let y=H+.5;y<H+1.4;y+=.15)roof.box(-cw*.3,y,cd/2+.035,.35,.035,.07,0x626f6a);
 }
 b.approvedRemake={id,referenceId:profile.referenceId,features,signs};return{windows,sourceId:profile.referenceId,remade:true};
}
