export const DOMAINS=Object.freeze(['house','commerce','road','vehicle','nature','prop','person']);
export const DOMAIN_ROLES=Object.freeze(Object.fromEntries(Object.entries({house:['complete','wall','window','window-accessory','door','roof','boundary','garden','service','ground','reference'],commerce:['complete','storefront','display','service','reference'],road:['surface','junction','marking','safety','utility','reference'],vehicle:['car','bus','truck','bicycle','motorcycle','reference'],nature:['tree','plant','garden','reference'],prop:['furniture','storage','tool','household','reference'],person:['pedestrian','reference']}).map(([k,v])=>[k,Object.freeze(v)])));
export function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;}
export function validateEntry(a){
 if(!a?.id||!a.name||!a.kind||!DOMAINS.includes(a.taxonomy?.domain)||!DOMAIN_ROLES[a.taxonomy.domain].includes(a.taxonomy.role))throw Error('에셋 분류 또는 ID를 확인해 주세요: '+a?.id);
 for(const key of ['era','colors','materials','tags'])if(!Array.isArray(a.taxonomy[key])||a.taxonomy[key].some(v=>typeof v!=='string'))throw Error('에셋 특성 형식을 확인해 주세요: '+a.id+' '+key);
 if(!['component','complete','reference','legacy'].includes(a.assembly?.kind)||!Array.isArray(a.assembly.slots)||!a.assembly.evidence)throw Error('에셋 조립 정보를 확인해 주세요: '+a.id);
 const dims=a.assembly.dimensions;if(dims!==null&&(!dims||typeof dims!=='object'||Array.isArray(dims)||dims.unit!=='m'||!dims.basis||!Object.keys(dims).some(k=>['width','height','depth'].includes(k))||Object.entries(dims).some(([k,v])=>['width','height','depth'].includes(k)&&(!Number.isFinite(v)||v<=0))))throw Error('에셋 치수 형식을 확인해 주세요: '+a.id);
 for(const slot of a.assembly.slots)if(!slot||typeof slot.id!=='string'||!slot.id||typeof slot.surface!=='string'||!slot.surface||typeof slot.evidence!=='string'||!slot.evidence)throw Error('에셋 부착 위치를 확인해 주세요: '+a.id);
 if(!a.ownership?.manifest||!Array.isArray(a.ownership.sources)||!a.ownership.sources.length||a.ownership.sources.some(s=>typeof s!=='string'||!s))throw Error('에셋 원본 연결을 확인해 주세요: '+a.id);
 if(a.ownership.sourceAvailability)for(const source of a.ownership.sources)if(!['public-required','local-archive'].includes(a.ownership.sourceAvailability[source]))throw Error('원본의 공개 포함 여부를 확인해 주세요: '+a.id+' '+source);
 if('placement' in a||'integration' in a)throw Error('배치 규칙은 동네 조립 규칙에 등록해 주세요: '+a.id);
 return a;
}

// Preserve recorded facts while allowing values to be corrected and fields to be added.
export function assertMetadataPreserved(previous,next,at='metadata'){
 if(previous===null||previous===undefined)return;
 if(next===null||next===undefined)throw Error('Erased metadata: '+at);
 if(Array.isArray(previous)){
  if(!Array.isArray(next))throw Error('Erased metadata: '+at);
  for(const [i,value]of previous.entries()){
   if(value&&typeof value==='object'){const found=value.id?next.find(v=>v?.id===value.id):next[i];assertMetadataPreserved(value,found,at+'['+i+']');}
   else if(!next.includes(value))throw Error('Erased metadata: '+at+' '+value);
  }
 }else if(typeof previous==='object'){
  if(typeof next!=='object'||Array.isArray(next))throw Error('Erased metadata: '+at);
  for(const [key,value]of Object.entries(previous))assertMetadataPreserved(value,next[key],at+'.'+key);
 }else if(typeof previous==='string'&&previous.length&&(typeof next!=='string'||!next.length))throw Error('Erased metadata: '+at);
}
