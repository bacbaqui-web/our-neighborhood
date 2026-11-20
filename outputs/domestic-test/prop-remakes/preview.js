import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {previewModel} from '../building-assets/model.js';
import {assetById} from '../building-assets/catalog.js';
import {props} from './catalog.js';
const $=id=>document.getElementById(id),host=$('stage');
for(const p of props){const o=document.createElement('option');o.value=p.key;o.textContent=p.name;$('asset').append(o);}
$('asset').value=props.some(p=>p.key===new URLSearchParams(location.search).get('asset'))?new URLSearchParams(location.search).get('asset'):'barrier';
let extent=6,targetY=.65,sequence=0,current=[];
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.05,150),controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.65,0);
const hemi=new T.HemisphereLight(0xcde7fa,0x647267,1.6),sun=new T.DirectionalLight(0xfff5de,3);sun.position.set(-5,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:40});sun.shadow.bias=-.0002;scene.add(hemi,sun);
const surface=new T.Group();scene.add(surface);const ground=new T.Mesh(new T.PlaneGeometry(32,32),new T.MeshStandardMaterial({color:0x899490,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;surface.add(ground);
const house=previewModel(assetById['home-2']);house.position.set(0,0,-9);house.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true;});scene.add(house);
const lines=[];
function outline(root){root.traverse(m=>{if(m.isMesh){const l=new T.LineSegments(new T.EdgesGeometry(m.geometry,32),new T.LineBasicMaterial({color:0x34413d,transparent:true,opacity:.65}));m.add(l);lines.push(l);}});}
outline(house);
function draw(){renderer.render(scene,camera);}
function lighting(){const night=$('light').value==='night';scene.background=new T.Color(night?0x263746:0xb9d1d8);hemi.intensity=night?.3:1.6;sun.intensity=night?.65:3;sun.color.set(night?0x91b4e6:0xfff5de);draw();}
function view(){house.visible=$('view').value!=='back';const d=extent;const positions={perspective:[d*.48,targetY+d*.32,d*.85],front:[0,targetY,d],side:[d,targetY,0],back:[0,targetY,-d],top:[0,targetY+d,.01]};camera.position.fromArray(positions[$('view').value]);controls.target.set(0,targetY,0);controls.update();draw();}
$('light').onchange=lighting;$('view').onchange=view;$('ground').onchange=()=>{surface.rotation.z=Math.atan(Number($('ground').value));draw();};$('lines').onchange=()=>{lines.forEach(l=>l.visible=$('lines').checked);draw();};controls.addEventListener('change',draw);
new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();draw();}).observe(host);
function dispose(root){root.traverse(m=>{m.geometry?.dispose();if(m.material){for(const mat of Array.isArray(m.material)?m.material:[m.material]){mat.map?.dispose();mat.dispose();}}});}
async function load(){
 const ticket=++sequence,p=props.find(p=>p.key===$('asset').value);host.dataset.ready='false';$('error').textContent='';
 document.title=p.name+' 비교';document.querySelector('h1').textContent=document.title;$('download').href=p.key+'-v1.glb';
 $('ground').value='0';surface.rotation.z=0;$('ground').disabled=p.support!=='ground';
 try{
 const loaded=await Promise.allSettled([new GLTFLoader().loadAsync('../roadview50/'+p.old+'.glb'),new GLTFLoader().loadAsync('./'+p.key+'-v1.glb')]);
 if(ticket!==sequence||loaded.some(r=>r.status==='rejected')){loaded.forEach(r=>{if(r.status==='fulfilled')dispose(r.value.scene);});if(ticket!==sequence)return;throw new Error('모델 파일을 확인해 주세요.');}
 const [old,model]=loaded.map(r=>r.value.scene);
 current.forEach(r=>{surface.remove(r);dispose(r);});current=[];lines.splice(0,lines.length,...lines.filter(l=>l.parent&&house.getObjectById(l.id)));
 const ob=new T.Box3().setFromObject(old),nb=new T.Box3().setFromObject(model),os=ob.getSize(new T.Vector3()),ns=nb.getSize(new T.Vector3()),oc=ob.getCenter(new T.Vector3());
 const gap=Math.max(os.x,ns.x)*.7+.08;
 old.position.set(-gap-oc.x,-ob.min.y,-oc.z);model.position.x=gap;
 if(p.support==='door'){
  old.position.y=1.1-oc.y;old.position.z=-ob.min.z;model.position.y=1.1;
  for(const x of[-gap,gap]){const panel=new T.Mesh(new T.BoxGeometry(Math.max(os.x,ns.x)*1.5,.65,.035),new T.MeshStandardMaterial({color:0x899b91,roughness:1}));panel.position.set(x,1.1,-.0175);surface.add(panel);current.push(panel);}
 }
 for(const m of[old,model]){m.traverse(n=>{if(n.isMesh)n.castShadow=n.receiveShadow=true;});surface.add(m);current.push(m);outline(m);}
 const box=new T.Box3().setFromObject(old).union(new T.Box3().setFromObject(model));targetY=box.getCenter(new T.Vector3()).y;const size=box.getSize(new T.Vector3());extent=Math.max(size.x*1.5,size.y*2.2,size.z*2.5,.7);camera.near=.005;camera.updateProjectionMatrix();
 const count=root=>{let n=0;root.traverse(m=>{if(m.isMesh)n+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});return n;};
 $('stats').textContent=`기존 ${count(old)}삼각형 · 교체안 ${count(model)}삼각형 · 폭 ${Math.round(ns.x*100)}cm / 높이 ${Math.round(ns.y*100)}cm / 깊이 ${Math.round(ns.z*100)}cm`;
 $('note').textContent=p.support==='leaning'?'벽에 기대어 사용하는 사다리입니다. 비교 화면에서는 세워 전시했습니다.':p.support==='embedded'?'교체안은 테두리를 바닥에 맞추고 몸체를 땅속에 넣었습니다.':p.support==='door'?'도어록 뒤판을 문 표면에 맞췄습니다. 문 안쪽 장치는 포함하지 않았습니다.':p.support==='roof'?'지붕에 고정하는 받침을 포함했습니다. 비교 화면에서는 바닥에 놓았습니다.':'두 모델은 실제 크기를 유지한 채 나란히 놓았습니다.';
 lines.forEach(l=>l.visible=$('lines').checked);host.dataset.ready='true';lighting();view();
 }catch(e){$('error').textContent='비교 모델을 불러오지 못했습니다. '+e.message;console.error(e);}
}
$('asset').onchange=()=>{const url=new URL(location.href);url.searchParams.set('asset',$('asset').value);history.replaceState(null,'',url);load();};load();
