// Approved Korean store photographs are recorded in retail-production.txt.
// Coordinates follow the existing footprint; no lettering or photograph textures.
export function emitApprovedRetailFace(ctx) {
  const {id,L,H,front,box,window:win,surface}=ctx;
  if (!['facility:emart','facility:homeplus','facility:costco','facility:traders'].includes(id)) return false;
  if (L < 2 || H < 2) return true;
  const band=(y,h,c,z=.07,d=.12)=>box(L/2,y,z,L,h,d,c);
  const pier=(x,y,w,h,c,z=.12,d=.24)=>box(x,y,z,w,h,d,c);
  const panes=(a,b,bottom,top,spacing,frame=0xc6cdcb)=>{
    if(top-bottom<.4 || b-a<.5)return;
    const n=Math.max(1,Math.ceil((b-a)/spacing)),step=(b-a)/n;
    for(let i=0;i<n;i++)win(a+step*(i+.5),(bottom+top)/2,step-.11,top-bottom,'white-slider',frame);
  };
  const canopy=(a,b,y,c)=>{
    box((a+b)/2,y,.23,b-a,.18,.46,c);
    box((a+b)/2,y-.11,.39,b-a,.06,.10,0x626760);
    // Short wall-connected cantilever brackets, never free-floating supports.
    for(let x=a+.22;x<b-.1;x+=Math.max(1.6,(b-a)/5))box(x,y-.24,.18,.075,.28,.36,0x777d77);
  };
  const service=()=>{
    const dh=Math.min(3.3,H*.38),dw=Math.min(3.1,L*.24),x=L*.54;
    surface(x,dh/2+.08,dw,dh,0x697170,.022);
    for(let y=.22;y<dh;y+=.24)box(x,y,.065,dw,.027,.045,0x9ca39f);
    pier(x-dw/2-.08,dh/2,.15,dh+.15,0xc6c8bf);
    pier(x+dw/2+.08,dh/2,.15,dh+.15,0xc6c8bf);
    box(x,dh+.08,.13,dw+.32,.16,.26,0xbfc2bb);
    if(L>8) {
      win(L*.18,1.12,Math.min(1.1,L*.1),2.1,'white-slider',0x777e78);
      const vx=L*.82,vy=H*.58,vw=Math.min(1.8,L*.14),vh=Math.min(.9,H*.12);
      surface(vx,vy,vw,vh,0x414b48,.025);
      for(let y=vy-vh/2+.08;y<vy+vh/2;y+=.13)box(vx,y,.09,vw,.055,.12,0x969e98);
    }
  };
  if(id==='facility:emart') {
    // Shallow faceted central bow respects the mapped building silhouette.
    const a=L*.15,b=L*.85,base=Math.min(3.05,H*.26),glassTop=H*.57;
    surface(L/2,H*.7,L,H*.6,0x9f8874);
    for(let x=.15;x<L;x+=.26)box(x,H*.72,.045,.035,H*.52,.035,0xc0a58b);
    for(const y of [.62,.73,.84,.95])band(H*y,.10,0xe0d5c2);
    if(front) {
      panes(a,b,.12,base-.22,2.05,0xcbd1c7);
      panes(a,b,base+.5,glassTop,2.45,0xb3c1bf);
      canopy(a-.12,b+.12,base+.18,0xd5dad1);
      const pw=Math.min(.6,L*.045);
      for(const x of [a-pw/2,b+pw/2])pier(x,base/2,pw,base,0xc3beb0,.20,.40);
      for(const x of [L*.075,L*.925])pier(x,H/2,Math.min(L*.075,1.5),H,0xa48b75,.13,.26);
      for(const y of [.24,.57,.96])band(H*y,.16,0xd6c9b6,.17,.3);
      // Roof colonnade suggested within original height, no raised extra storey.
      for(let x=a;x<=b+.01;x+=(b-a)/5)pier(x,H*.969,.15,H*.06,0xc6c7bb,.17,.3);
    } else service();
  } else if(id==='facility:homeplus') {
    surface(L/2,H/2,L,H,0xc5c6bd);
    for(let y=.7;y<H;y+=.82)band(y,.025,0x9b9e96,.028,.025);
    for(let x=1.5;x<L;x+=2.2)pier(x,H/2,.025,H,0xa6aaa0,.03,.03);
    if(front) {
      const a=L*.24,b=L*.91,doorTop=Math.min(2.55,H*.23),top=H*.76;
      panes(a,b,.1,doorTop,2.0,0x889e97);
      panes(a,b,doorTop+.4,top,1.7,0xb8c1b8);
      canopy(a-.1,b+.1,doorTop+.2,0x9e2336);
      for(const x of [a-.13,b+.13])pier(x,(top+.1)/2,.22,top+.1,0xd5d4c8,.16,.32);
      box((a+b)/2,top+.16,.15,b-a+.48,.24,.3,0xd6d6cb);
      // Narrow red entrance surround is structural, not a text-bearing logo panel.
      pier(L*.86,doorTop/2,.12,doorTop,0xa6293b,.21,.40);
    } else service();
    band(H-.12,.15,0x787e75,.10,.2);
  } else if(id==='facility:costco') {
    surface(L/2,H/2,L,H,0xe0e0d5);
    band(H*.85,.22,0xc64c55,.035,.045);
    band(.4,.55,0xb5b8af,.055,.09);
    for(let x=2.6;x<L;x+=3.2)pier(x,H/2,.026,H,0xbfc3ba,.03,.03);
    if(front) {
      const top=H*.78,lower=Math.min(2.8,H*.24),w=Math.min(3,L*.13);
      for(const x of [L*.2,L*.78]) {
        panes(x-w/2,x+w/2,lower+.25,top,1.15,0xadb9b5);
        for(const px of [x-w/2-.07,x+w/2+.07])pier(px,(top+lower+.25)/2,.12,top-lower-.05,0xc1c6bd,.10,.2);
      }
      panes(L*.35,L*.65,.12,lower,1.7,0x8b9995);
      canopy(L*.33,L*.67,lower+.15,0xbcc2bb);
      for(const x of [L*.33,L*.67])pier(x,lower/2,.22,lower,0xd0d2c9,.18,.36);
    } else service();
    band(H-.1,.12,0xc6c9bf,.08,.16);
  } else {
    surface(L/2,H/2,L,H,0xb6c1bd);
    band(H*.93,H*.10,0x9dce37,.09,.18);
    for(const y of [.32,.55,.77])band(H*y,.045,0x858f8c,.03,.035);
    if(front) {
      const a=L*.1,b=L*.39,bottom=Math.min(2.8,H*.22),top=H*.85;
      surface(L*.46,H/2,L*.12,H,0x8ac440,.025);
      panes(a,b,bottom+.24,top,1.8,0x829e91);
      panes(a,b,.12,bottom-.1,1.7,0x88a092);
      canopy(a-.1,b+.15,bottom+.04,0x99c93b);
      for(const x of [a-.08,b+.08])pier(x,(top+bottom)/2,.12,top-bottom,0x7c998c,.14,.28);
      // Tower's horizontal transoms connect across its complete glazing width.
      for(let y=bottom+1.7;y<top;y+=1.65)box((a+b)/2,y,.14,b-a,.07,.14,0x9aafa1);
      const ga=L*.58,gb=L*.85;
      panes(ga,gb,H*.26,H*.66,2.1,0x6f8580);
      for(let y=H*.28;y<H*.66;y+=.65)box((ga+gb)/2,y,.12,gb-ga,.055,.1,0x93a29a);
      canopy(ga,gb,H*.22,0x587a9b);
      panes(ga,gb,.1,H*.19,2.2,0x869a90);
    } else service();
  }
  return true;
}
