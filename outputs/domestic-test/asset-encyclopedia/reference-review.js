import {referenceRecord,changeReference,canModel,openReferenceStore,imageFromBlob} from './reference-store.js?v=references1';
const LABELS={pending:'승인 대기',approved:'승인 완료 · 모델링 가능','replace-requested':'교체 요청 · 다시 찾기 대기'};
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
export async function createReferenceReview({onChange=()=>{}}={}){
 const response=await fetch(new URL('./road-references.json?v=references1',import.meta.url));if(!response.ok)throw Error('참고 이미지 목록을 불러오지 못했습니다. 새로고침해 주세요.');
 const manifest=await response.json();if(manifest.version!==1||!manifest.items)throw Error('참고 이미지 목록 형식을 확인해야 합니다.');
 const seeds=manifest.items,records=new Map();let store,storageError='';
 try{store=await openReferenceStore();const saved=await store.load();for(const [id,seed]of Object.entries(seeds))records.set(id,referenceRecord(id,seed,saved.get(id)));}
 catch(e){storageError=e.message;for(const [id,seed]of Object.entries(seeds))records.set(id,referenceRecord(id,seed));store=null;}
 const summary=el('p','', 'reference-summary');summary.setAttribute('role','status');
 function updateSummary(){const rows=[...records.values()];summary.textContent=`참고 이미지 ${rows.length}개 · 승인 ${rows.filter(canModel).length}개 · 교체 요청 ${rows.filter(r=>r.status==='replace-requested').length}개`;}
 updateSummary();
 const intro=el('section',null,'reference-intro');intro.append(el('h2','모델링 전 참고 이미지 검토'),el('p','한국에서 쓰는 물건인지 이미지를 확인해 주세요. 승인한 이미지로만 다음 모델링을 진행합니다.'),el('p','국내 설치 사진과 국내 판매 자료를 구분해 표시했습니다. 판매 사진은 설치 장소가 확인된 사진이 아닙니다.'),summary);
 const note=el('p','승인·교체 요청·붙여넣은 이미지는 이 브라우저에 저장됩니다. 다른 기기와 자동 공유되지 않습니다. 제작자에게 전달할 때 검토 기록을 내려받아 주세요.','hint');intro.append(note);
 if(storageError){const err=el('p',storageError);err.setAttribute('role','alert');intro.append(err);}
 const exportButton=el('button','검토 기록 내려받기');exportButton.type='button';exportButton.disabled=!store;exportButton.onclick=()=>{const data={version:1,exportedAt:new Date().toISOString(),items:[...records.values()]},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download='도로시설-참고이미지-검토.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};intro.append(exportButton);
 const lightbox=el('dialog',null,'reference-lightbox'),large=el('img'),close=el('button','닫기');close.type='button';close.onclick=()=>lightbox.close();lightbox.setAttribute('aria-label','참고 이미지 크게 보기');lightbox.append(close,large);document.body.append(lightbox);
 function card(asset){
  if(!records.has(asset.id))return null;
  const root=el('section',null,'reference-review');root.setAttribute('aria-label',asset.name+' 참고 이미지');root.dataset.referenceAsset=asset.id;
  let busy=false,loaded=false;
  const title=el('h3','참고 이미지'),status=el('p',null,'reference-status');status.setAttribute('role','status');
  const imageLink=el('a',null,'reference-image-link');imageLink.target='_blank';imageLink.rel='noopener noreferrer';imageLink.setAttribute('aria-label',asset.name+' 참고 이미지 크게 보기');
  const img=el('img');img.alt=asset.name+' 모델링 참고 이미지';img.loading='lazy';img.referrerPolicy='no-referrer';imageLink.append(img);imageLink.onclick=e=>{e.preventDefault();large.src=records.get(asset.id).reference.imageUrl;large.alt=asset.name+' 참고 이미지';lightbox.showModal();};
  const evidence=el('p',null,'reference-evidence'),source=el('a');source.target='_blank';source.rel='noopener noreferrer';
  const error=el('p',null,'reference-error');error.setAttribute('role','alert');
  const checkRow=el('div',null,'reference-approve'),check=el('input');check.type='checkbox';check.id='reference-approve-'+asset.id.replace(/[^a-z0-9-]/gi,'-');const label=el('label','이 이미지 승인');label.htmlFor=check.id;checkRow.append(check,label);
  const actions=el('div',null,'reference-actions'),replace=el('button'),paste=el('button','클립보드 붙여넣기'),file=el('input');replace.type=paste.type='button';file.type='file';file.accept='image/png,image/jpeg,image/webp';file.id='reference-file-'+check.id;const fileLabel=el('label','또는 이미지 파일 선택');fileLabel.htmlFor=file.id;
  const restore=el('button','처음 후보로 되돌리기');restore.type='button';restore.onclick=()=>save('image',seeds[asset.id]);actions.append(replace,paste,restore);root.append(title,imageLink,status,evidence,source,checkRow,actions,fileLabel,file,error);
  function controls(){check.disabled=busy||!store||!loaded;replace.disabled=paste.disabled=file.disabled=restore.disabled=busy||!store;}
  function draw(){const r=records.get(asset.id);root.dataset.referenceStatus=r.status;status.textContent=canModel(r)&&asset.approvedReferenceId===r.reference.id?'승인 이미지로 모델 반영 완료':LABELS[r.status];restore.hidden=!r.reference.userProvided;check.checked=canModel(r);replace.textContent=r.status==='replace-requested'?'교체 요청 취소':'교체 요청';evidence.textContent=r.reference.koreaEvidence;source.textContent=r.reference.sourceUrl?'출처: '+r.reference.sourceName:r.reference.sourceName;source.hidden=false;if(r.reference.sourceUrl)source.href=r.reference.sourceUrl;else source.removeAttribute('href');if(img.getAttribute('src')!==r.reference.imageUrl){loaded=false;img.src=r.reference.imageUrl;}imageLink.href=r.reference.imageUrl;controls();}
  img.onload=()=>{loaded=true;error.textContent='';controls();};img.onerror=()=>{loaded=false;error.textContent='참고 이미지를 불러오지 못했습니다. 출처를 확인하거나 이미지를 직접 붙여넣어 주세요.';controls();};
  async function save(action,image){if(busy)return;const current=records.get(asset.id);busy=true;error.textContent='';controls();try{const next=changeReference(current,action,image,loaded);await store.save(next,current.revision);records.set(asset.id,next);draw();updateSummary();onChange();}catch(e){error.textContent=e.message;check.checked=canModel(current);}finally{busy=false;controls();}}
  async function accept(blob){if(busy)return;busy=true;controls();try{const ref=await imageFromBlob(blob);busy=false;await save('image',ref);}catch(e){error.textContent=e.message;}finally{busy=false;controls();}}
  check.onchange=()=>save(check.checked?'approve':'unapprove');replace.onclick=()=>save(records.get(asset.id).status==='replace-requested'?'unapprove':'replace');
  paste.onclick=async()=>{try{if(!navigator.clipboard?.read)throw Error();const items=await navigator.clipboard.read();for(const item of items){const type=item.types.find(t=>['image/png','image/jpeg','image/webp'].includes(t));if(type){await accept(await item.getType(type));return;}}error.textContent='클립보드에 이미지가 없습니다. 이미지를 복사한 뒤 다시 눌러 주세요.';}catch{error.textContent='클립보드를 읽지 못했습니다. 이 버튼에 초점을 둔 채 ⌘V 또는 Ctrl+V를 누르거나 이미지 파일을 선택해 주세요.';paste.focus();}};
  root.addEventListener('paste',e=>{const blob=[...e.clipboardData.items].find(x=>x.kind==='file'&&x.type.startsWith('image/'))?.getAsFile();if(blob){e.preventDefault();void accept(blob);}});
  file.onchange=()=>{if(file.files[0])void accept(file.files[0]);file.value='';};
  draw();return root;
 }
 return {intro,card};
}
