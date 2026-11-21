import * as T from 'three';
import {builder} from '../prop-remakes/mesh-tools.js';
const QX=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
const COLORS=[0x79a75c,0xe7e9dd,0x346749,0xaeb8ae,0xbc4338,0x314c72,0x758879,0xffffff];
export function createDetailedBusStop(){
 const b=builder('마을버스 정류장 · 공용 디자인',COLORS);
 const cyl=(r,h,i,x,y,z,q=new T.Quaternion(),n=12)=>b.add(new T.CylinderGeometry(r,r,h,n),i,[x,y,z],q);
 function frame(w,h,r,y){const p=new T.Path(),x=w/2,a=h/2;p.moveTo(-x+r,-a);p.lineTo(x-r,-a);p.absarc(x-r,-a+r,r,-Math.PI/2,0);p.lineTo(x,a-r);p.absarc(x-r,a-r,r,0,Math.PI/2);p.lineTo(-x+r,a);p.absarc(-x+r,a-r,r,Math.PI/2,Math.PI);p.lineTo(-x,-a+r);p.absarc(-x+r,-a+r,r,Math.PI,Math.PI*1.5);class Track extends T.Curve{getPoint(t,target=new T.Vector3()){const v=p.getPoint(t);return target.set(v.x,v.y+y,0);}}b.add(new T.TubeGeometry(new Track(),64,.014,8,true),0);}
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
 // Printed artwork is one shared image; each sign face is only two triangles.
 function graphic(w,h,y,u,v,uw,vh){const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u+uv.getX(i)*uw,v+(1-uv.getY(i))*vh);b.add(g,7,[0,y,.019]);}
 graphic(.478,.478,2.89,0,0,.5,.5);
 graphic(.478,.473,2.345,.5,0,.5,.5);
 b.panel(.456,.267,.003,.003,1,0,1.905,.017);b.box(.455,.053,.003,2,0,1.795,.020);
 plate(.17,.16,1.605,5);graphic(.0675,.135,1.605,.5,.5,.25,.5);
 plate(.345,.775,1.09,1);for(let j=0;j<3;j++)graphic(.313,.0626,1.4-j*.145,0,.5+j*.1,.5,.1);graphic(.313,.022,.945,0,.82,.5,.035);graphic(.145,.127,.815,.17,.86,.16,.14);
 plate(.185,.245,.565,0);graphic(.1065,.213,.565,.75,.5,.25,.5);
 for(const [y,w]of[[1.32,.29],[.78,.29],[.61,.15]]){b.box(w,.018,.018,3,0,y,-.021);for(const x of[-.047,.047])cyl(.005,.006,2,x,y,-.063,QX,8);}
 const root=b.finish({assetId:'road:a68',units:'m',front:'+Z',status:'reference-modeled',support:'ground',contactPoints:[[-.047,0,-.047],[.047,0,-.047]],dimensions:'photo proportions; estimated 3.194m high / 0.613m wide',referenceNote:'승인 사진의 이중 기둥·둥근 프레임·상하 안내판 구조 반영. 다른 지역에서도 사용할 수 있게 한글 문구를 제외하고 버스·금연 그림, 노선도와 숫자만 유지. 뒷면 체결 구조와 크기는 추정.',signText:'11 / 14-712 / 4',revision:'bus-v4-generated-texture'});
 root.traverse(n=>{if(n.isMesh&&n.material.color.getHex()===0xffffff)n.material.name='bus-sign-atlas';});
 return root;
}
