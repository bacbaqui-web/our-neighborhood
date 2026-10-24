// Representative trees of Korean residential streets, gardens and parks.
// Shapes are art-directed procedural assets, not reconstructions of individual trees.
const make=(id,name,latin,form,description,options)=>Object.freeze({id,name,latin,form,description,
 height:10.5,radius:4.2,bark:0x81715e,leafScale:1,leafAspect:1,seasonal:'autumn',evergreen:false,
 ...options,atlas:`./vegetation/species-v65/${id}.png`});
export const TREE_SPECIES=Object.freeze([
 make('pine','소나무','Pinus densiflora','층층이 펼쳐진 수관','붉은 줄기와 수평 가지 · 사계절 바늘잎',{
  radius:4.7,bark:0x8b6550,leafAspect:1.38,leafScale:1.04,evergreen:true,seasonal:null,
  branch:{children:{0:5,1:3,2:2},angle:{1:73,2:67,3:42},start:{1:.55,2:.30,3:.32},length:{0:29,1:15,2:12,3:7},gnarliness:{0:0,1:.11,2:.09,3:.055}}}),
 make('ginkgo','은행나무','Ginkgo biloba','위로 모이는 부채형 수관','부채꼴 잎 · 가을 노란 단풍',{
  radius:3.3,bark:0x827b65,leafScale:.93,
  branch:{children:{0:6,1:3,2:3},angle:{1:31,2:43,3:30},start:{1:.29,2:.30,3:.28},length:{0:38,1:17,2:10,3:6}}}),
 make('maple','단풍나무','Acer palmatum','낮고 넓은 둥근 수관','가늘게 갈라진 손바닥 잎 · 가을 붉은 단풍',{
  height:9,radius:4.6,bark:0x7c7566,leafScale:.88,
  branch:{children:{0:5,1:3,2:3},angle:{1:60,2:55,3:38},start:{1:.25,2:.24,3:.28},length:{0:24,1:16,2:11,3:8}}}),
 make('cherry','왕벚나무','Flowering cherry','옆으로 넓게 퍼진 수관','봄의 연분홍 꽃 · 여름의 잎 무리',{
  height:10,radius:4.9,bark:0x73635e,leafScale:1.05,seasonal:'spring',
  branch:{children:{0:5,1:3,2:3},angle:{1:61,2:55,3:43},start:{1:.34,2:.26,3:.26},length:{0:29,1:17,2:11,3:7}}}),
 make('zelkova','느티나무','Zelkova serrata','부채처럼 퍼지는 큰 수관','굵은 갈래가지 · 작은 톱니 잎',{
  height:12,radius:5.2,bark:0x898478,leafScale:1.12,
  branch:{children:{0:6,1:3,2:3},angle:{1:44,2:53,3:40},start:{1:.30,2:.22,3:.25},length:{0:30,1:19,2:12,3:8},radius:{0:1.6,1:.80,2:.65,3:.45}}}),
 make('fringe','이팝나무','Chionanthus retusus','촘촘하고 둥근 수관','봄의 하얀 술꽃 · 여름의 타원형 잎',{
  height:9,radius:3.8,bark:0x827c70,leafScale:1.05,seasonal:'spring',
  branch:{children:{0:5,1:3,2:3},angle:{1:45,2:54,3:36},start:{1:.40,2:.28,3:.28},length:{0:31,1:14,2:10,3:6}}}),
 make('magnolia','백목련','Magnolia denudata','위로 솟는 둥근 수관','봄의 큰 흰 꽃 · 넓고 매끈한 잎',{
  height:9.5,radius:3.8,bark:0x8c8879,leafScale:1.1,seasonal:'spring',
  branch:{children:{0:5,1:3,2:2},angle:{1:39,2:41,3:32},start:{1:.28,2:.25,3:.28},length:{0:32,1:17,2:11,3:7}}}),
 make('persimmon','감나무','Diospyros kaki','불규칙하게 퍼지는 수관','넓은 잎과 가을의 주황색 감',{
  height:9,radius:3.9,bark:0x6f6556,leafScale:1.02,
  branch:{children:{0:5,1:3,2:2},angle:{1:50,2:58,3:35},start:{1:.31,2:.24,3:.3},length:{0:28,1:15,2:11,3:7},gnarliness:{0:0,1:.095,2:.1,3:.055}}}),
 make('metasequoia','메타세쿼이아','Metasequoia glyptostroboides','곧은 중심축과 원뿔형 수관','깃털 모양 잎 · 가을 구릿빛 · 겨울 낙엽',{
  height:12,radius:3.0,bark:0x896b58,leafScale:.84,leafAspect:1.22,type:'evergreen',
  branch:{levels:2,children:{0:24,1:4,2:2},angle:{1:83,2:49,3:30},start:{1:.19,2:.22,3:.25},length:{0:48,1:30,2:13,3:6},radius:{0:1.3,1:.40,2:.50,3:.35},force:{direction:{x:0,y:1,z:0},strength:.001},taper:{0:.96,1:.72,2:.98,3:.98}}}),
 make('plane','플라타너스','Platanus × acerifolia','크고 넓은 둥근 수관','큰 손바닥 잎 · 얼룩무늬 밝은 줄기',{
  height:12,radius:5.0,bark:0xa09d84,leafScale:1.14,
  branch:{children:{0:6,1:3,2:3},angle:{1:52,2:48,3:38},start:{1:.35,2:.25,3:.25},length:{0:33,1:18,2:13,3:8},radius:{0:1.7,1:.79,2:.62,3:.45}}})
]);
export const speciesById=id=>TREE_SPECIES.find(s=>s.id===id)||null;
export function speciesVariant(species,variant,season){return species?variant%4+(species.seasonal===season?4:0):variant;}
export function speciesDensity(species,season){
 if(species?.evergreen)return {spring:.9,summer:1,autumn:.94,winter:.86}[season]??1;
 if(species?.seasonal==='spring'&&season==='spring')return .68;
 return {spring:.42,summer:1,autumn:.56,winter:0}[season]??1;
}
