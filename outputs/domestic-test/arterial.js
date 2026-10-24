import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {contactPoints,fitContactPose,contactReport,lowestContact} from './ground-contact.js?v=79';
import {supportSampler,connectedRuns,fittedRibbon,supportFrame,roofPlane} from './terrain-fit.js?v=78';

const C={metal:0x535e60,silver:0xa5ada9,glass:0x668e98,rubber:0x303b40,white:0xd7dad4,curb:0xb6b9ad,paving:0xa7aaa2,yellow:0xc9ad53,blue:0x367daf};
const geo=positions=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();g.computeBoundingSphere();return g;};
export function applyArterialTerrain(root,plan){
 if(!plan)return;
 const ground=[];root.traverse(o=>{if(o.isMesh&&o.name==='ground')ground.push(o);});
 for(const m of ground){m.geometry.dispose();m.geometry=geo(plan.surfaces.ground);}
}
export function inArterial(plan,x,z,pad=0){
 if(!plan)return false;
 const inside=(p,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 return [[x,z],[x-pad,z-pad],[x+pad,z+pad],[x-pad,z+pad],[x+pad,z-pad]].some(p=>plan.publicRings.some(r=>inside(p,r.outer)&&!r.holes.some(h=>inside(p,h))));
}
// Asset dimensions are metres. Small fittings share material batches; the three
// LOD tiers retain the silhouette, paint and functional relationship of each unit.
export function createArterial(plan,elevation){
 const group=new T.Group();group.name='ArterialPublicRealm';const obstacles=[],emitters=[];let assetCount=0;
 const mounts=new Map(),support=supportSampler(plan,elevation),fitQA={railRuns:0,railPosts:0,kerbRuns:0,exits:[],platforms:[],groundContacts:[]};
 function unit(name,position=[0,0,0],heading=0){
  const root=new T.Group();root.name=name;root.position.set(...position);root.rotation.order='YXZ';root.rotation.y=heading;group.add(root);const buckets=new Map(),tyres=[],wheelParts=[];let activeWheel=null;
  function add(g,color,level=2){if(g.index){const expanded=g.toNonIndexed();g.dispose();g=expanded;}for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);const key=color+':'+level;if(!buckets.has(key))buckets.set(key,{color,level,gs:[]});buckets.get(key).gs.push(g);if(activeWheel)activeWheel.push(g);return g;}
  function box(x,y,z,w,h,d,color,level=2,rx=0){const g=new T.BoxGeometry(w,h,d);g.rotateX(rx);g.translate(x,y,z);add(g,color,level);}
  function rod(a,b,r,color,level=1,r2=r){const A=new T.Vector3(...a),B=new T.Vector3(...b),D=B.clone().sub(A),g=new T.CylinderGeometry(r2,r,D.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),D.normalize()));g.translate(...A.add(B).multiplyScalar(.5));add(g,color,level);}
  function beam(a,b,w,h,color,level=1){const A=new T.Vector3(...a),B=new T.Vector3(...b),D=B.clone().sub(A);const g=new T.BoxGeometry(w,h,D.length());g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),D.normalize()));g.translate(...A.add(B).multiplyScalar(.5));add(g,color,level);}
  function strip(points,w,bottom,top,color,level=2){add(fittedRibbon(points,w,bottom,top),color,level);}
  function profile(points,depth,color,level=2,bevel=0){
   const sh=new T.Shape(points.map(p=>new T.Vector2(...p))),g=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,steps:1,curveSegments:8});g.translate(0,0,-depth/2);g.rotateY(Math.PI/2);add(g,color,level);
  }
  function panel(points,color,level=1){const g=geo([0,1,2,0,2,3,2,1,0,3,2,0].flatMap(i=>points[i]));add(g,color,level);}
  function tire(g,level=1){const stored=add(g,C.rubber,level);tyres.push(contactPoints(stored));}
  function wheel(x,y,z,r=.38,w=.21){activeWheel=[];let g=new T.CylinderGeometry(r,r,w,16);g.rotateZ(Math.PI/2);g.translate(x,y,z);tire(g,2);g=new T.CylinderGeometry(r*.58,r*.58,w+.015,12);g.rotateZ(Math.PI/2);g.translate(x,y,z);add(g,C.silver,1);for(let j=0;j<6;j++){const a=j*Math.PI/3;box(x,y+Math.sin(a)*r*.37,z+Math.cos(a)*r*.37,w+.025,.04,.04,C.metal,0);}wheelParts.push(activeWheel);activeWheel=null;}
  function fit(surface){
   fitContactPose(root,tyres,surface);
   // Small independent suspension travel on warped road surfaces; never deform tyres.
   if(wheelParts.length===tyres.length&&tyres.length>2)for(let i=0;i<tyres.length;i++){
    const gap=lowestContact(root,tyres[i],surface).gap,delta=new T.Vector3(0,-gap,0).applyQuaternion(root.quaternion.clone().invert());
    wheelParts[i].forEach(g=>g.translate(delta.x,delta.y,delta.z));tyres[i].forEach(v=>v.add(delta));
   }
   const qa=contactReport(root,tyres,surface);root.userData.groundFit=qa;fitQA.groundContacts.push({name,...qa});
  }
  function glow(x,y,z,w,h,d,color,level=1){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0,roughness:.5}));m.position.set(x,y,z);m.userData.lodMaxLevel=level;m.userData.detailKind='lamp';m.userData.arterialLightColor=color;root.add(m);emitters.push(m);return m;}
  function finish(){for(const {color,level,gs} of buckets.values()){const m=new T.Mesh(mergeGeometries(gs,false),new T.MeshStandardMaterial({color,roughness:.83}));m.name=name+'-parts';m.userData={lodMaxLevel:level,detailKind:color===C.glass?'glass':color===C.rubber?'rubber':color===C.metal?'metal':'poles',arterialAsset:true};m.castShadow=m.receiveShadow=true;root.add(m);gs.forEach(g=>g.dispose());}assetCount++;return root;}
  return{root,box,rod,beam,strip,wheel,tire,fit,glow,add,profile,panel,finish};
 }
 function block(fp,width=.06){for(let i=0;i<fp.length-1;i++)obstacles.push({a:fp[i],b:fp[i+1],width});}
 // Shared endpoint sections prevent cracks where adjoining pieces meet a slope.
 const kerb=unit('arterial-kerbs');
 for(const run of connectedRuns(plan.curbs)){
  kerb.strip(run,.18,(x,z)=>support(x,z,.035)-.14,(x,z)=>support(x,z,.035)+.13,C.curb);
  fitQA.kerbRuns++;
 }
 kerb.finish();
 for(const [kind,positions] of Object.entries(plan.decals))if(positions.length){const m=new T.Mesh(geo(positions),new T.MeshStandardMaterial({color:{white:0xd7d9cc,blue:0x367eae,yellow:0xc2a652,tactile:0xbda454,joint:0x93978f,paverLight:0xbac2bb,paverMid:0x8f9c9b,paverDark:0x697b7e}[kind],roughness:1,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.name='arterial-'+kind;m.userData={surfaceOverlay:true,noPlacementCollision:true,detailKind:'roadmark',lodMaxLevel:kind==='joint'?0:2};m.receiveShadow=true;group.add(m);}
 for(const run of connectedRuns(plan.fences)){
  const f=unit('median-rail');fitQA.railRuns++;
  for(const [x,z] of run){
   const y=support(x,z,.035);f.rod([x,y,z],[x,y+1.02,z],.052,C.metal);fitQA.railPosts++;
   f.strip([[x,z-.075],[x,z+.075]],.15,(xx,zz)=>support(xx,zz,.035)-.025,()=>y+.07,C.silver,1);
   for(const yy of [.25,.67,.95])f.rod([x,y+yy-.025,z],[x,y+yy+.025,z],.054,C.yellow,1);
  }
  for(const y of [.3,.64,.98])f.strip(run,.055,(x,z)=>support(x,z,.035)+y-.0225,(x,z)=>support(x,z,.035)+y+.0225,C.metal,1);
  f.strip(run,.035,(x,z)=>support(x,z,.035)+1.001,(x,z)=>support(x,z,.035)+1.009,0xc2af69,1);
  f.finish();for(let i=1;i<run.length;i++)obstacles.push({a:run[i-1],b:run[i],width:.13});
 }
 for(const s of plan.platforms){
  const a=unit('central-bus-platform-'+s.id,s.position,s.heading),side=s.side,L=s.length;
  const {height:floor,world}=supportFrame(s.position,s.heading,support,.19),roof=roofPlane(floor,2.4,12.3,2.74);
  const strip=(x,z0,z1,w,lo,hi,color,level=2)=>a.strip([[x,z0],[x,z1]],w,lo,hi,color,level);
  const post=(x,z,top,w=.1)=>{const y=floor(x,z);a.box(x,(y+top)/2,z,w,top-y,w,C.silver);strip(x,z-.12,z+.12,.23,(xx,zz)=>floor(xx,zz)-.02,()=>y+.045,C.metal,1);};
  for(const x of [-1.15,1.15])strip(x,-L/2,L/2,.13,(x,z)=>floor(x,z)-.19,(x,z)=>floor(x,z)+.025,C.curb);
  for(const z of [-L/2+.15,L/2-.15])strip(0,z-.15,z+.15,2.4,(x,z)=>floor(x,z)-.19,(x,z)=>floor(x,z)+.025,C.curb);
  strip(0,-6.15,6.15,2.25,roof,(x,z)=>roof(x,z)+.14,C.metal);
  strip(0,-6.05,6.05,2.13,(x,z)=>roof(x,z)+.14,(x,z)=>roof(x,z)+.22,0x7b8580,1);
  for(const z of [-5.7,-1.9,1.9,5.7]){
   post(side*.91,z,roof(side*.91,z));a.beam([-1.1,roof(-1.1,z)-.08,z],[1.1,roof(1.1,z)-.08,z],.08,.08,C.silver,1);
   a.rod([side*.91,roof(side*.91,z)-.34,z],[0,roof(0,z)-.05,z],.025,C.silver,1);
  }
  for(const z of [-3.8,0,3.8]){
   const x=side*.94,lo=(xx,zz)=>floor(xx,zz)+.48,hi=(xx,zz)=>roof(xx,zz)-.40;
   const glass=new T.Mesh(fittedRibbon([[x,z-1.775],[x,z+1.775]],.025,lo,hi),new T.MeshStandardMaterial({color:0x9bb7b5,transparent:true,opacity:.25,depthWrite:false,roughness:.25,side:T.DoubleSide}));glass.userData.lodMaxLevel=1;a.root.add(glass);
   strip(side*.96,z-1.75,z+1.75,.04,(x,z)=>floor(x,z)+.59,(x,z)=>floor(x,z)+.65,C.silver,0);
  }
  for(const z of [-3.7,2.7]){
   const seat=Math.max(...[-.85,.85].flatMap(dz=>[side*.25,side*.82].map(x=>floor(x,z+dz))))+.49;
   a.box(side*.55,seat,z,.62,.09,2.5,0x687775);a.box(side*.82,seat+.37,z,.07,.64,2.5,C.silver,1);
   for(const zz of [z-.85,z+.85])for(const x of [side*.3,side*.8])a.rod([x,floor(x,zz),zz],[x,seat-.045,zz],.032,C.metal,1);
   for(let i=0;i<5;i++)a.box(side*.55,seat+.06,z-1.02+i*.51,.57,.025,.46,0xa5aaa1,0);
   for(const zz of [z-1.05,z,z+1.05]){a.rod([side*.3,seat,zz],[side*.3,seat+.27,zz],.022,C.silver,0);a.rod([side*.3,seat+.27,zz],[side*.7,seat+.27,zz],.022,C.silver,0);}
  }
  const signY=floor(side*.75,-8.1);a.box(side*.75,signY+1.4,-8.1,.13,2.8,.35,C.silver);a.box(side*.75,signY+2.4,-8.1,.16,.75,1,C.blue);a.box(side*.74,signY+1.45,-8.1,.19,.65,.5,C.white,1);
  const screenY=roof(.05,-4.7)-.42;a.box(.05,screenY,-4.7,1.05,.39,.13,C.metal,1);a.glow(.05,screenY,-4.78,.88,.23,.015,0x96c18c,1);
  for(const z of [-4,0,4])a.glow(0,roof(0,z)-.10,z,.12,.025,1.2,0xe8e7cc).rotation.x=-Math.atan(roof(0,z+.5)-roof(0,z-.5));
  strip(-side*.97,-L/2+.4,L/2-.4,.24,(x,z)=>floor(x,z)+.008,(x,z)=>floor(x,z)+.03,C.yellow,1);
  for(const z of [-L/2+.9,L/2-.9])strip(0,z-.275,z+.275,2.1,(x,z)=>floor(x,z)+.008,(x,z)=>floor(x,z)+.03,C.yellow,1);
  for(const x of [-1.10,1.10])strip(x,-6.175,6.175,.055,(x,z)=>roof(x,z)+.10,(x,z)=>roof(x,z)+.23,C.silver,1);
  for(let z=-5.7;z<=5.8;z+=.95)a.beam([-1.05,roof(-1.05,z)-.035,z],[1.05,roof(1.05,z)-.035,z],.025,.035,0x7e8c89,0);
  for(const sign of [-1,1]){
   const z=sign*(L/2-1.3),base=Math.max(...[-.625,.625].flatMap(dz=>[-.88,.88].map(x=>floor(x,z+dz))));
   strip(0,z-.625,z+.625,1.76,(x,z)=>floor(x,z)-.02,()=>base+.02,0x8e8d78,2);
   a.box(0,base+.37,z,1.76,.70,1.25,0xc4a53e,2);
   for(const x of [-.82,.82])for(const y of [.15,.34,.53])a.box(x,base+y,z,.06,.055,1.17,0x9e8537,1);
   for(let i=-2;i<=2;i++){const x=i*.3;a.panel([[x-.10,base+.08,z+sign*.64],[x+.06,base+.08,z+sign*.64],[x+.26,base+.62,z+sign*.64],[x+.10,base+.62,z+sign*.64]],C.rubber,1);}
   a.box(0,base+.76,z,.35,.07,.18,0xe7cf7a,1);
  }
  a.finish();
  [-4,0,4].forEach((z,j)=>{const [x,zz]=world(0,z);mounts.set(`transit-light-${s.id}-${j}`,[x,s.position[1]+roof(0,z)-.10,zz]);});
  fitQA.platforms.push({id:s.id,grade:floor(0,L/2)-floor(0,-L/2),roof:'plane',posts:[-5.7,-1.9,1.9,5.7].map(z=>({at:world(side*.91,z),bottom:floor(side*.91,z)+s.position[1],top:roof(side*.91,z)+s.position[1]}))});
  obstacles.push({a:world(side*1.12,-L/2+2),b:world(side*1.12,L/2-2),width:.1});
 }
 for(const e of plan.exits){
  const W=e.width,L=e.length,position=[...e.position];
  if(!Number.isFinite(e.entryHeight)){const f=supportFrame(position,e.heading,support,.145);position[1]+=f.height(0,-L/2);}
  const a=unit('subway-entrance-'+e.id,position,e.heading);
  const {height:floor,world}=supportFrame(position,e.heading,support,.145),roof=roofPlane(floor,W,L,2.96);
  const strip=(x,z0,z1,w,lo,hi,color,level=2)=>a.strip([[x,z0],[x,z1]],w,lo,hi,color,level);
  // The first tread starts at the approach threshold, not the centre of the hole.
  a.box(0,-.04,-L/2+.08,W-.32,.08,.16,0xa2a69e);
  for(let i=0;i<20;i++){const z=-L/2+.35+i*.37,y=-.17*(i+1);a.box(0,y-.08,z,W-.4,.16,.38,0xa2a69e);a.box(0,y+.006,z-.17,W-.45,.018,.035,0xd1c988,0);}
  for(const x of [-W/2+.07,W/2-.07]){
   strip(x,-L/2,L/2,.16,(xx,zz)=>Math.min(-3.6,floor(xx,zz)-.14),(xx,zz)=>floor(xx,zz)+.035,0x929b96);
   strip(x,-L/2,L/2,.06,(x,z)=>floor(x,z)+1.03,(x,z)=>floor(x,z)+1.09,C.silver,1);
   const glass=new T.Mesh(fittedRibbon([[x,-L/2+.06],[x,L/2-.06]],.025,(x,z)=>floor(x,z)+.10,(x,z)=>floor(x,z)+1.01),new T.MeshStandardMaterial({color:0x9bb6b6,transparent:true,opacity:.22,depthWrite:false,roughness:.3,side:T.DoubleSide}));glass.userData.lodMaxLevel=1;a.root.add(glass);
   for(const z of [-L/2,-L/6,L/6,L/2]){
    const bottom=floor(x,z),top=roof(x,z);a.box(x,(bottom+top)/2,z,.09,top-bottom,.09,C.silver);
    strip(x,z-.1,z+.1,.18,(xx,zz)=>floor(xx,zz)-.025,()=>bottom+.05,C.silver,1);
    for(const y of [.23,1])a.box(x,bottom+y,z+.12,.045,.07,.13,C.metal,0);
   }
   strip(x,-L/2-.1,L/2+.1,.10,(x,z)=>roof(x,z)-.045,(x,z)=>roof(x,z)+.045,C.silver);
   a.rod([x,-.1,-L/2+.5],[x,-2.8,L/2-.6],.035,C.silver,0);
   for(let z=-L/2+.5;z<L/2;z+=.7)a.box(x,floor(x,z)+.63,z,.025,.10,.10,0xc5d5d3,0);
  }
  strip(0,L/2-.14,L/2,W,()=>-3.6,(x,z)=>floor(x,z)+.035,0x566664);
  a.box(0,-3.49,L/2-.55,W-.30,.18,1.1,0x7a8580);
  for(const z of [-L/2,-L/6,L/6,L/2])a.beam([-W/2-.1,roof(-W/2-.1,z),z],[W/2+.1,roof(W/2+.1,z),z],.07,.07,C.silver,1);
  const glass=new T.Mesh(fittedRibbon([[0,-L/2-.05],[0,L/2+.05]],W+.1,(x,z)=>roof(x,z)+.035,(x,z)=>roof(x,z)+.07),new T.MeshStandardMaterial({color:0x9eb9bb,transparent:true,opacity:.37,roughness:.3,depthWrite:false}));glass.userData.lodMaxLevel=1;a.root.add(glass);
  const frontY=roof(0,-L/2)-.24;a.box(0,frontY,-L/2-.06,W+.18,.36,.15,0x4b788e);a.box(-W*.38,frontY,-L/2-.145,.16,.16,.02,0xd5d7c6,1);
  for(const z of [-2.8,0,2.8])a.glow(0,roof(0,z)-.06,z,.12,.025,1.1,0xe2e8db).rotation.x=-Math.atan(roof(0,z+.5)-roof(0,z-.5));
  const signY=floor(W/2+.3,L/2-.35);a.box(W/2+.3,signY+1.5,L/2-.35,.23,3,.45,C.silver);a.box(W/2+.3,signY+2.55,L/2-.35,.25,.6,.70,0x497f94);
  for(const side of [-1,1]){const x=side*(W/2+.075);strip(x,-L/2-.14,L/2+.14,.13,(x,z)=>roof(x,z)+.015,(x,z)=>roof(x,z)+.185,0xc2c9c4,1);}
  strip(0,-L/2-.7,-L/2-.2,W-.4,(x,z)=>floor(x,z)+.004,(x,z)=>floor(x,z)+.022,C.yellow,1);
  for(let x=-W/2+.3;x<W/2-.15;x+=.16)for(let z=-L/2-.65;z<-L/2-.22;z+=.16)a.box(x,floor(x,z)+.028,z,.04,.012,.04,0xd3bd70,0);
  a.box(-W/2+.3,roof(-W/2+.3,-L/2+.4)-.17,-L/2+.4,.18,.12,.27,C.white,0);
  a.finish();block(e.footprint,.1);
  [-2.8,2.8].forEach((z,j)=>{const [x,zz]=world(0,z);mounts.set(`transit-light-${e.id}-${j}`,[x,position[1]+roof(0,z)-.06,zz]);});
  fitQA.exits.push({id:e.id,threshold:position[1],frontToBack:floor(0,L/2)-floor(0,-L/2),roof:'plane',posts:[-L/2,-L/6,L/6,L/2].map(z=>({at:world(W/2-.07,z),bottom:floor(W/2-.07,z)+position[1],top:roof(W/2-.07,z)+position[1]}))});
 }
 for(const p of plan.furniture){
  const a=unit(p.kind,p.position,p.heading);
  const lift=p.kind==='drain'?.035:p.kind==='kiosk'?0:.145;
  let {height:floor,world}=supportFrame(p.position,p.heading,support,lift);
  const surface=(x,z)=>support(x,z,lift);
  const child=(name,x,z)=>{const [xx,zz]=world(x,z);return unit(name,[xx,surface(xx,zz),zz],p.heading);};
  if(p.kind==='tree-pit'){for(const x of [-.73,.73])a.box(x,.025,0,.12,.08,1.5,C.curb);for(const z of [-.73,.73])a.box(0,.025,z,1.5,.08,.12,C.curb);a.box(0,-.025,0,1.34,.04,1.34,0x55584a);for(const x of [-.5,-.3,.3,.5])a.box(x,.005,0,.065,.035,1.30,C.metal,0);}
  if(p.kind==='bollard'){const y=floor(0,0);a.rod([0,y,0],[0,y+.85,0],.095,C.metal);a.rod([0,y+.62,0],[0,y+.73,0],.098,C.white,1);a.strip([[0,-.14],[0,.14]],.28,(x,z)=>floor(x,z)-.02,(x,z)=>floor(x,z)+.07,C.curb,1);block(p.footprint);}
  if(p.kind==='cabinet'){a.box(0,.1,0,1.0,.2,.65,C.curb);a.box(0,.77,0,.86,1.35,.55,0xa0ada4);a.box(0,1.47,0,.92,.09,.61,C.silver);a.box(0,.82,-.285,.012,1.13,.012,C.metal,1);a.box(.16,.75,-.29,.035,.15,.02,C.metal,0);for(let i=0;i<6;i++)a.box(-.22,1.15+i*.035,-.283,.25,.012,.012,C.metal,0);block(p.footprint);}
  if(p.kind==='hydrant'){a.box(0,.72,0,.48,1.44,.34,0x9d4b40);a.box(0,1.04,-.18,.34,.38,.025,0xcbd1c5,1);a.box(.12,.58,-.19,.025,.14,.03,C.silver,0);block(p.footprint);}
  if(p.kind==='bike-rack'){
   // Two continuous foot rails follow the pavement; each hoop remains vertical.
   for(const z of [-.4,.4])a.strip([[-1.75,z],[1.75,z]],.08,(x,z)=>floor(x,z)-.012,(x,z)=>floor(x,z)+.05,C.silver,1);
   for(const x of [-1.4,-.7,0,.7,1.4]){const top=Math.max(floor(x,-.4),floor(x,.4))+.65;a.rod([x,floor(x,-.4)+.04,-.4],[x,top,0],.026,C.silver,1);a.rod([x,top,0],[x,floor(x,.4)+.04,.4],.026,C.silver,1);}
   for(const offset of [-.7,.7]){const b=child('rack-bicycle',offset,0);for(const z of [-.55,.55]){const g=new T.TorusGeometry(.31,.026,8,24);g.rotateY(Math.PI/2);g.translate(0,.34,z);b.tire(g);const h=new T.TorusGeometry(.28,.012,6,24);h.rotateY(Math.PI/2);h.translate(0,.34,z);b.add(h,C.silver,0);}const v=[[0,.35,-.55],[0,.66,-.15],[0,.35,.10],[0,.73,.35],[0,.35,.55]];for(const [i,j] of [[0,1],[1,2],[0,2],[1,3],[2,3],[3,4],[2,4]])b.rod(v[i],v[j],.023,0x596a69,1);b.box(0,.74,-.14,.21,.055,.22,C.rubber,1);b.rod([0,.73,.35],[0,.93,.43],.024,C.silver,1);b.box(0,.93,.43,.43,.035,.06,C.metal,1);b.fit(surface);b.finish();}
   block(p.footprint);
  }
  if(p.kind==='station-vent'){
   const L=p.length,W=p.width,top=roofPlane(floor,W,L,.52);
   a.strip([[0,-L/2],[0,L/2]],W,(x,z)=>floor(x,z)-.025,top,0x959c96);
   a.strip([[0,-L/2-.02],[0,L/2+.02]],W+.04,top,(x,z)=>top(x,z)+.07,C.silver,1);
   for(let z=-L/2+.16;z<L/2-.12;z+=.13)a.beam([-W/2+.085,top(-W/2+.085,z)+.09,z],[W/2-.085,top(W/2-.085,z)+.09,z],.045,.045,C.metal,0);
   for(const x of [-W/2+.04,W/2-.04]){for(let z=-L/2+.1;z<L/2;z+=1.55)a.rod([x,top(x,z),z],[x,top(x,z)+.60,z],.027,C.silver,1);a.rod([x,top(x,-L/2+.1)+.60,-L/2+.1],[x,top(x,L/2-.1)+.60,L/2-.1],.032,C.silver,1);}
   block(p.footprint);
  }
  if(p.kind==='drain'){
   a.box(0,.008,0,.28,.02,.68,C.metal,1);for(let z=-.28;z<.30;z+=.075)a.box(0,.023,z,.22,.012,.025,0x929c95,0);
  }
  if(p.kind==='utility-cover'){
   a.box(0,.008,0,.52,.012,.68,0x6b7775,1);a.box(0,.017,0,.47,.01,.63,0x939c93,1);
   for(let z=-.25;z<=.26;z+=.085)a.box(0,.026,z,.41,.009,.012,C.metal,0);for(const x of [-.14,.14])a.box(x,.027,.18,.07,.01,.018,C.rubber,0);
  }
  if(p.kind==='kiosk'){
   a.root.scale.set(p.width/1.7,1,p.length/3.4);
   const side=p.side||1;a.box(0,.07,0,1.65,.14,3.35,0x737c77);a.box(-side*.12,.55,0,1.32,.95,3.12,0x6e8080);
   for(const z of [-1.48,1.48])for(const x of [-.67,.67])a.box(x,1.24,z,.055,2.34,.055,C.silver);
   // Shallow pitched cloth roof, with a short scallop-free hanging valance.
   a.panel([[-.85,2.25,-1.7],[.85,2.25,-1.7],[.85,2.5,0],[-.85,2.5,0]],0x677e80,2);
   a.panel([[-.85,2.5,0],[.85,2.5,0],[.85,2.25,1.7],[-.85,2.25,1.7]],0x7a9191,2);
   a.box(side*.84,2.19,0,.035,.18,3.4,0x6c8383);a.box(-side*.68,1.55,0,.055,1.04,3.05,0x9ba49b,1);
   a.box(side*.63,1.03,0,.52,.07,3.08,0xc4c4b0,1);
   for(const z of [-1,-.35,.35,1]){a.box(side*.35,1.22,z,.35,.30,.42,[0xa67c59,0xc1b596,0x7e9580][Math.abs(Math.round(z*3))%3],1);a.box(side*.35,1.39,z,.32,.04,.40,0xd1c9ac,0);}
   a.box(side*.72,1.84,0,.03,.36,1.50,0xc1b491,1);a.glow(side*.70,2.23,0,.06,.025,1.4,0xd8d4ae,1);block(p.footprint);
  }
  if(p.kind==='scooter-bay'){
   for(const offset of [-.58,.58]){const b=child('parked-scooter',0,offset);
    for(const x of [-.57,.57]){const g=new T.TorusGeometry(.22,.055,8,24);g.translate(x,.28,0);b.tire(g);const h=new T.CylinderGeometry(.13,.13,.13,12);h.rotateX(Math.PI/2);h.translate(x,.28,0);b.add(h,C.silver,1);}
    b.box(0,.34,0,.84,.13,.37,0x7f9392,1);b.box(-.3,.68,0,.56,.48,.44,0xc8d0c7,2);b.box(-.21,.94,0,.71,.12,.45,C.rubber,1);
    b.rod([.57,.35,0],[.35,1.21,0],.05,C.silver,1);b.box(.40,.69,0,.20,.60,.44,0xaebfb7,2);b.box(.35,1.18,0,.19,.11,.56,C.metal,1);
    b.glow(.46,1.18,0,.025,.12,.25,0xdbdfcc,1);for(const z of [-.29,.29]){b.rod([.35,1.19,z*.7],[.32,1.43,z],.013,C.metal,0);b.box(.32,1.44,z,.03,.09,.15,C.silver,0);}
    b.box(-.5,1.20,0,.48,.42,.51,0x526669,1);b.fit(surface);
    // The stand meets the pavement independently of the vehicle's pitch.
    b.root.updateMatrix();const foot=new T.Vector3(-.12,0,.31).applyMatrix4(b.root.matrix);foot.y=surface(foot.x,foot.z);foot.applyMatrix4(b.root.matrix.clone().invert());b.rod([0,.35,.12],foot.toArray(),.022,C.metal,0);b.finish();
   }block(p.footprint);
  }
  if(p.kind==='cycle-dock'){
   for(let z0=-2;z0<=2;z0+=1){const y=floor(-.5,z0);
    a.box(-.5,y+.34,z0,.19,.68,.18,0xa0b6a4,1);a.box(-.5,y+.71,z0,.25,.09,.24,C.white,1);
    a.strip([[-.5,z0-.14],[-.5,z0+.14]],.29,(x,z)=>floor(x,z)-.018,()=>y+.055,C.silver,1);
    const b=child('docked-bicycle',0,z0);
    for(const x of [-.5,.5]){const g=new T.TorusGeometry(.31,.025,8,24);g.translate(x,.34,0);b.tire(g);const h=new T.TorusGeometry(.28,.010,6,24);h.translate(x,.34,0);b.add(h,C.silver,0);}
    const pts=[[-.5,.34,0],[-.2,.76,0],[.06,.34,0],[.3,.76,0],[.5,.34,0]];for(const [i,j] of [[0,1],[1,2],[0,2],[1,3],[2,3],[3,4],[2,4]])b.rod(pts[i],pts[j],.025,i%2?0x8eaf77:0xd3dfd3,1);
    b.box(-.18,.82,0,.24,.06,.20,C.rubber,1);b.rod([.3,.75,0],[.34,.99,0],.025,C.metal,1);b.box(.34,.99,0,.06,.035,.45,C.metal,1);b.box(.53,.92,0,.30,.25,.36,0x819c87,1);b.fit(surface);b.finish();
   }block(p.footprint);
  }
  if(p.kind==='lamp-base')a.box(0,.035,0,.48,.07,.48,C.curb,1);
  // Thin ground fixtures follow the surface. Rigid cabinets/kiosks sit on a
  // tailored plinth; their doors and body remain rectangular.
  if(['cabinet','hydrant','kiosk'].includes(p.kind)){
   const W=p.kind==='kiosk'?1.65:p.kind==='cabinet'?1:.5,L=p.kind==='kiosk'?3.35:p.kind==='cabinet'?.65:.36;
   const sx=a.root.scale.x,sz=a.root.scale.z;
   const base=Math.max(...[-W/2,W/2].flatMap(x=>[-L/2,L/2].map(z=>floor(x*sx,z*sz))));
   a.root.position.y+=base;const original=floor;floor=(x,z)=>original(x*sx,z*sz)-base;
   a.strip([[0,-L/2],[0,L/2]],W,(x,z)=>floor(x,z)-.025,()=>.025,0x969d96,2);
  }
  a.finish();
  if(['tree-pit','drain','utility-cover','lamp-base'].includes(p.kind))a.root.traverse(o=>{
   if(!o.isMesh)return;const ps=o.geometry.attributes.position;
   for(let i=0;i<ps.count;i++)ps.setY(i,ps.getY(i)+floor(ps.getX(i),ps.getZ(i)));
   ps.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();
  });
 }
 for(const p of plan.vehicles){
  const a=unit(p.kind==='bus'?'low-floor-city-bus':'arterial-car',p.position,p.heading),bus=p.kind==='bus';
  if(bus){
   const col=p.variant?0x49865d:0x3d70a4;
   const outline=[[-5.33,.48]];for(const c of [-3.35,3.35]){outline.push([c-.63,.48]);for(let i=0;i<=12;i++){const angle=Math.PI-i*Math.PI/12;outline.push([c+Math.cos(angle)*.63,.49+Math.sin(angle)*.63]);}}outline.push([5.33,.48],[5.40,.90],[5.40,2.36],[5.26,2.82],[-5.14,2.82],[-5.35,2.66]);a.profile(outline,2.37,col,2,.035);
   a.box(0,.47,0,1.9,.13,9.8,C.rubber,1);a.box(0,2.88,0,2.35,.15,10.55,C.white);a.box(0,3.04,-.6,1.5,.22,3.4,0xb4bfbc,1);
   a.panel([[-1.07,1.44,5.42],[1.07,1.44,5.42],[1.07,2.61,5.44],[-1.07,2.61,5.44]],C.glass,2);a.box(0,1.36,5.44,2.16,.10,.035,C.rubber,1);a.box(0,2.79,5.45,1.65,.26,.02,C.rubber,1);a.box(0,2.05,-5.43,1.96,1.16,.025,C.glass,1);
   for(const side of [-1,1]){a.box(side*1.225,2.10,0,.03,1.14,10.05,C.rubber);for(let z=-4.6;z<4.9;z+=1.23)a.box(side*1.245,2.15,z,.025,.96,1.10,C.glass,1);for(const z of [-3.3,3.4])a.wheel(side*1.19,.52,z,.50,.24);a.rod([side*1.17,2.65,4.75],[side*1.61,2.5,4.95],.035,C.metal,1);a.box(side*1.62,2.30,4.98,.14,.43,.22,C.rubber,1);}
   for(const z of [3.65,.65]){a.box(-1.263,1.58,z,.025,2.02,1.13,C.metal,1);for(const zz of [z-.28,z+.28]){a.box(-1.28,1.88,zz,.018,1.22,.46,C.glass,1);a.box(-1.28,.80,zz,.018,.55,.46,C.white,1);}}
   for(const side of [-1,1]){a.box(side*1.23,1.34,-.20,.024,.50,4.65,C.white,1);a.box(side*1.24,1.60,0,.025,.045,10.1,0xbecbc8,1);}
   a.box(0,.55,-5.40,2.10,.16,.10,C.rubber,1);a.box(0,.82,-5.43,.46,.18,.025,0xd5d6c8,1);for(let i=0;i<5;i++)a.box(.48,1.30+i*.085,-5.42,.76,.028,.018,C.metal,0);
   for(const side of [-1,1])for(let z=-1.9;z<.8;z+=.18)a.box(side*.76,3.06,z,.025,.12,.06,C.metal,0);
   a.box(0,.87,5.48,1.2,.20,.04,C.metal,1);for(const x of [-.9,.9]){a.glow(x,1.02,5.49,.29,.16,.025,0xe0e2c3);a.glow(x,1.02,-5.49,.17,.34,.025,0xa45442);}
   for(let z=-4.7;z<-3.2;z+=.15)a.box(-1.25,1.17,z,.025,.31,.055,C.metal,0);
   for(const x of [-.5,.5])a.rod([x,1.45,5.46],[x+.23,1.95,5.47],.014,C.rubber,0);
  }else{
   const variant=p.variant%5,suv=variant===2||variant===4,roof=suv?1.69:1.40,col=[0xc7d1cd,0x4b626c,0xb3b7ac,0xddd9cb,0x9eaeb1][variant];
   const profile=[[-2.23,.35]];for(const c of [-1.425,1.425]){profile.push([c-.41,.35]);for(let i=0;i<=10;i++){const v=Math.PI-i*Math.PI/10;profile.push([c+Math.cos(v)*.41,.36+Math.sin(v)*.41]);}}profile.push([2.23,.35],[2.27,.65],[1.8,.79],[.98,.86],[-1.15,.85],[-2.18,.78]);a.profile(profile,1.75,col,2,.035);
   const rear=suv?-1.35:-.94,front=.65,topRear=suv?-1.08:-.67,topFront=.25;
   // Sloping screen and side-window silhouettes, five stable body/paint variants.
   a.profile([[-front,.83],[-topFront,roof],[ -topRear,roof],[ -rear,.84]],1.48,col,2,.018);
   a.panel([[-.70,.89,front+.022],[.70,.89,front+.022],[.70,roof-.07,topFront+.022],[-.70,roof-.07,topFront+.022]],C.glass,2);
   a.panel([[.70,.90,rear-.022],[-.70,.90,rear-.022],[-.70,roof-.07,topRear-.022],[.70,roof-.07,topRear-.022]],C.glass,1);
   for(const side of [-1,1]){
    const x=side*.762;a.panel([[x,.91,rear+.10],[x,.91,front-.10],[x,roof-.08,topFront-.05],[x,roof-.08,topRear+.05]],C.glass,1);a.box(x,1.13,-.30,.026,(roof-.91)*.96,.055,C.rubber,1);
    for(const z of [-1.425,1.425])a.wheel(side*.85,.36,z,.34,.20);a.box(side*.93,1.02,.48,.16,.12,.24,col,1);for(const z of [-.70,.30])a.box(side*.89,.82,z,.025,.025,.15,C.silver,0);
    a.glow(side*.64,.68,2.27,.42,.10,.025,0xe7e8d7);a.glow(side*.66,.68,-2.26,.36,.12,.025,0x9f4c45);
    if(suv)a.rod([side*.59,roof+.05,topRear],[side*.59,roof+.05,topFront],.024,C.silver,1);
   }
   a.box(0,.52,2.28,.94,.15,.035,C.rubber,1);for(const x of [-.58,0,.58])a.box(x,.45,2.29,.30,.025,.03,C.silver,0);a.box(0,.54,-2.27,.41,.14,.025,0xd2d7ce,1);
   for(const x of [-.45,.45])a.rod([x,.92,front+.03],[x+.17,1.09,front-.07],.012,C.rubber,0);

  }
  a.fit((x,z)=>support(x,z,.035));a.finish();block(p.footprint,.06);
 }
 for(const p of plan.crossings){const a=unit('crosswalk-signal',p.position,Math.atan2(plan.alignment.u[0],plan.alignment.u[1])),side=p.side;
  a.rod([0,0,0],[0,5.5,0],.09,C.metal,2,.055);a.rod([0,5.48,0],[-side*5.6,5.48,0],.065,C.metal,2,.045);
  a.box(-side*4,5.3,0,1.40,.38,.25,C.rubber,1);
  for(let i=0;i<4;i++){const x=-side*4-.49+i*.33;a.glow(x,5.3,side*.137,.18,.18,.025,i===0?0xc86a50:0x37433e,1);a.box(x,5.49,side*.11,.27,.035,.24,C.rubber,0);}
  // Pedestrian head faces across the carriageway. A simple lit walking pictogram.
  a.box(-side*.16,2.25,0,.22,.66,.34,C.rubber,1);
  const face=-side*.281;a.box(face,2.40,0,.025,.24,.24,0x433b39,1);a.box(face,2.11,0,.025,.25,.24,0x243d34,1);
  a.box(face-side*.015,2.18,0,.025,.046,.045,0x7bd4a0,1);
  a.rod([face-side*.015,2.15,0],[face-side*.015,2.06,.025],.018,0x7bd4a0,1);
  for(const sign of [-1,1]){a.rod([face-side*.015,2.08,.01],[face-side*.015,2.00,sign*.065],.014,0x7bd4a0,1);a.rod([face-side*.015,2.13,0],[face-side*.015,2.08,sign*.075],.012,0x7bd4a0,1);}
  a.box(0,1.05,.095,.16,.20,.08,C.rubber,0);
  a.root.position.y=support(p.position[0],p.position[2],.145);const foot=supportFrame(a.root.position.toArray(),a.root.rotation.y,support,.145).height;a.strip([[0,-.14],[0,.14]],.28,(x,z)=>foot(x,z)-.02,()=>.04,C.silver,1);a.finish();
 }
 group.userData={...plan.qa,assetAssemblies:assetCount,walkObstacles:obstacles,terrainFit:fitQA};
 return{group,alignLights(lightPlan){for(const light of lightPlan.lights){const at=mounts.get(light.id);if(at){light.root=[at[0],at[1]-light.height-.05,at[2]];light.reach=0;}}},set(night,style,scene=group){scene.traverse(m=>{if(m.userData.arterialLightColor===undefined)return;const originals=[m.material,m._originalMaterial].flat().filter(Boolean);for(const mat of originals)if(mat.emissive){mat.emissive.setHex(m.userData.arterialLightColor);mat.emissiveIntensity=style==='color'?.15+night*1.6:0;}});},dispose(){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});}};
}
