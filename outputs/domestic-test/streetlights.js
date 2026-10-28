import * as T from 'three';
import {fitSupportBase} from './support-geometry.js?v=151';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {windowIsLit} from './environment-policy.js?v=151';

export function createStreetlights(plan,elevation,roadInfo,renderer,windows=[],surface=elevation){
 // Mounted fixtures keep their mounting height; freestanding lights use finished paving.
 plan={...plan,lights:plan.lights.map(l=>({...l,root:[l.root[0],l.type==='arterial'?surface(l.root[0],l.root[2]):l.type==='pole'?elevation(l.root[0],l.root[2]):l.root[1],l.root[2]]}))};
 const group=new T.Group();group.name='AlleySecurityLights';const bucket=new Map(),lenses=[],heads=[],halos=[],pools=[];
 function add(geo,color){if(!bucket.has(color))bucket.set(color,[]);bucket.get(color).push(geo);}
 function box(x,y,z,w,h,d,angle,color,grounded=false){const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);if(grounded)fitSupportBase(g,surface);add(g,color);}
 function rod(a,b,r,color){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),g=new T.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());add(g,color);}
 const lensMaterial=new T.MeshStandardMaterial({color:0xdbe3d8,emissive:0xffd7a3,emissiveIntensity:0,roughness:.35});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,239,200,.65)');gradient.addColorStop(.20,'rgba(255,218,156,.23)');gradient.addColorStop(1,'rgba(255,198,120,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const glowTexture=new T.CanvasTexture(canvas);
 const glowMat=new T.SpriteMaterial({map:glowTexture,color:0xffd5a1,transparent:true,depthTest:true,depthWrite:false,opacity:0,blending:T.AdditiveBlending});
 const poolMat=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,uniforms:{strength:{value:0}},vertexShader:`attribute float glow;varying float vGlow;void main(){vGlow=glow;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float strength;varying float vGlow;void main(){gl_FragColor=vec4(.95,.64,.29,vGlow*strength);}`,blending:T.AdditiveBlending});
 for(const l of plan.lights){
  const [x,y,z]=l.root,[nx,nz]=l.direction,ux=nz,uz=-nx,H=l.height,angle=Math.atan2(nx,nz),at=(f,h,s=0)=>[x+nx*f+ux*s,y+h,z+nz*f+uz*s];
  const pos=at(l.reach,H+.05);heads.push(new T.Vector3(...pos));
  if(l.type!=='transit'){
  if(l.type==='arterial'){rod(at(0,0),at(0,H-.35),.085,0x657574);box(x,y+.3,z,.23,.6,.23,angle,0x556563,true);box(x,y+.65,z,.13,.32,.14,angle,0x596966);}
  if(l.type==='pole')for(const h of [H-.50,H-.06]){const g=new T.TorusGeometry(.155,.018,6,16);g.rotateX(Math.PI/2);g.translate(x,y+h,z);add(g,0x596965);}
  else box(...at(.01,H-.25),.16,.54,.10,angle,0x56635f);
  const pts=[at(.02,H-.45),at(.10,H-.05),at(l.reach*.55,H+.12),at(l.reach,H+.10)].map(p=>new T.Vector3(...p));
  add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),10,.038,8,false),0x7c8984);
  rod(at(.03,H-.55),at(l.reach*.60,H+.04),.018,0x59665e);
  const w=l.variant===1?.32:.26,d=l.variant===2?.62:.48;
  box(...pos,w,.11,d,angle,l.variant===1?0x55645f:0x89938a);box(pos[0],pos[1]+.075,pos[2],w*.8,.04,d*.72,angle,0x65726b);
  for(let f=0;f<5;f++)box(...at(l.reach-.16+f*.08,H+.087),w*.91,.025,.018,angle,0x4e5e59);
  const lens=new T.BoxGeometry(w*.83,.025,d*.82);lens.rotateY(angle);lens.translate(pos[0],pos[1]-.065,pos[2]);lenses.push(lens);
  // Visible LED rows and a small sensor on top distinguish the fixture from a box.
  for(const side of [-1,1])for(let j=0;j<3;j++)box(...at(l.reach-.13+j*.13,H-.082,side*w*.22),.034,.012,.065,angle,0xe9e7d4);
  box(...at(l.reach-.12,H+.13),.06,.05,.06,angle,0x425654);
  if(l.type==='wall')rod(at(.035,H-.5),at(.035,.6),.011,0x67736b);
  }
  const halo=new T.Sprite(glowMat);halo.position.copy(heads.at(-1));halo.scale.setScalar(l.type==='transit'?.6:1.15);group.add(halo);halos.push(halo);
  const center=at(l.reach+.6,0),verts=[],values=[],R=l.type==='arterial'?8:5.7,step=.65;
  for(let dx=-R;dx<R;dx+=step)for(let dz=-R;dz<R;dz+=step){const cx=center[0]+dx+step*.5,cz=center[2]+dz+step*.5;if(Math.hypot(dx,dz)>R||!roadInfo(cx,cz))continue;
   for(const [a,b] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){const xx=center[0]+dx+a*step,zz=center[2]+dz+b*step;verts.push(xx,surface(xx,zz)+.012,zz);values.push(Math.max(0,1-Math.hypot(xx-center[0],zz-center[2])/R)**2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('glow',new T.Float32BufferAttribute(values,1));const pool=new T.Mesh(g,poolMat);pool.name=l.id+'-ground-spill';pool.renderOrder=2;group.add(pool);pools.push(pool);
 }
 for(const [color,gs] of bucket){const mesh=new T.Mesh(mergeGeometries(gs,false),new T.MeshStandardMaterial({color,roughness:.72}));mesh.name='security-light-fixtures';mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);gs.forEach(g=>g.dispose());}
 const lensMesh=new T.Mesh(mergeGeometries(lenses,false),lensMaterial);lensMesh.name='security-light-lenses';group.add(lensMesh);lenses.forEach(g=>g.dispose());
 // Only two nearby lamps get shadowed, physically attenuated lighting. All lamps
 // keep their emissive lenses and terrain-conforming pools at distant viewpoints.
 const actual=Array.from({length:2},()=>{const light=new T.SpotLight(0xffd5a0,0,23,Math.PI*.31,.72,2);light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00008;light.shadow.normalBias=.07;light.shadow.camera.near=.2;light.shadow.camera.far=26;light.castShadow=false;group.add(light,light.target);return{light,id:-1};});
 const roomLight=new T.SpotLight(0xffd18b,0,9,Math.PI*.40,.8,2);roomLight.shadow.mapSize.set(512,512);roomLight.shadow.bias=-.0001;roomLight.shadow.normalBias=.035;roomLight.shadow.camera.near=.10;roomLight.shadow.camera.far=10;group.add(roomLight,roomLight.target);
 let billboardSources={lamps:[],windows:[]},billboardSignature='';
 let roomIndex=-1,roomAmount=0,windowChance=0,windowPattern=0,amount=0,enabled=true;
 function set(night,lightsEnabled=true,style='color',chance=0,pattern=0){roomAmount=style==='line'?0:night;windowChance=chance;windowPattern=pattern;amount=style==='line'||!lightsEnabled?0:night;enabled=lightsEnabled;lensMaterial.emissiveIntensity=amount*2.2;glowMat.opacity=amount*.65;poolMat.uniforms.strength.value=amount*.16;}
 function selectSources(camera){
  const high=camera.position.y-elevation(camera.position.x,camera.position.z)>65,indices=enabled&&amount>.01&&!high?heads.map((p,i)=>({i,d:p.distanceTo(camera.position)*(actual.some(a=>a.id===i)?.88:1)})).filter(p=>p.d<38).sort((a,b)=>a.d-b.d).slice(0,2).map(p=>p.i):[];
  let room=-1,best=14;
  if(roomAmount>.01&&!high)for(let i=0;i<windows.length;i++){const w=windows[i];if(!windowIsLit((w.band+windowPattern)%16,windowChance))continue;const [x,y,z]=w.position,[nx,nz]=w.normal,dx=camera.position.x-x,dz=camera.position.z-z;if(dx*nx+dz*nz<.2)continue;const distance=Math.hypot(dx,camera.position.y-y,dz)*(i===roomIndex?.82:1);if(distance<best){room=i;best=distance;}}
  return{high,indices,room};
 }
 function sourcesForCamera(camera){const {high,indices,room}=selectSources(camera);return{lamps:high?null:indices.map(i=>plan.lights[i].id),windows:room>=0?['window-'+room]:[]};}
 function update(camera){
  const {high,indices,room}=selectSources(camera);
  let changed=false;
  for(let i=0;i<actual.length;i++){const a=actual[i],id=indices[i]??-1;if(a.id!==id){a.id=id;changed=true;}
   a.light.intensity=id<0?0:(plan.lights[id].intensity??95)*amount;a.light.castShadow=id>=0;
   if(id>=0){a.light.position.copy(heads[id]);const l=plan.lights[id],[nx,nz]=l.direction,x=heads[id].x+nx*.65,z=heads[id].z+nz*.65;a.light.target.position.set(x,elevation(x,z),z);a.light.target.updateMatrixWorld();}
  }
  if(room!==roomIndex){roomIndex=room;changed=true;}roomLight.intensity=room<0?0:14*roomAmount;roomLight.castShadow=room>=0;
  if(room>=0){const w=windows[room],[x,y,z]=w.position,[nx,nz]=w.normal;roomLight.color.set((w.band+windowPattern)%5===0?'#cce4ed':'#ffd18b');roomLight.position.set(x+nx*.10,y,z+nz*.10);roomLight.target.position.set(x+nx*3,Math.max(elevation(x+nx*3,z+nz*3)+.15,y-1.6),z+nz*3);roomLight.target.updateMatrixWorld();}
  billboardSources={lamps:high?null:indices.map(i=>plan.lights[i].id),windows:room>=0?['window-'+room]:[]};billboardSignature=JSON.stringify(billboardSources);
  pools.forEach((p,i)=>p.visible=!indices.includes(i));if(changed)renderer.shadowMap.needsUpdate=true;return indices.length+(room>=0?1:0);
 }
 function dispose(){group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();if(o.isLight)o.shadow?.dispose();});glowTexture.dispose();}
 function exportGroup(){const out=new T.Group();out.name=group.name;for(const o of group.children)if(o.isMesh&&o.material.isMeshStandardMaterial)out.add(o.clone());return out;}
 group.traverse(o=>o.userData.environmentOwned=true);group.userData={environmentOwned:true,qa:plan.qa,supportFit:{freeStanding:plan.lights.filter(l=>l.type==='arterial').length,mounted:plan.lights.filter(l=>l.type!=='arterial').length}};return{group,set,update,heads,plan,dispose,exportGroup,sourcesForCamera,getBillboardSources:()=>billboardSources,getBillboardSignature:()=>billboardSignature};
}
