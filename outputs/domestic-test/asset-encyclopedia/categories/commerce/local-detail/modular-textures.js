import * as T from 'three';
const cache=new Map();
export function surface(kind){
 if(cache.has(kind))return cache.get(kind);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');
 c.fillStyle=({wall:'#d5d4c4',ceiling:'#dedfd1',floor:'#a8ad9e',shelf:'#c5c8b9',freezer:'#d8ddcf',packs:'#dedfce',logo:'#efeee3',wordmark:'#174e3a'})[kind]??'#d5d7c7';c.fillRect(0,0,512,512);
 if(['wall','ceiling','floor'].includes(kind)){
  c.strokeStyle=kind==='wall'?'#bec0b1':'#c3c7b8';c.lineWidth=kind==='floor'?2:3;
  const step=kind==='ceiling'?128:256;for(let y=step;y<512;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
  if(kind!=='wall')for(let x=step;x<512;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,512);c.stroke();}
 }
 if(kind==='shelf'){
  c.fillStyle='#536452';c.fillRect(18,12,476,486);
  const colors=['#b75b43','#d2ad48','#78934c','#c7c1a0','#4e8292','#8c5a70'];
  for(let row=0;row<5;row++){
   for(let col=0;col<7;col++){const x=29+col*65,y=24+row*94,h=57+(col%3)*6;c.fillStyle=colors[(col+row*2)%6];c.fillRect(x,y,48,h);c.fillStyle='#e4dcc4';c.fillRect(x+7,y+18,34,10);c.fillStyle='#69725b';c.fillRect(x+6,y+h-7,36,4);}
   c.fillStyle='#d6d9c9';c.fillRect(14,97+row*94,484,9);
  }
  c.fillStyle='#d6d9c9';c.fillRect(6,0,9,512);c.fillRect(497,0,9,512);
 }
 if(kind==='freezer'){
  const cols=['#d29078','#a3bd76','#e2c785','#9fc5bd','#b8a4bd','#d1b495'];
  for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=40+col*72,y=170+row*64;c.fillStyle=cols[(row+col)%6];c.fillRect(x,y,66,56);c.fillStyle='#eee6cf';c.fillRect(x+23,y+8,21,30);c.fillStyle='#a58c63';c.fillRect(x+30,y+37,6,10);}
  c.fillStyle='#8c9988';for(let x=25;x<490;x+=13)c.fillRect(x,460,5,24);
 }
 if(kind==='packs')for(let r=0;r<3;r++)for(let k=0;k<2;k++){let x=k*256,y=r*170;c.strokeStyle='#b0baa2';c.lineWidth=5;c.strokeRect(x+8,y+8,240,154);c.fillStyle=['#8aa465','#6c9692','#b6a16c'][r];c.beginPath();c.ellipse(x+128,y+80,42,60,0,0,Math.PI*2);c.fill();c.fillStyle='#e9e5d2';c.fillRect(x+105,y+68,46,13);}
 if(kind==='logo'){
  c.fillStyle='#ee824c';c.beginPath();c.moveTo(92,58);c.lineTo(408,58);c.lineTo(331,123);c.lineTo(108,123);c.closePath();c.fill();
  c.fillStyle='#d84b3b';c.beginPath();c.moveTo(404,82);c.bezierCurveTo(300,127,238,197,222,282);c.lineTo(313,282);c.bezierCurveTo(327,211,351,161,404,142);c.closePath();c.fill();c.fillRect(225,358,88,109);
  c.fillStyle='#236446';c.textAlign='center';c.font='900 79px Arial';c.fillText('SEVENA',256,342,430);
 }
 if(kind==='wordmark'){c.fillStyle='#e6e8d8';c.textAlign='center';c.font='900 83px Arial';c.fillText('7 SEVENA',256,300,480);}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const m=new T.MeshStandardMaterial({map:texture,roughness:1});cache.set(kind,m);return m;
}
