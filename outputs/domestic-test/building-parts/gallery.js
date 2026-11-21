import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GLTFExporter} from '../vendor/GLTFExporter.js';
import {createIllustrationRenderer} from '../illustration-renderer.js';
import {DEFAULT_APPEARANCE} from '../illustration-settings.js';
import {categories,parts} from './parts.js?v=yard22';
import {preparePerimeterGardens} from '../perimeter-garden.js?v=garden21';
import {prepareCourtyards} from '../road-facing-courtyard.js?v=yard22';
import {basicWindowCatalog,windowOptions} from '../window-parts.js?v=windows20';
import {facadeTextureCatalog} from '../facade-textures.js?v=masonry19';
const $=id=>document.getElementById(id), scene=new T.Scene();scene.background=new T.Color('#e5e9e0');
scene.add(new T.HemisphereLight(0xffffff,0x959f8c,2.6));
const light=new T.DirectionalLight(0xfffcf1,2.3);light.position.set(-4,7,10);scene.add(light);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(560,400);renderer.outputColorSpace=T.SRGBColorSpace;
const ink=createIllustrationRenderer(renderer),camera=new T.PerspectiveCamera(32,1.4,.01,500),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
let model,selected=0,activeCategory='all',busy=false,renderGeneration=0,composition=null,yardOptions=null;
const currentOptions=()=>composition||yardOptions;
const rendered=new Map(),cardMap=new Map();
function draw(){model?.updatePreview?.(camera);ink.render(scene,camera,()=>renderer.render(scene,camera),{...DEFAULT_APPEARANCE,lines:$('ink').checked,outerWidth:1.4,innerWidth:.65});}
function dispose(root){const geos=new Set(),mats=new Set();root?.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])mats.add(m);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
function load(index,options=null){if(model){scene.remove(model);dispose(model);}model=options&&parts[index].compose?parts[index].compose(options):parts[index].make();scene.add(model);model.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());let triangles=0,finite=true;
 model.traverse(o=>{const p=o.geometry?.attributes.position;if(!p)return;for(const x of p.array)if(!Number.isFinite(x))finite=false;if(o.isMesh&&!o.userData.isVegetationSunCaster&&o.visible&&o.material?.opacity!==0)triangles+=(o.geometry.index?.count??p.count)/3*(o.isInstancedMesh?o.count:1);});
 if(!finite||bounds.isEmpty()||triangles===0)throw Error(parts[index].name+' 모델 좌표를 확인해야 합니다.');
 rendered.set(index,{size:size.toArray(),triangles,finite});frame(parts[index].view);
}
function frame(view='angle'){const b=new T.Box3().setFromObject(model),c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3());const direction=new T.Vector3(...(view==='top'?[0,1,.001]:view==='front'?[0,.04,1]:view==='courtyard'?[-.35,.85,1]:view==='garden'?[-.85,.65,1]:[.48,.32,1])).normalize();
 if(view==='garden-close'&&model.userData.partType==='road-facing-courtyard'){const p=model.userData.plan;c.set(0,1.2,p.offset*.4);camera.position.copy(c).addScaledVector(new T.Vector3(-.2,.6,1).normalize(),p.width*1.6);camera.near=.01;camera.far=500;camera.updateProjectionMatrix();controls.target.copy(c);controls.update();return;}
 if(view==='garden-close'&&model.userData.plan?.building){const p=model.userData.plan;c.set(-p.width*.1,1.1,p.depth*.35);camera.position.copy(c).addScaledVector(new T.Vector3(-.6,.30,1).normalize(),p.width*1.45);camera.near=.01;camera.far=500;camera.updateProjectionMatrix();controls.target.copy(c);controls.update();return;}
 const tangent=Math.tan(camera.fov*Math.PI/360),distance=Math.max(s.y/2,s.x/(2*camera.aspect),s.z*.48)/tangent*1.38+s.z*.45;
 camera.position.copy(c).addScaledVector(direction,Math.max(distance,1));camera.near=Math.max(.005,distance/1000);camera.far=distance*20+50;camera.updateProjectionMatrix();controls.target.copy(c);controls.update();
}
function measure(info){return `폭 ${info.size[0].toFixed(2)}m · 높이 ${info.size[1].toFixed(2)}m · 깊이 ${info.size[2].toFixed(2)}m`;}
function resize(){const w=$('stage').clientWidth,h=$('stage').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
function showSize(){const info=rendered.get(selected);$('size').textContent=measure(info)+' · '+info.triangles.toLocaleString()+' 삼각형';}
function fillWindowOptions(){
 $('window-options').hidden=!composition;if(!composition)return;
 for(const key of ['type','width','height','frame','guard'])$('window-'+key).value=composition[key];
 $('window-recess').value=Math.round(composition.recess*100);$('window-finish').value=composition.wallTexture;
 for(const key of ['rack','awning','sill','wall'])$('window-'+key).checked=composition[key];
 const n=basicWindowCatalog.find(r=>r.id===composition.type).name;
 $('window-summary').textContent=`${n} · 창틀 ${Math.round(composition.recess*100)}cm 안쪽 · 유리는 창틀보다 조금 더 안쪽`;
}
function open(index){if(busy)return;selected=index;const p=parts[index];composition=p.windowConfig?windowOptions(p.windowConfig):null;yardOptions=p.courtyard?{gateOpen:true}:null;fillWindowOptions();$('detail').showModal();$('detail').scrollTop=0;$('stage').append(renderer.domElement);resize();load(index,currentOptions());$('category').textContent=categories.find(c=>c[0]===p.category)[1]+' / '+p.tag;$('title').textContent=p.name;$('garden-closeup').hidden=!(model.userData.plan?.building||p.courtyard);$('garden-closeup').textContent=p.courtyard?'마당 가까이':'화단 가까이';$('gate-toggle').hidden=!p.courtyard;$('gate-toggle').textContent='대문 닫기';$('description').textContent=p.note;showSize();$('source').replaceChildren(...p.sources.map(path=>{const a=document.createElement('a');a.href=path;a.target='_blank';a.rel='noopener';a.textContent=path.split('/').pop();return a;}));$('part-id').textContent=p.id;history.replaceState(null,'','#'+p.id);draw();}
function filter(){const q=$('search').value.trim().toLowerCase();let count=0;
 for(const [i,card] of cardMap){const p=parts[i],visible=(activeCategory==='all'||p.category===activeCategory)&&[p.name,p.note,p.tag,p.id].join(' ').toLowerCase().includes(q);card.hidden=!visible;if(visible)count++;}
 for(const section of document.querySelectorAll('main section'))section.hidden=![...section.querySelectorAll('.card')].some(c=>!c.hidden);
 $('progress').textContent=`${parts.length}개 미리보기 중 ${count}개 표시 · 카드를 눌러 회전하며 보기`;
 for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.category===activeCategory));
}
function build(){for(const [id,title,note] of categories){const section=document.createElement('section');section.id='section-'+id;const head=document.createElement('div');head.className='section-head';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=note;head.append(h,p);const grid=document.createElement('div');grid.className='grid';section.append(head,grid);$('catalog').append(section);
 for(const [i,part] of parts.entries()){if(part.category!==id)continue;const card=document.createElement('button');card.className='card';card.dataset.part=part.id;card.disabled=true;const img=new Image();img.alt=part.name+' 실제 3D 부품';img.width=560;img.height=400;const body=document.createElement('span');body.className='card-body';const tag=document.createElement('span');tag.className='tag';tag.textContent=part.tag;const strong=document.createElement('strong');strong.textContent=part.name;const note=document.createElement('span');note.className='note';note.textContent=part.note;const meta=document.createElement('span');meta.className='meta';body.append(tag,strong,note,meta);card.append(img,body);card.onclick=()=>open(i);grid.append(card);cardMap.set(i,card);}}
 for(const [id,title] of [['all','전체'],...categories]){const b=document.createElement('button');b.dataset.category=id;b.setAttribute('aria-pressed',String(id==='all'));b.append(document.createTextNode(title));const count=document.createElement('small');count.textContent=id==='all'?parts.length:parts.filter(p=>p.category===id).length;b.append(count);b.onclick=()=>{activeCategory=id;filter();};$('filters').append(b);}}
async function thumbnails(){const gen=++renderGeneration;busy=true;$('ink').disabled=true;$('progress').dataset.state='loading';renderer.setSize(560,400);camera.aspect=1.4;camera.updateProjectionMatrix();
 try{await preparePerimeterGardens();await prepareCourtyards();for(const [i,p] of parts.entries()){if(gen!==renderGeneration)return;load(i);draw();const card=cardMap.get(i),info=rendered.get(i);card.querySelector('img').src=renderer.domElement.toDataURL('image/png');card.querySelector('.meta').textContent=`폭 ${info.size[0].toFixed(2)}m · 높이 ${info.size[1].toFixed(2)}m`;card.dataset.triangles=info.triangles;card.dataset.finite=info.finite;card.disabled=false;$('progress').textContent=`${parts.length}개 중 ${i+1}개 준비 중…`;await new Promise(requestAnimationFrame);}
 $('progress').dataset.state='ready';filter();
 }catch(error){$('progress').textContent='부품을 불러오지 못했습니다. '+error.message;$('progress').dataset.state='error';console.error(error);}
 finally{busy=false;$('ink').disabled=false;}
 if($('detail').open){resize();load(selected,currentOptions());showSize();draw();}else {const id=decodeURIComponent(location.hash.slice(1)),i=parts.findIndex(p=>p.id===id);if(i>=0)open(i);}}
$('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>history.replaceState(null,'',location.pathname+location.search));
$('prev').onclick=()=>open((selected+parts.length-1)%parts.length);$('next').onclick=()=>open((selected+1)%parts.length);$('front').onclick=()=>frame('front');$('top').onclick=()=>frame('top');$('angle').onclick=()=>frame(parts[selected].view);$('search').oninput=filter;$('ink').onchange=thumbnails;
$('gate-toggle').onclick=()=>{if(!yardOptions)return;yardOptions.gateOpen=!yardOptions.gateOpen;const position=camera.position.clone(),target=controls.target.clone();load(selected,yardOptions);camera.position.copy(position);controls.target.copy(target);controls.update();$('gate-toggle').textContent=yardOptions.gateOpen?'대문 닫기':'대문 열기';showSize();draw();};
$('save').onclick=async()=>{const button=$('save');button.disabled=true;try{const group=currentOptions()?parts[selected].compose(currentOptions()):parts[selected].make();group.prepareExport?.(camera);group.traverse(o=>{if(o.isLineSegments||o.isLine)o.visible=false;});const blob=await new GLTFExporter().parseAsync(group,{binary:true,onlyVisible:true});const url=URL.createObjectURL(new Blob([blob],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='neighborhood-'+parts[selected].id+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);dispose(group);}finally{button.disabled=false;}};
for(const [id,rows] of [['window-type',basicWindowCatalog],['window-finish',facadeTextureCatalog]])for(const row of rows){const option=document.createElement('option');option.value=row.id;option.textContent=row.name;$(id).append(option);}
$('window-options').addEventListener('change',event=>{
 if(!composition)return;
 const next={type:$('window-type').value,width:$('window-width').value,height:$('window-height').value,recess:Number($('window-recess').value)/100,frame:$('window-frame').value,wallTexture:$('window-finish').value,guard:$('window-guard').value};
 for(const key of ['rack','awning','sill','wall'])next[key]=$('window-'+key).checked;
 if(event.target.id==='window-type'){const row=basicWindowCatalog.find(r=>r.id===next.type);next.width=row.width;next.height=row.height;}
 composition=windowOptions(next);fillWindowOptions();load(selected,composition);showSize();
 $('title').textContent=basicWindowCatalog.find(r=>r.id===composition.type).name+' 조합';
 $('description').textContent='선택한 창문에 부착물을 붙인 모습입니다. GLB 저장을 누르면 현재 조합을 저장합니다.';draw();
});
$('garden-closeup').onclick=()=>frame('garden-close');
$('compose-window').onclick=()=>open(parts.findIndex(p=>p.id==='window-assembly-photo-living'));
new ResizeObserver(()=>{if($('detail').open&&!busy){resize();frame(parts[selected].view);}}).observe($('stage'));
renderer.setAnimationLoop(()=>{if($('detail').open&&!busy){controls.update();draw();}});
build();thumbnails();
