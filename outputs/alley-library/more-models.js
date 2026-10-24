import * as T from '../domestic-test/vendor/three.module.js';
const rows=[["투공 벽돌 담장", "담장·출입구", 1], ["거친 돌쌓기 담장", "담장·출입구", 1], ["격자 블록 담장", "담장·출입구", 1], ["철창 얹은 벽돌 담장", "담장·출입구", 1], ["녹색 망 울타리", "담장·출입구", 1], ["박공 석재 대문틀", "담장·출입구", 1], ["세로살 보행자 대문", "담장·출입구", 1], ["가로 루버 대문", "담장·출입구", 1], ["아치 장식 철대문", "담장·출입구", 1], ["접이식 격자문", "담장·출입구", 1], ["타일 현관 디딤대", "담장·출입구", 0], ["손잡이 있는 현관 계단", "담장·출입구", 0], ["반지하 진입 계단", "담장·출입구", 0], ["문턱용 고무 경사판", "담장·출입구", 0], ["출입구 신발 털이판", "담장·출입구", 0], ["돌출 새장형 방범창", "벽면·생활", 1], ["마름모 방범창", "벽면·생활", 1], ["돌출 창가 화분대", "벽면·생활", 1], ["반지하 창 빗물 가림판", "벽면·생활", 1], ["격자 환기창", "벽면·생활", 1], ["곡면 폴리카보네이트 차양", "벽면·생활", 0], ["골강판 처마", "벽면·생활", 0], ["접이식 줄무늬 어닝", "벽면·생활", 0], ["삼각 브래킷 창 차양", "벽면·생활", 0], ["투명 현관 방풍막", "벽면·생활", 0], ["삼중 수평 가스배관", "전기·배관", 1], ["다세대 가스계량기 네 개", "전기·배관", 1], ["가스 밸브 보호함", "전기·배관", 1], ["외벽 굴곡 배관", "전기·배관", 1], ["수직 가스 분기관", "전기·배관", 1], ["사각 집수통 홈통", "전기·배관", 1], ["이중 빗물관", "전기·배관", 1], ["배수관 지상 배출구", "전기·배관", 1], ["벽체 오수 청소구", "전기·배관", 1], ["세면 수전 외부 싱크", "전기·배관", 1], ["전기계량기 세 개", "전기·배관", 1], ["노출 전선관 접속함", "전기·배관", 1], ["통신 단자함과 선 고리", "전기·배관", 1], ["전신주 케이블 여장 고리", "전기·배관", 1], ["벽면 방수 콘센트", "전기·배관", 1], ["이층 적층 실외기", "전기·배관", 0], ["철망 보호 실외기", "전기·배관", 0], ["세로형 대형 실외기", "전기·배관", 0], ["원형 벽 환기팬", "전기·배관", 0], ["회전식 옥상 환기구", "전기·배관", 0], ["적층 음료 운반상자", "보관·작업", 0], ["벽가 청소도구 걸이", "보관·작업", 0], ["접이식 알루미늄 사다리", "보관·작업", 0], ["택배 보관 선반", "보관·작업", 0], ["공구함과 작업 의자", "보관·작업", 0], ["접이식 소형 자전거", "주차·도로", 0], ["어린이 보조바퀴 자전거", "주차·도로", 0], ["짐받이 운반 자전거", "주차·도로", 0], ["배달 상자 스쿠터", "주차·도로", 0], ["발판형 킥보드", "주차·도로", 0], ["체인 연결 주차 기둥", "주차·도로", 0], ["물통형 주차 차단봉", "주차·도로", 0], ["고리형 잠금 주차대", "주차·도로", 0], ["고무 케이블 보호턱", "주차·도로", 0], ["노면 배수 트렌치", "주차·도로", 0], ["입 벌린 마대자루", "수거·조경", 0], ["투명 재활용 봉투", "수거·조경", 0], ["그물망 재활용 거치대", "수거·조경", 0], ["펼친 택배 상자", "수거·조경", 0], ["접은 우산과 폐목재", "수거·조경", 0], ["스티로폼 텃밭 상자", "수거·조경", 0], ["항아리 화분", "수거·조경", 0], ["난간 걸이 화분", "수거·조경", 0], ["화분 삼단 진열대", "수거·조경", 0], ["벽돌 테두리 화단", "수거·조경", 0], ["담장 너머 침엽수", "수거·조경", 1], ["줄기 갈라진 정원수", "수거·조경", 1], ["벽을 타는 덩굴 격자", "수거·조경", 1], ["채소 지지대 화분", "수거·조경", 1], ["틈새 잡초와 돌", "수거·조경", 1], ["등받이 목재 벤치", "벽면·생활", 0], ["접힌 파라솔 받침", "벽면·생활", 0], ["빨래집게 원형 건조대", "벽면·생활", 0], ["장독대 항아리", "벽면·생활", 0], ["말린 호스 릴", "벽면·생활", 0], ["손수레", "보관·작업", 0], ["일륜 운반차", "보관·작업", 0], ["쌓인 시멘트 포대", "보관·작업", 0], ["벽돌 적치 더미", "보관·작업", 0], ["접힌 녹색 방수포", "보관·작업", 0], ["전신주 보안등 브래킷", "전기·배관", 0], ["외벽 둥근 현관등", "전기·배관", 0], ["우편함 세대별 네 칸", "전기·배관", 0], ["CCTV와 벽 브래킷", "전기·배관", 0], ["소화기 보호함", "전기·배관", 0], ["원형 돌출 간판", "벽면·생활", 0], ["메뉴 입간판", "벽면·생활", 0], ["철제 셔터 패널", "벽면·생활", 0], ["유리 출입문과 손잡이", "벽면·생활", 0], ["창가 선반과 바구니", "벽면·생활", 0], ["물탱크와 철제 받침", "옥상·상부", 0], ["옥상 안전난간", "옥상·상부", 0], ["위성 접시 안테나", "옥상·상부", 0], ["옥상 빨랫줄 기둥", "옥상·상부", 0], ["기와 얹은 담장 지붕", "옥상·상부", 0]];
export const moreCatalog=rows.map(([name,category,seen],i)=>({id:i+51,name,category,source:seen?'관찰 요소 확장':'골목 보완 제안',file:`alley-${i+51}.glb`,batch:'추가 100종'}));
const C={stone:0xaaa69b,brick:0x927569,cap:0xc3b9a4,metal:0x687775,dark:0x394747,glass:0x70888b,white:0xdad9cd,blue:0x6a9298,red:0xaf7768,yellow:0xcbaf70,wood:0xa18a6a,green:0x77886b,soil:0x756653};
export function createMoreAsset(id){const root=new T.Group();root.name=moreCatalog[id-51].name;let count=0;
function mesh(g,k='stone',x=0,y=0,z=0){const m=new T.Mesh(g,new T.MeshStandardMaterial({color:C[k]??k,roughness:k==='glass'?.3:.83,transparent:k==='glass',opacity:k==='glass'?.55:1,depthWrite:k!=='glass'}));m.position.set(x,y,z);m.name=k+'-'+(++count);m.userData.part=k;root.add(m);return m}
function box(x,y,z,w,h,d,k='stone',b=.015){b=Math.min(b,w/5,h/5,d/5);const s=new T.Shape();s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+b);s.lineTo(w/2,h/2-b);s.quadraticCurveTo(w/2,h/2,w/2-b,h/2);s.lineTo(-w/2+b,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-b);s.lineTo(-w/2,-h/2+b);s.quadraticCurveTo(-w/2,-h/2,-w/2+b,-h/2);const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b/2,bevelSegments:2,steps:1,curveSegments:3});g.translate(0,0,-d/2+b);return mesh(g,k,x,y,z)}
function cyl(x,y,z,r,h,k='metal',rt=r){return mesh(new T.CylinderGeometry(rt,r,h,16),k,x,y,z)}
function ball(x,y,z,a,b,c,k){const g=new T.SphereGeometry(1,12,8);g.scale(a,b,c);return mesh(g,k,x,y,z)}
function rod(a,b,r=.025,k='metal'){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=mesh(new T.CylinderGeometry(r,r,v.length(),10),k,...a);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());m.position.add(new T.Vector3(...b)).multiplyScalar(.5);return m}
function ring(x,y,z,r,t=.014,k='metal'){return mesh(new T.TorusGeometry(r,t,6,32),k,x,y,z)}
function pipe(points,r=.025,k='metal'){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,r,8,false),k)}
function brickwall(curved=false){for(let j=0;j<6;j++)for(let i=0;i<7;i++){let x=(i-3)*.3+(j%2)*.15;if(curved&&j>3&&Math.abs(x)<.55)continue;box(x,j*.145+.075,0,.285,.13,.25,(i+j)%4===0?'cap':'brick',.008)}for(let i=0;i<7;i++){const x=(i-3)*.3;box(x,curved&&Math.abs(x)<.55?.61:.91,0,.3,.08,.32,'cap')}}
function ac(){box(0,.46,0,.9,.68,.4,'white',.03);box(0,.815,0,.94,.045,.44,'cap');cyl(-.3,.075,0,.045,.15);cyl(.3,.075,0,.045,.15);ball(-.16,.46,.209,.24,.24,.018,'dark');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const m=ball(-.16+Math.cos(a)*.09,.46+Math.sin(a)*.09,.23,.11,.045,.012,'metal');m.rotation.z=a+.4}for(let r=.07;r<.25;r+=.05)ring(-.16,.46,.26,r,.004,'metal');for(let i=0;i<8;i++){let a=i*Math.PI/4;rod([-.16,.46,.265],[-.16+Math.cos(a)*.23,.46+Math.sin(a)*.23,.265],.004)}for(let i=0;i<6;i++)box(.3,.3+i*.055,.215,.16,.023,.022,'metal',.004);pipe([[.44,.35,0],[.52,.32,0],[.52,.05,-.1]],.024,'cap')}
function bicycle(basket=false){for(const x of [-.5,.5]){ring(x,.33,0,.30,.028,'dark');ring(x,.33,0,.27,.009);for(let i=0;i<12;i++){let a=i*Math.PI/6;rod([x,.33,0],[x+Math.cos(a)*.27,.33+Math.sin(a)*.27,0],.003)}rod([x,.33,-.045],[x,.33,.045],.025)}const a=[-.5,.33,0],b=[-.1,.30,0],c=[-.2,.85,0],d=[.35,.85,0],e=[.5,.33,0];for(const [p,q] of [[a,b],[b,c],[a,c],[c,d],[d,b],[d,e]])rod(p,q,.025,'blue');ball(-.21,.91,0,.14,.035,.08,'dark');rod([.35,.85,0],[.35,1.02,0],.02);pipe([[.35,1.02,-.23],[.40,1.04,-.17],[.35,1.02,.17],[.35,1.02,.23]],.018);ring(-.1,.3,.06,.09,.009);rod([-.1,.3,.06],[-.1,.18,.13],.014);box(-.1,.18,.16,.13,.035,.09,'dark');pipe([[-.49,.28,.05],[-.1,.22,.06],[-.02,.32,.06],[-.48,.37,.05]],.005,'dark');rod([-.08,.34,-.03],[-.2,.03,-.2],.014);if(basket){for(let i=0;i<6;i++){let x=.28+i*.045;rod([x,.83,-.16],[x,1.10,-.19],.008);rod([x,.83,.16],[x,1.10,.19],.008)}for(const y of [.85,.97,1.1]){rod([.26,y,-.19],[.55,y,-.19],.009);rod([.26,y,.19],[.55,y,.19],.009);rod([.55,y,-.19],[.55,y,.19],.009)}}}
function pot(x=0,z=0,r=.23){cyl(x,.22,z,r,.4,'red',r*1.18);cyl(x,.42,z,r*1.24,.07,'red');cyl(x,.46,z,r*1.08,.015,'soil');for(let i=0;i<5;i++){const a=i*2.4;rod([x,.46,z],[x+Math.cos(a)*r,.8+i*.07,z+Math.sin(a)*r],.014,'green');ball(x+Math.cos(a)*r,.8+i*.07,z+Math.sin(a)*r,.15,.07,.09,'green')}}
function bin(x,k='green',round=false){if(round){cyl(x,.36,0,.25,.65,k,.29);cyl(x,.71,0,.31,.07,'dark')}else{const g=new T.CylinderGeometry(1,.84,.7,4);g.rotateY(Math.PI/4);g.scale(.28,1,.28);mesh(g,k,x,.39,0);box(x,.77,0,.45,.09,.45,'dark',.035)}box(x,.83,0,.14,.035,.055,'metal');for(const z of [-.21,.21])ball(x,.10,z,.065,.065,.035,'dark');box(x,.49,.23,.18,.13,.015,'white')}

const f=Math.floor((id-51)/5),v=(id-51)%5;
function slats(w,h,z=0,k='metal',n=9){for(let i=0;i<n;i++)box(-w/2+i*w/(n-1),h/2,z,.035,h,.045,k);for(const y of [.08,h-.08])box(0,y,z,w+.05,.04,.05,k)}
function frame(w,h,z=0,k='metal'){for(const x of [-w/2,w/2])box(x,h/2,z,.055,h,.07,k);for(const y of [0,h])box(0,y,z,w,.055,.07,k)}
function hinge(x,y,z){cyl(x,y,z,.032,.12,'cap')}
function leaf(x,y,z,s=.14){ball(x,y,z,s,s*.46,s*.65,'green')}
function slabWall(w=1.8,h=1){box(0,h/2,0,w,h,.2,'stone');box(0,h+.035,0,w+.12,.07,.3,'cap')}
function wheel(x,y,z,r=.2){ring(x,y,z,r,.035,'dark');ring(x,y,z,r*.72,.012);for(let j=0;j<8;j++){let a=j*Math.PI/4;rod([x,y,z],[x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,z],.008)}}
function grate(w,h,z=0){frame(w,h,z);for(let i=1;i<8;i++)box(-w/2+i*w/8,h/2,z,.018,h,.025,'metal')}
function crate(x,y,z){for(let j=0;j<4;j++){box(x,y+.06+j*.075,z-.2,.5,.035,.025,'blue');box(x,y+.06+j*.075,z+.2,.5,.035,.025,'blue');box(x-.24,y+.06+j*.075,z,.025,.035,.4,'blue');box(x+.24,y+.06+j*.075,z,.025,.035,.4,'blue')}for(const dx of [-.24,.24])for(const dz of [-.2,.2])box(x+dx,y+.17,z+dz,.035,.34,.035,'blue');box(x,y+.02,z,.5,.035,.4,'blue')}
switch(f){
case 0:
 if(v===0){brickwall();for(let i=0;i<7;i++)box(-.9+i*.3,1.04,0,.12,.16,.25,'brick');box(0,1.17,0,2.2,.1,.33,'cap')}
 if(v===1){for(let j=0;j<5;j++)for(let i=0;i<5;i++)box(-.8+i*.4+(j%2)*.10,.13+j*.24,0,.38,.22,.32,(i+j)%3?'stone':'cap',.025);box(0,1.26,0,2.2,.09,.4,'cap')}
 if(v===2){for(let j=0;j<4;j++)for(let i=0;i<5;i++){const x=-.8+i*.4,y=.18+j*.36;box(x,y-.14,0,.38,.07,.20);box(x,y+.14,0,.38,.07,.20);for(const dx of [-.15,.15])box(x+dx,y,0,.07,.22,.20)}box(0,1.49,0,2.1,.08,.26,'cap')}
 if(v===3){brickwall();for(let i=0;i<9;i++){const x=-1+i*.25;rod([x,.93,0],[x,1.6,0],.015,'dark');ball(x,1.61,0,.025,.055,.025,'cap')}rod([-1,1.4,0],[1,1.4,0],.018)}
 if(v===4){for(const x of [-1,1])cyl(x,.65,0,.03,1.3);for(let j=0;j<10;j++)rod([-1,.07+j*.13,0],[1,.07+j*.13,0],.008,'green');for(let i=0;i<24;i++)rod([-1+i*.087,0,0],[-1+i*.087,1.3,0],.007,'green');pipe([[-1,1.3,0],[0,1.18,0],[1,1.3,0]],.016,'green')}break;
case 1:
 if(v===0){for(const x of [-.88,.88])for(let j=0;j<10;j++)box(x,.1+j*.2,0,.4,.18,.42,'stone');rod([-.99,2.06,0],[0,2.4,0],.13,'cap');rod([0,2.4,0],[.99,2.06,0],.13,'cap');slats(1.3,1.8,0,'dark',12);ring(0,1,.04,.25,.018,'cap')}
 if(v===1){frame(.85,1.75);slats(.78,1.7,0,'dark',8);for(const y of [.2,1.5])hinge(-.46,y,0);box(.3,.9,.07,.04,.17,.05,'cap')}
 if(v===2){frame(1.7,1.65);for(let i=0;i<12;i++){let m=box(0,.08+i*.135,0,1.65,.10,.06,'wood');m.rotation.x=.25}box(0,.84,.08,.04,.2,.07,'dark')}
 if(v===3){slats(1.65,1.6,0,'dark',11);pipe([[-.83,1.6,0],[-.5,1.9,0],[0,2.02,0],[.5,1.9,0],[.83,1.6,0]],.035,'metal');for(const x of [-.4,.4]){ring(x,.85,.06,.24,.019,'cap');ring(x,1.3,.06,.12,.014,'cap')}}
 if(v===4){for(let i=0;i<7;i++){let x=-.9+i*.3;rod([x,0,0],[x+.3,1.7,0],.018);rod([x+.3,0,.03],[x,1.7,.03],.018)}for(const y of [.03,1.67])box(0,y,0,2,.04,.06,'dark');for(const x of [-.9,.9])wheel(x,.05,0,.045)}break;
case 2:
 if(v===0){for(let j=0;j<3;j++)for(let i=0;i<5;i++)box(-.56+i*.28,.08,-.28+j*.28,.27,.16,.27,'cap');box(0,.17,0,1.5,.025,.86,'stone')}
 if(v===1){for(let i=0;i<4;i++)box(0,.1*(4-i),i*.28,1.1,.2*(4-i),.29);for(const x of [-.56,.56]){rod([x,.2,.85],[x,1.5,0],.025);rod([x,0,.85],[x,.85,.85],.025);rod([x,.8,0],[x,1.5,0],.025)}}
 if(v===2){for(let i=0;i<5;i++)box(0,.1*(5-i),i*.25,.9,.2*(5-i),.26);for(const x of [-.57,.57]){box(x,.6,.5,.16,1.2,1.4);rod([x,1.4,-.15],[x,1.4,1.15],.028)}}
 if(v===3){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.5,0,-.3,.5,0,-.3,.5,.18,-.3,-.5,0,-.3,.5,.18,-.3,-.5,.18,-.3,-.5,.18,-.3,.5,.18,-.3,.5,0,.3,-.5,.18,-.3,.5,0,.3,-.5,0,.3, -.5,0,-.3,-.5,.18,-.3,-.5,0,.3, .5,0,-.3,.5,0,.3,.5,.18,-.3, -.5,0,-.3,-.5,0,.3,.5,0,.3, -.5,0,-.3,.5,0,.3,.5,0,-.3],3));g.computeVertexNormals();mesh(g,'dark');for(let i=0;i<7;i++)box(0,.18-i*.025,-.29+i*.085,.98,.009,.012,'metal',.002)}
 if(v===4){box(0,.035,0,.8,.07,.5,'dark');for(let i=0;i<14;i++)box(-.36+i*.055,.078,0,.016,.02,.44,'cap',.003)}break;
case 3:
 frame(1.1,.85,-.08);box(0,.425,-.105,1.05,.80,.02,'glass');
 if(v===0){for(let i=0;i<9;i++){let x=-.52+i*.13;pipe([[x,0,0],[x,.08,.23],[x,.65,.23],[x,.85,0]],.014,'dark')}for(const y of [.1,.65])rod([-.55,y,.23],[.55,y,.23],.02,'dark')}
 if(v===1){for(let i=-3;i<=3;i++){let x=i*.14;rod([x-.15,0,.03],[x+.3,.85,.03],.012,'dark');rod([x+.3,0,.045],[x-.15,.85,.045],.012,'dark')}}
 if(v===2){for(const x of [-.5,.5])rod([x,.05,0],[x,.05,.38],.025);box(0,.04,.23,1.15,.05,.4,'metal');for(let i=0;i<3;i++)pot(-.36+i*.36,.24,.12)}
 if(v===3){box(0,.95,.18,1.25,.04,.65,'blue').rotation.x=.22;for(const x of [-.52,.52])rod([x,.6,-.08],[x,.94,.4],.018);grate(1.05,.8,.05)}
 if(v===4){for(let j=0;j<6;j++)box(0,.09+j*.135,.04,1.05,.07,.09,'metal').rotation.x=.45}break;
case 4:
 if(v===0){for(let i=0;i<9;i++){let z=-.35+i*.1,y=1.1+Math.sqrt(Math.max(0,1-(z+.35)**2))*.3;box(0,y,z,1.6,.025,.105,'glass');if(i%4===0)rod([-.8,y,z],[.8,y,z],.022)}for(const x of [-.75,.75])pipe([[x,1.05,-.35],[x,1.38,-.1],[x,1.31,.45]],.024)}
 if(v===1){for(let i=0;i<16;i++)box(-.8+i*.105,1.12,0,.115,.035,.9,'metal').rotation.z=i%2?.12:-.12;for(const z of [-.35,.35])box(0,1.07,z,1.7,.06,.05,'dark')}
 if(v===2){for(let i=0;i<10;i++){box(-.9+i*.2,1.05,0,.2,.035,1.1,i%2?'white':'green').rotation.x=.2;box(-.9+i*.2,.91,.54,.2,.18,.03,i%2?'white':'green')}for(const x of [-.85,.85]){rod([x,.7,-.5],[x,.97,.45],.026);rod([x,1.18,-.5],[x,.97,.45],.026)}}
 if(v===3){box(0,.85,0,1.4,.04,.65,'cap');for(const x of [-.55,.55]){rod([x,.35,-.3],[x,.83,.25],.025);rod([x,.35,-.3],[x,.83,-.3],.025)}}
 if(v===4){for(const x of [-.55,.55]){box(x,1,0,.04,2,.65,'metal');box(x,1,.05,.02,1.86,.55,'glass')}box(0,2.02,0,1.15,.05,.7,'glass');box(0,2.05,-.3,1.2,.055,.04,'metal')}break;
case 5:
 if(v===0)for(let j=0;j<3;j++){pipe([[-1,.15+j*.13,0],[.65,.15+j*.13,0],[.75,.25+j*.13,0],[.75,1.1+j*.12,0]],.025,'red');for(const x of [-.8,0,.6])box(x,.15+j*.13,-.03,.07,.075,.09,'metal')}
 if(v===1)for(let i=0;i<4;i++){let x=-.6+i*.4;box(x,.65,0,.27,.34,.16,'cap');box(x,.72,.095,.20,.08,.02,'white');pipe([[x-.12,0,0],[x-.12,.65,0],[x,.65,0]],.02,'red');pipe([[x+.1,.65,0],[x+.16,.7,0],[x+.16,1.2,0]],.02,'red')}
 if(v===2){frame(.6,.65);for(const x of [-.3,.3])box(x,.325,-.12,.035,.65,.25,'yellow');pipe([[0,0,0],[0,.7,0]],.04,'red');ring(0,.36,.12,.13,.016,'red');rod([-.12,.36,.12],[.12,.36,.12],.016,'red')}
 if(v===3){pipe([[-.8,.1,0],[-.3,.1,0],[-.3,.6,0],[.3,.6,0],[.3,1.4,0],[.7,1.4,0]],.035,'red');for(const [x,y] of [[-.6,.1],[-.3,.4],[.3,1],[.6,1.4]])box(x,y,-.025,.09,.09,.10,'metal')}
 if(v===4){rod([0,0,0],[0,2,0],.04,'red');for(let i=0;i<3;i++){pipe([[0,.4+i*.55,0],[.2,.4+i*.55,0],[.4,.6+i*.55,0]],.026,'red');cyl(0,.4+i*.55,0,.06,.09,'cap')}}break;
case 6:
 if(v===0){box(0,1.65,0,.34,.3,.26,'metal');box(0,.79,0,.09,1.45,.09,'metal');pipe([[0,.12,0],[0,.06,.2]],.05);for(const y of [.4,1.2])box(0,y,-.015,.15,.05,.12)}
 if(v===1){for(const x of [-.16,.16]){pipe([[x,2,0],[x,1.6,0],[x,.1,0],[x,.05,.2]],.045);for(const y of [.5,1.4])cyl(x,y,0,.058,.07)}box(0,1.9,0,.5,.05,.15,'dark')}
 if(v===2){pipe([[0,.7,0],[0,.25,0],[0,.12,.2],[0,.12,.45]],.085);box(0,.025,.48,.5,.05,.5);for(let i=0;i<6;i++)box(-.2+i*.08,.06,.5,.02,.025,.38,'dark')}
 if(v===3){rod([0,0,0],[0,1.2,0],.065,'cap');pipe([[0,.3,0],[0,.45,.18]],.055,'cap');ball(0,.46,.19,.075,.075,.03,'cap');for(let i=0;i<4;i++)box(0,.16+i*.3,-.015,.17,.045,.12,'metal')}
 if(v===4){box(0,.55,0,.7,.18,.45,'white');box(0,.65,0,.59,.025,.34,'dark');for(const x of [-.26,.26])for(const z of [-.16,.16])rod([x,0,z],[x,.48,z],.018);pipe([[0,.62,-.18],[0,.85,-.18],[0,.85,.03],[0,.76,.04]],.025);pipe([[0,.5,0],[0,.2,0],[.25,.2,0]],.035)}break;
case 7:
 if(v===0)for(let i=0;i<3;i++){let x=-.35+i*.35;box(x,.5,0,.3,.5,.13,'white');ball(x,.55,.09,.10,.10,.035,'glass');box(x,.38,.085,.15,.05,.015,'dark');rod([x,0,0],[x,.25,0],.012,'dark')}
 if(v===1){box(0,.6,0,.23,.23,.12,'metal');for(const p of [[[-.6,0,0],[-.6,.6,0],[0,.6,0]],[[.6,1.2,0],[.6,.6,0],[0,.6,0]],[[0,.6,0],[0,0,0]]])pipe(p,.022)}
 if(v===2){box(0,.9,0,.4,.5,.2,'white');box(.14,.9,.12,.035,.09,.02,'dark');for(let i=0;i<4;i++)ring(0,.35,.06+i*.02,.22,.01,'dark');pipe([[0,.65,0],[.22,.5,0],[.22,.2,0]],.014,'dark')}
 if(v===3){for(let i=0;i<7;i++)ring(0,.4,i*.025,.35,.013,'dark');for(const x of [-.32,.32])box(x,.4,.1,.08,.12,.23,'metal');pipe([[-.35,.4,0],[-.4,.8,0],[-.4,1.4,0]],.02,'dark')}
 if(v===4){box(0,.2,0,.14,.25,.085,'white');box(0,.32,.055,.18,.055,.13,'metal');for(const y of [.15,.23]){ring(0,y,.055,.029,.005,'dark');for(const x of [-.012,.012])ball(x,y,.065,.004,.007,.003,'dark')}rod([0,0,0],[0,.1,0],.014)}break;
case 8:
 if(v===0){ac();const old=[...root.children];for(const m of old){const c=m.clone();c.position.y+=.9;root.add(c)}for(const x of [-.5,.5])for(const z of [-.22,.22])rod([x,0,z],[x,1.75,z],.024)}
 if(v===1){ac();for(let i=0;i<12;i++)rod([-.52+i*.095,.04,.35],[-.52+i*.095,.9,.35],.009);for(const y of [.04,.45,.9])rod([-.54,y,.35],[.54,y,.35],.018);for(const x of [-.54,.54])rod([x,.9,-.25],[x,.9,.35],.018)}
 if(v===2){box(0,.8,0,.75,1.5,.45,'white',.04);for(const y of [.45,1.1]){ball(0,y,.235,.26,.26,.015,'dark');for(let r=.07;r<.27;r+=.045)ring(0,y,.26,r,.005)}for(const x of [-.24,.24])box(x,.06,0,.1,.12,.55,'metal')}
 if(v===3){box(0,.4,0,.7,.7,.07,'white');ring(0,.4,.05,.28,.025);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ball(Math.cos(a)*.13,.4+Math.sin(a)*.13,.04,.13,.065,.02,'metal').rotation.z=a}for(let r=.06;r<.28;r+=.06)ring(0,.4,.09,r,.005)}
 if(v===4){cyl(0,.2,0,.16,.4);ball(0,.5,0,.32,.23,.32,'metal');for(let i=0;i<14;i++){let a=i*Math.PI/7;pipe([[Math.cos(a)*.26,.35,Math.sin(a)*.26],[Math.cos(a+.2)*.32,.5,Math.sin(a+.2)*.32],[Math.cos(a+.4)*.18,.68,Math.sin(a+.4)*.18]],.012,'dark')}}break;
case 9:
 if(v===0){crate(0,0,0);crate(.03,.35,.02);crate(-.02,.7,0)}
 if(v===1){box(0,1.2,0,.85,.06,.06,'wood');for(let i=0;i<4;i++){let x=-.3+i*.2;rod([x,.18,.06],[x,1.2,.06],.014,'wood');if(i%2)box(x,.12,.06,.16,.22,.045,'cap');else for(let j=0;j<7;j++)rod([x,.3,.06],[x-.09+j*.03,.02,.06],.008,'wood')}}
 if(v===2){for(const z of [-.3,.3]){for(const x of [-.3,.3])rod([x,0,z],[x,1.6,0],.025);for(let i=0;i<6;i++)box(0,.15+i*.26,z*(1-(.15+i*.26)/1.6),.62,.04,.06,'metal')}}
 if(v===3){for(const x of [-.45,.45])for(const z of [-.22,.22])rod([x,0,z],[x,1.2,z],.02);for(const y of [.08,.6,1.15])box(0,y,0,.95,.04,.5,'metal');box(-.18,.28,0,.4,.36,.35,'wood');box(.2,.77,0,.3,.3,.4,'cap');box(-.18,.48,0,.035,.018,.35,'white')}
 if(v===4){box(0,.14,0,.5,.28,.28,'blue');box(0,.30,0,.54,.05,.32,'dark');pipe([[-.10,.32,0],[-.10,.4,0],[.10,.4,0],[.10,.32,0]],.018);box(.5,.34,0,.3,.04,.3,'wood');for(const x of [.38,.62])for(const z of [-.12,.12])rod([x,0,z],[x,.33,z],.018)}break;
case 10:
 if(v<3){bicycle(v===2);if(v===0){root.scale.set(.72,.72,.85);box(0,.55,.03,.13,.11,.09,'metal');box(.7,.7,0,.1,.04,.35,'metal')}if(v===1){root.scale.set(.65,.65,.85);for(const z of [-.22,.22]){wheel(-.5,.16,z,.12);rod([-.5,.33,0],[-.5,.16,z],.013)}box(-.2,.98,0,.1,.15,.08,'red')}if(v===2){box(-.48,.73,0,.48,.045,.48,'metal');crate(-.48,.76,0)}}
 if(v===3){for(const x of [-.55,.55])wheel(x,.25,0,.22);box(-.1,.36,0,1,.22,.40,'blue',.07);ball(-.2,.66,0,.4,.10,.25,'dark');pipe([[.48,.25,0],[.35,.65,0],[.28,1.05,0]],.045);rod([.28,1.05,-.3],[.28,1.05,.3],.022);box(-.56,.97,0,.55,.5,.5,'white');box(-.56,1.24,0,.58,.035,.53,'red');ball(.4,.83,.12,.09,.10,.035,'white');rod([-.18,.33,0],[-.28,0,-.3],.022)}
 if(v===4){for(const x of [-.4,.4])wheel(x,.1,0,.09);box(0,.14,0,.85,.035,.18,'dark');rod([.4,.14,0],[.28,1.1,0],.024);rod([.28,1.1,-.23],[.28,1.1,.23],.019);rod([-.1,.14,0],[-.15,0,-.14],.01)}break;
case 11:
 if(v===0){for(const x of [-.7,.7]){cyl(x,.4,0,.045,.8);cyl(x,.63,0,.05,.1,'yellow')}for(let i=0;i<18;i++){let x=-.7+i*.082;ring(x,.7-.22*Math.sin(Math.PI*i/17),0,.04,.008,'dark').rotation.y=i%2*Math.PI/2}}
 if(v===1){cyl(0,.15,0,.28,.3,'yellow',.22);cyl(0,.65,0,.035,.8,'red');box(0,1.08,0,.45,.22,.045,'yellow');ring(0,1.08,.03,.075,.008,'red')}
 if(v===2){pipe([[-.35,.04,0],[-.35,.65,0],[.35,.65,0],[.35,.04,0]],.035);for(const x of [-.35,.35])box(x,.025,0,.16,.05,.2,'dark');box(0,.44,.02,.3,.25,.08,'yellow')}
 if(v===3){box(0,.04,0,1.2,.08,.35,'dark',.03);box(0,.087,0,1.18,.025,.15,'yellow');for(let i=0;i<8;i++)box(-.5+i*.14,.104,0,.02,.009,.12,'dark',.002)}
 if(v===4){box(0,.025,0,1.6,.05,.25,'stone');for(let i=0;i<26;i++)box(-.75+i*.06,.055,0,.026,.022,.20,'metal',.003)}break;
case 12:
 if(v===0){cyl(0,.28,0,.22,.5,'cap',.29);ring(0,.55,0,.29,.022,'wood').rotation.x=Math.PI/2;cyl(0,.52,0,.26,.01,'dark');for(let i=0;i<5;i++)ball(Math.cos(i*2.4)*.14,.53,Math.sin(i*2.4)*.14,.1,.09,.07,'cap')}
 if(v===1){ball(0,.27,0,.25,.28,.22,'glass');for(let i=0;i<7;i++){let x=Math.sin(i*3)*.12,z=Math.cos(i*3)*.1;cyl(x,.12+(i%3)*.12,z,.04,.17,i%2?'white':'green')}cyl(0,.57,0,.035,.09,'white')}
 if(v===2){for(const x of [-.3,.3])for(const z of [-.2,.2])rod([x,0,z],[x,.9,z],.018);for(let j=0;j<8;j++)for(const z of [-.2,.2])rod([-.3,.1+j*.1,z],[.3,.1+j*.1,z],.008,'green');for(let i=0;i<9;i++)for(const z of [-.2,.2])rod([-.3+i*.075,.05,z],[-.3+i*.075,.9,z],.006,'green')}
 if(v===3){for(const x of [-.3,.3])box(x,.2,0,.015,.4,.5,'wood');for(const z of [-.25,.25])box(0,.2,z,.6,.4,.015,'wood');box(0,.01,0,.6,.02,.5,'wood');for(const z of [-.36,.36])box(0,.4,z,.6,.02,.24,'wood').rotation.x=z>0?-.35:.35}
 if(v===4){for(let i=0;i<6;i++)box(-.25+i*.09,.3+i*.025,0,.065,.6+i*.05,.05,'wood').rotation.z=-.15;rod([.35,0,0],[.25,.8,0],.018);ball(.30,.36,0,.055,.3,.05,'blue');pipe([[.25,.8,0],[.25,.88,0],[.34,.9,0],[.38,.83,0]],.015,'dark')}break;
case 13:
 if(v===0){box(0,.15,0,.75,.3,.45,'white');box(0,.31,0,.65,.01,.35,'soil');for(let i=0;i<6;i++)leaf(-.26+i*.1,.40,(i%2-.5)*.17,.13)}
 if(v===1){ball(0,.35,0,.32,.35,.32,'red');cyl(0,.64,0,.20,.08,'red');cyl(0,.69,0,.18,.01,'soil');for(let i=0;i<8;i++){let a=i*2.4;rod([0,.7,0],[Math.cos(a)*.28,1,Math.sin(a)*.28],.012,'green');leaf(Math.cos(a)*.28,1,Math.sin(a)*.28)}}
 if(v===2){box(0,.15,0,.8,.3,.22,'red');box(0,.31,0,.72,.015,.17,'soil');for(const x of [-.27,.27])pipe([[x,0,-.1],[x,.4,-.1],[x,.43,-.2],[x,.32,-.23]],.018);for(let i=0;i<5;i++)leaf(-.3+i*.15,.41,0,.13)}
 if(v===3){for(let i=0;i<3;i++){box(0,.2+i*.25,-i*.23,.9,.04,.24,'metal');for(const x of [-.32,.32]){let before=root.children.length;pot(x,-i*.23,.11);for(const m of root.children.slice(before))m.position.y+=.2+i*.25}}for(const x of [-.4,.4])rod([x,0,.1],[x,.8,-.55],.025)}
 if(v===4){for(const z of [-.33,.33])for(let i=0;i<6;i++)box(-.75+i*.3,.12,z,.285,.24,.14,'brick');for(const x of [-.9,.9])box(x,.12,0,.14,.24,.65,'brick');box(0,.12,0,1.65,.16,.5,'soil');for(let i=0;i<8;i++)leaf(-.7+i*.2,.3,(i%2-.5)*.25,.17)}break;
case 14:
 if(v===0){cyl(0,.9,0,.07,1.8,'wood',.035);for(let j=0;j<5;j++)for(let i=0;i<7;i++){let a=i*2.4+j;ball(Math.cos(a)*(.4-j*.065),.65+j*.3,Math.sin(a)*(.4-j*.065),.23-j*.025,.3,.23-j*.025,'green')}}
 if(v===1){cyl(0,.6,0,.07,1.2,'wood',.04);for(let i=0;i<7;i++){let a=i*2.4;rod([0,.6,0],[Math.cos(a)*.5,1.4+(i%2)*.3,Math.sin(a)*.5],.025,'wood');ball(Math.cos(a)*.5,1.5+(i%2)*.3,Math.sin(a)*.5,.4,.35,.35,'green')}}
 if(v===2){for(let i=0;i<6;i++){box(-.6+i*.24,.8,0,.02,1.6,.025,'wood');box(0,.1+i*.28,0,1.3,.02,.025,'wood')}for(let i=0;i<10;i++){let x=-.55+(i%5)*.27,y=.25+Math.floor(i/5)*.75;pipe([[x,0,0],[x+.1,y,.05],[x-.1,y+.5,.04]],.012,'green');for(let j=0;j<4;j++)leaf(x+(j%2)*.1,y+j*.12,.06,.13)}}
 if(v===3){box(0,.16,0,.6,.32,.4,'cap');box(0,.33,0,.52,.015,.32,'soil');for(const x of [-.2,.2]){rod([x,.3,0],[x,1.45,0],.012,'wood');for(let j=0;j<5;j++){leaf(x,.45+j*.17,0,.14);ball(x+.07,.5+j*.16,.07,.03,.04,.03,'red')}}rod([-.25,1.4,0],[.25,1.4,0],.012,'wood')}
 if(v===4){for(let i=0;i<12;i++){let x=Math.sin(i*2.4)*.3,z=Math.cos(i*2.4)*.2;rod([x,0,z],[x+.04,.13+(i%3)*.05,z],.006,'green');leaf(x,.05,z,.045)}for(let i=0;i<4;i++)ball(-.3+i*.2,.025,.14,.07,.025,.04,'stone')}break;
case 15:
 if(v===0){for(let i=0;i<4;i++){box(0,.43,-.22+i*.14,1.4,.045,.12,'wood');box(0,.65+i*.1,-.25,1.4,.08,.04,'wood')}for(const x of [-.55,.55]){for(const z of [-.2,.2])rod([x,0,z],[x,.43,z],.026,'dark');rod([x,.4,-.25],[x,1,-.25],.026,'dark')}}
 if(v===1){box(0,.08,0,.5,.16,.5,'stone');cyl(0,.9,0,.025,1.65);ball(0,1.55,0,.10,.7,.1,'cap');cyl(0,2.27,0,.025,.12,'metal');ring(0,1.4,0,.105,.02,'dark').rotation.x=Math.PI/2}
 if(v===2){cyl(0,.6,0,.024,1.2);for(let i=0;i<8;i++){let a=i*Math.PI/4;rod([0,1.1,0],[Math.cos(a)*.45,1.05,Math.sin(a)*.45],.012);box(Math.cos(a)*.42,.99,Math.sin(a)*.42,.02,.075,.02,'blue')}for(let i=0;i<3;i++)rod([0,.3,0],[Math.cos(i*2.094)*.35,0,Math.sin(i*2.094)*.35],.015)}
 if(v===3){for(let i=0;i<3;i++){let x=(i-1)*.47,s=1-i*.16;ball(x,.35*s,0,.27*s,.34*s,.27*s,'wood');cyl(x,.66*s,0,.19*s,.09*s,'dark');cyl(x,.72*s,0,.23*s,.055,'wood')}}
 if(v===4){for(const z of [-.16,.16]){ring(0,.4,z,.3,.028);rod([-.25,0,z],[0,.4,z],.025);rod([.25,0,z],[0,.4,z],.025)}for(let i=0;i<7;i++)ring(0,.4,-.12+i*.04,.23,.021,'green');rod([0,.4,-.23],[0,.4,.23],.025);pipe([[0,.4,.22],[.14,.4,.25],[.14,.54,.25]],.018)}break;
case 16:
 if(v===0){for(const z of [-.27,.27])wheel(0,.2,z,.18);box(0,.26,0,.8,.06,.5,'wood');for(const z of [-.25,.25])rod([-.4,.3,z],[-.7,1,z],.025);rod([-.7,1,-.25],[-.7,1,.25],.025)}
 if(v===1){wheel(.4,.18,0,.17);box(-.1,.42,0,.75,.23,.5,'metal',.06);for(const z of [-.22,.22]){rod([.4,.18,0],[-.65,.6,z],.025);rod([-.3,.3,z],[-.3,0,z],.018)}}
 if(v===2)for(let j=0;j<3;j++)for(let i=0;i<2;i++){box(-.22+i*.44,.1+j*.19,0,.43,.18,.55,'cap',.04);box(-.22+i*.44,.195+j*.19,0,.29,.008,.15,'blue',.002)}
 if(v===3)for(let j=0;j<5;j++)for(let i=0;i<4;i++){let m=box(-.45+i*.3,.07+j*.14,0,.28,.13,.3,'brick',.01);m.rotation.y=j%2?.1:0}
 if(v===4){for(let j=0;j<5;j++)box(0,.025+j*.04,0,.85-j*.025,.04,.52,'green',.015);pipe([[-.4,.1,-.24],[-.4,.23,.1],[0,.23,.25],[.4,.15,.2]],.014,'cap')}break;
case 17:
 if(v===0){pipe([[0,0,0],[0,.35,0],[.2,.7,0],[.8,.8,0]],.035);box(.8,.76,0,.4,.12,.2,'metal');box(.8,.695,0,.32,.02,.14,'white');for(const y of [.06,.25])box(0,y,-.015,.2,.04,.12,'metal')}
 if(v===1){box(0,.22,0,.24,.3,.055,'dark');ball(0,.25,.1,.16,.18,.10,'white');for(const y of [.12,.25,.38])box(0,y,.2,.28,.017,.02,'dark')}
 if(v===2)for(let j=0;j<2;j++)for(let i=0;i<2;i++){let x=-.2+i*.4,y=.2+j*.4;box(x,y,0,.38,.38,.17,'metal');box(x,y+.1,.1,.28,.025,.02,'dark');box(x,y-.04,.1,.12,.05,.014,'white');ball(x+.12,y-.1,.105,.018,.018,.01,'cap')}
 if(v===3){box(0,.3,-.12,.16,.24,.05,'metal');rod([0,.3,-.1],[0,.4,.18],.025);box(0,.48,.24,.18,.16,.32,'white',.03);box(0,.56,.25,.23,.03,.4,'white');ball(0,.48,.405,.055,.055,.012,'dark')}
 if(v===4){box(0,.4,0,.38,.8,.23,'red');box(0,.42,.13,.28,.62,.025,'glass');cyl(0,.3,.07,.10,.46,'red');box(0,.57,.1,.18,.06,.03,'dark');pipe([[.05,.53,.1],[.14,.49,.1],[.14,.23,.1]],.015,'dark')}break;
case 18:
 if(v===0){rod([0,.5,-.4],[0,.5,0],.025);ball(0,.5,0,.35,.35,.055,'cap');ring(0,.5,.06,.31,.018,'dark');for(let j=0;j<3;j++)box(0,.39+j*.11,.065,.24-j*.04,.025,.01,'dark')}
 if(v===1){for(const z of [-.25,.25])for(const x of [-.28,.28])rod([x,0,z],[x,1,0],.018,'wood');box(0,.62,.1,.62,.65,.035,'dark');for(let j=0;j<5;j++)box(-.04,.42+j*.1,.124,.38-(j%2)*.12,.017,.008,'white')}
 if(v===2){for(let i=0;i<18;i++)box(0,.04+i*.095,0,1.6,.09,.045,'metal');for(const x of [-.83,.83])box(x,.85,0,.05,1.8,.1,'dark');box(0,.05,.07,.18,.025,.04,'dark')}
 if(v===3){frame(.9,1.95);box(0,.98,0,.85,1.87,.025,'glass');box(0,.23,.035,.84,.42,.025,'metal');rod([.3,.75,.09],[.3,1.2,.09],.018);for(const y of [.75,1.2])rod([.3,y,.02],[.3,y,.09],.012)}
 if(v===4){box(0,.65,0,1,.055,.35,'wood');for(const x of [-.38,.38])rod([x,.2,-.15],[x,.64,.13],.024);crate(-.2,.68,0);const start=root.children.length;pot(.3,0,.12);for(const m of root.children.slice(start))m.position.y+=.68; }break;
case 19:
 if(v===0){for(const x of [-.4,.4])for(const z of [-.4,.4])rod([x,0,z],[x,.6,z],.035);box(0,.6,0,.95,.06,.95,'metal');cyl(0,1.1,0,.43,.94,'blue');for(const y of [.8,1.15,1.5])cyl(0,y,0,.44,.035,'cap');cyl(0,1.61,0,.19,.06,'dark');pipe([[.3,.7,0],[.58,.7,0],[.58,.1,0]],.028)}
 if(v===1){for(const x of [-.9,0,.9])rod([x,0,0],[x,1.1,0],.027);for(const y of [.15,.65,1.1])rod([-.95,y,0],[.95,y,0],.02);for(let i=0;i<12;i++)rod([-.9+i*.164,.15,0],[-.9+i*.164,1.1,0],.01)}
 if(v===2){cyl(0,.35,0,.035,.7);let dish=ball(0,.8,0,.43,.43,.06,'white');dish.rotation.x=-.3;rod([0,.5,0],[0,.78,.4],.018);ball(0,.79,.4,.04,.04,.07,'dark');for(const x of [-.3,.3])rod([0,.2,0],[x,0,0],.022)}
 if(v===3){for(const x of [-.9,.9]){rod([x,0,0],[x,1.8,0],.025);rod([x,1.75,-.35],[x,1.75,.35],.022)}for(const z of [-.3,0,.3])pipe([[-.9,1.75,z],[0,1.67,z],[.9,1.75,z]],.008,'cap')}
 if(v===4){for(let i=0;i<10;i++)for(const side of [-1,1]){let m=cyl(-.9+i*.2,.25,side*.19,.12,.45,'dark');m.rotation.x=Math.PI/2+side*.3}for(let i=0;i<10;i++){let m=cyl(-.9+i*.2,.33,0,.13,.2,'cap');m.rotation.z=Math.PI/2}}break;
}
root.userData={...moreCatalog[id-51],units:'meters',style:'beveled mesh; face-color crease lines',family:f,variant:v};return root;}
