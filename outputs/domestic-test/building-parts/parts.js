import * as T from 'three';
import {facadeTextureCatalog,applyWallTexture} from '../facade-textures.js?v=masonry19';
import {FacadeBatch, facadeStyles, windowCatalog, createWindowAsset, emitAircon} from '../korean-facades.js?v=masonry19';
import {createDetails} from '../site-layout-models/piloti-details.js?v=masonry19';
import {emitHouseDoor} from '../asset-encyclopedia/categories/house/components.js';
import {createGroundFloors} from '../site-layout-models/ground-floor-models.js?v=masonry19';
import {createPiloti} from '../site-layout-models/piloti-models.js';
import {createBoundaryDetails} from '../site-layout-models/boundary-models.js?v=masonry19';
import {createUserRuleModels} from '../site-layout-models/user-rule-models.js';
import {rooftopCatalog,createRooftopAsset} from '../rooftops.js?v=masonry19';
import {basicWindowCatalog,windowAccessoryCatalog,createWindowUnit,createWindowAccessory,createWindowAssembly} from '../window-parts.js?v=windows20';
import {perimeterGardenCatalog,createPerimeterGarden} from '../perimeter-garden.js?v=garden21';
import {courtyardCatalog,createRoadFacingCourtyard} from '../road-facing-courtyard.js?v=yard22';

export const categories=[
 ['walls','외벽','18종 반복 텍스처입니다. 벽돌·석재·타일·미장·콘크리트를 비교할 수 있습니다.'],
 ['windows','기본 창문','창틀과 유리만 있는 8종입니다. 카드를 열면 벽 안쪽 깊이와 앞에 붙일 부품을 바꿀 수 있습니다.'],
 ['window-accessories','창문 부착물','방범창·난간·받침대·차양을 따로 만듭니다. 창문 폭에 맞춰 살 개수와 길이가 바뀝니다.'],
 ['window-assemblies','창문 조합','구멍이 있는 외벽에 창문을 넣고 부착물을 조합한 예시입니다.'],
 ['window-presets','기존 창문 조합','동네에서 사용하던 창문 10종도 남겨 두었습니다.'],
 ['doors','문·현관','문 자체와, 계단·차양을 붙인 현관 묶음입니다.'],
 ['ground','상가·필로티','1층을 만들 때 조합하는 입구·기둥·계단실입니다.'],
 ['boundaries','담장·대문','담장 몸체, 상단 덮개, 철제 난간과 문입니다.'],
 ['gardens','건물 외곽 화단','낮은 턱·흙·식물을 조합합니다. 모서리에서 이어지고 현관과 차량 입구는 비워 둡니다.'],
 ['courtyards','담과 마당','집이 길과 비스듬하면 담과 대문은 길 방향을 따르고, 그 사이를 마당으로 씁니다.'],
 ['roofs','옥상 출입실','옥상에 올리는 계단실·승강기실·해치입니다.'],
 ['services','외벽 설비','벽에 붙이는 실외기와 옆면 배관입니다.']
];
const source={windows:'../window-parts.js',textures:'../facade-textures.js',facade:'../korean-facades.js',details:'../site-layout-models/piloti-details.js',ground:'../site-layout-models/ground-floor-models.js',piloti:'../site-layout-models/piloti-models.js',boundary:'../site-layout-models/boundary-models.js',scene:'../house-plots-test/space-first/app.js',roof:'../rooftops.js',user:'../site-layout-models/user-rule-models.js'};
const rows=[];
source.garden='../perimeter-garden.js';
source.courtyard='../road-facing-courtyard.js';
function add(id,category,name,note,make,sources,tag='기존 부품',view='angle') {rows.push({id,category,name,note,make,sources:sources.map(x=>source[x]),tag,view});}
function box(parent,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.95}));m.position.set(x,y,z);parent.add(m);return m;}
function spec(styleIndex,levels=0){return {inkObjectId:1,points:[[-1.8,-.1],[1.8,-.1],[1.8,.1],[-1.8,.1]],base:0,top:2.8,floor:0,levels,styleIndex,seed:1,frontEdge:2,hasEntry:false,sideServices:true,holes:false,holePoints:[]};}
function wall(recipe){const group=new T.Group();box(group,0,1.4,0,3.6,2.8,.2,recipe.base);group.add(createDetails([{...spec(recipe.style),wallTexture:recipe.id}],()=>0));return group;}
for(const [i,r] of facadeTextureCatalog.entries())add('wall-'+i,'walls',r.name+' 외벽',r.family+' 무늬를 반복해서 입힙니다. 건물 크기가 달라도 무늬 크기는 유지됩니다.',()=>wall(r),['textures','facade','details'],(i<6?'기존 마감 교체':'추가 마감')+' · 텍스처','front');
for(const w of windowCatalog)add(w.id,'window-presets',w.name,'창틀과 유리가 함께 들어갑니다.'+(['guard','basement'].includes(w.id)?' 방범창이 붙습니다.':w.id==='awning'?' 빗물 차양이 붙습니다.':w.id==='bay'?' 옆면이 돌출됩니다.':''),()=>createWindowAsset(w.id),['facade'],'기존 창문 조합',w.id==='bay'||w.id==='guard'||w.id==='awning'?'angle':'front');
for(const w of basicWindowCatalog){
 add('basic-window-'+w.id,'windows',w.name,'창틀과 유리만 있는 기본 부품입니다. 열어서 크기·들어간 깊이·부착물을 조합할 수 있습니다.',()=>createWindowUnit(w.id),['windows','facade'],'기본 창문','front');
 Object.assign(rows.at(-1),{windowConfig:{type:w.id,width:w.width,height:w.height,recess:.14,wall:true,sill:true},compose:createWindowAssembly});
}
for(const a of windowAccessoryCatalog)add('window-accessory-'+a.id,'window-accessories',a.name,a.note,()=>createWindowAccessory(a.id,{type:'living',width:2.6,height:1.65}),['windows'],'별도 부착물');
for(const [id,name,note,config] of [
 ['recessed-room','안쪽에 들어간 방 창문','벽에 실제 구멍을 내고 창틀을 14cm 안쪽에 넣었습니다.',{type:'room',recess:.14,wall:true,sill:true}],
 ['photo-living','돌출 난간이 있는 거실창','첨부 사진을 참고했습니다. 큰 창문 앞에 금속 난간과 받침대를 따로 붙입니다.',{type:'living',recess:.14,wall:true,guard:'projecting-railing',rack:true,sill:true}],
 ['guarded-small','방범창과 차양을 붙인 작은 창','작은 창틀에 돌출 방범창과 빗물 차양을 조합합니다.',{type:'small',recess:.12,wall:true,guard:'box-guard',awning:true,sill:true}],
 ]){
 add('window-assembly-'+id,'window-assemblies',name,note,()=>createWindowAssembly(config),['windows','facade','textures'],'조합 예시');
 Object.assign(rows.at(-1),{windowConfig:config,compose:createWindowAssembly});
}
function oldDoor(levels){const batch=new FacadeBatch();emitHouseDoor(batch.writer(),levels>2?'original-glass-door':'original-steel-door',{u:0,g:0});return batch.finish();}
add('original-steel-door','doors','기본 주택 철문','원본 주택에서 쓰는 철문입니다. 문틀과 손잡이를 포함하며 문턱·초인종은 배치할 때 따로 붙입니다.',()=>oldDoor(1),['details'],'원본 현관','front');
add('original-glass-door','doors','기본 공동현관','원본 다세대 건물에서 쓰는 유리 현관문입니다.',()=>oldDoor(3),['details'],'원본 현관','front');
function ground(kind){const gate=kind.startsWith('gate'),shop=kind.startsWith('shop');const L=shop?7.4:gate?6:4.8,w=shop?6.2:2.3,depth=kind==='lobby-steps'?1.6:kind==='lobby-side'?1.6:.65;
 const p={id:1,kind,origin:[-L/2,0],u:[1,0],n:[0,1],length:L,opening:[kind==='lobby-side'?.6:(L-w)/2,w,depth],skipWindows:true};
 const group=createGroundFloors([p]);group.rotation.y=Math.PI;return group;
}
for(const [id,title,note] of [
 ['lobby-center','가운데 현관과 차양','공동현관문에 차양과 초인종을 붙인 구성입니다.'],
 ['lobby-side','옆으로 물린 현관','같은 공동현관문을 옆쪽·안쪽에 놓는 구성입니다. 새로운 문 모양은 아닙니다.'],
 ['lobby-steps','계단식 현관','문 앞에 세 단의 계단과 차양이 붙습니다.']
])add(id,'doors',title,note,()=>ground(id),['ground'],'현관 구성');
for(const [id,title,note] of [
 ['shop-single','통유리 점포','긴 유리창, 출입문 손잡이, 간판과 바닥이 한 묶음입니다.'],
 ['shop-pair','두 점포와 가운데 현관','두 가게 사이에 건물 공용 현관이 들어갑니다.'],
 ['shop-shutter','셔터와 점포','한쪽은 닫힌 셔터, 다른 쪽은 유리 점포입니다.']
])add(id,'ground',title,note,()=>ground(id),['ground'],'1층 구성');
// Representative local dimensions are used only to expose the existing part generator.
// No new pillars or door shapes are added here.
for(const [kind,title,core] of [[0,'뒤쪽 계단실 필로티',[2.8,4,2.8,2.6]],[1,'옆쪽 계단실 필로티',[.5,1.5,2.8,4.1]],[2,'가운데 계단실 필로티',[2.8,2.5,2.8,3.6]]]){
 add('piloti-'+kind,'ground',title,'기둥·보호띠·계단실·현관·천장등입니다. 상층 건물과 자동차는 제외했습니다.',()=>{const p={kind,origin:[0,0],u:[1,0],n:[0,1],core,columns:[[.3,.3],[8.3,.3],[.3,6.7],[8.3,6.7]],bays:[{point:[1.8,3]},{point:[6.6,3]}]};const g=createPiloti([p]);g.rotation.y=Math.PI;return g;},['piloti'],'1층 구성');
}
add('basement-ramp','ground','지하주차장 진입로','경사 바닥·옆벽·입구 보·배수구를 만드는 현재 테스트의 진입로입니다.',()=>{const g=createUserRuleModels({ramps:[{origin:[0,0],u:[1,0],n:[0,1],width:3.4,depth:7,landing:2,drop:1.8}]});g.rotation.y=Math.PI;return g;},['user'],'진입로 구성');
const empty=()=>({scene:{walls:[]},gates:[],garages:[],pots:[],drains:[],poles:[],poleLinks:[]});
function boundary(styleIndex,kind='solid'){
 const data=empty(),height=kind==='rail'?.65:1.6,L=3.6,s=facadeStyles[styleIndex],g=new T.Group();
 data.scene.walls.push({owner:1,a:[-L/2,0],b:[L/2,0],height,kind});
 // The masonry body uses the same finish as its owning house; rails remain geometry.
 applyWallTexture(box(g,0,.035+height/2,0,L,height,.18,s.wall),s.textureId);box(g,0,.035+height+.0275,0,L,.055,.18,s.frame);
 g.add(createBoundaryDetails(data,{buildings:{1:{styleIndex}}}));return g;
}
for(const [id,name,index,kind] of [['brick-wall','벽돌 담장',0,'solid'],['stone-wall','석재 담장',3,'solid'],['render-wall','미장색 담장',5,'solid'],['rail-wall','낮은 담과 철제 난간',2,'rail']])add(id,'boundaries',name,'담장 벽면은 집 외벽과 같은 텍스처입니다. 덮개와 난간은 입체 모델입니다.',()=>boundary(index,kind),['boundary','scene','facade'],'담장 구성');
for(const [id,title] of [['gate-solid','높은 담장과 닫힌 대문'],['gate-rail','낮은 담장과 닫힌 대문']])add(id,'boundaries',title,'담과 문기둥에는 외벽 텍스처를 쓰고, 대문과 현관은 입체 모델로 만듭니다.',()=>ground(id),['ground'],'대문 구성');
add('open-gate','boundaries','안쪽으로 열린 철제 대문','문기둥 두 개와 안쪽으로 열린 양쪽 문짝입니다.',()=>{const d=empty();d.gates=[{owner:1,a:[-.8,0],b:[.8,0],posts:[[-.95,0],[.95,0]],inward:[0,-1],height:1.7}];return createBoundaryDetails(d,{buildings:{1:{styleIndex:0}}});},['boundary'],'대문 구성');
add('parking-shutter','boundaries','반쯤 열린 주차장 셔터','주차 공간 입구에 놓는 셔터와 상자·옆 기둥입니다.',()=>{const d=empty();d.garages=[{owner:1,a:[-1.5,0],b:[1.5,0],height:2.4,kind:'partly-open-shutter'}];return createBoundaryDetails(d,{buildings:{1:{styleIndex:3}}});},['boundary'],'셔터 구성');
for(const g of perimeterGardenCatalog)add('garden-'+g.id,'gardens',g.name,g.note+' 도감 예시이며 동네 전체 배치는 아직 적용하지 않았습니다.',()=>createPerimeterGarden(g.id),['garden','textures'],g.id.startsWith('building')?'건물 배치 예시':'화단 구성','garden');
for(const c of courtyardCatalog){
 add('courtyard-'+c.id,'courtyards',c.name,c.note+' 담은 집 외벽과 같은 마감입니다. 현재는 도감 시험이며 지도 자동 배치에는 아직 연결하지 않았습니다.',()=>createRoadFacingCourtyard(c.id),['courtyard','textures'],'담·대문·마당 조합','courtyard');
 Object.assign(rows.at(-1),{courtyard:true,compose:options=>createRoadFacingCourtyard(c.id,options)});
}
for(const r of rooftopCatalog)add('roof-'+r.id,'roofs',r.name,'벽면은 집 외벽과 같은 텍스처입니다. 문·지붕·환기창은 입체 모델입니다.',()=>createRooftopAsset(r.id),['roof'],'옥상 부품');
add('aircon','services','실외기와 받침대','실외기 본체·팬·배관·받침대가 한 묶음입니다.',()=>{const b=new FacadeBatch();emitAircon(b.writer(),0,0);return b.finish();},['facade'],'외벽 설비');
add('side-pipes','services','옆면 배관과 계량기','수직 배관, 가로 배관, 계량기와 고정쇠입니다.',()=>createUserRuleModels({services:[{origin:[0,0],u:[1,0],n:[0,1],top:3,length:2.5,pipeX:.3}]}),['user'],'외벽 설비');
export const parts=rows;
