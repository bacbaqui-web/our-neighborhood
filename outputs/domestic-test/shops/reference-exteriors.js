import * as T from 'three';

// The references guide geometry and artwork, never a photograph on the facade.
export const referenceExteriors={
 'estate-01':{column:0,wall:0xa88363,frame:0xa5a69a},
 'estate-02':{column:1,wall:0x595950,frame:0xaaa99a},
 'estate-03':{column:2,wall:0x676963,frame:0x777e76},
};
const textures=['signs','vertical','main-signs'].map(name=>{const t=new T.Texture();t.colorSpace=T.SRGBColorSpace;t.name='EstateComic-'+name;t.userData.sharedShopInterior=true;return t;});
let ready;
export function prepareReferenceExteriors(){
 if(typeof document==='undefined')return Promise.resolve();
 return ready??=Promise.all(textures.map((t,i)=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{t.image=image;t.needsUpdate=true;resolve();};
  image.onerror=()=>{ready=null;reject(Error('가게 간판 그림을 불러오지 못했습니다. 새로고침해 주세요.'));};
  image.src=new URL('./textures/estate-comic/'+['signs','vertical','main-signs'][i]+'.png',import.meta.url).href;
 })));
}
export function buildReferenceExterior(spec){
 const id=spec.referenceExterior||spec.id,p=referenceExteriors[id];if(!p)return null;
 const root=new T.Group(),W=spec.width,H=spec.height;
 const mats=new Map();const material=color=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}));return mats.get(color);};
 const box=(name,x,y,z,w,h,d,color)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);m.name=name;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
 // Split only planar walls around windows, so internal subtraction seams cannot cast shadows.
 let pieces=[[-W/2,0,W/2,H]];
 for(const o of spec.openings){const cut=[o.x-o.w/2,o.y-o.h/2,o.x+o.w/2,o.y+o.h/2],next=[];for(const q of pieces){const l=Math.max(q[0],cut[0]),b=Math.max(q[1],cut[1]),r=Math.min(q[2],cut[2]),t=Math.min(q[3],cut[3]);if(l>=r||b>=t){next.push(q);continue;}if(q[0]<l)next.push([q[0],q[1],l,q[3]]);if(r<q[2])next.push([r,q[1],q[2],q[3]]);if(q[1]<b)next.push([l,q[1],r,b]);if(t<q[3])next.push([l,t,r,q[3]]);}pieces=next;}
 for(const [l,b,r,t]of pieces){const m=new T.Mesh(new T.PlaneGeometry(r-l,t-b),material(p.wall));m.name='SolidFacadeWall';m.position.set((l+r)/2,(b+t)/2,-.04);root.add(m);}
 box('LeftWallReturn',-W/2,H/2,-.15,.08,H,.3,p.wall);box('RightWallReturn',W/2,H/2,-.15,.08,H,.3,p.wall);
 box('RoofFlashing',0,H+.035,-.12,W+.12,.07,.4,0xa5aa9f);box('Threshold',0,.04,.08,W+.12,.08,.5,0xb1b1a4);
 for(const o of spec.openings){
  for(const dx of [-o.w/2,o.w/2])box('WindowJamb',o.x+dx,o.y,.025,.045,o.h,.18,p.frame);
  for(const dy of [-o.h/2,o.h/2])box('WindowRail',o.x,o.y+dy,.025,o.w,.045,.18,p.frame);
  if(o.panes>1)for(let i=1;i<o.panes;i++)box('WindowMullion',o.x-o.w/2+o.w*i/o.panes,o.y,.045,.035,o.h,.11,p.frame);
  if(o.door!==undefined)box('DoorHandle',o.x+o.w*.32,1.12,.15,.025,.42,.045,0xb8bcae);
 }
 // Only flat printed artwork is textured. Architecture above has solid materials.
 const rows=[.004,.272,.530,.757,.995];
 const decal=(name,x,y,w,h,row=0,{vertical=false,column=p.column,z=.13,region=null}={})=>{
  const colBounds=vertical?[.004,.328,.672,.996]:[.004,.334,.667,.996];
  let u0=colBounds[column]+.003,u1=colBounds[column+1]-.003,v0=vertical?.004:rows[row]+.004,v1=vertical?.996:rows[row+1]-.004;
  const wideMain=name==='MainSign'&&column<2;if(wideMain){u0=.004;u1=.996;v0=column/3+.004;v1=(column+1)/3-.004;}
  if(region){const [l,t,r,b]=region,du=u1-u0,dv=v1-v0;u1=u0+r*du;v1=v0+b*dv;u0+=l*du;v0+=t*dv;}
  const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)*(u1-u0),1-v1+uv.getY(i)*(v1-v0));
  const map=textures[wideMain?2:vertical?1:0],sign=name==='MainSign';const mat=new T.MeshStandardMaterial({color:0xffffff,map,emissiveMap:sign?map:null,roughness:1,side:T.DoubleSide});mat.userData.shopExterior=true;
  const m=new T.Mesh(g,mat);m.name=name;m.position.set(x,y,z);if(sign)m.userData.storefrontLightRole='sign';root.add(m);return m;
 };
 const signH=id==='estate-01'?1.0:id==='estate-03'?.95:.82,signY=H-signH/2-.02;
 box('Signboard',0,signY,.045,W-.18,signH,.22,0xb1b4a8);decal('MainSign',0,signY,W-.23,signH-.05,0,{z:.19});
 if(id==='estate-01'){
  decal('LeftListingCards',-1.65,1.18,2.18,.37,2);decal('LeftLowerAdvertising',-1.65,.65,2.18,.68,1);
  box('DoorVinylBacking',.24,.64,.10,.81,.68,.012,0x215caa);decal('DoorVinyl',.24,.64,.78,.30,3);decal('RightLowerAdvertising',1.82,.65,2.10,.68,1);
 }else if(id==='estate-02'){
  decal('DoorAdvertising',0,1.12,.86,1.82,0,{vertical:true,column:0});
  for(const x of [-1.12,1.12]){decal('ListingCards',x,1.75,.95,.46,2);decal('LowerAdvertising',x,.62,.95,.65,1);}
  for(const x of [-1.87,1.87]){box('TradePanelBacking',x,1.35,.10,.32,2.25,.015,0x252b35);for(let k=0;k<6;k++){const col=k%3,row=Math.floor(k/3);decal('TradePanelWord',x,2.25-k*.35,.30,.20,3,{region:[col/3,row/2,(col+1)/3,(row+1)/2]});}}
  for(let i=0;i<2;i++)box('EntryStep',0,-.07-i*.13,.28+i*.22,W+.12,.13,.42,0x989e84);
 }else{
  decal('DoorAdvertising',.58,1.37,.48,2.18,0,{vertical:true,column:1});
  decal('SideAdvertising',1.48,1.38,.42,2.38,0,{vertical:true,column:2});
  for(const x of [-1.28,-.38]){decal('WindowHeader',x,2.24,.80,.46,1);decal('ListingCards',x,1.65,.80,.48,2);decal('LowerListingCards',x,.65,.80,.40,2);}
 }
 root.userData={storefrontId:spec.id,category:spec.category,plantAnchors:[],referenceExterior:id,approvedOpenings:spec.openings,exterior:{kind:'modeled-facade-with-comic-decals',source:'asset-encyclopedia/shop-references.json',artwork:'generated comic signs and window vinyl only; no photograph surfaces'}};
 return root;
}
