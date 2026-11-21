import * as T from 'three';

// Original, deterministic repeat textures. Dimensions are in meters, not per building.
// Colors are sRGB bytes; UVs are local facade distances, so tall houses do not stretch bricks.
export const facadeTextureCatalog=[
 {id:'red-brick',name:'적벽돌',family:'벽돌',style:0,base:0x895e50,joint:0xb59b86,cols:4,rows:8,width:1.56,height:1.36,gap:.009,bond:'running',grain:4,variation:10},
 {id:'dark-brick',name:'짙은 갈색 벽돌',family:'벽돌',style:1,base:0x635149,joint:0x95887b,cols:4,rows:8,width:1.56,height:1.36,gap:.009,bond:'running',grain:4,variation:9},
 {id:'light-brick',name:'밝은 벽돌',family:'벽돌',style:2,base:0xc2b9a4,joint:0x988e7b,cols:4,rows:8,width:1.56,height:1.36,gap:.009,bond:'running',grain:3,variation:7},
 {id:'gray-stone',name:'회색 석재',family:'석재',style:3,base:0xa3a6a0,joint:0x727973,cols:3,rows:4,width:2.85,height:1.92,gap:.008,bond:'stack',grain:5,variation:5},
 {id:'cream-tile',name:'크림 타일',family:'타일',style:4,base:0xcbbfa6,joint:0xa79983,cols:4,rows:8,width:2.08,height:2.08,gap:.006,bond:'stack',grain:1,variation:3},
 {id:'ivory-render',name:'아이보리 미장',family:'미장',style:5,base:0xc2bfb0,joint:0xaaa696,width:2,height:2,bond:'render',grain:4,variation:0},
 {id:'long-brown-brick',name:'긴 황갈색 벽돌',family:'벽돌',style:0,base:0x9a7764,joint:0xc9b6a0,cols:3,rows:12,width:1.8,height:1.08,gap:.008,bond:'running',grain:4,variation:10},
 {id:'charcoal-stack-brick',name:'먹색 세로맞춤 벽돌',family:'벽돌',style:1,base:0x4c5050,joint:0x7e8580,cols:4,rows:10,width:1.2,height:1.2,gap:.008,bond:'stack',grain:3,variation:6},
 {id:'painted-white-brick',name:'백색 도장 벽돌',family:'벽돌',style:2,base:0xd9d6c8,joint:0xb9b9ad,cols:5,rows:10,width:1.5,height:1.2,gap:.009,bond:'running',grain:3,variation:3},
 {id:'mixed-old-brick',name:'색이 섞인 낡은 벽돌',family:'벽돌',style:0,base:0x8d6452,joint:0xab9f89,cols:5,rows:10,width:1.5,height:1.3,gap:.012,bond:'running',grain:6,variation:22},
 {id:'beige-large-stone',name:'베이지 대형 석재',family:'석재',style:3,base:0xbcb3a1,joint:0x8e8b80,cols:2,rows:4,width:2.4,height:2.4,gap:.008,bond:'running',grain:4,variation:5},
 {id:'white-granite',name:'백색 화강석',family:'석재',style:3,base:0xc4c5bb,joint:0x888e87,cols:3,rows:3,width:1.8,height:1.8,gap:.007,bond:'stack',grain:10,variation:4,speckle:true},
 {id:'charcoal-granite',name:'짙은 화강석',family:'석재',style:3,base:0x535c5b,joint:0x858d86,cols:3,rows:4,width:1.8,height:1.6,gap:.006,bond:'stack',grain:7,variation:4,speckle:true},
 {id:'small-white-tile',name:'작은 백색 타일',family:'타일',style:4,base:0xd5d7cc,joint:0x9daba0,cols:10,rows:10,width:1,height:1,gap:.004,bond:'stack',grain:1,variation:4},
 {id:'vertical-gray-tile',name:'세로형 회색 타일',family:'타일',style:4,base:0xabb6b0,joint:0x7c8b83,cols:10,rows:4,width:1,height:1.2,gap:.005,bond:'stack',grain:2,variation:5},
 {id:'muted-blue-tile',name:'청회색 작은 타일',family:'타일',style:4,base:0x718e91,joint:0xa8b7af,cols:8,rows:8,width:1.2,height:1.2,gap:.005,bond:'stack',grain:2,variation:7},
 {id:'exposed-concrete',name:'노출 콘크리트',family:'콘크리트',style:5,base:0xa8aaa2,joint:0x838b82,cols:2,rows:2,width:2.4,height:2.4,gap:.004,bond:'concrete',grain:4,variation:4},
 {id:'sand-stucco',name:'모래색 거친 미장',family:'미장',style:5,base:0xc4b89d,joint:0xa89f86,width:2,height:2,bond:'render',grain:8,variation:0},
];
export const defaultFacadeTextures=facadeTextureCatalog.slice(0,6).map(x=>x.id);
export function wallTextureFor(owner={}){return owner.wallTexture||owner.textureId||defaultFacadeTextures[owner.styleIndex??5];}
const textures=new Map(),wallMaterials=new Map(),resolution=512;
function rgb(hex){return [hex>>16&255,hex>>8&255,hex&255];}
function hash(x,y,seed=0){let h=Math.imul(x+seed*271,374761393)^Math.imul(y+seed*97,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
const mod=(x,m)=>(x%m+m)%m;
export function getFacadeTexture(id){
 if(textures.has(id))return textures.get(id);
 const r=facadeTextureCatalog.find(r=>r.id===id);if(!r)throw Error('Unknown facade texture: '+id);
 const bytes=new Uint8Array(resolution*resolution*4),base=rgb(r.base),joint=rgb(r.joint),seed=facadeTextureCatalog.indexOf(r)+1;
 for(let py=0;py<resolution;py++)for(let px=0;px<resolution;px++){
  const X=(px+.5)/resolution*r.width,Y=(py+.5)/resolution*r.height;let paint=base,tone=0,isJoint=false;
  if(r.bond!=='render'){
   const cw=r.width/r.cols,rh=r.height/r.rows,row=Math.floor(Y/rh),shift=r.bond==='running'?(row%2)*cw/2:0,sx=X+shift,col=mod(Math.floor(sx/cw),r.cols),xx=mod(sx,cw),yy=mod(Y,rh);
   // Center joints on tile edges; wrapping at the bitmap edge keeps the same mortar width.
   const edge=Math.min(xx,cw-xx,yy,rh-yy);isJoint=edge<r.gap/2;paint=isJoint?joint:base;tone=isJoint?0:(hash(col,row,seed)-.5)*r.variation;
   if(!isJoint&&edge<r.gap/2+.003)tone-=3;
   if(r.bond==='concrete')for(const hx of [cw*.23,cw*.77])for(const hy of [rh*.23,rh*.77]){const d=Math.hypot(xx-hx,yy-hy);if(d<.012)tone-=26;else if(d<.018)tone-=8;}
  }
  const noise=(hash(px,py,seed)-.5)*(isJoint?1:r.grain);
  if(r.speckle&&!isJoint){const cluster=hash(Math.floor(px/2),Math.floor(py/2),seed);tone+=cluster>.87?-19:cluster<.12?13:0;}
  // Coarse, periodic low-contrast mottling avoids obvious bright/dark repeat borders.
  const mottling=(r.bond==='render'||r.bond==='concrete')?Math.sin(2*Math.PI*px/resolution)*Math.cos(4*Math.PI*py/resolution)*1.8:0;
  const at=(py*resolution+px)*4;for(let c=0;c<3;c++)bytes[at+c]=Math.max(0,Math.min(255,Math.round(paint[c]+tone+noise+mottling)));bytes[at+3]=255;
 }
 const texture=new T.DataTexture(bytes,resolution,resolution,T.RGBAFormat);texture.name='facade-'+id;texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;texture.userData={facadePattern:id,meters:[r.width,r.height],generated:true};textures.set(id,texture);return texture;
}
// Splits at openings and y=3 so the existing first-floor replacement can trim UVs
// without changing triangles belonging entirely to upper floors.
export function emitFacadeTexture(batch,out,{width,bottom,top,id,cuts=[],offset=0}){
 const recipe=facadeTextureCatalog.find(r=>r.id===id);if(!recipe)throw Error('Unknown facade texture: '+id);
 const ys=[bottom,top,3,...cuts.flatMap(c=>[c[2],c[3]])].filter(y=>y>=bottom&&y<=top).sort((a,b)=>a-b),levels=[...new Set(ys)];
 for(let j=0;j<levels.length-1;j++){
  const lo=levels[j],hi=levels[j+1];if(hi-lo<1e-6)continue;let spans=[[0,width]];
  for(const [a,b,c,d] of cuts){if(hi<=c||lo>=d)continue;spans=spans.flatMap(([x,y])=>b<=x||a>=y?[[x,y]]:[[x,Math.min(y,a)],[Math.max(x,b),y]].filter(([x,y])=>y-x>1e-6));}
  for(const [a,b] of spans)out.textureQuad((a+b)/2,(lo+hi)/2,.010,b-a,hi-lo,id,[(a+offset)/recipe.width,lo/recipe.height,(b+offset)/recipe.width,hi/recipe.height]);
 }
}

// Replace only vertical masonry faces. The cap stays a solid, modeled surface;
// doors and rails are separate meshes and are never processed here.
export function applyWallTexture(mesh,id){
 const g=mesh.geometry;if(!g.attributes.normal)g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2),map=getFacadeTexture(id),[w,h]=map.userData.meters;
 for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)*n.getZ(i)-p.getZ(i)*n.getX(i))/w;uv[i*2+1]=(p.getY(i)+(mesh.position.y||0))/h;}
 g.setAttribute('uv',new T.BufferAttribute(uv,2));g.clearGroups();
 const count=g.index?.count??p.count;let start=0,last=-1;
 for(let i=0;i<count;i+=3){const v=g.index?g.index.getX(i):i,kind=Math.abs(n.getY(v))<.5?1:0;if(kind!==last){if(i>start)g.addGroup(start,i-start,last);start=i;last=kind;}}
 if(count>start)g.addGroup(start,count-start,last);
 if(!wallMaterials.has(id))wallMaterials.set(id,new T.MeshStandardMaterial({color:0xffffff,map,roughness:.9,side:T.DoubleSide}));
 mesh.material=[mesh.material,wallMaterials.get(id)];mesh.userData.facadeTextureId=id;return mesh;
}
