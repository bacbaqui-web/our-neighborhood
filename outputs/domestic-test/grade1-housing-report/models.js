import * as T from 'three';
import {applyWallTexture} from '../facade-textures.js?v=masonry19';
import {grade1Factories} from '../grade1-street/models.js';

const palette={brick:0x986c5b,cream:0xd4d1bf,trim:0xd8dccf,metal:0x425b61,glass:0x718f96,road:0x626a6b,yard:0xc7cbbf,route:0x21a992,vehicle:0xd1a04e};
export function createCaseModel(id,{height=1.8,problem=false,slope=false}={}){
 const root=new T.Group();root.name='HousingReport-'+id;
 const walls=new T.Group(),houses=new T.Group(),paths=new T.Group(),trees=new T.Group(),props=new T.Group(),problems=new T.Group();
 for(const [name,g] of Object.entries({walls,houses,paths,trees,props,problems})){g.name=name;root.add(g);}
 const materials=new Map(),ground=(x,z)=>slope&&id==='wall-mix'?Math.max(0,-z)*.08:0;
 const mat=(color,alpha=1)=>{const key=color+':'+alpha;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.88,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1}));return materials.get(key);};
 function box(parent,w,h,d,x,y,z,color,texture){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y+h/2,z);if(texture)applyWallTexture(mesh,texture);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function beam(parent,a,b,w,d,color){const A=new T.Vector3(...a),B=new T.Vector3(...b),delta=B.clone().sub(A);const m=new T.Mesh(new T.BoxGeometry(w,delta.length(),d),mat(color));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.position.copy(A.add(B).multiplyScalar(.5));parent.add(m);m.castShadow=true;return m;}
 function surface(parent,points,color,alpha=1,offset=.02){const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1]))),geo=new T.ShapeGeometry(shape),pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=-pos.getY(i);pos.setXYZ(i,x,ground(x,z)+offset+((id==='garage'||id==='piloti')&&parent===paths&&z<-.5?.15:0),z);}geo.computeVertexNormals();const m=new T.Mesh(geo,mat(color,alpha));m.material.side=T.DoubleSide;m.receiveShadow=true;m.userData.footprint=points;parent.add(m);return m;}
 function route(points,width=1.2,vehicle=false){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),nx=-dz/L*width/2,nz=dx/L*width/2;const m=surface(paths,[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]],vehicle?palette.vehicle:palette.route,.54,.045);m.userData.role=vehicle?'vehicle-clearance':'pedestrian-access';}
  const a=points.at(-2),b=points.at(-1),v=new T.Vector2(b[0]-a[0],b[1]-a[1]).normalize(),c=[b[0]-v.x*.65,b[1]-v.y*.65];surface(paths,[[b[0],b[1]],[c[0]-v.y*.3,c[1]+v.x*.3],[c[0]+v.y*.3,c[1]-v.x*.3]],vehicle?0x9b651f:0x087765,1,.052);
 }
 function wall(a,b,{style='brick',h=height,wave=false}={}){
  const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),count=Math.ceil(L/1.6),u=[dx/L,dz/L],angle=Math.atan2(-u[1],u[0]);
  for(let i=0;i<count;i++){
   const t0=i/count,t1=(i+1)/count,x=a[0]+dx*(t0+t1)/2,z=a[1]+dz*(t0+t1)/2,section=L/count;
   const g=new T.Group();g.position.set(x,ground(x,z),z);g.rotation.y=angle;walls.add(g);
   const solid=style==='rail'?h*.7:h;
   if(wave){const n=12;for(let j=0;j<n;j++){const X=-section/2+(j+.5)*section/n,Y=solid-.22*Math.sin((i+(j+.5)/n)*Math.PI)**2;box(g,section/n+.005,Y,.18,X,0,0,palette.brick,'red-brick');box(g,section/n+.012,.07,.23,X,Y,0,palette.trim);}}
   else {box(g,section,solid+.08,.18,0,-.1,0,style==='concrete'?palette.cream:palette.brick,style==='concrete'?'exposed-concrete':'red-brick');box(g,section+.03,.07,.24,0,solid,0,palette.trim);}
   if(style==='rail'){const railing=h-solid;for(let x=-section/2+.09;x<section/2;x+=.14)box(g,.025,railing,.025,x,solid+.04,0,palette.metal);for(const y of [solid+.15,h])box(g,section,.045,.045,0,y,0,palette.metal);}
  }
  for(let i=0;i<=count;i++){const x=a[0]+dx*i/count,z=a[1]+dz*i/count;box(walls,.28,h+.12,.28,x,ground(x,z),z,style==='rail'?palette.cream:palette.brick,style==='rail'?'ivory-render':'red-brick');box(walls,.34,.075,.34,x,ground(x,z)+h+.12,z,palette.trim);}
 }
 function gate(a,b,{open=false}={}){
  const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),g=new T.Group();g.position.set((a[0]+b[0])/2,ground(...a)+.04,(a[1]+b[1])/2);g.rotation.y=Math.atan2(-dz,dx);walls.add(g);g.name='pedestrian-gate';
  for(const x of [-L/2,L/2]){box(g,.1,2.05,.13,x,0,0,palette.metal);box(g,.15,.06,.17,x,2.05,0,palette.trim);}
  box(g,L+.1,.09,.15,0,1.95,0,palette.metal);
  const leaf=new T.Group();leaf.position.x=-L/2;leaf.rotation.y=open?-.9:0;g.add(leaf);for(let x=.06;x<L;x+=.12)box(leaf,.035,1.75,.04,x,.1,0,palette.metal);for(const y of [.15,1.1,1.8])box(leaf,L,.06,.055,L/2,y,0,palette.metal);box(leaf,.03,.25,.1,L-.12,.85,.05,palette.trim);
 }
 function windowUnit(parent,x,y,z,angle=0,w=1.35){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);box(g,w,1.25,.08,0,0,0,0x35494d);box(g,w-.12,1.13,.035,0,.06,.055,palette.glass);for(const x of [-w/2,0,w/2])box(g,.055,1.3,.11,x,-.025,.08,palette.trim);for(const yy of [-.025,1.25])box(g,w+.07,.055,.11,0,yy,.08,palette.trim);box(g,w+.2,.075,.25,0,-.1,.08,0xb6bcb4);}
 function door(parent,x,y,z){box(parent,1.1,2.1,.11,x,y,z,palette.metal);box(parent,.93,1.15,.045,x,y+.7,z+.075,palette.glass);box(parent,.035,.35,.11,x+.35,y+.9,z+.12,palette.trim);box(parent,1.6,.1,1,x,y+2.25,z+.36,palette.metal);for(const side of [-.65,.65])beam(parent,[x+side,y+1.9,z+.08],[x+side,y+2.22,z+.75],.035,.035,palette.metal);}
 function house(x,z,w=7,d=6,{levels=2,angle=0,piloti=false,texture='red-brick',doorX=1,lobbyRight=false}={}){
  const g=new T.Group();g.position.set(x,ground(x,z-d/2),z);g.rotation.y=angle;houses.add(g);
  const base=piloti?2.7:0,h=levels*2.8;
  if(slope){const foundation=g.position.y-ground(x,z+d/2)+.12;box(g,w,foundation,d,0,-foundation,0,0xa5a79c);}
  box(g,w,h,d,0,base,0,0xffffff,texture);
  if(piloti){for(const X of [-w/2+.3,w/2-.3])for(const Z of [-d/2+.3,d/2-.3])box(g,.4,2.7,.4,X,0,Z,0xd1cfc1);box(g,w,.22,d,0,2.48,0,0xc8c8ba);box(g,w,.15,d,0,0,0,0xb5b6aa);box(g,1.5,2.7,d*.55,(lobbyRight?w/2-.8:-w/2+.8),0,-d*.2,0xb6b9b1);door(g,lobbyRight?w/2-.8:-w/2+.8,0,d*.08);}
  else{box(g,w+.04,.23,d+.04,0,-.15,0,0xa5a79c);door(g,doorX,0,d/2+.065);}
  box(g,w+.18,.15,d+.18,0,base+h,0,0xc3c6b8);
  for(const Z of [-d/2,d/2]){box(g,w+.1,.45,.16,0,base+h+.15,Z,0xffffff,texture);box(g,w+.22,.08,.24,0,base+h+.6,Z,palette.trim);}
  for(const X of [-w/2,w/2]){box(g,.16,.45,d,X,base+h+.15,0,0xffffff,texture);box(g,.24,.08,d+.15,X,base+h+.6,0,palette.trim);}
  for(let level=0;level<levels;level++){const y=base+level*2.8+.9;for(let X=-w/2+1.3;X<w/2-.6;X+=2.5){if(level===0&&!piloti&&Math.abs(X-doorX)<1.2)continue;windowUnit(g,X,y,d/2+.02);windowUnit(g,-X,y,-d/2-.02,Math.PI);}for(let Z=-d/2+1.2;Z<d/2-.6;Z+=2.4){windowUnit(g,w/2+.02,y,Z,Math.PI/2,1.1);windowUnit(g,-w/2-.02,y,Z,-Math.PI/2,1.1);}}
  // Existing approved procedural props retain their own detail and scale.
  const ac=grade1Factories['wall-ac']();ac.position.set(-w/2+1.3,base+Math.min(3.9,h-.9),d/2+.05);g.add(ac);
  const pipe=grade1Factories['drain-elbow']();pipe.position.set(w/2-.18,.85,d/2+.07);g.add(pipe);
  return g;
 }
 function tree(x,z,h=4.8){const g=new T.Group();g.position.set(x,ground(x,z),z);trees.add(g);const trunk=new T.Mesh(new T.CylinderGeometry(.08,.15,h*.65,7),mat(0x74614e));trunk.position.y=h*.325;g.add(trunk);
  for(let i=0;i<7;i++){const angle=i*2.4,r=i? .65:0,Y=h*.63+(i%3)*.35;const leaf=new T.Mesh(new T.IcosahedronGeometry(.95+(i%2)*.2,1),mat([0x66845e,0x79966b,0x506e50][i%3]));leaf.position.set(Math.cos(angle)*r,Y,Math.sin(angle)*r);leaf.scale.set(1,1.1,.9);leaf.castShadow=true;g.add(leaf);beam(g,[0,h*.35,0],[leaf.position.x,Y,leaf.position.z],.06,.06,0x74614e);}
 }
 function problemWall(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],mesh=box(problems,Math.hypot(dx,dz),1.8,.18,(a[0]+b[0])/2,0,(a[1]+b[1])/2,0xba554b);mesh.rotation.y=Math.atan2(-dz,dx);mesh.material=mat(0xba554b,.72);mesh.userData.role='hypothetical-obstruction';}
 surface(root,id==='corner'?[[-10,6],[10,6],[10,0],[-5.5,0],[-5.5,-12],[-10,-12]]:[[-10,6],[10,6],[10,0],[-10,0]],palette.road,1,0);
 surface(root,[[-6,0],[6,0],[6,-11],[-6,-11]],palette.yard,1,.012);
 if(id==='courtyard'||id==='wall-mix'){
  const style=id==='wall-mix'?'rail':'brick';
  const home=house(0,-6,7,5,{angle:id==='courtyard'?12*Math.PI/180:0,doorX:1.3});
  wall([-5.5,0],[.5,0],{style,wave:id==='courtyard'});wall([2.1,0],[5.5,0],{style});gate([.7,0],[1.9,0],{open:true});wall([-5.5,0],[-5.5,-10],{style});wall([5.5,0],[5.5,-10],{style});
  route([[1.3,2],[1.3,-2.5],[1.8,-3.8]],1);tree(-3.7,-3);tree(4.2,-8,3.8);
  const meter=grade1Factories['gas-meter-bank']();meter.position.set(-1.4,1,2.55);home.add(meter);
  const crate=grade1Factories['stacked-crates']();crate.position.set(-4.7,ground(-4.7,-1),-1);props.add(crate);
  if(id==='courtyard')problemWall([.7,0],[1.9,0]);else{problemWall([-5.5,0],[.7,0]);problemWall([1.9,0],[5.5,0]);}
 }else if(id==='piloti'){
  house(0,-4.5,9,7,{levels:3,piloti:true,texture:'light-brick'});wall([-5,0],[-5,-9],{h:1.2});wall([5,0],[5,-9],{h:1.2});route([[-3.3,2],[-3.3,-3.94]]);route([[1,3],[1,-5.5]],2.6,true);problemWall([-4.5,0],[4.5,0]);
 }else if(id==='passage'){
  house(-3.7,-4.2,6,7,{doorX:-1.3,texture:'dark-brick'});house(3.7,-4.2,6,7,{doorX:1.3});route([[0,2],[0,-8.5]],1.2);problemWall([-.7,0],[.7,0]);
 }else if(id==='corner'){
  surface(root,[[-5.5,-2],[-3.5,0],[-5.5,0]],palette.road,1,.025);
  house(.5,-6,7,5,{doorX:-2});wall([-3.5,0],[5.5,0]);wall([-5.5,-2],[-5.5,-10]);gate([-5.5,-2],[-3.5,0],{open:true});route([[-6,1],[-4.5,-1],[-2.4,-2.5],[-1.5,-3.4]]);tree(3.8,-2.5);problemWall([-5.5,-2],[-3.5,0]);
 }else if(id==='garage'){
  const g=house(0,-4,8,7,{levels:1,piloti:true,doorX:3,lobbyRight:true});
  box(g,.2,2.7,7,-2.3,0,0,0xffffff,'red-brick');box(g,.22,2.7,7,.7,0,0,0xffffff,'red-brick');box(g,2.8,2.5,.18,-.8,0,-3.4,0x4a5553);
  const shutter=new T.Group();shutter.name='shutter';shutter.position.set(-.8,.1,-.42);root.add(shutter);box(shutter,2.8,2.35,.08,0,0,0,0xaeb8b4);for(let y=.1;y<2.35;y+=.12)box(shutter,2.8,.022,.025,0,y,.06,0x6c7b7b);
  box(root,3.1,.28,.35,-.8,2.45,-.4,palette.metal);for(const x of [-2.3,.7])box(root,.13,2.45,.23,x,0,-.4,palette.metal);
  route([[-.8,3],[-.8,-5.7]],2.6,true);route([[3.2,2],[3.2,-3.44]],1.2);problemWall([-2.3,1],[.7,1]);
 }
 // A neutral 1.7 m figure makes the proposed dimensions legible.
 const person=new T.Group();person.name='scale-person';person.position.set(4.8,0,3.3);root.add(person);
 for(const x of [-.12,.12])box(person,.12,.76,.17,x,0,0,0x414e55);const body=new T.Mesh(new T.CapsuleGeometry(.21,.43,3,7),mat(0xe4e5d9));body.position.y=1.07;person.add(body);const head=new T.Mesh(new T.SphereGeometry(.14,10,7),mat(0xd1b7a0));head.position.y=1.56;person.add(head);
 problems.visible=problem;
 root.userData={caseId:id,assumedMetres:true,wallHeight:height,groundSlope:slope&&id==='wall-mix'?.08:0};
 return {root,walls,paths,trees,problems,shutter:root.getObjectByName('shutter'),ground};
}
