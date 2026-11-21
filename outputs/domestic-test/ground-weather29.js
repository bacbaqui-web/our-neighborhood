import * as T from 'three';

// Shared colour maps only. No extra meshes, displaced vertices, or crack decals.
// All marks use world metres so separate parcel surfaces meet without UV seams.
const maps=new Map(),materials=new Set();
const TILE=12,SIZE=1024;
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function paint(kind){
 const c=typeof document==='undefined'?new OffscreenCanvas(SIZE,SIZE):document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d'),r=rng(kind==='concrete'?2901:2902),cement=kind==='concrete';
 const base=cement?[183,183,173]:[76,80,80],image=ctx.createImageData(SIZE,SIZE),tau=Math.PI*2;
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const i=(y*SIZE+x)*4,cloud=Math.sin(tau*(x/SIZE+y/SIZE*2))*.34+Math.cos(tau*(x/SIZE*3-y/SIZE))*.24+Math.sin(tau*(x/SIZE*7+y/SIZE*4))*.15;
  const noise=(r()-.5)*(cement?17:23)+cloud*(cement?15:9)+(r()<.04?(r()-.5)*38:0);
  for(let k=0;k<3;k++)image.data[i+k]=base[k]+noise;image.data[i+3]=255;
 }ctx.putImageData(image,0,0);
 const wrap=draw=>{for(const dx of [-SIZE,0,SIZE])for(const dy of [-SIZE,0,SIZE]){ctx.save();ctx.translate(dx,dy);draw();ctx.restore();}};
 // Irregular overlapping moisture / dust stains, never one uniform dirty layer.
 for(let i=0;i<(cement?22:18);i++){
  const x=r()*SIZE,y=r()*SIZE,a=24+r()*100,b=18+r()*65,angle=r()*tau,alpha=.06+r()*.12;
  wrap(()=>{ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(a,b);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,cement?`rgba(81,75,55,${alpha})`:`rgba(23,28,27,${alpha*1.5})`);g.addColorStop(1,'rgba(45,47,39,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();});
 }
 // Small chipped areas expose aggregate, surrounded by largely intact concrete.
 for(let i=0;i<(cement?8:5);i++){
  const x=r()*SIZE,y=r()*SIZE,R=10+r()*(cement?20:27),points=Array.from({length:13},(_,j)=>{const a=j/13*tau,rad=R*(.65+r()*.5);return [x+Math.cos(a)*rad,y+Math.sin(a)*rad*.6];});
  const stones=Array.from({length:75},()=>({x:x+(r()-.5)*R*2,y:y+(r()-.5)*R*1.3,s:.5+r()*2.3,c:r()}));
  wrap(()=>{ctx.save();ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=cement?'rgba(117,119,110,.25)':'rgba(43,48,47,.34)';ctx.fill();ctx.clip();for(const s of stones){ctx.fillStyle=s.c>.48?'rgba(220,219,206,.32)':'rgba(65,68,62,.30)';ctx.fillRect(s.x,s.y,s.s,s.s*.7);}ctx.restore();});
 }
 function crack(x,y,angle,length,width,branch=true){
  const points=[[x,y]],count=Math.max(5,Math.ceil(length/11));let a=angle;
  for(let i=0;i<count;i++){a+=(r()-.5)*.78;x+=Math.cos(a)*length/count;y+=Math.sin(a)*length/count;points.push([x,y]);}
  wrap(()=>{ctx.lineJoin='round';ctx.lineCap='round';for(const [w,col]of [[width+2.1,cement?'rgba(91,86,68,.10)':'rgba(21,25,24,.12)'],[width,cement?'rgba(67,69,59,.51)':'rgba(25,29,28,.66)'],[width*.3,'rgba(29,33,29,.27)']]){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}});
  if(branch){for(const t of [.35,.7]){const p=points[Math.floor(count*t)];crack(p[0],p[1],angle+(r()>.5?1:-1)*(.6+r()*.8),length*(.2+r()*.22),width*.5,false);}}
 }
 for(let i=0;i<(cement?15:10);i++){
  const x=r()*SIZE,y=r()*SIZE,angle=r()*tau,length=65+r()*145;
  crack(x,y,angle,length,.75+r()*.75);if(i%3===0)crack(x,y,angle+2.4,length*.7,.75);
 }
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;map.name='GroundWeather29-'+kind;
 return map;
}
export function groundWeatherEnabled(){return new URLSearchParams(globalThis.location?.search||'').get('groundWear')!=='old';}
export function createWeatheredGroundMaterial(kind='concrete'){
 if(!maps.has(kind))maps.set(kind,paint(kind));
 const enabled=groundWeatherEnabled(),material=new T.MeshStandardMaterial({color:enabled?0xffffff:kind==='concrete'?0xc7c7bb:0x50585b,map:enabled?maps.get(kind):null,roughness:1,side:T.DoubleSide});
 material.userData.groundWeather29={kind,tileMetres:TILE};materials.add(material);return material;
}
export function setGroundWeatherUV(geometry){
 const p=geometry.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)/TILE;uv[i*2+1]=p.getZ(i)/TILE;}geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
}
export function setGroundWeatherEnabled(enabled){
 for(const m of materials){m.map=enabled?maps.get(m.userData.groundWeather29.kind):null;m.color.set(enabled?0xffffff:m.userData.groundWeather29.kind==='concrete'?0xc7c7bb:0x50585b);m.needsUpdate=true;}
}
export function groundWeatherStats(){return {enabled:groundWeatherEnabled(),textures:maps.size,resolution:SIZE,tileMetres:TILE,addedTriangles:0};}
