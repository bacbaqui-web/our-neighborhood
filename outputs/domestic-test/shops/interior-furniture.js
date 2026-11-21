// Coordinates x/z/w/d are room fractions, heights are metres. Furniture remains
// simple separate cuboids, but chair silhouettes and trade layouts vary.
export const chairStyles=['wood','stool','office','salon','bench','upholstered'];
export function addInteriorFurniture(box,spec,W,depth){
 const paint={wood:0xb99163,stool:0xb5433a,office:0x547377,salon:0x352f35,bench:0xb28058,upholstered:0x7f8d69};
 const chair=(x,z,style)=>{
  if(depth<1.1)return;
  z=Math.max((-depth+.28)/depth,Math.min(-.28/depth,z));
  x=Math.max(-.5+.6/W,Math.min(.5-.6/W,x));
  const b=(name,dx,y,dz,w,h,d,tile=3)=>box('chair-'+style+'-'+name,x+dx/W,y,z+dz/depth,w/W,h,d/depth,tile,paint[style]);
  const seat=style==='stool'?.34:style==='bench'?1.1:.46,seatY=style==='salon'?.55:.45;
  b('seat',0,seatY,0,seat,.09,.43,style==='wood'||style==='bench'?3:5);
  if(style==='salon'||style==='office'){
   b('foot',0,.035,0,.48,.07,.48,5);b('post',0,(seatY-.05)/2+.05,0,.10,seatY-.05,.10,5);
   b('back',0,seatY+.28,-.19,.43,.50,.08,5);
   if(style==='salon')for(const side of [-1,1]){b('arm-post',side*.25,seatY+.08,0,.045,.22,.26,5);b('arm',side*.25,seatY+.20,0,.07,.06,.35,5);}
  }else{
   for(const dx of [-seat*.36,seat*.36])for(const dz of [-.15,.15])b('leg',dx,(seatY-.045)/2,dz,.045,seatY-.045,.045);
   if(style!=='stool'){for(const dx of [-seat*.4,seat*.4])b('back-post',dx,seatY+.20,-.19,.045,.47,.045);b('back',0,seatY+.37,-.19,seat,.16,.055,style==='upholstered'?5:3);}
  }
 };
 const chosen=spec.chairStyle??({salon:'salon',estate:'office',food:'stool',cafe:['wood','upholstered','bench'][Number(spec.id.slice(-2))%3]}[spec.category]);
 const counter=(tile=3)=>box('counter',-.23,.52,-.76,.40,1.04,.18,tile);
 if(spec.category==='alley'){
  for(const p of spec.interiorProps||[]){
   const x=p.x??0,z=p.z??-.8,w=p.w??.3,h=p.h??1.2,d=p.d??.16,tile=(['shelf','display','cabinet','fridge'].includes(p.kind)&&spec.tradeSurface!==undefined)?12+spec.tradeSurface:3;
   if(p.kind==='workbench'){box('workbench-top',x,.78,z,w,.08,d,tile);for(const dx of [-w*.4,w*.4])box('workbench-leg',x+dx,.37,z,.02,.74,d*.7,3);}
   else if(p.kind==='display'){box('display-base',x,.25,z,w,.5,d,3);box('display-stock',x,.5+h*.25,z,w*.94,h*.5,d*.92,tile);}
   else box(p.kind||'cabinet',x,h/2,z,w,h,d,tile);
  }
  if(chosen)for(const [x,z]of spec.chairPositions||[[.25,-.35]])chair(x,z,chosen);
 }else if(spec.category==='convenience'){
  box('refrigerator',.28,1.03,-.88,.34,2.06,.16,1);box('back-stock-shelf',-.25,1.02,-.88,.42,2.04,.16,0);box('aisle-stock-shelf',-.20,.7,-.42,.35,1.4,.18,0);box('checkout',.3,.52,-.27,.23,1.04,.18,2);
 }else if(spec.category==='salon'){
  for(const x of [-.25,.25]){box('wall-mirror',x,1.45,-.95,.25,1.1,.025,4);box('vanity',x,.52,-.83,.28,1.04,.14,3);chair(x,-.51,chosen);}
  box('salon-waiting-bench',-.2,.25,-.20,.22,.5,.13,5,0x826a58);
 }else if(spec.category==='laundry'){
  box('garment-rack',-.18,1.1,-.87,.57,2.2,.2,6);box('folded-linen-cabinet',.3,.95,-.87,.25,1.9,.2,7);box('service-counter',-.12,.5,-.35,.52,1,.2,7);
 }else if(spec.category==='estate'){
  box('property-board',0,1.6,-.97,.76,.85,.025,9);
  for(const x of [-.24,.24]){box('desk',x,.39,-.66,.32,.78,.20,8);chair(x,-.34,chosen);}
 }else{
  counter(spec.category==='cafe'?11:10);box('back-cabinet',.25,.65,-.86,.32,1.3,.18,spec.category==='cafe'?3:10);
  for(const x of [-.26,.26]){box('table-base',x,.35,-.52,.04,.7,.06,3);box('table-top',x,.74,-.52,.22,.08,.18,3);chair(x,-.28,chosen);}
 }
}
