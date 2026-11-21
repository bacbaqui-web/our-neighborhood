import {addInteriorFurniture} from './interior-furniture.js?v=shop50v2';
import {prepareComicShopArtwork} from './comic-artwork.js?v=shop50v2';
import {prepareReferenceExteriors} from './reference-exteriors.js?v=shop50v2';
import * as T from 'three';

export const shopInteriorCategories=['convenience','salon','laundry','estate','food','cafe','alley'];
const atlas=new T.Texture();atlas.colorSpace=T.SRGBColorSpace;atlas.name='ShopFurniture-v2';
// One atlas belongs to the module, not to any individual shop's lifetime.
atlas.userData.sharedShopInterior=true;
const tradeAtlas=new T.Texture();tradeAtlas.colorSpace=T.SRGBColorSpace;tradeAtlas.name='ShopTradeSurfaces';tradeAtlas.userData.sharedShopInterior=true;
let ready;
export async function prepareShopInteriors(){
 await Promise.all([prepareReferenceExteriors(),prepareComicShopArtwork()]);
 if(typeof document==='undefined')return Promise.resolve();
 return ready??=Promise.all([[atlas,'furniture-v2.png'],[tradeAtlas,'comic-interior/trade-surfaces.png']].map(([texture,file])=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{texture.image=image;texture.needsUpdate=true;resolve();};
  image.onerror=()=>reject(Error('가게 내부 텍스처를 불러오지 못했습니다: '+file));
  image.src=new URL('./textures/'+file,import.meta.url).href;
 }))).catch(e=>{ready=null;throw e;});
}
// Real rooms extend along local -Z, behind the facade. Each furnishing is
// only a cuboid (chairs use seat/back cuboids), with detail painted on its face.
export function addShopInteriors(root,spec){
 if(!shopInteriorCategories.includes(spec.category))return;
 const W=spec.width-.24,depth=spec.interiorDepth??Math.min(3.2,Math.max(2.2,W*.6));
 if(depth<.6)return;
 const bottom=Math.min(...spec.openings.map(o=>o.y-o.h/2))+.02,top=Math.max(...spec.openings.map(o=>o.y+o.h/2))+.16,H=top-bottom;
 const room=new T.Group();room.name='ShopInteriorRoom';
 const wall=new T.MeshStandardMaterial({color:0xc8bfae,roughness:1,side:T.DoubleSide,emissive:0xc8bfae,emissiveIntensity:.3});wall.userData={shopInterior:true,roomShell:true,baseColor:0xc8bfae};
 const shell=(name,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),wall);m.position.set(x,y,z);m.name=name;m.userData={shopInterior:true,storefrontLightRole:'interior',noPlacementCollision:true};room.add(m);};
 shell('InteriorBackWall',0,bottom+H/2,-depth,W,H,.08);
 for(const side of [-1,1])shell('InteriorSideWall',side*W/2,bottom+H/2,-depth/2,.08,H,depth);
 shell('InteriorFloor',0,bottom-.035,-depth/2,W,.07,depth);
 shell('InteriorCeiling',0,top+.035,-depth/2,W,.07,depth);
 const buffers=[{positions:[],normals:[],uvs:[],colors:[]},{positions:[],normals:[],uvs:[],colors:[]}],unit=new T.BoxGeometry(1,1,1).toNonIndexed();let boxes=0;
 const box=(name,x,y,z,w,h,d,tile,paint)=>{
  // Dimension units are normalized to the shop width/depth; furniture stays inside.
  x*=W;w*=W;z*=depth;d*=depth;y+=bottom;
  const trade=tile>=12,index=trade?tile-12:tile,rows=trade?4:3,{positions,normals,uvs,colors}=buffers[trade?1:0];
  const p=unit.attributes.position,n=unit.attributes.normal,uv=unit.attributes.uv,c=index%4,r=Math.floor(index/4),pad=.008;
  for(let i=0;i<p.count;i++){
   positions.push(x+p.getX(i)*w,y+p.getY(i)*h,z+p.getZ(i)*d);normals.push(n.getX(i),n.getY(i),n.getZ(i));
   const front=n.getZ(i)>.5,u=front?uv.getX(i):.98,v=front?uv.getY(i):.02;
   uvs.push((c+pad+u*(1-2*pad))/4,1-(r+1)/rows+(pad+v*(1-2*pad))/rows);
   const tint=n.getY(i)>.5?.95:n.getX(i)!==0?.65:1;const col=new T.Color(paint??0xffffff);colors.push(tint*col.r,tint*col.g,tint*col.b);
  }
  room.userData.furniture??=[];room.userData.furniture.push({name,center:[x,y,z],size:[w,h,d],tile});boxes++;
 };
 addInteriorFurniture(box,spec,W,depth);
 unit.dispose();let furnitureMeshes=0;
 for(const [index,{positions,normals,uvs,colors}]of buffers.entries()){
  if(!positions.length)continue;
  const g=new T.BufferGeometry();for(const [key,array,size]of [['position',positions,3],['normal',normals,3],['uv',uvs,2],['color',colors,3]])g.setAttribute(key,new T.Float32BufferAttribute(array,size));
  const texture=index?tradeAtlas:atlas,material=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:.45,roughness:1});material.userData.shopInterior=true;
  const mesh=new T.Mesh(g,material);mesh.name=index?'ShopInteriorTradeFurniture':'ShopInteriorFurniture';mesh.userData={shopInterior:true,storefrontLightRole:'interior',noPlacementCollision:true};mesh.castShadow=true;mesh.receiveShadow=true;room.add(mesh);furnitureMeshes++;
 }
 root.add(room);
 root.userData.interior={kind:'room-with-textured-cuboids',category:spec.category,depth,bottom,top,boxes,triangles:60+boxes*12,furnitureMeshes,atlas:'furniture-v2.png',source:'generated furniture surfaces; inferred trade layout'};
}
export function applyInteriorEmission(material,{on,night,line=false}){
 if(!material.userData.shopInterior)return false;
 const shell=material.userData.roomShell,base=material.userData.baseColor??0xffffff;
 material.color.set(base).multiplyScalar(on?.65:.22);
 material.emissive.set(base);if(material.userData.interiorMonochrome){const c=material.color,l=.2126*c.r+.7152*c.g+.0722*c.b;c.setScalar(l);const e=material.emissive;e.setScalar(.2126*e.r+.7152*e.g+.0722*e.b);}material.emissiveIntensity=line?0:on*(shell?.24:.45)*(1+Math.max(0,Math.min(1,night))*.25);
 return true;
}

export function applyInteriorStyle(material,original,style){
 if(!original.userData.shopInterior&&!original.userData.shopExterior)return;
 material.map=original.map;material.emissiveMap=original.emissiveMap;material.vertexColors=original.vertexColors;
 material.userData={...original.userData,interiorMonochrome:style!=='color'};
 if(style!=='color'){
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\ngl_FragColor.rgb=vec3(dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722)));');};
  material.customProgramCacheKey=()=> 'shop-interior-gray-v2';
 }
}
