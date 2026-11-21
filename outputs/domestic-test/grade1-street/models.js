import * as T from 'three';
import {builder} from '../prop-remakes/mesh-tools.js';

const vector = point => new T.Vector3(...point);
const rotateX = angle => new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0), angle);
const steel = 0x687776;
const dark = 0x394543;

function finish(b, key, support, contactPoints, extra = {}) {
 const assetId = 'grade1:' + key;
 return b.finish({assetId, outlineOwner:assetId, status:'finished', support, contactPoints, ...extra});
}

function roundedPipe(b, points, radius, corner, material, radialSegments = 10) {
 const path = new T.CurvePath();
 const knots = points.map(vector);
 let previous = knots[0];
 for (let i = 1; i < knots.length - 1; i++) {
  const middle = knots[i];
  const before = middle.clone().lerp(knots[i - 1], Math.min(.46, corner / middle.distanceTo(knots[i - 1])));
  const after = middle.clone().lerp(knots[i + 1], Math.min(.46, corner / middle.distanceTo(knots[i + 1])));
  path.add(new T.LineCurve3(previous, before));
  path.add(new T.QuadraticBezierCurve3(before, middle, after));
  previous = after;
 }
 path.add(new T.LineCurve3(previous, knots.at(-1)));
 b.add(new T.TubeGeometry(path, points.length * 5, radius, radialSegments), material);
}

function bolt(b, x, y, z, material, radius = .008) {
 b.rod([x,y,z-.003], [x,y,z+.004], radius, material, 6);
}

export function createGasMeterBank() {
 const b = builder('벽붙이 도시가스 계량기 3연', [0x9a695b,0xd3c9ab,0x9b9984,dark,0xb48665,steel]);
 // Two shared manifolds with their inlet and return secured to the wall.
 roundedPipe(b,[[-.61,.49,.05],[-.50,.49,.10],[-.50,.26,.10],[.42,.26,.10],[.47,.26,.05]],.018,.047,0);
 roundedPipe(b,[[-.43,-.25,.10],[.52,-.25,.10],[.52,-.52,.10],[.52,-.52,.004]],.022,.066,0);
 for (const [x,y] of [[-.5,.35],[.38,.26],[.52,-.42]]) {
  b.panel(.058,.042,.014,.006,5,x,y,.007);
  b.rod([x,y,.013],[x,y,.102],.011,5);
  b.add(new T.TorusGeometry(.021,.004,5,14),5,[x,y,.10],rotateX(Math.PI/2));
 }
 for (const x of [-.31,0,.31]) {
  for (const [z,y] of [[.018,-.077],[.018,.068]]) b.panel(.18,.041,.036,.009,5,x,y,z);
  b.panel(.207,.215,.135,.042,2,x,-.009,.113);
  b.panel(.187,.191,.039,.032,1,x,-.004,.186);
  b.panel(.126,.063,.019,.012,2,x,.036,.211);
  b.panel(.105,.027,.005,.004,3,x,.039,.222);
  for (let i=0;i<5;i++) b.box(.007,.012,.0017,1,x-.034+i*.014,.039,.226);
  b.panel(.064,.025,.004,.003,4,x,-.057,.208);
  for (const offset of [-.078,.078]) bolt(b,x+offset,-.076,.200,2,.005);
  roundedPipe(b,[[x-.085,.26,.10],[x-.085,.18,.10],[x-.051,.15,.13],[x-.051,.09,.13]],.013,.027,0);
  roundedPipe(b,[[x+.057,-.105,.133],[x+.057,-.185,.133],[x+.098,-.223,.10],[x+.098,-.25,.10]],.014,.029,0);
  b.rod([x-.051,.094,.13],[x-.051,.132,.13],.024,4,6);
  b.rod([x+.057,-.142,.133],[x+.057,-.096,.133],.024,4,6);
  b.rod([x-.085,.196,.10],[x-.085,.219,.10],.022,0,8);
  b.panel(.064,.017,.017,.005,4,x-.085,.208,.122);
 }
 return finish(b,'gas-meter-bank','wall',[[-.31,-.077,0],[0,-.077,0],[.31,-.077,0],[.52,-.42,0]]);
}

export function createWallAc() {
 const b = builder('삼각 받침 벽붙이 실외기', [0xd5cec1,0xb8b8a9,steel,dark,0xc0bcb0,0x9c7769]);
 for (const x of [-.31,.29]) {
  b.panel(.043,.263,.022,.006,2,x,-.309,.011);
  b.bar([x,-.19,.015],[x,-.19,.374],.025,.026,2);
  b.bar([x,-.428,.017],[x,-.197,.351],.022,.023,2);
  b.panel(.09,.029,.073,.009,3,x,-.166,.277);
  for (const y of [-.217,-.41]) bolt(b,x,y,.024,2);
 }
 b.panel(.805,.355,.270,.035,1,0,.018,.234);
 // The sheet-metal face has a circular opening in front of the recessed fan.
 const face = new T.Shape();
 face.moveTo(-.358,-.145);
 face.lineTo(.357,-.145);
 face.quadraticCurveTo(.40,-.145,.40,-.108);
 face.lineTo(.40,.143);
 face.quadraticCurveTo(.40,.176,.363,.176);
 face.lineTo(-.358,.176);
 face.quadraticCurveTo(-.396,.176,-.396,.138);
 face.lineTo(-.396,-.108);
 face.quadraticCurveTo(-.396,-.145,-.358,-.145);
 const opening = new T.Path(Array.from({length:32},(_,i) => {
  const angle = i*Math.PI/16;
  return new T.Vector2(-.143+Math.cos(angle)*.151,.017+Math.sin(angle)*.151);
 }));
 face.holes.push(opening);
 b.add(new T.ExtrudeGeometry(face,{depth:.024,bevelEnabled:false,curveSegments:16}),0,[0,0,.369]);
 b.panel(.819,.046,.30,.017,0,0,.189,.229);
 const cx=-.143, cy=.017;
 b.rod([cx,cy,.371],[cx,cy,.378],.147,3,32);
 b.add(new T.TorusGeometry(.147,.008,6,32),1,[cx,cy,.398]);
 for (let i=0;i<5;i++) {
  const fan = new T.Shape();
  fan.moveTo(.015,0);
  fan.quadraticCurveTo(.080,.052,.118,.022);
  fan.quadraticCurveTo(.125,-.018,.018,-.024);
  fan.closePath();
  const blade = new T.ExtrudeGeometry(fan,{depth:.004,bevelEnabled:false,curveSegments:4});
  blade.rotateZ(i * Math.PI * .4);
  b.add(blade,2,[cx,cy,.382]);
 }
 for (const radius of [.042,.070,.098,.126]) b.add(new T.TorusGeometry(radius,.0024,4,30),4,[cx,cy,.402]);
 for (let i=0;i<8;i++) {
  const theta=i*Math.PI/4;
  b.rod([cx,cy,.405],[cx+Math.cos(theta)*.145,cy+Math.sin(theta)*.145,.405],.0025,4,5);
 }
 b.rod([cx,cy,.397],[cx,cy,.408],.027,4,16);
 for (let i=0;i<7;i++) {
  b.panel(.19,.009,.005,.003,2,.228,-.057+i*.024,.397);
  b.bar([.409,-.057+i*.024,.138],[.409,-.057+i*.024,.325],.006,.012,2);
 }
 b.panel(.062,.019,.004,.003,5,.228,.136,.397);
 roundedPipe(b,[[.382,-.075,.263],[.473,-.075,.263],[.473,-.205,.263],[.473,-.271,.105],[.414,-.271,.051],[.414,-.271,.010]],.018,.090,4);
 b.panel(.063,.075,.019,.013,1,.414,-.271,.010);
 return finish(b,'wall-ac','wall',[[-.31,-.217,0],[.29,-.217,0],[-.31,-.41,0],[.29,-.41,0]]);
}

export function createDrainElbow() {
 const b = builder('벽붙이 PVC 빗물 배수관', [0xc5c8bb,0xa3ada4,steel,dark]);
 roundedPipe(b,[[0,.84,.077],[0,-.77,.077],[0,-.77,.233]],.045,.134,0,16);
 b.rod([0,.615,.077],[0,.703,.077],.052,1,16);
 for (const y of [.45,-.46]) {
  b.panel(.138,.054,.017,.010,2,0,y,.0085);
  b.rod([0,y,.014],[0,y,.040],.020,2);
  b.add(new T.TorusGeometry(.046,.007,5,18),2,[0,y,.077],rotateX(Math.PI/2));
  for (const x of [-.051,.051]) bolt(b,x,y,.019,2,.006);
 }
 // Rolled outlet with an actual recessed opening and visible wall thickness.
 const rim = [[.040,.002],[.046,.002],[.051,.007],[.052,.024],[.048,.029],[.040,.029],[.040,.002]];
 b.add(new T.LatheGeometry(rim.map(([r,y]) => new T.Vector2(r,y)),24),1,[0,-.77,.218],rotateX(Math.PI/2));
 b.rod([0,-.77,.204],[0,-.77,.206],.039,3,20);
 return finish(b,'drain-elbow','wall',[[0,.45,0],[0,-.46,0]]);
}

export function createServiceBox() {
 const b = builder('낮은 벽붙이 계량함 2연', [0xb3a585,0xc9bc9b,0x5a665e,0x8b836c,dark]);
 for (const x of [-.118,.118]) {
  b.panel(.199,.237,.049,.013,3,x,0,.0245);
  b.panel(.204,.230,.099,.022,0,x,0,.080);
  b.panel(.198,.185,.048,.028,1,x,.013,.135);
  b.panel(.108,.065,.008,.014,3,x,.037,.160);
  b.panel(.087,.036,.004,.011,2,x,.039,.165);
  b.panel(.076,.036,.016,.010,3,x,-.070,.158);
  for (const z of [.04,.117]) b.rod([x-.092,-.052,z],[x-.092,.066,z],.009,3,8);
  for (const dx of [-.067,.067]) bolt(b,x+dx,-.061,.161,3,.006);
  roundedPipe(b,[[x,.115,.076],[x,.176,.076],[x,.176,.006]],.013,.026,2);
  b.panel(.054,.039,.014,.008,2,x,.176,.007);
 }
 return finish(b,'service-box','wall',[[-.118,0,0],[.118,0,0],[-.118,.176,0],[.118,.176,0]]);
}

function crate(b, y, material, trim) {
 const width=.43, depth=.315, height=.154;
 b.panel(width-.028,height*.17,depth-.03,.007,material,0,y+.015,0);
 for (const x of [-1,1]) for (const z of [-1,1]) {
  b.bar([x*.181,y+.009,z*.128],[x*.206,y+.149,z*.151],.025,.026,trim);
 }
 for (const side of [-1,1]) {
  const longRim = [[-.205,y+.147,side*.15],[.205,y+.147,side*.15]];
  const shortRim = [[side*.207,y+.147,-.150],[side*.207,y+.147,.150]];
  b.bar(...longRim,.027,.021,trim);
  b.bar(...shortRim,.024,.026,trim);
  b.bar([-.183,y+.036,side*.131],[.183,y+.036,side*.131],.019,.027,material);
  b.bar([side*.181,y+.038,-.131],[side*.181,y+.038,.131],.026,.026,material);
  for (const x of [-.148,-.089,-.030,.030,.089,.148]) {
   const top = Math.abs(x)<.09 ? y+.104 : y+.146;
   b.bar([x*.88,y+.020,side*.131],[x,top,side*.150],.014,.017,material);
  }
  b.bar([-.119,y+.104,side*.145],[.119,y+.104,side*.145],.013,.016,trim);
  for (const z of [-.102,-.054,0,.054,.102]) {
   const top = Math.abs(z)<.06 ? y+.104 : y+.146;
   b.bar([side*.182,y+.020,z*.88],[side*.205,top,z],.015,.014,material);
  }
  b.bar([side*.200,y+.104,-.075],[side*.200,y+.104,.075],.014,.015,trim);
 }
 for (const x of [-.16,.16]) for (const z of [-.112,.112]) {
  b.panel(.047,.014,.065,.006,trim,x,y+.007,z);
 }
}

export function createStackedCrates() {
 const b = builder('포개 놓은 플라스틱 바구니', [0x4c8b80,0x477367,0x6b8b9a,0x627780]);
 crate(b,0,0,1);
 crate(b,.156,2,3);
 return finish(b,'stacked-crates','ground',[[-.16,0,-.112],[-.16,0,.112],[.16,0,-.112],[.16,0,.112]]);
}

export function createCableJunction() {
 const b = builder('벽붙이 통신 접속함과 감은 인입선', [0xbac3b6,0x929e94,steel,dark,0x727d73]);
 b.panel(.193,.304,.025,.018,2,-.108,.138,.0125);
 b.panel(.183,.282,.086,.025,1,-.108,.138,.056);
 b.panel(.180,.270,.042,.032,0,-.108,.144,.105);
 b.panel(.131,.110,.006,.013,1,-.108,.153,.128);
 b.panel(.032,.045,.013,.006,4,-.040,.063,.133);
 for (const y of [.245,.072]) bolt(b,-.174,y,.130,2,.006);
 b.rod([-.108,-.034,.063],[-.108,-.001,.063],.019,2,8);
 b.rod([-.135,.281,.063],[-.135,.317,.063],.014,2,8);
 roundedPipe(b,[[-.135,.305,.063],[-.135,.405,.063],[-.135,.498,.010]],.009,.041,3);
 const cable = [];
 for (let i=0;i<=37;i++) {
  const progress=i/37, theta=progress*4.65*Math.PI;
  cable.push(new T.Vector3(.117+Math.sin(theta)*.098,-.112+Math.cos(theta)*.139,.061+progress*.041));
 }
 cable.unshift(vector([-.108,-.026,.063]),vector([-.09,-.056,.066]),vector([.044,.021,.059]));
 cable.push(vector([.183,-.19,.126]),vector([.200,-.273,.096]),vector([.200,-.44,.014]));
 b.add(new T.TubeGeometry(new T.CatmullRomCurve3(cable),74,.007,8),3);
 for (const [x,y,z] of [[.126,.011,.079],[.201,-.267,.092],[-.135,.409,.063]]) {
  b.panel(.047,.033,.014,.006,2,x,y,.007);
  b.rod([x,y,.014],[x,y,z],.006,2);
  b.panel(.028,.015,.018,.004,4,x,y,z);
 }
 return finish(b,'cable-junction','wall',[[-.108,.138,0],[.126,.011,0],[.201,-.267,0]]);
}

function lampShape(scale) {
 const point = (x,z) => [x*scale,z*scale];
 const shape = new T.Shape();
 shape.moveTo(...point(-.056,-.224));
 shape.quadraticCurveTo(...point(-.082,-.209),...point(-.090,-.169));
 shape.lineTo(...point(-.133,.044));
 shape.quadraticCurveTo(...point(-.151,.130),...point(-.112,.193));
 shape.quadraticCurveTo(...point(0,.257),...point(.112,.193));
 shape.quadraticCurveTo(...point(.151,.130),...point(.133,.044));
 shape.lineTo(...point(.090,-.169));
 shape.quadraticCurveTo(...point(.082,-.209),...point(.056,-.224));
 shape.closePath();
 return shape;
}

export function createSecurityLamp({poleRadius=0, reach=.98, emissiveIntensity=0}={}) {
 const reachOffset = Math.max(.70,reach)-.98;
 const b = builder('타원형 LED 골목 보안등',[0x657474,0x415252,0x788688,0x4d5b5d,0xd8e0cf,0xece9cb]);
 if (poleRadius > 0) {
  for (const y of [-.091,.091]) {
   b.add(new T.LatheGeometry([[poleRadius,y-.016],[poleRadius+.008,y-.016],[poleRadius+.008,y+.016],[poleRadius,y+.016],[poleRadius,y-.016]].map(
    ([r,h]) => new T.Vector2(r,h)),28),2,[0,0,-poleRadius]);
   b.panel(.053,.046,.027,.006,2,.04,y,.012);
   bolt(b,.051,y,.029,3);
  }
 }
 b.panel(.136,.246,.031,.022,1,0,0,.0155);
 for (const x of [-.043,.043]) for (const y of [-.089,.089]) bolt(b,x,y,.032,2,.007);
 roundedPipe(b,[[0,-.047,.044],[0,.100,.068],[0,.308,.235],[0,.374,.424+reachOffset],[0,.374,.581+reachOffset]],.025,.14,0,14);
 b.rod([0,-.051,.026],[0,-.051,.067],.046,2,12);
 b.rod([0,.374,.480+reachOffset],[0,.374,.626+reachOffset],.035,2,14);
 const head = [0,.358,.744+reachOffset];
 const shell = new T.ExtrudeGeometry(lampShape(1),{depth:.036,bevelEnabled:true,bevelSize:.012,bevelThickness:.014,bevelSegments:2,curveSegments:5});
 shell.rotateX(Math.PI/2);
 b.add(shell,0,head);
 const bezel = new T.ExtrudeGeometry(lampShape(.90),{depth:.010,bevelEnabled:false,curveSegments:5});
 bezel.rotateX(Math.PI/2);
 b.add(bezel,1,[0,.309,head[2]]);
 const lens = new T.ExtrudeGeometry(lampShape(.69),{depth:.006,bevelEnabled:true,bevelSize:.004,bevelThickness:.002,bevelSegments:1,curveSegments:5});
 lens.rotateX(Math.PI/2);
 b.add(lens,4,[0,.301,head[2]+.031]);
 for (let i=0;i<5;i++) {
  const z=.648+i*.047+reachOffset;
  b.panel(.112+i*.013,.012,.016,.003,2,0,.378,z);
 }
 for (const x of [-.028,0,.028]) for (let row=0;row<5;row++) {
  b.rod([x,.290,.701+row*.032+reachOffset],[x,.294,.701+row*.032+reachOffset],.008,5,8);
 }
 const root = finish(b,'security-lamp',poleRadius>0?'pole':'wall',[[0,-.091,0],[0,.091,0]],{lightOrigin:[0,.286,.771+reachOffset]});
 for(const emitter of root.children.slice(-2)){
  emitter.userData.lampEmitter = true;
  emitter.material.emissive.setHex(0xffe3ae);
  emitter.material.emissiveIntensity = emissiveIntensity;
 }
 return root;
}

export function createStormGrate() {
 const b = builder('직사각 골목 빗물받이', [0x777d70,0x48534e,0x657169,0x303a34]);
 const width=.49, depth=.365;
 b.box(width-.058,.009,depth-.057,3,0,.0045,0);
 for (const x of [-.225,.225]) b.box(.04,.039,depth,0,x,.0195,0);
 for (const z of [-.162,.162]) b.box(width-.08,.039,depth-.324,0,0,.0195,z);
 for (const x of [-.196,.196]) b.box(.019,.026,.301,1,x,.020,0);
 for (const z of [-.142,.142]) b.box(.385,.025,.019,1,0,.020,z);
 for (let i=0;i<11;i++) {
  const x=-.175+i*.035;
  b.bar([x-.015,.030,-.135],[x+.015,.030,.135],.014,.019,i%3===0?2:1);
 }
 for (const z of [-.066,.066]) b.box(.385,.013,.012,2,0,.022,z);
 for (const x of [-.225,.225]) for (const z of [-.142,.142]) {
  b.rod([x,.037,z],[x,.040,z],.009,1,8);
 }
 return finish(b,'storm-grate','ground',[[-.225,0,-.162],[.225,0,-.162],[-.225,0,.162],[.225,0,.162]]);
}

export const grade1Factories = Object.freeze({
 'gas-meter-bank': createGasMeterBank,
 'wall-ac': createWallAc,
 'drain-elbow': createDrainElbow,
 'service-box': createServiceBox,
 'stacked-crates': createStackedCrates,
 'cable-junction': createCableJunction,
 'security-lamp': createSecurityLamp,
 'storm-grate': createStormGrate,
});
