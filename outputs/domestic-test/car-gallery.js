import * as T from 'three';
import {loadCarBillboardAssets,createCarBillboard} from './car-billboards.js?v=87';
import {WHEEL_POINTS} from './car-registration.js?v=86';
const $=id=>document.getElementById(id),host=$('viewer'),scene=new T.Scene();
scene.background=new T.Color('#dfe7e1');scene.fog=new T.Fog('#dfe7e1',24,48);
const camera=new T.PerspectiveCamera(35,1,.1,100),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;host.prepend(renderer.domElement);
const mat=color=>new T.MeshBasicMaterial({color});
function slab(x,y,z,w,h,d,color){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));o.position.set(x,y,z);scene.add(o);return o;}
slab(0,-.06,0,60,.10,60,'#cbd6cf');
slab(0,-.005,0,13,.01,12,'#a9b7b0');
// Parking markings remain fixed while only the picture of the car changes.
for(const x of [-3.75,-1.25,1.25,3.75])slab(x,.002,0,.06,.008,5.1,'#edf1e9');
for(const x of [-2.5,0,2.5]){slab(x,.002,-2.55,2.5,.008,.06,'#edf1e9');if(x!==0)slab(x,.08,-2.2,1.4,.15,.14,'#667971');}
slab(0,.10,-3.2,13,.2,.32,'#c7d0c7');slab(0,.08,-4.2,13,.15,1.8,'#e3e9e0');
const grid=new T.GridHelper(40,40,0xa5b3aa,0xc4cec6);grid.position.y=-.008;scene.add(grid);
const shadow=new T.Mesh(new T.PlaneGeometry(1.95,4.65),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;void main(){vec2 p=abs(vUv*2.-1.);float d=pow(pow(p.x,4.)+pow(p.y,4.),.25);float a=(1.-smoothstep(.58,1.,d))*.38;gl_FragColor=vec4(.09,.14,.12,a);}`}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.009;scene.add(shadow);
// Contact shadows and the debug proxy use the same four fixed world anchors.
const contactMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;void main(){vec2 p=(vUv*2.-1.);float a=(1.-smoothstep(.28,1.,length(p)))*.65;gl_FragColor=vec4(.06,.09,.07,a);}`});
const contacts=Object.entries(WHEEL_POINTS).map(([wheel,p])=>{const mesh=new T.Mesh(new T.PlaneGeometry(.34,.66),contactMaterial);mesh.rotation.x=-Math.PI/2;mesh.position.fromArray(p);mesh.position.y=.011;mesh.userData.wheel=wheel;scene.add(mesh);return mesh;});
const debug=new T.Group();debug.visible=false;scene.add(debug);
function debugBox(w,h,d,y,color){const box=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w,h,d)),new T.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.65}));box.position.y=y;box.renderOrder=20;debug.add(box);}
debugBox(1.825,1.42,4.71,.71,'#208976');
for(const p of Object.values(WHEEL_POINTS)){const marker=new T.Mesh(new T.SphereGeometry(.045,12,8),new T.MeshBasicMaterial({color:'#00be90',depthTest:false}));marker.position.fromArray(p);marker.renderOrder=21;debug.add(marker);const wheel=new T.LineSegments(new T.EdgesGeometry(new T.CylinderGeometry(.31,.31,.20,20)),new T.LineBasicMaterial({color:'#208976',depthTest:false,transparent:true,opacity:.6}));wheel.rotation.z=Math.PI/2;wheel.position.set(p[0],.324,p[2]);wheel.renderOrder=20;debug.add(wheel);}
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
const params=new URLSearchParams(location.search);
// A reproducible QA view: one post in front of the car, one behind it.
if(params.has('occlusion')){slab(.45,.75,2.8,.16,1.5,.16,'#e5804f');slab(-.45,.75,-2.8,.16,1.5,.16,'#277c91');}
let angle=+(params.get('angle')??45),elevation=+(params.get('elevation')??20),distance=9,orbit=false,last=0,car,assets,lastIndex=-1;
function sync(){angle=(angle%360+360)%360;elevation=Math.max(0,Math.min(70,elevation));$('angle').value=angle;$('elevation').value=elevation;$('distance').value=distance;$('angleValue').textContent=Math.round(angle)+'°';$('elevationValue').textContent=Math.round(elevation)+'°';$('distanceValue').textContent=distance.toFixed(1)+'m';$('orbit').textContent=orbit?'회전 멈추기':'자동으로 돌려보기';$('orbit').setAttribute('aria-pressed',String(orbit));$('orbit').classList.toggle('active',orbit);document.querySelectorAll('.controls [data-pitch]').forEach(b=>b.classList.toggle('active',+b.dataset.pitch===elevation));}
function setView(a,p,frameIndex=null){angle=a;elevation=p;orbit=false;car?.setFrame(frameIndex);sync();}
function drawFrames(){if(!assets)return;const pitch=+$('sheetPitch').value;const container=$('frames');container.replaceChildren();
  for(const frame of assets.catalog.frames.filter(f=>f.elevation===pitch)){
    const button=document.createElement('button'),canvas=document.createElement('canvas');canvas.width=300;canvas.height=206;const ctx=canvas.getContext('2d'),[x0,y0,x1,y1]=frame.pixels,w=x1-x0,h=y1-y0,scale=Math.min(282/car.layout.canvasWidth,178/car.layout.canvasHeight),sw=w*scale,sh=h*scale;
    // Preview the exact same source crop used by the WebGL billboard.
    ctx.save();ctx.translate(150,188);if(frame.mirror)ctx.scale(-1,1);ctx.drawImage(assets.textures.get(frame.sheet).image,x0,y0,w,h,-sw/2,-sh,sw,sh);ctx.restore();
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<240)pixels.data[i]=0;ctx.putImageData(pixels,0,0);for(const p of frame.wheelLandmarks){ctx.beginPath();ctx.arc(150+(p.uv[0]-.5)*sw,188-p.uv[1]*sh,3,0,Math.PI*2);ctx.fillStyle=p.observed?'#ed5b38':'#c79a20';ctx.fill();}
    button.className='frame';button.dataset.angle=frame.angle;button.dataset.pitch=frame.elevation;button.setAttribute('aria-label',`${pitch}도 높이, ${frame.angle}도 방향`);button.append(canvas,document.createTextNode(`${frame.angle}°`));button.onclick=()=>{setView(frame.angle,pitch,assets.catalog.frames.indexOf(frame));host.scrollIntoView({block:'start'});};container.append(button);
  }
}
try{assets=await loadCarBillboardAssets();car=createCarBillboard(assets);scene.add(car.group);host.dataset.ready='true';host.dataset.frameCount=assets.catalog.frames.length;host.dataset.generatedImages=assets.catalog.generatedFrameCount;host.dataset.sizing='fixed-four-wheel-guide-v87';host.dataset.assetVersion=assets.catalog.version;drawFrames();}catch(e){$('error').textContent=e.message;host.dataset.error=e.message;}
for(const id of ['angle','elevation','distance'])$(id).oninput=e=>{orbit=false;car?.setFrame(null);if(id==='angle')angle=+e.target.value;else if(id==='elevation')elevation=+e.target.value;else distance=+e.target.value;sync();};
document.querySelectorAll('.controls [data-angle]').forEach(b=>b.onclick=()=>setView(+b.dataset.angle,elevation));document.querySelectorAll('.controls [data-pitch]').forEach(b=>b.onclick=()=>setView(angle,+b.dataset.pitch));
$('orbit').onclick=()=>{car?.setFrame(null);orbit=!orbit;sync();};$('density').onchange=e=>{car?.setStep(+e.target.value);};$('shadow').onchange=e=>{shadow.visible=e.target.checked;contacts.forEach(m=>m.visible=e.target.checked);};$('debug').onchange=e=>{debug.visible=e.target.checked;car?.setDebug(e.target.checked);$('anchorReport').hidden=!e.target.checked;};$('sheetPitch').onchange=drawFrames;$('reset').onclick=()=>{distance=9;setView(45,20);};
$('save').onclick=()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`avante-${Math.round(angle)}deg-${Math.round(elevation)}high.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
let drag=null;renderer.domElement.addEventListener('pointerdown',e=>{car?.setFrame(null);drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId);orbit=false;sync();});renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;angle+=(e.clientX-drag[0])*.5;elevation+=(e.clientY-drag[1])*.25;drag=[e.clientX,e.clientY];sync();});for(const event of ['pointerup','pointercancel'])renderer.domElement.addEventListener(event,()=>drag=null);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();car?.setFrame(null);distance=Math.min(15,Math.max(5.5,distance+e.deltaY*.006));sync();},{passive:false});
sync();renderer.setAnimationLoop(now=>{const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(orbit){angle+=dt*14;sync();}const a=angle*Math.PI/180,p=elevation*Math.PI/180;camera.position.set(Math.sin(a)*Math.cos(p)*distance,.71+Math.sin(p)*distance,Math.cos(a)*Math.cos(p)*distance);camera.lookAt(0,.71,0);car?.update(camera);
 if(car){const f=car.frame;for(const m of contacts)m.visible=shadow.visible;host.dataset.currentFrame=f.index;host.dataset.anchorErrorPixels=(car.mesh.userData.view.anchorRms*host.clientHeight/2).toFixed(6);host.dataset.anchorCount=car.mesh.userData.view.supportAnchors.length;host.dataset.visibleWheelCount=car.mesh.userData.view.visibleWheelIndices.length;host.dataset.foldedTriangles=car.mesh.userData.view.foldedTriangles;host.dataset.registrationRotation=(car.mesh.userData.view.rotation*180/Math.PI).toFixed(2);host.dataset.requestedAngle=angle.toFixed(2);host.dataset.requestedElevation=elevation.toFixed(2);if(f.index!==lastIndex){lastIndex=f.index;$('viewLabel').textContent=`새 가이드 이미지 · 그림 ${f.angle}° · 높이 ${f.elevation}° · ${f.index+1} / 96`;document.querySelectorAll('.frame').forEach(b=>b.classList.toggle('active',+b.dataset.angle===f.angle&&+b.dataset.pitch===f.elevation));}}
 if(car&&debug.visible)$('anchorReport').textContent=`고정 바퀴 4개 · 측정 접점 ${host.dataset.visibleWheelCount}개 · ${+host.dataset.visibleWheelCount?'좌표 보정 오차 '+Number(host.dataset.anchorErrorPixels).toFixed(3)+'px':'위에서 본 접점은 추정'}`;renderer.render(scene,camera);});
