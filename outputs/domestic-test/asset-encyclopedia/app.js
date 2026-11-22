import {environmentProfile} from '../environment-policy.js?v=151';
import {clockText} from '../shops/storefront-hours.js?v=shop50v3';
import {createReferenceReview} from './reference-review.js?v=shoprefs1';
import {remakeAliases} from './remakes.js?v=replacements3';
import {loadAssetRegistry} from './registry.js?v=category-ownership2';
import {createIllustrationRenderer} from '../illustration-renderer.js';
import {CATALOG_LINES,mountLineOptions} from './line-options.js';
import {createPersonPreview} from './person-preview.js?v=umbrella1';
import {treeProfile,treeProfileText} from '../tree-profiles.js';
import {GROUPS,assetGroup} from './groups.js?v=assembly1';
import {DOMAINS,HOUSE_ROLES,ROLE_LABELS,FACETS,UNKNOWN,defaultFilters,metadataValues,facetValues,filterAssets,changeScope,parseFilters,serializeFilters,valueLabel,colorPresentation} from './filter-state.js';
import {getAssemblyRuleDescriptions} from '../assembly-rules/asset-policies.js';
import {curation,canonicalId,appliedLabel} from './curation.js?v=review527';
import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {createReviewStore,LABELS} from './reviews.js?v=review1';
import {createModel,release} from './models.js?v=assembly1';
const $=id=>document.getElementById(id),cache=new Map();let entries=[],version=0,detailVersion=0,active=null,viewer=null,currentGroup='house',personViewState={angle:0,pitch:0,zoom:1};

let filters={...defaultFilters},restoringHistory=false,detailPushed=false,detailOpener=null,detailAssetId=null,pendingDetailFocus=false;
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
function engine(host=null){const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(400,300);const scene=new T.Scene();scene.background=new T.Color('#e5eae2');const sky=new T.HemisphereLight(0xffffff,0x8b9b86,2.4);scene.add(sky);const sun=new T.DirectionalLight(0xffffff,2.4);sun.position.set(-5,12,10);scene.add(sun);const camera=new T.PerspectiveCamera(36,4/3,.01,10000);let model,controls,observer;let ink=createIllustrationRenderer(renderer),lineSettings={...CATALOG_LINES};
 const draw=()=>{model?.updatePreview?.(camera);ink.render(scene,camera,()=>renderer.render(scene,camera),lineSettings);};
 function frame(){const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());if(box.isEmpty()||!size.toArray().every(Number.isFinite))throw Error('모델 좌표를 확인해야 합니다.');const d=Math.max(size.y,size.x/camera.aspect,size.z,.1)*2.3;camera.near=Math.max(.001,d/10000);camera.far=d*30+50;camera.position.copy(center).addScaledVector(new T.Vector3(...(model.userData.interior?[.38,.14,1]:[.75,.55,1])).normalize(),d);camera.lookAt(center);camera.updateProjectionMatrix();if(controls){controls.target.copy(center);controls.update();}draw();return size;}
 if(host){host.append(renderer.domElement);renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();controls=new OrbitControls(camera,renderer.domElement);controls.addEventListener('change',draw);observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw();});observer.observe(host);}
 function setHour(hour){
  if(!model?.updateShopTime)return;
  const p=environmentProfile(hour);scene.background.set(p.night>.6?'#192738':p.horizon);sky.intensity=p.night>.6?.28:2.4;sun.intensity=p.sunIntensity;sun.color.set(p.sun);
  const state=model.updateShopTime(hour,p.night);draw();return state;
 }
 return {setHour,setLines(settings){lineSettings={...settings};draw();},show(m){if(model){scene.remove(model);release(model);ink.dispose();ink=createIllustrationRenderer(renderer);}model=m;scene.background.set('#e5eae2');sky.intensity=2.4;sun.intensity=2.4;sun.color.set(0xffffff);scene.add(m);m.updateMatrixWorld(true);const size=frame();let triangles=0;model.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position?.count??0)/3*(o.isInstancedMesh?o.count:Number.isFinite(o.geometry.instanceCount)?o.geometry.instanceCount:1);});return {size,triangles};},frame,photo:()=>renderer.domElement.toDataURL('image/webp',.85),dispose(){observer?.disconnect();controls?.dispose();if(model)release(model);ink.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
let thumbEngine;
async function imageThumb(a){const img=new Image();img.src=a.file;await img.decode();if(!a.rect)return a.file;const c=document.createElement('canvas');c.width=400;c.height=300;const ctx=c.getContext('2d'),[x,y,w,h]=a.rect,scale=Math.min(380/w,280/h);ctx.drawImage(img,x,y,w,h,(400-w*scale)/2,(300-h*scale)/2,w*scale,h*scale);return c.toDataURL('image/webp',.85);}
function paintImage(host,src,a){const img=new Image();img.src=src;img.alt=a.name;img.width=400;img.height=300;if(host===document.querySelector('.thumb')){img.fetchPriority='high';}else{img.loading='lazy';}host.replaceChildren(img);}
async function thumbnails(rows,v){for(const [a,host]of rows){if(v!==version)return;if(unavailableArchive(a)){host.textContent='로컬 보관 원본 · 공개 파일 아님';continue;}try{let src=cache.get(a.id);if(!src){if(a.kind==='image')src=await imageThumb(a);else{const m=await createModel(a);if(v!==version){release(m);return;}thumbEngine??=engine();thumbEngine.show(m);src=thumbEngine.photo();}cache.set(a.id,src);if(cache.size>150)cache.delete(cache.keys().next().value);}if(v===version)paintImage(host,src,a);}catch(e){if(v===version)host.textContent='미리보기 확인 필요';console.warn(a.id+': '+e.message);}await new Promise(r=>requestAnimationFrame(r));}}
function visibleEntries(){return entries.filter(a=>canonicalId(a.id)===a.id&&curation.items[a.id]?.state!=='deleted');}
function selected(){return filterAssets(visibleEntries(),filters,a=>treeProfileText(a.key)).filter(a=>!filters.treeUse||filters.domain!=='nature'||treeProfile(a.key)?.uses.includes(filters.treeUse));}
function saveURL(mode='push',hash=location.hash){if(restoringHistory)return;const url=location.pathname+'?'+serializeFilters(filters)+hash;if(url!==location.pathname+location.search+location.hash)history[mode==='replace'?'replaceState':'pushState'](null,'',url);}
function referenceFor(a){return referenceReviews.get(assetGroup(a));}
function isArchivedFile(a,file){return !!file&&a.ownership?.sourceAvailability?.[file.split(/[?#]/)[0]]==='local-archive';}
function archiveOnly(a){const states=Object.values(a.ownership?.sourceAvailability||{});return isArchivedFile(a,a.file)||states.length>0&&states.every(state=>state==='local-archive');}
function unavailableArchive(a){return archiveOnly(a)&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname);}
function showFacts(a){
 const facts=$('assetFacts');facts.replaceChildren();
 const add=(name,value)=>{const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=name;description.textContent=value;facts.append(term,description);};
 const assembly=a.assembly||{};
 add('분류',[DOMAINS[a.taxonomy?.domain]||'미분류',ROLE_LABELS[a.taxonomy?.role]||a.taxonomy?.role||'미분류'].join(' / '));
 for(const [facet,label] of Object.entries(FACETS))add(label,metadataValues(a,facet).map(valueLabel).join(' · '));
 add('에셋 형태',({component:'조립 부품',complete:'완성본',reference:'참고·조립 예시',legacy:'보관 모델'})[assembly.kind]||'미확인');
 add('부착 지점',assembly.slots?.length?assembly.slots.map(slot=>typeof slot==='string'?slot:[slot.id,({facade:'외벽',wall:'벽면',ground:'바닥',roof:'옥상'})[slot.surface]||slot.surface,slot.evidence].filter(Boolean).join(' · ')).join(' · '):'등록된 부착 지점 없음');
 add('등록 치수',assembly.dimensions?Object.entries(assembly.dimensions).map(([key,value])=>(({width:'폭',height:'높이',depth:'깊이',unit:'단위',basis:'근거'})[key]||key)+': '+value).join(' · '):'미확인 · 미리보기 좌표와 실제 치수는 다릅니다');
 add('확인 근거',typeof assembly.evidence==='string'?assembly.evidence:assembly.evidence?JSON.stringify(assembly.evidence):'미확인');
 add('검토 상태',[appliedLabel(a.id),LABELS[reviewStatus(a)]].filter(Boolean).join(' · ')||'미검토');
 if(Object.values(a.ownership?.sourceAvailability||{}).includes('local-archive'))add('보관 원본',archiveOnly(a)?'로컬 보관 원본 · 공개 파일 아님. 공개 미리보기와 다운로드는 제공하지 않습니다.':'로컬 보관 원본 · 공개 파일 아님. 현재 모델과 별도로 보존한 제작 자료가 있습니다.');
 add('고정 ID',a.id);
 const rules=$('ruleDescriptions');rules.replaceChildren();
 for(const rule of getAssemblyRuleDescriptions(a)){const p=document.createElement('p');p.textContent=(rule.status==='automatic'||rule.automatic?'자동 배치 연결 · ':rule.status==='unverified'?'조건 미확인 · ':'참고·보관 · ')+rule.description;rules.append(p);}
}
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
function render(){const list=selected();++version;thumbObserver?.disconnect();thumbQueue=[];$('grid').replaceChildren();const rows=[];for(const a of list){const card=document.createElement('article');card.className='card';card.dataset.asset=a.id;card.dataset.reviewStatus=reviewStatus(a);const openButton=document.createElement('button');openButton.className='card-open';openButton.setAttribute('aria-label',a.name+' · '+a.collection+' 보기');const thumb=document.createElement('div');thumb.className='thumb';thumb.textContent='미리보기 준비 중';const info=document.createElement('div');info.className='card-info';const badge=document.createElement('span');badge.className='badge';badge.textContent=a.collection;const name=document.createElement('strong');name.textContent=a.name;const cat=document.createElement('small');cat.textContent=a.kind==='tree'?treeProfileText(a.key):a.category;info.append(badge,name,cat);openButton.append(thumb,info);openButton.onclick=()=>open(a);card.append(openButton,reviewButtons(a));const ref=referenceFor(a)?.card(a);if(ref)card.append(ref);$('grid').append(card);rows.push([a,thumb]);}observeThumbnails(rows,version);$('status').textContent=`${DOMAINS[filters.domain]}${filters.role?' / '+(ROLE_LABELS[filters.role]||filters.role):''} · ${list.length.toLocaleString()}개`;$('empty').hidden=list.length>0;renderActiveFilters();}

async function open(a,keepOptions=false){
 $('shopOptions').hidden=a.kind!=='shop';if(!keepOptions)$('shopHour').value='12:00';
 $('personOptions').hidden=!a.seasons;$('personActionOptions').hidden=!a.seasons;
 if(!keepOptions){personViewState={angle:0,pitch:0,zoom:1};document.querySelector('[name=personSeason][value=spring]').checked=true;$('personPitch').value='0';document.querySelector('[name=personAction][value=walk]').checked=true;}
 const personSeason=document.querySelector('[name=personSeason]:checked').value;
 const personAction=document.querySelector('[name=personAction]:checked').value,actionLabel=personAction==='umbrella'?'우산 쓰고 걷기':'걷기';
 const seasonLabel={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'}[personSeason];
 const pitch=Number($('personPitch').value),pitchLabel=pitch?'위에서 '+pitch+'°':'눈높이';
 const imageFile=a.seasons?.[personSeason]?.elevations?.find(t=>t.pitch===pitch)?.file||a.seasons?.[personSeason]?.file||a.file;
$('lineOptions').hidden=a.kind==='image';$('viewerArea').classList.toggle('image-only',a.kind==='image');$('treeOptions').hidden=a.kind!=='tree';if(!keepOptions){$('treeSeason').value='summer';$('treeHeight').value=String(treeProfile(a.key)?.defaultHeightM??10.5);$('treeHeightValue').value=$('treeHeight').value+'m';}const treeOptions={season:$('treeSeason').value,height:Number($('treeHeight').value)};const previousView=a.seasons?personViewState:(keepOptions?viewer?.getState?.():null);const v=++detailVersion;active=a;refreshDetailReview();showFacts(a);viewer?.dispose();viewer=null;$('stage').replaceChildren();$('detailError').textContent='';$('title').textContent=a.name;$('collectionName').textContent=a.collection+' / '+a.category;$('note').textContent=a.kind==='tree'?`${treeProfileText(a.key)}. 성목 범위는 해외 조경 자료이며 국내 실측 평균이 아닙니다. 마당 높이는 가지치기를 고려한 배치 설정입니다. ${a.note||''}`:a.note||'';$('treeSource').hidden=a.kind!=='tree';if(a.kind==='tree')$('treeSource').href=treeProfile(a.key).source;$('meta').textContent='모델을 불러오는 중…';$('file').hidden=!!a.seasons||!a.file||isArchivedFile(a,imageFile);if(a.file)$('file').href=imageFile;$('file').textContent=a.seasons?seasonLabel+' 옷 · '+pitchLabel+' 이미지 받기':'원본 파일 받기';$('related').textContent=a.remade?'이전 모델과 비교':'기존 도감 열기';$('related').hidden=!a.link;if(a.link)$('related').href=a.link;$('reset').hidden=a.kind==='image'&&!a.seasons;$('personRotate').hidden=!a.seasons;$('previewHint').textContent=a.seasons?'좌우 드래그: 방향 · 위아래 드래그: 시점 높이 · 휠: 확대 · 방향키로도 조절할 수 있습니다.':'드래그: 회전 · 휠: 확대. 미리보기 크기는 화면에 맞췄습니다.';if(!$('detail').open){detailOpener=document.activeElement;detailAssetId=a.id;$('detail').showModal();if(!restoringHistory){saveURL('push','#'+encodeURIComponent(a.id));detailPushed=true;}}if(unavailableArchive(a)){$('meta').textContent='로컬 보관 원본 · 공개 파일 아님';$('stage').textContent='이 원본은 로컬 보관 자료입니다. 공개 미리보기를 제공하지 않습니다.';return;}try{if(a.seasons){const preview=await createPersonPreview($('stage'),a.id.slice(7),personSeason,{action:personAction,state:previousView,onChange:view=>{if(v!==detailVersion)return;Object.assign(personViewState,{angle:view.angle,pitch:view.pitch,zoom:view.zoom});$('personPitch').value=String(view.pitch);$('meta').textContent=seasonLabel+' 옷 · '+actionLabel+' · '+view.label+' · '+(view.pitch?'위에서 '+view.pitch+'°':'눈높이');$('file').hidden=false;$('file').href=view.file;$('file').textContent=seasonLabel+' 옷 · '+actionLabel+' · '+(view.pitch?'위에서 '+view.pitch+'°':'눈높이')+' 원본 받기';}});if(v!==detailVersion){preview.dispose();return;}viewer=preview;preview.mount();}else if(a.kind==='image'){const img=new Image();img.alt=a.name+(a.seasons?' · '+seasonLabel+' 옷 · '+pitchLabel:'')+' · 8방향 원본';img.src=imageFile;await img.decode();if(v!==detailVersion)return;$('stage').append(img);$('meta').textContent=(a.seasons?seasonLabel+' 옷 · '+pitchLabel+' · ':'')+'방향별 원본 이미지 · '+img.naturalWidth+' × '+img.naturalHeight;}else{const m=await createModel(a,treeOptions);if(v!==detailVersion){release(m);return;}viewer=engine($('stage'));const {size,triangles}=viewer.show(m);viewer.setLines(getLineSettings());if(a.kind==='shop')updateShopTime();$('stage').dataset.previewSettings=JSON.stringify(m.userData.previewSettings||{});$('meta').textContent=a.kind==='tree'?`배치 높이 ${treeOptions.height}m · ${Math.round(triangles).toLocaleString()} 삼각형`:`${Math.round(triangles).toLocaleString()} 삼각형 · 폭 ${size.x.toFixed(2)} / 높이 ${size.y.toFixed(2)} / 깊이 ${size.z.toFixed(2)} · 모델 좌표 단위`;}}catch(e){if(v===detailVersion){$('meta').textContent='';$('detailError').textContent='미리보기를 불러오지 못했습니다. '+e.message;}}}
$('close').onclick=()=>$('detail').close();
$('detail').addEventListener('close',()=>{if(restoringHistory||detailPushed)pendingDetailFocus=true;++detailVersion;viewer?.dispose();viewer=null;active=null;$('stage').replaceChildren();if(!restoringHistory){if(detailPushed&&location.hash){detailPushed=false;history.back();}else saveURL('replace','');}detailOpener?.isConnected&&detailOpener.focus();});
$('reset').onclick=()=>{Object.assign(personViewState,{angle:0,pitch:0,zoom:1});viewer?.frame();};
$('filters').onsubmit=e=>e.preventDefault();
$('search').addEventListener('input',()=>{filters.query=$('search').value;render();saveURL('replace');});
function bindTabKeys(host){host.addEventListener('keydown',e=>{const tabs=[...host.querySelectorAll('[role="tab"]')],index=tabs.indexOf(e.target);if(index<0)return;let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();tabs[next].scrollIntoView({block:'nearest',inline:'nearest',container:'nearest'});});}
function renderScope(){
 currentGroup=filters.domain;$('search').value=filters.query;$('treeUse').value=filters.treeUse;$('treeUseFilter').hidden=currentGroup!=='nature';
 for(const tab of $('tabs').querySelectorAll('[role="tab"]')){const selected=tab.dataset.domain===currentGroup;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
 $('categoryPanel').setAttribute('aria-labelledby','tab-'+currentGroup);
 const roles=currentGroup==='house'?Object.keys(HOUSE_ROLES):[...new Set(visibleEntries().filter(a=>currentGroup==='all'||a.taxonomy?.domain===currentGroup).map(a=>a.taxonomy?.role).filter(Boolean))];
 if(filters.role&&!roles.includes(filters.role))roles.push(filters.role);
 const roleHost=$('roleTabs');roleHost.setAttribute('aria-label',DOMAINS[currentGroup]+' 부품');
 const signature=currentGroup+':'+roles.join(',');if(roleHost.dataset.signature!==signature){roleHost.replaceChildren();roleHost.dataset.signature=signature;for(const role of ['',...roles]){const tab=document.createElement('button');tab.type='button';tab.setAttribute('role','tab');tab.id='role-'+(role||'all');tab.dataset.role=role;tab.textContent=role?(ROLE_LABELS[role]||role):'전체';tab.onclick=()=>applyScope(currentGroup,role);roleHost.append(tab);}}
 for(const tab of roleHost.querySelectorAll('[role="tab"]')){const selected=tab.dataset.role===filters.role;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
 $('panel').setAttribute('aria-labelledby','role-'+(filters.role||'all'));
 renderFacets();
 const referenceGroup=({house:filters.role&&filters.role!=='complete'?'part':'building',commerce:'part',road:'road'})[currentGroup];referenceReview=referenceReviews.get(referenceGroup);$('referenceIntro').replaceChildren(...(referenceReview?[referenceReview.intro]:[]));$('referenceIntro').hidden=!referenceReview;$('grid').classList.toggle('road-references',!!referenceReview);
}
function renderFacets(){
 for(const [facet,label] of Object.entries(FACETS)){
  const host=$('facet-'+facet),values=facetValues(visibleEntries(),filters,facet);if(filters[facet]&&!values.includes(filters[facet]))values.push(filters[facet]);
  const signature=JSON.stringify(values);
  if(host.dataset.signature!==signature){host.dataset.signature=signature;host.replaceChildren();for(const value of ['',...values]){
   const button=document.createElement('button');button.type='button';button.dataset.value=value;
   const presentation=facet==='color'&&value?colorPresentation(value):{label:valueLabel(value),color:null};
   if(presentation.color){const swatch=document.createElement('span');swatch.className='color-swatch';swatch.style.backgroundColor=presentation.color;swatch.setAttribute('aria-hidden','true');button.append(swatch);}
   button.append(document.createTextNode(value?presentation.label:'전체 '+label));if(value)button.title=value.startsWith('color-family:')?'색 이름이 없는 원본 색을 가까운 색 계열로 묶었습니다.':value;
   button.onclick=()=>{filters[facet]=value;renderFacets();render();saveURL();button.scrollIntoView({block:'nearest',inline:'nearest',container:'nearest'});};host.append(button);
  }}
  for(const button of host.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.value===filters[facet]));
 }
}
function applyScope(domain,role=''){filters=changeScope(visibleEntries(),filters,domain,role);renderScope();render();saveURL();document.getElementById(role?'role-'+role:'tab-'+domain)?.scrollIntoView({block:'nearest',inline:'nearest',container:'nearest'});}
function renderActiveFilters(){const host=$('activeFilters');host.replaceChildren();for(const [key,label] of Object.entries({...FACETS,query:'검색',treeUse:'나무 용도'})){if(!filters[key])continue;const b=document.createElement('button');b.type='button';const value=key==='treeUse'?({street:'가로수',yard:'마당'})[filters[key]]:key==='color'?colorPresentation(filters[key]).label:valueLabel(filters[key]);b.textContent=label+': '+value+' ×';b.setAttribute('aria-label',label+' '+value+' 조건 해제');b.onclick=()=>{filters[key]='';renderScope();render();saveURL();(key==='query'?$('search'):key==='treeUse'?$('treeUse'):$('facet-'+key).querySelector('[aria-pressed=true]')).focus();};host.append(b);}}
function clearFilters(){filters={...defaultFilters,domain:filters.domain};renderScope();render();saveURL();$('search').focus();}
$('clearFilters').onclick=clearFilters;$('emptyReset').onclick=clearFilters;
for(const tab of $('tabs').querySelectorAll('[role="tab"]'))tab.onclick=()=>applyScope(tab.dataset.domain);
bindTabKeys($('tabs'));bindTabKeys($('roleTabs'));
async function restoreURL(){
 restoringHistory=true;
 try{filters=parseFilters(new URLSearchParams(location.search));renderScope();render();let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch{}const a=visibleEntries().find(a=>a.id===(remakeAliases.get(canonicalId(hash))||canonicalId(hash)));if(a){if(a.taxonomy?.domain&&filters.domain!=='all'&&filters.domain!==a.taxonomy.domain){filters=changeScope(visibleEntries(),filters,a.taxonomy.domain);renderScope();render();}if(active?.id!==a.id)await open(a);}else if($('detail').open){$('detail').close();await new Promise(resolve=>setTimeout(resolve,0));}}
 finally{restoringHistory=false;if(pendingDetailFocus&&!$('detail').open){const card=[...$('grid').querySelectorAll('.card')].find(card=>card.dataset.asset===detailAssetId);(card?.querySelector('.card-open')||$('tabs').querySelector('[aria-selected=true]')).focus();detailPushed=false;pendingDetailFocus=false;}}
}
window.addEventListener('popstate',()=>void restoreURL());
try{
 entries=(await loadAssetRegistry()).entries;
 for(const [group,options] of [['road',{}],['part',{manifestFile:'shop-references.json?v=shop50v3',exportName:'가게-참고이미지-검토.json',description:'업종별 동네 가게의 외관 예시입니다. 각 가게 아래에서 후보를 승인하거나, 직접 찾은 이미지를 붙여넣어 바꿀 수 있습니다. 추가 가게 50종은 일괄 제작 요청에 따라 만들었으며, 아래에서 참고 사진을 검토하거나 교체할 수 있습니다.',evidenceNote:'편의점·미용실·세탁소·부동산·음식점·카페의 실제 국내 매장 사진입니다. 각 사진의 출처와 모델링에 참고한 부분을 표시했습니다.'}],['building',{manifestFile:'building-references.json?v=replacements3',exportName:'완성건물-참고이미지-검토.json',description:'교체할 건물의 참고 사진을 확인해 주세요. 승인한 이미지로만 다음 모델링을 진행합니다.',evidenceNote:'사진을 누르면 크게 볼 수 있습니다. 실제 장소와 참고할 부분, 사진에서 확인하지 못한 부분을 함께 표시했습니다.'}]]){try{referenceReviews.set(group,await createReferenceReview(options));}catch(e){$('error').textContent=(GROUPS[group]||group)+': '+e.message;}}
 try{await reviews.load();reviewReady=true;}catch(e){$('reviewError').textContent=e.message;}
 await restoreURL();
}catch(e){$('error').textContent=e.message+' 새로고침 후에도 같으면 목록 파일을 확인해 주세요.';}

$('treeHeight').oninput=()=>{$('treeHeightValue').value=Number($('treeHeight').value).toFixed(1)+'m';};
for(const id of ['treeHeight','treeSeason'])$(id).onchange=()=>{if(active?.kind==='tree')void open(active,true);};

for(const input of document.querySelectorAll('[name=personSeason], [name=personAction]'))input.onchange=()=>{if(active?.seasons)void open(active,true);};

$('treeUse').onchange=()=>{filters.treeUse=$('treeUse').value;render();saveURL();};

$('personPitch').onchange=()=>{personViewState.pitch=Number($('personPitch').value);viewer?.setPitch?.(personViewState.pitch);};
function rotatePerson(angle){if(viewer?.rotate)viewer.rotate(angle,0);else personViewState.angle+=angle;}
$('personLeft').onclick=()=>rotatePerson(-45);$('personRight').onclick=()=>rotatePerson(45);

function updateShopTime(){
 const input=$('shopHour');if(!/^\d{2}:\d{2}$/.test(input.value)||!input.validity.valid){input.setAttribute('aria-invalid','true');$('shopLightingStatus').textContent='시간을 00:00~23:59 사이로 입력해 주세요.';return;}
 input.removeAttribute('aria-invalid');const [h,m]=input.value.split(':').map(Number),state=viewer?.setHour?.(h+m/60);if(!state)return;
 $('shopLightingStatus').textContent=(state.interior?'실내 켜짐':'실내 꺼짐')+' · '+(state.schedule.alwaysOpen?'편의점 24시간 점등':clockText(state.schedule.openMinute)+' 점등 · '+clockText(state.schedule.closeMinute)+' 소등');
 $('stage').dataset.shopLighting=JSON.stringify({hour:state.hour,interior:state.interior,closeMinute:state.schedule.closeMinute});
}
$('shopHour').onchange=updateShopTime;
