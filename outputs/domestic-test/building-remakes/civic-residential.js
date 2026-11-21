// Reference-led facade rhythms; hidden elevations are explicitly inferred.
export function emitApprovedCivicFace(c){
 const {id,L,H,levels,fh,front,ground,window:W,box:B,surface:S}=c;
 if(id==='building:shop-tile'){
  const cols=Math.max(1,Math.floor(L/3.1)),bay=(L-.5)/cols;
  for(let r=1;r<levels;r++)for(let j=0;j<cols;j++)W(.25+bay*(j+.5),r*fh+fh*.55,Math.min(1.9,bay-.35),Math.min(1.18,fh*.46),'brown-slider',0x6f6558);
  if(front){for(let j=0;j<cols;j++){const x=.25+bay*(j+.5),h=Math.min(2.45,fh-.7);W(x,ground+h/2+.06,bay-.25,h,'wide-slider',0x64716d);B(x,ground+h+.35,.10,bay-.14,.5,.15,[0x655c4f,0x9b8c71,0x70544a][j%3]);if(j%2===0){B(x,ground+h+.07,.23,bay-.1,.08,.46,0x758376);B(x,ground+h-.03,.43,bay-.1,.16,.04,0x758376);}}}
  else for(let j=0;j<cols;j++)W(.25+bay*(j+.5),ground+fh*.57,Math.min(1.3,bay-.4),Math.min(1.1,fh*.4));
  for(let r=1;r<levels;r++)B(L/2,r*fh,.035,L-.06,.09,.07,0x9eaa9f);
  return true;
 }
 if(id==='building:shop-panel'){
  if(front){
   const split=L*.46;S((split+L)/2,H*.51,L-split,H*.82,0x3c4e52,.018);
   const n=Math.max(2,Math.floor(L/1.8)),bw=(L-.5)/n;
   for(let r=1;r<levels;r++)for(let j=0;j<n;j++){const x=.25+bw*(j+.5);W(x,r*fh+fh*.50,bw*(x<split?.46:.68),Math.min(fh*.72,2.25),'stair',0x485e65);}
   for(let x=.12;x<split-.08;x+=.22)B(x,H*.52,.035,.025,H*.88,.045,0x7f6a53);
   const nGround=Math.max(2,Math.floor(L/3.4)),gw=(L-.6)/nGround;
   for(let j=0;j<nGround;j++)W(.3+gw*(j+.5),ground+1.35,gw-.25,2.5,'wide-slider',0x4a5351);
   B(L/2,Math.min(fh-.12,2.9),.16,L-.08,.22,.32,0x806b52);
  }else{
   const n=Math.max(1,Math.floor(L/2.7)),pw=(L-.6)/n;
   for(let r=0;r<levels;r++)for(let j=0;j<n;j++)W(.3+pw*(j+.5),r*fh+fh*.54,Math.min(1.1,pw-.3),Math.min(fh*.63,1.9),'stair',0x4b5d60);
   for(let x=.6;x<L;x+=1.2)B(x,H/2,.025,.025,H-.15,.035,0x837766);
  }return true;
 }
 if(id==='facility:apartment'){
  const n=Math.max(1,Math.floor(L/(front?3.3:3.7))),pw=(L-.5)/n;
  for(let j=0;j<n;j++){
   const x=.25+pw*(j+.5),core=n>3&&j%5===2;
   if(core)S(x,H/2,pw*.83,H-.1,0xa2b8b0,.015);
   for(let r=0;r<levels;r++){
    if(front&&r===0&&j===Math.floor(n/2))continue;
    const w=core?Math.min(.8,pw*.45):Math.min(2.65,pw-.22),h=core?fh*.48:Math.min(1.95,fh*.68),y=r*fh+fh*.56;
    W(x,y,w,h,core?'stair':'veranda',0xc7d5cc);
    if(!core){B(x,y-h/2-.10,.10,w+.14,.12,.24,0xd2d8ce);if(r>0){B(x,y-h/2+.50,.23,w,.035,.035,0x71837d);for(let k=0;k<=5;k++)B(x-w/2+k*w/5,y-h/2+.26,.23,.022,.48,.022,0x71837d);}}
   }
   if(!core&&j<n-1)B(.25+pw*(j+1),H/2,.055,.18,H,.11,0xdbe1d6);
  }
  if(front){const x=.25+pw*(Math.floor(n/2)+.5),w=Math.min(2.3,pw-.3);W(x,ground+1.25,w,2.4,'wide-slider',0x78918a);B(x,ground+2.55,.22,w+.3,.12,.44,0x7f9e92);}
  return true;
 }
 if(id==='facility:police'){
  const n=Math.max(2,Math.floor(L/2.35)),pw=(L-.5)/n;
  if(front){for(let r=1;r<levels;r++)S(L/2,r*fh+fh*.22,L-.5,fh*.46,0xb9784f,.016);}
  for(let r=0;r<levels;r++)for(let j=0;j<n;j++){
   if(front&&r===0&&Math.abs(j-(n-1)/2)<1.2)continue;
   W(.25+pw*(j+.5),r*fh+fh*.64,Math.min(1.6,pw-.24),Math.min(fh*.46,1.65),'wide-slider',0xc2c9bd);
  }
  if(front){for(let j=0;j<=n;j++)B(.25+pw*j,H*.52,.115,.16,H*.91,.23,0xcbd3ca);const w=Math.min(3.6,L*.36);W(L/2,ground+1.3,w,2.45,'wide-slider',0x8d9d96);B(L/2,ground+2.8,.23,Math.min(L-.1,w+1.2),.25,.46,0xd4d8cf);B(L/2,H-.23,.08,L,.46,.16,0xd6ded4);}
  return true;
 }
 return false;
}
