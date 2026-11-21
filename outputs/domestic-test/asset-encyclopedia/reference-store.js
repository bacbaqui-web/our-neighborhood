const STATES=new Set(['pending','approved','replace-requested']);
export function validateRecord(r){
 const ref=r?.reference;
 if(!r||r.version!==1||!Number.isInteger(r.revision)||r.revision<0||typeof r.assetId!=='string'||!STATES.has(r.status)||!ref||typeof ref.id!=='string'||!ref.id||typeof ref.imageUrl!=='string'||!( /^https:\/\//.test(ref.imageUrl)||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(ref.imageUrl))||ref.imageUrl.length>6_000_000)throw Error('참고 이미지 기록 형식을 확인해야 합니다.');
 if(ref.sourceUrl&&!/^https:\/\//.test(ref.sourceUrl))throw Error('출처 주소는 HTTPS여야 합니다.');
 if(typeof ref.sourceName!=='string'||typeof ref.koreaEvidence!=='string')throw Error('참고 이미지의 출처 정보가 없습니다.');
 if(r.status==='approved'&&r.approvedReferenceId!==ref.id)throw Error('승인한 이미지와 현재 이미지가 다릅니다.');
 return r;
}
export function referenceRecord(assetId,seed,saved){
 if(saved){validateRecord(saved);if(saved.assetId!==assetId)throw Error('다른 에셋의 검토 기록입니다.');if(saved.reference.userProvided||(saved.reference.id===seed.id&&saved.reference.imageUrl===seed.imageUrl))return saved;}
 return validateRecord({version:1,assetId,reference:{...seed},status:'pending',approvedReferenceId:null,revision:saved?.revision||0,updatedAt:null});
}
export function changeReference(record,action,image=null,imageLoaded=true){
 validateRecord(record);const next={...record,revision:record.revision+1,updatedAt:new Date().toISOString(),approvedReferenceId:null};
 if(action==='approve'){if(!imageLoaded)throw Error('이미지를 불러온 뒤 승인해 주세요.');next.status='approved';next.approvedReferenceId=record.reference.id;}
 else if(action==='replace')next.status='replace-requested';
 else if(action==='unapprove')next.status='pending';
 else if(action==='image'){next.reference={...image};next.status='pending';}
 else throw Error('지원하지 않는 검토 동작입니다.');
 return validateRecord(next);
}
export const canModel=r=>r?.status==='approved'&&r.approvedReferenceId===r.reference?.id;
export function openReferenceStore(indexed=indexedDB){
 return new Promise((resolve,reject)=>{
  const req=indexed.open('neighborhood-asset-references',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('reviews',{keyPath:'assetId'});
  req.onerror=()=>reject(Error('참고 이미지 저장소를 열지 못했습니다. 브라우저의 사이트 저장 권한을 확인해 주세요.'));
  req.onblocked=()=>reject(Error('다른 에셋백과 탭을 닫은 뒤 새로고침해 주세요.'));
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve({
   load(){return new Promise((yes,no)=>{const q=db.transaction('reviews').objectStore('reviews').getAll();q.onsuccess=()=>{try{yes(new Map(q.result.map(r=>[r.assetId,validateRecord(r)])));}catch(e){no(e);}};q.onerror=()=>no(Error('참고 이미지 기록을 읽지 못했습니다. 새로고침해 주세요.'));});},
   save(record,expectedRevision){validateRecord(record);return new Promise((yes,no)=>{const tx=db.transaction('reviews','readwrite'),store=tx.objectStore('reviews');let conflict=false;const q=store.get(record.assetId);q.onsuccess=()=>{if((q.result?.revision||0)!==expectedRevision){conflict=true;tx.abort();return;}store.put(record);};tx.oncomplete=()=>yes(record);tx.onabort=tx.onerror=()=>no(Error(conflict?'다른 탭에서 기록이 바뀌었습니다. 새로고침한 뒤 다시 시도해 주세요.':'이미지를 저장하지 못했습니다. 저장 공간과 사이트 저장 권한을 확인해 주세요.'));});}
  });};
 });
}
export async function imageFromBlob(blob){
 if(!['image/png','image/jpeg','image/webp'].includes(blob?.type))throw Error('PNG, JPG, WebP 이미지를 복사하거나 선택해 주세요.');
 if(blob.size>20*1024*1024)throw Error('이미지가 20MB를 넘습니다. 작은 이미지로 다시 선택해 주세요.');
 const url=URL.createObjectURL(blob),img=new Image();
 try{img.src=url;await img.decode();if(!img.naturalWidth||img.naturalWidth*img.naturalHeight>40_000_000)throw Error('이미지 크기가 너무 큽니다. 가로·세로를 줄여 다시 선택해 주세요.');const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return {id:'paste-'+crypto.randomUUID(),imageUrl:canvas.toDataURL('image/webp',.9),sourceUrl:'',sourceName:'직접 제공한 이미지',koreaEvidence:'한국에서 사용하는 물건인지 확인한 뒤 승인해 주세요.',userProvided:true};}
 catch(e){throw Error(e.message.includes('크기')?e.message:'이미지 파일을 읽지 못했습니다. 다른 PNG, JPG, WebP 파일을 선택해 주세요.');}
 finally{URL.revokeObjectURL(url);}
}
