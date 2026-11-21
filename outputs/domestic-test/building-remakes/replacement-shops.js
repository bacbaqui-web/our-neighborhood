// Latest replacement photographs only; see work/building-remakes/replacement-shops.txt.
// Local x: 0..L, y: height above base, z: outward. Dimensions adapt to host frontage.
const GREEN=0x17583a,LIME=0x9fce1c,YELLOW=0xf4c637,FRAME=0xb6a35b,DARK=0x303b36;
const label=(c,key,x,y,w,h,z,text,color)=>c.sign?.(key,x,y,w,h,z,{text,color,preserveAspect:true,size:220});
function pane(c,a,b,lo,hi,frame=DARK){if(b-a>.30&&hi-lo>.35)c.window((a+b)/2,(lo+hi)/2,b-a,hi-lo,'white-slider',frame);}
function door(c,x,w,top,frame,z=.14){
 pane(c,x-w/2,x+w/2,.08,top,frame);
 c.entryOpening?.({x,y:(top+.08)/2,w,h:top-.08,panes:1,door:0,frameWidth:.05});
 c.box(x,.045,z,w+.08,.06,.25,0xadae9c);
 for(const side of [-1,1])c.box(x+side*.12,1.1,z+.05,.025,.43,.035,0xd4d5c8);
}
function pill(c,x,y,z,w,h,col){
 const n=16,r=h/2;
 for(let i=0;i<n;i++){const yy=-r+(i+.5)*h/n,ww=Math.max(.02,w-h+2*Math.sqrt(Math.max(0,r*r-yy*yy)));c.box(x,y+yy,z,ww,h/n+.001,.06,col);}
}
function upper(c,top){
 if(c.faceOnly)return;
 const fh=c.fh||3.5;
 for(let lo=top+.32;lo+1<c.H-.25;lo+=fh){
  const hi=Math.min(c.H-.35,lo+1.55),count=Math.max(1,Math.floor(c.L/2.7)),step=(c.L-.4)/count;
  for(let i=0;i<count;i++)pane(c,.2+i*step+.12,.2+(i+1)*step-.12,lo,hi,0xc7c8b9);
 }
}
// Rounded returns are shallow sampled solids, not a rectangular yellow sign.
// The central door remains flush, with curved glass on both sides.
function roundedDepth(x,L,depth){
 const r=Math.min(L*.20,1.3,depth-.02),a=Math.min(x,L-x);
 return a>=r?depth:depth-r+Math.sqrt(Math.max(0,r*r-(r-a)*(r-a)));
}
function curvedBand(c,y,h,depth,col){
 const n=64,step=(c.L-.12)/n;
 for(let i=0;i<n;i++){const x=.06+(i+.5)*step,z=roundedDepth(x,c.L,depth);c.box(x,y,(z+.02)/2,step+.001,h,Math.max(.025,z-.02),col);}
}
export function emitReplacementShopsFace(c){
 if(!['facility:cu','facility:mega'].includes(c.id))return false;
 const {L,H,box:B}=c;
 if(!Number.isFinite(L)||!Number.isFinite(H)||L<1.15||H<1.7)return true;
 const top=Math.min(H-.12,c.faceOnly?H-.12:Math.max(2.7,Math.min(c.fh||3.7,4.4)));
 upper(c,top);
 if(!c.front){
  // The reference does not establish rear elevations; use restrained host openings.
  pane(c,.2,Math.min(L-.2,2.5),.3,Math.max(.9,top-.9),c.id==='facility:cu'?GREEN:FRAME);
  return true;
 }
 if(c.id==='facility:cu'){
  const fascia=.69,glassTop=top-fascia-.36;
  B(L/2,top-fascia/2,.13,L-.03,fascia,.26,0xe2e4d8);
  pill(c,L*.105,top-.34,.29,L*.15,.29,LIME);
  label(c,'cu-nice',L*.105,top-.34,L*.13,.19,.335,'Nice to','#17583a');
  label(c,'cu-logo',L*.245,top-.33,L*.13,.57,.30,'CU','#17583a');
  pill(c,L*.59,top-.32,.29,L*.54,.31,LIME);
  // Small outlined pictograms in the source are not legible enough to invent.
  B(L/2,glassTop+.13,.38,L-.05,.12,.76,GREEN);
  B(L/2,glassTop+.04,.72,L-.05,.18,.055,0x174c38);
  const dw=Math.min(1.6,L*.20),dx=L*.44;
  pane(c,.17,dx-dw/2-.10,.24,glassTop,GREEN);
  door(c,dx,dw,glassTop,GREEN);
  pane(c,dx+dw/2+.10,L-.17,.24,glassTop,GREEN);
  B(L/2,.12,.06,L-.04,.22,.12,0xc2beaa);
  for(const x of [.085,L-.085])B(x,glassTop/2,.07,.13,glassTop,.14,GREEN);
 }else{
  const fascia=Math.min(.91,top*.23),glassTop=top-fascia-.30;
  // Radius is fitted to width; enough forward depth keeps every return solid positive.
  const radius=Math.min(L*.20,1.3),depth=c.faceOnly?.16:radius+.12;
  curvedBand(c,top-fascia/2,fascia,depth,YELLOW);
  curvedBand(c,glassTop+.13,.13,depth+.17,0xffd548);
  curvedBand(c,glassTop+.045,.055,depth+.18,0xdca722);
  label(c,'mega-word',L*.31,top-fascia*.49,L*.24,fascia*.46,depth+.025,'MEGA','#fffced');
  label(c,'mega-mgc',L*.49,top-fascia*.49,L*.09,fascia*.68,depth+.035,'MGC','#fff000');
  label(c,'mega-coffee',L*.70,top-fascia*.49,L*.31,fascia*.46,depth+.025,'COFFEE','#fffced');
  const dx=L*.51,dw=Math.min(1.65,L*.23),lo=.10;
  // Cut the shell behind the projected glazing and keep actual door opening centered.
  pane(c,.13,dx-dw/2-.07,lo,glassTop,FRAME);
  door(c,dx,dw,glassTop,FRAME,depth);
  for(const side of [-1,1])B(dx+side*dw/4,(lo+glassTop)/2,depth-.025,dw/2-.055,glassTop-lo,.025,0x718b80);
  pane(c,dx+dw/2+.07,L-.13,lo,glassTop,FRAME);
  const n=48,step=(L-.26)/n;
  for(let i=0;i<n;i++){
   const x=.13+(i+.5)*step;if(Math.abs(x-dx)<dw/2+.06)continue;
   const z=roundedDepth(x,L,depth)-.025;
   B(x,(lo+glassTop)/2,z,step+.001,glassTop-lo,.026,0x647d77);
   B(x,lo,z+.02,step+.001,.065,.05,FRAME);
   B(x,glassTop,z+.02,step+.001,.06,.05,FRAME);
  }
  // Door and mullions lie on the same projected front plane as the glass.
  for(const x of [dx-dw/2,dx,dx+dw/2])B(x,glassTop/2,depth-.01,.045,glassTop,.055,FRAME);
  B(dx,glassTop,depth-.01,dw,.055,.055,FRAME);
  for(const x of [L*.17,L*.32,L*.70,L*.85]){
   if(Math.abs(x-dx)<dw/2+.08)continue;
   B(x,(lo+glassTop)/2,roundedDepth(x,L,depth),.035,glassTop-lo,.045,DARK);
  }
 }
 return true;
}
