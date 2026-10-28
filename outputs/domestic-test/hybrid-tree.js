import * as T from 'three';
import {TREE_SPECIES,speciesById,speciesVariant,speciesDensity} from './tree-species.js?v=151';
import {createCanopyLayers} from './canopy-layers.js?v=151';
import {createWinterLeaves} from './winter-leaves.js?v=151';
import {createTreeWood} from './tree-wood.js?v=151';
import {addBillboardLightAttributes,writeBillboardLight,writeBillboardCrop,injectBillboardLight,createBillboardSunUniforms,writeBillboardSun} from './billboard-lighting.js?v=151';
import {canopyAtlasRect} from './canopy-atlas.js?v=151';
import {bearingVector} from './environment-policy.js?v=151';
export async function loadCanopyTexture(id=null){
 const species=speciesById(id),texture=await new T.TextureLoader().loadAsync(new URL(species?.atlas||'./vegetation/clusters/broadleaf-flat-v46.png',import.meta.url).href);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
 if(species){const response=await fetch(new URL('./vegetation/species-v65/frames.json',import.meta.url));if(!response.ok)throw new Error('나무 잎 영역 정보를 불러오지 못했습니다.');texture.userData.frames=(await response.json())[species.id].frames;texture.userData.species=species.id;texture.userData.foliageVersion=65;}
 return texture;
}
export async function loadSpeciesTextures(){return new Map(await Promise.all(TREE_SPECIES.map(async s=>[s.id,await loadCanopyTexture(s.id)])));}
// One atlas batch per species: shared geometry/material within each species.
export function createHybridTrees(plans,texture){
 if(!(texture instanceof Map))return createHybridTreeBatch(plans,texture);
 const ids=[...new Set(plans.map(p=>p.species))],batches=ids.map(id=>createHybridTreeBatch(plans.filter(p=>p.species===id),texture.get(id)));
 const group=new T.Group();group.name='KoreanSpeciesCanopies';batches.forEach(b=>group.add(b.group));
 group.userData={prototypeTrees:plans.length,clusters:batches.reduce((n,b)=>n+b.leaves.length,0),rootAnchored:true,canopyPlans:batches.flatMap(b=>b.group.userData.canopyPlans)};
 const sunShadows={batches:batches.flatMap(b=>b.sunShadows.batches),stats:{},set(profile,on){batches.forEach(b=>b.sunShadows.set(profile,on));Object.assign(this.stats,{casters:batches.reduce((n,b)=>n+b.sunShadows.stats.casters,0),batches:this.batches.length});}};
 return{group,batches,figures:batches.flatMap(b=>b.figures),leaves:batches.flatMap(b=>b.leaves),wood:{children:batches.flatMap(b=>b.wood.children)},sunShadows,
 update(camera){batches.forEach(b=>b.update(camera));},setLighting(field){batches.forEach(b=>b.setLighting(field));},setFoliage(options){batches.forEach(b=>b.setFoliage(options));},setStyle(value){batches.forEach(b=>b.setStyle(value));},
 exportGroup(){const out=new T.Group();batches.forEach(b=>out.add(b.exportGroup()));return out;},dispose(){batches.forEach(b=>b.dispose());}};
}

const atlasShader=shader=>{shader.vertexShader='attribute vec4 spriteRect;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv=spriteRect.xy+vMapUv*spriteRect.zw;\n#endif');};
function tierFor(pitch,previous){const next=pitch< -32?0:pitch>32?2:1;if(previous>=0&&Math.abs(next-previous)===1&&Math.abs(pitch-((previous+next)===1?-32:32))<5)return previous;return next;}
function rect(attribute,index,variant,tier,frames){attribute.setXYZW(index,...canopyAtlasRect(variant,tier,frames));}
function createHybridTreeBatch(plans,texture){
 const species=speciesById(plans[0]?.species),frames=texture.userData.frames;
 const group=new T.Group();group.name='FixedTrunkCanopies';const sunlight=createBillboardSunUniforms(),style={value:0};let foliageSeason='summer',foliageVisible=true,layerShading=true,lastProfile=null,lastShadows=true;
 const leaves=plans.flatMap(plan=>plan.clumps.map(c=>({...c,radius:c.radius*(c.cardScale??1),lightingRadius:(c.lightingRadius??c.radius)*(c.cardScale??1),plan,tier:-1}))).sort((a,b)=>(a.seasonRank??.5)-(b.seasonRank??.5)),figures=plans.map(p=>({placement:{id:p.id,root:p.root,kind:'tree',height:p.height,radius:p.radius,asset:p.species||'hybrid-broadleaf'},root:new T.Vector3(...p.root),plan:p}));
 const layers=createCanopyLayers(leaves);
 const wood=new T.Group();wood.name='fixed-trunks-and-branches';group.add(wood);
 for(const plan of plans){const trunk=createTreeWood(plan);if(trunk)wood.add(trunk);}

 const geometry=new T.PlaneGeometry(1,1),uvs=new T.InstancedBufferAttribute(new Float32Array(leaves.length*4),4);geometry.setAttribute('spriteRect',uvs);addBillboardLightAttributes(geometry,leaves.length,true);
 const material=new T.MeshBasicMaterial({map:texture,alphaTest:.48,side:T.DoubleSide,toneMapped:false});
 material.onBeforeCompile=shader=>{atlasShader(shader);injectBillboardLight(shader,sunlight);shader.uniforms.canopyStyle=style;shader.fragmentShader='uniform float canopyStyle;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 if(canopyStyle>1.5){float g=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=vec3(g);}
 else if(canopyStyle>.5){float g=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=vec3(mix(.16,1.,smoothstep(.09,.26,g)));}`);};material.customProgramCacheKey=()=> 'hybrid-leaf-sprays-v65';
 const mesh=new T.InstancedMesh(geometry,material,leaves.length);mesh.name='independent-leaf-masses';mesh.userData={isVegetationBillboard:true,isFoliageSilhouette:true,outlineOnly:true,fixedCenters:true,orientation:'camera-plane-fixed-roll'};mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(mesh);
 const shadowGroup=new T.Group();shadowGroup.name='fixed-leaf-sun-casters';group.add(shadowGroup);
 const sg=new T.PlaneGeometry(1,1),sr=new T.InstancedBufferAttribute(new Float32Array(leaves.length*4),4);sg.setAttribute('spriteRect',sr);
 const sm=new T.MeshBasicMaterial({map:texture,alphaTest:.48,side:T.DoubleSide,colorWrite:false,depthWrite:false,transparent:true,opacity:0});
 const depth=new T.MeshDepthMaterial({map:texture,alphaTest:.48,side:T.DoubleSide,depthPacking:T.RGBADepthPacking});const enabled={value:1};depth.onBeforeCompile=s=>{atlasShader(s);s.uniforms.sunCasterEnabled=enabled;s.fragmentShader='uniform float sunCasterEnabled;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('void main() {','void main() {\nif(sunCasterEnabled<.5)discard;');};depth.customProgramCacheKey=()=> 'hybrid-leaf-depth-v44';sm.addEventListener('dispose',()=>depth.dispose());
 const caster=new T.InstancedMesh(sg,sm,leaves.length);caster.name='sun-facing-leaf-clusters';caster.customDepthMaterial=depth;caster.castShadow=true;caster.frustumCulled=false;caster.userData={isVegetationSunCaster:true,isBillboardShadow:true,sunFixed:true};caster.onBeforeShadow=(_r,_o,_c,cam)=>{enabled.value=cam.isOrthographicCamera?1:0;};shadowGroup.add(caster);
 const winter=createWinterLeaves(plans,sunlight,style);group.add(winter.group);
 const matrix=new T.Matrix4(),q=new T.Quaternion(),viewRotation=new T.Quaternion(),sunRotation=new T.Quaternion(),rollRotation=new T.Quaternion(),e=new T.Euler(0,0,0,'YXZ'),center=new T.Vector3(),scale=new T.Vector3();
 function place(target,i,c,orientation){
  // Use one camera plane for every spray. Projecting branch axes onto the view
  // changes roll as the camera moves and becomes undefined looking along a twig.
  // The seeded roll stays fixed; position and scale remain anchored to the tree.
  q.copy(orientation).multiply(rollRotation.setFromEuler(e.set(0,0,c.roll||0,'YXZ')));
  const size=c.radius*Math.SQRT2;
  scale.set(size*(species?.leafAspect||1)*(c.aspect||1)*(c.mirror||1),size,1);
  center.set(...c.center);target.setMatrixAt(i,matrix.compose(center,q,scale));
 }
 // Both growing seasons use saturated greens. Spring keeps brighter yellow-green
 // new growth; summer lowers the value and shifts toward a deeper green.
 // All tint factors stay within 0..1, including exported GLB material colors.
 function leafColor(c){if(species&&(species.seasonal===foliageSeason||species.evergreen))return new T.Color().setScalar(Math.min(1,c.tone));const value=Math.min(1,c.tone),tint=foliageSeason==='spring'?new T.Color(.98,1,.17):foliageSeason==='summer'?new T.Color(.56,.82,.34):new T.Color(foliageSeason==='autumn'?0xffc16f:0xffffff);return new T.Color(value,value,value).multiply(tint);}
 leaves.forEach((c,i)=>{writeBillboardCrop(geometry,i,0,1,true);mesh.setColorAt(i,leafColor(c));});if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 function update(camera){camera.getWorldQuaternion(viewRotation);winter.update(camera);const shadeChanged=layers.update(camera.position,mesh.count);for(let i=0;i<mesh.count;i++){const c=leaves[i],dx=camera.position.x-c.center[0],dz=camera.position.z-c.center[2],dy=camera.position.y-c.center[1],pitch=Math.atan2(dy,Math.hypot(dx,dz)),tier=tierFor(pitch*180/Math.PI,c.tier);if(tier!==c.tier){rect(uvs,i,speciesVariant(species,c.variant,foliageSeason),tier,frames);c.tier=tier;uvs.needsUpdate=true;}place(mesh,i,c,viewRotation);if(shadeChanged)mesh.setColorAt(i,leafColor(c).multiplyScalar(layerShading?layers.values[i]:1));}if(shadeChanged&&mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.instanceMatrix.needsUpdate=true;}
 function setLighting(field){
  winter.setLighting(field);if(field.sunlight)for(const [key,uniform] of Object.entries(field.sunlight))sunlight[key].value=uniform.value;
  // Nearby twig cards share one sampled light field; splitting a crown must not
  // multiply expensive building-occlusion rays by seven.
  const samples=new Map();
  for(let i=0;i<leaves.length;i++){
   const c=leaves[i],key=c.plan.id+':'+(c.lightingGroup??i);let light=samples.get(key);
   if(!light){const centre=c.lightingCenter||c.center,r=c.lightingRadius||c.radius,root=new T.Vector3(centre[0],centre[1]-r,centre[2]),h=r*2;
    light={color:field.sampleFigure(root,h)[1],exposure:(field.sunExposure?.(root,h,r)||[1,1,1])[1]};samples.set(key,light);}
   writeBillboardLight(geometry,i,[light.color,light.color,light.color],true);
   writeBillboardSun(geometry,i,[c.center[0],c.center[1]-c.radius,c.center[2]],c.radius*2,[light.exposure,light.exposure,light.exposure],true);
  }
  for(const f of figures){f.lighting=field.sampleFigure(f.root,f.placement.height);f.sunExposure=field.sunExposure?.(f.root,f.placement.height,f.placement.radius)||[1,1,1];}
 }

 const stats={casters:leaves.length,batches:2,enabled:false,updates:0,direction:[0,1,0]};let signature='';
 const sunShadows={group:shadowGroup,batches:[{mesh:caster},{mesh:winter.caster}],stats,set(profile,on=true){lastProfile=profile;lastShadows=on;winter.setSun(profile,on);const active=!!(mesh.count>0&&on&&profile?.castsSunShadow&&profile.renderElevation>0);shadowGroup.visible=active;stats.enabled=active||winter.caster.visible;if(!active)return;const key=profile.azimuth+','+profile.renderElevation;if(key===signature)return;signature=key;const v=bearingVector(profile.azimuth,profile.renderElevation),pitch=profile.renderElevation*Math.PI/180,yaw=Math.atan2(v[0],v[2]);sunRotation.setFromEuler(e.set(-pitch,yaw,0,'YXZ'));leaves.forEach((c,i)=>{rect(sr,i,speciesVariant(species,c.variant,foliageSeason),tierFor(profile.renderElevation,-1),frames);place(caster,i,c,sunRotation);});sr.needsUpdate=caster.instanceMatrix.needsUpdate=true;stats.direction=v;stats.updates++;}};
 function setFoliage({season=foliageSeason,visible=foliageVisible,layerShade=layerShading}={}){foliageSeason=season;foliageVisible=visible;layerShading=layerShade;const density=speciesDensity(species,season);signature='';layers.invalidate();leaves.forEach(c=>c.tier=-1);mesh.count=caster.count=visible?Math.round(leaves.length*density):0;mesh.visible=mesh.count>0;winter.setVisible(visible&&season==='winter'&&!species?.evergreen);leaves.forEach((c,i)=>mesh.setColorAt(i,leafColor(c)));if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;stats.casters=mesh.count+winter.mesh.count;group.userData.foliage={species:species?.id??null,season,visible,leaves:mesh.count,retainedLeaves:winter.mesh.count,layerShade:layerShading,layers:layers.stats};sunShadows.set(lastProfile,lastShadows);}
 function exportGroup(){
  const out=new T.Group();out.name=group.name;out.add(wood.clone(true));
  const count=mesh.visible?mesh.count:0;
  if(count){
   // Export the same atlas UVs and colors in one static mesh per species, rather
   // than tens of thousands of individual glTF nodes/materials.
   const g=new T.BufferGeometry(),positions=new Float32Array(count*12),normals=new Float32Array(count*12),colors=new Float32Array(count*12),uvs=new Float32Array(count*8),indices=new Uint32Array(count*6);
   const base=geometry.attributes.position,baseUV=geometry.attributes.uv,m=new T.Matrix4(),normalMatrix=new T.Matrix3(),v=new T.Vector3(),n=new T.Vector3(),color=new T.Color();
   for(let i=0;i<count;i++){
    const c=leaves[i],r=canopyAtlasRect(speciesVariant(species,c.variant,foliageSeason),Math.max(0,c.tier),frames);
    mesh.getMatrixAt(i,m);normalMatrix.getNormalMatrix(m);mesh.getColorAt(i,color);n.set(0,0,1).applyMatrix3(normalMatrix).normalize();
    for(let k=0;k<4;k++){
     const vertex=i*4+k;v.fromBufferAttribute(base,k).applyMatrix4(m);positions.set(v.toArray(),vertex*3);normals.set(n.toArray(),vertex*3);colors.set(color.toArray(),vertex*3);
     uvs[vertex*2]=r[0]+baseUV.getX(k)*r[2];uvs[vertex*2+1]=r[1]+baseUV.getY(k)*r[3];
    }
    for(let k=0;k<6;k++)indices[i*6+k]=i*4+geometry.index.getX(k);
   }
   g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.setAttribute('color',new T.BufferAttribute(colors,3));g.setAttribute('uv',new T.BufferAttribute(uvs,2));g.setIndex(new T.BufferAttribute(indices,1));
   const exported=new T.Mesh(g,new T.MeshBasicMaterial({map:texture,alphaTest:.48,side:T.DoubleSide,vertexColors:true}));exported.name='twig-cards-'+(species?.id||'broadleaf');exported.userData={cards:count,season:foliageSeason};out.add(exported);
  }
  for(const winterLeaf of winter.exportMeshes())out.add(winterLeaf);return out;
 }

 group.userData={prototypeTrees:plans.length,clusters:leaves.length,rootAnchored:true,canopyPlans:plans.map(p=>({id:p.id,root:p.root,height:p.height,...p.stats}))};
 return{group,figures,leaves,wood,mesh,winter,layers,sunShadows,update,setLighting,setFoliage,exportGroup,setStyle(value){style.value=value==='line'?1:value==='tone'?2:0;},dispose(){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}
