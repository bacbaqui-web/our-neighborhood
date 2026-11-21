// Source observations and permitted simplifications: work/building-remakes/retail-identity.txt.
export function emitApprovedRetailFace(c) {
  const {id,L,H,front,box,window:win,surface}=c;
  if (!['facility:emart','facility:homeplus','facility:costco','facility:traders'].includes(id)) return false;
  if(L<2||H<2)return true;
  const band=(y,h,color,z=.06,d=.12)=>box(L/2,y,z,L,h,d,color);
  const pane=(a,b,lo,hi,spacing=2,frame=0xb9c6c5)=>{
    if(hi-lo<.4||b-a<.5)return;
    const n=Math.max(1,Math.ceil((b-a)/spacing)),s=(b-a)/n;
    for(let i=0;i<n;i++)win(a+s*(i+.5),(lo+hi)/2,s-.10,hi-lo,'white-slider',frame);
  };
  const canopy=(a,b,y,color,depth=.75)=>{
    box((a+b)/2,y,depth/2,b-a,.20,depth,color);
    box((a+b)/2,y-.14,depth-.035,b-a,.10,.07,color);
  };
  const service=()=>{
    const h=Math.min(3,H*.27),w=Math.min(3,L*.2);
    surface(L*.54,h/2+.07,w,h,0x687379,.028);
    for(let y=.2;y<h;y+=.3)box(L*.54,y,.065,w,.025,.05,0xa2a8a9);
    box(L*.54,h+.1,.15,w+.22,.17,.3,0xc0c4c1);
  };
  if(id==='facility:emart') {
    // The approved Yeonsu facade is THE TOWN MALL, not a yellow emart sign.
    surface(L/2,H/2,L,H,0x9b7763);
    if(front){
      const a=L*.14,b=L*.86,entry=H*.245;
      // Shallow convex bow: solid segments connect to the mapped wall instead of
      // moving its footprint. Ribs, belt courses and roof arcade share the bow.
      const bow=x=>.45*Math.sqrt(Math.max(0,1-((x-L/2)/((b-a)/2))**2));
      const segments=18,step=(b-a)/segments;
      for(let i=0;i<segments;i++){
        const x=a+step*(i+.5),z=bow(x);
        box(x,H*.72,z/2,step+.008,H*.33,z+.04,0x9b7763);
        for(const y of [.565,.66,.755,.85])box(x,H*y,z+.055,step+.008,.10,.13,0xddd7cb);
        box(x,H*.99,z+.07,step+.008,H*.025,.34,0xb7bfbe);
      }
      for(let x=a+.04;x<b;x+=.21)box(x,H*.72,bow(x)+.045,.045,H*.33,.07,0xc0a38c);
      pane(a,b,entry+.06,H*.55,Math.max(1.1,L*.15),0xbfc9cd);
      // Continuous blue-glass storey with fine horizontal transoms.
      for(const y of [.34,.445])box(L/2,H*y,.075,b-a,.055,.12,0xc0c9ce);
      pane(L*.25,L*.76,.08,entry-.14,Math.max(1,L*.075),0x556565);
      canopy(a,b,entry,0xd6dcda,1.05);
      for(const x of [L*.22,L*.78])box(x,entry/2,.32,L*.025,entry,.64,0xe0dfd2);
      for(const x of [L*.07,L*.93]){
        box(x,H*.47,.10,L*.09,H*.94,.2,0x997662);
        for(const y of [.245,.565,.755,.91])box(x,H*y,.18,L*.095,.12,.24,0xd9cebc);
      }
      // Open roof arcade is attached to the parapet and kept inside the source height.
      for(let i=0;i<6;i++){
        const x=a+(b-a)*i/5;
        box(x,H*.925,bow(x)+.07,.22,H*.13,.34,0xc5c9c5);
      }
      c.sign('emart',L/2,H*.695,L*.52,H*.115,.56);
      c.sign('townmall-symbol',L/2,H*.845,H*.15,H*.15,.58);
    }else{for(const y of [.245,.565,.755,.91])band(H*y,.10,0xd9cebc);service();}
  }else if(id==='facility:homeplus'){
    surface(L/2,H/2,L,H,0xc4c0b9);
    for(let y=.6;y<H;y+=.78)band(y,.024,0x827f7c,.03,.025);
    for(let x=1.5;x<L;x+=2.9)box(x,H/2,.033,.025,H,.025,0x97938d);
    if(front){
      const a=L*.25,b=L*.91,entry=H*.24,top=H*.73;
      pane(a,b,.10,entry-.25,Math.max(1,L*.075),0x637675);
      pane(a,b,entry+.04,top,Math.max(1.3,L*.072),0xd5d8d4);
      for(let x=a;x<=b+.01;x+=(b-a)/5)box(x,(top+entry)/2,.17,.14,top-entry,.34,0xe0ded5);
      for(const y of [.40,.56])box((a+b)/2,H*y,.10,b-a,.065,.15,0x637c7b);
      for(const x of [a-.12,b+.12])box(x,(top+.1)/2,.16,.23,top+.1,.32,0xe0ddd3);
      box((a+b)/2,top+.12,.16,b-a+.48,.23,.32,0xe0ddd3);
      canopy(a-.12,b+.12,entry,0xd41e3a,.95);
      c.sign('homeplus',L*.46,H*.865,L*.45,H*.12,.10);
    }else service();
    band(H-.06,.12,0x555b5b);
  }else if(id==='facility:costco'){
    surface(L/2,H/2,L,H,0xe8e8e1);
    band(H*.845,H*.033,0xe1273b,.055,.07);
    band(.28,.48,0xb9bbb7);
    for(let x=2.8;x<L;x+=3.3)box(x,H/2,.025,.024,H,.025,0xc3c6c3);
    if(front){
      const lower=H*.17,top=H*.78;
      for(const [x,w] of [[L*.20,L*.065],[L*.79,L*.13]]){
        pane(x-w/2,x+w/2,lower,top,Math.max(.7,w/3),0xb6c4c7);
        for(let y=lower+.7;y<top;y+=.85)box(x,y,.08,w,.045,.12,0xc5ced0);
      }
      // Original billboard is raised above the otherwise blank warehouse frontage.
      box(L*.855,H+.70,.015,L*.255,1.4,.26,0xe8e8e1);
      c.sign('costco',L*.855,H+.72,L*.22,1.12,.17);
      pane(L*.36,L*.60,.08,Math.min(2.5,H*.18),2,0x677a81);
      canopy(L*.35,L*.61,Math.min(2.5,H*.18)+.12,0xbdc8c9,.65);
    }else service();
    band(H-.04,.10,0xc6cecd);
  }else{
    const lime=0x8cda19;
    surface(L/2,H/2,L,H,0xbec8c9);
    for(const y of [.28,.48,.69,.89])band(H*y,.045,0x89999c,.035,.04);
    band(H*.94,H*.10,lime,.10,.20);
    if(front){
      const a=L*.24,b=L*.46,entry=H*.17,top=H*.88;
      // Tall corner glazing is framed by the unmistakable lime tower.
      surface(L*.535,H/2,L*.15,H,lime,.032);
      box(L*.535,H+.38,.10,L*.15,.76,.20,lime);
      pane(a,b,entry+.04,top,Math.max(1,L*.07),0x749798);
      for(let y=entry+.75;y<top;y+=1.05)box((a+b)/2,y,.10,b-a,.055,.16,0xa3babc);
      pane(a,b,.1,entry-.15,Math.max(1,L*.07),0x789d99);
      canopy(a-.025,b+.03,entry,lime,1.10);
      for(const x of [a+.10,b-.10])box(x,entry/2,.63,.14,entry,1.26,0xd5dfcf);
      // Dark right-hand glazed warehouse bay and the blue loading canopy.
      pane(L*.64,L*.81,H*.20,H*.69,Math.max(1,L*.07),0x4c626c);
      for(let y=H*.22;y<H*.69;y+=.7)box(L*.725,y,.10,L*.17,.055,.14,0x9aaeb3);
      canopy(L*.82,L*.98,H*.21,0x3979b1,1.2);
      c.sign('traders',L*.535,H*.915,L*.125,H*.10,.23);
    }else service();
  }
  return true;
}
