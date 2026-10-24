import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';

const $=id=>document.getElementById(id),host=$('viewer'),scene=new T.Scene();
const camera=new T.PerspectiveCamera(35,1,.05,100);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.NoToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
host.prepend(renderer.domElement);scene.background=new T.Color('#e3e9e7');scene.fog=new T.Fog('#e3e9e7',28,65);
const hemi=new T.HemisphereLight('#e9f1ff','#b5b9b1',1.4);scene.add(hemi);
const sun=new T.DirectionalLight('#fffdf8',2.3);sun.position.set(-4,7,5);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;
sun.shadow.camera.near=.5;sun.shadow.camera.far=25;sun.shadow.normalBias=.012;sun.shadow.bias=-.00006;scene.add(sun,sun.target);
function slab(x,y,z,w,h,d,color){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshLambertMaterial({color}));mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
slab(0,-.066,0,60,.12,60,'#b8c4bf');
slab(0,-.011,0,13,.02,12,'#a2b1ad');
for(const x of [-3.75,-1.25,1.25,3.75])slab(x,.002,0,.045,.004,5.1,'#edf1e9');
for(const x of [-2.5,0,2.5]){slab(x,.002,-2.55,2.5,.004,.045,'#edf1e9');if(x)slab(x,.08,-2.22,1.35,.15,.15,'#788b83');}
slab(0,.09,-3.2,13,.18,.28,'#d4dcd6');slab(0,.07,-4.2,13,.14,1.8,'#c8d2cb');
const shadowGroup=new T.Group();scene.add(shadowGroup);
function contact(x,z,w,h,opacity){const material=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 p;void main(){float a=(1.-smoothstep(.15,1.,length(p)))*${opacity.toFixed(3)};gl_FragColor=vec4(.12,.16,.17,a);}`});const m=new T.Mesh(new T.PlaneGeometry(w,h),material);m.rotation.x=-Math.PI/2;m.position.set(x,.006,z);shadowGroup.add(m);}
contact(0,0,2.12,4.72,.18);for(const x of [-.8025,.8025])for(const z of [-1.36,1.36])contact(x,z,.36,.53,.34);
const guide=new T.Group();guide.visible=false;scene.add(guide);
const bounds=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.825,1.42,4.71)),new T.LineBasicMaterial({color:'#278f7a',transparent:true,opacity:.65,depthTest:false}));bounds.position.y=.71;bounds.renderOrder=30;guide.add(bounds);
for(const x of [-.8025,.8025])for(const z of [-1.36,1.36]){const m=new T.Mesh(new T.SphereGeometry(.035,12,8),new T.MeshBasicMaterial({color:'#00b58c',depthTest:false}));m.position.set(x,.009,z);m.renderOrder=31;guide.add(m);}
new ResizeObserver(()=>{
 renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;
 // Keep the whole car visible when the task's side panel is narrow.
 camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(35)/2)*Math.max(1,1.35/camera.aspect)));
 camera.updateProjectionMatrix();
}).observe(host);
const params=new URLSearchParams(location.search);
let angle=Number(params.get('angle')??40),elevation=Number(params.get('elevation')??14),distance=Number(params.get('distance')??9),orbit=false,last=0,model;
const drawMeshes=[],outlines=[],materialPairs=[];
function updateStyle(){
 for(const [mesh,shaded,flat] of materialPairs){mesh.material=$('shade').checked?shaded:flat;mesh.material.wireframe=$('wire').checked;mesh.castShadow=$('shadow').checked&&mesh.userData.castsSilhouette;}
 for(const mesh of outlines)mesh.visible=$('outline').checked&&!$('wire').checked;
 sun.castShadow=$('shadow').checked;shadowGroup.visible=$('shadow').checked;
 renderer.shadowMap.needsUpdate=true;host.dataset.shading=String($('shade').checked);host.dataset.wireframe=String($('wire').checked);
}
try{
 const gltf=await new GLTFLoader().loadAsync('./cars/avante-cn7-mesh-v91/avante-cn7.glb?v=91');model=gltf.scene;
 // Blender +Y points forwards; glTF maps this to -Z. A fixed rotation makes
 // camera angle zero the front. No mesh transform ever depends on the view.
 model.rotation.y=Math.PI;scene.add(model);
 model.traverse(o=>{if(o.isMesh)drawMeshes.push(o);});
 let triangles=0,vertices=0,textureCount=0;const tireBounds=[];
 for(const mesh of drawMeshes){
  const source=mesh.material;
  for(const value of Object.values(source))if(value?.isTexture)textureCount++;
  const color=source.color.clone();const shaded=new T.MeshLambertMaterial({color});const flat=new T.MeshBasicMaterial({color});
  shaded.name=source.name;flat.name=source.name;materialPairs.push([mesh,shaded,flat]);mesh.material=shaded;mesh.userData.castsSilhouette=/Body_shell|Cabin_|tire$|mirror_housing|Shark_fin/.test(mesh.name);mesh.castShadow=mesh.userData.castsSilhouette;mesh.receiveShadow=true;
  const position=mesh.geometry.attributes.position;vertices+=position.count;triangles+=(mesh.geometry.index?.count??position.count)/3;
  if(/tire$/i.test(mesh.name))tireBounds.push({name:mesh.name,minY:new T.Box3().setFromObject(mesh).min.y});
  if(/Body_shell|Cabin_|tire$|mirror_housing/.test(mesh.name)){
   const ink=new T.MeshBasicMaterial({color:'#3b494c',side:T.BackSide});
   ink.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normalize(normal) * 0.0035;');};
   ink.customProgramCacheKey=()=> 'solid-car-silhouette-v91';
   const outline=new T.Mesh(mesh.geometry,ink);outline.name=mesh.name+'_silhouette';outline.position.copy(mesh.position);outline.quaternion.copy(mesh.quaternion);outline.scale.copy(mesh.scale);mesh.parent.add(outline);outlines.push(outline);
  }
 }
 host.dataset.ready='true';host.dataset.version='91';host.dataset.mode='solid-mesh';host.dataset.triangles=Math.round(triangles);host.dataset.imageTextures=textureCount;host.dataset.wheelContacts=JSON.stringify(tireBounds);
 $('polyBadge').textContent=`${Math.round(triangles).toLocaleString()} 삼각형 · 단색 재질`;
 $('modelInfo').textContent=`실제 메쉬 · ${Math.round(triangles).toLocaleString()} 삼각형 · 이미지 텍스처 없음`;
 updateStyle();
}catch(error){$('error').textContent='모델 불러오기 실패: '+error.message;host.dataset.error=error.message;console.error(error);}
function sync(){angle=(angle%360+360)%360;elevation=Math.max(0,Math.min(85,elevation));distance=Math.max(5.5,Math.min(15,distance));
 $('angle').value=angle;$('elevation').value=elevation;$('distance').value=distance;$('angleValue').textContent=Math.round(angle)+'°';$('elevationValue').textContent=Math.round(elevation)+'°';$('distanceValue').textContent=distance.toFixed(1)+'m';
 $('orbit').textContent=orbit?'회전 멈추기':'자동으로 돌려보기';$('orbit').setAttribute('aria-pressed',String(orbit));$('orbit').classList.toggle('active',orbit);
 document.querySelectorAll('[data-pitch]').forEach(b=>b.classList.toggle('active',+b.dataset.pitch===elevation));
}
for(const id of ['angle','elevation','distance'])$(id).oninput=e=>{orbit=false;if(id==='angle')angle=+e.target.value;else if(id==='elevation')elevation=+e.target.value;else distance=+e.target.value;sync();};
document.querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>{orbit=false;angle=+b.dataset.angle;sync();});
document.querySelectorAll('[data-pitch]').forEach(b=>b.onclick=()=>{orbit=false;elevation=+b.dataset.pitch;sync();});
$('orbit').onclick=()=>{orbit=!orbit;sync();};for(const id of ['shade','shadow','wire','outline'])$(id).onchange=updateStyle;
$('debug').onchange=e=>guide.visible=e.target.checked;
$('sun').oninput=e=>{const a=+e.target.value*Math.PI/180;sun.position.set(Math.sin(a)*7,7,Math.cos(a)*7);};
$('reset').onclick=()=>{angle=40;elevation=14;distance=9;orbit=false;sync();};
$('save').onclick=()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`avante-mesh-${Math.round(angle)}-${Math.round(elevation)}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
let drag=null;renderer.domElement.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId);orbit=false;sync();});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;angle+=(e.clientX-drag[0])*.45;elevation+=(e.clientY-drag[1])*.22;drag=[e.clientX,e.clientY];sync();});
for(const type of ['pointerup','pointercancel'])renderer.domElement.addEventListener(type,()=>drag=null);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance+=e.deltaY*.005;sync();},{passive:false});
sync();renderer.setAnimationLoop(now=>{const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(orbit){angle+=dt*16;sync();}const a=angle*Math.PI/180,p=elevation*Math.PI/180;
camera.position.set(Math.sin(a)*Math.cos(p)*distance,.71+Math.sin(p)*distance,Math.cos(a)*Math.cos(p)*distance);camera.lookAt(0,.71,0);
host.dataset.angle=angle.toFixed(2);host.dataset.elevation=elevation.toFixed(2);renderer.render(scene,camera);});
