import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {createStreet} from './street.js';
const names=['분리수거함','자전거·거치대','실외기','꽃 화단','배전함','나무 상자','동네 게시판'];
const descriptions=['뚜껑·투입구·손잡이·바퀴·분류 라벨','바퀴살·림·페달·체인·브레이크 케이블·고정 볼트','팬 날개·동심원 보호망·통풍구·나사·배관','꽃잎·꽃술·잎·흙·화단 테두리','경첩·통풍구·손잡이·주의 표식·받침','판재 이음선·못·손잡이 홈','지붕·공지 종이·고정핀·문장선·기초 받침'];
const view=document.querySelector('#view'),scene=new T.Scene();scene.background=new T.Color(0xe8edf0);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));view.append(renderer.domElement);
const camera=new T.PerspectiveCamera(36,1,.01,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.6;controls.maxDistance=8;controls.maxPolarAngle=Math.PI*.49;
scene.add(new T.HemisphereLight(0xffffff,0x86908b,2));const light=new T.DirectionalLight(0xffffff,2.3);light.position.set(-3,6,5);scene.add(light);
const floor=new T.Mesh(new T.CircleGeometry(2.5,64),new T.MeshStandardMaterial({color:0xd7d6cf}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
let model,index=2,tone=false;
function reset(){const h=index===6?.85:index===4?.7:.42;controls.target.set(0,h,0);camera.position.set(1.45,h+1.05,2.5);controls.update()}
function select(i){index=(i+7)%7;if(model){scene.remove(model);model.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}model=createStreet([],()=>0,()=>null,index);scene.add(model);if(tone)model.traverse(o=>{if(o.isMesh){const c=o.material.color;const v=.2126*c.r+.7152*c.g+.0722*c.b;o.material.color.setRGB(v,v,v)}});document.querySelector('#description').textContent=names[index]+' — '+descriptions[index];document.querySelectorAll('#types button').forEach((b,j)=>b.classList.toggle('active',j===index));reset()}
names.forEach((n,i)=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>select(i);document.querySelector('#types').append(b)});
document.querySelector('#prev').onclick=()=>select(index-1);document.querySelector('#next').onclick=()=>select(index+1);document.querySelector('#reset').onclick=reset;document.querySelector('#tone').onclick=()=>{tone=!tone;document.querySelector('#tone').classList.toggle('active',tone);select(index)};
new ResizeObserver(()=>{const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}).observe(view);
select(index);renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
