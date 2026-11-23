import * as T from 'three';
import {OrbitControls} from '../../../../vendor/OrbitControls.js';
import {prepareShopInteriors} from '../../../../shops/interiors.js?v=shop50v3';
import {buildStorefront} from '../../../../shops/storefront-models.js';
import {buildDetailedStorefront,prepareDetailedStorefront} from './model-v4.js';
const $=id=>document.getElementById(id);
try{
 const response=await fetch('../../../../shops/library/catalog.json');if(!response.ok)throw Error('상가 목록을 읽지 못했습니다.');
 const spec=(await response.json()).assets.find(x=>x.id==='convenience-01');
 await Promise.all([prepareShopInteriors(),prepareDetailedStorefront()]);
 const scene=new T.Scene();scene.background=new T.Color('#e4e8e1');
 scene.add(new T.HemisphereLight(0xffffff,0x6f786d,1.30));
 const sun=new T.DirectionalLight(0xffffff,2.4);sun.position.set(-6,12,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:45});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;scene.add(sun);
 const before=buildStorefront(spec),after=buildDetailedStorefront(spec);scene.add(before,after);before.visible=false;
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;$('stage').append(renderer.domElement);
 const camera=new T.PerspectiveCamera(35,1,.05,100);camera.position.set(-3.3,3.2,18);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,2.65,1);controls.update();
 const draw=()=>renderer.render(scene,camera);controls.addEventListener('change',draw);
 new ResizeObserver(()=>{const {width,height}=$('stage').getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();draw();}).observe($('stage'));
 function select(changed){before.visible=!changed;after.visible=changed;$('modelTitle').textContent=changed?'수정본':'기존 모델';$('after').setAttribute('aria-pressed',String(changed));$('before').setAttribute('aria-pressed',String(!changed));draw();}
 $('after').onclick=()=>select(true);$('before').onclick=()=>select(false);
 $('front').onclick=()=>{camera.position.set(0,3.2,18);controls.target.set(0,2.65,1);controls.update();draw();};
 $('referenceView').onclick=()=>{camera.position.set(-3.3,3.2,18);controls.target.set(0,2.65,1);controls.update();draw();};
 $('angle').onclick=()=>{camera.position.set(12,8,19);controls.target.set(0,3,1);controls.update();draw();};
 const inspect=root=>{let triangles=0,meshes=0;root.traverse(o=>{if(!o.isMesh)return;meshes++;const p=o.geometry.attributes.position;for(const v of p.array)if(!Number.isFinite(v))throw Error('모델에 잘못된 좌표가 있습니다.');triangles+=(o.geometry.index?.count??p.count)/3;});return{meshes,triangles};};
 const report={before:inspect(before),after:inspect(after),status:'loaded'};window.localDetailReport=report;
 $('status').textContent=`기존 ${report.before.triangles.toLocaleString()} → 수정 ${report.after.triangles.toLocaleString()} 삼각형 · 같은 조명으로 비교 · 치수는 사진 비례로 추정`;
 draw();
}catch(error){$('status').textContent='미리보기를 불러오지 못했습니다.';$('error').textContent=error.message;console.error(error);}
