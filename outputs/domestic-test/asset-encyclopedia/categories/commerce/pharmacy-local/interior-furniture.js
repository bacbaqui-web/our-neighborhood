import * as T from 'three';
import {primitives} from '../local-detail/modular-primitives.js';
const cache=new Map();
function finish(kind,variant=0){const cacheKey=kind+variant;if(cache.has(cacheKey))return cache.get(cacheKey);const c=document.createElement('canvas');c.width=768;c.height=1024;const x=c.getContext('2d');const r=(a,b,w,h,color)=>{x.fillStyle=color;x.fillRect(a,b,w,h);};r(0,0,768,1024,'#e6e8dc');
 // Stable variants: related packages form small groups, never a tiled grid.
 let seed=719+variant*997;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const colors=['#437f70','#c48052','#688fa6','#a56575','#b5a044','#7f80a4'];
 const products=(left,bottom,span,maxHeight)=>{let a=left;while(a<left+span-30){const w=29+Math.floor(rnd()*53),h=maxHeight*(.40+rnd()*.56),color=colors[Math.floor(rnd()*colors.length)],style=Math.floor(rnd()*4),group=1+Math.floor(rnd()*3);for(let n=0;n<group&&a+w<left+span;n++){r(a,bottom-h,w,h,['#eee9d9','#dae3ce','#d4e2e7','#ebd8c9'][Math.floor(rnd()*4)]);if(style===0)r(a,bottom-h,w,h*.28,color);else if(style===1)r(a,bottom-h,w*.28,h,color);else if(style===2)r(a,bottom-h*.64,w,h*.22,color);else {r(a+4,bottom-h+5,w-8,h*.42,color);r(a+4,bottom-12,w-8,6,color);}r(a+6,bottom-24,w-12,3,'#7f8c81');r(a+6,bottom-17,(w-12)*.65,3,'#a0aa9b');a+=w+4;}a+=7+Math.floor(rnd()*15);}};
 if(kind==='sales'||kind==='low'){
  const rows=kind==='low'?3:5,usable=kind==='low'?920:740;
  r(18,20,732,usable,'#a7b7ab');
  for(let row=0;row<rows;row++){const y=30+row*usable/rows,step=usable/rows;products(30,y+step-14,708,step-22);r(18,y+step-14,732,14,'#f4f0df');}
  if(kind==='sales'){r(18,790,732,216,'#b9a98d');for(const a of [255,510])r(a,790,3,216,'#9b927e');for(const a of [210,300,465,555])r(a,832,7,62,'#6f7f76');}
 }else if(kind==='drawers'){
  // Upper shelves read above the reception counter; lower drawers stay flat.
  r(12,12,744,550,'#9fafaa');
  for(let row=0;row<4;row++){const y=18+row*135;products(22,y+122,724,115);r(12,y+122,744,10,'#f2eddf');}
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){const a=col*151+10,b=580+row*108;r(a,b,145,100,'#d3dcd0');r(a+43,b+14,62,21,'#f1efdf');r(a+45,b+69,58,7,'#7d8c80');}
 }else if(kind==='counter'){
  r(0,0,768,180,'#eeeadd');r(0,180,768,844,'#bca98d');for(let a=30;a<768;a+=110)r(a,180,2,844,'#ac9d85');r(0,920,768,104,'#7e887b');x.fillStyle='#4d716e';x.font='bold 70px sans-serif';x.fillText('처방전 접수',150,125);
 }else if(kind==='promo'){r(14,18,740,960,'#aabbb0');products(30,890,708,770);r(0,890,768,134,'#56877d');x.fillStyle='#fff6df';x.font='bold 65px sans-serif';x.fillText('건강 챙기기',175,980);
 }else if(kind==='notice'){r(18,18,732,988,'#fff4d9');r(18,18,732,210,'#517f79');x.textAlign='center';x.fillStyle='#fff7df';x.font='bold 92px sans-serif';x.fillText('이용 안내',384,160);x.fillStyle='#4d625b';x.font='bold 62px sans-serif';x.fillText('처방전은',384,390);x.fillText('접수대에 주세요',384,490);x.font='52px sans-serif';x.fillText('궁금한 점은',384,700);x.fillText('약사에게 문의',384,790);
 }else if(kind==='screen'){r(0,0,768,1024,'#425b60');r(36,40,696,140,'#b9d2cd');for(let row=0;row<7;row++){r(40,230+row*95,120,45,'#a1b9b1');r(190,230+row*95,525,18,'#708f88');}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const m=new T.MeshStandardMaterial({map:t,roughness:.95});cache.set(cacheKey,m);return m;}
export function interiorFurniture(key,{variant=0}={}){
 if(!['cabinet','drawers','counter','lowdisplay','bench','counter-display','counter-notice'].includes(key))return null;
 const {root,box,mat}=primitives('Pharmacy-'+key);const panel=(name,w,h,d,kind,y=h/2)=>box(name,0,y,0,w,h,d,[mat('#e1e4d5'),mat('#e1e4d5'),mat('#e6e6d8'),mat('#bcc6b6'),finish(kind,variant),mat('#d6decd')]);
 if(key==='cabinet')panel('SalesShelvesTexturedBlock',1.5,2.3,.45,'sales');
 if(key==='drawers')panel('DispensingDrawersTexturedBlock',1.8,2.3,.5,'drawers');
 if(key==='lowdisplay')panel('LowDisplayTexturedBlock',.9,.9,.45,'low');
 if(key==='counter'){panel('ReceptionTexturedBlock',1.8,.96,.70,'counter');box('Worktop',0,.99,0,1.8,.06,.70,'#eeeadd');box('Terminal',.48,1.13,-.10,.32,.22,.045,[mat('#64766c'),mat('#64766c'),mat('#64766c'),mat('#64766c'),finish('screen'),mat('#64766c')]);}
 if(key==='counter-display')panel('CounterProductTray',.48,.28,.24,'promo');
 if(key==='counter-notice')panel('CounterNotice',.22,.32,.025,'notice');
 if(key==='bench'){box('SeatBase',0,.25,0,1.25,.5,.42,'#b5a386');box('SeatCushion',0,.52,0,1.25,.08,.42,'#bfc9b5');box('Back',0,.74,-.17,1.25,.42,.08,'#cdd5bf');}
 root.userData={key,assetId:'commerce:pharmacy-local-'+key};return root;
}
