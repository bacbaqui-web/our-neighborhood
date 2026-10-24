import {createVegetationSunShadows} from './vegetation-sun-shadows.js?v=43';
import * as T from 'three';
import {addBillboardLightAttributes,writeBillboardLight,writeBillboardCrop,injectBillboardLight,createBillboardSunUniforms,writeBillboardSun} from './billboard-lighting.js?v=43';
import {createContactShadows} from './contact-shadows.js?v=33';
import {vegetationView,vegetationExtent} from './vegetation-math.js?v=31';
export async function loadVegetationAssets(catalog){
 const assets=new Map(),loader=new T.TextureLoader();
 await Promise.all(catalog.assets.map(async a=>{const texture=await loader.loadAsync(new URL('./vegetation/'+a.image,import.meta.url).href);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=4;assets.set(a.id,{...a,texture});}));return assets;
}
export function createVegetation(placements,assets,elevation,shadowElevation=elevation,contactPlacements=placements){
 let legacyVisible=true;const sunlight=createBillboardSunUniforms();
 const group=new T.Group();group.name='IllustratedVegetation';const style={value:0},batches=[],figures=[];
 for(const [id,asset] of assets){
  const list=placements.filter(p=>p.asset===id);if(!list.length)continue;
  const geometry=new T.PlaneGeometry(1,1),rects=new T.InstancedBufferAttribute(new Float32Array(list.length*4),4);geometry.setAttribute('spriteRect',rects);addBillboardLightAttributes(geometry,list.length,true);
  const material=new T.MeshBasicMaterial({map:asset.texture,color:0xffffff,alphaTest:.48,depthWrite:true,depthTest:true,side:T.DoubleSide,toneMapped:false});
  material.onBeforeCompile=shader=>{
   injectBillboardLight(shader,sunlight);
   shader.uniforms.vegetationStyle=style;shader.uniforms.vegetationTexel={value:new T.Vector2(1/asset.imageWidth,1/asset.imageHeight)};
   shader.vertexShader='attribute vec4 spriteRect;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = spriteRect.xy + vMapUv * spriteRect.zw;\n#endif');
   shader.fragmentShader='uniform float vegetationStyle;\nuniform vec2 vegetationTexel;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    if(vegetationStyle>1.5){float gray=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=vec3(gray);}
    else if(vegetationStyle>.5){vec4 centre=texture2D(map,vMapUv);float edge=0.;
     for(int i=0;i<4;i++){vec2 d=i==0?vec2(vegetationTexel.x,0.):i==1?vec2(-vegetationTexel.x,0.):i==2?vec2(0.,vegetationTexel.y):vec2(0.,-vegetationTexel.y);vec4 n=texture2D(map,vMapUv+d);edge=max(edge,max(length(centre.rgb-n.rgb),abs(centre.a-n.a)));}
     diffuseColor.rgb=mix(vec3(1.),vec3(.22),smoothstep(.09,.30,edge));
    }`);
  };material.customProgramCacheKey=()=> 'vegetation-lit-atlas-v43';
  const mesh=new T.InstancedMesh(geometry,material,list.length);mesh.name='vegetation-'+id;mesh.userData.isVegetationBillboard=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);
  const batch={mesh,rects,asset,figures:[]};batches.push(batch);
  list.forEach((p,i)=>{const f={placement:p,root:new T.Vector3(...p.root),asset,mesh,index:i,frame:-1,yaw:-1,tier:-1,azimuth:p.heading||0};figures.push(f);batch.figures.push(f);});
 }
 const sunShadows=createVegetationSunShadows(figures);group.add(sunShadows.group);
 const shadows=createContactShadows(contactPlacements.filter(p=>p.kind==='tree').map(p=>({id:p.id,root:p.root,radius:Math.min(2.1,Math.max(.65,p.radius*.70)),legacy:p.source==='existing-plant'})),shadowElevation);group.add(shadows.mesh);
 const matrix=new T.Matrix4(),rotation=new T.Quaternion(),euler=new T.Euler(0,0,0,'YXZ'),centre=new T.Vector3(),offset=new T.Vector3(),scale=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(),normal=new T.Vector3(),rootRay=new T.Vector3(),anchor=new T.Vector3();
 function update(camera){
  for(const batch of batches){let changedUV=false;for(const f of batch.figures){
   const p=f.placement;if(!legacyVisible&&p.source==='existing-plant'){f.mesh.setMatrixAt(f.index,matrix.makeScale(0,0,0));continue;}centre.copy(f.root);centre.y+=p.height*.5;
   const dx=camera.position.x-centre.x,dz=camera.position.z-centre.z,dy=camera.position.y-centre.y,horizontal=Math.hypot(dx,dz);
   const pitch=Math.atan2(dy,horizontal);if(horizontal>.01)f.azimuth=Math.atan2(dx,dz);
   const view=vegetationView(f.azimuth,pitch*180/Math.PI,p.heading||0,f.asset.elevationAngles,f),frame=f.asset.frames[view.index];
   if(f.frame!==view.index){const [x,y,w,h]=frame.rect;batch.rects.setXYZW(f.index,x/f.asset.imageWidth,1-(y+h)/f.asset.imageHeight,w/f.asset.imageWidth,h/f.asset.imageHeight);f.frame=view.index;f.yaw=view.yaw;f.tier=view.tier;changedUV=true;}
   const extent=vegetationExtent(p.height,p.radius,pitch,f.asset.kind),[x,y,w,h]=frame.rect,[ax,ay]=frame.anchorPixels;
   const cx=(.5-(ax-x)/w)*extent.width,cy=((ay-y)/h-.5)*extent.height;
   rotation.setFromEuler(euler.set(-pitch,f.azimuth,0,'YXZ'));right.set(1,0,0).applyQuaternion(rotation);up.set(0,1,0).applyQuaternion(rotation);
   // For overhead views place the card at crown depth, not on the ground:
   // otherwise half of a top-down crown would sink below the terrain. Move its
   // root pixel only along the root-to-camera ray, so the planted point never
   // moves on screen. Low views retain the actual root plane.
   anchor.copy(f.root);
   if(pitch>0){normal.copy(camera.position).sub(centre).normalize();rootRay.copy(camera.position).sub(f.root);const denominator=rootRay.dot(normal),t=Math.abs(denominator)>1e-6?(p.height*.5*normal.y)/denominator:0;if(t>=0&&t<.95)anchor.addScaledVector(rootRay,t);}
   f.anchorWorld=anchor.clone();
   offset.copy(anchor).addScaledVector(right,cx).addScaledVector(up,cy);scale.set(extent.width,extent.height,1);matrix.compose(offset,rotation,scale);f.mesh.setMatrixAt(f.index,matrix);
   const flatten=T.MathUtils.smoothstep(Math.abs(pitch),Math.PI/4,Math.PI*.47),base=(h-(ay-y))/h;
   writeBillboardCrop(f.mesh.geometry,f.index,-base*(1-flatten)/(1-base)+.70*flatten,(1-flatten)/(1-base),true);
   f.cameraElevation=pitch*180/Math.PI;f.worldWidth=extent.width;f.worldHeight=extent.height;
  }batch.mesh.instanceMatrix.needsUpdate=true;if(changedUV)batch.rects.needsUpdate=true;}
 }
 function setLighting(field){if(field.sunlight)Object.assign(sunlight,field.sunlight);for(const f of figures){const colors=typeof field==='string'?[0,1,2].map(()=>new T.Color(field)):field.sampleFigure(f.root,f.placement.height);f.sunExposure=field.sunExposure?.(f.root,f.placement.height,f.placement.radius)||[0,0,0];writeBillboardSun(f.mesh.geometry,f.index,f.root,f.placement.height,f.sunExposure,true);f.lighting=colors;writeBillboardLight(f.mesh.geometry,f.index,colors,true);}}
 function setStyle(value){style.value=value==='line'?1:value==='tone'?2:0;}
 // Export regular UV-mapped cutouts at the current camera view; the instance
 // attributes used by the renderer are not standard glTF texture coordinates.
 function exportGroup(){const out=new T.Group();out.name=group.name;for(const f of figures){if(!legacyVisible&&f.placement.source==='existing-plant')continue;const frame=f.asset.frames[f.frame<0?0:f.frame],geo=new T.PlaneGeometry(1,1),uv=geo.attributes.uv,[x,y,w,h]=frame.rect;for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*w)/f.asset.imageWidth,1-(y+(1-uv.getY(i))*h)/f.asset.imageHeight);const mat=new T.MeshBasicMaterial({color:f.lighting?.[1]||0xffffff,map:f.asset.texture,alphaTest:.48,side:T.DoubleSide,toneMapped:false});const mesh=new T.Mesh(geo,mat);f.mesh.getMatrixAt(f.index,mesh.matrix);mesh.matrixAutoUpdate=false;mesh.name=f.placement.id;out.add(mesh);}if(shadows.mesh.visible)out.add(shadows.mesh.clone());return out;}
 group.userData={trees:placements.filter(p=>p.kind==='tree').length,plants:placements.filter(p=>p.kind==='plant').length,drawCalls:batches.length,triangles:placements.length*2,rootAnchored:true};
 return{group,figures,update,setStyle,setLighting,shadows,sunShadows,exportGroup,setLegacyVisible:value=>{legacyVisible=value;shadows.setLegacyVisible(value);}};
}
