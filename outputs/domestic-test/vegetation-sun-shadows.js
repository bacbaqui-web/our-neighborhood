import * as T from 'three';
import {bearingVector} from './environment-policy.js?v=43';
import {vegetationView,vegetationExtent} from './vegetation-math.js?v=31';

// An invisible alpha-cutout caster faces the SUN, never the viewing camera.
// Real shadow-map depth makes its silhouette follow slopes and receiving walls,
// and lets an intervening building naturally merge/occlude the tree's shadow.
export function createVegetationSunShadows(figures){
 const group=new T.Group();group.name='vegetation-sun-shadow-casters';group.visible=false;const batches=[];
 const byAsset=new Map();for(const f of figures){if(!byAsset.has(f.asset.id))byAsset.set(f.asset.id,[]);byAsset.get(f.asset.id).push(f);}
 for(const list of byAsset.values()){
  const asset=list[0].asset,geometry=new T.PlaneGeometry(1,1),rects=new T.InstancedBufferAttribute(new Float32Array(list.length*4),4);geometry.setAttribute('spriteRect',rects);
  const material=new T.MeshBasicMaterial({map:asset.texture,alphaTest:.48,side:T.DoubleSide,transparent:true,opacity:0,colorWrite:false,depthWrite:false});
  const depth=new T.MeshDepthMaterial({map:asset.texture,alphaTest:.48,side:T.DoubleSide,depthPacking:T.RGBADepthPacking});
  const sunOnly={value:1};depth.onBeforeCompile=shader=>{shader.uniforms.sunCasterEnabled=sunOnly;
   shader.vertexShader='attribute vec4 spriteRect;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv=spriteRect.xy+vMapUv*spriteRect.zw;\n#endif');
   shader.fragmentShader='uniform float sunCasterEnabled;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\n if(sunCasterEnabled<.5)discard;');
  };depth.customProgramCacheKey=()=> 'vegetation-sun-depth-v43';
  const mesh=new T.InstancedMesh(geometry,material,list.length);mesh.name='sun-caster-'+asset.id;
  mesh.customDepthMaterial=depth;mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;
  mesh.userData={isBillboardShadow:true,isVegetationSunCaster:true,sunFixed:true};
  mesh.onBeforeShadow=(_r,_o,_c,shadowCamera)=>{sunOnly.value=shadowCamera.isOrthographicCamera?1:0;};
  material.addEventListener('dispose',()=>depth.dispose());group.add(mesh);batches.push({mesh,rects,list,asset});
 }
 const direction=new T.Vector3(),matrix=new T.Matrix4(),rotation=new T.Quaternion(),euler=new T.Euler(0,0,0,'YXZ'),right=new T.Vector3(),up=new T.Vector3(),centre=new T.Vector3(),scale=new T.Vector3();let signature='';
 const stats={casters:figures.length,batches:batches.length,enabled:false,updates:0,direction:[0,1,0]};
 function set(profile,enabled=true,legacy=true){
  const active=!!(enabled&&profile?.castsSunShadow&&profile.renderElevation>0);group.visible=active;stats.enabled=active;if(!active)return;
  const key=[profile.azimuth,profile.renderElevation,legacy].join(',');if(key===signature)return;signature=key;
  direction.set(...bearingVector(profile.azimuth,profile.renderElevation));const pitch=profile.renderElevation*Math.PI/180,yaw=Math.atan2(direction.x,direction.z);
  rotation.setFromEuler(euler.set(-pitch,yaw,0,'YXZ'));right.set(1,0,0).applyQuaternion(rotation);up.set(0,1,0).applyQuaternion(rotation);
  for(const b of batches){b.list.forEach((f,i)=>{
   const p=f.placement;if(!legacy&&p.source==='existing-plant'){b.mesh.setMatrixAt(i,matrix.makeScale(0,0,0));return;}
   const frame=b.asset.frames[vegetationView(yaw,profile.renderElevation,p.heading||0,b.asset.elevationAngles).index];
   const [x,y,w,h]=frame.rect,[ax,ay]=frame.anchorPixels,extent=vegetationExtent(p.height,p.radius,pitch,b.asset.kind);
   b.rects.setXYZW(i,x/b.asset.imageWidth,1-(y+h)/b.asset.imageHeight,w/b.asset.imageWidth,h/b.asset.imageHeight);
   // Displace only along a parallel sunlight ray: the root's ground projection
   // is unchanged, including top views whose canopy would otherwise sink below it.
   centre.copy(f.root).addScaledVector(direction,p.height*.5*direction.y)
    .addScaledVector(right,(.5-(ax-x)/w)*extent.width).addScaledVector(up,((ay-y)/h-.5)*extent.height);
   scale.set(extent.width,extent.height,1);b.mesh.setMatrixAt(i,matrix.compose(centre,rotation,scale));
  });b.rects.needsUpdate=true;b.mesh.instanceMatrix.needsUpdate=true;}
  stats.direction=direction.toArray();stats.updates++;
 }
 return{group,batches,set,stats};
}
