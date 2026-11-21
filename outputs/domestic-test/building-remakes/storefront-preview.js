import {FacadeBatch,emitWindow} from '../korean-facades.js?v=recess22';
import {emitApprovedStorefrontFace} from './storefronts.js?v=approved-storefronts1';

const REFERENCES={
 gs25:['building-reference-gs25-bucheon-20261121',0xd4d2c9],
 seven:['seven-exterior-kr-v1',0x575e5c],
 emart24:['emart24-0-kr-v1',0x343936],
 starbucks:['starbucks-0-kr-v1',0xc8c8bd],
};
// Split rectangles at openings instead of putting an opaque wall over glazing.
function subtract(rect,cuts){
 let pieces=[rect];
 for(const cut of cuts){
  const next=[];
  for(const r of pieces){
   const a=Math.max(r[0],cut[0]),b=Math.min(r[1],cut[1]),c=Math.max(r[2],cut[2]),d=Math.min(r[3],cut[3]);
   if(a>=b||c>=d){next.push(r);continue;}
   if(r[0]<a)next.push([r[0],a,r[2],r[3]]);
   if(b<r[1])next.push([b,r[1],r[2],r[3]]);
   if(r[2]<c)next.push([a,b,r[2],c]);
   if(d<r[3])next.push([a,b,d,r[3]]);
  }
  pieces=next;
 }
 return pieces;
}
export function createApprovedStorefront(spec,{shell=true,attachment=false}={}){
 const profile=REFERENCES[spec.facilityId];
 if(!profile)return null;
 const W=spec.width,H=spec.height;
 if(!Number.isFinite(W)||!Number.isFinite(H)||W<1.15||H<1.7)throw new RangeError('Approved storefront requires finite width >= 1.15m and height >= 1.7m');
 const batch=new FacadeBatch(),out=batch.writer([-W/2,0,0]),openings=[],panels=[],approvedOpenings=[];
 const bounds=(x,y,w,h)=>[Math.max(0,x-w/2),Math.min(W,x+w/2),Math.max(0,y-h/2),Math.min(H,y+h/2)];
 const window=(x,y,w,h,kind='white-slider',frame=0xc5cbc3)=>{
  if(w<=.15||h<=.15||x-w/2<0||x+w/2>W||y-h/2<0||y+h/2>H)return;
  openings.push([x-w/2,x+w/2,y-h/2,y+h/2]);
  emitWindow(out.at(x,y,0),kind,w,h,1,frame,null,{sill:false,accessories:false});
 };
 const surface=(x,y,w,h,color,z=.014)=>panels.push({rect:bounds(x,y,w,h),color,z});
 emitApprovedStorefrontFace({id:'facility:'+spec.facilityId,L:W,H,levels:1,fh:H,front:true,edge:0,ground:0,out,window,surface,box:out.box,entryOpening:opening=>approvedOpenings.push({...opening,x:opening.x-W/2})});
 const paint=(rect,color,z,cuts)=>{
  for(const r of subtract(rect,cuts))if(r[1]-r[0]>.001&&r[3]-r[2]>.001)out.quad((r[0]+r[1])/2,(r[2]+r[3])/2,z,r[1]-r[0],r[3]-r[2],color,false);
 };
 paint([0,W,0,H],profile[1],attachment?.008:0,[...openings,...panels.map(p=>p.rect)]);
 for(const p of panels)paint(p.rect,p.color,p.z,openings);
 if(shell)out.box(W/2,H/2,-.24,W,H,.08,profile[1]);
 const root=batch.finish('ApprovedStorefront-'+spec.id);
 root.userData={plantAnchors:[],approvedOpenings,storefrontId:spec.id,category:spec.category,source:spec.source,dimensionsEstimated:true,textFree:true,attachment:{normal:[0,0,1],origin:'frontage center at ground',width:W,height:H},lodCompatible:true,approvedReferenceId:profile[0]};
 const glass=new Set([0x79999a,0x899f9a,0x67888c,0xafc4bd]);
 root.traverse(o=>{
  if(!o.isMesh)return;
  o.castShadow=true;o.receiveShadow=true;
  // The shop lighting consumer calls its window role "interior".
  if(glass.has(o.material.color.getHex()))o.userData.storefrontLightRole='interior';
 });
 return root;
}
