import * as T from 'three';
import {builder} from '../prop-remakes/mesh-tools.js';
import {signLetter} from './sign-lettering.js';
import {busGlyphs} from './bus-glyphs.js';
const QX=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
const COLORS=[0x79a75c,0xe7e9dd,0x346749,0xaeb8ae,0xbc4338,0x314c72,0x758879];
export function createDetailedBusStop(){
 const b=builder('마포 마을버스 정류장 · 사진 비율 개선',COLORS);
 const cyl=(r,h,i,x,y,z,q=new T.Quaternion(),n=12)=>b.add(new T.CylinderGeometry(r,r,h,n),i,[x,y,z],q);
 function line(text,x,y,w,h,i,z=.029){const chars=[...text],advance=w/chars.length;chars.forEach((ch,j)=>{if(ch!==' ')signLetter(b,ch,advance*.83,h,i,x-w/2+advance*(j+.5),y,z,false,busGlyphs);});}
 function frame(w,h,r,y){const p=new T.Path(),x=w/2,a=h/2;p.moveTo(-x+r,-a);p.lineTo(x-r,-a);p.absarc(x-r,-a+r,r,-Math.PI/2,0);p.lineTo(x,a-r);p.absarc(x-r,a-r,r,0,Math.PI/2);p.lineTo(-x+r,a);p.absarc(-x+r,a-r,r,Math.PI/2,Math.PI);p.lineTo(-x,-a+r);p.absarc(-x+r,-a+r,r,Math.PI,Math.PI*1.5);class Track extends T.Curve{getPoint(t,target=new T.Vector3()){const v=p.getPoint(t);return target.set(v.x,v.y+y,0);}}b.add(new T.TubeGeometry(new Track(),112,.014,12,true),0);}
 // Double ground posts sit behind the face and connect to the frame's bottom crossbar.
 for(const x of[-.047,.047]){
  cyl(.023,1.89,0,x,.945,-.047);
  cyl(.025,.045,2,x,.0225,-.047);
  for(const y of[.58,1.12,1.64,1.735]){cyl(.026,.022,3,x,y,-.047);b.box(.035,.022,.038,3,x,y,-.022);}
 }
 b.box(.16,.036,.028,0,0,1.72,-.016);
 frame(.585,1.47,.065,2.445);
 // Real sheet thickness, folded rims, rear brackets and exposed retaining bolts.
 function plate(w,h,y,face){b.panel(w,h,.018,.009,3,0,y,0);b.panel(w-.012,h-.012,.004,.007,face,0,y,.011);b.panel(w-.012,h-.012,.003,.007,0,0,y,-.011);for(const x of[-w/2+.018,w/2-.018])for(const yy of[y-h/2+.019,y+h/2-.019])cyl(.004,.003,3,x,yy,.015,QX,8);}
 for(const [y,h,face]of[[2.89,.51,0],[2.345,.505,1],[1.90,.32,1]]){
  plate(.51,h,y,face);
  for(const x of[-.275,.275])for(const yy of[y-h*.31,y+h*.31]){b.box(.039,.016,.015,3,x,yy,-.007);cyl(.005,.005,2,x,yy,.005,QX,8);}
 }
 // Header bus pictogram on the circular pale emblem, followed by a readable stop type.
 cyl(.162,.003,1,0,2.962,.016,QX,48);
 b.panel(.19,.122,.003,.024,2,0,2.945,.028);
 b.panel(.148,.048,.003,.008,1,0,2.966,.036);
 for(const x of[-.063,.063]){b.box(.024,.012,.003,1,x,2.914,.036);b.panel(.021,.022,.004,.006,2,x,2.88,.028);}
 b.box(.005,.046,.003,2,0,2.966,.041);
 b.box(.45,.047,.004,2,0,2.763,.017);line('14-712',.068,2.763,.25,.025,1,.023);
 line('마을버스승차장',0,2.697,.45,.033,1,.019);
 // Mapo 11: red route number, navy destination and a loop diagram.
 line('마포',-.135,2.535,.145,.049,4,.019);line('11',.075,2.527,.155,.092,4,.019);
 line('마포전철역',0,2.43,.45,.052,5,.019);
 b.box(.452,.003,.003,5,0,2.392,.019);
 function loop(x,y,w,h,z){const p=new T.Shape();p.moveTo(x-w/2+h/2,y-h/2);p.lineTo(x+w/2-h/2,y-h/2);p.absarc(x+w/2-h/2,y,h/2,-Math.PI/2,Math.PI/2);p.lineTo(x-w/2+h/2,y+h/2);p.absarc(x-w/2+h/2,y,h/2,Math.PI/2,Math.PI*1.5);const pts=p.getPoints(28);for(let j=1;j<pts.length;j++)b.rod([pts[j-1].x,pts[j-1].y,z],[pts[j].x,pts[j].y,z],.0012,6,4);
  for(const side of[-1,1])for(let j=0;j<10;j++){const xx=x-w*.39+j*w*.78/9,yy=y+side*h/2;cyl(.0035,.0018,j===0?4:6,xx,yy,z+.001,QX,8);b.bar([xx,yy+side*.009,z],[xx+.025,yy+side*.031,z],.002,.0012,6);}
 }
 loop(0,2.27,.435,.06,.019);
 // The photographed advertisement is kept as a neutral framed insert, without branding.
 b.panel(.456,.267,.003,.003,1,0,1.905,.017);b.box(.455,.053,.003,2,0,1.795,.020);line('안내',0,1.93,.15,.052,6,.022);
 // Small numbered stop marker bridging the upper frame and the lower timetable.
 plate(.17,.16,1.605,5);line('4',0,1.595,.065,.075,1,.020);
 // Lower timetable: full-size separate sheet, three route rows, stop name and smoking restriction.
 plate(.345,.775,1.09,1);
 for(let j=0;j<3;j++){
  const y=1.385-j*.135;b.box(.065,.118,.003,0,-.133,y,.017);line('11',-.133,y,.047,.043,1,.022);loop(.034,y-.012,.226,.033,.020);b.box(.266,.0015,.003,6,.028,y-.064,.019);
 }
 b.box(.329,.049,.003,1,0,.965,.017);line('마포전철역',0,.963,.30,.034,5,.022);
 b.box(.326,.034,.003,0,0,.920,.018);line('14-712',.04,.92,.20,.022,1,.022);
 const noY=.805;b.add(new T.TorusGeometry(.065,.007,6,40),4,[0,noY,.022]);
 b.box(.066,.012,.002,6,-.003,noY,.024);b.box(.017,.012,.002,0,.040,noY,.024);b.rod([.032,noY+.016,.024],[.029,noY+.036,.024],.002,6,6);b.rod([-.044,noY-.044,.027],[.044,noY+.044,.027],.006,4,8);
 // Separate lower metal notice and visible back attachment hardware.
 plate(.185,.245,.565,0);line('금연',0,.628,.12,.042,4,.020);b.panel(.085,.051,.002,.009,1,0,.563,.019);b.box(.066,.021,.002,2,0,.568,.022);b.box(.143,.029,.003,1,0,.476,.018);
 for(const [y,w]of[[1.32,.29],[.78,.29],[.61,.15]]){b.box(w,.018,.018,3,0,y,-.021);for(const x of[-.047,.047])cyl(.005,.006,2,x,y,-.063,QX,8);}
 return b.finish({assetId:'road:a68',units:'m',front:'+Z',status:'reference-modeled',support:'ground',contactPoints:[[-.047,0,-.047],[.047,0,-.047]],dimensions:'photo proportions; estimated 3.194m high / 0.613m wide',referenceNote:'사용자 사진의 마포 11·마포전철역 표기, 이중 기둥 뒤쪽 고정, 상하 안내판·금연 표시 반영. 광고는 중립 안내판으로 단순화. 뒷면 체결 구조와 크기는 추정.',signText:'마포 11 / 마포전철역 / 마을버스승차장 / 금연',revision:'bus-v2-photo-refinement'});
}
