import * as T from 'three';
export function surface(kind,w=1,h=1,variant=0){
 const c=document.createElement('canvas'),scale=Math.max(220,128/Math.min(w,h));c.width=Math.round(w*scale);c.height=Math.round(h*scale);const x=c.getContext('2d'),W=c.width,H=c.height;
 const rect=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh);};
 const text=(t,a,b,s,col='#393b31',font='serif')=>{x.font=`${s}px ${font}`;x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;x.fillText(t,a,b);};
 const circle=(a,b,r,col)=>{x.fillStyle=col;x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill();};
 const transparent=['sign','decal','sidebrand'].includes(kind);
 if(!transparent)rect(0,0,W,H,{wood:'#876a48',wall:'#ede9db',floor:'#d3d0bd',ceiling:'#f0ede0',leather:'#bcaa7c',curtain:'#d5d1bc',mirror:'#bec9bd',cabinet:'#dfdac4',products:'#ede9dc',aircon:'#d9dcd0'}[kind]||'#e8e2cc');
 if(kind==='sign')text('haro',W/2,H*.55,H*.83);
 if(kind==='sidebrand'){text('haro',W/2,H*.39,H*.55);text('HAIR STUDIO',W/2,H*.84,H*.10);}
 if(kind==='decal'){text('haro',W/2,H*.14,W*.22,'#f6efdf');text('HAIR STUDIO',W/2,H*.35,W*.085,'#f6efdf');text('예약 우선',W/2,H*.57,W*.10,'#f6efdf','sans-serif');text('10:00 — 19:00',W/2,H*.77,W*.075,'#f6efdf');text('매주 월요일 휴무',W/2,H*.91,W*.06,'#f6efdf','sans-serif');}
 if(kind==='wood'||kind==='curtain'){for(let a=0;a<W;a+=kind==='wood'?W/9:W/12)rect(a,0,kind==='wood'?2:W/45,H,kind==='wood'?'#a0835d':'#c7c3ae');}
 if(kind==='floor'||kind==='ceiling'){for(let a=0;a<W;a+=.6*scale)rect(a,0,1,H,'#bdbfac');for(let b=0;b<H;b+=.6*scale)rect(0,b,W,1,'#bdbfac');}
 if(kind==='leather'){x.strokeStyle='#a6966f';x.lineWidth=2;x.strokeRect(5,5,W-10,H-10);rect(9,H*.12,W-18,2,'#d1c099');}
 if(kind==='mirror'){
  rect(W*.09,0,W*.12,H,'#dbe2d5');rect(W*.68,0,W*.04,H,'#e8e8d9');
  x.fillStyle='#cdd4c5';x.beginPath();x.moveTo(W*.2,H);x.lineTo(W*.8,0);x.lineTo(W,0);x.lineTo(W*.4,H);x.closePath();x.fill();
  rect(0,H*.76,W,H*.025,'#a5b2a3');
 }
 if(kind==='cabinet'||kind==='products'){
  const rows=kind==='cabinet'?4:2;
  for(let r=0;r<rows;r++){
   const cy=(r+.5)*H/rows;
   if(kind==='cabinet'&&r<2){for(let i=0;i<3;i++){rect(W*(.10+i*.28),cy-H/rows*.24,W*.23,H/rows*.43,['#e9e4d3','#cbbf9f','#d4d1be'][i]);rect(W*(.11+i*.28),cy+H/rows*.13,W*.21,2,'#b9af95');}}
   else for(let i=0;i<4;i++){const hh=H/rows*(.45+(i%3)*.10);rect(W*(.10+i*.22),cy+H/rows*.3-hh,W*.13,hh,['#9a7659','#81978a','#bcbca4','#d8c6ab'][(i+variant)%4]);rect(W*(.12+i*.22),cy+H/rows*.3-hh-6,W*.09,6,'#5d675e');rect(W*(.11+i*.22),cy+H/rows*.05,W*.11,H/rows*.09,'#eee8d5');}
   rect(0,(r+1)*H/rows-5,W,5,'#c4bda7');
  }
 }
 if(kind==='tools'){
  rect(0,0,W,H,'#685d4c');rect(W*.04,H*.08,W*.55,H*.84,'#c8b995');
  x.strokeStyle='#dedfce';x.lineWidth=3;x.beginPath();x.moveTo(W*.12,H*.2);x.lineTo(W*.36,H*.8);x.moveTo(W*.36,H*.2);x.lineTo(W*.12,H*.8);x.stroke();
  for(let i=0;i<9;i++)rect(W*(.67+i*.025),H*.32,W*.012,H*.46,'#424e48');rect(W*.65,H*.25,W*.27,H*.10,'#424e48');
 }
 if(kind==='bottle'){rect(0,0,W,H,['#9a7151','#82968a','#c2ba99','#d8c9ad'][variant%4]);rect(W*.08,H*.36,W*.84,H*.40,'#eee6d0');text(['CARE','WASH','OIL','MIST'][variant%4],W*.5,H*.52,W*.17);rect(W*.18,H*.66,W*.64,H*.018,'#81795f');}
 if(kind==='stock'){
  for(let r=0;r<4;r++){const top=r*H/4;rect(W*.04,top+H*.02,W*.92,H*.20,'#bdb6a0');
   if(r===1||r===3){for(let i=0;i<3;i++)for(let j=0;j<3;j++){const xx=W*(.08+i*.30),yy=top+H*(.04+j*.052);rect(xx,yy,W*.24,H*.045,['#eee6cf','#b4b7a4','#c6ad88'][(i+variant)%3]);rect(xx+W*.02,yy+H*.034,W*.20,H*.006,'#9c9782');}}
   else for(let i=0;i<6;i++){const xx=W*(.07+i*.15),hh=H*(.10+(i%3)*.025),yy=top+H*.20-hh;rect(xx,yy,W*.105,hh,['#8d6a4d','#809789','#d0bfa1'][(i+variant)%3]);rect(xx+W*.025,yy-H*.018,W*.025,H*.018,'#555e50');rect(xx+W*.02,yy-H*.026,W*.09,H*.01,'#555e50');rect(xx+W*.01,yy+hh*.40,W*.085,hh*.38,'#eee6cf');}
   rect(0,top+H*.23,W,H*.018,'#785e43');
  }
 }
 if(kind==='aircon'){rect(W*.09,H*.09,W*.82,H*.82,'#969e92');for(let i=0;i<12;i++)rect(W*.12,H*(.12+i*.064),W*.76,H*.018,'#d2d8ca');}
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
 return new T.MeshStandardMaterial({map:tx,roughness:kind==='mirror'?.5:.9,transparent,alphaTest:transparent?.03:0});
}
