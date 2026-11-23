import * as T from 'three';
import {primitives} from './modular-primitives.js';
import {shapeTools} from './modular-shapes.js';
import {surface} from './modular-textures.js';
export const PREFIX='commerce:seven-local-';
export const definitions={
 body:{name:'SEVENA · 소품 없는 점포 본체',size:[9.65,5.92,3.65],role:'storefront'},
 sign:{name:'SEVENA · 9칸 간판',size:[9.49,1.72,.38],role:'display'},
 awning:{name:'짙은 녹색 점포 차양',size:[9.6,.40,1.5],role:'display'},
 rack:{name:'만화풍 상품 진열대',size:[1.25,2.1,.5],role:'display'},
 'narrow-rack':{name:'슬림 상품 진열대',size:[.78,2.1,.5],role:'display'},
 freezer:{name:'유리 뚜껑 냉동고',size:[1.35,1.14,.85],role:'display'},
 packs:{name:'포장상품 묶음',size:[1.2,1.50,.5],role:'display'},
 picnic:{name:'목재 테이블·벤치',size:[1.95,.85,1.95],role:'display'},
 umbrella:{name:'녹색·흰색 파라솔',size:[4.04,3.38,4.04],footprint:[.18,.18],role:'display'},
 table:{name:'녹색 원형 테이블',size:[1.2,.78,1.2],role:'display'},
 chair:{name:'녹색 플라스틱 의자',size:[.58,1.03,.55],role:'display'},
 fridge:{name:'실내 음료 냉장고',size:[1.45,2.35,.65],role:'service'},
 checkout:{name:'편의점 계산대',size:[1.6,1.05,.75],role:'service'},
 light:{name:'편의점 천장등',size:[1.80,.08,.20],role:'service'},
};
export function createPart(key){
 if(!definitions[key])throw Error('등록되지 않은 편의점 부품: '+key);
 const kit=primitives(definitions[key].name),{root,box,rod,mat}=kit;
 const shapes=shapeTools(kit,surface('logo')),cream=mat('#cbd0bd');
 const furniture=(n,x,y,z,w,h,d,front)=>box(n,x,y,z,w,h,d,[cream,cream,cream,cream,surface(front),cream]);
 const steel='#84907e',green='#28573f';
 if(key==='body'){
  box('BackWall',0,1.86,-3.2,9.4,3.72,.12,surface('wall'));
  box('Floor',0,.06,-1.55,9.4,.12,3.5,surface('floor'));
  box('Ceiling',0,3.72,-1.55,9.4,.10,3.5,surface('ceiling'));
  for(const x of [-4.70,4.70])box('SideWall',x,1.90,-1.55,.14,3.8,3.5,surface('wall'));
  for(const x of [-4.65,-.12,4.65])box('FacadePier',x,1.90,-.05,x===-.12?.38:.28,3.8,.45,surface('wall'));
  box('SignBacking',0,4.93,-.20,9.65,1.98,.48,surface('wall'));
  for(const [l,r]of [[-4.48,-1.60],[-1.54,-.40],[.10,4.48]]){
   const w=r-l,c=(l+r)/2;
   for(const y of [.20,2.67,3.60])box('WindowRail',c,y,.15,w,.045,.10,steel);
   for(const x of [l,r])box('WindowJamb',x,1.9,.15,.045,3.45,.10,steel);
   if(w>2)box('Mullion',c,1.9,.15,.035,3.45,.08,steel);
   const glazing=new T.Mesh(new T.PlaneGeometry(w-.06,3.35),new T.MeshStandardMaterial({color:'#a6b7a3',transparent:true,opacity:.11,roughness:.3,depthWrite:false,side:T.DoubleSide}));glazing.name='WindowGlass';glazing.position.set(c,1.91,.11);root.add(glazing);
  }
  rod('DoorHandle',[-.57,1.05,.30],[-.57,1.48,.30],.017,steel);
  for(const y of [1.05,1.48])rod('DoorHandleMount',[-.57,y,.15],[-.57,y,.30],.012,steel);
  box('DoorThreshold',-.97,.09,.28,1.25,.10,.42,'#aab09d');
  root.userData.slots={sign:[0,4.98,.14],awning:[0,3.94,.73]};
 }else if(key==='sign'){
  const h=1.58,cw=1.48,pw=(9.35-cw)/8;box('SignHousing',0,.86,0,9.48,1.72,.30,'#303d32');
  for(const side of [-1,1])for(let i=0;i<4;i++){const x=side*(cw/2+pw*(i+.5));box('SignPanel',x,.86,.165,pw-.035,h,.035,'#e5e8db');for(const [dy,hh,c]of [[.48,.21,'#ee8453'],[-.01,.32,'#286746'],[-.52,.20,'#db5143']])box('Stripe',x,.86+dy,.189,pw-.045,hh,.01,c);}
  box('AlteredLogo',0,.86,.18,cw-.035,h,.03,[cream,cream,cream,cream,surface('logo'),cream]);
 }else if(key==='awning'){
  const roof=box('Canopy',0,.30,0,9.6,.08,1.42,green);roof.rotation.x=.055;
  box('Valance',0,.16,.70,9.6,.27,.07,green);for(const y of [.025,.295])box('Hem',0,y,.74,9.6,.025,.025,'#b3bca4');
  box('AlteredWordmark',4.03,.16,.746,.75,.15,.008,surface('wordmark'));
  for(const x of [-4.55,4.55])rod('CanopyBracket',[x,.0,-.66],[x,.27,.68],.018,steel);
 }else if(key==='rack'||key==='narrow-rack'||key==='fridge'){
  const [w,h,d]=definitions[key].size;furniture(key,0,h/2,0,w,h,d,'shelf');
  for(const x of [-w/2,w/2])box('SideFrame',x,h/2,d/2+.02,.045,h,.07,'#c6cebb');
  if(key==='fridge'){box('DoorDivider',0,h/2,d/2+.04,.035,h,.035,steel);box('DoorPull',.12,1.15,d/2+.08,.025,.40,.03,steel);}
 }else if(key==='freezer'){
  furniture('FreezerBody',0,.51,0,1.30,1.02,.8,'freezer');box('LidRim',0,1.06,0,1.35,.06,.85,steel);box('LidGlass',0,1.10,0,1.22,.025,.72,'#b1c2b0');box('LidTrack',0,1.12,0,.035,.025,.78,'#d4dac8');
 }else if(key==='packs')furniture('PackagedGoods',0,.75,0,1.2,1.5,.5,'packs');
 else if(key==='picnic')shapes.picnic(0,0);
 else if(key==='umbrella')shapes.umbrella(0,0);
 else if(key==='table')shapes.greenTable(0,0);
 else if(key==='chair')shapes.chair(0,0,0);
 else if(key==='checkout'){
  box('Counter',0,.45,0,1.6,.9,.75,'#b7bfaa');box('CounterTop',0,.93,0,1.65,.06,.80,'#677b64');box('RegisterBase',.42,1.0,-.08,.30,.12,.28,'#536450');
 }else if(key==='light'){
  box('LightHousing',0,.04,0,1.8,.08,.2,'#c8d0bd');const diffuser=box('LightDiffuser',0,-.005,0,1.72,.025,.15,'#e4ebd7');diffuser.material=diffuser.material.clone();diffuser.material.emissive.set('#e4ebd7');diffuser.material.emissiveIntensity=.65;
 }
 if(key==='sign')root.traverse(o=>{
  if(!['SignPanel','Stripe','AlteredLogo'].includes(o.name))return;
  const prepare=m=>{const copy=m.clone();copy.emissive.copy(copy.color);copy.emissiveMap=copy.map;copy.emissiveIntensity=.12;copy.userData={...copy.userData,litSign:true};return copy;};
  o.material=Array.isArray(o.material)?o.material.map(prepare):prepare(o.material);
 });
 root.userData={...root.userData,assetId:PREFIX+key,key,dimensionsEstimated:true};return root;
}
