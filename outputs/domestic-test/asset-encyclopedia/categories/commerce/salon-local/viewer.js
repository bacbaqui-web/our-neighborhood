import * as T from 'three';
import {OrbitControls} from '../../../../vendor/OrbitControls.js';
import {assembleSalon} from './assembly.js';
import {createPart,definitions,PREFIX,dimensions} from './model.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color('#e5e9df');
const sky=new T.HemisphereLight('#ffffff','#76846f',1.4);scene.add(sky);
const sun=new T.DirectionalLight('#fff8e5',2.1);sun.position.set(-6,10,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:10,bottom:-6,near:.1,far:35});sun.shadow.normalBias=.025;scene.add(sun);
const floor=new T.Mesh(new T.BoxGeometry(11.6,.12,8.8),new T.MeshStandardMaterial({color:'#b1b8a6',roughness:1}));floor.position.set(0,-.12,1.1);floor.receiveShadow=true;scene.add(floor);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;$('stage').append(renderer.domElement);
const camera=new T.PerspectiveCamera(36,1,.05,100),controls=new OrbitControls(camera,renderer.domElement);
let assembly,solo,version=0;
function dispose(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
const draw=()=>renderer.render(scene,camera);controls.addEventListener('change',draw);
const framing=()=>Math.max(.8,Number($('width').value)/6.4);
const home=()=>{camera.fov=36;camera.updateProjectionMatrix();camera.position.set(-2.3*framing(),2.8,12.4*framing());controls.target.set(0,2,0);controls.update();draw();};
new ResizeObserver(()=>{const {width,height}=$('stage').getBoundingClientRect();if(width<=0||height<=0)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();draw();}).observe($('stage'));
function inspect(root){let triangles=0,meshes=0,upper=0;root.traverse(o=>{if(/UpperWindow/.test(o.name))upper++;if(!o.isMesh)return;meshes++;const p=o.geometry.attributes.position;for(const v of p.array)if(!Number.isFinite(v))throw Error('잘못된 모델 좌표가 있습니다.');triangles+=(o.geometry.index?.count??p.count)/3;});if(upper)throw Error('점포에 상층 창문이 포함됐습니다.');return{triangles,meshes,upper};}
function update(){
 if(!assembly)return;
 assembly.root.visible=!solo;
 assembly.layers.exterior.visible=$('exterior').checked;assembly.layers.interior.visible=$('interior').checked;
 assembly.layers.lighting.visible=$('interior').checked&&!solo;
 const night=$('night').checked;scene.background.set(night?'#26394b':'#e5e9df');sky.intensity=night?.18:1.4;sun.intensity=night?.10:2.1;
 assembly.volume.update($('interior').checked&&!solo);assembly.volume.outline.visible=$('volume').checked&&!solo;
 const sizes=dimensions({width:Number($('width').value),height:Number($('height').value),depth:Number($('depth').value)});$('proportions').textContent=`문 높이 2.32m · 문 위 고정창 ${sizes.transomHeight.toFixed(2)}m · 간판 아래 띠 ${sizes.fasciaHeight.toFixed(2)}m · 간판 상단 ${sizes.signTop.toFixed(2)}m (사진 비례 추정)`;
 assembly.layers.fixed.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])if(m.userData.litSign)m.emissiveIntensity=night?.7:.12;});
 const placed=assembly.plan.placed;
 $('status').textContent=solo?`${definitions[solo.userData.key].name} · 백과 고정 ID ${solo.userData.assetId}`:`외부 ${placed.filter(p=>p.layer==='exterior').length}개 · 실내 ${placed.filter(p=>p.layer==='interior').length}개 · 천장등 ${placed.filter(p=>p.layer==='lighting').length}개 · 중앙 시술석 ${assembly.plan.centerStationCount}석 · 출입 통로 확보`;
 $('diagnostics').replaceChildren(...assembly.plan.omitted.map(p=>{const li=document.createElement('li');li.textContent=(assembly.registry.resolve(p.assetId)?.name??p.assetId)+' — '+p.reason;return li;}));
 $('diagnosticSummary').textContent=assembly.plan.omitted.length?`공간 조건에 따라 ${assembly.plan.omitted.length}개 제외`:'등록·앞 공간·출입 통로 검사 통과';
 draw();
}
async function load(){const current=++version;$('error').textContent='';try{const next=await assembleSalon({frontDepth:Number($('space').value),width:Number($('width').value),height:Number($('height').value),depth:Number($('depth').value)});if(current!==version){dispose(next.root);return;}if(assembly){scene.remove(assembly.root);dispose(assembly.root);}assembly=next;scene.add(assembly.root);window.localDetailReport={...inspect(assembly.root),placed:assembly.plan.placed.length,omitted:assembly.plan.omitted.length,requiredFailures:assembly.plan.requiredFailures.length,registeredParts:Object.keys(definitions).length};update();}catch(e){$('error').textContent=e.message;console.error(e);}}
function leaveSolo(){if(solo){scene.remove(solo);dispose(solo);solo=null;}$('part').value='';home();}
$('base').onclick=()=>{leaveSolo();$('exterior').checked=false;$('interior').checked=false;update();};
$('assembled').onclick=()=>{leaveSolo();$('exterior').checked=true;$('interior').checked=true;update();};
for(const id of ['exterior','interior','night','volume'])$(id).onchange=update;
for(const key of ['width','height','depth'])$(key).onchange=()=>{leaveSolo();void load();};
$('space').onchange=()=>{leaveSolo();void load();};
$('front').onclick=()=>{camera.fov=36;camera.updateProjectionMatrix();camera.position.set(0,2.4,13*framing());controls.target.set(0,2,0);controls.update();draw();};
$('angle').onclick=()=>{camera.fov=36;camera.updateProjectionMatrix();camera.position.set(7.5*framing(),4.3,12*framing());controls.target.set(0,2,0);controls.update();draw();};
$('part').onchange=()=>{const key=$('part').value;leaveSolo();if(key){const a=assembly.registry.resolve(PREFIX+key);if(!a){$('error').textContent='백과에서 에셋을 찾지 못했습니다.';return;}solo=createPart(a.key,{width:Number($('width').value),height:Number($('height').value),depth:Number($('depth').value)});scene.add(solo);$('part').value=key;const box=new T.Box3().setFromObject(solo),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),distance=Math.max(size.x/Math.max(camera.aspect,.5),size.y,size.z)*2.3;controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(.3,.2,1).normalize().multiplyScalar(distance));controls.update();}update();};
for(const [key,d]of Object.entries(definitions)){const o=document.createElement('option');o.value=key;o.textContent=d.name;$('part').append(o);}
home();await load();const initial=new URL(location.href).searchParams.get('part');if(initial&&definitions[initial]){$('part').value=initial;$('part').onchange();}

$('inside').onclick=()=>{leaveSolo();$('interior').checked=true;camera.fov=110;camera.updateProjectionMatrix();camera.position.set(dimensions({width:Number($('width').value)}).doorX,1.65,-.25);controls.target.set(0,1.3,-Number($('depth').value));controls.update();update();};
