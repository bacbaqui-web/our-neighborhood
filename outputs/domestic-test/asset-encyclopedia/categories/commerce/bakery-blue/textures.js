import * as T from 'three';
export function surface(kind,w=1,h=1,variant=0){
 const c=document.createElement('canvas');const scale=Math.max(240,128/Math.min(w,h));c.width=Math.round(w*scale);c.height=Math.round(h*scale);const x=c.getContext('2d'),W=c.width,H=c.height;
 const rect=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh);};
 const text=(t,a,b,size,col='#4e3928',font='sans-serif')=>{x.fillStyle=col;x.font=`bold ${size}px ${font}`;x.textAlign='center';x.textBaseline='middle';x.fillText(t,a,b);};
 const oval=(a,b,rx,ry,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(a,b,rx,ry,0,0,Math.PI*2);x.fill();};
 function bread(a,b,s,type){x.save();x.translate(a,b);x.rotate(((variant+type)%3-1)*.08);const gold=['#ca843f','#b97539','#d49d56','#aa6236'][type%4];
 if(type%4===0){oval(0,2,s*.42,s*.25,'#854f30');oval(0,-2,s*.40,s*.26,gold);x.strokeStyle='#efd3a0';x.lineWidth=s*.05;for(let k=-1;k<=1;k++){x.beginPath();x.moveTo(k*s*.15-s*.04,-s*.12);x.lineTo(k*s*.15+s*.05,s*.08);x.stroke();}}
 else if(type%4===1){rect(-s*.32,-s*.25,s*.64,s*.5,'#a76736');rect(-s*.27,-s*.18,s*.54,s*.4,'#f0cc8d');for(let j=-1;j<=1;j++)oval(j*s*.17,-s*.22,s*.13,s*.14,gold);}
 else if(type%4===2){for(let j=-2;j<=2;j++)oval(j*s*.15,Math.abs(j)*s*.06,s*(.16-Math.abs(j)*.025),s*(.26-Math.abs(j)*.04),j%2? '#b7773e':'#dba355');}
 else{oval(0,0,s*.48,s*.15,gold);for(let j=-2;j<=2;j++){x.strokeStyle='#efd7aa';x.lineWidth=s*.035;x.beginPath();x.moveTo(j*s*.14-.04*s,-.08*s);x.lineTo(j*s*.14+.06*s,.08*s);x.stroke();}}
 x.restore();}
 const transparent=['sign','subtitle','decal','bread-logo'].includes(kind);
 if(!transparent)rect(0,0,W,H,kind==='wood'?'#a67c54':kind==='floor'?'#e2d9c6':kind==='wall'?'#eee7d7':kind==='ceiling'?'#f3f0e4':'#715137');
 if(kind==='wood'){for(let i=0;i<W;i+=W/10)rect(i,0,2,H,'#8f6846');for(let i=0;i<9;i++)rect((i*.137%1)*W,H*(i%3)/3,1,H*.24,'#bd956b');}
 if(['wall','ceiling','floor'].includes(kind)){const step=kind==='wall'?170:120;x.strokeStyle=kind==='wall'?'#e0d7c3':'#cbc5b7';x.lineWidth=1.5;for(let i=0;i<W;i+=step){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}for(let j=0;j<H;j+=step){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke();}}
 if(kind==='shelf'||kind==='display'){
 const rows=kind==='shelf'?3:2,cols=3;
 for(let r=0;r<rows;r++){const yy=(r+.5)*H/rows;rect(7,yy-H/rows*.38,W-14,H/rows*.76,'#c6a077');
 for(let k=0;k<cols;k++){const xx=(k+.5)*W/cols;rect(xx-W/cols*.43,yy-H/rows*.30,W/cols*.86,H/rows*.58,'#655241');for(let n=0;n<2;n++)bread(xx+(n-.5)*W/cols*.39,yy-4,Math.min(W/cols*.50,H/rows*.68),(k+r+variant)%4);rect(xx-15,yy+H/rows*.24,30,11,'#fff1d3');text(['2.5','3.0','3.5'][(k+r)%3],xx,yy+H/rows*.24+5,7);}
 rect(0,(r+1)*H/rows-8,W,8,'#63452f');}
 }
 if(kind==='bread-top'||kind==='bread-side'){
 rect(0,0,W,H,['#c99a5c','#dab071','#cda162','#b98049'][variant%4]);
 // A low rounded box carries the whole small group; its faces stay closed.
 const count=1;
 for(let i=0;i<count;i++){
  const cx=(i+.5)*W/count,cy=H*.53;
  if(kind==='bread-top')bread(cx,cy,Math.min(W/count*.95,H*1.5),variant%4);
  else{const rx=W/count*.43,ry=H*.41;oval(cx,cy+H*.07,rx,ry,['#b87b42','#d7a365','#be884c','#a96636'][variant%4]);oval(cx,cy-H*.07,rx*.92,ry*.78,'#d9aa69');x.strokeStyle='#f5d8a2';x.lineWidth=H*.07;x.beginPath();x.moveTo(cx-rx*.4,cy-ry*.35);x.lineTo(cx+rx*.2,cy+ry*.1);x.stroke();}
 }
 }
 if(kind==='price'){rect(0,0,W,H,'#f5e9ce');text(['소금빵','식빵','크루아상','바게트'][variant%4],W/2,H*.35,H*.28);text(['2,500','3,500','3,000','4,000'][variant%4],W/2,H*.75,H*.3);}
 if(kind==='oven'){rect(10,12,W-20,H-24,'#a5ada5');for(let r=0;r<3;r++){rect(W*.1,H*(.12+r*.27),W*.7,H*.19,'#3e4a47');rect(W*.14,H*(.15+r*.27),W*.6,H*.1,'#62625a');rect(W*.12,H*(.31+r*.27),W*.67,5,'#d5d7c8');oval(W*.88,H*(.19+r*.27),6,6,'#c09251');}}
 if(kind==='board'){rect(0,0,W,H,'#ac865b');for(let i=0;i<6;i++)rect(i*W/6,0,1,H,'#99744e');oval(W/2,H*.09,W*.025,H*.018,'#403d32');text('bakery',W/2,H*.55,W*.24,'#fff5df','serif');text('coffee',W/2,H*.70,W*.24,'#fff5df','serif');}
 if(kind==='sign'){text('PAKO',W/2,H*.52,Math.min(H*.85,W*.24),'#403324','serif');}
 if(kind==='subtitle'){text('Bakery',W/2,H*.52,Math.min(H*.85,W*.25),'#403324','serif');}
 if(kind==='bread-logo'){bread(W/2,H*.52,Math.min(W,H)*.86,2);}
 if(kind==='decal'){text('PAKO',W/2,H*.15,W*.145,'#faf1d6','serif');text('파코빵집',W/2,H*.39,W*.12,'#faf1d6');text('OPEN 08:00 — 20:00',W/2,H*.67,W*.06,'#faf1d6');text('매일 굽는 동네 빵',W/2,H*.84,W*.074,'#faf1d6');}
 if(kind==='bags'){rect(0,0,W,H,'#c9ac7a');for(let i=0;i<4;i++){rect(i*W/4+4,8,W/4-8,H-16,'#e2cd9f');}text('PAKO',W/2,H*.6,W*.12);}
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
 const m=new T.MeshStandardMaterial({map:tx,roughness:.92,transparent,alphaTest:transparent?.03:0,side:T.DoubleSide});m.userData.textureKind=kind;return m;
}
