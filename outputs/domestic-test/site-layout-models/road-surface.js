import * as T from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

const polygons=g=>g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
function seeded(seed=24){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function canvasTexture(w,h,paint,repeat=false){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;
 if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;
 return t;
}
function grain(ctx,w,h,base,seed=24){
 const random=seeded(seed),im=ctx.createImageData(w,h);
 for(let i=0;i<im.data.length;i+=4){const n=(random()-.5)*16+(random()<.035?(random()-.5)*24:0);
  for(let j=0;j<3;j++)im.data[i+j]=base[j]+n;im.data[i+3]=255;
 }ctx.putImageData(im,0,0);
}
export function createAsphaltMaterial({textures=true}={}){
 return new T.MeshStandardMaterial({color:textures?0xffffff:0x50585b,roughness:1,
  map:textures?canvasTexture(512,512,(ctx,w,h)=>grain(ctx,w,h,[77,82,85]),true):null});
}
export function setWorldRoadUV(geo){
 const p=geo.attributes.position,uv=[];
 for(let i=0;i<p.count;i++)uv.push(p.getX(i)/3,p.getZ(i)/3);
 geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
}
// No vertex displacement or edge ink: all markings sit a few millimetres above
// the asphalt and are combined by material. Only the speed hump has volume.
export function createRoadSurface(data,{textures=true}={}){
 const group=new T.Group();group.name='도로 표면';const bins=new Map();
 const standard=(c,map=null)=>new T.MeshStandardMaterial({color:c,map,roughness:.94,side:T.DoubleSide});
 const yellow=standard(0xe5b83c),white=standard(0xe0ddc9),patchMats=[0x42494c,0x555b5c,0x484f51].map(c=>standard(c));
 if(textures){
  const worn=canvasTexture(256,256,(ctx,w,h)=>{const random=seeded(18);ctx.fillStyle='white';ctx.fillRect(0,0,w,h);for(let i=0;i<2400;i++){ctx.fillStyle=`rgb(${210+Math.floor(random()*45)} ${210+Math.floor(random()*45)} ${210+Math.floor(random()*45)})`;ctx.fillRect(random()*w,random()*h,1,1);}},true);
  yellow.map=white.map=worn;
  for(let i=0;i<patchMats.length;i++)patchMats[i].map=canvasTexture(256,256,(ctx,w,h)=>grain(ctx,w,h,[224,224,224],80+i),true);
 }
 function add(geo,mat,shadow=false){const key=mat.uuid+shadow;if(!bins.has(key))bins.set(key,{mat,gs:[],shadow});bins.get(key).gs.push(geo);}
 function polygon(g,mat,y=.009){for(const rs of polygons(g)){
  const sh=new T.Shape(rs[0].map(([x,z])=>new T.Vector2(x,-z)));
  for(const h of rs.slice(1))sh.holes.push(new T.Path(h.map(([x,z])=>new T.Vector2(x,-z))));
  const geo=new T.ShapeGeometry(sh);geo.rotateX(-Math.PI/2);geo.translate(0,y,0);setWorldRoadUV(geo);add(geo,mat);
 }}
 function localGeo(vertices,indices,c,u,uv){
  const n=[-u[1],u[0]],v=[];for(let i=0;i<vertices.length;i+=3){const x=vertices[i],y=vertices[i+1],z=vertices[i+2];v.push(c[0]+u[0]*x+n[0]*z,y,c[1]+u[1]*x+n[1]*z);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(indices);
  if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));else setWorldRoadUV(g);g.computeVertexNormals();return g;
 }
 function quad(c,u,length,width,y,mat){add(localGeo([-length/2,y,-width/2,length/2,y,-width/2,length/2,y,width/2,-length/2,y,width/2],[0,2,1,0,3,2],c,u,[0,1,1,1,1,0,0,0]),mat);}
 polygon(data.yellowSolid,yellow);polygon(data.yellowDashed,yellow);
 const seamMat=standard(0x353c3e);
 for(const p of data.patches){polygon(p.geometry,patchMats[p.shade],.004);if(p.seam)polygon(p.seam,seamMat,.005);}
 const manholeMaps={};
 for(const type of ['round','square']){
  const map=textures?canvasTexture(256,256,(ctx,w,h)=>{
   ctx.fillStyle='#424b4b';ctx.strokeStyle='#8b9085';ctx.lineWidth=6;ctx.beginPath();
   if(type==='round')ctx.arc(128,128,118,0,Math.PI*2);else ctx.rect(12,12,232,232);
   ctx.fill();ctx.stroke();ctx.save();ctx.clip();ctx.strokeStyle='#626d68';ctx.lineWidth=3;
   for(let q=-256;q<512;q+=15){ctx.beginPath();ctx.moveTo(q,0);ctx.lineTo(q+256,256);ctx.stroke();ctx.beginPath();ctx.moveTo(q,0);ctx.lineTo(q-256,256);ctx.stroke();}
   ctx.restore();ctx.fillStyle='#313b3c';ctx.fillRect(53,120,23,9);ctx.fillRect(181,120,23,9);
   ctx.fillStyle='#848a80';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('하수',128,105);
  }):null;
  manholeMaps[type]=standard(textures?0xffffff:0x485352,map);if(map){manholeMaps[type].transparent=true;manholeMaps[type].alphaTest=.4;}
 }
 for(const m of data.manholes)quad(m.center,m.u,m.diameter,m.diameter,.013,manholeMaps[m.shape]);
 const parkMap=textures?canvasTexture(1024,384,(ctx,w,h)=>{
  ctx.strokeStyle='#eeeadd';ctx.lineWidth=14;ctx.strokeRect(10,10,w-20,h-20);
  ctx.fillStyle='#eeeadd';ctx.textAlign='center';ctx.font='bold 91px sans-serif';ctx.fillText('거주자우선',w/2,237);
 }):null;
 const parkMat=standard(textures?0xffffff:0xe6e1d3,parkMap);if(parkMap){parkMat.transparent=true;parkMat.alphaTest=.4;}
 for(const p of data.parking){
  if(textures)quad(p.center,p.u,p.length,p.width,.015,parkMat);
  else{const cs=p.geometry.coordinates[0];for(let i=1;i<cs.length;i++){const a=cs[i-1],b=cs[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);quad([(a[0]+b[0])/2,(a[1]+b[1])/2],[(b[0]-a[0])/L,(b[1]-a[1])/L],L,.07,.015,parkMat);}}
 }
 const humpMat=standard(0xffffff,textures?canvasTexture(512,512,(ctx,w,h)=>{
  grain(ctx,w,h,[201,168,65],72);ctx.save();ctx.fillStyle='#deded1';
  for(let i=-w*2;i<w*3;i+=128){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+64,0);ctx.lineTo(i+64+w,h);ctx.lineTo(i+w,h);ctx.closePath();ctx.fill();}ctx.restore();
 },true):null);
 for(const h of data.humps){
  const v=[],uv=[],idx=[],segments=12;
  for(let i=0;i<=segments;i++){const t=i/segments,y=.006+h.height*Math.sin(t*Math.PI);for(const side of [-1,1]){v.push((t-.5)*h.length,y,side*h.width/2);uv.push(t,side===-1?0:h.width/3);}}
  for(let i=0;i<segments;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  add(localGeo(v,idx,h.center,h.u,uv),humpMat,true);
 }
 for(const {mat,gs,shadow} of bins.values()){
  const merged=mergeGeometries(gs.map(g=>g.index?g.toNonIndexed():g),false);const m=new T.Mesh(merged,mat);m.receiveShadow=true;m.castShadow=shadow;group.add(m);for(const g of gs)g.dispose();
 }
 const qa={drawCalls:group.children.length,triangles:0,finite:true};
 group.traverse(m=>{if(!m.geometry)return;qa.triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;for(const v of m.geometry.attributes.position.array)qa.finite&&=Number.isFinite(v);});group.userData.qa=qa;return group;
}
