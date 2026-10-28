import {inYard} from './neighborhood-rules.js?v=17.2';
import {FacadeBatch} from './korean-facades.js?v=30';
import * as T from 'three';
import {footprintHeights} from './support-geometry.js?v=82';
import {stitchBoundaryRuns,addBoundaryRibbon,addFittedDrain} from './boundary-geometry.js?v=82';
import {createContactSurfaceSampler} from './contact-shadows.js?v=79';
// Korean household fronts are whole connected assemblies, not detached wall modules.
export function renderParcels(data,elevation,profiles=[],plan,roadInfo=null){
 const group=new T.Group(),batch=new FacadeBatch(),segments=[],colliders=[],views=[],programMap=new Map(profiles.map(p=>[p.owner,p]));
 const C={brick:0x805947,dark:0x634c43,joint:0xaaa090,stone:0x818880,stoneJoint:0x555e57,render:0xa8aba1,base:0x777f75,cap:0xb2b3a7,green:0x4b7160,iron:0x374a42,silver:0x939e94};
 const styleNames={'brick-vent':'구멍 장식 적벽돌 담과 대문','dark-brick':'단차 벽돌 담과 아치 대문','stone-gate':'석재 담과 박공지붕 대문','rendered':'회색 미장 담과 철문','green-fence':'기단 위 녹색 철망 울타리','brick-rail':'벽돌 기단과 철제 담','villa-curb':'개방형 빌라 주차 진입부'};
 function floor(tris,color,lift=.065,layer=1){
  const v=[],mark=color===0xc4a451;
  function tri(a,b,c,level=0){
   const L=Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(a[0]-c[0],a[1]-c[1]),Math.hypot(b[0]-c[0],b[1]-c[1]));
   const ab=a.map((n,i)=>(n+b[i])/2),bc=b.map((n,i)=>(n+c[i])/2),ca=c.map((n,i)=>(n+a[i])/2);
   const ha=elevation(...a),hb=elevation(...b),hc=elevation(...c);
   // Paint sits millimetres above the road. Refine where it crosses a terrain
   // crease, instead of lifting all markings ten centimetres to hide clipping.
   const bent=L>(mark?.015:.04)&&Math.max(Math.abs(elevation(...ab)-(ha+hb)/2),Math.abs(elevation(...bc)-(hb+hc)/2),Math.abs(elevation(...ca)-(hc+ha)/2),Math.abs(elevation((a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3)-(ha+hb+hc)/3))>(mark?.0015:.008);
   if((L>(mark?.8:2.2)||bent)&&level<(mark?8:7)){tri(a,ab,ca,level+1);tri(ab,b,bc,level+1);tri(ca,bc,c,level+1);tri(ab,bc,ca,level+1);return;}
   for(const [p,h] of [[a,ha],[b,hb],[c,hc]])v.push(p[0],h+lift,p[1]);
  }
  for(const t of tris)tri(...t);if(!v.length)return;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();
  const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}));m.name='yard-access-surface';m.userData.surfaceOverlay=true;if(mark)m.userData.detailKind='roadmark';group.add(m);
 }

 for(const yard of data.yards){const p=programMap.get(yard.owner),color=p?.levels>=4?0x858882:p?.type==='rear'?0x939486:[0x9c9e94,0x979a91,0xa3a399][Math.abs(yard.owner)%3];floor(yard.triangles,color);}
 floor(plan.apronTriangles,0x999d93,.083,3);floor(plan.paintTriangles,0xc4a451,.005,5);
 // A narrow concrete access seam follows each real reserved entry route.
 for(const y of data.yards){if(!y.entrance)continue;const ts=[];for(let i=1;i<y.entrance.length;i++){const a=y.entrance[i-1],b=y.entrance[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.01)continue;const nx=-(b[1]-a[1])/L*.53,nz=(b[0]-a[0])/L*.53,N=Math.ceil(L/.65);for(let j=0;j<N;j++){const p=a.map((v,k)=>v+(b[k]-v)*j/N),q=a.map((v,k)=>v+(b[k]-v)*(j+1)/N),cs=[[p[0]+nx,p[1]+nz],[q[0]+nx,q[1]+nz],[q[0]-nx,q[1]-nz],[p[0]-nx,p[1]-nz]];if(cs.every(c=>inYard(y,...c)))ts.push([cs[0],cs[1],cs[2]],[cs[0],cs[2],cs[3]]);}}floor(ts,0xa5a79c,.077,2);}
 function tint(c,f=1){return new T.Color(c).multiplyScalar(Math.round(f*20)/20).getHex()}
 const stitched=stitchBoundaryRuns([...plan.wallRuns,...plan.connections.map(e=>({...e,points:[e.a,e.b],height:e.height??1.4}))]);
 const boundaryFit={version:82,gateSupports:0,gateLeaves:0,thresholdSlots:0,...stitched.qa,curbs:0,slopedFences:0,drains:[],slopeViews:[]};
 function masonry(out,L,ga,gb,ta,tb,width,kind,offset){
  const Q=out.quad,brick=['brick-vent','dark-brick','brick-rail'].includes(kind),rh=brick?.13:.19,cw=brick?.32:.56,col=brick?C.joint:C.stoneJoint;
  const low=x=>ga+(gb-ga)*x/L+.14,high=x=>ta+(tb-ta)*x/L-.02;
  for(const side of [-1,1])for(let y=Math.ceil(Math.min(low(0),low(L))/rh)*rh;y<Math.max(ta,tb);y+=rh){
   // Clip each horizontal mortar course against the sloping base and coping.
   let a=0,b=L;
   for(const [v0,v1] of [[y-low(0),y-low(L)],[high(0)-y,high(L)-y]]){
    if(v0<0&&v1<0){b=-1;break;}if(v0<0)a=Math.max(a,L*(-v0)/(v1-v0));if(v1<0)b=Math.min(b,L*v0/(v0-v1));
   }
   if(b>a+.01)Q((a+b)/2,y,side*(width/2+.002),b-a,.006,col);
   const row=Math.round(y/rh),stagger=(Math.abs(row)%2)*cw/2,first=Math.ceil((offset-stagger+.012)/cw)*cw+stagger-offset;
   for(let x=first;x<L-.006;x+=cw){const lo=Math.max(y+.004,low(x)),hi=Math.min(y+rh-.004,high(x));if(hi>lo)Q(x,(lo+hi)/2,side*(width/2+.003),.007,hi-lo,col);}
  }
 }
 function wallRun(r){
  const {points,height,style:kind,owner}=r,lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const L=lengths.at(-1);if(L<.025)return;
  if(kind==='villa-curb'){
   addBoundaryRibbon(batch,points,.22,(x,z)=>elevation(x,z)-.08,(x,z)=>elevation(x,z)+.14,C.cap,{ink:true,step:.3});
   boundaryFit.curbs++;
  }else{
   const curved=r.capProfile==='scalloped'&&L>2.2,brick=['brick-vent','dark-brick','brick-rail'].includes(kind),rail=['green-fence','brick-rail'].includes(kind);
   const body=tint(brick?(kind==='dark-brick'?C.dark:C.brick):kind==='stone-gate'?C.stone:C.render,r.tint??1);
   const railH=rail?Math.min(height-.30,height*(kind==='green-fence'?.65:r.railRatio??.36)):kind==='brick-vent'?.15:0;
   const distance=(x,z)=>{let best=Infinity,s=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=lengths[i]-lengths[i-1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(len*len))),d=(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2;if(d<best){best=d;s=lengths[i-1]+len*t;}}return s;};
   const top=(x,z)=>elevation(x,z)+(r.repair?r.startHeight+(r.endHeight-r.startHeight)*distance(x,z)/L:height+(curved?.20*Math.cos(2*Math.PI*distance(x,z)/(L/Math.max(1,Math.round(L/4.2)))):0)),solid=(x,z)=>top(x,z)-railH;
   addBoundaryRibbon(batch,points,.22,(x,z)=>elevation(x,z)-.08,solid,body,{step:.6});
   addBoundaryRibbon(batch,points,.252,solid,(x,z)=>solid(x,z)+.05,tint(C.cap,r.tint??1),{ink:true,step:.5});
   if(kind==='brick-vent')addBoundaryRibbon(batch,points,.254,top,(x,z)=>top(x,z)+.07,C.cap,{ink:true,step:.5});
   if(rail){
    const color=kind==='green-fence'?C.green:C.iron;
    for(const h of [railH-.10,.04])addBoundaryRibbon(batch,points,.038,(x,z)=>top(x,z)-h-.015,(x,z)=>top(x,z)-h+.015,color,{step:.6});
    if(kind==='green-fence')for(let h=.19;h<railH-.05;h+=.13)addBoundaryRibbon(batch,points,.012,(x,z)=>solid(x,z)+h-.0045,(x,z)=>solid(x,z)+h+.0045,color,{step:.8});
    boundaryFit.slopedFences++;
    const a=points[0],b=points.at(-1),grade=Math.abs(elevation(...a)-elevation(...b))/L;
    if(grade>.12&&L>5)boundaryFit.slopeViews.push({owner,points:[a,b],grade});
   }
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=lengths[i]-lengths[i-1],ux=dx/len,uz=dz/len;
    const out=batch.writer([a[0],0,a[1]],ux,uz,-uz,ux),B=out.box;
    if(kind!=='rendered'&&kind!=='green-fence'){
     const N=Math.ceil(len/1.2);for(let j=0;j<N;j++){const x0=j*len/N,x1=(j+1)*len/N,aa=[a[0]+ux*x0,a[1]+uz*x0],bb=[a[0]+ux*x1,a[1]+uz*x1];masonry(batch.writer([aa[0],0,aa[1]],ux,uz,-uz,ux),len/N,elevation(...aa),elevation(...bb),solid(...aa),solid(...bb),.22,kind,lengths[i-1]+x0);}
    }
    if(kind==='brick-vent'){const n=Math.max(1,Math.floor(len/.24));for(let j=0;j<n;j++){const x=(j+.5)*len/n,y=top(a[0]+ux*x,a[1]+uz*x);B(x,y-.075,0,len/n*.57,.15,.22,body,false);}}
    if(rail){
     const color=kind==='green-fence'?C.green:C.iron,pitch=kind==='green-fence'?.12:.18;
     for(let x=pitch/2;x<len;x+=pitch){const y=top(a[0]+ux*x,a[1]+uz*x);B(x,y-railH/2,0,.018,railH,.022,color,false);}
     const n=Math.ceil(len/1.8);for(let j=0;j<=n;j++){if((i>1&&j===0)||(j===n&&i===points.length-1&&Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<.0001))continue;const x=j*len/n,y=top(a[0]+ux*x,a[1]+uz*x);B(x,y-railH/2,0,.036,railH+.06,.036,color,true);}
    }
   }
  }
  // Walking/collision boundaries retain the same reserved openings.
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],N=Math.ceil((lengths[i]-lengths[i-1])/.6);
   for(let j=0;j<N;j++){const aa=a.map((v,k)=>v+(b[k]-v)*j/N),bb=a.map((v,k)=>v+(b[k]-v)*(j+1)/N);segments.push({a:aa,b:bb,base:Math.min(elevation(...aa),elevation(...bb))-.08,top:Math.max(elevation(...aa),elevation(...bb))+height+.09,width:.22,kind:kind==='villa-curb'?'low-curb':'parcel-wall',owner});}
  }
 }
 for(const r of stitched.runs)wallRun(r);
 function collider(fp,base,top,owner,role){colliders.push({fp,base,top,owner,role});}
 for(const p of plan.piers){const out=batch.writer([p.x,elevation(p.x,p.z),p.z],p.ux,p.uz,-p.uz,p.ux),B=out.box,col=tint(p.style==='stone-gate'?C.stone:p.style==='rendered'?C.render:p.style==='dark-brick'?C.dark:C.brick,p.tint??1),pw=p.width??.34,foot=Math.min(...[-1,1].flatMap(a=>[-1,1].map(b=>elevation(p.x+p.ux*a*pw/2-p.uz*b*pw/2,p.z+p.uz*a*pw/2+p.ux*b*pw/2))))-elevation(p.x,p.z)-.06;B(0,(p.height+foot)/2,0,pw,p.height-foot,pw,col,true);B(0,p.height+.03,0,pw+.045,.06,pw+.045,C.cap,true);for(let y=.2;y<p.height;y+=.17)for(const s of [-1,1])out.quad(0,y,s*((p.width??.34)/2+.002),p.width??.34,.009,C.joint);collider(p.footprint,elevation(p.x,p.z),elevation(p.x,p.z)+p.height+.08,p.owner,'wall-pier');}
 // Prism masonry makes an actual opening below the lintel/arch.
 function prism(local,poly,depth,color,origin,ux,uz,nx,nz){const vertices=[];for(const z of [-depth/2,depth/2])for(const p of poly)vertices.push([origin[0]+ux*p[0]+nx*z,origin[1]+p[1],origin[2]+uz*p[0]+nz*z]);const faces=[];for(let i=1;i<poly.length-1;i++){faces.push(0,i,i+1,poly.length,poly.length+i+1,poly.length+i)}for(let i=0;i<poly.length;i++){const k=(i+1)%poly.length;faces.push(i,k,k+poly.length,i,k+poly.length,i+poly.length)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(faces.flatMap(i=>vertices[i]),3));g.computeVertexNormals();const b=batch.bucket(color);b.p.push(...g.attributes.position.array);b.n.push(...g.attributes.normal.array);const edge=new T.EdgesGeometry(g,30);batch.lineBucket(color).push(...edge.attributes.position.array);edge.dispose();g.dispose();}
 // Finish all thresholds first so posts/leaves and drains use the same
 // visible surface, including the courtyard/apron underneath each entrance.
 for(const {x,z,ux,uz,nx,nz,width} of plan.gates){const cs=[[-width/2,-.22],[width/2,-.22],[width/2,.38],[-width/2,.38]].map(([u,v])=>[x+ux*u+nx*v,z+uz*u+nz*v]);floor([[cs[0],cs[1],cs[2]],[cs[0],cs[2],cs[3]]],0xa2a79b,.09,4);}
 const gateSurface=createContactSurfaceSampler(group.children,elevation);
 for(const gate of plan.gates){const {x,z,ux,uz,nx,nz,width,style,owner}=gate,base=Math.max(...gate.pieces.map(p=>elevation(x+ux*p.u,z+uz*p.u))),out=batch.writer([x,base,z],ux,uz,nx,nz),B=out.box,R=out.rod,col=style==='stone-gate'?C.stone:style==='rendered'?C.render:style==='dark-brick'?C.dark:C.brick,iron=style==='rendered'?0x466355:C.iron,h=2.1;
  for(const p of gate.pieces){const world=(u,v)=>[x+ux*u+nx*v,z+uz*u+nz*v],bottom=footprintHeights((a,b)=>world(p.u+a,b),.34,.30,gateSurface).low-base-.04;boundaryFit.gateSupports++;B(p.u,(bottom+h)/2,0,.34,h-bottom,.30,col,true);B(p.u,h+.07,0,.42,.14,.37,C.cap,true);for(let y=.14;y<h-.04;y+=style==='stone-gate'?.17:.13)for(const side of [-1,1])out.quad(p.u,y,side*.152,.34,.009,C.joint);
   const u=p.side*(width/2-.025),top=base+1.78;
   addBoundaryRibbon(batch,[world(u,.04),world(u,.92)],.055,(xx,zz)=>gateSurface(xx,zz)+.025,()=>top,iron,{ink:true,step:.12});
   for(let j=0;j<6;j++){const level=(xx,zz)=>{const low=gateSurface(xx,zz)+.025;return low+(.16+j*.12)*(top-low);};addBoundaryRibbon(batch,[world(u,.11),world(u,.85)],.071,(xx,zz)=>level(xx,zz)-.025,(xx,zz)=>level(xx,zz)+.025,0x536454,{step:.12});}
   for(const v of [.08,.88]){const low=gateSurface(...world(u,v))-base+.02;B(u,(low+1.80)/2,v,.072,1.80-low,.036,C.silver,false);}B(u-p.side*.05,.92,.80,.032,.19,.03,0xb3b3a0,false);boundaryFit.gateLeaves++;
   collider(p.post,base+bottom,base+h+.14,owner,'gate-pier');collider(p.leaf,Math.min(...p.leaf.map(q=>gateSurface(...q))),base+1.82,owner,'open-gate-leaf');
  }
  if(style==='dark-brick'||style==='brick-vent'){const rad=width/2+.02;for(let j=0;j<12;j++){const a=j*Math.PI/12,b=(j+1)*Math.PI/12,poly=[[Math.cos(a)*rad,2.08+Math.sin(a)*.36],[Math.cos(b)*rad,2.08+Math.sin(b)*.36],[Math.cos(b)*(rad+.20),2.08+Math.sin(b)*.54],[Math.cos(a)*(rad+.20),2.08+Math.sin(a)*.54]];prism(out,poly,.32,col,[x,base,z],ux,uz,nx,nz);}}
  else if(style==='stone-gate'){for(const side of [-1,1])prism(out,[[0,2.55],[side*(width/2+.34),2.20],[side*(width/2+.34),2.32],[0,2.70]],.42,C.cap,[x,base,z],ux,uz,nx,nz);}
  else B(0,2.19,0,width+.65,.16,.4,C.cap,true);
  const left=-width/2-.17;B(left,1.4,-.175,.17,.25,.052,0x626d65,true);B(left,1.44,-.205,.10,.08,.013,0x303e3b,false);B(left,1.25,-.19,.09,.14,.035,C.silver,false);B(width/2+.17,1.71,-.17,.24,.17,.035,0x3b7290,true);B(width/2+.17,1.71,-.19,.14,.014,.009,0xd2d6c6,false);
  // Cover slots are fitted in both directions, not floating flat bars.
  for(let j=0;j<16;j++){const u=-width/2+(j+.5)*width/16,world=v=>[x+ux*u+nx*v,z+uz*u+nz*v];addBoundaryRibbon(batch,[world(-.27),world(-.09)],width/16*.4,(xx,zz)=>gateSurface(xx,zz)+.002,(xx,zz)=>gateSurface(xx,zz)+.012,0x565e56,{step:.06});boundaryFit.thresholdSlots++;}
  views.push({x,z,y:base,ux,uz,nx,nz,owner,style,label:styleNames[style]});
 }
 // Ignore painted road markings when seating the recessed metalwork.
 const surface=createContactSurfaceSampler(group.children.filter(o=>o.userData.detailKind!=='roadmark'),elevation);
 for(const d of plan.drains)boundaryFit.drains.push(addFittedDrain(batch,d,surface,roadInfo));
 const solids=batch.finish('KoreanStreetBoundary');solids.traverse(o=>{if(!o.isMesh)return;const color=o.material.color.getHex();if(o.name.includes('-surface-')&&[C.joint,C.stoneJoint,0x8d9489].includes(color))o.userData.detailKind='mortar';else if([C.iron,C.green,C.silver,0x536454,0x565e56,0x303b35,0x303e3b].includes(color))o.userData.detailKind='metal';});group.add(solids);group.userData={...plan.qa,gateViews:views,boundaryFit};return{group,segments,colliders,views};
}
