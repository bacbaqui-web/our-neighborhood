import * as T from 'three';

const textures=new Map();let ready;
function textureFor(file){
 if(!textures.has(file)){const t=new T.Texture();t.name='ShopComic-'+file;t.colorSpace=T.SRGBColorSpace;t.userData.sharedShopInterior=true;textures.set(file,t);}
 return textures.get(file);
}
export function prepareComicShopArtwork(){
 if(typeof document==='undefined')return Promise.resolve();
 return ready??=(async()=>{
  const response=await fetch(new URL('./textures/comic-manifest.json?v=shop50v2',import.meta.url));
  if(!response.ok)throw Error('가게 간판 목록을 불러오지 못했습니다. 새로고침해 주세요.');
  const data=await response.json();
  if(!Array.isArray(data.files)||data.files.some(f=>typeof f!=='string'||!/^comic-[a-z-]+\/[a-z0-9_-]+\.(?:png|webp)$/.test(f)))throw Error('가게 간판 파일 목록이 올바르지 않습니다.');
  await Promise.all(data.files.map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const t=textureFor(file);t.image=image;t.needsUpdate=true;resolve();};image.onerror=()=>reject(Error('가게 간판 그림을 불러오지 못했습니다: '+file));image.src=new URL('./textures/'+file,import.meta.url).href;})));
 })().catch(e=>{ready=null;throw e;});
}
export function addComicShopArtwork(root,spec){
 if(!spec.comicArtwork?.length)return;
 const group=new T.Group();group.name='ComicShopArtwork';
 for(const [i,a]of spec.comicArtwork.entries()){
  const [l,t,r,b]=a.rect,g=new T.PlaneGeometry(a.w,a.h),uv=g.attributes.uv;
  // Inset two pixels worth at atlas borders prevents adjacent tile bleed.
  const map=textureFor(a.file),padU=Math.min((r-l)/100,.0015),padV=Math.min((b-t)/100,.0015);
  for(let j=0;j<uv.count;j++)uv.setXY(j,l+padU+uv.getX(j)*(r-l-2*padU),1-b+padV+uv.getY(j)*(b-t-2*padV));
  const sign=a.role==='sign',mat=new T.MeshStandardMaterial({color:0xffffff,map,emissiveMap:sign?map:null,roughness:1,side:T.DoubleSide});mat.userData.shopExterior=true;
  const m=new T.Mesh(g,mat);m.name='Comic-'+a.role+'-'+i;m.position.set(a.x,a.y,a.z);if(a.rotationY)m.rotation.y=a.rotationY;
  m.userData={comicShopArtwork:true,noPlacementCollision:true};if(sign)m.userData.storefrontLightRole='sign';group.add(m);
 }
 root.add(group);root.userData.exterior={kind:'modeled-facade-with-comic-decals',profile:spec.comicProfile,artworkCount:spec.comicArtwork.length,source:spec.source};
 root.userData.textFree=false;
}
