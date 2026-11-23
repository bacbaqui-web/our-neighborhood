import * as T from 'three';
// Local-space indirect-light volume: no visible emissive box and no physical GI claim.
export function installInteriorVolume(root,{width,height,depth}){
 const uniforms={roomMin:{value:new T.Vector3(-width/2-.01,.31,-depth-.01)},roomMax:{value:new T.Vector3(width/2+.01,height+.35,-.07)},roomOn:{value:0},roomInverse:{value:new T.Matrix4()}};
 const clones=new Map();root.traverse(o=>{if(!o.isMesh||o.material?.transparent)return;const patch=m=>{if(!m.isMeshStandardMaterial||m.transparent)return m;if(clones.has(m))return clones.get(m);const n=m.clone();n.onBeforeCompile=s=>{Object.assign(s.uniforms,uniforms);s.vertexShader='varying vec3 roomWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nroomWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');s.fragmentShader='varying vec3 roomWorld; uniform vec3 roomMin; uniform vec3 roomMax; uniform float roomOn; uniform mat4 roomInverse;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 vec3 roomP=(roomInverse*vec4(roomWorld,1.0)).xyz;
 vec3 roomA=smoothstep(roomMin-vec3(.06),roomMin+vec3(.06),roomP);
 vec3 roomB=vec3(1.0)-smoothstep(roomMax-vec3(.06),roomMax+vec3(.06),roomP);
 float insideRoom=roomOn*roomA.x*roomA.y*roomA.z*roomB.x*roomB.y*roomB.z;
 reflectedLight.directDiffuse*=1.0-.88*insideRoom;
 reflectedLight.directSpecular*=1.0-.88*insideRoom;
 reflectedLight.indirectDiffuse=mix(reflectedLight.indirectDiffuse,diffuseColor.rgb*vec3(.78,.80,.75),insideRoom);
 `);};n.customProgramCacheKey=()=> 'salon-volume-v1';clones.set(m,n);return n;};o.material=Array.isArray(o.material)?o.material.map(patch):patch(o.material);});
 const outline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(width,height,depth)),new T.LineBasicMaterial({color:'#63b7c6',transparent:true,opacity:.55}));outline.position.set(0,.32+height/2,-depth/2);outline.visible=false;root.add(outline);
 return{outline,update(on){root.updateWorldMatrix(true,false);uniforms.roomInverse.value.copy(root.matrixWorld).invert();uniforms.roomOn.value=on?1:0;}};
}
