const original={id:'original',address:'서울 강북구 솔매로17가길 7',origin:[37.626469,127.015677],sizeMetres:300,roadAddress:{road_name:'솔매로17가길',main_building_no:'7',sub_building_no:''}};
const key='neighborhood-last-location-v74';
const deployment=fetch(new URL('./deployment.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('배포 설정을 불러오지 못했습니다.');return r.json();});
const api=new URL('../api/neighborhoods',import.meta.url);
const savedLocations=deployment.then(async config=>{
 const url=config.mode==='static'?new URL('./locations.json',import.meta.url):api;
 const response=await fetch(url,{cache:'no-cache'});
 if(!response.ok)throw Error('저장된 동네 목록을 불러오지 못했습니다.');
 return [original,...await response.json()];
});
// The UI reports failures when needed; do not emit an unhandled rejection at startup.
savedLocations.catch(()=>{});
const normalizeAddress=value=>value.replace(/서울특별시/g,'서울').replace(/\s+/g,'').toLowerCase();
export async function readLocation(){
 const requested=new URLSearchParams(location.search).get('location');
 // An explicit original URL makes returning to the preserved test neighborhood easy.
 let id=requested;try{if(!id)id=localStorage.getItem(key);}catch{}
 if(!id||id==='original')return original;
 if(!/^[a-f0-9]{16}$/.test(id))throw Error('지역 주소가 올바르지 않습니다. 주소를 다시 입력해 주세요.');
 const base=new URL(`../generated-neighborhoods/${id}/data/`,import.meta.url).href,r=await fetch(base+'manifest.json',{cache:'no-cache'});
 if(!r.ok)throw Error('저장된 지역을 찾지 못했습니다. 주소를 다시 입력해 주세요.');
 const m=await r.json();if(m.id!==id||!Array.isArray(m.origin)||m.origin.length!==2||!m.origin.every(Number.isFinite))throw Error('지역 정보가 올바르지 않습니다.');
 return {...m,base};
}
export function dataUrl(context,name){const file=name.split('?')[0].replace(/^\.\//,'');return context.base?context.base+(context.arterial?.overrides.includes(file)?'arterial/':'')+file:name;}
export function rememberLocation(context){try{localStorage.setItem(key,context.id);}catch{}}
export function setupLocationSearch(context,getHour){
 const input=document.getElementById('address'),button=document.getElementById('findAddress'),status=document.getElementById('status'),form=document.getElementById('addressForm'),history=document.getElementById('locationHistory');
 input.disabled=button.disabled=false;if(context.address)input.value=context.address;
 let busy=false;
 const message=text=>{status.textContent=text;};
 function visit(id){const url=new URL(location.href);url.searchParams.set('location',id);url.searchParams.set('hour',getHour());url.searchParams.delete('shop');location.assign(url.href);}
 history?.addEventListener('change',()=>{if(history.value)visit(history.value);});
 savedLocations.then(rows=>{
  for(const row of rows){const o=document.createElement('option');o.value=row.id;o.textContent=row.address;history?.append(o);const suggestion=document.createElement('option');suggestion.value=row.address;document.getElementById('addresses')?.append(suggestion);}
  if(history)history.value=context.id||'';
 }).catch(()=>{});
 deployment.then(config=>{
  if(config.mode!=='static')return;
  input.placeholder='공개된 동네 주소 검색';input.setAttribute('aria-label','공개된 동네 주소 검색');
  button.title='공개된 동네 열기';button.setAttribute('aria-label','공개된 동네 열기');
  const note=document.createElement('p');note.className='published-location-note';note.textContent='공개된 동네를 선택하세요. 새 주소 생성은 로컬에서 지원합니다.';form.after(note);
 }).catch(()=>{});
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;const address=input.value.trim();if(!address){input.focus();message('생성할 주소를 입력해 주세요.');return;}
  busy=true;button.disabled=true;input.readOnly=true;if(history)history.disabled=true;form.setAttribute('aria-busy','true');message('주소를 확인하고 새 동네 생성을 시작합니다…');
  try{
   const config=await deployment;
   if(config.mode==='static'){
    const query=normalizeAddress(address),rows=await savedLocations;
    const matches=rows.filter(row=>[row.address,row.query].filter(Boolean).some(value=>normalizeAddress(value).includes(query)));
    if(matches.length===1){visit(matches[0].id);return;}
    message(matches.length?'여러 동네가 검색되었습니다. 저장된 동네 목록에서 선택해 주세요.':'아직 공개되지 않은 주소입니다. 저장된 동네를 선택하거나 로컬 프로그램에서 새 동네를 생성해 주세요.');return;
   }
   const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address}),signal:AbortSignal.timeout(30000)});
   const result=await r.json();if(!r.ok)throw Error(result.message||'생성을 시작하지 못했습니다.');
   for(;;){
    const r=await fetch(new URL(`../api/neighborhood/jobs/${result.job}`,import.meta.url),{cache:'no-cache',signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error('생성 진행 상태를 받지 못했습니다. 주소를 다시 제출하면 진행 중인 작업에 연결됩니다.');
    const state=await r.json();message(state.message+(state.state==='running'?` (${state.percent}%)`:''));
    if(state.state==='complete'){visit(state.id);return;}
    if(state.state==='error')throw Error(state.message);
    await new Promise(resolve=>setTimeout(resolve,1500));
   }
  }catch(error){message('동네 생성 실패: '+error.message);}
  finally{busy=false;input.readOnly=false;button.disabled=false;if(history)history.disabled=false;form.removeAttribute('aria-busy');}
 };
}
