import * as T from 'three';
export function blueSurface(kind,w,h){
 const c=document.createElement('canvas'),scale=Math.max(220,128/Math.min(w,h));c.width=Math.round(w*scale);c.height=Math.round(h*scale);const x=c.getContext('2d'),W=c.width,H=c.height;
 const rect=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh);};
 const text=(t,a,b,s,color='#f4ebd5',italic=false)=>{x.font=`${italic?'italic ':''}${s}px Georgia,serif`;x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(t,a,b);};
 const transparent=['name','left','right','open'].includes(kind);
 if(!transparent)rect(0,0,W,H,kind==='poster'?'#f3e5d2':kind==='wood'?'#a47a50':kind==='floor'?'#b9b9ad':kind==='wall'?'#c8cdc5':kind==='ceiling'?'#eeede2':kind==='fridge'?'#d5e0d9':'#174f70');
 if(kind==='name')text('PAKO PAKO',W/2,H*.53,Math.min(H*.76,W*.155));
 if(kind==='left')text('I baked',W/2,H*.53,Math.min(H*.72,W*.20),'#f4ebd5',true);
 if(kind==='right')text('bakery cafe',W/2,H*.53,Math.min(H*.72,W*.135),'#f4ebd5',true);
 if(kind==='stripe'){for(let i=0;i<W;i+=.24*scale){rect(i,0,.12*scale,H,'#ecebe3');rect(i+.12*scale,0,.12*scale,H,'#454b50');}}
 if(kind==='wood'){for(let i=0;i<W;i+=.10*scale)rect(i,0,2,H,'#906a45');}
 if(kind==='floor'||kind==='ceiling'){for(let i=0;i<W;i+=.6*scale)rect(i,0,1,H,'#a9afa6');for(let j=0;j<H;j+=.6*scale)rect(0,j,W,1,'#a9afa6');}
 if(kind==='poster'||kind==='board'){
  if(kind==='board')rect(0,0,W,H,'#d998a8');
  text('PAKO PAKO',W/2,H*.09,W*.095,'#39464a');
  x.save();x.translate(W*.5,H*.42);x.rotate(-.22);for(let j=0;j<3;j++){rect(-W*.29,j*H*.055,W*.58,H*.13,j%2?'#bc793f':'#dcaa66');rect(-W*.24,j*H*.055+H*.015,W*.48,H*.016,'#efd39a');}x.restore();
  text('BUTTER BAR',W/2,H*.71,W*.105,'#9b5942');text('매일 구운 버터빵',W/2,H*.83,W*.07,'#9b5942');
 }
 if(kind==='open'){rect(3,3,W-6,H-6,'#8d5038');text('OPEN',W/2,H/2,H*.7);}
 if(kind==='fridge'){rect(W*.08,H*.08,W*.84,H*.81,'#5e736e');for(let r=0;r<4;r++){for(let i=0;i<5;i++){rect(W*(.13+i*.15),H*(.16+r*.18),W*.09,H*.11,['#e9d7ab','#b8ccad','#d6ae8e'][i%3]);rect(W*(.15+i*.15),H*(.14+r*.18),W*.05,H*.025,'#dddccc');}rect(W*.08,H*(.29+r*.18),W*.84,H*.014,'#c4cabe');}}
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tx,roughness:.86,transparent,alphaTest:transparent?.05:0});
}
