import * as T from 'three';

export const shopInteriorCategories=['convenience','salon','laundry','estate','food','cafe'];
const atlas=new T.Texture();atlas.colorSpace=T.SRGBColorSpace;atlas.name='ShopFurniture-v2';
// One atlas belongs to the module, not to any individual shop's lifetime.
atlas.userData.sharedShopInterior=true;
let ready;
export function prepareShopInteriors(){
 if(typeof document==='undefined')return Promise.resolve();
 return ready??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{atlas.image=image;atlas.needsUpdate=true;resolve();};
  image.onerror=()=>{ready=null;reject(Error('가게 내부 텍스처를 불러오지 못했습니다. 새로고침해 주세요.'));};
  image.src=new URL('./textures/furniture-v2.png',import.meta.url).href;
 });
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
 const positions=[],normals=[],uvs=[],colors=[],unit=new T.BoxGeometry(1,1,1).toNonIndexed();let boxes=0;
 const box=(name,x,y,z,w,h,d,tile)=>{
  // Dimension units are normalized to the shop width/depth; furniture stays inside.
  x*=W;w*=W;z*=depth;d*=depth;y+=bottom;
  const p=unit.attributes.position,n=unit.attributes.normal,uv=unit.attributes.uv,c=tile%4,r=Math.floor(tile/4),pad=.003;
  for(let i=0;i<p.count;i++){
   positions.push(x+p.getX(i)*w,y+p.getY(i)*h,z+p.getZ(i)*d);normals.push(n.getX(i),n.getY(i),n.getZ(i));
   const front=n.getZ(i)>.5,u=front?uv.getX(i):.98,v=front?uv.getY(i):.02;
   uvs.push((c+pad+u*(1-2*pad))/4,1-(r+1)/3+(pad+v*(1-2*pad))/3);
   const tint=n.getY(i)>.5?.95:n.getX(i)!==0?.65:1;colors.push(tint,tint,tint);
  }
  room.userData.furniture??=[];room.userData.furniture.push({name,center:[x,y,z],size:[w,h,d],tile});boxes++;
 };
 const chair=(x,z)=>{box('chair-base',x,.23,z,.08,.46,.11,5);box('chair-back',x,.78,z-.045,.08,.64,.035,5);};
 const counter=(tile=3)=>box('counter',-.23,.52,-.74,.4,1.04,.2,tile);
 if(spec.category==='convenience'){
  box('refrigerator',.28,1.03,-.88,.34,2.06,.16,1);box('back-stock-shelf',-.25,1.02,-.88,.42,2.04,.16,0);
  box('aisle-stock-shelf',-.20,.7,-.42,.35,1.4,.18,0);box('checkout',.3,.52,-.27,.23,1.04,.18,2);
 }else if(spec.category==='salon'){
  for(const x of [-.25,.25]){box('wall-mirror',x,1.45,-.95,.25,1.1,.025,4);box('vanity',x,.52,-.8,.28,1.04,.16,3);chair(x,-.5);}
 }else if(spec.category==='laundry'){
  box('garment-rack',-.18,1.1,-.87,.57,2.2,.2,6);box('folded-linen-cabinet',.3,.95,-.87,.25,1.9,.2,7);box('service-counter',-.12,.5,-.35,.52,1,.2,7);
 }else if(spec.category==='estate'){
  box('property-board',0,1.6,-.97,.76,.85,.025,9);
  for(const x of [-.24,.24]){box('desk',x,.39,-.62,.32,.78,.22,8);chair(x,-.32);}
 }else{
  counter(spec.category==='cafe'?11:10);box('back-cabinet',.25,.65,-.85,.32,1.3,.2,spec.category==='cafe'?3:10);
  for(const x of [-.26,.26]){box('table-base',x,.35,-.52,.12,.7,.12,3);box('table-top',x,.74,-.52,.25,.08,.22,3);chair(x,-.35);}
 }
 unit.dispose();const g=new T.BufferGeometry();for(const [key,array,size]of [['position',positions,3],['normal',normals,3],['uv',uvs,2],['color',colors,3]])g.setAttribute(key,new T.Float32BufferAttribute(array,size));
 const material=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:atlas,emissiveMap:atlas,emissive:0xffffff,emissiveIntensity:.45,roughness:1});material.userData.shopInterior=true;
 const mesh=new T.Mesh(g,material);mesh.name='ShopInteriorFurniture';mesh.userData={shopInterior:true,storefrontLightRole:'interior',noPlacementCollision:true};mesh.castShadow=true;mesh.receiveShadow=true;room.add(mesh);root.add(room);
 root.userData.interior={kind:'room-with-textured-cuboids',category:spec.category,depth,bottom,top,boxes,triangles:60+boxes*12,furnitureMeshes:1,atlas:'furniture-v2.png',source:'generated furniture surfaces; inferred trade layout'};
}
export function applyInteriorEmission(material,{on,night,line=false}){
 if(!material.userData.shopInterior)return false;
 const shell=material.userData.roomShell,base=material.userData.baseColor??0xffffff;
 material.color.set(base).multiplyScalar(on?.65:.22);
 material.emissive.set(base);if(material.userData.interiorMonochrome){const c=material.color,l=.2126*c.r+.7152*c.g+.0722*c.b;c.setScalar(l);const e=material.emissive;e.setScalar(.2126*e.r+.7152*e.g+.0722*e.b);}material.emissiveIntensity=line?0:on*(shell?.24:.45)*(1+Math.max(0,Math.min(1,night))*.25);
 return true;
}

export function applyInteriorStyle(material,original,style){
 if(!original.userData.shopInterior)return;
 material.map=original.map;material.emissiveMap=original.emissiveMap;material.vertexColors=original.vertexColors;
 material.userData={...original.userData,interiorMonochrome:style!=='color'};
 if(style!=='color'){
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\ngl_FragColor.rgb=vec3(dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722)));');};
  material.customProgramCacheKey=()=> 'shop-interior-gray-v2';
 }
}
