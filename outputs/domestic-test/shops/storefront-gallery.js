import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GLTFExporter} from '../vendor/GLTFExporter.js';
import {buildStorefront} from './storefront-models.js?v=71';
import {createStorefrontLighting} from './storefront-lighting.js?v=73';
import {lightingState,scheduleFor,clockText} from './storefront-hours.js?v=71';
import {environmentProfile,bearingVector} from '../environment-policy.js?v=42';
import {createIllustrationRenderer} from '../illustration-renderer.js?v=38';
import {DEFAULT_APPEARANCE} from '../illustration-settings.js?v=37';
const $=id=>document.getElementById(id);
const response=await fetch('./shops/library/catalog.json?v=70');
if(!response.ok)throw Error('상가 목록을 불러오지 못했습니다');
const catalog=await response.json(),assets=catalog.assets;
const scene=new T.Scene();scene.background=new T.Color('#dfe5db');
const sky=new T.HemisphereLight(0xffffff,0x96a18c,2.15);scene.add(sky);
const sun=new T.DirectionalLight(0xffffff,2.0);sun.position.set(-6,9,10);scene.add(sun);
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.1,far:80});sun.shadow.normalBias=.04;sun.shadow.bias=-.0003;
const ground=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:'#a2aaa2',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.018;ground.receiveShadow=true;ground.userData.noInk=true;scene.add(ground);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.outputColorSpace=T.SRGBColorSpace;renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const thumbRenderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});thumbRenderer.outputColorSpace=T.SRGBColorSpace;thumbRenderer.setPixelRatio(1);thumbRenderer.shadowMap.enabled=true;thumbRenderer.shadowMap.type=T.PCFSoftShadowMap;
const camera=new T.PerspectiveCamera(36,1,.02,300),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.70;
let ink=createIllustrationRenderer(renderer),model,selected=0,filter='all';
let lightRig,hour=20,profile;
const initialHour=Number(new URL(location.href).searchParams.get('hour'));if(new URL(location.href).searchParams.has('hour')&&Number.isFinite(initialHour))hour=((initialHour%24)+24)%24;
function environment(){
  profile=environmentProfile(hour);scene.background.set(profile.night>.6?'#192738':profile.horizon);
  sky.color.set(profile.skyLight);sky.groundColor.set(profile.ground);sky.intensity=profile.night>.6?.38:profile.ambient;
  sun.color.set(profile.sun);sun.intensity=profile.sunIntensity;sun.position.fromArray(bearingVector(profile.azimuth,profile.renderElevation)).multiplyScalar(25);sun.castShadow=profile.castsSunShadow;
}
environment();
const appearance={...DEFAULT_APPEARANCE,outerWidth:1.15,innerWidth:.65};
function draw(lines=$('ink').checked){ink.render(scene,camera,()=>renderer.render(scene,camera),{...appearance,lines});}
function dispose(root){root?.traverse(o=>{o.geometry?.dispose();o.shadow?.map?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});}
function frame(front=false){
  const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
  const vfov=camera.fov*Math.PI/360,fit=Math.max(size.y/(2*Math.tan(vfov)),size.x/(2*Math.tan(vfov)*camera.aspect));
  const distance=fit*1.18+size.z*.75;
  controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(front?0:.19,front?0:.18,1).normalize().multiplyScalar(distance));controls.update();
}
function load(i,props=$('props').checked){if(model){scene.remove(model);dispose(model);}model=buildStorefront(assets[i],{props});lightRig=createStorefrontLighting(model,assets[i]);lightRig.update(hour,profile.night);scene.add(model);frame();}
function resize(){const el=$('stage');renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();}
function open(i){
  selected=i;if(!$('detail').open)$('detail').showModal();$('stage').append(renderer.domElement);resize();load(i);
  const a=assets[i],s=a.source;$('title').textContent=a.name;$('sourceTitle').textContent=s.name;
  $('sourceMeta').textContent=`${s.address} · 촬영 ${s.captureMonth}`;$('sourceLink').href=s.placeUrl;
  $('referenceThumb').src=s.image;$('referenceImage').src=s.image;
  $('features').replaceChildren(...s.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('dimensions').textContent=`전면 폭 약 ${a.width}m · 높이 약 ${a.height}m · 사진 비례로 추정`;
  updateStatus();
  const url=new URL(location.href);url.searchParams.set('asset',a.id);history.replaceState(null,'',url);
}
function saveBlob(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function save(all){
  const button=$(all?'all':'save'),original=button.textContent;button.disabled=true;button.textContent='저장 중…';
  const exportHour=hour,exportNight=profile.night;
  const root=new T.Group();root.name='RoadviewStorefrontLibrary';
  try{
    let cursor=0;for(const [i,a] of assets.entries()){
      if(!all&&i!==selected)continue;
      const group=buildStorefront(a,{props:$('props').checked});createStorefrontLighting(group,a).update(exportHour,exportNight);group.traverse(o=>{if(o.isLineSegments)o.visible=false;});
      if(all){group.position.set((i%3)*17,0,Math.floor(i/3)*11);cursor++;}root.add(group);
    }
    root.userData={source:'Kakao Roadview observations',textFree:true,estimatedDimensions:true,assetCount:all?cursor:1,previewHour:exportHour,hoursSource:'art-direction defaults; not verified business hours'};
    const glb=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});
    saveBlob(glb,(all?'korean-storefronts-18':assets[selected].id)+'-'+clockText(exportHour*60).replace(':','')+'.glb','model/gltf-binary');
    document.body.dataset.lastExport=String(glb.byteLength);
  }catch(e){alert('저장 실패: '+e.message);}finally{dispose(root);button.disabled=false;button.textContent=original;}
}
function applyFilter(){for(const el of $('catalog').children)el.classList.toggle('hidden',filter!=='all'&&el.dataset.category!==filter);for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.category===filter));}
function updateStatus(){
  const state=lightingState(assets[selected],hour),s=state.schedule;
  const title=document.createElement('strong');title.textContent=state.label;
  const hours=document.createElement('div');hours.textContent=s.alwaysOpen?'24시간 점등':`영업 ${clockText(s.openMinute)}–${clockText(s.closeMinute)}`;
  const switches=document.createElement('div');switches.textContent=`간판 ${state.sign?'켜짐':'꺼짐'} · 실내 ${state.interior?'켜짐':'꺼짐'}`;
  const closing=document.createElement('div');closing.textContent=s.alwaysOpen?'심야에도 간판과 실내 조명을 유지합니다.':`간판 소등 ${clockText(s.closeMinute)} → 실내 소등 ${clockText(s.closeMinute+s.cleanupMinutes)}`;
  $('lightingStatus').replaceChildren(title,hours,switches,closing);$('lightingStatus').dataset.phase=state.phase;
  for(const id of ['beforeClose','atClose','afterClose'])$(id).disabled=s.alwaysOpen;
}
function syncClock(){
  const value=clockText(hour*60);$('storeHour').value=value;$('detailHour').value=value;$('hourRange').value=String(hour*60);
  for(const button of document.querySelectorAll('[data-hour]'))button.setAttribute('aria-pressed',String(Number(button.dataset.hour)===hour));
  const states=assets.map(a=>lightingState(a,hour));$('clockSummary').textContent=`${value} · 영업 ${states.filter(s=>s.phase==='open').length} · 마감 ${states.filter(s=>s.phase==='cleanup').length} · 소등 ${states.filter(s=>s.phase==='closed').length}`;
  document.body.dataset.hour=String(hour);updateStatus();
}
function setHour(value){
  hour=((Number(value)%24)+24)%24;environment();lightRig?.update(hour,profile.night);syncClock();
  const url=new URL(location.href);url.searchParams.set('hour',String(hour));history.replaceState(null,'',url);refresh();
}
async function thumbnails(){
  const lines=$('ink').checked,props=$('props').checked;
  const pose=$('detail').open?{position:camera.position.clone(),target:controls.target.clone()}:null;
  const thumbInk=createIllustrationRenderer(thumbRenderer);
  $('catalog').replaceChildren();thumbRenderer.setSize(560,384);camera.aspect=560/384;camera.updateProjectionMatrix();
  for(const category of catalog.categories){
    const section=document.createElement('section');section.dataset.category=category.id;
    const heading=document.createElement('h2');heading.textContent=category.name+' · 3종';const grid=document.createElement('div');grid.className='cards';section.append(heading,grid);$('catalog').append(section);
    for(const [i,a] of assets.entries()){
      if(a.category!==category.id)continue;load(i,props);thumbInk.render(scene,camera,()=>thumbRenderer.render(scene,camera),{...appearance,lines});
      const card=document.createElement('button');card.className='card';card.dataset.asset=a.id;
      card.dataset.lines=String(lines);card.dataset.props=String(props);
      const img=new Image();img.src=thumbRenderer.domElement.toDataURL('image/png');img.alt=a.name+' 상가 3D 모델';
      const state=lightingState(a,hour),status=document.createElement('span');status.className='shop-state';status.dataset.phase=state.phase;status.textContent=state.label;card.dataset.hour=String(hour);card.dataset.phase=state.phase;
      const title=document.createElement('strong');title.textContent=a.name;const meta=document.createElement('small');meta.textContent=`${a.source.name} 참고 · ${a.source.captureMonth}`;
      card.append(img,status,title,meta);card.onclick=()=>open(i);grid.append(card);
    }
    await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  thumbInk.dispose();applyFilter();if($('detail').open){resize();load(selected);if(pose){camera.position.copy(pose.position);controls.target.copy(pose.target);controls.update();}updateStatus();}
}
for(const category of [{id:'all',name:'전체'},...catalog.categories]){const b=document.createElement('button');b.textContent=category.name;b.dataset.category=category.id;b.setAttribute('aria-pressed',String(category.id==='all'));b.onclick=()=>{filter=category.id;applyFilter();};$('filters').append(b);}
$('close').onclick=()=>$('detail').close();$('closeReference').onclick=()=>$('referenceDialog').close();$('referenceThumb').onclick=()=>$('referenceDialog').showModal();
$('detail').addEventListener('close',()=>{const url=new URL(location.href);url.searchParams.delete('asset');history.replaceState(null,'',url);});
$('prev').onclick=()=>open((selected+assets.length-1)%assets.length);$('next').onclick=()=>open((selected+1)%assets.length);
$('front').onclick=()=>frame(true);$('reset').onclick=()=>frame();$('save').onclick=()=>save(false);$('all').onclick=()=>save(true);
let updating=false,refreshAgain=false;
async function refresh(){
  refreshAgain=true;if(updating)return;updating=true;document.body.dataset.ready='false';
  try{while(refreshAgain){refreshAgain=false;await thumbnails();}}
  finally{updating=false;document.body.dataset.ready='true';}
}
$('ink').onchange=refresh;$('props').onchange=refresh;
for(const id of ['storeHour','detailHour'])$(id).onchange=()=>{const [h,m]=$(id).value.split(':').map(Number);if(Number.isFinite(h)&&Number.isFinite(m))setHour(h+m/60);};
$('hourRange').oninput=()=>setHour(Number($('hourRange').value)/60);
for(const button of document.querySelectorAll('[data-hour]'))button.onclick=()=>setHour(Number(button.dataset.hour));
$('minusHour').onclick=()=>setHour(hour-.5);$('plusHour').onclick=()=>setHour(hour+.5);
$('beforeClose').onclick=()=>setHour((scheduleFor(assets[selected]).closeMinute-30)/60);
$('atClose').onclick=()=>setHour((scheduleFor(assets[selected]).closeMinute+5)/60);
$('afterClose').onclick=()=>{const s=scheduleFor(assets[selected]);setHour((s.closeMinute+s.cleanupMinutes+5)/60);};
new ResizeObserver(()=>{if($('detail').open){resize();frame();}}).observe($('stage'));
syncClock();
await thumbnails();$('count').textContent=`${catalog.categories.length}개 업종 · ${assets.length}종`;$('all').disabled=false;
document.body.dataset.ready='true';document.body.dataset.assetCount=String(assets.length);
const requested=new URL(location.href).searchParams.get('asset'),index=assets.findIndex(a=>a.id===requested);if(index>=0)open(index);
renderer.setAnimationLoop(()=>{if($('detail').open&&!updating){controls.update();draw();}});
