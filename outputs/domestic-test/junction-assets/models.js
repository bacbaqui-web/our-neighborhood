import * as T from 'three';
import {builder} from '../prop-remakes/mesh-tools.js';
const colors=[0xb7b7a9,0x737976,0xd6b642,0xe9e9da,0x42494b,0x434b4c,0x87938a];
const mk=n=>builder(n,colors);
const port=(role,x,y,z)=>({role,position:[x,y,z]});
function done(b,id,evidence,ports=[],extra={}) {return b.finish({assetId:'junction:'+id,units:'m',front:'+Z',up:'+Y',origin:'ground datum; see ports',status:'reviewed-concept',dimensions:'estimated production dimensions, not measured or statutory',evidence,ports,...extra});}
function slab(b,poly,h,i,y=0){const s=new T.Shape();poly.forEach(([x,z],j)=>j?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);b.add(g,i,[0,y,0]);}
function ribbon(b,pts,w,i,y=.006){for(let j=1;j<pts.length;j++){const [x,z]=pts[j-1],[xx,zz]=pts[j];if(Math.hypot(xx-x,zz-z)<1e-8)continue;const g=new T.BoxGeometry(w,.004,Math.hypot(xx-x,zz-z));g.rotateY(Math.atan2(xx-x,zz-z));b.add(g,i,[(x+xx)/2,y,(z+zz)/2]);}}
function dotTile(b,x,z,y=.15){b.box(.3,.026,.3,2,x,y+.013,z);for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++)b.add(new T.CylinderGeometry(.011,.014,.005,8),2,[x+a*.052,y+.0285,z+c*.052]);}
function curbLine(b,x1,z1,x2,z2){const len=Math.hypot(x2-x1,z2-z1),n=Math.ceil(len/.5);for(let j=0;j<n;j++){const a=j/n,c=(j+1)/n,px=x1+(x2-x1)*a,pz=z1+(z2-z1)*a,qx=x1+(x2-x1)*c,qz=z1+(z2-z1)*c;const g=new T.BoxGeometry(.18,.16,len/n-.006);g.rotateY(Math.atan2(qx-px,qz-pz));b.add(g,0,[(px+qx)/2,.08,(pz+qz)/2]);}}
function corner(b,cx,cz,r=1.5,a0=0,a1=Math.PI/2){const n=12;for(let j=0;j<n;j++){const a=a0+(a1-a0)*j/n+.002,c=a0+(a1-a0)*(j+1)/n-.002;const ps=[];for(let k=0;k<=3;k++){const t=a+(c-a)*k/3;ps.push([cx+r*Math.cos(t),cz+r*Math.sin(t)]);}for(let k=3;k>=0;k--){const t=a+(c-a)*k/3;ps.push([cx+(r+.18)*Math.cos(t),cz+(r+.18)*Math.sin(t)]);}slab(b,ps,.16,0);}}
function zebra(b,width=3,depth=3,y=.008){for(let x=-width/2+.2;x<width/2;x+=.65)b.box(.4,.004,depth,3,x,y,0);}
function median(b,len=4){b.box(.26,.12,len,0,0,.06,0);for(const z of[-len/2+.2,len/2-.2]){b.add(new T.CylinderGeometry(.043,.055,1,12),4,[0,.62,z]);b.add(new T.CylinderGeometry(.049,.049,.08,12),2,[0,.86,z]);}for(const y of[.42,.75,1.02])b.rod([0,y,-len/2+.2],[0,y,len/2-.2],.025,4,8);}
function attach(root,child,x=0,y=0,z=0,angle=0){child.position.set(x,y,z);child.rotation.y=angle;root.add(child);return child;}
function straight(){const b=mk('직선 연석 · 접속 부품');curbLine(b,0,-1,0,1);return done(b,'curb-straight',['105','113'],[port('start',0,.16,-1),port('end',0,.16,1)]);}
function curved(){const b=mk('곡선 연석 · 모퉁이');corner(b,0,0);return done(b,'curb-corner',['105','113'],[port('start',1.59,.16,0),port('end',0,.16,1.59)],{radius:1.5});}
function ramp(){const b=mk('보도 턱낮춤 · 점자블록 연결');
 // Side profile extruded across X. Road lip at z=-.9, walk end at z=.9.
 const ps=[[-.9,0],[.9,0],[.9,.15],[.45,.15],[-.9,.015]],s=new T.Shape();ps.forEach(([z,y],j)=>j?s.lineTo(-z,y):s.moveTo(-z,y));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:2.4,bevelEnabled:false});g.rotateY(Math.PI/2);b.add(g,0,[-1.2,0,0]);
 for(let j=0;j<6;j++)dotTile(b,-.75+j*.3,.64,.15);
 return done(b,'curb-ramp',['105','113','137'],[port('road',0,0,-.9),port('walk',0,.15,.9)],{roadLip:.015,clearWidth:2.4});}
function tactile(){const b=mk('점형 점자블록 · 경고 띠');for(let j=0;j<4;j++)dotTile(b,-.45+j*.3,0,0);return done(b,'tactile-warning',['105','137'],[port('start',-.6,0,0),port('end',.6,0,0)]);}
function guiding(){const b=mk('선형 점자블록 · 보행 연결');for(let j=0;j<4;j++){const z=-.45+j*.3;b.box(.3,.026,.3,2,0,.013,z);for(const x of[-.09,-.03,.03,.09])b.box(.018,.005,.265,2,x,.0285,z);}return done(b,'tactile-guidance',['137','184'],[port('start',0,0,-.6),port('end',0,0,.6)]);}
function crossing(){const b=mk('횡단보도와 정지선 · 표시 부품');zebra(b,6,3);b.box(2.8,.004,.35,3,1.6,.008,-2.4);return done(b,'crossing-stop',['099','129','179'],[port('walk-left',-3,0,0),port('walk-right',3,0,0)],{traffic:'+Z on x>0; mirror only with traffic mapping',stopLineZ:-2.4});}
function end(){const b=mk('중앙분리대 · 둥근 끝단');median(b,4);b.add(new T.CylinderGeometry(.13,.13,.12,16),0,[0,.06,-2]);return done(b,'median-end',['129','193'],[port('join',0,0,2)],{closedEndZ:-2.13});}
function edge(){const b=mk('노란 가장자리선 · 곡선');const pts=[];for(let j=0;j<=24;j++){const t=Math.PI*j/48;pts.push([1.5*Math.cos(t),1.5*Math.sin(t)]);}ribbon(b,pts,.12,2);return done(b,'edge-corner',['073','105'],[port('start',1.5,0,0),port('end',0,0,1.5)]);}
function guide(){const b=mk('회전 유도 점선 · 연결 예시');for(let j=0;j<24;j+=2){const ps=[];for(let k=0;k<=4;k++){const t=(j+k/4)*Math.PI/48;ps.push([6*Math.cos(t),6*Math.sin(t)]);}ribbon(b,ps,.13,3);}return done(b,'turn-guide',['145','153','177'],[port('start',6,0,0),port('end',0,0,6)]);}
function baseJunction(type){const b=mk(type==='cross'?'다차로 사거리 · 조립 예시':type==='small'?'보도 있는 T자 접속 · 조립 예시':'좁은 길과 큰길 · 분리대 유지 예시');
 const cross=type==='cross',small=type==='small',half=small?3:cross?6:5,side=small?2:cross?6:2.5,L=18;
 // One joined asphalt polygon: no coplanar overlapping road slabs.
 const poly=cross?[[-half,-L],[half,-L],[half,-side],[L,-side],[L,side],[half,side],[half,L],[-half,L],[-half,side],[-L,side],[-L,-side],[-half,-side]]:[[-half,-L],[half,-L],[half,-side],[L,-side],[L,side],[half,side],[half,L],[-half,L]];
 slab(b,poly,.06,5); // All supporting surfaces use datum +.06.
 const walk=mk('보도'), ramps=[];
 const r=1.2, cx=half+3.5, cz=side+3.5;
 for(const sx of (cross?[-1,1]:[1]))for(const sz of[-1,1]){
  const ps=[[half+r,side],[cx-1.2,side],[cx-1.2,side+1.8],[cx+1.2,side+1.8],[cx+1.2,side],[L,side],[L,side+2],[half+2,side+2],[half+2,L],[half,L]];
  if(cross)ps.push([half,cz+1.2],[half+1.8,cz+1.2],[half+1.8,cz-1.2],[half,cz-1.2]);
  ps.push([half,side+r]);
  for(let j=1;j<=12;j++){const a=Math.PI+j*Math.PI/24;ps.push([half+r+r*Math.cos(a),side+r+r*Math.sin(a)]);}
  const fill=[[half,side],[half+r,side]];for(let j=0;j<=12;j++){const a=1.5*Math.PI-j*Math.PI/24;fill.push([half+r+r*Math.cos(a),side+r+r*Math.sin(a)]);}slab(b,fill.map(([x,z])=>[sx*x,sz*z]),.06,5);
  slab(walk,ps.map(([x,z])=>[sx*x,sz*z]),.15,1);
  const cl=(x,z,xx,zz)=>curbLine(walk,sx*x,sz*z,sx*xx,sz*zz);
  cl(half+r,side,cx-1.2,side);cl(cx+1.2,side,L,side);
  if(cross){cl(half,side+r,half,cz-1.2);cl(half,cz+1.2,half,L);}else cl(half,side+r,half,L);
  for(let j=0;j<12;j++){
   const a=Math.PI+j*Math.PI/24+.002,c=Math.PI+(j+1)*Math.PI/24-.002;
   slab(walk,[[r,a],[r,c],[r-.18,c],[r-.18,a]].map(([rr,t])=>[sx*(half+r+rr*Math.cos(t)),sz*(side+r+rr*Math.sin(t))]),.16,0);
  }
  ramps.push([sx*cx,sz*(side+.9),sz>0?0:Math.PI]);
  if(cross)ramps.push([sx*(half+.9),sz*cz,sx>0?Math.PI/2:-Math.PI/2]);
 }
 if(!cross){walk.box(2,.15,2*L,1,-half-1,.075,0);curbLine(walk,-half,-L,-half,L);}
 const root=done(b,'junction-'+(cross?'crossroads':small?'small-t':'alley-main'),['017','105','129','145','177'],[port('north',0,.06,-L),port('south',0,.06,L),port('east',L,.06,0),...(cross?[port('west',-L,.06,0)]:[])],{median:small?'none':cross?'ends-before-crossing':'continuous',layout:'concept assembly; not a surveyed reconstruction'});attach(root,walk.finish({}),0,.06);for(const [x,z,a]of ramps)attach(root,ramp(),x,.06,z,a);
 const lines=mk('노면 표시');
 for(const sign of[-1,1]){ribbon(lines,[[0,sign*(side+5)],[0,sign*L]],.12,2);if(!small)for(const x of[-half/2,half/2])for(let z=side+5;z<L-1;z+=3)ribbon(lines,[[x,sign*z],[x,sign*(z+1.5)]],.12,3);}
 attach(root,lines.finish({}),0,.06);
 if(!small){if(cross){attach(root,end(),0,.06,side+8);attach(root,end(),0,.06,-side-8,Math.PI);}else{const mb=mk('연속 분리대');median(mb,26);attach(root,mb.finish({}),0,.06);}}
 // Matched openings and ramps keep raised curbs out of crossings.
 const crossingCenters=cross?[[0,side+3.5,0],[0,-side-3.5,0],[half+3.5,0,Math.PI/2],[-half-3.5,0,Math.PI/2]]:[[half+3.5,0,Math.PI/2]];
 for(const [x,z,a]of crossingCenters){const cb=mk('횡단 표시');zebra(cb,2*(a?side:half),2.4);attach(root,cb.finish({}),x,.06,z,a);}
 const stop=mk('접근 정지선');
 if(cross){for(const sign of[-1,1]){stop.box(half-.4,.004,.35,3,sign*half/2,.008,-sign*(side+5.2));stop.box(.35,.004,side-.4,3,sign*(half+5.2),.008,sign*side/2);}}
 else stop.box(.35,.004,side-.35,3,half+5.2,.008,side/2);
 attach(root,stop.finish({}),0,.06);
 if(cross){const g=mk('직진 유도선');for(const x of[-3,3])for(let z=-6;z<6;z+=2)ribbon(g,[[x,z],[x,z+1]],.12,3);attach(root,g.finish({}),0,.06);}
 root.userData.crossingOpenings=ramps.map(([x,z,a])=>({x,z,angle:a,width:2.4}));
 return root;
}
export const factories={'curb-straight':straight,'curb-corner':curved,'curb-ramp':ramp,'tactile-warning':tactile,'tactile-guidance':guiding,'crossing-stop':crossing,'median-end':end,'edge-corner':edge,'turn-guide':guide,'junction-alley-main':()=>baseJunction('alley'),'junction-small-t':()=>baseJunction('small'),'junction-crossroads':()=>baseJunction('cross')};
