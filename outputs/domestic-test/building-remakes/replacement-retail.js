// Latest source photographs and measured proportions: work/building-remakes/replacement-retail.txt.
export function emitReplacementRetailFace(c){
 const {id,L,H,front,ground=0,box,surface,window:win,sign}=c;
 if(!['facility:lotte','facility:post','facility:daiso'].includes(id))return false;
 if(L<2||H<2)return true;
 const label=(key,text,x,y,w,h,color,z=.16)=>sign(key,x,y,w,h,z,{text,color,preserveAspect:true,size:220});
 const panes=(a,b,lo,hi,n,frame,glass)=>{if(hi-lo<.4)return;const s=(b-a)/n;for(let i=0;i<n;i++)win(a+s*(i+.5),(lo+hi)/2,s-.065,hi-lo,'white-slider',frame,[glass,glass,glass]);};
 const slab=(a,b,y,d,color)=>box((a+b)/2,y,d/2,b-a,.16,d,color);
 if(id==='facility:lotte'){
  const stone=0xc8c2b5,metal=0x647b79;
  surface(L/2,H/2,L,H,stone);
  if(front){
   const a=L*.58,b=L*.85,lo=H*.105,hi=H*.88,n=7,s=(b-a)/n;
   // Fine mullions and rounded cap describe the shallow curved entrance tower.
   panes(a,b,lo,hi,n,metal,0x91b5b1);
   for(let y=lo+.7;y<hi;y+=Math.max(.7,H*.045))box((a+b)/2,y,.085,b-a,.045,.12,metal);
   for(let i=0;i<n;i++){
    const x=a+s*(i+.5),bow=.48*Math.sin(Math.PI*(i+.5)/n);
    box(x,H*.94,bow/2,s+.012,H*.12,bow+.08,0xaf9277);
    box(x,lo-.08,bow/2,s+.012,.16,bow+.12,metal);
   }
   label('replacement-lotte','LOTTE Mart',(a+b)/2,H*.94,(b-a)*.86,H*.055,'#ffffff',.55);
   panes(L*.13,L*.43,ground+.12,H*.24,5,metal,0x779c9c);
   panes(a,b,ground+.12,lo-.2,4,0x3d4948,0x516b6a);
   slab(a,b,lo-.08,.64,0x616b66);
   for(let y=H*.33;y<H*.91;y+=H*.09)for(let x=L*.08;x<L*.43;x+=L*.08)box(x,y,.022,L*.042,.025,.025,0xaba89f);
   box(L*.21,H+.72,.08,L*.19,1.44,.2,0xad917a);
   label('replacement-lotte-roof','LOTTE Mart',L*.21,H+.8,L*.16,.57,'#ffffff',.20);
  }else{
   // Parking slots are observed on the right side; other hidden sides remain inferred.
   for(let j=1;j<=5;j++)panes(L*.10,L*.9,H*(.20+j*.115),H*(.245+j*.115),4,0x7c827e,0x35413f);
  }
 }else if(id==='facility:post'){
  const wall=0x4d5055,roof=0x354150;
  surface(L/2,H/2,L,H,wall);
  for(let y=ground+.1;y<H;y+=.09)surface(L/2,y,L,.012,0x62646a,.025);
  // Two attached gables rise from the mapped wall; no footprint or storey edits.
  if(front){
   for(const [a,b,rise] of [[L*.02,L*.60,H*.32],[L*.60,L*.98,H*.22]]){
    const mid=(a+b)/2;
    c.face([[a,H,.06],[b,H,.06],[mid,H+rise,.06]],wall);
    if(c.roofDepth>0){const d=c.roofDepth;c.face([[a,H,.02],[mid,H+rise,.02],[mid,H+rise,-d],[a,H,-d]],roof);c.face([[mid,H+rise,.02],[b,H,.02],[b,H,-d],[mid,H+rise,-d]],roof);c.face([[a,H,-d],[mid,H+rise,-d],[b,H,-d]],wall);}
    c.out.rod([a,H+.04,.075],[mid,H+rise+.04,.075],.085,roof,4);
    c.out.rod([mid,H+rise+.04,.075],[b,H+.04,.075],.085,roof,4);
   }
   const a=L*.19,b=L*.56,top=H*.69;
   panes(a,b,ground+.08,top,3,0xb9bfc2,0x345668);
   // Shallow barrel canopy, with its back edge attached to the facade.
   for(let i=0;i<10;i++){
    const d=.70*(i+.5)/10,y=top+.10+.22*Math.sqrt(Math.max(0,1-(d/.74)**2));
    box((a+b)/2,y,d,b-a+.22,.065,.08,0x5c6570);
   }
   for(const x of [a-.10,(a+b)/2,b+.10])for(let i=0;i<10;i++){
    const d=.70*(i+.5)/10,y=top+.15+.22*Math.sqrt(Math.max(0,1-(d/.74)**2));
    box(x,y,d,.035,.035,.085,0x303b48);
   }
   box((a+b)/2,H*.855,.08,b-a+.22,H*.16,.16,0xf1f2e9);
   box(L*.485,H*.855,.175,L*.18,H*.16,.035,0xc71935);
   label('replacement-post-latin','KOREA POST',L*.29,H*.855,L*.17,H*.043,'#293a4b',.20);
   label('replacement-post-name','결성우체국',L*.485,H*.855,L*.165,H*.065,'#ffffff',.205);
   box((a+b)/2,H*.26,.085,b-a,.065,.05,0xdf641f);
   const mw=Math.min(.55,L*.07),mh=Math.min(1.15,H*.36);
   box(L*.12,ground+mh/2+.12,.23,mw,mh,.46,0xd91437);
   box(L*.12,ground+mh*.79+.12,.475,mw*.62,.055,.035,0x672738);
   label('replacement-post-box','우체통',L*.12,ground+mh*.94+.12,mw*.85,.12,'#ffffff',.48);
  }
 }else{
  const grey=0x626569;
  surface(L/2,H/2,L,H,grey);
  for(let y=.5;y<H;y+=.85)surface(L/2,y,L,.018,0x474c51,.026);
  for(let x=.9;x<L;x+=1.3)surface(x,H/2,.018,H,0x474c51,.027);
  if(front){
   panes(L*.08,L*.92,ground+.10,H*.225,7,0x373d42,0x819591);
   panes(L*.22,L*.94,H*.36,H*.77,6,0x353f48,0x789ac3);
   for(const y of [.48,.60,.70])box(L*.58,H*y,.075,L*.72,.035,.10,0x34414f);
   panes(L*.24,L*.80,H*.855,H*.95,6,0x303a45,0xb5c0c0);
   slab(L*.19,L*.95,H*.80,.48,grey);
   slab(L*.19,L*.85,H*.98,.54,grey);
   box(L*.52,H*.292,.10,L*.89,H*.13,.20,grey);
   box(L*.285,H*.292,.225,L*.09,H*.085,.06,0xb91232);
   label('replacement-daiso-small','daiso',L*.285,H*.277,L*.082,H*.021,'#ffffff',.265);
   label('replacement-daiso','다이소',L*.53,H*.292,L*.36,H*.069,'#d1233a',.24);
   slab(L*.30,L*.60,H*.226,.90,0xa21b36);
   box(L*.45,H*.216,.87,L*.30,.13,.08,0x8f1f34);
   // Top terrace rail joins its lower band and posts.
   for(const y of [.815,.835,.855])box(L*.55,H*y,.18,L*.74,.035,.035,0x323e49);
   for(let i=0;i<8;i++)box(L*.18+L*.74*i/7,H*.835,.18,.035,H*.06,.035,0x323e49);
  }
 }
 return true;
}
