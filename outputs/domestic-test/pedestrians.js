import * as T from 'three';
import {addBillboardLightAttributes,writeBillboardLight,writeBillboardCrop,injectBillboardLight,createBillboardSunUniforms,writeBillboardSun} from './billboard-lighting.js?v=151';
import {createContactShadows} from './contact-shadows.js?v=151';
import {directionalFrame,elevationTier,projectedHeight,pedestrianView,FRAME_LABELS} from './pedestrian-math.js?v=151';
export async function loadPedestrianAssets(catalog){
 const loader=new T.TextureLoader(),assets=new Map();
 await Promise.all(catalog.people.map(async p=>{
  const tiers=await Promise.all((p.elevations||[{pitch:0,image:p.image,imageWidth:p.imageWidth,imageHeight:p.imageHeight,frames:p.frames}]).map(async tier=>{
   const texture=await loader.loadAsync(new URL('./people/'+tier.image,import.meta.url).href);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=4;return{...tier,texture};
  }));assets.set(p.id,{...p,tiers,texture:tiers[0].texture});
 }));return assets;
}
export function createPedestrians(plan,assets,elevation,shadowElevation=elevation){
 const sunlight=createBillboardSunUniforms();const group=new T.Group();group.name='ImagePedestrians';const figures=[],materials=new Map(),mode={value:0};
 for(const [id,person] of assets)for(const [tierIndex,a] of person.tiers.entries()){const mat=new T.MeshBasicMaterial({map:a.texture,color:0xffffff,alphaTest:.48,transparent:false,depthWrite:true,side:T.DoubleSide,toneMapped:false});
  // Keep texture alpha in every scene style. Never turn the entire card into a solid rectangle.
  mat.onBeforeCompile=shader=>{injectBillboardLight(shader,sunlight);shader.uniforms.peopleStyle=mode;shader.uniforms.peopleTexel={value:new T.Vector2(1/a.imageWidth,1/a.imageHeight)};shader.fragmentShader='uniform float peopleStyle;\nuniform vec2 peopleTexel;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   if(peopleStyle>1.5){float gray=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=vec3(gray);}
   else if(peopleStyle>.5){vec4 center=texture2D(map,vMapUv);float edge=0.;
    for(int i=0;i<4;i++){vec2 delta=i==0?vec2(peopleTexel.x,0.):i==1?vec2(-peopleTexel.x,0.):i==2?vec2(0.,peopleTexel.y):vec2(0.,-peopleTexel.y);vec4 near=texture2D(map,vMapUv+delta);edge=max(edge,abs(center.a-near.a));}
    diffuseColor.rgb=mix(vec3(1.),vec3(.24),smoothstep(.09,.29,edge));
   }`);};mat.customProgramCacheKey=()=> 'pedestrian-lit-cutout-v43';materials.set(id+':'+tierIndex,mat);
 }
 for(const p of plan.people){const a=assets.get(p.character);if(!a)throw Error('Unknown pedestrian '+p.character);const pivot=new T.Group();pivot.position.set(p.x,shadowElevation(p.x,p.z)+.008,p.z);pivot.name='walker-'+p.id;const mesh=new T.Mesh(new T.PlaneGeometry(1,1),materials.get(p.character+':0'));mesh.name='image-walker-'+p.character;mesh.userData={isPedestrianBillboard:true,outlineOnly:true,id:p.id,character:p.character,pose:'walking-static',heading:p.heading,frame:0};mesh.castShadow=false;mesh.receiveShadow=false;pivot.add(mesh);group.add(pivot);
  addBillboardLightAttributes(mesh.geometry);
  figures.push({placement:p,asset:a,pivot,mesh,frame:-1,tier:-1,azimuth:0,feet:pivot.position.clone()});
 }
 const shadows=createContactShadows(figures.map(f=>({id:f.placement.id,root:f.feet.toArray(),radius:.48,radiusZ:.36})),shadowElevation);group.add(shadows.mesh);
 function frameGeometry(f,index,tierIndex){
  const tier=f.asset.tiers[tierIndex],frame=tier.frames[index],base=f.asset.frames[index],{rect:[x,y,w,h],anchorPixels:[ax,ay],bodyHeightPixels:bh}=frame;
  // Match the established horizontal silhouette and normalize height independently.
  // Elevated artwork already contains perspective shortening, so the card faces the
  // eye-reference camera direction instead of using a waist-level direction.
  const sx=(base.rect[2]/base.bodyHeightPixels*f.placement.height)/w,geo=f.mesh.geometry,ps=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<4;i++){const u=i%2,v=i<2?1:0,px=x+u*w,py=y+(1-v)*h;ps.setXYZ(i,(px-ax)*sx,(ay-py)/bh,0);uv.setXY(i,px/tier.imageWidth,1-py/tier.imageHeight);}
  ps.needsUpdate=true;uv.needsUpdate=true;geo.computeBoundingSphere();geo.computeBoundingBox();f.mesh.material=materials.get(f.placement.character+':'+tierIndex);f.frame=index;f.tier=tierIndex;Object.assign(f.mesh.userData,{frame:index,frameLabel:FRAME_LABELS[index],elevation:tier.pitch});
 }
 const normal=new T.Vector3(),ray=new T.Vector3();
 function update(camera){for(const f of figures){
  const {pitch,degrees,azimuth}=pedestrianView(camera.position,f.feet,f.placement.height,f.azimuth);
  f.azimuth=azimuth;
  const index=directionalFrame(f.placement.heading,f.azimuth,f.frame),tier=elevationTier(degrees,f.tier,f.asset.tiers.map(t=>t.pitch));
  if(index!==f.frame||tier!==f.tier)frameGeometry(f,index,tier);
  f.mesh.scale.y=projectedHeight(f.placement.height,pitch);
  f.pivot.rotation.set(-pitch,f.azimuth,0,'YXZ');
  // Tilt toward the eye-reference view, on a plane through the body centre. Its foot
  // anchor stays on the exact ground-to-camera ray, including perspective views.
  normal.set(Math.sin(f.azimuth)*Math.cos(pitch),Math.sin(pitch),Math.cos(f.azimuth)*Math.cos(pitch));ray.copy(camera.position).sub(f.feet);
  const denominator=ray.dot(normal),t=Math.abs(denominator)>1e-6?(f.placement.height*.5*normal.y)/denominator:0;
  f.pivot.position.copy(f.feet).addScaledVector(ray,t);
  // Geometry y is already normalized to the feet; collapse to body-centre
  // illumination from overhead so top-view artwork does not create a false gradient.
  const flatten=T.MathUtils.smoothstep(Math.max(0,degrees),45,85);
  writeBillboardCrop(f.mesh.geometry,0,-.5*(1-flatten)+.5*flatten,1-flatten);
  Object.assign(f.mesh.userData,{cameraElevation:degrees,cardPitch:pitch*180/Math.PI,viewReference:'eye'});
 }}

 function setLighting(field){if(field.sunlight)Object.assign(sunlight,field.sunlight);for(const f of figures){const colors=typeof field==='string'?[0,1,2].map(()=>new T.Color(field)):field.sampleFigure(f.feet,f.placement.height);f.sunExposure=field.sunExposure?.(f.feet,f.placement.height,.22)||[0,0,0];writeBillboardSun(f.mesh.geometry,0,f.feet,f.placement.height,f.sunExposure);f.lighting=colors;writeBillboardLight(f.mesh.geometry,0,colors);}}
 function exportGroup(){const out=new T.Group();out.name=group.name;for(const f of figures){const pivot=f.pivot.clone(),mesh=pivot.children[0];mesh.geometry=f.mesh.geometry.clone();mesh.material=f.mesh.material.clone();mesh.material.onBeforeCompile=()=>{};mesh.material.customProgramCacheKey=()=>'';mesh.material.vertexColors=true;const colors=f.lighting||[0,1,2].map(()=>new T.Color(1,1,1)),data=[];for(let i=0;i<4;i++){const y=f.mesh.geometry.attributes.position.getY(i),crop=f.mesh.geometry.attributes.billboardCrop,h=(y+.5)*crop.getY(i)+crop.getX(i),a=h<.48?0:1,t=T.MathUtils.smoothstep(h,a===0?.10:.48,a===0?.48:.86);data.push(...colors[a].clone().lerp(colors[a+1],t).toArray());}mesh.geometry.setAttribute('color',new T.Float32BufferAttribute(data,3));out.add(pivot);}if(shadows.mesh.visible)out.add(shadows.mesh.clone());return out;}
 function setStyle(style){mode.value=style==='line'?1:style==='tone'?2:0;}
 group.userData={...plan.qa,directions:8,elevationTiers:3,viewsPerCharacter:24,source:'image_gen',staticWalkingPose:true,groundFit:{figures:figures.length,finishedSurface:true,maxGap:Math.max(0,...figures.map(f=>f.feet.y-shadowElevation(f.feet.x,f.feet.z)))}};return{group,figures,update,setStyle,setLighting,shadows,exportGroup};
}
