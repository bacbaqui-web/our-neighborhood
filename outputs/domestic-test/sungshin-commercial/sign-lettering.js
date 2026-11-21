import * as T from 'three';
import {signDesigns} from './sign-designs.js';

// Draw at the physical panel aspect ratio. Font size changes uniformly; glyphs
// are never horizontally compressed with fillText(maxWidth) or canvas scaling.
export function signCanvasSize(width,height){
  const ratio=width/height;
  if(!(ratio>0&&Number.isFinite(ratio)))throw Error('간판 크기가 올바르지 않습니다.');
  return ratio>=1?[2048,Math.max(64,Math.round(2048/ratio))]:[Math.max(64,Math.round(2048*ratio)),2048];
}
export function createSignLettering(key,width,height){
  const design=signDesigns[key];
  if(!design)return null;
  const [w,h]=signCanvasSize(width,height);
  const canvas=typeof document!=='undefined'?document.createElement('canvas'):typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):null;
  if(!canvas)return null;
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('간판 글자를 그릴 수 없습니다.');
  ctx.fillStyle=design.bg;ctx.fillRect(0,0,w,h);
  function text(value,x,y,boxW,boxH,color=design.fg,weight=700,spread=false){
    if(!value)return;
    if(value.includes('\n')){const lines=value.split('\n');lines.forEach((line,i)=>text(line,x,y+boxH*((i+.5)/lines.length-.5),boxW,boxH/lines.length,color,weight));return;}
    let size=boxH*.76;
    const family=design.serif?'Georgia, "AppleMyungjo", serif':'"Arial", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    ctx.font=`${weight} ${size}px ${family}`;
    const measured=ctx.measureText(value).width;
    size*=Math.min(1,boxW/Math.max(1,measured));
    ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=color;
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(spread){
      const chars=[...value],natural=ctx.measureText(value).width,gap=Math.max(0,(boxW-natural)/(chars.length-1));
      let cursor=x-boxW/2;for(const c of chars){const cw=ctx.measureText(c).width;ctx.fillText(c,cursor+cw/2,y);cursor+=cw+gap;}
    }else ctx.fillText(value,x,y);
  }
  function icon(kind,x,y,size){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=design.accent??design.fg;ctx.fillStyle=design.accent??design.fg;ctx.lineWidth=size*.065;
    const line=(points)=>{ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a*size,b*size):ctx.moveTo(a*size,b*size));ctx.stroke();};
    const circle=(x,y,r,fill=false)=>{ctx.beginPath();ctx.arc(x*size,y*size,r*size,0,Math.PI*2);fill?ctx.fill():ctx.stroke();};
    if(kind==='houseRoof')line([[-.48,.12],[0,-.35],[.48,.12]]);
    else if(kind==='cross'){ctx.fillRect(-size*.12,-size*.4,size*.24,size*.8);ctx.fillRect(-size*.4,-size*.12,size*.8,size*.24);}
    else if(kind==='cup'){line([[-.35,-.24],[-.28,.32],[.28,.32],[.35,-.24],[-.35,-.24]]);line([[.35,-.12],[.52,-.12],[.52,.15],[.32,.15]]);line([[-.12,-.38],[-.08,-.5]]);}
    else if(kind==='dumbbell'){line([[-.42,0],[.42,0]]);ctx.fillRect(-size*.38,-size*.28,size*.14,size*.56);ctx.fillRect(size*.24,-size*.28,size*.14,size*.56);}
    else if(kind==='claw'){line([[0,-.5],[0,-.08],[-.33,.25],[-.19,.42]]);line([[0,-.08],[.33,.25],[.19,.42]]);}
    else if(kind==='octopus'){circle(0,-.12,.26);for(let i=0;i<4;i++)line([[(i-1.5)*.13,.1],[(i-1.5)*.22,.36],[(i-1.5)*.26,.24]]);circle(-.09,-.15,.025,true);circle(.09,-.15,.025,true);}
    else if(kind==='pigMoon'){circle(0,0,.39);circle(0,.08,.17);circle(-.065,.08,.023,true);circle(.065,.08,.023,true);line([[-.3,-.25],[-.28,-.48],[-.09,-.37]]);line([[.3,-.25],[.28,-.48],[.09,-.37]]);}
    else if(kind==='noodleLoop'){for(let i=0;i<3;i++)circle((i-1)*.12,0,.23);}
    ctx.restore();
  }
  const inset=Math.min(w,h)*.06;
  if(design.border){ctx.strokeStyle=design.border;ctx.lineWidth=Math.max(2,Math.min(w,h)*.018);ctx.strokeRect(inset,inset,w-2*inset,h-2*inset);}
  if(key==='corners:0'&&w>h*3){
    text('MELO',w*.245,h*.52,w*.35,h*.88,design.fg,700,true);
    icon('cup',w*.48,h*.48,h*.66);
    text('COFFEE',w*.735,h*.52,w*.42,h*.88,design.fg,700,true);
  }else if(key==='fidelity:10'&&w>h*3){
    text(design.text,w*.385,h*.53,w*.71,h*1.08,design.fg,700,true);
    text(design.secondary.split(' · ').join('\n'),w*.865,h*.52,w*.19,h*.85,design.fg,500);
  }else if(key==='yard:1'&&w>h*2){
    text(design.text,w*.24,h*.73,w*.39,h*.26);
    text(design.secondary,w*.83,h*.73,w*.20,h*.22);
  }else if(design.layout==='split'){
    const split=design.split??.55;ctx.fillStyle=design.secondaryBg??'#292b29';ctx.fillRect(w*split,0,w*(1-split),h);
    const logo=design.icon?Math.min(h*.62,w*split*.18):0;
    if(logo)icon(design.icon,w*split*.12,h*.5,logo);
    const start=logo?w*split*.25:w*split*.06;
    text(design.text,(start+w*split*.94)/2,h*.5,w*split*.94-start,h*.90);
    text(design.secondary,w*(split+(1-split)/2),h*.5,w*(1-split)*.88,h*.64,design.secondaryFg??design.fg);
  }else if(design.layout==='vertical'||h>w*1.8){
    const chars=[...design.text];const step=Math.min(h*.86/chars.length,w*.82);const start=(h-step*chars.length)/2;
    chars.forEach((c,i)=>text(c,w/2,start+step*(i+.5),w*.82,step));
  }else{
    const hasSub=!!design.secondary&&key!=='corners:0';
    const iconSize=design.icon?Math.min(h*.64,w*.13):0;
    if(iconSize)icon(design.icon,w*.055+iconSize*.5,h*.49,iconSize);
    const start=iconSize?iconSize+w*.10:w*.06;
    text(design.text,(start+w*.94)/2,h*(hasSub?.43:.52),w*.94-start,h*(hasSub?.65:.86));
    if(hasSub)text(design.secondary,w/2,h*.82,w*.82,h*.22,design.secondaryFg??design.accent??design.fg,500);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=8;texture.name='SungshinLettering-'+key;
  texture.userData={sungshinLettering:true,sourceDesign:key,wording:design.text,uniformGlyphScale:true};
  return texture;
}
