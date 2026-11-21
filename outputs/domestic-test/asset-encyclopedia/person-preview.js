import {directionalFrame,elevationTier,projectedHeight,FRAME_LABELS} from '../pedestrian-math.js';

const manifests=new Map();
async function manifest(action){
 if(!['walk','umbrella'].includes(action))throw Error('사람 동작을 확인해 주세요.');
 if(!manifests.has(action))manifests.set(action,fetch(action==='umbrella'?'../people/umbrella.json?v=repair20261121':'../people/seasons.json?v=publicwebp1').then(async response=>{
  if(!response.ok)throw Error('사람 그림 목록을 불러오지 못했습니다.');return response.json();
 }).catch(error=>{manifests.delete(action);throw error;}));
 return manifests.get(action);
}

export async function createPersonPreview(host,id,season,{state,onChange,action='walk'}={}){
 const person=(await manifest(action)).people[id],variant=person?.seasons[season];
 if(!variant?.elevations?.length)throw Error('이 사람의 시점별 그림을 확인해 주세요.');
 const tiers=await Promise.all(variant.elevations.map(async tier=>{
  const image=new Image();image.src='../people/'+tier.image+(tier.sha256?'?v='+tier.sha256.slice(0,12):'');await image.decode();return {...tier,imageElement:image};
 }));
 const canvas=document.createElement('canvas');canvas.className='person-preview';canvas.tabIndex=0;
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label','사람 회전 미리보기. 드래그 또는 방향키로 방향과 높이를 바꿉니다.');
 const context=canvas.getContext('2d');
 let angle=state?.angle??0,pitch=state?.pitch??0,zoom=state?.zoom??1,frame=-1,tierIndex=-1,disposed=false;
 const snapshot=()=>({angle,pitch,zoom});
 function draw(){
  if(disposed)return;
  const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
  const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);
  frame=directionalFrame(angle*Math.PI/180,0,frame);tierIndex=elevationTier(pitch,tierIndex,tiers.map(t=>t.pitch));
  const tier=tiers[tierIndex],f=tier.frames[frame],[x,y,w,h]=f.rect;
  const bodyHeight=Math.min(height*.78,width*.9)*zoom*projectedHeight(1,tier.pitch*Math.PI/180),scale=bodyHeight/f.bodyHeightPixels;
  context.drawImage(tier.imageElement,x,y,w,h,(width-w*scale)/2,(height-h*scale)/2,w*scale,h*scale);
  const view={...snapshot(),action,frame,pitch:tier.pitch,label:FRAME_LABELS[frame],file:'../people/'+tier.image+(tier.sha256?'?v='+tier.sha256.slice(0,12):'')};
  canvas.setAttribute('aria-label',FRAME_LABELS[frame]+' · '+(tier.pitch?'위에서 '+tier.pitch+'°':'눈높이')+' · 드래그 또는 방향키로 회전');
  canvas.dataset.action=action;canvas.dataset.season=season;canvas.dataset.frame=String(frame);canvas.dataset.pitch=String(tier.pitch);onChange?.(view);
 }
 function rotate(horizontal,vertical){angle+=horizontal;pitch=Math.max(0,Math.min(75,pitch+vertical));draw();}
 let pointer=null;
 canvas.onpointerdown=e=>{if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();canvas.classList.add('dragging');};
 canvas.onpointermove=e=>{if(pointer?.id!==e.pointerId)return;rotate((e.clientX-pointer.x)*.7,(e.clientY-pointer.y)*.4);pointer.x=e.clientX;pointer.y=e.clientY;};
 canvas.onlostpointercapture=()=>{pointer=null;canvas.classList.remove('dragging');};
 canvas.onpointercancel=()=>{pointer=null;canvas.classList.remove('dragging');};
 canvas.onkeydown=e=>{
  const steps={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,30],ArrowDown:[0,-30]};
  if(steps[e.key]){e.preventDefault();rotate(...steps[e.key]);}else if(e.key==='Home'){e.preventDefault();reset();}
 };
 const wheel=e=>{e.preventDefault();zoom=Math.max(.6,Math.min(1.25,zoom-e.deltaY*.001));draw();};canvas.addEventListener('wheel',wheel,{passive:false});
 const observer=new ResizeObserver(draw);
 function reset(){angle=0;pitch=0;zoom=1;frame=-1;tierIndex=-1;draw();}
 return {mount(){host.append(canvas);observer.observe(host);draw();},frame:reset,getState:snapshot,setPitch(value){pitch=Number(value);draw();},rotate,dispose(){disposed=true;observer.disconnect();canvas.removeEventListener('wheel',wheel);canvas.remove();}};
}
