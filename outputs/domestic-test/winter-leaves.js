import * as T from 'three';
import {addBillboardLightAttributes,writeBillboardCrop,writeBillboardLight,writeBillboardSun,injectBillboardLight} from './billboard-lighting.js?v=151';
import {bearingVector} from './environment-policy.js?v=151';

// A leaf's petiole is the local origin: billboard rotation never detaches it
// from its twig. These are individual flat leaves, not scaled leaf clusters.
export function createWinterLeaves(plans,sunlight,style){
 const leaves=[];
 for(const plan of plans){
  const lastLevel=Math.max(...plan.paths.map(p=>p.level));
  const tips=plan.paths.filter(p=>p.level===lastLevel).map(p=>plan.nodes[p.nodes.at(-1)].p).filter(p=>p[1]-plan.root[1]>plan.height*.48&&p[1]-plan.root[1]<plan.height*.88);
  if(!tips.length)continue;
  const first=tips[Math.floor(tips.length*.28)];
  const second=tips.reduce((a,b)=>distance(b,first)>distance(a,first)?b:a,first);
  [first,...(distance(first,second)>.4?[second]:[])].forEach((p,i)=>leaves.push({anchor:[...p],size:.14+i*.02,turn:i?-.35:.28,color:i?0xb28a4d:0xa97742}));
 }
 const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(-.018,-.1);shape.bezierCurveTo(-.32,-.24,-.34,-.65,0,-1);shape.bezierCurveTo(.31,-.65,.29,-.28,.018,-.1);shape.lineTo(0,0);
 const geometry=new T.ShapeGeometry(shape,7);addBillboardLightAttributes(geometry,leaves.length,true);
 const material=new T.MeshBasicMaterial({side:T.DoubleSide,toneMapped:false});material.onBeforeCompile=s=>{injectBillboardLight(s,sunlight);s.uniforms.winterStyle=style;s.fragmentShader='uniform float winterStyle;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 if(winterStyle>.5){float g=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=vec3(winterStyle>1.5?g:mix(.16,1.,smoothstep(.09,.26,g)));}`);};material.customProgramCacheKey=()=> 'winter-single-leaf-v49';
 const mesh=new T.InstancedMesh(geometry,material,leaves.length);mesh.name='winter-retained-leaves';mesh.userData={isVegetationBillboard:true,isFoliageSilhouette:true,outlineOnly:true,anchoredPetiole:true};mesh.frustumCulled=false;mesh.visible=false;
 const caster=new T.InstancedMesh(geometry.clone(),new T.MeshBasicMaterial({side:T.DoubleSide,colorWrite:false,depthWrite:false,transparent:true,opacity:0}),leaves.length);caster.name='winter-leaf-sun-casters';caster.userData={isVegetationSunCaster:true,isBillboardShadow:true,sunFixed:true};caster.castShadow=true;caster.frustumCulled=false;caster.visible=false;mesh.count=caster.count=0;
 const group=new T.Group();group.name='winter-single-leaves';group.add(mesh,caster);
 const matrix=new T.Matrix4(),rotation=new T.Quaternion(),viewRotation=new T.Quaternion(),sunRotation=new T.Quaternion(),rollRotation=new T.Quaternion(),euler=new T.Euler(0,0,0,'YXZ'),position=new T.Vector3(),scale=new T.Vector3();
 leaves.forEach((l,i)=>{writeBillboardCrop(geometry,i,0,1,true);mesh.setColorAt(i,new T.Color(l.color));});if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 function place(target,l,i,orientation){position.set(...l.anchor);scale.set(l.size,l.size,1);rotation.copy(orientation).multiply(rollRotation.setFromEuler(euler.set(0,0,l.turn,'YXZ')));target.setMatrixAt(i,matrix.compose(position,rotation,scale));}
 return{group,mesh,caster,leaves,
  setVisible(visible){mesh.visible=visible&&leaves.length>0;mesh.count=mesh.visible?leaves.length:0;},
  update(camera){if(!mesh.visible)return;camera.getWorldQuaternion(viewRotation);leaves.forEach((l,i)=>place(mesh,l,i,viewRotation));mesh.instanceMatrix.needsUpdate=true;},
  setSun(profile,on){caster.visible=!!(mesh.visible&&on&&profile?.castsSunShadow&&profile.renderElevation>0);caster.count=caster.visible?leaves.length:0;if(!caster.visible)return;const v=bearingVector(profile.azimuth,profile.renderElevation);sunRotation.setFromEuler(euler.set(-profile.renderElevation*Math.PI/180,Math.atan2(v[0],v[2]),0,'YXZ'));leaves.forEach((l,i)=>place(caster,l,i,sunRotation));caster.instanceMatrix.needsUpdate=true;},
  setLighting(field){leaves.forEach((l,i)=>{const root=new T.Vector3(l.anchor[0],l.anchor[1]-l.size,l.anchor[2]),colors=field.sampleFigure(root,l.size),exposure=(field.sunExposure?.(root,l.size,l.size*.3)||[1,1,1])[1];writeBillboardLight(geometry,i,[colors[1],colors[1],colors[1]],true);writeBillboardSun(geometry,i,root,l.size,[exposure,exposure,exposure],true);});},
  exportMeshes(){if(!mesh.visible)return[];return leaves.map((l,i)=>{const m=new T.Mesh(geometry.clone(),new T.MeshBasicMaterial({color:l.color,side:T.DoubleSide}));mesh.getMatrixAt(i,m.matrix);m.matrixAutoUpdate=false;m.name='retained-winter-leaf';return m;});}
 };
}
function distance(a,b){return Math.hypot(...a.map((v,k)=>v-b[k]));}
