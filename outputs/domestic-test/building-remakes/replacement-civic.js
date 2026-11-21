// Replacement references dated 2026-11-21. Dimensions adapt to the retained map footprint.
export function emitReplacementCivicFace(c){
 const {id,L,H,levels,fh,front,ground}=c;
 if(!['building:shop-glass','building:school','facility:school','building:civic','building:fire','facility:fire'].includes(id))return false;
 if(![L,H,fh,ground].every(Number.isFinite)||L<=0||H<=0||fh<=0)throw Error('새 건물의 크기를 확인해 주세요.');
 if(L<.65||H-ground<.4)return true;
 const X=x=>front&&id.startsWith('building:')?L-x:x;
 const B=(x,y,z,w,h,d,col)=>{const a=Math.max(.015,x-w/2),b=Math.min(L-.015,x+w/2);if(b-a>.02&&h>.005&&d>.005)c.box(X((a+b)/2),y,z,b-a,h,d,col);};
 const W=(x,y,w,h,kind='wide-slider',frame=0x536b69,glass)=>{if(w>.3&&h>.35)c.window(X(x),y,w,h,kind,frame,glass);};
 const S=(x,y,w,h,col,z=.018)=>{if(w>.02&&h>.02)c.surface(X(x),y,w,h,col,z);};
 const sign=(key,x,y,w,h,z=.3,options={})=>{w=Math.min(w,L-.12);if(w>.15&&h>.08)c.sign(key,X(Math.max(w/2+.03,Math.min(L-w/2-.03,x))),y,w,h,z,options);};
 const grid=(a,b,r,wanted,h,frame,kind='wide-slider')=>{const span=b-a;if(span<.6)return;const n=Math.max(1,Math.round(span/wanted)),step=span/n;for(let j=0;j<n;j++)W(a+step*(j+.5),r*fh+fh*.57,step*.82,h,kind,frame);};
 if(id==='building:shop-glass'){
  S(L/2,H/2,L,H,0x333e50);
  const n=Math.max(1,Math.round((L-.35)/.8)),step=(L-.35)/n;
  for(let r=0;r<levels;r++)for(let j=0;j<n;j++){
   const x=.175+step*(j+.5),h=Math.min(fh*.86,fh-.18);
   W(x,r*fh+fh*.48,step-.09,h,'stair',0x343e4b,[0x354871,0x5f7297,0x253c61]);
   if(r>0&&(j+2*r)%5===0)B(x,r*fh+fh*.42,.10,step*.75,.045,.07,0x1c2b39);
  }
  for(let j=0;j<=n;j++)B(.175+step*j,H/2,.12,.07,H,.24,0x353e49);
  for(let r=1;r<levels;r++)B(L/2,r*fh,.14,L,.10,.28,0x343d46);
  B(L/2,H-.28,.08,L,.53,.16,0x414a5b);
  if(front){sign('glass-name',L*.88,H-.27,Math.min(2.4,L*.27),.44,.18,{text:'동 해',color:'#e8e9e6',preserveAspect:true});if(levels>2)sign('glass-printer',L*.85,H-fh*1.6,Math.min(3,L*.32),.35,.23,{text:'동아프린터',color:'#e9eae5',preserveAspect:true});}
  return true;
 }
 if(id.endsWith(':school')){
  const cream=0xe7e4d4,frame=0x467d77,colors=[0xd95f7b,0xe8ae91,0xe8dfa7];
  const wing=Math.min(3.8,L*.12),a=wing+.3,b=L-wing-.3;
  for(let r=0;r<levels;r++){
   if(front&&L>6){grid(.2,wing-.15,r,3,fh*.56,frame);grid(L-wing+.15,L-.2,r,3,fh*.56,frame);grid(a,b,r,3.2,fh*.52,frame);}
   else grid(.2,L-.2,r,3.2,fh*.53,frame);
   if(r>0){const y=r*fh-.19;B(L/2,y,.10,L-.08,.50,.20,front?colors[(r-1)%3]:cream);}
   if(r>0&&front&&L>6){
    const n=Math.max(1,Math.round((b-a)/3.2)),step=(b-a)/n;
    for(let j=0;j<n;j++){const x=a+step*(j+.5),w=step*.84;for(const dy of [-.16,0,.16])B(x,r*fh+fh*.34+dy,.23,w,.025,.03,0x9da9a0);for(const dx of [-w/2,w/2])B(x+dx,r*fh+fh*.34,.23,.025,.42,.03,0xa8b1aa);}
   }
  }
  B(L/2,H-.18,.14,L,.36,.28,cream);
  for(const x of [wing,L-wing])B(x,H/2,.14,.20,H,.28,cream);
  if(front){
   const ew=Math.min(4.2,L*.22);B(L/2,Math.min(fh-.13,3.1),.65,ew+1,.16,1.3,0xd9d8c8);
   // The original photograph's broad pink entrance banner is part of the identity.
   sign('school-banner',L/2,fh-.17,Math.min(10,L*.44),.46,.25,{text:'푸른 꿈이 자라는 사랑의 배움터',color:'#39785b',preserveAspect:true,size:160});
   if(levels>2)sign('school-clock',L/2,H-fh-.05,.65,.65,.25,{text:'◷',color:'#4b6464',preserveAspect:true});
  }
  return true;
 }
 if(id==='building:civic'){
  const stone=0xbeb8a6,frame=0x3d655e,tower=L*.22;
  for(let r=0;r<levels;r++){
   grid(.15,tower-.1,r,2.8,fh*.61,frame);grid(tower+.23,L-.2,r,2.5,fh*.69,frame);
   B(L/2,r*fh+.12,.07,L,.23,.14,stone);
   // Tower's layered stone belt and narrow vertical ribs model the visible corner bay.
   B(tower/2,r*fh+.25,.20,tower,.40,.4,stone);
  }
  for(let x=.15;x<L;x+=1.15)B(x,H/2,.022,.015,H,.026,0x99998d);
  for(let y=.55;y<H;y+=.58)B(L/2,y,.024,L,.018,.028,0xa6a394);
  for(const x of [.08,tower*.49,tower,tower+(L-tower)*.50,L-.08])B(x,H/2,.14,.20,H,.28,stone);
  if(front){
   sign('civic-name',L*.66,H-.35,L*.61,.42,.23,{text:'가산동주민센터',color:'#49688b',preserveAspect:true});
   sign('civic-address',tower*.5,fh-.35,tower*.8,.25,.42,{text:'가산로 129',color:'#494b43',preserveAspect:true});
   B(L*.64,fh-.13,.55,L*.56,.18,1.1,0xb8b5a5);
   sign('civic-door',L*.66,fh-.45,L*.43,.35,.59,{text:'가산동주민센터',color:'#486e6b',preserveAspect:true});
  }
  return true;
 }
 // Sandong: two-storey office at the left, four broad translucent apparatus doors.
 const office=L*.36,gray=0x5b6161,white=0xe1e2dc,red=0xef302c;
 if(!front){for(let r=0;r<levels;r++)grid(.2,L-.2,r,3.6,Math.min(fh*.44,1.4),0x71807c);return true;}
 S(office/2,H*.30,office,H*.60,0x909794);
 const officeLevels=Math.max(1,levels),ofh=H/officeLevels;
 for(let r=0;r<officeLevels;r++){
  const n=Math.max(1,Math.round(office/2.4)),step=(office-.3)/n;
  for(let j=0;j<n;j++)W(.15+step*(j+.5),r*ofh+ofh*.48,Math.min(.85,step*.6),Math.min(1.8,ofh*.60),'stair',0x596e68);
 }
 const bayA=office+.12,bayB=L-.15,span=bayB-bayA,nb=Math.max(1,Math.round(span/3.8)),step=span/nb,doorTop=H*.72,doorBottom=ground+.10,dh=doorTop-doorBottom;
 for(let j=0;j<nb;j++){
  const x=bayA+step*(j+.5),w=step-.18;
  W(x,(doorTop+doorBottom)/2,w,dh,'stair',0x51665e,[0x577f77,0x7f9e90,0x47675e]);
  for(let y=doorBottom+.40;y<doorTop;y+=.58)B(x,y,.075,w,.045,.06,0xa4b6a9);
  for(let k=0;k<3;k++)B(x+(k-1)*w*.27,doorBottom+dh*.24,.112,w*.14,.16,.032,0x354d47);
  B(bayA+step*j,doorTop/2,.13,.18,doorTop,.26,white);
 }
 B((office+L)/2,doorTop+.15,.28,L-office,.25,.56,red);
 B(office/2,H*.59,.25,office,.95,.50,gray);
 for(let y=H*.59-.4;y<H*.59+.45;y+=.11)B(office/2,y,.51,office,.025,.025,0x747b77);
 // Large requested title on the clean white parapet, using official art supplied by identity.js.
 const sh=Math.min(1.6,H*.21),sy=doorTop+(H-doorTop)*.58;
 sign('fire-emblem',office+(L-office)*.13,sy,sh*2.27,sh,.10);
 sign('fire-name',office+(L-office)*.58,sy,Math.min(5.0,(L-office)*.62),sh,.11,{text:'소방서',color:'#303c49',preserveAspect:true,size:220});
 B(office*.53,H*.45,.65,Math.min(3.3,office*.74),.13,1.3,0xbec7bf);
 sign('fire-office',office*.53,H*.50,Math.min(2.9,office*.8),.27,.54,{text:'119 안전센터',color:'#bd2427',preserveAspect:true});
 return true;
}
