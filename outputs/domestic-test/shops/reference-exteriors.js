import * as T from 'three';

// Approved photographs, sampled directly: lettering is never regenerated.
// Rectangles use source-image coordinates [left, top, right, bottom].
export const referenceExteriors={
 'estate-01':{crop:[0,.10,1,.87],signBottom:.38,wall:0x9d7856,holes:[[.075,.445,.45,.50],[.515,.445,.635,.65],[.65,.445,.99,.65]]},
 'estate-02':{crop:[.08,.15,.90,.93],signBottom:.40,wall:0x55514a,holes:[[.39,.44,.56,.51],[.60,.67,.75,.74]]},
 'estate-03':{crop:[.035,.005,.98,.93],signBottom:.325,wall:0x555b58,holes:[[.59,.54,.625,.82],[.76,.54,.79,.82]]},
};
const textures=new Map(Object.keys(referenceExteriors).map(id=>{const t=new T.Texture();t.colorSpace=T.SRGBColorSpace;t.userData.sharedShopInterior=true;return[id,t];}));
let ready;
export function prepareReferenceExteriors(){
 if(typeof document==='undefined')return Promise.resolve();
 return ready??=Promise.all([...textures].map(([id,t])=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{t.image=image;t.needsUpdate=true;resolve();};
  image.onerror=()=>{ready=null;reject(Error('가게 외관 사진을 불러오지 못했습니다. 새로고침해 주세요.'));};
  image.src=new URL('./textures/estate-exteriors/'+id+'.jpg',import.meta.url).href;
 })));
}
export function buildReferenceExterior(spec){
 const id=spec.referenceExterior||spec.id,p=referenceExteriors[id];if(!p)return null;
 const root=new T.Group(),W=spec.width,H=spec.height,[l,t,r,b]=p.crop;
 const x=u=>(u-l)/(r-l)*W-W/2,y=v=>(b-v)/(b-t)*H;
 const backing=new T.MeshStandardMaterial({color:p.wall,roughness:1});
 const box=(xx,yy,zz,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),backing);m.position.set(xx,yy,zz);root.add(m);};
 // Only the perimeter has thickness. Window openings stay physically open.
 box(-W/2-.025,H/2,-.15,.05,H,.3);box(W/2+.025,H/2,-.15,.05,H,.3);
 box(0,H+.025,-.15,W+.1,.05,.35);box(0,-.04,-.08,W+.1,.08,.4);
 for(const [role,rect]of [['sign',[l,t,r,p.signBottom]],['wall',[l,p.signBottom,r,b]]]){
  let pieces=[rect];
  for(const cut of p.holes){const next=[];for(const q of pieces){const a=Math.max(q[0],cut[0]),c=Math.min(q[2],cut[2]),d=Math.max(q[1],cut[1]),e=Math.min(q[3],cut[3]);if(a>=c||d>=e){next.push(q);continue;}if(q[0]<a)next.push([q[0],q[1],a,q[3]]);if(c<q[2])next.push([c,q[1],q[2],q[3]]);if(q[1]<d)next.push([a,q[1],c,d]);if(e<q[3])next.push([a,e,c,q[3]]);}pieces=next;}
  const pos=[],uv=[];for(const [a,d,c,e]of pieces)for(const [u,v]of [[a,e],[c,e],[c,d],[a,e],[c,d],[a,d]]){pos.push(x(u),y(v),role==='sign'?.06:.015);uv.push(u,1-v);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const map=textures.get(id),mat=new T.MeshStandardMaterial({color:0xffffff,map,emissiveMap:role==='sign'?map:null,roughness:1,side:T.DoubleSide});mat.userData.shopExterior=true;
  const m=new T.Mesh(g,mat);m.name='ReferenceExterior-'+role;if(role==='sign')m.userData.storefrontLightRole='sign';m.castShadow=true;m.receiveShadow=true;root.add(m);
 }
 root.userData={storefrontId:spec.id,category:spec.category,plantAnchors:[],referenceExterior:id,approvedOpenings:spec.openings,exterior:{kind:'approved-photo-surface',holes:p.holes,source:'asset-encyclopedia/shop-references.json',photographResolution:'original reference thumbnail; small lettering limited'}};
 return root;
}
