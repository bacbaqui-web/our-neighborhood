import * as T from 'three';
import {signLetter} from './sign-lettering.js';
import {builder} from '../prop-remakes/mesh-tools.js';
const QX=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2),QZ=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2);
const silver=0xaeb8b6,white=0xe3e5db,dark=0x303636,red=0xbb4437,orange=0xe86b2e,yellow=0xe1c83d,green=0x81a758;
const corners=(x,z)=>[[-x,0,-z],[x,0,-z],[-x,0,z],[x,0,z]];
function finish(b,key,contacts,extra={}){return b.finish({assetId:key,units:'m',front:'+Z',status:'reference-modeled',support:'ground',contactPoints:contacts,dimensions:'inferred unless specified',...extra});}
function lathe(b,points,i,n=40){b.add(new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),n),i);}
function ring(b,r,t,i,x,y,z,q=QX){b.add(new T.TorusGeometry(r,t,6,40),i,[x,y,z],q);}
function disk(b,r,h,i,x,y,z,q=new T.Quaternion(),n=40){b.add(new T.CylinderGeometry(r,r,h,n),i,[x,y,z],q);}
function flat(b,w,d,h,r,i,y){const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:5});g.rotateX(-Math.PI/2);b.add(g,i,[0,y,0]);}
function tubePath(b,points,r,i){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));b.add(new T.TubeGeometry(curve,Math.max(12,points.length*3),r,8,false),i);}
export function cone(){const b=builder('주황 안전 고깔 · 승인 사진',[orange,white,dark]);flat(b,.4,.4,.024,.025,0,0);disk(b,.168,.012,0,0,.03,0);const pts=[[.036,.158],[.39,.092],[.46,.079],[.57,.059],[.64,.046],[.742,.027]];for(let j=1;j<pts.length;j++){const [y0,r0]=pts[j-1],[y1,r1]=pts[j];b.add(new T.CylinderGeometry(r1,r0,y1-y0,40,1,true),j===2||j===4?1:0,[0,(y0+y1)/2,0]);}ring(b,.024,.004,0,0,.746,0);b.add(new T.CylinderGeometry(.020,.020,.025,32,1,true),0,[0,.733,0]);disk(b,.020,.002,2,0,.719,0);return finish(b,'road:a46',corners(.16,.16));}
export function bus(){const b=builder('마포 마을버스 정류장 · 사용자 사진',[green,white,0x386d59,0xb8c3b6,silver]);for(const x of[-.045,.045])b.rod([x,0,0],[x,1.92,0],.022,0,12);
 // Outer tubular frame with rounded corners, attached to the double post at its foot.
 const x=.295,lo=1.71,hi=3.18,r=.065;
 for(const side of[-1,1])b.rod([side*x,lo+r,0],[side*x,hi-r,0],.014,0,12);
 for(const y of[lo,hi])b.rod([-x+r,y,0],[x-r,y,0],.014,0,12);
 for(const [cx,cy,start] of [[x-r,hi-r,0],[-x+r,hi-r,Math.PI/2],[-x+r,lo+r,Math.PI],[x-r,lo+r,Math.PI*1.5]]){const ps=[];for(let k=0;k<=8;k++){let a=start+k*Math.PI/16;ps.push([cx+r*Math.cos(a),cy+r*Math.sin(a),0]);}tubePath(b,ps,.014,0);}
 for(const [y,h,mat] of [[2.92,.44,0],[2.43,.49,1],[1.94,.32,1]]){b.panel(.52,h,.018,.014,mat,0,y,0);for(const xx of[-.278,.278])b.box(.035,.018,.022,4,xx,y,0);}
 // Bus silhouette, without lettering or advertising.
 b.panel(.25,.14,.004,.025,1,0,2.98,.012);b.box(.18,.055,.005,2,0,2.999,.016);for(const xx of[-.074,.074]){b.box(.045,.027,.006,2,xx,2.94,.016);disk(b,.018,.008,2,xx,2.90,.015,QX,12);}
 b.box(.45,.085,.004,2,0,2.78,.012);b.box(.43,.065,.004,0,0,2.60,.012);
 function route(y,w,h){b.box(w,h,.018,1,0,y,.022);b.box(w*.16,h,.004,0,-w*.42,y,.034);for(let i=0;i<3;i++){const yy=y-h*.3+i*h*.28;b.box(w*.67,.005,.004,3,w*.05,yy,.035);for(let j=0;j<6;j++)disk(b,.006,.004,2,-w*.24+j*w*.105,yy,.039,QX,8);}}
 route(2.35,.45,.22);route(1.08,.36,.72);b.box(.36,.075,.005,0,0,.79,.036);b.panel(.18,.20,.018,.008,0,0,.58,.025);
 return finish(b,'road:a68',[[-.045,0,0],[.045,0,0]].map(p=>p),{referenceNote:'사용자 제공 마포 마을버스 사진, 문구 생략'});}
export function barrier(){const b=builder('은색 접이식 바리케이드',[silver,red,dark,0x7c8987]);const contacts=[];
 for(let j=0;j<7;j++){const x=-1.5+j*.5;for(const z of[-.08,.08]){b.rod([x,.17,z],[x,1.12,z],.014,0,10);for(const y of[.40,.72,.98])b.box(.032,.13,.032,1,x,y,z);}const ps=[];for(let k=0;k<=12;k++){const a=k*Math.PI/12;ps.push([x,1.12+.08*Math.sin(a),.08*Math.cos(a)]);}tubePath(b,ps,.014,0);
 if(j===0||j===3||j===6){b.box(.06,.025,.40,0,x,.133,0);for(const z of[-.18,.18]){b.rod([x,.13,z],[x,.083,z],.012,0);for(const dx of[-.026,.026])b.box(.009,.046,.045,0,x+dx,.075,z);disk(b,.045,.036,2,x,.045,z,QZ,16);disk(b,.017,.041,0,x,.045,z,QZ,12);contacts.push([x,0,z]);}}}
 for(let j=0;j<6;j++){const x=-1.5+j*.5;for(const [ya,yb,z] of [[.28,.98,.096],[.98,.28,.073]])b.bar([x,ya,z],[x+.5,yb,z],.027,.012,0);for(const [xx,y]of[[x,.28],[x,.98],[x+.25,.63]])disk(b,.018,.025,3,xx,y,.10,QX,12);
 // Chain represented by linked small alternating loops.
 for(let k=0;k<17;k++){const t=k/16;const y=.28-.14*Math.sin(Math.PI*t);b.add(new T.TorusGeometry(.010,.0023,4,8),0,[x+.5*t,y,-.08],k%2?QX:new T.Quaternion());}}
 return finish(b,'road:a72',contacts);}
export function manhole(){const b=builder('원형 주물 맨홀',[0x555b59,0x414745,0x666d68]);lathe(b,[[.27,0],[.33,0],[.33,.018],[.307,.03],[.307,.058],[.29,.058],[.29,.025],[.27,.025],[.27,0]],0,64);disk(b,.288,.026,1,0,.037,0);ring(b,.281,.003,2,0,.052,0);ring(b,.087,.003,2,0,.052,0);
 for(let i=0;i<36;i++){const a=i*Math.PI/18;const g=new T.BoxGeometry(.024,.004,.014);g.rotateY(-a);b.add(g,2,[.254*Math.sin(a),.052,.254*Math.cos(a)]);}
 for(let ix=-4;ix<=4;ix++)for(let iz=-4;iz<=4;iz++){let x=ix*.042,z=iz*.042,r=Math.hypot(x,z);if(r<.105||r>.218)continue;b.box(.031,.004,.006,2,x,.052,z);b.box(.006,.004,.028,2,x+((ix+iz)%2?.014:-.014),.052,z+.010);}
 for(const side of[-1,1]){b.box(.025,.003,.040,1,side*.284,.057,0);b.box(.007,.006,.045,0,side*.300,.055,0);}return finish(b,'road:a75',corners(.20,.20),{support:'embedded',surfaceY:.060});}
export function grating(){const b=builder('995×395×50 배수구',[silver,0x8f9b97]);for(const x of[-.495,.495])b.box(.005,.05,.395,0,x,.025,0);for(const z of[-.195,.195])b.box(.985,.05,.005,0,0,.025,z);
 for(let j=0;j<26;j++){const x=-.475+j*.95/25;b.box(.003,.044,.385,1,x,.025,0);for(const y of[.003,.047])b.box(.005,.006,.385,0,x,y,0);}
 for(const z of[-.095,0,.095])b.box(.985,.006,.006,0,0,.041,z);return finish(b,'representative:a74',corners(.49,.195),{support:'embedded',surfaceY:.05,dimensions:'approved drawing: 995×395×50mm'});}
export function hydrant(){const b=builder('지상식 양구 소화전',[red,silver,0x94372e,dark]);lathe(b,[[0,0],[.105,0],[.105,.032],[.073,.04],[.073,.65],[.083,.65],[.083,.67],[.072,.68],[.065,.73],[.048,.77],[0,.78]],0,40);disk(b,.085,.025,0,0,.10,0);for(const y of[.04,.665]){disk(b,.092,.014,2,0,y,0);for(let j=0;j<6;j++){const a=j*Math.PI/3;disk(b,.009,.012,1,Math.sin(a)*.082,y+.01,Math.cos(a)*.082,new T.Quaternion(),6);}}
 for(const side of[-1,1]){b.rod([0,.58,0],[side*.14,.58,0],.047,0,24);disk(b,.055,.012,0,side*.135,.58,0,QZ,24);disk(b,.042,.045,1,side*.163,.58,0,QZ,24);disk(b,.025,.015,1,side*.193,.58,0,QZ,6);b.rod([side*.15,.53,0],[side*.10,.44,0],.003,3,6);}
 disk(b,.018,.035,1,0,.7975,0,new T.Quaternion(),6);return finish(b,'representative:a134',corners(.065,.065),{referenceNote:'지하 배관 제외'});}
export function cable(){const b=builder('2구 전선 보호턱',[dark,yellow,0x626a64]);
 // Extruded open cross section, two real 30mm cable channels.
 function prism(points,i){const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.98,bevelEnabled:false});g.rotateY(-Math.PI/2);b.add(g,i,[.49,0,0]);}
 prism([[-.12,0],[-.12,.006],[-.047,.040],[-.047,0]],0);prism([[.047,0],[.047,.040],[.12,.006],[.12,0]],0);
 b.box(.98,.005,.094,0,0,.0025,0);for(const z of[-.039,0,.039])b.box(.98,.032,.009,0,0,.021,z);b.box(.98,.008,.087,1,0,.041,0);
 for(let j=0;j<5;j++){const x=-.40+j*.20;b.box(.045,.009,.012,0,x,.039,-.047);b.box(.045,.009,.012,1,x,.040,.047);}
 for(const z of[-.078,.078]){b.box(.018,.009,.025,0,.499,.0045,z);for(let j=0;j<14;j++){const x=-.45+j*.069;b.bar([x,.023,z-.009],[x+.018,.027,z+.009],.004,.003,2);}}
 return finish(b,'representative:legacy-109',corners(.46,.10),{dimensions:'approved product: 980×240×45mm excluding joining tabs'});}
export function speed(){const b=builder('원형 제한속도 표지',[silver,white,red,dark]);b.rod([0,0,-.055],[0,2.56,-.055],.028,0,16);disk(b,.302,.026,0,0,2.3,0,QX,64);disk(b,.296,.006,2,0,2.3,.016,QX,64);disk(b,.222,.003,1,0,2.3,.021,QX,64);signLetter(b,'5',.133,.265,3,-.079,2.30,.0232);signLetter(b,'0',.140,.265,3,.080,2.30,.0232);for(const y of[2.13,2.47]){b.box(.25,.035,.025,0,0,y,-.027);b.box(.07,.055,.065,3,0,y,-.065);for(const x of[-.1,.1])disk(b,.008,.006,0,x,y,-.044,QX,6);}return finish(b,'representative:a67',[[0,0,-.055]],{referenceNote:'사용자 요청: 제한속도 50 표기. 당시 해제 보조판은 생략',signText:'50'});}
export function pole(){const b=builder('전주 하단 보호대',[yellow,dark,0x858b80]);const n=12,r=.16;
 for(let j=0;j<n;j++){const a0=-Math.PI/2+j*Math.PI/n,a1=a0+Math.PI/n,ps=[];for(let k=0;k<=4;k++){const a=a0+(a1-a0)*k/4,rr=r+.006*Math.sin(k*Math.PI/4);ps.push([rr*Math.sin(a),rr*Math.cos(a)]);}const s=new T.Shape();s.moveTo(...ps[0]);for(const p of ps.slice(1))s.lineTo(...p);for(let k=4;k>=0;k--){const a=a0+(a1-a0)*k/4;s.lineTo((r-.007)*Math.sin(a),(r-.007)*Math.cos(a));}s.closePath();const g=new T.ExtrudeGeometry(s,{depth:1.1,bevelEnabled:false});g.rotateX(Math.PI/2);b.add(g,j%2,[0,1.1,0]);}
 for(const y of[.08,.55,1.02]){const g=new T.CylinderGeometry(.158,.158,.028,40,1,true,Math.PI/2,Math.PI);b.add(g,2,[0,y,0]);}
 return finish(b,'representative:a77',[],{support:'pole-mounted',innerDiameter:.306,referenceNote:'전주 미포함, 뒷면 고정 밴드3개'});}
export function parking(){const b=builder('무게추 주차 금지 표지',[orange,white,0xc85525,0xb52820]);const profile=[[0,0],[.145,0],[.15,.015],[.15,.11],[.142,.14],[.13,.20],[.108,.27],[.083,.34],[.052,.41],[.037,.44],[.037,.52],[.045,.54],[0,.54]];lathe(b,profile,0);for(const [y,r]of[[.025,.15],[.048,.15],[.072,.15],[.098,.15],[.16,.137],[.205,.128],[.255,.114],[.30,.097],[.35,.077],[.46,.039],[.48,.039],[.50,.039]])ring(b,r,.003,2,0,y,0);
 // Sign shell with a real handle aperture.
 const s=new T.Shape();s.moveTo(-.04,.52);s.lineTo(-.13,.57);s.quadraticCurveTo(-.145,.58,-.145,.60);s.lineTo(-.145,.85);s.quadraticCurveTo(-.145,.88,-.11,.89);s.quadraticCurveTo(0,.925,.11,.89);s.quadraticCurveTo(.145,.88,.145,.85);s.lineTo(.145,.60);s.quadraticCurveTo(.145,.58,.13,.57);s.lineTo(.04,.52);s.closePath();const h=new T.Path();h.absellipse(0,.884,.043,.012,0,Math.PI*2,true);s.holes.push(h);const g=new T.ExtrudeGeometry(s,{depth:.025,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,curveSegments:8});b.add(g,0,[0,0,-.0125]);for(const z of[-.017,.017])b.panel(.241,.282,.003,.005,1,0,.723,z);for(const [j,ch]of [...'주차금지'].entries())for(const side of[-1,1])signLetter(b,ch,.070,.058,3,0,.825-j*.068,side*.0193,side<0);return finish(b,'representative:a47',corners(.09,.09),{signText:'주차금지',referenceNote:'사용자 요청: 양면 세로 주차금지 표기'});}
export const factories={cone,bus,barrier,manhole,grating,hydrant,cable,speed,pole,parking};
