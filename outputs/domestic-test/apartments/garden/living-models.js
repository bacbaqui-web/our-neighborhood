import * as T from 'three';
import {FacadeBatch} from '../../korean-facades.js';
import {createAsset} from '../../../alley-library/models.js';
export function makeLivingAsset(kind){
 const g=new T.Group(),batch=new FacadeBatch(),o=batch.writer(),B=o.box,R=o.rod,wood=0x8b6b4c,steel=0x627475,stone=0xcec9b9;
 const box=(x,y,z,w,h,d,col)=>B(x,y,z,w,h,d,col);
 function posts(w,d,h){for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){B(x,.14,z,.35,.28,.35,stone);B(x,h/2,z,.13,h,.13,steel);}}
 function arcRoof(w,d){const pts=[],ns=[],seg=16;for(let i=0;i<seg;i++){const a=-Math.PI*.43+i/seg*Math.PI*.86,b=-Math.PI*.43+(i+1)/seg*Math.PI*.86;const p=[[-w/2,2.05+Math.cos(a)*.85,Math.sin(a)*d/2],[w/2,2.05+Math.cos(a)*.85,Math.sin(a)*d/2],[w/2,2.05+Math.cos(b)*.85,Math.sin(b)*d/2],[-w/2,2.05+Math.cos(b)*.85,Math.sin(b)*d/2]];for(const k of [0,1,2,0,2,3])pts.push(...p[k]);for(const x of [-w/2,0,w/2])R([x,p[0][1]+.03,p[0][2]],[x,p[3][1]+.03,p[3][2]],.035,steel,6);}
 const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(pts,3));geom.computeVertexNormals();g.add(new T.Mesh(geom,new T.MeshStandardMaterial({color:0x6babb6,transparent:true,opacity:.75,side:T.DoubleSide,roughness:.45})));}
 if(kind==='bench'){
  // Separate timber boards, steel supports, arm rests and fixing heads.
  for(let k=0;k<5;k++)B(0,.45,-.27+k*.135,1.9,.065,.115,k%2?0x987650:0xa68660);
  for(let k=0;k<4;k++)B(0,.65+k*.12,-.29-k*.022,1.9,.095,.065,k%2?0x987650:0xa68660);
  for(const x of [-.68,.68]){
   for(const z of [-.22,.22]){B(x,.22,z,.065,.44,.065,steel);B(x,.025,z,.19,.05,.16,steel);}
   B(x,.39,0,.085,.09,.64,steel);R([x,.35,-.25],[x,1.05,-.39],.033,steel,8);
   R([x,.45,.25],[x,.69,.25],.032,steel,8);R([x,.69,.25],[x,.74,-.29],.035,steel,8);
   for(let k=0;k<5;k++)B(x,.486,-.27+k*.135,.024,.008,.024,0xc0beb0);
   for(let k=0;k<4;k++)B(x,.65+k*.12,-.25-k*.022,.025,.025,.012,0xc0beb0);
  }
  R([-.68,.23,-.22],[.68,.23,-.22],.025,steel,8);
 }
 if(kind==='ramp'){posts(5.3,9.6,2.25);arcRoof(5.8,10.2);for(const x of [-2.65,2.65])B(x,-.6,0,.28,3,10,0xb4c5b6);B(0,-1.1,-4.9,5.1,2.2,.1,0x263936);B(0,.35,-4.9,5.7,.65,.25,0xb4c5b6);for(const x of [-2.45,2.45])for(let z=-4.5;z<4.7;z+=.6)B(x,.32,z,.12,.45,.27,Math.round(z*10)%2?0x45554a:0xc9b36c);const geo=new T.BufferGeometry(),v=[[-2.5,.03,5],[2.5,.03,5],[2.5,-2.1,-5],[-2.5,-2.1,-5]];geo.setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>v[i]),3));geo.computeVertexNormals();g.add(new T.Mesh(geo,new T.MeshStandardMaterial({color:0x64716b,side:T.DoubleSide})));R([0,.05,5],[0,-2.08,-5],.04,0xd5be74,6);}
 if(kind==='bike'){posts(5.6,2.7,2.25);arcRoof(6,3.4);for(let x=-2.4;x<=2.4;x+=.6){R([x,.1,-.65],[x,.55,-.45],.025,steel);R([x,.55,-.45],[x,.12,.25],.025,steel);}B(0,.06,0,6,.1,3.6,0xc1c1b2);}
 if(kind==='recycling'){posts(4.9,3,2.5);B(0,2.6,0,5.2,.16,3.4,wood);for(let x=-2.5;x<2.6;x+=.28){B(x,2.71,0,.20,.06,3.4,0x77694f);B(x,1.15,-1.45,.16,2.2,.08,wood);}for(const x of [-2.45,2.45])for(let z=-1.4;z<.8;z+=.3)B(x,1.15,z,.08,2.2,.17,wood);B(0,.08,0,5.2,.15,3.6,stone);for(const [i,col]of [0x7a8e88,0xb89d54,0x5d8c9f,0x768c64].entries()){const x=-1.75+i*1.15;B(x,.63,-.45,.85,1.05,.8,col);B(x,1.2,-.45,.92,.12,.86,col);B(x,.9,-.025,.35,.13,.02,0xe5e2ce);for(const xx of [-.29,.29])R([x+xx,.15,-.65],[x+xx,.15,-.45],.10,0x414b46,8);}}
 if(kind==='recycling'){
  // Each bin has a front deposit opening, lid hinge, handle and exposed wheels.
  const labels=['종이','플라스틱','캔 · 병','비닐'];
  for(let i=0;i<4;i++){const x=-1.75+i*1.15;
   B(x,1.13,-.009,.51,.11,.035,0x303e3c);B(x,1.07,.018,.56,.035,.10,0xc2c6b9);
   B(x,1.28,-.77,.4,.045,.05,steel);B(x,.68,-.017,.66,.025,.025,0x54645d);
   for(const dx of [-.3,.3]){R([x+dx,.16,-.78],[x+dx,.16,-.58],.115,0x343e3b,12);R([x+dx,.16,-.80],[x+dx,.16,-.79],.045,0xa3aaa0,10);}
   R([x-.22,.98,.04],[x+.22,.98,.04],.025,steel,8);
   for(const dx of [-.22,.22])R([x+dx,.98,.04],[x+dx,.91,.04],.025,steel,8);
   if(typeof document!=='undefined'){
    const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#e4e2d5';ctx.fillRect(0,0,256,96);ctx.fillStyle='#354b43';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.fillText(labels[i],128,62);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(.72,.27),new T.MeshStandardMaterial({map:tex,roughness:.85}));sign.position.set(x,1.72,1.52);g.add(sign);
   }
   B(x,1.72,1.48,.79,.34,.055,stone);for(const dx of [-.28,.28])R([x+dx,1.89,1.48],[x+dx,2.48,1.48],.012,steel,6);
  }
  for(const z of [-1.4,1.4])B(0,2.48,z,4.9,.13,.12,steel);
  for(const x of [-2.45,2.45]){R([x,2.05,-1.45],[x,2.48,-.9],.035,steel,8);R([x,2.05,1.45],[x,2.48,.9],.035,steel,8);}
  B(0,.165,1.55,4.8,.025,.16,0x606a62);for(let x=-2.3;x<2.4;x+=.10)B(x,.18,1.55,.025,.015,.15,0xa9aea2);
 }
 if(kind==='pergola'){posts(5,4.6,2.7);for(const x of [-2.5,2.5])B(x,2.73,0,.18,.22,5.3,wood);for(let z=-2.5;z<2.6;z+=.42)B(0,2.9,z,5.7,.18,.16,wood);B(0,.07,0,5.8,.12,5.4,0xb9b6a4);for(let x=-2.8;x<2.9;x+=.25)B(x,.14,0,.01,.01,5.3,0x9b9c8d);}
 if(kind==='guard'){B(0,.12,0,3.5,.24,3.3,stone);B(0,.7,0,3,1.2,2.7,0xbcbcae);B(0,1.65,0,2.92,.85,2.65,0x729497);for(const x of [-1.5,0,1.5])for(const z of [-1.35,1.35])B(x,1.5,z,.09,2.2,.09,0xeee8d9);for(const y of [1.2,2.1]){B(0,y,1.37,3,.09,.07,stone);B(0,y,-1.37,3,.09,.07,stone);}B(0,2.35,0,3.6,.22,3.3,0x677c79);B(-.7,1.15,1.42,.7,2,.09,0x4e686a);B(.8,2.0,1.43,1.1,.22,.04,0xe3d9b9);}
 if(kind==='play'){B(0,.08,0,13,.12,11,0xb8a18a);for(let x=-6;x<6;x+=1)for(let z=-5;z<5;z+=1)B(x+.5,.15,z+.5,.97,.025,.97,(Math.round(x+z)%3===0)?0x83978b:0xb38b78);for(const x of [-2,2]){postsTower(x);B(x,1.45,0,2,.15,2,wood);B(x,2.85,0,2.6,.15,2.6,x<0?0xd0ae60:0x6b97a2);}B(0,1.45,0,2.2,.13,1.2,wood);for(const z of [-.55,.55]){R([-2,2,z],[2,2,z],.045,steel);for(let x=-2;x<=2;x+=.5)R([x,1.5,z],[x,2,z],.025,steel);}// A continuous slide surface replaces the stacked stair-like strips.
 const slidePts=[];for(let k=0;k<20;k++){const t=k/20,u=(k+1)/20,y=t=>.24+1.22*Math.pow(1-t,1.35),z=t=>1+3.3*t;const ps=[[-2.48,y(t),z(t)],[-1.52,y(t),z(t)],[-1.52,y(u),z(u)],[-2.48,y(u),z(u)]];for(const n of [0,1,2,0,2,3])slidePts.push(...ps[n]);for(const x of [-2.5,-1.5])R([x,y(t)+.12,z(t)],[x,y(u)+.12,z(u)],.055,0xc1a15c,8);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(slidePts,3));sg.computeVertexNormals();g.add(new T.Mesh(sg,new T.MeshStandardMaterial({color:0x759aa0,side:T.DoubleSide,roughness:.45})));
 for(let i=0;i<5;i++)B(2,.2+i*.26,-2.7+i*.32,1,.12,.3,wood);}
 if(kind==='play'){
  for(const x of [-2,2]){
   for(let k=0;k<9;k++)B(x-.88+k*.22,1.54,0,.19,.035,1.8,k%2?0x957651:0xa2845c);
   for(const dx of [-.8,.8])for(const z of [-.8,.8]){B(x+dx,.15,z,.22,.18,.22,steel);B(x+dx,2.73,z,.17,.06,.17,0xd0ac64);for(const y of [1.4,2.2])B(x+dx,y,z+.07,.035,.035,.02,0xd1cabc);}
   for(const dx of [-.85,.85]){R([x+dx,1.55,-.8],[x+dx,2.3,-.8],.03,steel,8);R([x+dx,2.3,-.8],[x+dx,2.3,.8],.035,steel,8);for(let z=-.6;z<.8;z+=.2)R([x+dx,1.55,z],[x+dx,2.3,z],.018,steel,6);}
  }
  for(const x of [1.43,2.57]){R([x,.5,-2.95],[x,2.15,-1.05],.038,steel,8);for(let k=0;k<5;k++)R([x,.2+k*.26,-2.7+k*.32],[x,.72+k*.26,-2.7+k*.32],.022,steel,6);}
  for(let k=0;k<5;k++)B(2,.27+k*.26,-2.81+k*.32,1,.018,.045,0xd2ba75);
 }
 function postsTower(x){for(const xx of [-.8,.8])for(const zz of [-.8,.8])B(x+xx,1.35,zz,.12,2.7,.12,steel);}
 g.add(batch.finish(kind));g.name='생활시설 · '+kind;g.traverse(x=>{if(x.isMesh){x.castShadow=true;x.receiveShadow=true;}});return g;
}
export function createLivingScene(infill,layout){const root=new T.Group(),assets=new Map(),batch=new FacadeBatch();root.name='생활 시설과 보도';
 for(const slot of infill.placed){if(!assets.has(slot.kind))assets.set(slot.kind,makeLivingAsset(slot.kind));const model=assets.get(slot.kind).clone(true);model.position.set(slot.point[0],.13,slot.point[1]);model.rotation.y=slot.angle;model.userData.slot=slot.id;root.add(model);}
 // Small paving units provide a visible curb and footway texture without texture downloads.
 const layers=new Map();const add=(p,c)=>{if(!layers.has(c))layers.set(c,[]);const vs=layers.get(c),x=p[0],z=p[1],w=.47;for(const [a,b]of [[-w,-w],[w,-w],[w,w],[-w,-w],[w,w],[-w,w]])vs.push(x+a,.105,z+b);};
 for(let x=layout.bounds.minX;x<layout.bounds.maxX;x+=1)for(let z=layout.bounds.minZ;z<layout.bounds.maxZ;z+=1){const p=[x+.5,z+.5];if(!infill.paving(p)||[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].some(([dx,dz])=>!infill.paving([p[0]+dx,p[1]+dz])))continue;add(p,(Math.floor(x+z)%5===0)?0xc8b8a0:0xb69a86);}
 for(const [color,vertices]of layers){const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geom.computeVertexNormals();const mesh=new T.Mesh(geom,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:1}));mesh.receiveShadow=true;root.add(mesh);}
 const leaf=new T.IcosahedronGeometry(1,1),mat=new T.Matrix4();for(let tone=0;tone<4;tone++){const rows=infill.beds.filter(b=>b.tone===tone),mesh=new T.InstancedMesh(leaf,new T.MeshStandardMaterial({color:[0x6e8958,0x839867,0x728559,0x95a178][tone]}),rows.length);rows.forEach((b,i)=>{mat.makeScale(.75,.45,.65);mat.setPosition(b.point[0],.4,b.point[1]);mesh.setMatrixAt(i,mat);});mesh.castShadow=true;root.add(mesh);const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.12,0),new T.MeshStandardMaterial({color:[0xdfcda8,0xc98f99,0xd8bb76,0xd6d7c0][tone]}),rows.length*3);rows.forEach((b,i)=>{for(let k=0;k<3;k++){mat.makeTranslation(b.point[0]+Math.sin(i+k)*.5,.7,b.point[1]+Math.cos(i+k)*.4);flowers.setMatrixAt(i*3+k,mat);}});root.add(flowers);}
 // Entry lighting and bollards are placed beside the clear walking route.
 for(const s of infill.placed){const c=Math.cos(s.angle),sn=Math.sin(s.angle),o=batch.writer([s.point[0],.12,s.point[1]],c,-sn,sn,c);for(const x of [-s.w/2+.4,s.w/2-.4]){o.box(x,.4,s.d/2-.3,.14,.8,.14,0x64756b);o.box(x,.72,s.d/2-.3,.15,.08,.15,0xe7dfb8);}}
 root.add(batch.finish('보행등'));return root;}
export async function addExistingFurniture(root,infill){const models={bike:createAsset(31),bench:makeLivingAsset('bench'),bins:createAsset(44)};let count=0;
 for(const s of infill.placed){const parent=new T.Group();parent.position.set(s.point[0],.15,s.point[1]);parent.rotation.y=s.angle;root.add(parent);const add=(key,x,z,angle=0)=>{const m=models[key].clone(true);m.position.set(x,0,z);m.rotation.y=angle;m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});parent.add(m);count++;};if(s.kind==='bike')for(let x=-2.2;x<=2.2;x+=.62)add('bike',x,0,Math.PI/2);if(s.kind==='pergola'){add('bench',-1.7,-.9,Math.PI/2);add('bench',1.7,-.9,-Math.PI/2);add('bench',0,-1.9);}if(s.kind==='play'){add('bench',-4.8,-3.9);add('bench',4.8,-3.9);}if(s.kind==='recycling')add('bins',0,.9);}
 return count;
}
