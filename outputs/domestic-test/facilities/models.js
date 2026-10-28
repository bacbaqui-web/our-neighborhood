import {emitApartment} from '../apartments/models.js';
import * as T from 'three';
import {facilityById} from './catalog.js';
import {inPolygon} from './placement.js';
// Thin wall-bound geometry keeps every footprint and pedestrian route intact.
export function emitFacility(batch,b,buildings,elevation){
 if(b.facility.id==='apartment')return emitApartment(batch,b);
 const f=facilityById[b.facility.id],{points,base,top}=b,H=top-base,levels=Math.max(1,b.levels),fh=H/levels;
 const signed=points.reduce((v,a,i)=>{const c=points[(i+1)%points.length];return v+a[0]*c[1]-c[0]*a[1]},0),sign=Math.sign(signed)||1;
 let windows=0;
 for(let edge=0;edge<points.length;edge++){
  const a=points[edge],c=points[(edge+1)%points.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<1)continue;
  const ux=(c[0]-a[0])/L,uz=(c[1]-a[1])/L,nx=uz*sign,nz=-ux*sign;
  if([.2,.5,.8].every(t=>buildings.some(other=>other!==b&&inPolygon([a[0]+ux*L*t+nx*.14,a[1]+uz*L*t+nz*.14],other.points))))continue;
  const out=batch.writer([a[0],base,a[1]],ux,uz,nx,nz),Q=(x,y,w,h,col,z=.025)=>{if(w>0&&h>0)out.quad(x,y,z,w,h,col,true);},B=(x,y,w,h,col,z=.035,d=.025)=>out.box(x,y,z,w,h,d,col);
  const front=edge===(b.facility.frontEdge??b.frontEdge),ground=Math.max(.05,elevation(a[0]+ux*L/2,a[1]+uz*L/2)-base),usable=H-ground;
  Q(L/2,H/2,L-.02,H-.02,f.wall,.012);
  const frame=(x,y,w,h,col=f.glass,z=.045)=>{if(w<.3||h<.3)return;Q(x,y,w,h,0xb7b7a9,z-.013);Q(x,y,w-.1,h-.1,col,z);B(x,y,.04,h,0x5a6b67,z+.015);windows++;};
  const bands=(start=1)=>{const cols=Math.max(1,Math.min(20,Math.floor(L/3.1))),pw=(L-.4)/cols;for(let r=start;r<levels;r++)for(let j=0;j<cols;j++)frame(.2+pw*(j+.5),r*fh+fh*.56,Math.min(pw-.28,2.4),Math.min(fh*.54,1.7));};
  if(f.pattern==='balconies'){
   const cols=Math.max(1,Math.min(20,Math.floor(L/(front?3.1:3.8)))),pw=(L-.5)/cols;
   for(let r=0;r<Math.min(levels,50);r++)for(let j=0;j<cols;j++){
    const x=.25+(j+.5)*pw,y=r*fh+fh*.57,w=pw-.22,h=fh*.66;
    frame(x,y,w,h);B(x,y-h*.18,w,.06,0xc8c9bd,.075);
    if(front||L>12){B(x,y-h*.31,w,.035,0xc5c6b8,.085);for(let k=1;k<5;k++)B(x-w/2+w*k/5,y-h*.38,.025,h*.25,0xb8bdb2,.085);}
   }
   // Stair core: a narrow vertical strip with smaller landings, observed on the tower ends.
   if(!front&&L>6){Q(L*.18,H/2,Math.min(1.35,L*.15),H-.1,0xc4b79a,.09);for(let r=0;r<levels;r++)Q(L*.18,r*fh+fh*.65,.55,fh*.35,f.glass,.10);}
  }else if(f.pattern==='school'){
   const cols=Math.max(1,Math.min(20,Math.floor(L/3.8))),pw=(L-.4)/cols;
   for(let r=0;r<levels;r++){B(L/2,r*fh+.12,L-.1,.12,0xc6c3ad);for(let j=0;j<cols;j++){const x=.2+pw*(j+.5);frame(x,r*fh+fh*.6,pw-.4,fh*.55);B(x-pw/2+.13,r*fh+fh*.55,.25,fh*.85,f.accent,.07);B(x,r*fh+fh*.6,pw-.4,.045,f.accent,.07);}}
   if(front&&L>10){Q(L*.88,H*.53,L*.11,H*.88,f.accent,.08);for(let r=0;r<levels;r++)frame(L*.88,r*fh+fh*.55,L*.065,fh*.75,f.glass,.105);}
  }else if(f.pattern==='retail-glass'){
   if(front){for(let r=1;r<levels;r++){frame(L/2,r*fh+fh*.53,L-.5,fh*.83);for(let x=2;x<L;x+=2)B(x,r*fh+fh*.53,.045,fh*.83,0xb8bcb3,.07);}Q(L/2,H-.45,1.0,.8,f.accent,.08);}
  }else if(f.pattern==='post-office'){
   bands(1);for(let x=.4;x<L;x+=.4)B(x,H/2,.012,H-.05,0x78958c,.03);for(let y=.4;y<H;y+=.4)B(L/2,y,L-.08,.012,0x78958c,.03);if(front)B(L/2,ground+2.8,L*.6,.55,f.accent,.07);
  }else if(f.pattern==='parking'){
   B(L/2,H-.35,L-.08,.45,f.accent);Q(L/2,Math.min(1.5,H*.12),L-.1,Math.min(3,H*.24),0x9c7360);
   if(L>8)for(let r=1;r<levels;r++){const w=L*.68;Q(L*.61,r*fh+fh*.45,w,.55,0x3c4544,.04);for(let x=L*.28;x<L*.94;x+=5)B(x,r*fh+fh*.45,.25,.6,f.wall,.06);}
  }else if(f.pattern==='louvers'){
   if(front){for(let y=ground+.3;y<H-.2;y+=.3)B(L*.73,y,L*.48,.065,0x75827e,.06);for(let r=1;r<levels;r++)frame(L*.22,r*fh+fh*.5,L*.22,Math.min(1,fh*.4));}
   else bands(1);
  }else if(f.pattern==='bowed'&&front&&usable>3.2){
   const center=L*.5,w=L*.56,start=center-w/2,cols=Math.max(4,Math.min(16,Math.floor(w/1.3))),pw=w/cols;
   // Faceted curve is recessed into the mapped facade, not a footprint expansion.
   for(let j=0;j<cols;j++){const x=start+pw*(j+.5),depth=.035+.045*Math.sin(Math.PI*(j+.5)/cols);for(let r=1;r<Math.max(3,levels);r++){const rh=(H-ground-2.8)/(Math.max(3,levels)-1),y=ground+2.8+rh*(r-.5);Q(x,y,pw-.06,rh-.08,f.glass,depth);B(x-pw/2,y,.045,rh,0xb1b8ad,depth+.01);}}
   B(L/2,H-.5,L-.15,.8,f.id==='traders'?f.accent:f.wall);
   if(f.id==='traders')Q(L*.87,H*.54,L*.2,H*.85,f.accent,.04);
  }else if(f.pattern==='civic-glass'&&front){
   const cols=6,w=L*.6,pw=w/cols;for(let r=1;r<levels;r++)for(let j=0;j<cols;j++)frame(L*.18+pw*(j+.5),r*fh+fh*.48,pw-.06,fh-.16);
   for(let r=1;r<levels;r++)frame(L*.89,r*fh+fh*.48,L*.09,fh*.45);
  }else if(f.pattern==='garage'){
   bands(1);
   if(front){const n=Math.max(1,Math.min(5,Math.floor(L/4.5))),pw=(L-.6)/n,h=Math.min(3.5,usable*.38);for(let j=0;j<n;j++){Q(.3+pw*(j+.5),ground+h/2,pw-.22,h,0x303a39,.05);B(.3+pw*j,ground+h/2,.16,h,0x545d58,.07);Q(.3+pw*(j+.5),ground+.25,pw-.35,.035,0xc4b56c,.065);}Q(L*.97,H/2,L*.045,H-.1,f.accent,.06);}
  }else if(f.pattern==='panels'){
   for(let x=1.2;x<L;x+=1.2)B(x,H/2,.018,H-.1,0xaaa99b,.04);for(let y=.8;y<H;y+=.8)B(L/2,y,L-.08,.015,0xaaa99b,.04);
   if(front&&L>8){for(const x of [L*.25,L*.75])B(x,H*.53,.48,H*.88,0x81867e,.07);B(L/2,ground+2.5,L*.87,.9,f.accent,.06);}
  }else bands(1);
  if(front&&f.pattern!=='garage'&&usable>2.4){const w=Math.min(4.2,L*.23),h=Math.min(2.45,usable*.55);frame(L/2,ground+h/2,w,h);B(L/2,ground+h+.14,w+.2,.16,0x81877d,.065);}
 }
 return {windows,sourceId:f.sourceId};
}
export function addSignText(root,spec){
 if(typeof document==='undefined'||!spec.signText)return;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,96);ctx.fillStyle=spec.textColor||'#f1eee2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 58px sans-serif';ctx.fillText(spec.signText,256,48,480);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sign=spec.signs[0],mesh=new T.Mesh(new T.PlaneGeometry(sign.w*.8,sign.h*.7),new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.15,roughness:.9,depthWrite:false}));
 mesh.position.set(sign.x,sign.y,.29);mesh.name='facility-sign-text';mesh.userData.noPlacementCollision=true;root.add(mesh);
}
export function addFacilityLabels(root,buildings){
 if(typeof document==='undefined')return;
 for(const b of buildings){if(!b.facility||b.facility.id==='apartment')continue;
  const f=facilityById[b.facility.id],i=b.facility.frontEdge??b.frontEdge??0,a=b.points[i],c=b.points[(i+1)%b.points.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<3)continue;
  const sign=Math.sign(b.points.reduce((v,p,j)=>{const q=b.points[(j+1)%b.points.length];return v+p[0]*q[1]-q[0]*p[1]},0))||1,nx=(c[1]-a[1])/L*sign,nz=-(c[0]-a[0])/L*sign;
  const label=new T.Group();label.position.set((a[0]+c[0])/2,b.top-Math.min(1.1,(b.top-b.base)*.1),(a[1]+c[1])/2);label.rotation.y=Math.atan2(nx,nz);
  addSignText(label,{signText:f.name,textColor:'#343e3a',signs:[{x:0,y:0,w:Math.min(8,L*.5),h:.8}]});root.add(label);
 }
}
