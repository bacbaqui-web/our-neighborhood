import * as T from 'three';
import {TREE_SPECIES} from './tree-species.js?v=151';
import {planCanopy,validateCanopy} from './canopy-growth.js?v=151';
import {createHybridTrees,loadSpeciesTextures} from './hybrid-tree.js?v=151';
import {createBillboardLightField} from './billboard-lighting.js?v=151';
import {environmentProfile,bearingVector} from './environment-policy.js?v=151';
const catalog=document.getElementById('catalog'),status=document.getElementById('status'),seasonNames={spring:'봄꽃·새순',summer:'여름 잎',autumn:'가을 잎·열매',winter:'겨울 모습'};
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(480,452);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color(0xe8eee3);const camera=new T.OrthographicCamera(-7.8,7.8,7.35,-7.35,.1,90);camera.position.set(16,10,23);camera.lookAt(0,5.8,0);
const ground=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0xe8eee3,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const sun=new T.DirectionalLight(0xffffff,2.5);sun.position.set(-12,21,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:16,bottom:-7,near:.1,far:65});sun.shadow.normalBias=.03;sun.shadow.bias=-.0001;scene.add(sun,sun.target,new T.HemisphereLight(0xeaf4ff,0x9b9b80,2));
const profile=environmentProfile(11,'clear'),field=createBillboardLightField({buildings:[],elevation:()=>0});field.set({sunProfile:profile,night:false,tint:profile.tint,painted:true,shading:true,shadows:true,density:.70});sun.position.set(...bearingVector(profile.azimuth,profile.renderElevation)).multiplyScalar(30);
const entries=[];let ready=false,renderVersion=0;
for(const [i,s] of TREE_SPECIES.entries()){
 const card=document.createElement('article');card.className='card';card.dataset.species=s.id;
 card.innerHTML=`<a class="preview" href="./tree-growth.html?species=${s.id}"><img alt="${s.name} 입체 나무 미리보기"><span class="number">${String(i+1).padStart(2,'0')}</span><span class="season"></span></a><div class="info"><h2>${s.name}</h2><div class="latin">${s.latin}</div><p>${s.description}</p><div class="actions"><a class="inspect" href="./tree-growth.html?species=${s.id}">입체로 살펴보기 ↗</a><a href="${s.atlas}" download="${s.id}-foliage.png">잎 PNG ↓</a></div></div>`;
 catalog.append(card);entries.push({species:s,card});
}
async function renderCards(season){const version=++renderVersion;catalog.dataset.ready='false';document.getElementById('saveCatalog').disabled=true;
 document.querySelectorAll('[data-season]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.season===season)));
 for(const [i,e] of entries.entries()){
  if(version!==renderVersion)return;const selected=season==='signature'?(e.species.seasonal||'summer'):season;
  e.tree.setFoliage({season:selected});e.tree.update(camera);scene.add(e.tree.group);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);e.card.querySelector('img').src=renderer.domElement.toDataURL('image/png');scene.remove(e.tree.group);
  e.card.querySelector('.season').textContent=seasonNames[selected];for(const a of e.card.querySelectorAll('.preview,.inspect'))a.href=`./tree-growth.html?species=${e.species.id}&season=${selected}`;
  e.card.dataset.state=JSON.stringify({...e.tree.group.userData.foliage,bend:e.plan.trunkBend,mode:e.plan.growthMode,branches:e.plan.paths.length,errors:validateCanopy(e.plan,[])});
  status.textContent=`${i+1} / 10종 미리보기`;await new Promise(requestAnimationFrame);
 }
 status.textContent='10종 · 잎 패턴 4종씩 · 아래 / 옆 / 위 시점';catalog.dataset.ready='true';catalog.dataset.season=season;document.getElementById('saveCatalog').disabled=false;
}
document.getElementById('saveCatalog').onclick=async()=>{try{
 // Compose the actual rendered models into a reusable contact sheet.
 await document.fonts.ready;const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1100;const c=canvas.getContext('2d');c.fillStyle='#f3f5ee';c.fillRect(0,0,1800,1100);c.fillStyle='#233b2e';c.font='bold 36px system-ui';c.fillText('우리 동네 나무 · 한국 수종 10종',35,58);c.font='18px system-ui';c.fillStyle='#627462';c.fillText('3D 줄기와 가지 + 아래·옆·위 시점 잎 그림 | '+(catalog.dataset.season==='signature'?'수종별 대표 모습':seasonNames[catalog.dataset.season]),35,94);
 for(const [i,e] of entries.entries()){const x=30+i%5*350,y=125+Math.floor(i/5)*470,img=e.card.querySelector('img');await img.decode();c.drawImage(img,x,y,340,320);c.fillStyle='#233b2e';c.font='bold 25px system-ui';c.fillText(e.species.name,x+10,y+354);c.font='15px system-ui';c.fillStyle='#64745e';c.fillText(e.species.form,x+10,y+384);c.fillText(e.card.querySelector('.season').textContent,x+10,y+410);}
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('목록 이미지를 저장하지 못했습니다.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.download='korean-trees-'+catalog.dataset.season+'.png';a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='목록 PNG 저장 완료';
}catch(error){fail(error);}};
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{if(ready)renderCards(b.dataset.season).catch(fail);});
function fail(error){document.getElementById('error').textContent=error.message;console.error(error);}
try{const textures=await loadSpeciesTextures();for(const e of entries){e.plan=planCanopy({id:e.species.id,seed:'species-'+e.species.id,species:e.species.id,height:e.species.height,radius:e.species.radius});e.tree=createHybridTrees([e.plan],textures.get(e.species.id));e.tree.setLighting(field);e.tree.sunShadows.set(profile,true);}ready=true;await renderCards('signature');}catch(error){fail(error);}
