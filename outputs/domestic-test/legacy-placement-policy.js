// Explicit rules for reusable legacy props that still appear in the scene.
const ground={auto:true,support:'ground',minScale:1,maxPerOwner:2,clearance:.12,entryDistanceMin:1.2,orientation:'front-away-from-wall',zones:['garden','rear','service','laundry','workshop','narrow','slope']};
const rules={
 41:{label:'도로 접근이 가능한 소량 배출 지점',zones:['*'],roles:['pickup-primary','pickup-bag','pickup-cardboard'],maxPerOwner:2,orientation:'existing'},
 112:{label:'도로 접근이 가능한 재활용 배출 지점',zones:['*'],roles:['pickup-primary','pickup-bag','pickup-cardboard'],maxPerOwner:2,orientation:'existing'},
 129:{label:'주택 마당 가장자리 장독대',zones:['garden','rear'],wallGapMax:.65,maxPerOwner:2},
 153:{label:'담장 가장자리를 따라 설치한 덩굴 격자',zones:['garden','rear','narrow'],wallGapMax:.45,maxPerOwner:1},
 154:{label:'통행로 밖 마당에 뿌리내린 나무',zones:['garden','rear'],minArea:14,maxPerOwner:1,orientation:'existing',clearance:.3},
 155:{label:'건물·담장 가장자리 대나무',zones:['garden','rear','narrow','slope'],wallGapMax:.8,maxPerOwner:3,orientation:'existing'},
 156:{label:'세탁 공간의 빨래건조대',zones:['laundry','rear'],maxPerOwner:1,frontClearance:.65,orientation:'existing'},
 158:{label:'세탁·관리 공간 벽 옆 청소도구함',zones:['laundry','rear','service'],wallGapMax:.55,maxPerOwner:1,frontClearance:.65},
 159:{label:'세탁 공간의 이불 건조봉',zones:['laundry','rear'],maxPerOwner:1,frontClearance:.65,orientation:'existing'},
 165:{label:'작업·수거 공간의 폐목재',zones:['workshop','service'],wallGapMax:.65,maxPerOwner:1,frontClearance:.55},
 180:{label:'작업·보관 공간의 적재 팔레트',zones:['workshop','service'],maxPerOwner:1,frontClearance:.7},
 188:{label:'벽 옆 급수·세탁 물통',zones:['laundry','service','rear','workshop'],wallGapMax:.6,maxPerOwner:1,frontClearance:.6},
 125:{label:'벽 밑 틈새 식재',wallGapMax:.5,maxPerOwner:3,orientation:'existing'},
 197:{label:'벽 밑 잡초와 돌',wallGapMax:.5,maxPerOwner:3,orientation:'existing'},
 200:{label:'마당 경계의 생울타리',zones:['garden','rear','slope'],wallGapMax:.8,maxPerOwner:3,orientation:'existing'},
};
export const LEGACY_PLACEMENT_RULES=Object.fromEntries(Object.entries(rules).map(([id,r])=>[id,{...ground,...r,assetId:'legacy-'+id,profile:'legacy-'+id}]));
export function getLegacyPlacementRule(id){return LEGACY_PLACEMENT_RULES[id]||{...ground,auto:false,label:'설치 용도 확인 전 보류',assetId:'legacy-'+id,profile:'legacy-deferred'};}
