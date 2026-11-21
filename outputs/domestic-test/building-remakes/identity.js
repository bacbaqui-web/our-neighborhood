import * as T from 'three';
const files={costco:'costco.svg',gs25:'gs25-sign.svg',homeplus:'homeplus.svg',starbucks:'starbucks-wordmark.svg','starbucks-emblem':'starbucks-siren.png','police-emblem':'police-horizontal.svg'};
const images=new Map(),textures=new Map();let preparation;
export function prepareBuildingIdentity(){
 if(typeof document==='undefined')return Promise.resolve();
 return preparation??=Promise.all(Object.entries(files).map(([key,file])=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>{images.set(key,img);resolve();};img.onerror=()=>reject(Error('건물 간판 이미지를 불러오지 못했습니다: '+file));img.src=new URL('./brand-art/'+file,import.meta.url).href;
 }))).catch(e=>{preparation=null;throw e;});
}
function textureFor(key,options={}){
 const cacheKey=JSON.stringify([key,options]);if(textures.has(cacheKey))return textures.get(cacheKey);
 let texture;
 if(typeof document==='undefined'){texture=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);}
 else{
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024/(options.aspect||4));const c=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  const text=(value,color='#ffffff',size=160,x=W/2,y=H/2,max=W*.95,font='Arial, sans-serif')=>{c.font=`700 ${size*H/256}px ${font}`;c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.save();c.translate(x,y===H/2?y:y*H/256);c.scale(max/c.measureText(value).width,1);if(key==='emart24'&&!options.text)c.strokeText(value,0,0);c.fillText(value,0,0);c.restore();};
  if(options.text)text(options.text,options.color||'#ffffff',options.size||150,W/2,H/2,W*.96,options.serif?'serif':'Arial, "Noto Sans KR", sans-serif');
  else if(files[key]){
   const img=images.get(key);if(!img)throw Error('건물 로고 준비가 끝나지 않았습니다: '+key);
   // The authentic police SVG includes its national wordmark; select only its emblem UV region.
   const sw=key==='police-emblem'?1040:img.naturalWidth,sh=img.naturalHeight,s=Math.min(W/sw,H/sh)*.97;
   c.drawImage(img,0,0,sw,sh,(W-sw*s)/2,(H-sh*s)/2,sw*s,sh*s);
   if(key==='starbucks'){c.globalCompositeOperation='source-in';c.fillStyle='#ffffff';c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';}
  }else if(key==='emart'){
   c.textAlign='left';c.textBaseline='middle';c.font=`900 ${H*.64}px "Arial Narrow", Arial, sans-serif`;
   const parts=[['THE TOWN ', '#e8f2f5'],['M','#383c72'],['A','#f4be28'],['L','#159fca'],['L','#d33354']],total=parts.reduce((n,[s])=>n+c.measureText(s).width,0),scale=990/total;c.save();c.translate((W-total*scale)/2,H/2);c.scale(scale,1);let x=0;for(const [s,col]of parts){c.fillStyle=col;c.fillText(s,x,0);x+=c.measureText(s).width;}c.restore();
  }else if(key==='townmall-symbol'){
   // Four bent arms, directly reconstructed from the approved facade symbol.
   c.translate(W/2,H/2);c.scale(Math.min(W,H)/1024,Math.min(W,H)/1024);for(const col of ['#ba3753','#129fc4','#e7b22e','#42497c']){c.fillStyle=col;c.beginPath();c.moveTo(-25,-25);c.lineTo(55,-25);c.lineTo(55,-260);c.quadraticCurveTo(65,-330,250,-330);c.lineTo(250,-405);c.quadraticCurveTo(-25,-410,-25,-245);c.closePath();c.fill();c.rotate(Math.PI/2);}
  }else if(key==='traders'){
   text('emart','#5f3626',62,W/2,48,W*.60);text('TRADERS','#61432d',118,W/2,144,W*.96);text('WHOLESALE CLUB','#61432d',34,W/2,223,W*.78);
  }else if(key==='seven')text('7-ELEVEN','#ffffff',240);
  else if(key==='emart24'){
   c.font=`900 ${H*.96}px Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=H*.043;c.strokeStyle='#e96825';text('emart24','#ffffff',246);
  }
  else if(key==='dongnae')text('동 래 별 장','#d9b366',150,W/2,H/2,W*.94,'serif');
  else if(key==='hanshin'){text('한신','#304c62',120,W/2,80);text('3','#304c62',96,W/2,198);}
  else throw Error('등록되지 않은 건물 간판: '+key);
  texture=new T.CanvasTexture(canvas);
 }
 texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;texture.userData={brandKey:key,source:'approved reference lettering and attributed original artwork'};textures.set(cacheKey,texture);return texture;
}
export function addIdentitySign(root,{key,x,y,z,w,h,angle=0,options={},owner}){
 if(![x,y,z,w,h,angle].every(Number.isFinite)||w<=0||h<=0)throw Error('건물 간판 위치와 크기를 확인해 주세요.');
 const map=textureFor(key,{...options,aspect:w/h}),mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,emissiveMap:map,transparent:true,alphaTest:.08,depthWrite:false,roughness:.8,side:T.DoubleSide}));
 mesh.position.set(x,y,z);mesh.rotation.y=angle;mesh.name='BrandSign-'+key;mesh.userData={brandSign:key,sourceText:options.text,noPlacementCollision:true,noInk:true,storefrontLightRole:'sign',approvedOwner:owner};mesh.receiveShadow=true;root.add(mesh);return mesh;
}
export function addApprovedIdentity(root,buildings){for(const b of buildings)for(const sign of b.approvedRemake?.signs||[])addIdentitySign(root,sign);}
export function identityWindowWriter(out,palette){
 if(!palette)return out;const old=[0x79999a,0x899f9a,0x67888c,0xafc4bd];return {...out,quad:(x,y,z,w,h,color,surface)=>out.quad(x,y,z,w,h,old.includes(color)?palette[old.indexOf(color)%palette.length]:color,surface)};
}
