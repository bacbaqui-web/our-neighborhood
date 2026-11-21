import * as T from 'three';
import {builder} from './mesh-tools.js';


export function createBusStop(){
 const b=builder('버스정류장 표지 기둥',[0x3a534e,0x537c64,0xd8dfce,0x8c9e96]);
 b.box(.16,.035,.17,0,0,.0175,0);b.panel(.09,2.25,.075,.015,0,0,1.16,0);
 b.panel(.42,.47,.09,.045,1,0,2.205,.015);
 b.panel(.33,.27,.008,.035,2,0,2.23,.065);
 // A pictogram, without route names or lettering.
 b.panel(.15,.12,.006,.02,0,0,2.24,.072);b.box(.115,.054,.006,2,0,2.257,.078);
 for(const x of[-.045,.045])b.box(.023,.026,.008,0,x,2.168,.073);
 b.panel(.33,.94,.065,.018,0,0,1.39,.035);b.panel(.285,.885,.008,.008,2,0,1.39,.072);
 for(const y of[1.68,1.49,1.3]){b.box(.24,.09,.004,3,0,y,.079);b.box(.024,.09,.006,1,-.109,y,.082);}
 b.box(.24,.035,.004,1,0,1.07,.079);
 return b.finish({assetId:'prototype:bus-stop-v1',replacementFor:'road:a68',support:'ground',contactPoints:[[-.08,0,-.085],[.08,0,-.085],[-.08,0,.085],[.08,0,.085]]});
}
export function createManhole(){
 const b=builder('원형 맨홀뚜껑',[0x4a504b,0x656d62,0x303b37]);
 // Origin is pavement level: the body embeds below ground, not a raised puck.
 b.add(new T.CylinderGeometry(.345,.345,.05,48),0,[0,-.025,0]);
 b.add(new T.CylinderGeometry(.317,.317,.003,48),2,[0,.0015,0]);
 b.add(new T.CylinderGeometry(.307,.307,.004,48),1,[0,.004,0]);
 for(let ix=-4;ix<=4;ix++)for(let iz=-4;iz<=4;iz++){
  const x=ix*.061,z=iz*.061;if(Math.hypot(x,z)>.272||Math.hypot(x,z)<.065)continue;
  const a=[x-.012,.008,z-.006],c=[x+.012,.008,z+.006];b.bar(a,c,.009,.004,0);
 }
 b.add(new T.CylinderGeometry(.05,.05,.003,24),0,[0,.008,0]);
 for(const x of[-.245,.245])b.box(.038,.002,.014,2,x,.009,0);
 return b.finish({assetId:'prototype:manhole-v1',replacementFor:'road:a75',support:'embedded',surfaceY:0,embedDepth:.05,contactPoints:[[-.34,0,0],[.34,0,0],[0,0,-.34],[0,0,.34]]});
}
export function createSecurityGate(){
 const b=builder('접이식 격자 방범문',[0xb4bfb1,0x74877b,0x35433e]);
 const w=1.42,h=2.02;
 for(const x of[-w/2,w/2])b.box(.045,h,.055,1,x,h/2,0);
 for(const y of[.025,h-.025]){b.box(w,.05,.06,1,0,y,0);b.box(w-.08,.012,.015,2,0,y,.033);}
 // Each crossed link spans a bay; pins bridge the two depth layers.
 for(let i=0;i<6;i++){const x=-.66+i*.22;
  for(let j=0;j<3;j++){const lo=.09+j*.61,hi=lo+.61;
   b.bar([x,lo,.016],[x+.22,hi,.016],.018,.012,0);b.bar([x,hi,-.016],[x+.22,lo,-.016],.018,.012,0);
   b.rod([x+.11,(lo+hi)/2,-.025],[x+.11,(lo+hi)/2,.025],.009,1);
  }
  for(let j=0;j<=3;j++)b.rod([x,.09+j*.61,-.025],[x,.09+j*.61,.025],.009,1);
 }
 b.box(.042,1.9,.05,1,.60,1.01,.045);b.panel(.057,.15,.018,.006,2,.60,1.02,.079);
 b.rod([.60,1.08,.089],[.60,1.08,.13],.009,0);b.rod([.60,.98,.13],[.60,1.08,.13],.009,0);b.rod([.60,.98,.089],[.60,.98,.13],.009,0);
 return b.finish({assetId:'prototype:security-gate-v1',replacementFor:'road:a133',support:'opening',contactPoints:[[-.71,0,0],[.71,0,0]],mountPlaneZ:-.03});
}
export function createAntenna(){
 const b=builder('옥외 TV 안테나',[0xaab6b1,0x697c76,0x303d3c]);
 b.box(.22,.016,.22,1,0,.008,0);b.rod([0,.016,0],[0,1.35,0],.023,0,10);
 for(const x of[-.07,.07])for(const z of[-.07,.07])b.add(new T.CylinderGeometry(.012,.012,.008,6),2,[x,.020,z]);
 b.bar([0,1.26,-.30],[0,1.26,.90],.027,.027,0);
 for(let i=0;i<7;i++){const z=-.04+i*.145,len=.39-i*.026;b.rod([-len/2,1.27,z],[len/2,1.27,z],.007,0);b.box(.027,.026,.025,1,0,1.27,z);}
 b.rod([-.58,1.26,-.23],[.58,1.26,-.23],.009,0);
 // V reflector arms and their transverse rods.
 for(const s of[-1,1]){
  b.bar([0,1.26,-.18],[0,1.26+s*.35,-.48],.021,.025,0);
  for(let i=1;i<=3;i++)b.rod([-.25,1.26+s*i*.115,-.18-i*.1],[.25,1.26+s*i*.115,-.18-i*.1],.007,0);
 }
 b.box(.07,.065,.09,2,0,1.21,-.12);b.box(.07,.09,.05,1,0,1.20,.01);
 const cable=[[.025,1.20,-.12],[.05,1.09,-.13],[.04,1.02,-.04],[.025,.08,-.025]];
 for(let i=0;i<cable.length-1;i++)b.rod(cable[i],cable[i+1],.004,2);
 return b.finish({assetId:'prototype:antenna-v1',replacementFor:'road:a156',support:'roof',contactPoints:[[-.11,0,-.11],[.11,0,-.11],[-.11,0,.11],[.11,0,.11]]});
}
export function createDoorLock(){
 const b=builder('손잡이형 디지털 도어록',[0x9aaba2,0x273637,0x637f78]);
 // Back face sits on z=0; origin is the centre of the exterior mounting plate.
 b.panel(.075,.305,.024,.016,0,0,0,.012);b.panel(.062,.276,.009,.012,1,0,0,.0285);
 b.panel(.048,.135,.002,.007,2,0,.051,.034);
 for(let row=0;row<4;row++)for(let col=0;col<3;col++)b.panel(.007,.006,.001,.002,0,(col-1)*.014,.09-row*.022,.0355);
 b.panel(.024,.009,.002,.003,0,0,-.006,.0355);
 b.rod([0,-.075,.031],[0,-.075,.065],.018,0,12);
 b.panel(.125,.022,.024,.009,1,.045,-.075,.071);
 // Opposite side and concealed latch are intentionally separate future assembly parts.
 return b.finish({assetId:'prototype:door-lock-v1',replacementFor:'road:a168',support:'door',mountPlaneZ:0,contactPoints:[],mountPoints:[[-.02,.12,0],[.02,-.12,0]],suggestedInstallHeight:1.10});
}
export function createCart(){
 const b=builder('소형 철망 쇼핑카트',[0xaebbb5,0x3d6256,0x303b3b]);
 const contacts=[];
 for(const x of[-.22,.22])for(const z of[-.28,.28]){
  b.rod([x,.075,z],[x,.16,z],.013,0);
  for(const dx of[-.025,.025])b.box(.009,.055,.055,0,x+dx,.067,z);
  b.add(new T.CylinderGeometry(.05,.05,.038,12),2,[x,.05,z],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2));contacts.push([x,0,z]);
 }
 for(const x of[-.22,.22]){
  b.rod([x,.155,-.28],[x,.155,.28],.014,0);
  b.rod([x,.155,-.28],[x,.89,-.36],.014,0);
  b.rod([x,.81,-.351],[Math.sign(x)*.25,.81,-.32],.012,0);
  b.rod([x,.30,-.295],[Math.sign(x)*.155,.46,.25],.012,0);
 }
 b.rod([-.22,.155,.28],[.22,.155,.28],.014,0);b.rod([-.22,.89,-.36],[.22,.89,-.36],.022,1,10);
 // Tapered basket, open at the top. +Z is the front of the cart.
 const bottom=[[-.175,.46,-.25],[.175,.46,-.25],[.155,.46,.25],[-.155,.46,.25]];
 const top=[[-.25,.81,-.32],[.25,.81,-.32],[.22,.81,.32],[-.22,.81,.32]];
 const lerp=(a,c,t)=>a.map((v,k)=>v+(c[k]-v)*t);
 for(let side=0;side<4;side++){
  const n=(side+1)%4;b.rod(top[side],top[n],.009,0);b.rod(bottom[side],bottom[n],.007,0);
  const divisions=side%2?9:7;
  for(let i=0;i<=divisions;i++)b.rod(lerp(bottom[side],bottom[n],i/divisions),lerp(top[side],top[n],i/divisions),.003,0,4);
  for(let j=1;j<5;j++)b.rod(lerp(bottom[side],top[side],j/5),lerp(bottom[n],top[n],j/5),.003,0,4);
 }
 for(let i=1;i<7;i++)b.rod(lerp(bottom[0],bottom[1],i/7),lerp(bottom[3],bottom[2],i/7),.003,0,4);
 for(let i=1;i<9;i++)b.rod(lerp(bottom[0],bottom[3],i/9),lerp(bottom[1],bottom[2],i/9),.003,0,4);
 // Small blank handle-end caps; no advertising plate or lettering.
 for(const x of[-.23,.23])b.box(.04,.055,.048,1,x,.884,-.36);
 return b.finish({assetId:'prototype:cart-v1',replacementFor:'road:a181',support:'ground',contactPoints:contacts});
}
export const remainingFactories={'bus-stop':createBusStop,manhole:createManhole,'security-gate':createSecurityGate,antenna:createAntenna,'door-lock':createDoorLock,cart:createCart};
