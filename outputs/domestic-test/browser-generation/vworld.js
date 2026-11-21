export const BUILDING_SOURCE='VWorld / 도로명주소 건물 (LT_C_SPBD)';
export function buildingBounds({center,radius}){
 const [lat,lon]=center||[];
 if(![lat,lon,radius].every(Number.isFinite)||lat<=33||lat>=39.5||lon<=124||lon>=132||radius<50||radius>300||radius%50)throw Error('국내 위치와 50~300m 범위를 선택해 주세요.');
 const a=lat*Math.PI/180,sx=111412.84*Math.cos(a)-93.5*Math.cos(3*a)+.118*Math.cos(5*a),sy=111132.92-559.82*Math.cos(2*a)+1.175*Math.cos(4*a)-.0023*Math.cos(6*a),r=Math.max(200,radius+150);
 return [lon-r/sx,lat-r/sy,lon+r/sx,lat+r/sy];
}
export function readBuildingPage(payload){
 const response=payload?.response;
 if(response?.status==='NOT_FOUND')return {features:[],pages:0};
 if(response?.status!=='OK'){
  const code=response?.error?.code;
  if(['INCORRECT_KEY','UNAUTHORIZED_KEY','EXPIRED_KEY'].includes(code))throw Error('건물 조회 인증키를 사용할 수 없습니다. 사이트 관리자가 키 상태를 확인해야 합니다.');
  throw Error('브이월드에서 건물 자료를 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
 }
 const features=response.result?.featureCollection?.features,pages=Number(response.page?.total);
 if(!Array.isArray(features)||!Number.isInteger(pages)||pages<1||pages>6)throw Error('건물 자료 형식이나 조회 범위를 확인할 수 없습니다. 범위를 줄여 다시 시도해 주세요.');
 return {pages,features:features.map(feature=>{
  if(!/^LT_C_SPBD\.\d+$/.test(feature.id)||!['Polygon','MultiPolygon'].includes(feature.geometry?.type))throw Error('건물 모양이나 식별번호가 올바르지 않습니다.');
  const coords=feature.geometry.coordinates;
  const rings=feature.geometry.type==='Polygon'?coords:coords?.flat();
  if(!Array.isArray(rings)||!rings.length||!rings.every(r=>Array.isArray(r)&&r.length>=4&&r.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>124&&p[0]<132&&p[1]>33&&p[1]<39.5)))throw Error('건물 좌표가 올바르지 않습니다.');
  const p=feature.properties||{},floors=Number(p.gro_flo_co),known=Number.isInteger(floors)&&floors>0&&floors<=200;
  const objectid=Number(feature.id.split('.')[1]);if(!Number.isSafeInteger(objectid))throw Error('건물 식별번호가 올바르지 않습니다.');
  return {...feature,properties:{...p,objectid,building_id:p.bd_mgt_sn||'',building_name:p.buld_nm||'',street_name:p.rd_nm||'',house_number:p.buld_no||'',gro_flo_co:known?floors:1,floorsEstimated:!known,und_flo_co:0,source:BUILDING_SOURCE}};
 })};
}
export async function collectBuildings(query,{signal}={}){
 const features=[],seen=new Set();
 for(let page=1;page<=6;page++){
  signal?.throwIfAborted();
  const result=readBuildingPage(await query(page));
  if(page>1&&!result.features.length)throw Error('건물 자료 일부를 받지 못했습니다. 다시 시도해 주세요.');
  for(const f of result.features)if(!seen.has(f.id)){seen.add(f.id);features.push(f);}
  if(page>=result.pages)return {type:'FeatureCollection',source:BUILDING_SOURCE,features};
 }
 throw Error('건물이 너무 많습니다. 생성 범위를 줄여 주세요.');
}
export function queryBuildingPage(params,{signal,timeout=25000}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(signal.reason);return;}
  const frame=document.createElement('iframe'),token=crypto.randomUUID();frame.hidden=true;frame.title='건물 자료 조회';frame.sandbox='allow-scripts';
  const cleanup=()=>{clearTimeout(timer);removeEventListener('message',receive);signal?.removeEventListener('abort',abort);frame.remove();};
  const fail=message=>{cleanup();reject(Error(message));};
  const abort=()=>{cleanup();reject(signal.reason);};
  const receive=event=>{
   if(event.source!==frame.contentWindow||event.origin!=='null'||event.data?.type!=='vworld-result'||event.data.token!==token)return;
   cleanup();event.data.error?reject(Error(event.data.error)):resolve(event.data.payload);
  };
  const timer=setTimeout(()=>fail('건물 조회 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.'),timeout);
  addEventListener('message',receive);signal?.addEventListener('abort',abort,{once:true});
  frame.onload=()=>frame.contentWindow.postMessage({type:'vworld-query',token,params},'*');
  frame.onerror=()=>fail('건물 조회 화면을 열지 못했습니다. 페이지를 새로고침해 주세요.');
  frame.src=new URL('./vworld-frame.html',import.meta.url);document.body.append(frame);
 });
}
export async function loadBuildings(point,{signal}={}){
 const bbox=buildingBounds(point);
 if(['localhost','127.0.0.1'].includes(location.hostname)){
  const response=await fetch('/api/buildings?'+new URLSearchParams({bbox:bbox.join(',')}),{signal});
  const data=await response.json();if(!response.ok)throw Error(data.message||'건물 자료를 받지 못했습니다.');return data;
 }
 const response=await fetch(new URL('./vworld-config.json',import.meta.url),{signal,cache:'no-cache'});
 if(!response.ok)throw Error('건물 조회 설정을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');
 const config=await response.json();
 if(typeof config.key!=='string'||!config.key||new URL(config.domain).origin!==location.origin)throw Error('이 사이트의 건물 조회 인증키가 설정되지 않았습니다.');
 return collectBuildings(page=>queryBuildingPage({key:config.key,domain:config.domain,geomFilter:'BOX('+bbox.join(',')+')',page},{signal}),{signal});
}
