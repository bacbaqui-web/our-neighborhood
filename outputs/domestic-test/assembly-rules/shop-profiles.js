// Placement defaults belong to assembly-rules. Browser edits are proposals, not town overrides.
const profile=(industry,defaults,ranges)=>({industry,defaults,ranges,floors:['ground'],roads:['primary','secondary','local'],multiFloor:false,reviewed:false});
export const shopProfiles={
 'convenience-local':profile('편의점',{frontDepth:5.5},{frontDepth:[0,8]}),
 'pharmacy-local':profile('약국',{width:6.4,height:3,depth:4,frontDepth:1.5},{width:[4.8,9],height:[2.7,3.3],depth:[3.5,5],frontDepth:[0,8]}),
 'bakery-local':profile('빵집',{width:3.2,height:3,depth:5,frontDepth:1.5},{width:[3.2,9],height:[2.7,3.3],depth:[4.5,6],frontDepth:[0,8]}),
 'bakery-blue':profile('빵집',{width:7.6,height:3,depth:5,frontDepth:1.5},{width:[6.4,9],height:[2.7,3.3],depth:[4.5,6],frontDepth:[0,8]}),
 'salon-local':profile('미용실',{width:3.4,height:3,depth:6.2,frontDepth:1.5},{width:[3.4,5.4],height:[2.8,3.3],depth:[5.4,7.2],frontDepth:[0,3]})
};
export const dimensionLabels={width:'점포 폭',height:'실내 높이',depth:'점포 깊이',frontDepth:'앞 공간 깊이'};
export function validateDimensions(pack,value){const p=shopProfiles[pack];if(!p)throw Error('지원하지 않는 상가입니다.');for(const [k,[min,max]]of Object.entries(p.ranges))if(!Number.isFinite(value?.[k])||value[k]<min||value[k]>max)throw Error(`${dimensionLabels[k]}는 ${min}~${max}m로 입력해 주세요.`);if(Object.keys(value).some(k=>!p.ranges[k]))throw Error('지원하지 않는 크기 항목입니다.');return {...value};}
