import * as T from 'three';
// Surface-only rules: keep all reserved gates, driveways and pedestrian routes open.
const active={value:1};
export function setGroundCharacter(enabled,root){active.value=enabled?1:0;const bands=root?.getObjectByName("wall-base-contact-bands");if(bands)bands.visible=enabled;}
export function applyGroundCharacter({alleyGroup,oldRoot,plan,elevation}) {
 const qa={version:135,pavedMeshes:0,roadMeshes:0,edgeSegments:0,addedTriangles:0,solidObstacles:0,rules:['world-scale paving joints','subtle slab color variation','terrain-following wall base bands','no added obstacles in access routes']};
 function finish(mesh,road=false){
  if(!mesh.isMesh)return;
  for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   if(!m?.isMeshStandardMaterial||m.userData.groundCharacter)continue;
   m.userData.groundCharacter=true;const prev=m.onBeforeCompile,key=m.customProgramCacheKey();
   m.onBeforeCompile=(shader,renderer)=>{prev.call(m,shader,renderer);qa.compiled=(qa.compiled||0)+1;if(typeof document!=="undefined")document.querySelector("#view").dataset.groundCharacter=JSON.stringify(qa);
    shader.uniforms.gcActive=active;shader.vertexShader='varying vec3 gcWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ngcWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader='uniform float gcActive; varying vec3 gcWorld;\nfloat gcHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     vec2 gcP=gcWorld.xz;
     ${road?`float gcWear=sin(gcP.x*.39+sin(gcP.y*.25))*sin(gcP.y*.31);diffuseColor.rgb*=mix(1.,.98+.025*gcWear,gcActive);`:`
     vec2 gcGrid=gcP/vec2(1.2,.8);
     vec2 gcD=min(fract(gcGrid),1.-fract(gcGrid))*vec2(1.2,.8);
     float gcDist=min(gcD.x,gcD.y);
     float gcAA=max(fwidth(gcDist),.002);
     float gcJoint=1.-smoothstep(.007-gcAA,.007+gcAA,gcDist);
     float gcFade=1.-smoothstep(.15,.6,length(fwidth(gcP)));
     float gcTile=gcHash(floor(gcGrid));
     diffuseColor.rgb*=mix(1.,mix(.94,1.04,gcTile),gcActive);
     `}`);
    // Keep joints legible after bright white line-art lighting and tone mapping.
    if(!road)shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.rgb=mix(gl_FragColor.rgb,min(gl_FragColor.rgb,vec3(1.))*(1.-.32*gcJoint*gcFade),gcActive);');
   };m._groundCharacterHook=m.onBeforeCompile;m.customProgramCacheKey=()=>key+'-ground-character135-'+road;m.needsUpdate=true;
  }
  if(road)qa.roadMeshes++;else qa.pavedMeshes++;
 }
 alleyGroup.traverse(o=>{if(o.name.startsWith('alley-batch-ground'))finish(o);});
 oldRoot.traverse(o=>{if(o.name==='path'||o.name==='ground')finish(o);if(o.name==='road')finish(o,!['sidewalk','platform','pavers'].includes(o.userData.roadClass));});
 // Narrow, irregular concrete/dirt contact band. It follows the slope at each end,
 // stays at wall edges, and never adds a collision object or artificial plant model.
 const pos=[];
 for(const r of plan.wallRuns||[]){const ps=r.points||[];for(let i=1;i<ps.length;i++){
  const a=ps[i-1],b=ps[i],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.5)continue;
  const n=Math.ceil(L/1.5),nx=-dz/L,nz=dx/L;
  for(let j=0;j<n;j++){
   const f=j/n,g=(j+1)/n,width=.17+.025*Math.sin((a[0]+a[1]+j)*2.7);
   const corners=[[a[0]+dx*f+nx*width,a[1]+dz*f+nz*width],[a[0]+dx*g+nx*width,a[1]+dz*g+nz*width],[a[0]+dx*g-nx*width,a[1]+dz*g-nz*width],[a[0]+dx*f-nx*width,a[1]+dz*f-nz*width]];
   for(const k of [0,1,2,0,2,3]){const [x,z]=corners[k];pos.push(x,elevation(x,z)+.087,z);}
   qa.edgeSegments++;
  }
 }}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
 const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:0x797c6e,roughness:1,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));mesh.name='wall-base-contact-bands';mesh.userData.surfaceOverlay=true;mesh.receiveShadow=true;alleyGroup.add(mesh);qa.addedTriangles=pos.length/9;
 return qa;
}
