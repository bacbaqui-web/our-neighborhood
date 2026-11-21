import {stableHash} from './storefront-hours.js?v=shop50v2';
// A stable lottery per building/POI: revisiting the same saved neighborhood
// keeps its shops, while different building IDs select different valid assets.
export function chooseAlleyPlacement(choices,key){
 const best=new Map();for(const c of choices)if(!best.has(c.assetId)||best.get(c.assetId).score>c.score)best.set(c.assetId,c);
 const pool=[...best.values()].sort((a,b)=>a.assetId.localeCompare(b.assetId));
 let h=stableHash(key);h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h=(h^(h>>>16))>>>0;
 return pool[h%pool.length];
}
export function inferredAlleyPlaces(buildings,places){
 const normal=s=>(s||'').replace(/\s/g,'');
 return buildings.filter(b=>{
  const p=b.properties?.streetProfile;
  return p?.grade===1&&p.use==='mixed'&&!p.assetId&&!b.manualAssetChoice&&!b.facility&&!places.some(v=>normal(v.road_address_name)===normal(b.address));
 }).map(b=>({id:'inferred-alley-'+b.seed,place_name:'추정 골목 가게',road_address_name:b.address,alleyOwner:b.seed,localXY:[b.points.reduce((s,p)=>s+p[0],0)/b.points.length,b.points.reduce((s,p)=>s+p[1],0)/b.points.length],inferredShop:true}));
}
// Match confirmed POI trade labels before applying the generic shop lottery.
export function alleyTradeFor(place){
 const text=place.category_name||'';
 const rules=[[/반찬/,1],[/떡|한과/,2],[/제과|베이커리/,3],[/정육|축산물/,4],[/생선|수산물/,5],[/채소|야채/,6],[/과일/,7],[/쌀/,8],[/방앗간|참기름/,9],[/두부/,10],[/건어물/,11],[/잡곡|곡물/,12],[/달걀|계란/,13],[/꽃집|꽃배달|화원/,14],[/원예|화분/,15],[/문구/,16],[/중고.*서적|헌책/,18],[/서점|서적/,17],[/완구|장난감/,19],[/철물/,21],[/전구|조명/,22],[/열쇠|도장/,23],[/시계.*수리/,24],[/구두.*수선/,25],[/옷수선|의류수선/,26],[/이불|침구/,27],[/커튼|블라인드/,28],[/양말|속옷/,30],[/신발/,31],[/수예|뜨개/,32],[/액자/,33],[/사진관/,34],[/복사|인쇄|제본/,35],[/컴퓨터.*수리/,36],[/휴대.*수리/,37],[/가전.*수리/,38],[/자전거/,39],[/구제|중고.*의류/,40],[/그릇/,41],[/주방용품/,42],[/반려.*미용|애견.*미용/,44],[/반려.*용품|애견.*용품/,43],[/네일/,45],[/피부관리/,46],[/도자기|도예/,47],[/가죽|가방.*수선/,48],[/간판|실사출력/,49],[/악기.*수리/,50],[/의류|옷가게/,29],[/생활잡화|생활용품/,20]];
 const row=rules.find(([re])=>re.test(text));return row?'alley-'+String(row[1]).padStart(2,'0'):null;
}
