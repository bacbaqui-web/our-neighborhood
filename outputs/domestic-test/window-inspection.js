// A repeatable close view of real windows in the map, also used for screenshots.
export function installWindowInspection({details,camera,controls,overview,render=()=>{},parent=document.body}){
 document.getElementById('window-inspection')?.remove();
 const candidates=details.userData.facadeSpots.filter(w=>w.y-w.ground>3&&w.w>1.4);
 if(!candidates.length)return;
 const params=new URLSearchParams(location.search),wanted=Number(params.get('windowOwner'));
 let index=Math.max(0,candidates.findIndex(w=>w.owner===wanted));
 const panel=document.createElement('div');panel.id='window-inspection';panel.style.cssText='position:fixed;right:16px;bottom:16px;z-index:20;background:#fffffff2;border:1px solid #c8d1cb;border-radius:10px;padding:10px 12px;color:#273e34;font:14px system-ui;box-shadow:0 3px 16px #20382d16';
 const label=document.createElement('div');label.style.marginBottom='7px';panel.append(label);
 const focus=()=>{const w=candidates[index];camera.near=.05;camera.updateProjectionMatrix();controls.target.set(w.x,w.y,w.z);camera.position.set(w.x+w.nx*3.5+w.ux*3.6,w.y+.3,w.z+w.nz*3.5+w.uz*3.6);controls.update();render();label.textContent=`${w.style} · 창틀 ${details.userData.recessQA?'14cm 안쪽':'기존 위치'}`;panel.dataset.owner=w.owner;panel.dataset.window=JSON.stringify(w);const url=new URL(location.href);url.searchParams.set('windowOwner',w.owner);history.replaceState(null,'',url);};
 for(const [text,action] of [['창문 가까이',focus],['다른 집',()=>{const owner=candidates[index].owner;for(let n=0;n<candidates.length;n++){index=(index+1)%candidates.length;if(candidates[index].owner!==owner)break;}focus();}],['전체 보기',()=>{overview();const url=new URL(location.href);url.searchParams.delete('windowOwner');history.replaceState(null,'',url);}]] ){
  const button=document.createElement('button');button.textContent=text;button.style.cssText='padding:7px 10px;margin-right:5px;border:1px solid #bac9c0;background:white;border-radius:5px;color:#234c3e;cursor:pointer';button.onclick=action;panel.append(button);
 }
 const qa=details.userData.recessQA;label.textContent=qa?`창틀 14cm 안쪽 · 동네 전체 적용`:'기존 창문 비교';
 parent.append(panel);if(wanted)focus();return {focus};
}
