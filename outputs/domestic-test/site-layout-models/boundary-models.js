import {FacadeBatch,facadeStyles} from '../korean-facades.js?v=masonry19';
import {wallTextureFor} from '../facade-textures.js?v=masonry19';
import {createUtilityNetwork} from './utility-network.js';

// The layout data owns all positions. These models only decorate approved spans.
export function createBoundaryDetails(data,frontages){
 const batch=new FacadeBatch();
 const frame=(a,b)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/L,(b[1]-a[1])/L];return {L,u,n:[-u[1],u[0]]};};
 const writer=(a,u,n)=>batch.writer([a[0],.04,a[1]],u[0],u[1],n[0],n[1]);
 const rail=(out,L,h,base=0)=>{
  for(const y of [base+.1,base+h-.08])out.box(L/2,y,0,L,.045,.045,0x46594f);
  const count=Math.ceil(L/.19);
  for(let i=0;i<=count;i++)out.box(L*i/count,base+h/2,0,.025,h,.035,0x46594f);
 };
 for(const w of data.scene.walls){
  const {L,u,n}=frame(w.a,w.b),out=writer(w.a,u,n);
  if(w.kind==='rail')rail(out,L,.85,w.height+.05);
 }
 for(const g of data.gates){
  const {L,u}=frame(g.a,g.b),owner=frontages.buildings[g.owner],style=facadeStyles[owner.styleIndex];
  for(const point of g.posts){const o=writer(point,u,g.inward);o.box(0,g.height/2+.08,0,.20,g.height+.16,.22,style.wall,false,false,wallTextureFor(owner));o.box(0,g.height+.2,0,.25,.08,.27,style.frame);}
  // Both leaves stand open into the plot. Their open footprint was checked.
  for(const endpoint of [g.a,g.b]){
   const o=writer(endpoint,g.inward,u);rail(o,L/2,g.height-.1,.1);
   o.box(L*.23,.92,.04,.13,.035,.06,0xb2b7aa);
  }
 }
 for(const g of data.garages){
  const {L,u,n}=frame(g.a,g.b),o=writer(g.a,u,n),owner=frontages.buildings[g.owner],style=facadeStyles[owner.styleIndex];
  for(const x of [0,L])o.box(x,g.height/2,0,.16,g.height,.22,style.wall,false,false,wallTextureFor(owner));
  o.box(L/2,g.height-.07,0,L+.16,.22,.32,0x8b9590);
  const shutterBottom=g.kind==='partly-open-shutter'?1.15:g.height-.36;
  for(let y=shutterBottom;y<g.height-.16;y+=.055)o.box(L/2,y,.01,L-.16,.04,.12,0x8e9891);
  o.box(L/2,g.height+.1,0,L+.25,.12,.42,style.frame);
 }
 for(const p of data.pots){
  const o=writer(p.point,[1,0],[0,1]);
  o.box(0,p.height/2,0,.39,p.height,.39,0x876a52);o.box(0,p.height,0,.44,.055,.44,0xb29a7a);o.box(0,p.height+.035,0,.34,.015,.34,0x514e3d);
 }
 for(const d of data.drains){
  const n=[-d.u[1],d.u[0]],o=writer(d.point,d.u,n);
  o.box(0,.012,0,d.width,.025,d.depth,0x4a5551);
  for(let x=-d.width/2+.04;x<d.width/2;x+=.09)o.box(x,.031,0,.026,.012,d.depth-.03,0x858d82);
 }
 const group=batch.finish('BoundaryLayout10');
 group.add(createUtilityNetwork({poles:data.poles,poleLinks:data.poleLinks||[]},()=>.025));
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}
