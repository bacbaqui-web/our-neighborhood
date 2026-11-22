// Presentation filters only. Assembly eligibility belongs to ../assembly-rules/.
export const DOMAINS=Object.freeze({all:'전체',house:'집',commerce:'상가',road:'도로·시설',vehicle:'자동차',nature:'나무·식물',prop:'소품',person:'사람'});
export const HOUSE_ROLES=Object.freeze({complete:'완성 건물',wall:'외벽',window:'창문','window-accessory':'창문 부속',door:'문',roof:'지붕·옥상',boundary:'담장·대문',garden:'마당',service:'설비',ground:'바닥',reference:'조립 예시'});
export const ROLE_LABELS=Object.freeze({...HOUSE_ROLES,storefront:'점포 외관',interior:'실내',sign:'간판',awning:'차양',surface:'노면',junction:'교차로',sidewalk:'인도',marking:'노면 표시',safety:'안전 시설',light:'조명',streetlight:'가로등',parking:'주차',tree:'나무',plant:'식물',shrub:'관목',grass:'풀',car:'승용차',bus:'버스',truck:'화물차',furniture:'가구',household:'생활 소품',utility:'시설물',pedestrian:'행인',person:'사람',display:'진열·간판',storage:'수납',tool:'도구',bicycle:'자전거',motorcycle:'오토바이',unknown:'미분류'});
export const UNKNOWN='__unknown__';
export const FACETS=Object.freeze({era:'시대',color:'색상',material:'재료'});
const taxonomyKeys={era:'era',color:'colors',material:'materials'};
export const defaultFilters=Object.freeze({domain:'house',role:'',era:'',color:'',material:'',query:'',treeUse:''});
export function metadataValues(asset,facet){const values=asset.taxonomy?.[taxonomyKeys[facet]];return Array.isArray(values)&&values.length?values:[UNKNOWN];}
export function inScope(asset,state){return (state.domain==='all'||asset.taxonomy?.domain===state.domain)&&(!state.role||asset.taxonomy?.role===state.role);}
export function facetValues(entries,state,facet){return [...new Set(entries.filter(a=>inScope(a,state)).flatMap(a=>facetMetadataValues(a,facet)))].sort((a,b)=>a===UNKNOWN?1:b===UNKNOWN?-1:a.localeCompare(b,'ko'));}
export function filterAssets(entries,state,extraSearch=()=>''){const query=state.query.trim().toLocaleLowerCase();return entries.filter(a=>inScope(a,state)&&Object.keys(FACETS).every(key=>!state[key]||facetMetadataValues(a,key).includes(key==='color'?normalizeColor(state[key]):state[key]))&&(!query||[a.name,a.id,a.note,a.category,a.collection,extraSearch(a),...Object.values(a.taxonomy||{}).flat()].join(' ').toLocaleLowerCase().includes(query)));}
export function changeScope(entries,state,domain,role=''){const next={...state,domain:Object.hasOwn(DOMAINS,domain)?domain:'house',role,treeUse:domain==='nature'?state.treeUse:''};for(const facet of Object.keys(FACETS))if(next[facet]&&!facetValues(entries,next,facet).includes(next[facet]))next[facet]='';return next;}
export function parseFilters(params){const aliases={building:'house',part:'house',tree:'nature',car:'vehicle'};const requested=params.get('domain')||aliases[params.get('tab')]||params.get('tab');return {...defaultFilters,domain:Object.hasOwn(DOMAINS,requested)?requested:'house',role:params.get('role')||'',era:params.get('era')||'',color:normalizeColor(params.get('color')||''),material:params.get('material')||'',query:params.get('search')||'',treeUse:['street','yard'].includes(params.get('treeUse'))?params.get('treeUse'):''};}
export function serializeFilters(state){const params=new URLSearchParams();params.set('domain',state.domain);for(const key of ['role','era','color','material','treeUse'])if(state[key])params.set(key,state[key]);if(state.query)params.set('search',state.query);return params.toString();}
export function valueLabel(value){return value===UNKNOWN||value==='unknown'?'미확인':({old:'오래된 건물',middle:'중간 연식',new:'최근 건물',modern:'현대',red:'빨강',white:'흰색',black:'검정',gray:'회색',grey:'회색',brown:'갈색',beige:'베이지',green:'초록',blue:'파랑',yellow:'노랑',brick:'벽돌',metal:'금속',concrete:'콘크리트',glass:'유리',wood:'나무',stone:'돌',tile:'타일',plastic:'플라스틱',asphalt:'아스팔트'})[value]||value;}

// A readable approximation of a registered RGB swatch, never a new catalog tag.
const colorSwatches=[['검정','#202024'],['먹색','#35383b'],['흰색','#f5f4ef'],['회색','#95999b'],['은색','#bfc3c4'],['베이지','#cbb897'],['갈색','#865c42'],['빨강','#b93d3d'],['주황','#db802d'],['노랑','#edc43b'],['초록','#4d884c'],['파랑','#367db1'],['남색','#304767'],['보라','#875d99'],['분홍','#d88f9f'],['청록','#4d9b9a']];
export function colorPresentation(value){
 if(value.startsWith('color-family:')){const name=value.slice(13);return {color:colorSwatches.find(([label])=>label===name)?.[1]||null,label:name+' 계열'};}
 if(!/^#[0-9a-f]{6}$/i.test(value)){const label=valueLabel(value),known=colorSwatches.find(([name])=>name===label);return {color:known?.[1]||null,label};}
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),target=rgb(value);
 const nearest=colorSwatches.reduce((best,item)=>{const distance=rgb(item[1]).reduce((sum,n,i)=>sum+(n-target[i])**2,0);return distance<best.distance?{distance,name:item[0]}:best;},{distance:Infinity,name:''});
 return {color:value,label:nearest.name+' 계열'};
}

const hexColor=/^#[0-9a-f]{6}$/i;
const colorAliases={백색:'흰색',화이트:'흰색',검은:'검정',검정색:'검정',검은색:'검정',파란:'파랑',파란색:'파랑',붉은:'빨강',빨간색:'빨강',적색:'빨강',노란:'노랑',노란색:'노랑',초록색:'초록',녹색:'초록',크림:'크림색',회색빛:'회색'};
export function normalizeColor(value){return hexColor.test(value)?'color-family:'+colorPresentation(value).label.replace(/ 계열$/,''):colorAliases[value]||value;}
export function facetMetadataValues(asset,facet){
 const values=metadataValues(asset,facet);if(facet!=='color')return values;
 const named=values.filter(value=>!hexColor.test(value)&&value!==UNKNOWN&&value!=='unknown');
 return [...new Set((named.length?named:values).map(normalizeColor))];
}
