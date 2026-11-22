// Local tab diagnostics only. No URL, free-form error, scene ID or remote transport is stored.
export const DIAGNOSTIC_KEY='neighborhood-loading-diagnostics-v1';
const STAGES=['location','scene-data','image-assets','shared-models','scene-build','ready'];
const CODES=['image-event','timeout','abort','http','json-parse','length-mismatch','glb-invalid','network-or-policy','other'];
const MAX_BYTES=24*1024,MAX_EVENTS=80;
const DATA_FILES=new Set(['corrected-base.glb','buildings.geojson','parcels.json','attached-structures.json','streetscape-context.json','utilities.json','catalog.json','placements.json','terrain.json','terrain-mountains30.json','streetlights.json','road-context.json','places.json','plan.json','seasons.json','umbrella.json','route-elevation.json','site-layout.json','site-layout27.json','neighbor-boundaries28.json']);
// Static public filename allowlist; no caller-provided filename is retained unless listed.
const PEOPLE=['woman-cardigan','man-jacket','woman-vest','man-senior','man-backpack','woman-coat','man-sweatshirt','woman-skirt','woman-sweater','man-shirt'];
const SUFFIXES=['','-e30','-e60',...['spring','summer','autumn','winter'].flatMap(s=>[...(s==='spring'?[]:['-'+s]),...['0','30','60'].map(p=>`-${s}-e${p}`)])];
const PLANTS=['leafy-herb','hydrangea','pepper','broadleaf-flat-v46','ginkgo','maple','cherry','zelkova','fringe','magnolia','persimmon','metasequoia','pine','plane'];
const TEXTURE_FILES=new Set([...PEOPLE.flatMap(id=>SUFFIXES.map(s=>id+s)),...PLANTS].flatMap(name=>['png','webp'].map(ext=>name+'.'+ext)));
const number=value=>Number.isFinite(value)&&value>=0?Math.min(Math.round(value),1e9):null;
const epoch=value=>Number.isSafeInteger(value)&&value>=0&&value<=8640000000000000?value:null;
const safe=(fn,fallback=null)=>{try{return fn();}catch{return fallback;}};
export function createLoadingDiagnostics({baseURL=import.meta.url,now=()=>performance.now(),wallNow=()=>Date.now(),storage=()=>globalThis.sessionStorage,online=()=>navigator.onLine,performance:performanceSource=()=>globalThis.performance,Observer=globalThis.PerformanceObserver}={}){
 let sessions=[],active=null,start=0,sequence=0,observer=null,tokens=new Set();
 const timestamp=()=>{const value=safe(now,0);return Number.isFinite(value)&&value>=0?value:0;};
 const network=()=>{const value=safe(online);return typeof value==='boolean'?value:null;};
 const label=(url,kind)=>safe(()=>{const u=new URL(url,baseURL),base=new URL(baseURL);if(u.origin!==base.origin||!['http:','https:'].includes(u.protocol)||u.username||u.password)return kind+'-other';const file=u.pathname.split('/').pop();if(kind==='texture')return /\/domestic-test\/(?:people|vegetation)\//.test(u.pathname)&&TEXTURE_FILES.has(file)?file:'texture-other';return DATA_FILES.has(file)?file:'data-other';},kind+'-other');
 const assetAllowed=value=>typeof value==='string'&&(TEXTURE_FILES.has(value)||DATA_FILES.has(value)||['data-other','texture-other'].includes(value));
 function timingFields(entry,token){
  const out={};for(const key of ['duration','transferSize','encodedBodySize','decodedBodySize'])out[key]=number(entry[key]);
  for(const key of ['responseStart','responseEnd'])out[key]=entry[key]>=token.start?number(entry[key]-token.start):null;
  out.responseStatus=Number.isInteger(entry.responseStatus)&&entry.responseStatus>=0&&entry.responseStatus<=599?entry.responseStatus:null;
  out.initiatorType=['img','fetch','xmlhttprequest','other'].includes(entry.initiatorType)?entry.initiatorType:'other';return out;
 }
 function attach(entries){
  let changed=false;for(const token of tokens){const matches=entries.filter(e=>e.name===token.url&&e.startTime>=token.start&&e.startTime<=(token.end??Infinity));if(matches.length){const timing=timingFields(matches.at(-1),token);token.timing=timing;if(token.event&&JSON.stringify(timing)!==JSON.stringify(token.event.timing)){token.event.timing=timing;changed=true;}}}
 return changed;}
 function flush(){safe(()=>attach(observer?.takeRecords?.()||[]));for(const token of tokens)safe(()=>attach(performanceSource()?.getEntriesByName?.(token.url,'resource')||[]));}
 function trim(){sessions=sessions.slice(-3);let text=JSON.stringify(sessions);while(new TextEncoder().encode(text).length>MAX_BYTES){if(sessions.length>1)sessions.shift();else if(sessions[0]?.events.length){sessions[0].events.shift();sessions[0].droppedCount++;}else break;text=JSON.stringify(sessions);}return text;}
 function persist(){safe(()=>{const text=trim();storage()?.setItem(DIAGNOSTIC_KEY,text);});}

 // Rebuild only known fields from local storage; never re-emit unknown strings/objects.
 function restore(){safe(()=>{const text=storage()?.getItem(DIAGNOSTIC_KEY);if(!text||text.length>MAX_BYTES)return;const rows=JSON.parse(text);if(!Array.isArray(rows))return;
  sessions=rows.slice(-3).flatMap(s=>{if(s?.version!==1||(typeof s.id!=='string'||!/^s-[0-9]{1,16}-[0-9]{1,9}$/.test(s.id))||!STAGES.includes(s.stage)||!['running','ready','failed'].includes(s.status))return [];
   const clean={version:1,id:s.id,startedAt:epoch(s.startedAt),elapsedMs:number(s.elapsedMs),stage:s.stage,status:s.status,counters:{success:number(s.counters?.success)||0,failed:number(s.counters?.failed)||0},droppedCount:number(s.droppedCount)||0,stages:(Array.isArray(s.stages)?s.stages:[]).slice(0,6).filter(x=>STAGES.includes(x?.stage)).map(x=>({stage:x.stage,at:number(x.at)})),events:[]};
   for(const e of (Array.isArray(s.events)?s.events:[]).slice(-MAX_EVENTS)){if(!STAGES.includes(e.stage)||!assetAllowed(e.asset)||!['error','recovered','final-error'].includes(e.outcome)||![1,2].includes(e.attempt)||!(e.code===null||CODES.includes(e.code)))continue;const event={request:number(e.request),stage:e.stage,asset:e.asset,attempt:e.attempt,outcome:e.outcome,code:e.code,at:number(e.at),duration:number(e.duration),online:typeof e.online==='boolean'?e.online:null,httpStatus:Number.isInteger(e.httpStatus)&&e.httpStatus>=100&&e.httpStatus<=599?e.httpStatus:null,timing:null};if(e.timing&&typeof e.timing==='object')event.timing=timingFields({...e.timing,responseStart:e.timing.responseStart,responseEnd:e.timing.responseEnd},{start:0});clean.events.push(event);}return [clean];});});}
 restore();safe(trim);
 const api={
  start(){safe(()=>{if(active){flush();active.elapsedMs=number(timestamp()-start);safe(()=>observer?.disconnect());observer=null;active=null;tokens.clear();persist();}start=timestamp();sequence=0;tokens=new Set();active={version:1,id:`s-${epoch(safe(wallNow,0))||0}-${Math.floor(Math.random()*1e9)}`,startedAt:epoch(safe(wallNow,0)),elapsedMs:0,stage:'location',status:'running',counters:{success:0,failed:0},droppedCount:0,stages:[{stage:'location',at:0}],events:[]};sessions.push(active);if(Observer){const session=active;observer=safe(()=>new Observer(list=>{if(active!==session)return;if(safe(()=>attach(list.getEntries()),false))persist();}));safe(()=>observer?.observe({type:'resource',buffered:true}));}persist();});},
  stage(value){safe(()=>{if(active&&STAGES.includes(value)){active.stage=value;if(!active.stages.some(x=>x.stage===value)&&active.stages.length<6)active.stages.push({stage:value,at:number(timestamp()-start)});persist();}});},
  begin(url,kind,attempt){return safe(()=>{if(!active||![1,2].includes(attempt))return null;const token={session:active,url:String(url).length<=2048?new URL(url,baseURL).href:'',asset:label(url,kind==='texture'?'texture':'data'),start:timestamp(),attempt,request:++sequence,stage:active.stage};if(tokens.size<160)tokens.add(token);return token;});},
  end(token,code=null,httpStatus=null){safe(()=>{if(!active||token?.session!==active||token.end!==undefined)return;token.end=timestamp();const failed=code!==null;active.counters[failed?'failed':'success']++;
   if(failed||token.attempt===2){const event={request:token.request,stage:token.stage,asset:token.asset,attempt:token.attempt,outcome:failed?(token.attempt===2?'final-error':'error'):'recovered',code:CODES.includes(code)?code:failed?'other':null,at:number(token.start-start),duration:number(token.end-token.start),online:network(),httpStatus:Number.isInteger(httpStatus)&&httpStatus>=100&&httpStatus<=599?httpStatus:null,timing:token.timing||null};token.event=event;active.events.push(event);if(active.events.length>MAX_EVENTS){active.events.shift();active.droppedCount++;}flush();persist();}else tokens.delete(token);});},
  finish(status){safe(()=>{if(!active)return;flush();active.elapsedMs=number(timestamp()-start);active.status=status==='ready'?'ready':'failed';if(status==='ready'){active.stage='ready';if(!active.stages.some(x=>x.stage==='ready')&&active.stages.length<6)active.stages.push({stage:'ready',at:active.elapsedMs});}safe(()=>observer?.disconnect());observer=null;active=null;tokens.clear();persist();});},
  read(){return safe(()=>JSON.parse(JSON.stringify(sessions)),[]);}
 };return Object.freeze(api);
}
export const loadingDiagnostics=createLoadingDiagnostics();

export function diagnosticErrorCode(error,fallback='other',jsonResponse=false){return safe(()=>{if(error?.type==='error')return 'image-event';return error?.name==='TimeoutError'?'timeout':error?.name==='AbortError'?'abort':jsonResponse&&error?.name==='SyntaxError'?'json-parse':fallback;},fallback);}
