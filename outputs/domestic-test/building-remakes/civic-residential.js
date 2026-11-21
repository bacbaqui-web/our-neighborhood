// Exact approved photographs; unobserved elevations remain documented estimates.
export function emitApprovedCivicFace(c){
 const {id,L,H,levels,fh,front,ground}=c;
 // Polygon-edge coordinates run right to left when viewed from outside.
 const X=x=>front&&id.startsWith('building:')?L-x:x,W=(x,...a)=>c.window(X(x),...a),B=(x,...a)=>c.box(X(x),...a),S=(x,...a)=>c.surface(X(x),...a),sign=(key,x,...a)=>c.sign(key,X(x),...a);
 if(id==='building:shop-tile'){
  const cols=Math.max(2,Math.round(L/3.8)),bay=(L-.5)/cols,stair=L*.46;
  for(let r=1;r<levels;r++)for(let j=0;j<cols;j++){const x=.25+bay*(j+.5);W(x,r*fh+fh*.52,Math.min(2.05,bay-.5),Math.min(1.15,fh*.4),'brown-slider',0x705547);}
  if(front){
   // Long, low three-storey block, with a raised stair bay rather than a roof cube.
   B(stair,H*.84,.13,Math.min(2.8,L*.11),H*.32,.26,0xb3b6b2);B(stair,H+.62,.03,Math.min(2.8,L*.11),1.24,.26,0xb3b6b2);
   B(stair,H+1.27,.26,Math.min(3.25,L*.14),.10,.75,0x706c5c);
   for(const dx of [-.9,.9])B(stair+dx,H+1.07,.43,.045,.36,.05,0x4e4e42);
   W(stair,H*.76,Math.min(1.7,L*.065),1.05,'wide-slider',0x736053);
   const bays=[[.02,.25,0xc8c0aa],[.25,.36,0x151d20],[.36,.47,0xe7e5dc],[.47,.80,0x513326],[.80,.98,0x19232c]];
   for(const [a,b,col]of bays){const x=(a+b)*L/2,w=(b-a)*L-.10,head=Math.min(fh-.16,3.0);W(x,ground+1.22,w-.12,2.32,'wide-slider',0x283531,[0x203e3c,0x3e5551,0x163d40]);B(x,head-.25,.14,w,.62,.28,col);}
   // Clearly legible original sign; unreadable tiny business names are not invented.
   sign('dongnae',L*.635,Math.min(fh-.16,3.0)-.25,L*.29,.44,.29);
   sign('tile-lettering',L*.415,Math.min(fh-.16,3.0)-.25,L*.105,.36,.30,{text:'(주) 아프레스',color:'#aa852e'});
   sign('tile-lettering',L*.29,Math.min(fh-.16,3.0)-.25,L*.055,.39,.30,{text:'부자독서실',color:'#f5f3ea'});
   // Contrasting striped awning, dark timber frontage and the red-orange corner canopy.
   for(const [a,b,col]of [[.02,.25,0xb9b09a],[.47,.80,0x3c3028],[.80,.98,0xe65022]]){
    const w=(b-a)*L,x=(a+b)*L/2;B(x,2.52,.42,w,.12,.84,col);B(x,2.40,.81,w,.20,.045,col);
    if(a===.02)for(let xx=a*L;xx<b*L;xx+=.21)B(xx,2.585,.42,.065,.012,.84,0xe8e0cb);
   }
   for(const x of [L*.54,L*.73,L*.84])B(x,1.0,.20,.13,1.9,.4,0x574131);
   for(const x of [L*.42,L*.47]){B(x,fh+.22,.23,.65,.57,.46,0xd5d1bd);for(let yy=fh+.05;yy<fh+.45;yy+=.09)B(x,yy,.47,.49,.025,.025,0x626d64);}
  }else for(let j=0;j<cols;j++)W(.25+bay*(j+.5),ground+fh*.57,Math.min(1.4,bay-.4),Math.min(1.1,fh*.4));
  for(let r=1;r<levels;r++)B(L/2,r*fh,.018,L-.06,.055,.036,0x878e89);
  B(L/2,H+.08,.02,L,.08,.20,0x795746);return true;
 }
 if(id==='building:shop-panel'){
  if(front){
   const split=L*.46,upper=H-fh;
   S((split+L)/2,upper/2+fh*.5,L-split,upper-fh,0x253037,.022);
   for(let x=.08;x<L;x+=.18)B(x,H/2,.035,.026,H-.08,.05,0x74513c);
   // Left bronze fins, right blue curtain wall; broad top-floor windows cap both.
   const nLeft=Math.max(3,Math.round(split/1.4)),step=split/nLeft,nRight=Math.max(4,Math.round((L-split)/1.45)),rw=(L-split-.3)/nRight;
   for(let r=1;r<levels-1;r++){
    for(let j=0;j<nLeft;j++)W(.18+step*(j+.5),r*fh+fh*.53,Math.min(.65,step*.51),fh*.75,'stair',0x38464e);
    for(let j=0;j<nRight;j++)W(split+.15+rw*(j+.5),r*fh+fh*.53,rw*.70,fh*.76,'stair',0x243239);
   }
   const nTop=Math.max(5,Math.round(L/2.4)),tw=(L-.45)/nTop;
   for(let j=0;j<nTop;j++){const x=.22+tw*(j+.5),w=j<nTop*.55?tw*.77:tw*.5;W(x,H-fh*.48,w,fh*.58,'wide-slider',0x414947);B(x,H-fh*.68,.13,w,.045,.045,0x384548);}
   W(split/2,upper-.20,split-.22,.55,'wide-slider',0x253239);
   for(let j=0;j<Math.max(3,Math.round(L/3.2));j++){const n=Math.max(3,Math.round(L/3.2)),w=(L-.4)/n;W(.2+w*(j+.5),ground+fh*.42,w-.18,fh*.79,'wide-slider',0x353e3d,[0x173b40,0x32666d,0x245461]);}
   B(L/2,fh-.10,.13,L-.08,.20,.26,0x6e4c37);
  }else{
   const n=Math.max(1,Math.floor(L/3.0)),pw=(L-.6)/n;
   for(let r=0;r<levels;r++)for(let j=0;j<n;j++)W(.3+pw*(j+.5),r*fh+fh*.54,Math.min(1.0,pw-.3),Math.min(fh*.60,1.8),'stair',0x3b5058);
   for(let x=.1;x<L;x+=.24)B(x,H/2,.022,.018,H-.12,.028,0x79583e);
  }return true;
 }
 if(id==='facility:apartment'){
  if(!front&&L<20){
   S(L/2,H/2,L,H,0xd2d9d3);S(L*.17,H/2,L*.22,H,0x9fb7ad);
   for(let r=0;r<levels;r++){W(L*.17,r*fh+fh*.54,Math.min(1.05,L*.14),fh*.56,'stair',0xcad7d1);B(L*.18,r*fh+.15,.13,L*.34,.18,.26,0xe1e7df);}
   if(c.edge===1)sign('hanshin',L*.63,H*.78,Math.min(3,L*.44),Math.min(4,H*.16),.035);return true;
  }
  const n=Math.max(3,Math.round(L/3.1)),pw=(L-.5)/n;
  for(let j=0;j<n;j++){
   const x=.25+pw*(j+.5),mint=j%4===2;
   S(x,H/2,pw-.07,H,mint?0x77a9a2:0xcbd5cf,.014);
   for(let r=0;r<levels;r++){
    if(front&&r===0&&j===Math.floor(n/2))continue;
    const w=Math.min(2.7,pw-.24),h=Math.min(2.02,fh*.72),y=r*fh+fh*.57;
    W(x,y,w,h,'veranda',0xd5dfd8,[0x4f8f98,0x84b5b5,0x336772]);
    B(x,y-h/2-.08,.09,w+.12,.12,.22,0xc4d4ce);
    if(r>0){B(x,y-h/2+.46,.17,w,.03,.035,0x647978);for(let k=0;k<=5;k++)B(x-w/2+k*w/5,y-h/2+.25,.17,.018,.42,.022,0x647978);}
    if((j+r)%4===0){B(x+w*.25,y-h*.22,.23,.57,.38,.46,0xd5d6c9);for(let k=0;k<4;k++)B(x+w*.25,y-h*.22-.12+k*.08,.466,.42,.018,.018,0x82938a);}
   }
   if(j%3===0)B(.25+pw*j,H/2,.08,.23,H,.16,0xe1e7df);
  }
  if(front){const x=.25+pw*(Math.floor(n/2)+.5),w=Math.min(2.3,pw-.3);W(x,ground+1.25,w,2.4,'wide-slider',0x597b74);B(x,ground+2.55,.22,w+.3,.12,.44,0x537c69);}
  return true;
 }
 if(id==='facility:police'){
  const n=Math.max(4,Math.round(L/2.0)),pw=(L-.5)/n,white=0xd6dfdc,orange=0xbc592a;
  if(front){for(let r=1;r<levels;r++)S(L/2,r*fh+fh*.22,L-.5,fh*.49,orange,.016);}
  for(let r=0;r<levels;r++)for(let j=0;j<n;j++){
   if(front&&r===0&&Math.abs(j-(n-1)/2)<1.2)continue;
   W(.25+pw*(j+.5),r*fh+fh*.65,Math.min(1.6,pw-.27),Math.min(fh*.48,1.65),'wide-slider',0xd9dfdc,[0x28383d,0x526361,0x24343e]);
   if(front&&r===1&&j%2===0){B(.25+pw*(j+.5),fh+.15,.24,.65,.47,.48,0xe0ddd1);for(let k=0;k<4;k++)B(.25+pw*(j+.5),fh+.02+k*.09,.486,.50,.026,.02,0x727e77);}
  }
  if(front){
   for(let j=0;j<=n;j++)B(.25+pw*j,H*.52,.12,.17,H*.91,.24,white);
   const w=Math.min(4.2,L*.36);W(L/2,ground+1.3,w,2.45,'wide-slider',0x71898a);
   B(L/2,fh-.10,.29,L-.16,.25,.58,white);
   B(L/2,H-.31,.10,L,.70,.20,white);
   sign('police-name',L*.61,H-.26,L*.58,.48,.22,{text:'서울서대문경찰서',color:'#28517b'});
   sign('police-name',L*.61,H-.57,L*.44,.15,.23,{text:'Seodaemun Police Station',color:'#dbb32a'});
   sign('police-emblem',L*.275,H-.28,.82,.55,.23);
  }
  return true;
 }
 return false;
}
