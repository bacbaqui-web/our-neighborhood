import * as T from '../domestic-test/vendor/three.module.js';
const names=[
'꽃나무 대형 화분','높이가 다른 화분 선반','덩굴 격자와 긴 화분','가지 벌어진 골목 나무','좁은 틈 대나무 군락',
'수건 널린 빨래건조대','외부 세탁 싱크와 대야','바퀴 달린 청소도구함','이불 걸린 건조봉','신발과 장화 선반',
'철망 재활용 수거장','바퀴 달린 대형 수거통','끈으로 묶은 폐지 더미','그물망과 분리 봉투','문짝과 폐목재 적치',
'이단 실외기 설비 프레임','여덟 세대 계량기 묶음','굴곡 배수관과 집수 홈통','방수 전기함과 전선 다발','돌출 환기 후드',
'덮개 씌운 주차 자전거','짐상자 달린 주차 오토바이','골목 주차용 소형 SUV','생활용 소형 화물차','골목 전동 보행 보조차',
'바퀴 달린 채소 판매대','채소 담긴 운반 상자','작은 탁자와 접이식 의자','철제 작업 자재 선반','방수포 덮인 운반 팔레트',
'골강판 지붕 주차 차양','덩굴이 덮인 마당 퍼걸러','물결 끝단 가게 차양','띠무늬 철제 셔터','옆 손잡이가 있는 돌계단',
'우산통과 현관 정리대','문 열린 외부 수납장','물통과 연결 호스','자투리 공간 공구 작업대','벽걸이 청소도구 세트',
'주차 방지 체인과 기둥','코너 반사경과 주의판','모서리 충격 방지 기둥','빗물받이와 낙엽','낡은 보도 경계석 묶음',
'긴 담장 덩굴 군락','하부 잡초와 돌무더기','과실 화분과 지지목','다층 채소 재배 선반','키 큰 생울타리 덤불',
'가방 든 보행자','장바구니 든 주민','대화 중인 두 사람','벤치에 앉은 주민','작업복 입은 주민',
'우편함과 택배 선반','벽 부착 공지 게시판','부품이 드러난 가로등','주차장 천장 배관 묶음','담장 위 장독과 화분'
];
const cats=['식재 군집','생활·빨래','수거·보관','외벽 설비','주차·이동','작업·휴식','차양·진입','생활·보관','골목 시설','식재 군집','주민','벽·상부 설비'];
export const neighborhoodCatalog=names.map((name,i)=>({id:i+151,name,category:cats[Math.floor(i/5)],source:[152,154,155,157,158,159,160,163,164,165,176,177,178,179,180,182,185,186,187,188,189,190,193,195,198,199,201,202,203,204,205].includes(i+151)?'골목 보완 제안':'로드뷰 관찰 재구성',file:`alley-${i+151}.glb`}));
import {ALLEY_PALETTE as C} from './alley-palette.js?v=151';
export function createNeighborhoodAsset(id){const root=new T.Group();root.name=names[id-151];let part=0;
function mesh(g,k='stone',x=0,y=0,z=0){const m=new T.Mesh(g,new T.MeshStandardMaterial({color:C[k]??k,roughness:.86}));m.position.set(x,y,z);m.name=k+'-'+(++part);m.userData.part=k;root.add(m);return m}
function box(x,y,z,w,h,d,k='stone',bevel=0){return mesh(new T.BoxGeometry(w,h,d),k,x,y,z)}
function cyl(x,y,z,r,h,k='metal',rt=r){return mesh(new T.CylinderGeometry(rt,r,h,r>.15?8:6),k,x,y,z)}
function ball(x,y,z,a,b,c,k){const g=new T.SphereGeometry(1,Math.max(a,b,c)<.12?6:8,Math.max(a,b,c)<.12?3:4);g.scale(a,b,c);return mesh(g,k,x,y,z)}
function rod(a,b,r=.02,k='metal'){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=mesh(new T.CylinderGeometry(r,r,v.length(),4),k);m.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m}
function ring(x,y,z,r,t=.014,k='metal'){return mesh(new T.TorusGeometry(r,t,3,r>.15?10:8),k,x,y,z)}
function pipe(ps,r=.025,k='metal'){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p))),Math.max(4,(ps.length-1)*3),r,4,false),k)}
function leaves(x,y,z,s=.3,n=6){for(let i=0;i<n;i++){const a=i*2.4;ball(x+Math.cos(a)*s*.6,y+(i%3)*s*.4,z+Math.sin(a)*s*.6,s*.6,s*.42,s*.55,i%2?'leaf':'green')}}
function pot(x,z,r=.22,h=.4,tall=false){cyl(x,h/2,z,r*.74,h,'red',r);cyl(x,h,z,r*1.05,.055,'red');cyl(x,h+.02,z,r*.9,.02,'soil');rod([x,h,z],[x,h+(tall?1.3:.4),z],.018,'wood');leaves(x,h+(tall?1.15:.3),z,tall?.42:.25);}
function frame(w,h,d){for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])rod([x,0,z],[x,h,z],.023);for(const y of [.1,h]){rod([-w/2,y,-d/2],[w/2,y,-d/2]);rod([-w/2,y,d/2],[w/2,y,d/2])}}
function crate(x,y,z,k='blue'){for(let j=0;j<2;j++){box(x,y+.07+j*.2,z-.22,.6,.045,.025,k);box(x,y+.07+j*.2,z+.22,.6,.045,.025,k);box(x-.29,y+.07+j*.2,z,.025,.045,.45,k);box(x+.29,y+.07+j*.2,z,.025,.045,.45,k)}box(x,y+.03,z,.6,.04,.45,k);for(const dx of [-.29,.29])for(const dz of [-.22,.22])box(x+dx,y+.18,z+dz,.025,.36,.025,k)}
function wheel(x,y,z,r=.23){if(r<.2){const tire=cyl(x,y,z,r,.08,'dark');tire.rotation.x=Math.PI/2;const hub=mesh(new T.CircleGeometry(r*.56,6),'metal',x,y,z+.045);hub.material.side=T.DoubleSide;return;}ring(x,y,z,r,.045,'dark');ring(x,y,z,r*.62,.026);cyl(x,y,z,.075,.08,'metal').rotation.x=Math.PI/2;for(let i=0;i<4;i++){const a=i*Math.PI/2;rod([x,y,z],[x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,z],.01)}}
function cloth(x,y,z,w,h,k='blue'){const v=[];const N=8;for(let i=0;i<N;i++){const a=-w/2+i*w/N,b=a+w/N;v.push(x+a,y,z+Math.sin(i)*.025,x+b,y,z+Math.sin(i+1)*.025,x+b,y-h,z+.08+Math.sin(i+1)*.04,x+a,y,z+Math.sin(i)*.025,x+b,y-h,z+.08+Math.sin(i+1)*.04,x+a,y-h,z+.08+Math.sin(i)*.04)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();const m=mesh(g,k);m.material.side=T.DoubleSide;return m}
function person(x=0,z=0,pose=0){const k=pose%2?'blue':'cap';ball(x,1.52,z,.11,.145,.105,'skin');ball(x,1.6,z-.02,.115,.08,.11,'dark');box(x,1.14,z,.35,.49,.22,k,.06);for(const s of [-1,1]){const knee=[x+s*.095,.54,z+(pose===0?s*.14:0)];rod([x+s*.09,.94,z],knee,.066,'dark');rod(knee,[x+s*.1,.12,z+(pose===0?-s*.12:0)],.055,'dark');box(x+s*.1,.07,z+.05,.13,.12,.25,'dark');rod([x+s*.2,1.32,z],[x+s*.26,.92,z+.04],.045,k);ball(x+s*.26,.89,z+.04,.045,.07,.04,'skin')}if(pose===1)box(x+.29,.66,z+.05,.3,.4,.2,'wood');if(pose===0)box(x,1.12,z-.18,.29,.36,.16,'red')}
function roof(w,d,y,k='metal'){for(let i=0;i<Math.ceil(w/.22);i++){const x=-w/2+.11+i*.22;box(x,y,0,.23,.035,d,k).rotation.z=i%2?.09:-.09}for(const x of [-w/2+.13,w/2-.13])for(const z of [-d/2+.13,d/2-.13])rod([x,0,z],[x,y,z],.04,'metal')}
function vehicleWheel(x,y,z,r){const tire=mesh(new T.CylinderGeometry(r,r,.12,10),'dark',x,y,z);tire.rotation.x=Math.PI/2;const hub=mesh(new T.CircleGeometry(r*.65,8),'metal',x,y,z+Math.sign(z)*.065);hub.material.side=T.DoubleSide;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([x,y,z+Math.sign(z)*.07],[x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z+Math.sign(z)*.07],.009,'cap');}}
function vehicle(truck=false){const len=truck?4.0:3.45,w=1.5;box(0,.51,0,len,.52,w,'white',.08);for(const x of [-len*.31,len*.31])for(const z of [-.76,.76])vehicleWheel(x,.34,z,.29);box(-.7,1.22,0,1.58,.95,1.43,'white',.06);box(-1.38,1.32,0,.05,.55,1.24,'glass');for(const z of [-.731,.731]){box(-.68,1.37,z,1.1,.53,.025,'glass');box(-.24,.98,z,.19,.045,.025,'dark');rod([-.85,1.05,z],[-1.08,1.07,z*1.17],.016);box(-1.08,1.09,z*1.19,.15,.12,.09,'metal')}for(const z of [-.51,.51])box(-len/2-.015,.67,z,.06,.16,.29,'cap');box(-len/2-.025,.42,0,.06,.1,1.37,'metal');box(-len/2-.03,.61,0,.06,.16,.5,'dark');if(truck){box(.95,.82,0,2.12,.08,1.45,'wood');for(const z of [-.71,.71])box(.95,1.05,z,2.1,.42,.065,'blue');box(1.95,1.05,0,.07,.42,1.4,'blue');crate(.8,.88,0);crate(1.4,.88,0,'green')}else{box(.8,1.24,0,1.35,.95,1.42,'white',.07);for(const z of [-.732,.732])box(.8,1.4,z,1.08,.5,.025,'glass');box(len/2,1.38,0,.025,.5,1.2,'glass');for(const z of [-.59,.59])box(len/2,.65,z,.04,.25,.12,'red')}}
switch(id){
case 151:pot(0,0,.38,.58,true);for(let i=0;i<7;i++){const a=i*2.4;ball(Math.cos(a)*.32,1.35+(i%3)*.12,Math.sin(a)*.3,.07,.06,.07,'red')}break;
case 152:frame(1.4,1.05,.5);for(const y of [.12,.56,1])box(0,y,0,1.4,.04,.52,'wood');for(const [x,z,r,h] of [[-.48,-.06,.15,.25],[0,.06,.18,.34],[.5,-.03,.13,.22]]){const first=root.children.length;pot(x,z,r,h);const m=root.children.slice(first);m.forEach(o=>o.position.y+=x<0?1:.52)}break;
case 153:box(0,.18,0,1.5,.36,.55,'wood');for(const x of [-.65,0,.65])rod([x,.3,-.18],[x,1.9,-.18],.014,'wood');for(let y=.5;y<1.9;y+=.25)rod([-.7,y,-.18],[.7,y,-.18],.012,'wood');for(let i=0;i<8;i++)leaves(Math.sin(i)*.5,.5+i*.18,-.13,.22,3);break;
case 154:rod([0,0,0],[.08,2,0],.11,'wood');for(let i=0;i<6;i++){const a=i*2.4,x=Math.cos(a)*.72,z=Math.sin(a)*.65;rod([.04,1.25,0],[x,2.25+(i%2)*.3,z],.05,'wood');leaves(x,2.4+(i%2)*.3,z,.85,5)}break;
case 155:for(let i=0;i<9;i++){const x=Math.sin(i*2.4)*.4,z=Math.cos(i*2.4)*.32,h=1.7+(i%3)*.27;rod([x,0,z],[x+.07,h,z],.025,'green');for(let y=.3;y<h;y+=.35){mesh(new T.CylinderGeometry(.029,.029,.03,4,1,true),'cap',x,y,z);leaves(x,y+.05,z,.23,3)}}break;
case 156:for(const z of [-.4,.4]){rod([-.65,0,z],[.65,1.2,z]);rod([.65,0,z],[-.65,1.2,z])}for(let i=0;i<6;i++)rod([-.6+i*.24,1.2,-.46],[-.6+i*.24,1.2,.46],.01);cloth(-.38,1.21,.12,.34,.65,'white');cloth(.07,1.21,.1,.32,.75,'blue');cloth(.46,1.21,-.15,.29,.55,'cap');break;
case 157:for(const x of [-.5,.5])for(const z of [-.25,.25])rod([x,0,z],[x,.75,z]);box(0,.72,0,1.1,.12,.65,'metal');box(0,.78,0,.72,.08,.42,'dark');pipe([[.35,.72,-.2],[.35,1.05,-.2],[.1,1.05,-.1],[.1,.95,0]],.025);cyl(-.2,.21,.04,.26,.35,'blue',.32);break;
case 158:frame(.7,.85,.45);box(0,.2,0,.7,.05,.45,'metal');cyl(0,.4,0,.23,.38,'blue',.28);for(const x of [-.3,.3])wheel(x,.1,-.22,.1);rod([.25,.3,.14],[.3,1.5,.18]);box(.3,1.52,.18,.32,.08,.13,'green');break;
case 159:for(const x of [-.9,.9]){rod([x,0,0],[x,1.55,0]);rod([x-.25,.04,-.3],[x+.25,.04,.3])}rod([-.95,1.55,0],[.95,1.55,0]);cloth(0,1.56,.01,1.4,1.1,'red');break;
case 160:frame(.8,.9,.3);for(const y of [.12,.45,.78])box(0,y,0,.8,.025,.3,'wood');for(let i=0;i<6;i++){const x=-.28+(i%3)*.28,y=i<3?.18:.51;box(x,y,.03,.13,.1,.23,i%2?'blue':'dark')}for(const x of [-.12,.12]){cyl(x,.76,0,.07,.36,'green');box(x,.6,.06,.14,.1,.25,'green')}break;
case 161:frame(1.5,1.1,.7);for(let x=-.7;x<=.7;x+=.14)for(const z of [-.35,.35])rod([x,.08,z],[x,1.1,z],.009);for(let y=.12;y<1.1;y+=.15){rod([-.75,y,-.35],[.75,y,-.35],.009);rod([-.75,y,.35],[.75,y,.35],.009)}for(let i=0;i<6;i++)ball(-.5+(i%3)*.45,.25+(i>2?.25:0),0,.22,.24,.24,i%2?'white':'blue');break;
case 162:box(0,.54,0,.64,.86,.6,'green',.05);box(0,1.01,-.04,.7,.12,.68,'dark');box(0,1.09,.1,.22,.04,.07,'cap');for(const x of [-.3,.3])wheel(x,.15,-.29,.13);box(0,.6,.31,.27,.22,.015,'white');break;
case 163:for(let i=0;i<8;i++){const m=box(0,.055+i*.07,0,.86-i*.014,.06,.61,'wood',.003);m.rotation.y=(i%3-1)*.06}for(const x of [-.26,.26])pipe([[x,0,.31],[x,.61,.3],[x,.61,-.31],[x,0,-.31]],.009,'white');break;
case 164:for(const x of [-.55,.55])rod([x,0,-.12],[x,1,-.12]);for(let i=0;i<9;i++)rod([-.55,.1+i*.1,-.1],[.55,.1+i*.1,-.1],.006,'green');for(let i=0;i<4;i++){const x=-.38+(i%2)*.7,z=i>1?.32:0;ball(x,.3,z,.28,.33,.25,'white');cyl(x,.64,z,.04,.1,'blue')}break;
case 165:for(let i=0;i<4;i++){const m=box(-.24+i*.15,.7,-.15+i*.09,.45,1.35,.055,i%2?'wood':'cap');m.rotation.x=-.13-i*.03}box(0,.045,.32,1.1,.07,.21,'wood');box(.1,.115,.35,.9,.07,.22,'wood');break;
case 166:frame(1.3,1.95,.7);for(const y of [.52,1.52]){box(0,y,0,1.1,.7,.5,'white');for(const x of [-.27,.27]){ball(x,y,.26,.215,.215,.02,'dark');for(const r of [.21])ring(x,y,.29,r,.008);for(let i=0;i<4;i++)rod([x,y,.3],[x+Math.cos(i*Math.PI/2)*.2,y+Math.sin(i*Math.PI/2)*.2,.3],.006)}pipe([[.58,y,0],[.7,y-.15,0],[.7,.1,-.2]],.024,'cap')}break;
case 167:for(let i=0;i<8;i++){const x=-1.2+i*.34;box(x,.52,0,.25,.32,.17,'cap');box(x,.59,.1,.18,.08,.02,'white');pipe([[x-.08,0,0],[x-.08,.5,0],[x,.5,0]],.018,'red');rod([x+.08,.55,0],[x+.08,.95,0],.018,'red')}rod([-1.4,.07,0],[1.4,.07,0],.035,'red');break;
case 168:pipe([[-.7,1.6,0],[-.7,1.1,0],[.6,1.1,0],[.6,.14,0],[.8,.08,.2]],.06,'cap');box(.8,.03,.28,.6,.06,.55,'stone');for(let i=0;i<7;i++)box(.56+i*.08,.065,.28,.018,.015,.46,'dark');break;
case 169:box(0,.57,0,.58,1,.3,'metal');box(0,.57,.17,.51,.86,.04,'cap');box(.17,.6,.21,.025,.15,.03,'dark');for(let i=0;i<5;i++)pipe([[-.2+i*.1,.08,-.02],[-.2+i*.1,1.12,-.02],[-.15+i*.1,1.4,.03]],.013,'dark');break;
case 170:box(0,.62,0,.65,.9,.55,'metal');cyl(0,1.15,-.05,.22,.4,'metal');pipe([[0,1.25,-.05],[0,1.45,.1],[0,1.45,.4]],.18);for(let i=0;i<7;i++)box(0,.25+i*.11,.29,.55,.04,.02,'dark');break;
case 171:for(const x of [-.6,.6])wheel(x,.32,0,.29);const g=new T.SphereGeometry(1,10,5);g.scale(.95,.56,.3);mesh(g,'blue',0,.64,0);for(let i=0;i<7;i++)pipe([[-.8+i*.26,.55,-.27],[-.8+i*.26,1.12,0],[-.8+i*.26,.55,.27]],.005,'cap');break;
case 172:for(const x of [-.57,.57])wheel(x,.3,0,.26);box(0,.52,0,1.15,.25,.43,'dark');box(-.12,.85,0,.63,.15,.48,'dark');rod([.51,.34,0],[.43,1.18,0],.045);rod([.43,1.16,-.27],[.43,1.16,.27],.026);box(-.55,1.08,0,.57,.53,.52,'red');box(-.55,1.36,0,.62,.06,.56,'dark');for(const z of [-.26,.26])rod([.42,1.16,z],[.35,1.45,z*1.4],.012);break;
case 173:vehicle();break;case 174:vehicle(true);break;
case 175:box(0,.27,0,1.1,.25,.63,'metal');for(const x of [-.38,.4])for(const z of [-.33,.33])wheel(x,.2,z,.17);box(-.17,.68,0,.55,.13,.6,'dark');box(-.43,.95,0,.1,.55,.6,'dark');rod([.4,.4,0],[.25,1.02,0],.034);rod([.25,1.02,-.25],[.25,1.02,.25],.022);for(const z of [-.32,.32])rod([-.3,.88,z],[.15,.88,z],.035);break;
case 176:frame(1.4,.9,.7);box(0,.83,0,1.4,.1,.7,'wood');for(const x of [-.6,.6])for(const z of [-.35,.35])wheel(x,.15,z,.13);for(let i=0;i<3;i++){crate(-.44+i*.44,.9,0);for(let j=0;j<3;j++)ball(-.55+i*.44+(j%2)*.17,1.15,(j>1?.12:-.1),.09,.08,.09,j%2?'green':'red')}break;
case 177:for(const [x,y,z] of [[-.31,0,0],[.32,0,.06],[-.28,.36,0]]){crate(x,y,z,'green');for(let i=0;i<5;i++)ball(x+Math.sin(i*2.4)*.17,y+.34,z+Math.cos(i*2.4)*.12,.09,.075,.09,i%2?'yellow':'green')}break;
case 178:box(0,.72,0,.8,.07,.65,'wood');for(const x of [-.32,.32])for(const z of [-.25,.25])rod([x,0,z],[x,.7,z]);for(const x of [-.77,.77]){box(x,.4,0,.4,.05,.4,'blue');for(const z of [-.17,.17])rod([x-.18,0,z],[x+.18,.42,z]);box(x,.7,-.18,.42,.4,.04,'blue')}break;
case 179:frame(1.5,1.6,.5);for(const y of [.12,.7,1.4])box(0,y,0,1.5,.04,.5,'wood');for(let i=0;i<7;i++)rod([-.7,.2+i*.06,-.15],[.6,.2+i*.06,-.1],.03,i%2?'metal':'cap');for(let i=0;i<4;i++)box(-.5+i*.32,.88,0,.25,.28,.38,'wood');break;
case 180:for(let i=0;i<6;i++)box(-.55+i*.22,.1,0,.18,.09,.9,'wood');box(0,.5,0,1.17,.7,.84,'green',.1);for(const x of [-.4,0,.4]){box(x,.86,0,.028,.02,.88,'cap');for(const z of [-.43,.43])box(x,.5,z,.028,.72,.02,'cap');}break;
case 181:roof(4.5,2.8,2.45,'blue');vehicle();for(const z of [-1.25,1.25])rod([-2.1,2.1,z],[2.1,2.45,z],.027);break;
case 182:roof(2.8,2.5,2.25,'wood');box(0,.45,0,1.7,.08,.55,'wood');for(const x of [-.7,.7])box(x,.2,0,.09,.4,.48,'metal');pot(-1,.7,.2,.4);for(let i=0;i<8;i++)leaves(Math.sin(i*2.4)*1.15,2.4,Math.cos(i*2.4)*.9,.5,5);break;
case 183:for(let i=0;i<12;i++){const x=-1.15+i*.21;box(x,.18,0,.215,.035,1.2,i%2?'cap':'green').rotation.x=.15;ball(x,.06,.58,.105,.1,.018,i%2?'cap':'green')}for(const x of [-1.05,1.05])rod([x,-.5,-.5],[x,.12,.55],.023);break;
case 184:for(let i=0;i<22;i++)box(0,.045+i*.085,0,2.2,.073,.08,[4,5,14,15].includes(i)?'blue':'metal');for(const x of [-1.13,1.13])box(x,.95,0,.06,1.95,.13,'cap');box(0,2,0,2.4,.22,.3,'white');break;
case 185:for(let i=0;i<5;i++)box(0,(5-i)*.085,i*.27,1.4,(5-i)*.17,.28,'stone');for(const x of [-.7,.7]){rod([x,.9,0],[x,.05,1.25],.028);rod([x,1.75,0],[x,.95,1.25],.028);for(const z of [0,.6,1.25])rod([x,.9-z*.68,z],[x,1.75-z*.64,z],.02)}break;
case 186:frame(.85,.7,.32);for(const y of [.13,.48])box(0,y,0,.85,.025,.34,'wood');for(let i=0;i<4;i++)box(-.3+i*.2,.2,0,.14,.1,.25,'dark');cyl(.63,.23,0,.14,.44,'metal');for(let i=0;i<4;i++)pipe([[.58+i*.025,.05,0],[.58+i*.025,.9,.01],[.62+i*.025,.96,.01],[.66+i*.025,.9,.01]],.009,'dark');break;
case 187:box(0,.75,-.28,.9,1.5,.07,'metal');for(const x of [-.45,.45])box(x,.75,0,.06,1.5,.58,'metal');for(const y of [.07,.72,1.44])box(0,y,0,.88,.06,.58,'cap');box(.62,.75,.5,.72,1.4,.045,'metal').rotation.y=-.6;crate(0,.1,0);cyl(0,.96,0,.18,.4,'blue');break;
case 188:cyl(0,.51,0,.4,1,'blue',.38);cyl(0,1.04,0,.41,.07,'dark');pipe([[.25,.15,.32],[.35,.12,.5],[.75,.05,.4],[.7,.04,-.2]],.025,'green');for(let i=0;i<3;i++){const coil=ring(.75,.035+i*.032,0,.19,.018,'green');coil.rotation.x=-Math.PI/2;}break;
case 189:frame(1.4,.84,.65);box(0,.86,0,1.5,.09,.72,'wood');box(-.4,1.02,0,.25,.23,.3,'metal');rod([-.42,1.2,-.10],[-.42,1.2,.10],.017);for(const z of [-.10,.10])rod([-.42,1.135,z],[-.42,1.2,z],.017);for(let i=0;i<3;i++)box(.05+i*.22,.96,0,.17,.12,.28,'wood');break;
case 190:rod([-.65,1.3,0],[.65,1.3,0],.025);for(let i=0;i<4;i++){const x=-.5+i*.33;rod([x,.15,0],[x,1.3,0],.012,'wood');box(x,.16,.03,.24,.18,.045,i%2?'green':'cap')}break;
case 191:for(const x of [-.7,.7]){cyl(x,.46,0,.06,.88,'metal');cyl(x,.86,0,.075,.07,'yellow')}for(let i=0;i<12;i++){const x=-.65+i*.12,y=.63-Math.sin(i/11*Math.PI)*.22;const m=ring(x,y,0,.04,.007,'dark');m.rotation.y=i%2?Math.PI/2:0}break;
case 192:cyl(0,1.2,0,.045,2.4,'red');ball(0,2.15,.04,.39,.39,.035,'yellow');ball(0,2.15,.085,.34,.34,.025,'glass');box(0,1.42,0,.44,.36,.04,'yellow');for(let i=0;i<3;i++)box(-.13+i*.13,1.43,.026,.045,.25,.014,'dark').rotation.z=-.4;break;
case 193:box(0,.56,0,.24,1.1,.24,'yellow');for(let i=0;i<4;i++)box(0,.16+i*.23,.126,.245,.10,.022,'dark').rotation.z=-.25;box(0,.055,0,.4,.11,.4,'stone');break;
case 194:box(0,.035,0,1,.07,.65,'stone');box(0,.073,0,.84,.02,.5,'dark');for(let i=0;i<12;i++)box(-.38+i*.069,.09,0,.028,.025,.46,'metal');for(let i=0;i<6;i++)ball(.4+Math.sin(i)*.12,.07,Math.cos(i)*.28,.065,.015,.04,'wood');break;
case 195:for(let i=0;i<4;i++)box(-.9+i*.6,.11,0,.59,.22,.27,i%2?'stone':'cap',.018);for(let i=0;i<5;i++)ball(-1+i*.45,.02,.22,.1,.035,.07,'soil');break;
case 196:for(let i=0;i<9;i++){const x=-1.3+i*.32;rod([x,0,0],[x+.09,1.15,0],.018,'wood');leaves(x,.65+(i%3)*.14,0,.37,5)}break;
case 197:for(let i=0;i<12;i++){const x=Math.sin(i*2.4)*.6,z=Math.cos(i*2.4)*.22;rod([x,0,z],[x+.05,.12+(i%3)*.07,z],.007,'green');if(i%3===0)ball(x,.035,z,.11,.06,.08,'stone')}break;
case 198:pot(0,0,.28,.44,true);for(const x of [-.22,.22])rod([x,.2,0],[x,1.65,0],.012,'wood');for(let i=0;i<6;i++)ball(Math.sin(i*2.4)*.26,1+(i%3)*.2,Math.cos(i*2.4)*.25,.055,.06,.055,'yellow');break;
case 199:frame(1.4,1.15,.8);for(const y of [.2,.62,1.05]){box(0,y,0,1.4,.13,.7,'cap');for(let i=0;i<6;i++)leaves(-.55+i*.22,y+.2,0,.17,3)}break;
case 200:for(let i=0;i<6;i++){const x=-.9+i*.36;rod([x,0,0],[x,1.3,0],.025,'wood');leaves(x,.85,0,.6,5);leaves(x,1.3,0,.42,3)}break;
case 201:person(0,0,0);break;case 202:person(0,0,1);break;case 203:person(-.38,0,2);person(.38,.12,1);break;
case 204:box(0,.46,0,1.5,.07,.5,'wood');for(const x of [-.6,.6])box(x,.22,0,.08,.44,.42,'metal');box(0,.87,-.24,1.5,.55,.055,'wood');ball(0,1.37,0,.11,.14,.11,'skin');box(0,1.02,0,.34,.45,.22,'blue');for(const x of [-.1,.1]){rod([x,.8,0],[x,.65,.29],.065,'dark');rod([x,.65,.29],[x,.12,.29],.055,'dark');box(x,.07,.35,.14,.12,.23,'dark')}break;
case 205:person();box(0,1.61,0,.25,.12,.25,'yellow');box(.3,.45,.08,.35,.28,.22,'metal');break;
case 206:frame(1.25,1.2,.4);for(const y of [.15,.6])box(0,y,0,1.25,.04,.4,'wood');for(const x of [-.38,0,.38]){box(x,.94,0,.34,.39,.29,'blue');box(x,1.02,.16,.27,.025,.02,'dark')}box(-.27,.32,0,.52,.3,.32,'wood');break;
case 207:box(0,.65,0,1.4,1.1,.09,'metal');box(0,.65,.06,1.27,.97,.015,'green');for(let i=0;i<6;i++)box(-.4+(i%3)*.4,.43+(i>2?.41:0),.077,.3,.34,.008,'white',.001);break;
case 208:cyl(0,1.85,0,.07,3.7,'metal');pipe([[0,3.6,0],[.3,3.85,0],[.9,3.8,0]],.045);box(.9,3.76,0,.48,.11,.27,'metal');box(.9,3.69,0,.41,.015,.2,'white');box(0,1.3,.08,.23,.36,.15,'cap');break;
case 209:for(let i=0;i<4;i++){rod([-1.4,.05+i*.13,0],[1.4,.05+i*.13,0],.026,i%2?'red':'cap');for(const x of [-1,0,1])box(x,.05+i*.13,-.04,.07,.08,.17,'metal')}for(const x of [-1,1])rod([x,0,0],[x,.75,0],.012);break;
case 210:for(let i=0;i<3;i++){const x=-.53+i*.52;ball(x,.26,0,.23,.27,.22,'wood');cyl(x,.52,0,.17,.06,'dark');cyl(x,.57,0,.1,.04,'dark')}pot(.85,0,.18,.3);break;
}
root.userData={...neighborhoodCatalog[id-151],units:'meters',style:'separate solid-color meshes; low-poly silhouettes; geometry detail'};return root;
}
