// Exact approved Korean photographs: see work/building-remakes/storefront-identity.txt.
// Brand lettering is explicitly requested; mapped host dimensions remain authoritative.
// Local x runs from 0 to L, y is above building base, z points outward.
const PALE = 0xd4d2c9, DARK = 0x343936, SILVER = 0x9fa6a1;
// Shallow rounded-end sign relief, built as horizontal slices without new geometry dependencies.
function capsule(c,x,y,z,w,h,depth,color){
 const r=h/2,n=12;
 for(let i=0;i<n;i++){
  const yy=-r+(i+.5)*h/n,ww=w-h+2*Math.sqrt(Math.max(0,r*r-yy*yy));
  c.box(x,y+yy,z,Math.max(.01,ww),h/n+.001,depth,color);
 }
}
const sign=(c,key,x,y,w,h,z,opts)=>c.sign?.(key,x,y,w,h,z,opts);
const SUPPORTED = new Set(['facility:gs25','facility:seven','facility:emart24','facility:starbucks']);

function upperHost(c, shopTop) {
 const {L,H,fh,window:W,box:B,id}=c;
 const glassHost=id==='facility:emart24'||id==='facility:starbucks';
 for(let bottom=shopTop+.26; bottom+1.15<H-.28; bottom+=fh){
  const h=Math.min(glassHost?fh-.55:1.65,H-.32-bottom), n=Math.max(1,Math.floor((L-.6)/(glassHost?2.2:2.8))), step=(L-.6)/n;
  for(let i=0;i<n;i++){
   const x=.3+step*(i+.5),w=Math.min(step-.24,glassHost?2.8:2.05);
   if(w>.45) W(x,bottom+h/2,w,h,'white-slider',glassHost?DARK:PALE);
  }
  if(glassHost) B(L/2,bottom-.13,.07,L-.08,.12,.14,DARK);
 }
}
function glass(c,a,b,bottom,top,frame=DARK){
 if(b-a<.35||top-bottom<.5)return;
 c.window((a+b)/2,(bottom+top)/2,b-a,top-bottom,'white-slider',frame);
}
function entry(c,x,w,top,frame,canopy){
 const bottom=.10;
 glass(c,x-w/2,x+w/2,bottom,top,frame);
 c.entryOpening?.({x,y:(bottom+top)/2,w,h:top-bottom,panes:1,door:0,frameWidth:0});
 // Pull bars, threshold and head attach to the opening; no raised platform.
 for(const sign of [-1,1])c.box(x+sign*.10,1.12,.12,.025,.48,.035,SILVER);
 c.box(x,.055,.15,w+.10,.07,.30,0x8c8b83);
 if(canopy){
  c.box(x,top+.10,.245,w+.38,.09,.49,frame);
  c.box(x,top+.045,.42,w+.38,.04,.045,SILVER);
 }
}
function side(c,top){
 const {L,id,box:B}=c;
 const corner=id==='facility:gs25'||id==='facility:starbucks';
 const span=corner?Math.min(L-.3,Math.max(1.1,L*.62)):Math.min(L-.4,2.8);
 if(span>.5){
  glass(c,.18,.18+span,.3,top-.8,id==='facility:starbucks'?SILVER:DARK);
  B(.18+span/2,top-.38,.09,span+.18,.56,.18,id==='facility:gs25'?DARK:id==='facility:starbucks'?0x846347:0x626762);
  if(id==='facility:starbucks'){
   for(let x=.22;x<span+.15;x+=.15)B(x,top-.38,.205,.035,.56,.10,0xa78360);
   sign(c,'starbucks-emblem',.18+span*.72,Math.min(1.65,top-.95),Math.min(.9,span*.23),Math.min(.9,span*.23),.15);
  }
  if(id==='facility:gs25')sign(c,'gs25',.18+span/2,top-.38,Math.min(span*.55,1.7),.38,.19);
 }
 if(L>4.3){
  glass(c,L-.95,L-.3,.55,2.25,DARK);
  B(L-.63,1.05,.10,.03,.22,.04,SILVER);
 }
}
export function emitApprovedStorefrontFace(c){
 if(!SUPPORTED.has(c.id))return false;
 const {id,L,H,fh,front,box:B,surface:S}=c;
 if(L<1.15||H<1.7)return true;
 const top=Math.min(H-.12,Math.max(2.7,Math.min(fh,3.7))), fasciaH=id==='facility:starbucks'?.85:.62;
 upperHost(c,top);
 if(!front){side(c,top);return true;}
 const glassTop=top-fasciaH-.14;
 if(id==='facility:gs25'){
  // Broad dark fascia, cyan corner accents, offset entry and corner glazing.
  B(L/2,top-fasciaH/2,.14,L-.06,fasciaH,.28,DARK);
  sign(c,'gs25',L*.50,top-.31,L*.25,.43,.30);
  sign(c,'gs25',L*.19,top-.35,L*.21,.13,.325,{text:'Lifestyle Platform',color:'#ffffff'});
  for(const x of [L*.17,L*.83]){
   B(x,top-.22,.295,L*.23,.075,.045,0x62bfd5);
   B(x+(x<L/2?-1:1)*L*.115,top-.32,.295,.075,.27,.045,0x62bfd5);
  }
  const doorW=Math.min(1.45,L*.23),doorX=L*.53;
  glass(c,.18,doorX-doorW/2-.12,.22,glassTop,SILVER);
  entry(c,doorX,doorW,glassTop,SILVER,false);
  glass(c,doorX+doorW/2+.12,L-.18,.22,glassTop,SILVER);
  B(.10,glassTop/2,.08,.16,glassTop,.16,DARK);
  B(L-.10,glassTop/2,.08,.16,glassTop,.16,DARK);
  B(L/2,glassTop+.06,.16,L-.08,.10,.32,0x242b2b);
 }else if(id==='facility:seven'){
  B(L/2,top-.31,.13,L-.06,.62,.26,0x505754);
  sign(c,'seven',L/2,top-.30,L*.56,.48,.30);
  const stripeW=L*.15;
  for(const x of [stripeW/2+.10,L-stripeW/2-.10])for(const [k,col]of [[0,0xe87535],[1,0x147955],[2,0xd54131]])B(x,top-.12-k*.13,.29,stripeW,.095,.08,col);
  // Green awning and wood entry surround match the approved 2019 photograph.
  B(L/2,glassTop+.08,.245,L-.06,.06,.49,0x22694f);
  B(L/2,glassTop,.445,L-.06,.17,.045,0x16634e);
  sign(c,'seven',L*.77,glassTop,L*.30,.085,.473,{text:'SINCE 1927  세계 1등 편의점',color:'#ffffff'});
  const dw=Math.min(1.55,L*.30),dx=L*.5,pier=Math.min(.38,L*.055);
  S(dx,glassTop/2,dw+.52,glassTop,0xa38b68);
  for(let x=dx-dw/2-.22;x<dx+dw/2+.24;x+=.14){
   if(x<dx-dw/2-.04||x>dx+dw/2+.04) B(x,glassTop/2,.042,.025,glassTop,.028,0x877557);
   else B(x,glassTop-.10,.042,.025,.20,.028,0x877557);
  }
  entry(c,dx,dw,glassTop-.30,DARK,false);
  glass(c,.20,dx-dw/2-.42,.20,glassTop-.10,DARK);
  glass(c,dx+dw/2+.42,L-.20,.20,glassTop-.10,DARK);
  for(const x of [dx-dw/2-.34,dx+dw/2+.34]){
   B(x,glassTop/2,.09,pier,glassTop,.18,0x545b58);
   B(x,glassTop-.45,.22,.11,.15,.10,DARK);
  }
 }else if(id==='facility:emart24'){
  capsule(c,L/2,top-.31,.16,L-.06,.62,.32,0xffb52b);
  for(const x of [L*.16,L*.84])capsule(c,x,top-.30,.345,L*.25,.20,.05,0xf36c36);
  sign(c,'emart24',L*.50,top-.30,L*.36,.43,.36);
  sign(c,'emart24',L*.16,top-.30,L*.22,.10,.38,{text:'ALL DAY HIGHLIGHT',color:'#ffffff'});
  const dx=L*.62,dw=Math.min(1.65,L*.25);
  entry(c,dx,dw,Math.min(glassTop-.22,2.35),DARK,true);
  const doorTop=Math.min(glassTop-.22,2.35);
  if(glassTop-doorTop>.45)glass(c,dx-dw/2,dx+dw/2,doorTop+.17,glassTop,DARK);
  glass(c,.17,dx-dw/2-.17,.14,glassTop,DARK);
  glass(c,dx+dw/2+.17,L-.17,.14,glassTop,DARK);
  for(const x of [.08,dx-dw/2-.09,dx+dw/2+.09,L-.08])B(x,glassTop/2,.085,.10,glassTop,.17,DARK);
 }else{
  B(L/2,top-.43,.13,L-.04,.86,.26,0x795b42);
  // Individually spaced folded metal fins provide the characteristic rib depth.
  for(let x=.09;x<L-.05;x+=.15)B(x,top-.43,.235,.035,.82,.14,0xa48260);
  B(L/2,top-.88,.13,L-.04,.09,.30,DARK);
  sign(c,'starbucks',L*.57,top-.43,L*.57,.42,.32);
  const dx=L*.65,dw=Math.min(1.65,L*.25);
  glass(c,.15,dx-dw/2-.12,.10,glassTop,SILVER);
  entry(c,dx,dw,Math.min(2.4,glassTop),SILVER,true);
  if(glassTop>2.85)glass(c,dx-dw/2,dx+dw/2,2.58,glassTop,SILVER);
  glass(c,dx+dw/2+.12,L-.15,.10,glassTop,SILVER);
  B(.075,glassTop/2,.07,.10,glassTop,.14,SILVER);
  B(L-.075,glassTop/2,.07,.10,glassTop,.14,SILVER);
  sign(c,'starbucks-emblem',L*.18,Math.min(1.6,glassTop*.62),Math.min(.8,L*.09),Math.min(.8,L*.09),.12);
 }
 return true;
}
