import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';
import {rooftopCatalog,createRooftopAsset} from './rooftops.js?v=151';
import {createIllustrationRenderer} from './illustration-renderer.js?v=151';
import {DEFAULT_APPEARANCE} from './illustration-settings.js?v=151';
const $=id=>document.getElementById(id),scene=new T.Scene();scene.background=new T.Color('#d3d6c9');scene.add(new T.HemisphereLight(0xffffff,0x8d998c,2.4));const light=new T.DirectionalLight(0xffffff,2.1);light.position.set(-3,5,8);scene.add(light);const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(460,320);renderer.outputColorSpace=T.SRGBColorSpace;
const camera=new T.PerspectiveCamera(35,460/320,.01,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;let model,selected=0;const ink=createIllustrationRenderer(renderer);
function draw(){ink.render(scene,camera,()=>renderer.render(scene,camera),{...DEFAULT_APPEARANCE,lines:$('ink').checked});}
function dispose(g){g?.traverse(m=>{m.geometry?.dispose();m.material?.dispose()})}
function frame(){const b=new T.Box3().setFromObject(model),c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3()),d=s.length()*.5/Math.sin(Math.min(camera.fov*Math.PI/360,Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect)))*1.04;controls.target.copy(c);camera.position.copy(c).add(new T.Vector3(.85,.85,1.3).normalize().multiplyScalar(d));controls.update()}
function load(i){if(model){scene.remove(model);dispose(model)}model=createRooftopAsset(rooftopCatalog[i].id);scene.add(model);frame()}
function resize(){renderer.setSize($('stage').clientWidth,$('stage').clientHeight);camera.aspect=$('stage').clientWidth/$('stage').clientHeight;camera.updateProjectionMatrix()}
function open(i){selected=i;$('detail').showModal();$('stage').append(renderer.domElement);resize();load(i);$('title').textContent=rooftopCatalog[i].name}
$('close').onclick=()=>$('detail').close();$('prev').onclick=()=>open((selected+7)%8);$('next').onclick=()=>open((selected+1)%8);$('reset').onclick=frame;new ResizeObserver(()=>{if($('detail').open)resize()}).observe($('stage'));
async function save(all){const root=new T.Group();for(const [i,r] of rooftopCatalog.entries()){if(!all&&i!==selected)continue;const m=createRooftopAsset(r.id);m.traverse(o=>{if(o.isLineSegments)o.visible=false});if(all)m.position.set((i%4)*7,0,Math.floor(i/4)*7);root.add(m)}const glb=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([glb],{type:'model/gltf-binary'}));a.download=all?'rooftop-access-8.glb':rooftopCatalog[selected].id+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);dispose(root)}
$('save').onclick=()=>save(false);$('all').onclick=()=>save(true);
function thumbnails(){const active=selected;$('grid').replaceChildren();renderer.setSize(460,320);camera.aspect=460/320;camera.updateProjectionMatrix();for(const [i,r] of rooftopCatalog.entries()){load(i);draw();const card=document.createElement('button');card.className='card';const img=new Image();img.src=renderer.domElement.toDataURL();img.alt=r.name;const title=document.createElement('strong');title.textContent=r.name;card.append(img,title);card.onclick=()=>open(i);$('grid').append(card);}if($('detail').open){resize();load(active);}}
$('ink').onchange=thumbnails;thumbnails();
$('progress').textContent='8종 준비 완료 · 카드를 눌러 회전하며 보기';renderer.setAnimationLoop(()=>{if($('detail').open){controls.update();draw()}});
