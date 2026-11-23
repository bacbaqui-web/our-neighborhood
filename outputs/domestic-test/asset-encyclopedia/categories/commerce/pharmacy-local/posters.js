import * as T from 'three';
// Flat-color artwork made for this project, fictional products with no efficacy claims.
export function posterMaterial(kind){
 const c=document.createElement('canvas');c.width=480;c.height=640;const x=c.getContext('2d');
 const rect=(a,b,w,h,color)=>{x.fillStyle=color;x.fillRect(a,b,w,h);};
 const text=(t,a,b,s,color)=>{x.fillStyle=color;x.font=`bold ${s}px sans-serif`;x.fillText(t,a,b);};
 const circle=(a,b,r,color)=>{x.fillStyle=color;x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill();};
 const orange=kind==='poster-vitamin',accent=orange?'#d8803b':'#3a8992';rect(0,0,480,640,'#f7f1df');rect(0,0,480,132,accent);text(orange?'하루 비타민':'우리집 구급함',30,87,51,'#fff6e5');text(orange?'나에게 맞는 제품 찾기':'미리 확인해 두세요',38,177,30,'#4f6662');
 if(orange){circle(240,333,121,'#f4d69a');rect(156,248,166,201,'#f5f0d8');rect(165,228,148,43,'#778f73');rect(156,312,166,98,'#dba858');text('VITA',176,374,43,'#fff7e6');circle(348,409,37,'#e6a247');circle(106,378,29,'#eac477');}
 else{rect(107,245,265,192,'#d8e7de');rect(185,220,106,28,'#568a88');rect(210,282,55,112,'#cf6962');rect(182,309,112,55,'#cf6962');rect(67,421,163,49,'#c5b596');for(let i=0;i<4;i++)circle(94+i*35,445,5,'#faf2dc');}
 rect(26,505,428,3,accent);text(orange?'비타민 · 건강용품':'밴드 · 위생용품',38,555,35,accent);text('궁금한 점은 약사에게',39,600,28,'#516962');
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
 return new T.MeshStandardMaterial({map:tx,roughness:1,side:T.DoubleSide});
}

// Transparent printed film: paper edges and tape are flat artwork, not photo noise.
export function glassDecoration(kind){
 const c=document.createElement('canvas');c.width=kind==='doorprint'?320:640;c.height=1024;const x=c.getContext('2d');
 const r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
 const label=(t,a,b,size,col)=>{x.fillStyle=col;x.font=`bold ${size}px sans-serif`;x.fillText(t,a,b);};
 function paper(a,b,w,h,title,col,angle=0){x.save();x.translate(a,b);x.rotate(angle);r(0,0,w,h,'#f4f0df');r(8,10,w-16,24,col);label(title,12,29,16,'#fffdf0');for(let row=0;row<4;row++)r(12,48+row*14,w-24-(row%2)*18,3,'#9aa69c');r(-5,-6,38,12,'#d5d6bb');r(w-28,h-7,36,12,'#d5d6bb');x.restore();}
 if(kind==='doorprint'){
  r(139,257,42,126,'#c33749');r(97,299,126,42,'#c33749');
  x.textAlign='center';label('강약중강약국',160,441,49,'#354d96');label('처방전 접수',160,482,28,'#4b6b67');x.textAlign='left';
 }else{
  paper(24,70,140,150,'안내','#607f9c',-.035);paper(190,52,155,118,'건강 소식','#71927b',.02);paper(468,150,150,165,'상담 안내','#8b8170',.025);
  paper(25,295,120,140,'알림','#849c9d',.02);paper(475,440,146,135,'위생용품','#688e80',-.025);
  for(const [a,b,w] of [[380,86,54],[174,220,38],[34,458,43],[572,360,35]]){r(a,b,w,13,'#d7d9c5');r(a+4,b+15,w-8,5,'#e7e4d2');}
 }
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
 return new T.MeshStandardMaterial({map:tx,transparent:true,alphaTest:.05,roughness:1,side:T.DoubleSide});
}

export function a4Notice(){
 const root=new T.Group(),c=document.createElement('canvas');c.width=420;c.height=594;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,420,594);x.fillStyle='#4d5d59';x.font='bold 36px sans-serif';x.fillText('이용 안내',50,85);x.font='23px sans-serif';x.fillText('궁금한 점은 약사에게',40,150);x.fillText('문의해 주세요.',40,187);x.fillStyle='#a7afab';for(let i=0;i<8;i++)x.fillRect(40,240+i*28,310-(i%3)*25,4);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
 const back=new T.Mesh(new T.PlaneGeometry(.297,.42),new T.MeshStandardMaterial({color:'#ffffff',roughness:1,side:T.FrontSide}));back.position.set(0,.21,.0004);back.name='A4-white-outward-back';root.add(back);
 const face=new T.Mesh(new T.PlaneGeometry(.297,.42),new T.MeshStandardMaterial({map:tx,roughness:1,side:T.FrontSide}));face.rotation.y=Math.PI;face.position.set(0,.21,-.0004);face.name='A4-inward-print';root.add(face);root.userData={key:'a4-notice',assetId:'commerce:pharmacy-local-a4-notice'};return root;
}
