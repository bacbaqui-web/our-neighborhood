import * as T from 'three';
import {windowLightBand} from './environment-policy.js?v=32';
import {finishDepth} from './surface-policy.js?v=30';

// All parts are solid-color geometry, so exported faces remain editable.
export const facadeStyles = [
 {name:'적벽돌 다세대',wall:0x895e50,joint:0xb59b86,frame:0xd4d7cf,roof:0x667c69,pattern:'brick'},
 {name:'짙은 벽돌 주택',wall:0x635149,joint:0x95887b,frame:0x564c43,roof:0x738471,pattern:'brick'},
 {name:'밝은 벽돌 빌라',wall:0xc2b9a4,joint:0x988e7b,frame:0xe1e1d6,roof:0x738676,pattern:'brick'},
 {name:'회색 석재 빌라',wall:0xa3a6a0,joint:0x727973,frame:0x525d5b,roof:0x6c8376,pattern:'stone'},
 {name:'크림 타일 주택',wall:0xcbbfa6,joint:0xa79983,frame:0xccd1c7,roof:0x718671,pattern:'tile'},
 {name:'미장 단독주택',wall:0xc2bfb0,joint:0xaaa696,frame:0x6c7069,roof:0x697c67,pattern:'render'},
];
export const windowCatalog = [
 {id:'white-slider',name:'백색 PVC 두짝 미닫이창',width:1.9,height:1.35},
 {id:'brown-slider',name:'갈색 알루미늄 샷시',width:1.8,height:1.35},
 {id:'wide-slider',name:'거실 세짝 미닫이창',width:2.7,height:1.4},
 {id:'veranda',name:'베란다 네짝 연속 샷시',width:3.3,height:1.85},
 {id:'guard',name:'돌출 방범창과 샷시',width:1.8,height:1.25},
 {id:'basement',name:'반지하 가로창과 방범창',width:1.6,height:.7},
 {id:'frosted',name:'욕실 불투명 환기창',width:.85,height:.6},
 {id:'stair',name:'계단실 세로 분할창',width:.8,height:1.8},
 {id:'awning',name:'빗물 차양 달린 미닫이창',width:1.85,height:1.25},
 {id:'bay',name:'돌출 베란다 샷시',width:2.6,height:1.6},
];
const unitBox=new T.BoxGeometry(1,1,1).toNonIndexed();
const edgePoints=new T.EdgesGeometry(new T.BoxGeometry(1,1,1)).attributes.position.array;
const white=0xe0e2d9, metal=0x777e77, dark=0x343e3a, sill=0xb8b8a8;
export class FacadeBatch {
 constructor(){this.parts=new Map();this.lines=new Map();this.count=0;this.maxLOD=2;}
 atLOD(level,fn){const previous=this.maxLOD;this.maxLOD=Math.min(previous,level);try{return fn();}finally{this.maxLOD=previous;}}
 bucket(color,surface=false){const windowBand=this.windowBand??-1,key=color+':'+surface+':'+this.maxLOD+':'+windowBand;if(!this.parts.has(key))this.parts.set(key,{color,surface,maxLOD:this.maxLOD,windowBand,p:[],n:[],inkIds:[]});return this.parts.get(key)}
 lineBucket(color){const key=color+':'+this.maxLOD;if(!this.lines.has(key))this.lines.set(key,{color,maxLOD:this.maxLOD,p:[]});return this.lines.get(key).p;}
 writer(origin=[0,0,0],ux=1,uz=0,nx=0,nz=1){
  const P=(x,y,z)=>[origin[0]+ux*x+nx*z,origin[1]+y,origin[2]+uz*x+nz*z];
  const box=(x,y,z,w,h,d,color,edge=false,surface=false)=>{if(Math.min(w,h,d)<=0)return;const b=this.bucket(color,surface),p=unitBox.attributes.position,n=unitBox.attributes.normal;
   for(let i=0;i<p.count;i++){b.p.push(...P(x+p.getX(i)*w,y+p.getY(i)*h,z+p.getZ(i)*d));b.inkIds.push(this.inkObjectId??0);b.n.push(ux*n.getX(i)+nx*n.getZ(i),n.getY(i),uz*n.getX(i)+nz*n.getZ(i));}
   if(edge){const a=this.lineBucket(color);for(let i=0;i<edgePoints.length;i+=3)a.push(...P(x+edgePoints[i]*w,y+edgePoints[i+1]*h,z+edgePoints[i+2]*d));}this.count++;
  };
  const quad=(x,y,z,w,h,color,surface=true)=>{const b=this.bucket(color,surface);for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){b.p.push(...P(x+u*w/2,y+v*h/2,z));b.inkIds.push(this.inkObjectId??0);b.n.push(nx,0,nz)};};
  const rod=(a,b,r,color,segments=6)=>{const A=new T.Vector3(...P(...a)),B=new T.Vector3(...P(...b)),dir=B.clone().sub(A),len=dir.length();if(len<1e-6)return;dir.divideScalar(len);const u=new T.Vector3(0,1,0);if(Math.abs(dir.y)>.99)u.set(1,0,0);u.cross(dir).normalize();const v=dir.clone().cross(u);const out=this.bucket(color);for(let i=0;i<segments;i++){const ns=[i,i+1].map(j=>u.clone().multiplyScalar(Math.cos(j*2*Math.PI/segments)).addScaledVector(v,Math.sin(j*2*Math.PI/segments)));const q=[A.clone().addScaledVector(ns[0],r),A.clone().addScaledVector(ns[1],r),B.clone().addScaledVector(ns[1],r),B.clone().addScaledVector(ns[0],r)];for(const k of [0,1,2,0,2,3]){out.p.push(...q[k].toArray());out.inkIds.push(this.inkObjectId??0);out.n.push(...ns[k===0||k===3?0:1].toArray())}}};
  return{box,quad,rod,lit:(band,fn)=>{const old=this.windowBand;this.windowBand=band;try{fn();}finally{this.windowBand=old;}},detail:(level,fn)=>this.atLOD(level,fn),at:(x,y,z)=>this.writer(P(x,y,z),ux,uz,nx,nz)};
 }
 finish(name='KoreanFacadeDetails'){const group=new T.Group();group.name=name;for(const b of this.parts.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));if(b.inkIds.length===b.p.length/3&&b.inkIds.some(id=>id>0))g.setAttribute('inkObjectId',new T.Float32BufferAttribute(b.inkIds,1));const m=new T.Mesh(g,new T.MeshStandardMaterial({color:b.color,roughness:.9,side:T.DoubleSide,...(b.surface?finishDepth():{})}));if(b.windowBand>=0)m.material.userData.nightWindowBand=b.windowBand;m.name='korean-facade-'+(b.surface?'surface':'parts')+'-'+b.color.toString(16);m.userData={detailKind:b.color===dark?'metal':'facade',noPlacementCollision:b.surface,surfaceOverlay:b.surface,lodMaxLevel:b.maxLOD};group.add(m)}for(const {color,p,maxLOD} of this.lines.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));const c=new T.Color(color).multiplyScalar(.47),m=new T.LineSegments(g,new T.LineBasicMaterial({color:c}));m.userData.faceLineColor=c.getHex();m.userData.lodMaxLevel=maxLOD;group.add(m)}return group;}
}

// A single frame and non-overlapping panes: no stacked sash rings or coplanar
// decorative lines. Glass and curtains tile one depth plane behind the frame.
export function emitWindow(out,id,w,h,variation=0,frame=white,lightSeed=null){
 const {box:B,quad:Q,rod:R}=out,isGuard=id==='guard'||id==='basement',isBay=id==='bay',veranda=id==='veranda';
 const z=isBay?.30:.085,f=id==='frosted'?.042:.055,m=.042,frameDepth=.060;
 frame=id==='brown-slider'?0x574d43:frame;
 const cols=id==='frosted'?1:veranda?4:id==='wide-slider'||isBay?3:2;
 const iw=w-2*f,ih=h-2*f,pw=(iw-(cols-1)*m)/cols,glassZ=z+.018;
 const cross=id==='stair'?h*.12:veranda?-h*.24:null;
 const glassRects=cross===null?[[-ih/2,ih/2]]:[[-ih/2,cross-m/2],[cross+m/2,ih/2]];
 for(let j=0;j<cols;j++){
  const x=-iw/2+pw/2+j*(pw+m),glass=id==='frosted'?0xafc4bd:[0x79999a,0x899f9a,0x67888c][((j+variation)%3+3)%3];
  const curtain=!['frosted','basement','stair'].includes(id)&&(variation+j)%4===0;
  // The curtain replaces this part of the pane, rather than covering a second
  // glass surface a millimetre away. Both rectangles are stable at every LOD.
  const cw=curtain?pw*.35:0;
  for(const [lo,hi] of glassRects){
   const paintGlass=()=>Q(x+cw/2,(lo+hi)/2,glassZ,pw-cw,hi-lo,glass,false);
   if(lightSeed===null)paintGlass();else out.lit(windowLightBand(lightSeed),paintGlass);
   if(curtain)Q(x-(pw-cw)/2,(lo+hi)/2,glassZ,cw,hi-lo,variation%2?0xb7bcb1:0xc8c6b5,false);
  }
  if(cross!==null)B(x,cross,z+.025,pw,m,frameDepth,frame,false);
 }
 // Butt-jointed corners and a single separator between panels avoid duplicate
 // front faces where the old per-sash and outer frames intersected.
 for(const side of [-1,1])B(side*(w-f)/2,0,z+.025,f,ih,frameDepth,frame,true);
 for(const side of [-1,1])B(0,side*(h-f)/2,z+.025,w,f,frameDepth,frame,true);
 for(let j=1;j<cols;j++)B(-iw/2+j*pw+(j-.5)*m,0,z+.025,m,ih,frameDepth,frame,false);
 if(cols>1&&id!=='basement')out.detail(0,()=>B(-iw/2+pw+m/2,-.03,z+.068,.024,.13,.026,dark,false));
 const sillDepth=isBay?z+.08:.17,sillZ=isBay?sillDepth/2:z-.005;
 B(0,-h/2-.035,sillZ,w+.10,.07,sillDepth,sill,true);
 if(isBay){
  const depth=z-.005;
  for(const side of [-1,1])B(side*(w-f)/2,0,depth/2,f,ih,depth,frame,false);
  B(0,(h-f)/2,depth/2,w,f,depth,frame,false);
 }
 if(isGuard){
  const depth=id==='basement'?.26:.30,rail=.025;
  for(const x of [-w/2+rail/2,w/2-rail/2]){
   B(x,0,depth,rail,h-2*rail,rail,dark,false);
   for(const yy of [-h/2+rail/2,h/2-rail/2])B(x,yy,(depth+z+.055)/2,rail,rail,depth-z-.055,dark,false);
  }
  for(const yy of [-h/2+rail/2,h/2-rail/2])B(0,yy,depth,w,rail,rail,dark,false);
  // Fewer, slightly thicker bars read clearly with illustration outlines.
  const n=Math.max(4,Math.round(w/.24));
  for(let i=1;i<n;i++)out.detail(i%2?2:1,()=>B(-w/2+i*w/n,0,depth,.020,h-2*rail,.025,dark,false));
  if(id==='guard')B(0,-h*.19,depth-.026,w-2*rail,rail,.022,dark,false);
 }
 if(id==='awning'){
  B(0,h/2+.14,.27,w+.22,.045,.60,0x7f9b91,true);
  for(const x of [-w*.4,w*.4])R([x,h/2-.20,.06],[x,h/2+.11,.50],.013,metal);
 }
}

export function emitAircon(out,x,y,variant=0){const {box:B,quad:Q,rod:R}=out;const z=.30;B(x,y,z,.82,.55,.35,0xd3d1bd,true);const cx=x-.13;const color=0x515c55;
 const steps=20;for(let j=0;j<steps;j++){const a=j*Math.PI*2/steps,b=(j+1)*Math.PI*2/steps;R([cx+Math.cos(a)*.205,y+Math.sin(a)*.205,z+.185],[cx+Math.cos(b)*.205,y+Math.sin(b)*.205,z+.185],.012,color,4);out.detail(j%5?0:1,()=>R([cx,y,z+.19],[cx+Math.cos(a)*.197,y+Math.sin(a)*.197,z+.19],.005,color,4))}
 out.detail(1,()=>{for(let j=0;j<5;j++)B(x+.28,y-.14+j*.066,z+.18,.14,.019,.013,color,false);});
 for(const xx of [x-.3,x+.3]){B(xx,y-.32,.25,.045,.055,.53,metal,false);R([xx,y-.31,.47],[xx,y-.05,.055],.02,metal)}
 const side=variant%2?-1:1;R([x+side*.42,y-.12,.2],[x+side*.60,y-.12,.12],.025,0xc7b9a0);R([x+side*.60,y-.12,.12],[x+side*.60,y-.72,.12],.025,0xc7b9a0);
}
export function createWindowAsset(id,{lightSeed=null}={}){const row=windowCatalog.find(r=>r.id===id);if(!row)throw Error('Unknown window: '+id);const b=new FacadeBatch();b.inkObjectId=new T.Object3D().id;emitWindow(b.writer(),id,row.width,row.height,1,white,lightSeed);const g=b.finish(row.name);g.userData={...row,units:'meters',source:'인근 카카오 로드뷰 관찰 유형 재구성',procedural:true};return g;}
