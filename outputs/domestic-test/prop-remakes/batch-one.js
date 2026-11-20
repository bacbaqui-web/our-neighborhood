import * as T from 'three';
import {builder} from './mesh-tools.js';
const metal=0xaab9b4,rubber=0x34413f,green=0x567166;
const corners=(x,z)=>[[-x,0,-z],[x,0,-z],[-x,0,z],[x,0,z]];
function finish(b,key,old,contacts,extra={}){return b.finish({assetId:`prototype:${key}-v1`,replacementFor:`road:${old}`,outlineOwner:`prototype:${key}-v1`,support:'ground',contactPoints:contacts,...extra});}
function flatRound(b,w,d,h,r,i,x,y,z){const s=new T.Shape(),a=-w/2,c=-d/2;s.moveTo(a+r,c);s.lineTo(a+w-r,c);s.quadraticCurveTo(a+w,c,a+w,c+r);s.lineTo(a+w,c+d-r);s.quadraticCurveTo(a+w,c+d,a+w-r,c+d);s.lineTo(a+r,c+d);s.quadraticCurveTo(a,c+d,a,c+d-r);s.lineTo(a,c+r);s.quadraticCurveTo(a,c,a+r,c);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:3});g.rotateX(-Math.PI/2);b.add(g,i,[x,y-h/2,z]);}
function wheels(b,x,z,r=.055){const points=corners(x,z);for(const [cx,,cz] of points){b.add(new T.CylinderGeometry(r,r,.032,12),2,[cx,r,cz],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2));for(const dx of[-.022,.022])b.box(.008,.065,.045,0,cx+dx,r+.025,cz);b.rod([cx,r+.04,cz],[cx,r*2+.045,cz],.012,0);}return points;}
export function createCone(){
 const b=builder('안전 고깔',[0xc97843,0xe0ded0,rubber]);flatRound(b,.38,.38,.045,.045,2,0,.0225,0);
 const rings=[[.045,.16],[.09,.15],[.29,.105],[.40,.080],[.52,.053],[.62,.029],[.68,.025]];
 for(let i=1;i<rings.length;i++){const [y0,r0]=rings[i-1],[y1,r1]=rings[i];b.add(new T.CylinderGeometry(r1,r0,y1-y0,24,1,true),i===3||i===5?1:0,[0,(y0+y1)/2,0]);}
 b.add(new T.TorusGeometry(.021,.004,4,24),0,[0,.68,0],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));b.add(new T.CylinderGeometry(.017,.017,.018,24),2,[0,.665,0]);
 return finish(b,'cone','a46',corners(.14,.14));
}
export function createLadder(){
 const b=builder('알루미늄 사다리',[metal,0x788b85,rubber]);
 for(const x of[-.195,.195]){b.box(.028,2.08,.065,0,x,1.10,0);b.box(.045,.06,.085,2,x,.03,0);b.box(.036,.025,.075,2,x,2.1525,0);}
 for(let i=0;i<7;i++){const y=.27+i*.275;b.box(.37,.027,.066,0,0,y,0);for(const z of[-.021,0,.021])b.box(.365,.003,.003,1,0,y+.015,z);for(const x of[-.176,.176])b.box(.012,.065,.071,1,x,y,0);}
 return finish(b,'ladder','a49',corners(.195,.025),{support:'leaning',placementNote:'벽에 기대어 배치하는 사다리. 비교에서는 세워 전시.'});
}
export function createStall(){
 const b=builder('접이식 판매대',[metal,0xc2c4ac,rubber]);flatRound(b,1.20,.60,.038,.035,1,0,.762,0);
 for(const z of[-.23,.23]){for(const side of[-1,1]){b.rod([side*.43,.035,z],[-side*.43,.74,z],.018,0);b.box(.065,.035,.065,2,side*.43,.0175,z);}b.rod([0,.39,z-.025],[0,.39,z+.025],.026,2,8);}
 for(const x of[-.43,.43]){b.rod([x,.735,-.23],[x,.735,.23],.017,0);b.rod([x,.035,-.23],[x,.035,.23],.014,0);}
 return finish(b,'stall','a51',corners(.43,.23));
}
export function createBasins(){
 const b=builder('포갠 플라스틱 대야',[0x9b6556,0x628985,0xc5b69a]);
 for(let i=0;i<3;i++){const offset=i*.045,points=[[0,.006],[.185,.006],[.20,.02],[.27,.17],[.285,.18],[.287,.19],[.27,.196],[.258,.184],[.19,.035],[0,.035]].map(([r,y])=>new T.Vector2(r,y+offset-.006));b.add(new T.LatheGeometry(points,32),i);}
 return finish(b,'basins','a54',corners(.12,.12));
}
export function createBox(){
 const b=builder('열린 골판지상자',[0xb69b72,0xa88b64,0xc3ac83]);
 b.box(.50,.006,.36,1,0,.003,0);for(const x of[-.247,.247])b.box(.006,.32,.36,0,x,.166,0);for(const z of[-.177,.177])b.box(.488,.32,.006,0,0,.166,z);
 const flap=(w,h,d,x,y,z,axis,angle,i)=>{const g=new T.BoxGeometry(w,h,d);b.add(g,i,[x,y,z],new T.Quaternion().setFromAxisAngle(new T.Vector3(...axis),angle));};
 for(const side of[-1,1]){const a=side*.60,L=.17;flap(.488,.006,L,0,.326+Math.sin(Math.abs(a))*L/2,side*(.177+Math.cos(a)*L/2),[1,0,0],-a,2);const L2=.20,a2=side*.45;flap(L2,.006,.348,side*(.247+Math.cos(a2)*L2/2),.326+Math.sin(Math.abs(a2))*L2/2,0,[0,0,1],a2,0);}
 b.box(.055,.001,.35,2,0,.007,0);
 return finish(b,'open-box','a58',corners(.20,.14));
}
export function createSink(){
 const b=builder('야외 싱크대',[metal,0x7f9691,rubber]);
 // Real open bowl: sloping wall plates and a recessed bottom, never a dark filled box.
 for(const x of[-.36,.36])for(const z of[-.23,.23]){b.box(.035,.73,.035,0,x,.385,z);b.box(.043,.02,.043,2,x,.01,z);}
 for(const z of[-.23,.23])b.rod([-.36,.24,z],[.36,.24,z],.012,0);for(const x of[-.36,.36])b.rod([x,.24,-.23],[x,.24,.23],.012,0);
 for(let i=0;i<6;i++)b.rod([-.30+i*.12,.24,-.23],[-.30+i*.12,.24,.23],.006,0);
 for(const x of[-.337,.337])b.box(.126,.025,.58,0,x,.785,0);for(const z of[-.25,.25])b.box(.55,.025,.08,0,0,.785,z);
 // Continuous rounded basin shell keeps the four corners joined.
 const vertices=[],indices=[],rings=[[.56,.44,.795,.045],[.43,.31,.574,.04],[.415,.295,.588,.035],[.544,.424,.795,.04]];
 for(const [w,d,y,r] of rings)for(let q=0;q<4;q++)for(let j=0;j<5;j++){const angle=(q+j/4)*Math.PI/2,cx=(q===0||q===3?1:-1)*(w/2-r),cz=(q<2?1:-1)*(d/2-r);vertices.push(cx+Math.cos(angle)*r,y,cz+Math.sin(angle)*r);}
 for(let ring=0;ring<4;ring++)for(let j=0;j<20;j++){const a=ring*20+j,c=ring*20+(j+1)%20,d=((ring+1)%4)*20+j,e=((ring+1)%4)*20+(j+1)%20;indices.push(a,c,d,c,e,d);}
 const bowl=new T.BufferGeometry();bowl.setAttribute('position',new T.Float32BufferAttribute(vertices,3));bowl.setIndex(indices);bowl.computeVertexNormals();bowl.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));b.add(bowl,0);
 flatRound(b,.43,.31,.014,.04,0,0,.581,0);
 b.box(.80,.15,.022,0,0,.86,-.279);b.add(new T.CylinderGeometry(.026,.026,.002,16),2,[0,.588,0]);
 const pipe=[[0,.58,0],[0,.40,0],[0,.34,-.05],[0,.34,-.14],[0,.46,-.18],[0,.46,-.28]];for(let i=1;i<pipe.length;i++)b.rod(pipe[i-1],pipe[i],.019,1,8);
 const tap=[[0,.80,-.24],[0,1.02,-.24],[0,1.065,-.20],[0,1.065,-.10],[0,1.02,-.07]];for(let i=1;i<tap.length;i++)b.rod(tap[i-1],tap[i],.012,0,8);b.rod([-.07,.86,-.24],[.07,.86,-.24],.008,1);
 return finish(b,'sink','a81',corners(.36,.23));
}
export function createDolly(){
 const b=builder('운반대차',[metal,0x587a69,rubber]);const contacts=wheels(b,.24,.34,.065);flatRound(b,.63,.88,.055,.045,1,0,.19,0);
 for(const x of[-.23,.23]){b.rod([x,.205,-.34],[x,.85,-.38],.018,0);b.rod([x,.85,-.38],[x*.90,.91,-.38],.018,0);b.box(.065,.045,.09,0,x,.225,-.34);}
 b.rod([-.207,.91,-.38],[.207,.91,-.38],.023,2,10);b.rod([-.23,.56,-.36],[.23,.56,-.36],.014,0);
 for(const x of[-.20,-.10,0,.10,.20])b.box(.014,.003,.65,1,x,.219,.025);
 return finish(b,'dolly','a88',contacts);
}
export function createDryingRack(){
 const b=builder('접이식 빨래건조대',[metal,green,rubber]);
 for(const z of[-.25,.25]){for(const side of[-1,1]){b.rod([side*.38,.025,z],[-side*.38,.86,z],.012,0);b.box(.055,.025,.055,2,side*.38,.0125,z);}b.rod([0,.44,z-.02],[0,.44,z+.02],.021,1,8);}
 const frame=(x0,y0,x1,y1)=>{for(const z of[-.29,.29])b.rod([x0,y0,z],[x1,y1,z],.012,0);b.rod([x0,y0,-.29],[x0,y0,.29],.012,0);b.rod([x1,y1,-.29],[x1,y1,.29],.012,0);for(let i=1;i<7;i++){const t=i/7;b.rod([x0+(x1-x0)*t,y0+(y1-y0)*t,-.29],[x0+(x1-x0)*t,y0+(y1-y0)*t,.29],.0045,0);}};
 frame(-.40,.86,.40,.86);frame(-.40,.86,-.86,1.05);frame(.40,.86,.86,1.05);
 for(const side of[-1,1])for(const z of[-.25,.25])b.rod([side*.17,.63,z],[side*.69,.98,z],.006,0);
 return finish(b,'drying-rack','a93',corners(.38,.25));
}
export function createPallet(){
 const b=builder('목재 운반 팔레트',[0xb39f7b,0xa18c69,0x8a785f]);
 for(const z of[-.30,0,.30])b.box(1.20,.022,.145,1,0,.011,z);
 for(const x of[-.50,0,.50])for(const z of[-.30,0,.30])b.box(.145,.078,.145,2,x,.061,z);
 for(const x of[-.50,0,.50])b.box(.145,.022,.80,1,x,.111,0);
 for(let i=0;i<5;i++)b.box(1.20,.022,i%2?.10:.145,i%2?1:0,0,.133,-.3275+i*.16375);
 return finish(b,'pallet','a146',corners(.50,.30));
}
export function createTrayRack(){
 const b=builder('제빵 트레이랙',[metal,0x849a92,rubber]);const contacts=wheels(b,.26,.32,.055);
 for(const x of[-.26,.26])for(const z of[-.32,.32])b.box(.025,1.43,.025,0,x,.865,z);
 for(const y of[.16,1.57]){for(const z of[-.32,.32])b.box(.545,.025,.025,0,0,y,z);for(const x of[-.26,.26])b.box(.025,.025,.665,0,x,y,0);}
 for(let i=0;i<12;i++){const y=.26+i*.10;for(const x of[-.245,.245]){b.box(.045,.008,.63,0,x,y,0);b.box(.008,.025,.63,0,x+Math.sign(x)*.018,y+.014,0);}}
 for(const y of[.365,.765,1.165]){b.box(.48,.008,.61,1,0,y,0);for(const z of[-.30,.30])b.box(.48,.018,.009,0,0,y+.01,z);for(const x of[-.235,.235])b.box(.009,.018,.60,0,x,y+.01,0);}
 b.rod([-.26,.20,-.333],[.26,1.55,-.333],.008,0);b.rod([-.26,1.55,-.333],[.26,.20,-.333],.008,0);
 return finish(b,'tray-rack','a176',contacts);
}
export const batchOneFactories={cone:createCone,ladder:createLadder,stall:createStall,basins:createBasins,'open-box':createBox,sink:createSink,dolly:createDolly,'drying-rack':createDryingRack,pallet:createPallet,'tray-rack':createTrayRack};
