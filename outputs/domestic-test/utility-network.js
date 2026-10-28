import * as T from 'three';
import {fitSupportBase} from './support-geometry.js?v=151';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
// Dimensions in metres. The graph is planned independently of visual ornament.
export function createUtilityNetwork(plan,elevation){
 const group=new T.Group();group.name='RoadsideUtilityNetwork';const buckets=new Map(),lines=new Map(),proxies=[],colliders=[],feet=[];
 const colors={pole:0x909185,metal:0x53605b,dark:0x303b39,box:0x727d76,ceramic:0xb0b4a4,yellow:0xb79b45,label:0xc2c3b5};
 function add(g,color,kind='poles',edge=false){const key=color+':'+kind;if(!buckets.has(key))buckets.set(key,{color,kind,gs:[]});buckets.get(key).gs.push(g);if(edge){const e=new T.EdgesGeometry(g,35);if(!lines.has(color))lines.set(color,[]);lines.get(color).push(e);}}
 function box(x,y,z,w,h,d,angle,color,kind='metal'){const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);add(g,color,kind,true);}
 function cylinder(x,y,z,r1,r2,h,color,kind='poles',sides=12){const g=new T.CylinderGeometry(r1,r2,h,sides);g.translate(x,y,z);add(g,color,kind);}
 function rod(A,B,r,color,kind='metal'){const d=new T.Vector3(...B).sub(new T.Vector3(...A)),g=new T.CylinderGeometry(r,r,d.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate((A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2);add(g,color,kind);}
 function cable(A,B,r,sag){const pts=[];for(let k=0;k<=20;k++){const t=k/20;pts.push(new T.Vector3(A[0]*(1-t)+B[0]*t,A[1]*(1-t)+B[1]*t-Math.sin(Math.PI*t)*sag,A[2]*(1-t)+B[2]*t));}const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,r,5,false);add(g,colors.dark,'wire');}
 function ring(x,y,z,r,t,angle,color){const g=new T.TorusGeometry(r,t,6,24);g.rotateY(angle);g.translate(x,y,z);add(g,color,'wire');}
 for(const p of plan.poles){const {x,z,nx,nz,ux,uz,id,poleHeight:H,radius:r}=p,y=elevation(x,z),angle=-Math.atan2(nz,nx),at=(u,v,h)=>[x+nx*u+ux*v,y+h,z+nz*u+uz*v];
  // Separate the adaptive lower shaft from the rigid upper pole and wires.
  const footGeo=new T.CylinderGeometry(r-(r-.09)*.30/H,r,.30,12);footGeo.translate(x,y+.15,z);
  const foot=new T.Mesh(footGeo,new T.MeshStandardMaterial({color:colors.pole,roughness:.88}));foot.name='utility-grounded-foot';foot.userData.detailKind='poles';group.add(foot);feet.push(foot);
  cylinder(x,y+(H+.30)/2,z,.09,r-(r-.09)*.30/H,H-.30,colors.pole);
  // Road-facing cantilever keeps conductors away from the neighboring facade.
  const arm=at(-.55,0,H-.9);box(...arm,1.25,.095,.10,angle,colors.metal);
  rod(at(.05,0,H-1.65),at(-1.04,0,H-.89),.025,colors.metal);
  for(const off of [-.18,-.55,-.92]){const q=at(off,0,H-.72);cylinder(...q,.055,.065,.25,colors.ceramic,'metal',8);for(const h of [-.065,.02,.09])cylinder(q[0],q[1]+h,q[2],.079,.079,.025,colors.ceramic,'metal',8);}
  for(const h of [2.7,5.4,6.45])cylinder(x,y+h,z,.153,.153,.045,colors.metal,'metal');
  // Lower communication junction, loop, protective conduit and foot-level safety wrap.
  box(...at(-.21,0,5.55),.26,.46,.22,angle,colors.box);box(...at(-.36,0,5.58),.016,.32,.16,angle,colors.dark);
  rod(at(-.15,.035,.4),at(-.15,.035,5.3),.026,colors.dark,'wire');
  cylinder(x,y+.89,z,.148,.148,1.08,colors.dark,'metal');for(let j=0;j<4;j++)for(let k=0;k<16;k++){const verts=[];for(const [dt,dh] of [[0,0],[1,0],[1,.11],[0,0],[1,.11],[0,.11]]){const a=(k+dt)/16*Math.PI*2,h=.35+j*.25+(k+dt)/16*.22+dh;verts.push(x+Math.cos(a)*.150,y+h,z+Math.sin(a)*.150);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(Array(12).fill(0),2));g.setIndex([0,2,1,3,5,4]);g.computeVertexNormals();add(g,colors.yellow,'hazard');}
  box(...at(-.15,0,1.8),.02,.28,.14,angle,colors.label,'mortar');
  if(id%3!==1)ring(...at(-.24,.1,6.05),.23,.024,angle,colors.dark);
  if(p.kind==='distribution'&&id%3===0){const q=at(-.43,0,5.05);cylinder(...q,.235,.235,.73,colors.box,'metal');cylinder(q[0],q[1]+.40,q[2],.265,.265,.07,colors.metal,'metal');for(const v of [-.12,.12])cylinder(q[0]+ux*v,q[1]+.5,q[2]+uz*v,.045,.05,.14,colors.ceramic,'metal',8);rod(at(-.12,0,4.6),at(-.7,0,4.6),.04,colors.metal);}
  // Pole shaft is a walking obstacle, with a tight footprint rather than a road-sized AABB.
  const fp=Array.from({length:12},(_,i)=>[x+Math.cos(i*Math.PI/6)*(r+.05),z+Math.sin(i*Math.PI/6)*(r+.05)]);colliders.push(...fp.map((a,i)=>({a,b:fp[(i+1)%fp.length],width:.025})));
  proxies.push([[-r,-r],[r,-r],[-r,r],[r,r]].flatMap(([dx,dz])=>[[x+dx,y,z+dz],[x+dx,y+H,z+dz]]));
 }
 for(const e of plan.spans){const a=plan.poles[e.a],b=plan.poles[e.b],ay=elevation(a.x,a.z),by=elevation(b.x,b.z);
  for(const off of [-.18,-.55,-.92])cable([a.x+a.nx*off,ay+a.poleHeight-.59,a.z+a.nz*off],[b.x+b.nx*off,by+b.poleHeight-.59,b.z+b.nz*off],.012,Math.min(.55,e.length*.016));
  for(const off of [-.04,.04])cable([a.x-a.nx*.16+a.ux*off,ay+6.5,a.z-a.nz*.16+a.uz*off],[b.x-b.nx*.16+b.ux*off,by+6.5,b.z-b.nz*.16+b.uz*off],.021,Math.min(.55,e.length*.016));
 }
 for(const d of plan.drops){const p=plan.poles[d.pole];cable([p.x-p.nx*.16,elevation(p.x,p.z)+6.35,p.z-p.nz*.16],d.end,.011,.16);}
 for(const {color,kind,gs} of buckets.values()){const m=new T.Mesh(mergeGeometries(gs,false),new T.MeshStandardMaterial({color,roughness:.88}));m.name='utility-'+kind;m.userData.detailKind=kind;group.add(m);gs.forEach(g=>g.dispose());}
 for(const [color,gs] of lines){const c=new T.Color(color).multiplyScalar(.48),m=new T.LineSegments(mergeGeometries(gs,false),new T.LineBasicMaterial({color:c}));m.userData.faceLineColor=c.getHex();group.add(m);gs.forEach(g=>g.dispose());}
 group.userData={...plan.qa,walkObstacles:colliders,placementProxies:proxies};
 group.fitGroundSurface=surface=>{const contacts=[];for(const foot of feet){fitSupportBase(foot.geometry,surface);contacts.push(...foot.geometry.userData.groundRim);}group.userData.supportFit={poles:feet.length,baseVertices:contacts.length,maxGap:Math.max(0,...contacts.map(([x,y,z])=>y-surface(x,z)))};};
 group.fitGroundSurface(elevation);return group;
}
