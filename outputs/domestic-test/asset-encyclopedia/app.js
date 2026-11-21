import {createReferenceReview} from './reference-review.js?v=buildingrefs1';
import {remakeAliases} from './remakes.js?v=signtexture3';
import {loadAssetRegistry} from './registry.js?v=signtexture3';
import {createIllustrationRenderer} from '../illustration-renderer.js';
import {CATALOG_LINES,mountLineOptions} from './line-options.js';
import {createPersonPreview} from './person-preview.js?v=umbrella1';
import {treeProfile,treeProfileText} from '../tree-profiles.js';
import {GROUPS,assetGroup} from './groups.js?v=assembly1';
import {curation,canonicalId,appliedLabel} from './curation.js?v=review527';
import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {createReviewStore,LABELS} from './reviews.js?v=review1';
import {createModel,release} from './models.js?v=treeoptions1';
const $=id=>document.getElementById(id),cache=new Map();let entries=[],version=0,detailVersion=0,active=null,viewer=null,currentGroup='building',personViewState={angle:0,pitch:0,zoom:1};

const getLineSettings=mountLineOptions($('lineOptions'),settings=>viewer?.setLines?.(settings));
const reviews=createReviewStore();let reviewReady=false,reviewBusy=false;
function reviewStatus(a){return reviews.state.items[a.id]?.status||'none';}
function reviewButtons(a){const group=document.createElement('div');group.className='review-buttons';for(const [status,symbol]of [['discard','×'],['remake','↻']]){const b=document.createElement('button');b.type='button';b.dataset.review=status;const pressed=reviewStatus(a)===status;b.setAttribute('aria-pressed',String(pressed));b.setAttribute('aria-label',`${a.name} · ${a.collection} · ${LABELS[status]} 표시`);b.title=LABELS[status]+(pressed?' 표시 취소':' 표시');b.disabled=!reviewReady||reviewBusy;const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=symbol;b.append(icon);b.onclick=()=>mark(a,status);group.append(b);}const label=document.createElement('span');label.className='review-label';label.textContent=[a.approvedReferenceId?'새 모델 반영':appliedLabel(a.id),LABELS[reviewStatus(a)]].filter(Boolean).join(' · ')||'표시 안 함';group.append(label);return group;}
function refreshDetailReview(){if(active){const note=document.createElement('p');note.className='review-detail-status';note.setAttribute('role','status');note.textContent=$('reviewError').textContent;$('detailReview').replaceChildren(reviewButtons(active),note);}}
async function mark(a,status){
 if(!reviewReady||reviewBusy)return;
 reviewBusy=true;$('reviewError').textContent='';document.querySelectorAll('[data-review]').forEach(b=>b.disabled=true);
 try{await reviews.set(a,reviewStatus(a)===status?'none':status);}
 catch(e){$('reviewError').textContent=e.message;}
 finally{reviewBusy=false;render();refreshDetailReview();const card=[...document.querySelectorAll('.card')].find(c=>c.dataset.asset===a.id);const focus=$('detail').open?$('detailReview').querySelector(`[data-review="${status}"]`):card?.querySelector(`[data-review="${status}"]`);(focus||$('search')).focus();}
}
function engine(host=null){const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(400,300);const scene=new T.Scene();scene.background=new T.Color('#e5eae2');scene.add(new T.HemisphereLight(0xffffff,0x8b9b86,2.4));const sun=new T.DirectionalLight(0xffffff,2.4);sun.position.set(-5,12,10);scene.add(sun);const camera=new T.PerspectiveCamera(36,4/3,.01,10000);let model,controls,observer;let ink=createIllustrationRenderer(renderer),lineSettings={...CATALOG_LINES};
 const draw=()=>{model?.updatePreview?.(camera);ink.render(scene,camera,()=>renderer.render(scene,camera),lineSettings);};
 function frame(){const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());if(box.isEmpty()||!size.toArray().every(Number.isFinite))throw Error('모델 좌표를 확인해야 합니다.');const d=Math.max(size.y,size.x/camera.aspect,size.z,.1)*2.3;camera.near=Math.max(.001,d/10000);camera.far=d*30+50;camera.position.copy(center).addScaledVector(new T.Vector3(.75,.55,1).normalize(),d);camera.lookAt(center);camera.updateProjectionMatrix();if(controls){controls.target.copy(center);controls.update();}draw();return size;}
 if(host){host.append(renderer.domElement);renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();controls=new OrbitControls(camera,renderer.domElement);controls.addEventListener('change',draw);observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw();});observer.observe(host);}
 return {setLines(settings){lineSettings={...settings};draw();},show(m){if(model){scene.remove(model);release(model);ink.dispose();ink=createIllustrationRenderer(renderer);}model=m;scene.add(m);m.updateMatrixWorld(true);const size=frame();let triangles=0;model.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position?.count??0)/3*(o.isInstancedMesh?o.count:Number.isFinite(o.geometry.instanceCount)?o.geometry.instanceCount:1);});return {size,triangles};},frame,photo:()=>renderer.domElement.toDataURL('image/webp',.85),dispose(){observer?.disconnect();controls?.dispose();if(model)release(model);ink.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
let thumbEngine;
async function imageThumb(a){const img=new Image();img.src=a.file;await img.decode();if(!a.rect)return a.file;const c=document.createElement('canvas');c.width=400;c.height=300;const ctx=c.getContext('2d'),[x,y,w,h]=a.rect,scale=Math.min(380/w,280/h);ctx.drawImage(img,x,y,w,h,(400-w*scale)/2,(300-h*scale)/2,w*scale,h*scale);return c.toDataURL('image/webp',.85);}
function paintImage(host,src,a){const img=new Image();img.src=src;img.alt=a.name;img.width=400;img.height=300;if(host===document.querySelector('.thumb')){img.fetchPriority='high';}else{img.loading='lazy';}host.replaceChildren(img);}
async function thumbnails(rows,v){for(const [a,host]of rows){if(v!==version)return;try{let src=cache.get(a.id);if(!src){if(a.kind==='image')src=await imageThumb(a);else{const m=await createModel(a);if(v!==version){release(m);return;}thumbEngine??=engine();thumbEngine.show(m);src=thumbEngine.photo();}cache.set(a.id,src);if(cache.size>150)cache.delete(cache.keys().next().value);}if(v===version)paintImage(host,src,a);}catch(e){if(v===version)host.textContent='미리보기 확인 필요';console.warn(a.id+': '+e.message);}await new Promise(r=>requestAnimationFrame(r));}}
function selected(){const q=$('search').value.trim().toLocaleLowerCase();return entries.filter(a=>canonicalId(a.id)===a.id&&curation.items[a.id]?.state!=='deleted'&&assetGroup(a)===currentGroup&&(!$('treeUse').value||currentGroup!=='tree'||treeProfile(a.key)?.uses.includes($('treeUse').value))&&(!q||[a.name,a.note,a.id,a.category,a.collection,treeProfileText(a.key)].join(' ').toLocaleLowerCase().includes(q)));}
// One renderer and one queue: scrolling or changing filters must not race model loads.
let thumbObserver,thumbQueue=[],thumbRunning=false;
async function drainThumbnails(){
 if(thumbRunning)return;
 thumbRunning=true;
 try{while(thumbQueue.length){const {row,v}=thumbQueue.shift();if(v===version)await thumbnails([row],v);}}
 finally{thumbRunning=false;}
}
function observeThumbnails(rows,v){
 const byHost=new Map(rows.map(row=>[row[1],row]));
 thumbObserver=new IntersectionObserver(records=>{
  for(const entry of records){
   if(!entry.isIntersecting)continue;
   const row=byHost.get(entry.target);if(!row)continue;
   thumbObserver.unobserve(entry.target);byHost.delete(entry.target);
   thumbQueue.push({row,v});
  }
  void drainThumbnails();
 },{rootMargin:'400px'});
 for(const [,host] of rows)thumbObserver.observe(host);
}
let referenceReview;const referenceReviews=new Map();
function render(){const list=selected();++version;thumbObserver?.disconnect();thumbQueue=[];$('grid').replaceChildren();const rows=[];for(const a of list){const card=document.createElement('article');card.className='card';card.dataset.asset=a.id;card.dataset.reviewStatus=reviewStatus(a);const openButton=document.createElement('button');openButton.className='card-open';openButton.setAttribute('aria-label',a.name+' · '+a.collection+' 보기');const thumb=document.createElement('div');thumb.className='thumb';thumb.textContent='미리보기 준비 중';const info=document.createElement('div');info.className='card-info';const badge=document.createElement('span');badge.className='badge';badge.textContent=a.collection;const name=document.createElement('strong');name.textContent=a.name;const cat=document.createElement('small');cat.textContent=a.kind==='tree'?treeProfileText(a.key):a.category;info.append(badge,name,cat);openButton.append(thumb,info);openButton.onclick=()=>open(a);card.append(openButton,reviewButtons(a));if(referenceReview){const ref=referenceReview.card(a);if(ref)card.append(ref);}$('grid').append(card);rows.push([a,thumb]);}observeThumbnails(rows,version);$('status').textContent=`${list.length.toLocaleString()}개`;$('empty').hidden=list.length>0;const params=new URLSearchParams();if($('search').value)params.set('search',$('search').value);params.set('tab',currentGroup);history.replaceState(null,'','?'+params.toString()+location.hash);}
async function open(a,keepOptions=false){
 $('personOptions').hidden=!a.seasons;$('personActionOptions').hidden=!a.seasons;
 if(!keepOptions){personViewState={angle:0,pitch:0,zoom:1};document.querySelector('[name=personSeason][value=spring]').checked=true;$('personPitch').value='0';document.querySelector('[name=personAction][value=walk]').checked=true;}
 const personSeason=document.querySelector('[name=personSeason]:checked').value;
 const personAction=document.querySelector('[name=personAction]:checked').value,actionLabel=personAction==='umbrella'?'우산 쓰고 걷기':'걷기';
 const seasonLabel={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'}[personSeason];
 const pitch=Number($('personPitch').value),pitchLabel=pitch?'위에서 '+pitch+'°':'눈높이';
 const imageFile=a.seasons?.[personSeason]?.elevations?.find(t=>t.pitch===pitch)?.file||a.seasons?.[personSeason]?.file||a.file;
$('lineOptions').hidden=a.kind==='image';$('viewerArea').classList.toggle('image-only',a.kind==='image');$('treeOptions').hidden=a.kind!=='tree';if(!keepOptions){$('treeSeason').value='summer';$('treeHeight').value=String(treeProfile(a.key)?.defaultHeightM??10.5);$('treeHeightValue').value=$('treeHeight').value+'m';}const treeOptions={season:$('treeSeason').value,height:Number($('treeHeight').value)};const previousView=a.seasons?personViewState:(keepOptions?viewer?.getState?.():null);const v=++detailVersion;active=a;refreshDetailReview();viewer?.dispose();viewer=null;$('stage').replaceChildren();$('detailError').textContent='';$('title').textContent=a.name;$('collectionName').textContent=a.collection+' / '+a.category;$('note').textContent=a.kind==='tree'?`${treeProfileText(a.key)}. 성목 범위는 해외 조경 자료이며 국내 실측 평균이 아닙니다. 마당 높이는 가지치기를 고려한 배치 설정입니다. ${a.note||''}`:a.note||'';$('treeSource').hidden=a.kind!=='tree';if(a.kind==='tree')$('treeSource').href=treeProfile(a.key).source;$('meta').textContent='모델을 불러오는 중…';$('file').hidden=!!a.seasons||!a.file;if(a.file)$('file').href=imageFile;$('file').textContent=a.seasons?seasonLabel+' 옷 · '+pitchLabel+' 이미지 받기':'원본 파일 받기';$('related').textContent=a.remade?'이전 모델과 비교':'기존 도감 열기';$('related').hidden=!a.link;if(a.link)$('related').href=a.link;$('reset').hidden=a.kind==='image'&&!a.seasons;$('personRotate').hidden=!a.seasons;$('previewHint').textContent=a.seasons?'좌우 드래그: 방향 · 위아래 드래그: 시점 높이 · 휠: 확대 · 방향키로도 조절할 수 있습니다.':'드래그: 회전 · 휠: 확대. 미리보기 크기는 화면에 맞췄습니다.';if(!$('detail').open)$('detail').showModal();history.replaceState(null,'','#'+encodeURIComponent(a.id));try{if(a.seasons){const preview=await createPersonPreview($('stage'),a.id.slice(7),personSeason,{action:personAction,state:previousView,onChange:view=>{if(v!==detailVersion)return;Object.assign(personViewState,{angle:view.angle,pitch:view.pitch,zoom:view.zoom});$('personPitch').value=String(view.pitch);$('meta').textContent=seasonLabel+' 옷 · '+actionLabel+' · '+view.label+' · '+(view.pitch?'위에서 '+view.pitch+'°':'눈높이');$('file').hidden=false;$('file').href=view.file;$('file').textContent=seasonLabel+' 옷 · '+actionLabel+' · '+(view.pitch?'위에서 '+view.pitch+'°':'눈높이')+' 원본 받기';}});if(v!==detailVersion){preview.dispose();return;}viewer=preview;preview.mount();}else if(a.kind==='image'){const img=new Image();img.alt=a.name+(a.seasons?' · '+seasonLabel+' 옷 · '+pitchLabel:'')+' · 8방향 원본';img.src=imageFile;await img.decode();if(v!==detailVersion)return;$('stage').append(img);$('meta').textContent=(a.seasons?seasonLabel+' 옷 · '+pitchLabel+' · ':'')+'방향별 원본 이미지 · '+img.naturalWidth+' × '+img.naturalHeight;}else{const m=await createModel(a,treeOptions);if(v!==detailVersion){release(m);return;}viewer=engine($('stage'));const {size,triangles}=viewer.show(m);viewer.setLines(getLineSettings());$('stage').dataset.previewSettings=JSON.stringify(m.userData.previewSettings||{});$('meta').textContent=a.kind==='tree'?`배치 높이 ${treeOptions.height}m · ${Math.round(triangles).toLocaleString()} 삼각형`:`${Math.round(triangles).toLocaleString()} 삼각형 · 폭 ${size.x.toFixed(2)} / 높이 ${size.y.toFixed(2)} / 깊이 ${size.z.toFixed(2)} · 모델 좌표 단위`;}}catch(e){if(v===detailVersion){$('meta').textContent='';$('detailError').textContent='미리보기를 불러오지 못했습니다. '+e.message;}}}
$('close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>{++detailVersion;viewer?.dispose();viewer=null;$('stage').replaceChildren();history.replaceState(null,'',location.pathname+location.search);});$('reset').onclick=()=>{Object.assign(personViewState,{angle:0,pitch:0,zoom:1});viewer?.frame();};$('filters').onsubmit=e=>e.preventDefault();$('search').addEventListener('input',render);
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectGroup(group){
 $('treeUseFilter').hidden=group!=='tree';currentGroup=Object.hasOwn(GROUPS,group)?group:'building';
 for(const tab of tabs){const selected=tab.dataset.group===currentGroup;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
 referenceReview=referenceReviews.get(currentGroup);$('referenceIntro').replaceChildren(...(referenceReview?[referenceReview.intro]:[]));$('referenceIntro').hidden=!referenceReview;$('grid').classList.toggle('road-references',!!referenceReview);$('panel').setAttribute('aria-labelledby','tab-'+currentGroup);render();
}
for(const tab of tabs){
 tab.onclick=()=>selectGroup(tab.dataset.group);
 tab.onkeydown=e=>{let i=tabs.indexOf(tab);if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();tabs[i].focus();};
}
try{
 entries=(await loadAssetRegistry()).entries;
 for(const [group,options] of [['road',{}],['building',{manifestFile:'building-references.json?v=buildingrefs1',exportName:'완성건물-참고이미지-검토.json',description:'교체할 건물의 참고 사진을 확인해 주세요. 승인한 이미지로만 다음 모델링을 진행합니다.',evidenceNote:'사진을 누르면 크게 볼 수 있습니다. 실제 장소와 참고할 부분, 사진에서 확인하지 못한 부분을 함께 표시했습니다.'}]]){try{referenceReviews.set(group,await createReferenceReview(options));}catch(e){$('error').textContent=(GROUPS[group]||group)+': '+e.message;}}
 try{await reviews.load();reviewReady=true;}catch(e){$('reviewError').textContent=e.message;}
 const params=new URLSearchParams(location.search);$('search').value=params.get('search')||'';selectGroup(params.get('tab'));
 const hash=decodeURIComponent(location.hash.slice(1));if(hash){const a=entries.find(a=>a.id===(remakeAliases.get(canonicalId(hash))||canonicalId(hash))&&curation.items[a.id]?.state!=='deleted');if(a){selectGroup(assetGroup(a));open(a);}}
}catch(e){$('error').textContent=e.message+' 새로고침 후에도 같으면 목록 파일을 확인해 주세요.';}

$('treeHeight').oninput=()=>{$('treeHeightValue').value=Number($('treeHeight').value).toFixed(1)+'m';};
for(const id of ['treeHeight','treeSeason'])$(id).onchange=()=>{if(active?.kind==='tree')void open(active,true);};

for(const input of document.querySelectorAll('[name=personSeason], [name=personAction]'))input.onchange=()=>{if(active?.seasons)void open(active,true);};

$('treeUse').onchange=render;

$('personPitch').onchange=()=>{personViewState.pitch=Number($('personPitch').value);viewer?.setPitch?.(personViewState.pitch);};
function rotatePerson(angle){if(viewer?.rotate)viewer.rotate(angle,0);else personViewState.angle+=angle;}
$('personLeft').onclick=()=>rotatePerson(-45);$('personRight').onclick=()=>rotatePerson(45);
