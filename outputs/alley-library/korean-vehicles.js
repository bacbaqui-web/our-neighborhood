import * as T from '../domestic-test/vendor/three.module.js';
// Hand-built mesh: screenshots inform proportions only; no source mesh or image texture is included.
export const koreanVehicleCatalog=[{id:213,name:'한국형 1톤 카고 트럭',category:'주차·이동',source:'포터 II 외형 참고 · 직접 제작',file:'korean-truck.glb'},{id:214,name:'한국형 냉동 탑차',category:'주차·이동',source:'봉고 외형 참고 · 직접 제작',file:'korean-box-truck.glb'},{id:215,name:'한국형 마을버스',category:'주차·이동',source:'카운티 외형 참고 · 직접 제작',file:'korean-minibus.glb'}];
export function createKoreanVehicle(id){
 const root=new T.Group();root.name=koreanVehicleCatalog.find(a=>a.id===id).name;root.userData={source:'Hand-built procedural mesh; screenshot reference only',vehicle:true};
 const C={body:0xd5d9d5,edge:0x7d898b,glass:0x344b56,rubber:0x293236,metal:0x8e999b,light:0xe4dfc5,red:0xa34d42,amber:0xc99755,green:0x6b967a,dark:0x3f4d51};
 const cache=new Map();function mat(k){if(!cache.has(k))cache.set(k,new T.MeshStandardMaterial({color:C[k]??k,roughness:k==='glass'?.32:.78,side:T.DoubleSide}));return cache.get(k)}
 function mesh(geo,k,name){const m=new T.Mesh(geo,mat(k));m.name=name||k;m.userData.detailKind=k;root.add(m);return m}
 function box(x,y,z,w,h,d,k='body',name){const m=mesh(new T.BoxGeometry(w,h,d),k,name);m.position.set(x,y,z);return m}
 function panel(points,k='glass',name){const g=new T.BufferGeometry();const p=[];for(let i=1;i<points.length-1;i++)p.push(...points[0],...points[i],...points[i+1]);g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return mesh(g,k,name)}
 function rod(a,b,r=.016,k='dark'){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=mesh(new T.CylinderGeometry(r,r,v.length(),4),k);m.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m}
 function profile(points,width,k='body',name){if(name==='cab-shell'||name==='bus-shell'){const shape=new T.Shape(points.map(p=>new T.Vector2(...p)));const geo=new T.ExtrudeGeometry(shape,{depth:width-.08,bevelEnabled:true,bevelThickness:.04,bevelSize:.025,bevelSegments:1,steps:1,curveSegments:1});geo.translate(0,0,-width/2+.04);return mesh(geo,k,name)}const ps=points.map(p=>new T.Vector2(...p)),faces=T.ShapeUtils.triangulateShape(ps,[]),out=[];const p=(i,s)=>[points[i][0],points[i][1],s*width/2];for(const f of faces){out.push(...p(f[2],-1),...p(f[1],-1),...p(f[0],-1),...p(f[0],1),...p(f[1],1),...p(f[2],1));}for(let i=0;i<points.length;i++){const j=(i+1)%points.length;out.push(...p(i,-1),...p(j,-1),...p(j,1),...p(i,-1),...p(j,1),...p(i,1));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out,3));g.computeVertexNormals();return mesh(g,k,name)}
 function arch(cx,cy,r){return Array.from({length:7},(_,i)=>{const a=Math.PI*i/6;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]})}
 function wheel(x,z,r=.32,w=.20){const tyre=mesh(new T.CylinderGeometry(r,r,w,12),'rubber','tyre');tyre.rotation.x=Math.PI/2;tyre.position.set(x,r,z);tyre.userData.groundContactWheel=true;const rim=mesh(new T.CylinderGeometry(r*.59,r*.59,.018,8),'metal','rim');rim.rotation.x=Math.PI/2;rim.position.set(x,r,z+Math.sign(z)*(w/2+.006));const hub=mesh(new T.CircleGeometry(r*.2,4),'dark','hub');hub.position.copy(rim.position);hub.position.z+=Math.sign(z)*.011;}
 if(id!==215){
  const bongo=id===214,front=2.55,axle=1.5;
  // Open wheel arch belongs to the cab silhouette, not a dark decal painted over a solid box.
  profile([[.58,.45],[.58,1.98],[1.65,2.00],[2.02,1.9],[2.42,1.18],[2.55,.98],[2.55,.52],[2.36,.45],...arch(axle,.34,.42),[.91,.45]],1.72,'body','cab-shell');
  panel([[2.092,1.86,-.74],[2.092,1.86,.74],[2.46,1.2,.78],[2.46,1.2,-.78]],'glass','windshield');
  panel([[.545,1.30,-.60],[.545,1.30,.60],[.545,1.78,.60],[.545,1.78,-.60]],'glass','cab-rear-window');
  for(const s of [-1,1]){
   const z=s*.865;
   panel([[.72,1.84,z],[1.62,1.86,z],[1.94,1.78,z],[2.22,1.23,z],[.72,1.23,z]],'glass','side-window');
   panel([[.72,1.84,z+s*.003],[.765,1.84,z+s*.003],[.765,1.23,z+s*.003],[.72,1.23,z+s*.003]],'dark');
   panel([[.69,.75,z],[.70,1.18,z],[.72,1.18,z],[.71,.75,z]],'edge','door-seam');
   panel([[.69,.75,z],[.94,.75,z],[.94,.765,z],[.69,.765,z]],'edge','door-seam');
   box(.82,1.08,z+s*.009,.06,.14,.021,'dark','door-handle');
   box(2.1,1.37,s*.99,.15,.27,.08,'dark','wing-mirror');rod([2.02,1.25,z],[2.1,1.31,s*.98],.017);
   panel([[2.59,.96,s*.56],[2.59,.96,s*.78],[2.59,.62,s*.78],[2.59,.62,s*.55]],'light','headlamp');
   panel([[2.59,.65,s*.55],[2.59,.65,s*.78],[2.59,.60,s*.78],[2.59,.60,s*.55]],'amber','indicator');
   box(2.59,.40,s*.60,.016,.11,.20,'dark','fog-lamp');
   wheel(axle,s*.78);wheel(-1.32,s*.78);
  }
  box(2.51,.48,0,.13,.14,1.69,'body','bumper');
  panel([[2.581,.74,-.47],[2.581,.74,.47],[2.581,.66,.44],[2.581,.66,-.44]],'dark','front-grille');
  panel([[2.581,.56,-.43],[2.581,.56,.43],[2.581,.50,.43],[2.581,.50,-.43]],'dark');
  box(2.588,.47,0,.012,.12,.32,'light','blank-plate');
  for(const s of [-1,1])rod([2.45,1.21,s*.61],[2.33,1.42,s*.18],.011);
  box(-.70,.49,0,3.35,.18,1.25,'dark','chassis');
  if(!bongo){
   box(-1.01,.82,0,3.08,.12,1.74,'edge','bed-floor');
   for(const s of [-1,1]){
    box(-1.01,1.055,s*.85,3.08,.38,.045,'body','bed-side');
    for(const y of [.94,1.16])panel([[-2.53,y,s*.878],[.51,y,s*.878],[.51,y+.017,s*.878],[-2.53,y+.017,s*.878]],'edge','bed-rib');
    for(const x of [-2.44,-1.01,.40])box(x,1.04,s*.88,.04,.33,.026,'edge','bed-latch');
   }
   box(-2.53,1.055,0,.045,.38,1.74,'body','tailgate');box(.51,1.13,0,.045,.52,1.74,'body','headboard');
   for(const s of [-1,1]){box(.52,1.55,s*.83,.045,.77,.045,'edge','rack-upright');box(-2.52,.61,s*.65,.06,.13,.24,'red','tail-light');}
   box(.52,1.92,0,.045,.045,1.7,'edge','rack-top');
   for(const s of [-1,1])box(-1.65,.32,s*.79,.06,.35,.22,'rubber','mudflap');
  }else{
   box(-.99,1.65,0,3.10,1.72,1.86,'body','cargo-box');
   for(const s of [-1,1]){
    for(const y of [.81,2.5])box(-.99,y,s*.934,3.11,.035,.025,'edge','box-edge');
    panel([[-2.545,.84,s*.91],[-2.545,2.47,s*.91],[-2.545,2.47,s*.02],[-2.545,.84,s*.02]],'body','rear-door');
    rod([-2.568,.96,s*.45],[-2.568,2.36,s*.45],.012,'metal');
    for(const y of [1.03,2.24])box(-2.57,y,s*.80,.035,.05,.18,'edge','door-hinge');
    box(-2.52,.62,s*.66,.08,.12,.25,'red','tail-light');
   }
   box(-2.565,1.65,0,.026,1.67,.024,'dark','door-center');
   profile([[.57,1.97],[.57,2.48],[1.25,2.48],[1.43,2.32],[1.43,2.07]],1.15,'body','refrigerator');
   for(const z of [-.36,-.18,0,.18,.36])panel([[1.435,2.13,z],[1.435,2.31,z],[1.435,2.31,z+.065],[1.435,2.13,z+.065]],'dark','cooler-vent');
  }
  box(-2.57,.49,0,.07,.10,1.53,'edge','rear-bumper');
 }else{
  const f=3.5,r=-3.5;
  profile([[r,.57],[r,2.45],[-3.28,2.72],[2.63,2.72],[2.96,2.56],[3.27,1.44],[f,1.18],[f,.57],[2.47,.57],...arch(1.98,.42,.5),[-1.66,.57],...arch(-2.16,.42,.5)],2.03,'body','bus-shell');
  panel([[3.02,2.51,-.9],[3.02,2.51,.9],[3.30,1.48,.92],[3.30,1.48,-.92]],'glass','bus-windshield');
  for(const s of [-1,1]){
   const z=s*1.021;
   // Distinct right-hand passenger folding door; driver side keeps the cab window.
   for(const [x0,x1]of [[-3.25,-2.20],[-2.12,-1.05],[-.97,.10],[.18,1.20]])panel([[x0,1.43,z],[s>0&&x0>.1?.45:x1,1.43,z],[s>0&&x0>.1?.45:x1,2.43,z],[x0,2.43,z]],'glass','passenger-window');
   if(s<0){panel([[1.32,1.43,z],[2.96,1.43,z],[2.77,2.43,z],[1.32,2.43,z]],'glass','driver-window');panel([[2.1,1.44,z-.003],[2.13,1.44,z-.003],[2.13,2.43,z-.003],[2.1,2.43,z-.003]],'body');}
   else{
    box(.96,1.47,z+.008,.84,1.90,.018,'dark','entry-door-frame');
    for(const x of [.75,1.16])panel([[x-.17,.63,z+.023],[x+.17,.63,z+.023],[x+.17,2.36,z+.023],[x-.17,2.36,z+.023]],'glass','folding-door');
    panel([[1.49,1.43,z],[2.97,1.43,z],[2.77,2.43,z],[1.49,2.43,z]],'glass','front-quarter-window');
   }
   panel([[-3.48,1.24,z],[3.40,1.24,z],[3.4,1.37,z],[-3.48,1.37,z]],'green','service-stripe');
   // Lower stripe avoids wheel openings rather than covering tyre arches.
   for(const[a,b]of[[-3.48,-2.68],[-1.64,1.46],[2.5,3.48]])panel([[a,.59,z],[b,.59,z],[b,.76,z],[a,.76,z]],'green','lower-stripe');
   wheel(1.98,s*.93,.42,.22);wheel(-2.16,s*.93,.42,.22);
   box(3.13,2.12,s*1.17,.16,.35,.09,'dark','bus-mirror');rod([3.06,2.30,s*1.01],[3.13,2.28,s*1.16],.022);
   box(3.54,.95,s*.72,.023,.18,.36,'light','headlamp');box(3.54,.78,s*.73,.024,.065,.35,'amber','indicator');
   box(-3.54,.88,s*.84,.025,.35,.12,'red','rear-light');
  }
  panel([[3.54,1.18,-.52],[3.54,1.18,.52],[3.54,.93,.45],[3.54,.93,-.45]],'dark','bus-grille');
  box(3.46,.60,0,.12,.13,1.98,'edge','front-bumper');box(-3.49,.57,0,.10,.11,1.98,'edge','rear-bumper');
  box(3.53,.67,0,.016,.15,.44,'light','blank-front-plate');box(-3.55,.66,0,.016,.15,.44,'light','blank-rear-plate');
  panel([[-3.54,1.55,-.82],[-3.54,1.55,.82],[-3.54,2.39,.82],[-3.54,2.39,-.82]],'glass','rear-window');
  box(2.77,2.70,0,.36,.09,.82,'dark','blank-route-display');
  for(const s of [-1,1])rod([3.30,1.49,s*.72],[3.21,1.87,s*.18],.013);
  box(-.8,.52,0,4.6,.14,1.3,'dark','underbody');
 }
 // Batch static geometry by material to reduce draw calls, retaining tyre nodes for rigid ground fitting.
 root.updateMatrixWorld(true);const bins=new Map();for(const m of [...root.children]){if(m.userData.groundContactWheel)continue;const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);const key=m.material.uuid;if(!bins.has(key))bins.set(key,{material:m.material,pos:[],norm:[]});const b=bins.get(key);b.pos.push(...g.attributes.position.array);b.norm.push(...g.attributes.normal.array);g.dispose();m.geometry.dispose();root.remove(m)}
 for(const b of bins.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.norm,3));const m=new T.Mesh(g,b.material);m.name='vehicle-surface';root.add(m)}
 let n=0;root.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});root.userData.triangles=n;return root;
}
