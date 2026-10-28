import {memoTemplate} from '../domestic-test/memo-scene.js?v=151';
import {koreanVehicleCatalog,createKoreanVehicle} from './korean-vehicles.js?v=151';
import {residentVehicleCatalog,createResidentVehicle} from './resident-vehicles.js?v=151';
import {neighborhoodCatalog,createNeighborhoodAsset} from './neighborhood-models.js?v=151';
import {moreCatalog,createMoreAsset} from './more-models.js?v=151';
import * as T from '../domestic-test/vendor/three.module.js';
const rows=[
['낮은 벽돌 담장','담장·출입구',1],['높낮이 벽돌 담장','담장·출입구',1],['돌 마감 대문기둥','담장·출입구',1],['철제 양개 대문','담장·출입구',1],['담장 위 철제 울타리','담장·출입구',1],['콘크리트 옹벽','담장·출입구',0],['출입구 계단','담장·출입구',1],['스테인리스 난간','담장·출입구',0],['주택 캐노피','담장·출입구',1],['대문 기둥 조명','담장·출입구',1],
['콘크리트 전신주','전기·배관',1],['통신함 달린 전신주','전기·배관',0],['처진 전선 묶음','전기·배관',1],['벽 부착 배전함','전기·배관',0],['가스계량기와 배관','전기·배관',1],['벽면 가스배관','전기·배관',1],['빗물 홈통','전기·배관',1],['벽부형 실외기','전기·배관',1],['지상형 실외기','전기·배관',0],['환기 덕트','전기·배관',1],
['방범창','벽면·생활',1],['미닫이 창틀','벽면·생활',1],['반지하 창문','벽면·생활',1],['우편함','벽면·생활',0],['초인종·인터폰','벽면·생활',0],['도로명 표지판','벽면·생활',1],['접이식 빨래건조대','벽면·생활',0],['수도꼭지와 호스','벽면·생활',0],['뚜껑 달린 물통','벽면·생활',1],['플라스틱 의자','벽면·생활',0],
['주차된 생활 자전거','주차·도로',1],['바구니 자전거','주차·도로',0],['자전거 거치대','주차·도로',0],['주차금지 입간판','주차·도로',0],['라바콘','주차·도로',0],['주차 방지 볼라드','주차·도로',0],['주차 바퀴 멈춤턱','주차·도로',0],['골목 반사경','주차·도로',0],['빗물 배수구','주차·도로',0],['원형 맨홀','주차·도로',0],
['묶인 흰 쓰레기봉투','수거·조경',0],['검은 쓰레기봉투 묶음','수거·조경',0],['접어 쌓은 종이상자','수거·조경',0],['재활용 분리수거함','수거·조경',0],['음식물 수거통','수거·조경',0],['테라코타 화분','수거·조경',0],['사각 텃밭 화분','수거·조경',0],['담장 덩굴','수거·조경',1],['골목 관목','수거·조경',1],['목재 평상','수거·조경',0]];
export const catalog=rows.map(([name,category,seen],i)=>({id:i+1,name,category,source:seen?'로드뷰 형태 참고':'골목 보완 제안',file:`alley-${String(i+1).padStart(2,'0')}.glb`})).concat(moreCatalog,neighborhoodCatalog,residentVehicleCatalog);
import {ALLEY_PALETTE as C} from './alley-palette.js?v=151';
export function createAsset(id){const memo=memoTemplate(id);if(memo)return memo;if(id>=213&&id<=215)return createKoreanVehicle(id);if(id===173||id>210)return createResidentVehicle(id);if(id>150)return createNeighborhoodAsset(id);if(id>50)return createMoreAsset(id);const root=new T.Group();root.name=catalog[id-1].name;let count=0;
function mesh(g,k='stone',x=0,y=0,z=0){const m=new T.Mesh(g,new T.MeshStandardMaterial({color:C[k]??k,roughness:.83}));m.position.set(x,y,z);m.name=k+'-'+(++count);m.userData.part=k;root.add(m);return m}
function box(x,y,z,w,h,d,k='stone',bevel=0){return mesh(new T.BoxGeometry(w,h,d),k,x,y,z)}
function cyl(x,y,z,r,h,k='metal',rt=r){return mesh(new T.CylinderGeometry(rt,r,h,r>.15?8:6),k,x,y,z)}
function ball(x,y,z,a,b,c,k){const g=new T.SphereGeometry(1,Math.max(a,b,c)<.12?6:8,Math.max(a,b,c)<.12?3:4);g.scale(a,b,c);return mesh(g,k,x,y,z)}
function rod(a,b,r=.025,k='metal'){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=mesh(new T.CylinderGeometry(r,r,v.length(),4),k,...a);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());m.position.add(new T.Vector3(...b)).multiplyScalar(.5);return m}
function ring(x,y,z,r,t=.014,k='metal'){return mesh(new T.TorusGeometry(r,t,3,r>.15?10:6),k,x,y,z)}
function pipe(points,r=.025,k='metal'){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(4,(points.length-1)*2),r,4,false),k)}
function brickwall(curved=false){for(let j=0;j<6;j++)for(let i=0;i<7;i++){let x=(i-3)*.3+(j%2)*.15;if(curved&&j>3&&Math.abs(x)<.55)continue;box(x,j*.145+.075,0,.285,.13,.25,(i+j)%4===0?'cap':'brick',.008)}for(let i=0;i<7;i++){const x=(i-3)*.3;box(x,curved&&Math.abs(x)<.55?.61:.91,0,.3,.08,.32,'cap')}}
function ac(){box(0,.46,0,.9,.68,.4,'white',.03);box(0,.815,0,.94,.045,.44,'cap');box(-.3,.075,0,.09,.15,.09,'metal');box(.3,.075,0,.09,.15,.09,'metal');ball(-.16,.46,.209,.24,.24,.018,'dark');for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const m=ball(-.16+Math.cos(a)*.09,.46+Math.sin(a)*.09,.23,.11,.045,.012,'metal');m.rotation.z=a+.4}for(const r of [.11,.23])ring(-.16,.46,.26,r,.004,'metal');for(let i=0;i<4;i++){let a=i*Math.PI/2;rod([-.16,.46,.265],[-.16+Math.cos(a)*.23,.46+Math.sin(a)*.23,.265],.004)}for(let i=0;i<6;i++)box(.3,.3+i*.055,.215,.16,.023,.022,'metal',.004);pipe([[.44,.35,0],[.52,.32,0],[.52,.05,-.1]],.024,'cap')}
function bicycle(basket=false){for(const x of [-.5,.5]){ring(x,.33,0,.30,.028,'dark');ring(x,.33,0,.27,.009);for(let i=0;i<6;i++){let a=i*Math.PI/3;rod([x,.33,0],[x+Math.cos(a)*.27,.33+Math.sin(a)*.27,0],.003)}rod([x,.33,-.045],[x,.33,.045],.025)}const a=[-.5,.33,0],b=[-.1,.30,0],c=[-.2,.85,0],d=[.35,.85,0],e=[.5,.33,0];for(const [p,q] of [[a,b],[b,c],[a,c],[c,d],[d,b],[d,e]])rod(p,q,.025,'blue');ball(-.21,.91,0,.14,.035,.08,'dark');rod([.35,.85,0],[.35,1.02,0],.02);pipe([[.35,1.02,-.23],[.40,1.04,-.17],[.35,1.02,.17],[.35,1.02,.23]],.018);ring(-.1,.3,.06,.09,.009);rod([-.1,.3,.06],[-.1,.18,.13],.014);box(-.1,.18,.16,.13,.035,.09,'dark');pipe([[-.49,.28,.05],[-.1,.22,.06],[-.02,.32,.06],[-.48,.37,.05]],.005,'dark');rod([-.08,.34,-.03],[-.2,.03,-.2],.014);if(basket){for(let i=0;i<3;i++){let x=.28+i*.1125;rod([x,.83,-.16],[x,1.10,-.19],.008);rod([x,.83,.16],[x,1.10,.19],.008)}for(const y of [.85,1.1]){rod([.26,y,-.19],[.55,y,-.19],.009);rod([.26,y,.19],[.55,y,.19],.009);rod([.55,y,-.19],[.55,y,.19],.009)}}}
function pot(x=0,z=0,r=.23){cyl(x,.22,z,r,.4,'red',r*1.18);cyl(x,.42,z,r*1.24,.07,'red');cyl(x,.46,z,r*1.08,.015,'soil');for(let i=0;i<5;i++){const a=i*2.4;rod([x,.46,z],[x+Math.cos(a)*r,.8+i*.07,z+Math.sin(a)*r],.014,'green');ball(x+Math.cos(a)*r,.8+i*.07,z+Math.sin(a)*r,.15,.07,.09,'green')}}
function bin(x,k='green',round=false){if(round){cyl(x,.36,0,.25,.65,k,.29);cyl(x,.71,0,.31,.07,'dark')}else{const g=new T.CylinderGeometry(1,.84,.7,4);g.rotateY(Math.PI/4);g.scale(.28,1,.28);mesh(g,k,x,.39,0);box(x,.77,0,.45,.09,.45,'dark',.035)}box(x,.83,0,.14,.035,.055,'metal');for(const z of [-.21,.21])ball(x,.10,z,.065,.065,.035,'dark');box(x,.49,.23,.18,.13,.015,'white')}
switch(id){
case 1:brickwall();break;case 2:brickwall(true);break;
case 3:box(0,.9,0,.45,1.8,.45);for(let j=0;j<9;j++)box(0,.12+j*.19,.235,.46,.16,.055,j%3?'stone':'cap');box(0,1.85,0,.55,.1,.55,'cap');break;
case 4:for(const x of [-.47,.47]){box(x,.85,0,.91,1.7,.075,'metal');box(x,.85,.05,.73,1.42,.03,'dark');for(let j=0;j<8;j++)rod([x-.33,.2+j*.18,.08],[x+.33,.2+j*.18,.08],.012);ring(x,.95,.095,.22,.018);box(x+(x<0?.32:-.32),.9,.1,.035,.18,.05,'cap')}break;
case 5:box(0,.3,0,2,.6,.25,'stone');for(let i=0;i<11;i++)rod([-.9+i*.18,.6,0],[-.9+i*.18,1.3,0],.018);for(const y of [.7,1.2])rod([-1,y,0],[1,y,0],.025);break;
case 6:box(0,.6,0,2,1.2,.3);box(0,1.23,0,2.08,.08,.38,'cap');for(const x of [-.7,0,.7])cyl(x,.08,.18,.035,.14,'dark').rotation.x=Math.PI/2;break;
case 7:for(let i=0;i<4;i++)box(0,(4-i)*.09,i*.28,1.3,(4-i)*.18,.3,'stone');break;
case 8:for(const x of [-.8,0,.8])rod([x,0,0],[x,1.05,0],.027);for(const y of [.4,.7,1.05])rod([-.85,y,0],[.85,y,0],.023);break;
case 9:box(0,1.6,0,1.7,.07,.9,'blue').rotation.x=-.12;for(const x of [-.65,.65]){rod([x,.9,-.35],[x,1.58,.3],.025);rod([x,1.55,-.4],[x,1.55,.4],.025)}break;
case 10:box(0,.1,0,.26,.2,.26);cyl(0,.29,0,.06,.2);ball(0,.52,0,.2,.22,.2,'white');cyl(0,.75,0,.24,.1,'metal',.06);break;
case 11:case 12:cyl(0,2,0,.12,4,'stone',.085);for(const y of [1.2,2.8,3.6]){cyl(0,y,0,.125,.055,'metal');box(0,y,.05,.55,.07,.08,'metal')}for(const x of [-.22,.22]){cyl(x,3.75,0,.06,.2,'white');for(let j=0;j<3;j++)cyl(x,3.69+j*.06,0,.08,.022,'white')}if(id===12){box(0,2.2,.18,.34,.5,.22,'white');pipe([[0,2,.3],[.16,1.7,.22],[.13,.4,0]],.023,'dark')}break;
case 13:for(let i=0;i<3;i++)pipe([[-1.5,1,i*.1],[0,.65,i*.1],[1.5,1,i*.1]],.012,'dark');break;
case 14:box(0,.5,0,.6,.85,.22,'stone');box(0,.5,.13,.53,.75,.045,'white');box(.19,.5,.17,.04,.15,.04,'dark');for(let i=0;i<4;i++)box(0,.24+i*.05,.16,.35,.02,.025,'metal');break;
case 15:box(0,.65,0,.3,.4,.18,'cap');box(0,.75,.1,.2,.1,.025,'white');for(const x of [-.22,.22])pipe([[x,0,0],[x,.5,0],[x,.65,0],[x*.5,.65,0]],.025,'red');ring(.22,.3,.03,.07,.012,'red');break;
case 16:pipe([[-1,.3,0],[.6,.3,0],[.8,.5,0],[.8,1.4,0]],.035,'red');for(const x of [-.8,0,.6])box(x,.3,-.02,.08,.12,.12,'metal');break;
case 17:pipe([[.2,2,0],[.2,1.7,0],[0,1.5,0],[0,.18,0],[.2,.05,.15]],.065,'metal');for(const y of [.4,1.3])cyl(0,y,0,.078,.05);break;
case 18:case 19:ac();if(id===18)for(const x of [-.3,.3]){rod([x,.05,-.3],[x,.05,.2],.025);rod([x,.05,.2],[x,.45,-.3],.02)}break;
case 20:pipe([[0,0,0],[0,.5,0],[.15,.65,0],[.4,.65,0]],.14);cyl(.4,.65,0,.18,.055).rotation.z=Math.PI/2;break;
case 21:case 22:case 23:box(0,.6,0,1.2,.95,.10,'metal');box(0,.6,.065,1.08,.82,.02,'glass');for(const x of [-.53,0,.53])box(x,.6,.1,.035,.85,.04,'white');if(id!==22)for(let i=0;i<9;i++)rod([-.5+i*.125,.2,.18],[-.5+i*.125,1,.18],.013,'dark');if(id===23)box(0,.09,.1,1.3,.18,.3,'stone');break;
case 24:box(0,.4,0,.42,.48,.18,'blue');box(0,.56,.11,.32,.035,.025,'dark');box(0,.35,.11,.14,.075,.01,'white');break;
case 25:box(0,.3,0,.16,.4,.06,'metal');box(0,.4,.04,.10,.13,.015,'glass');ball(0,.2,.05,.025,.025,.015,'white');break;
case 26:box(0,.2,0,.75,.3,.035,'blue');for(let i=0;i<5;i++)box(-.25+i*.125,.22,.024,.07,.015,.005,'white',.002);box(0,.13,.025,.5,.012,.005,'white',.002);break;
case 27:for(const z of [-.35,.35]){rod([-.55,0,z],[.55,1,z],.016);rod([.55,0,z],[-.55,1,z],.016)}for(let i=0;i<8;i++)rod([-.5+i*.14,1,-.4],[-.5+i*.14,1,.4],.01);break;
case 28:pipe([[0,.5,-.1],[0,.5,.1],[0,.4,.16]],.027);rod([-.07,.57,0],[.07,.57,0],.012);for(let i=0;i<3;i++)ring(0,.23,.04+i*.035,.20,.018,'green');break;
case 29:cyl(0,.3,0,.25,.6,'white',.28);cyl(0,.62,0,.30,.07,'cap');box(0,.67,0,.12,.03,.07,'metal');break;
case 30:box(0,.45,0,.45,.07,.45,'blue',.035);box(0,.72,-.2,.45,.5,.065,'blue',.06);for(const x of [-.17,.17])for(const z of [-.17,.17])rod([x,.43,z],[x*1.3,0,z*1.3],.025,'blue');break;
case 31:case 32:bicycle(id===32);break;
case 33:for(let i=0;i<3;i++)pipe([[-.6+i*.5,0,0],[-.6+i*.5,.5,0],[-.35+i*.5,.5,0],[-.35+i*.5,0,0]],.023);break;
case 34:for(const z of [-.25,.25])for(const x of [-.25,.25])rod([x,0,z],[x,.95,0],.022,'yellow');box(0,.65,.1,.6,.5,.05,'yellow');ring(0,.67,.14,.15,.018,'red');rod([-.1,.77,.15],[.1,.57,.15],.015,'red');break;
case 35:box(0,.04,0,.45,.08,.45,'dark');cyl(0,.34,0,.18,.55,'red',.04);cyl(0,.38,0,.122,.1,'white',.098);break;
case 36:cyl(0,.36,0,.07,.72,'metal');ball(0,.73,0,.07,.05,.07,'metal');cyl(0,.58,0,.073,.09,'yellow');break;
case 37:box(0,.065,0,.9,.13,.18,'dark',.035);for(const x of [-.3,.3])box(x,.13,.04,.15,.015,.10,'yellow');break;
case 38:cyl(0,1,0,.045,2,'red');ball(0,1.8,0,.4,.4,.065,'red');ball(0,1.8,.045,.36,.36,.045,'glass');break;
case 39:box(0,.025,0,.8,.05,.45,'metal');for(let i=0;i<12;i++)box(-.35+i*.064,.056,0,.033,.012,.36,'dark',.002);break;
case 40:cyl(0,.025,0,.42,.05,'metal');for(let i=-3;i<=3;i++)box(0,.056,i*.09,Math.sqrt(.15-i*i*.0081)*2,.012,.014,'dark',.002);break;
case 41:case 42:for(let j=0;j<(id===41?1:3);j++){const x=(j-1)*.32;const g=new T.SphereGeometry(1,8,5);const p=g.attributes.position;for(let i=0;i<p.count;i++){let y=p.getY(i),s=1+.06*Math.sin(i*3.1);p.setXYZ(i,p.getX(i)*.25*s,(y+1)*.27,p.getZ(i)*.22*s)}g.computeVertexNormals();mesh(g,id===41?'white':'dark',x,0,0);cyl(x,.56,0,.045,.09,id===41?'white':'dark',.025);rod([x-.06,.59,0],[x+.06,.6,0],.024,id===41?'white':'dark')}break;
case 43:for(let i=0;i<5;i++){const m=box(0,.025+i*.047,0,.65,.04,.48,'wood',.004);m.rotation.y=i*.09;box(0,.052+i*.047,0,.04,.012,.5,'cap',.002)}break;
case 44:for(const [i,k] of ['blue','green','yellow'].entries())bin((i-1)*.5,k);break;
case 45:bin(0,'red',true);break;
case 46:pot();break;
case 47:box(0,.2,0,1,.4,.45,'wood');box(0,.42,0,.92,.025,.37,'soil');for(let i=0;i<5;i++)ball(-.36+i*.18,.56,0,.14,.16,.16,'green');break;
case 48:for(let i=0;i<5;i++){pipe([[-.6+i*.28,0,0],[-.5+i*.28,.5,.02],[-.65+i*.28,1,.01]],.012,'wood');for(let j=0;j<5;j++)ball(-.65+i*.28+(j%2)*.10,.15+j*.19,.02,.13,.07,.05,'green')}break;
case 49:cyl(0,.3,0,.055,.6,'wood');for(let i=0;i<8;i++){const a=i*2.4;ball(Math.cos(a)*.25,.55+(i%3)*.13,Math.sin(a)*.25,.24,.29,.23,'green')}break;
case 50:for(let i=0;i<7;i++)box(0,.43,-.6+i*.2,1.6,.07,.18,'wood');for(const x of [-.65,.65])for(const z of [-.48,.48])box(x,.20,z,.12,.4,.12,'wood');break;
}
root.userData={...catalog[id-1],units:'meters',style:'solid face colors; low-poly silhouettes; separated material parts'};return root;}
export function addLines(root){root.traverse(o=>{if(o.isMesh&&!o.userData.outlineOnly){const c=o.material.color.clone().multiplyScalar(.38);const line=new T.LineSegments(new T.EdgesGeometry(o.geometry,38),new T.LineBasicMaterial({color:c}));o.add(line)}});return root}
