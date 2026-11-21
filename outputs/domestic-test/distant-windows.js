import * as T from 'three';

// Same bay spacing as detailed frontages, with three-metre floor rows.
export function distantWindowLayout(length,styleIndex){
 const spacingHint=styleIndex===4?1.9:styleIndex===3?3.6:styleIndex===0?3.2:2.7;
 const bays=Math.max(1,Math.floor((length-.5)/spacingHint));
 const spacing=length/bays;
 return {bays,spacing,halfWidth:length<1.4?0:Math.min(.38,.95/spacing)};
}
export function installDistantWindows(material,environment={}){
 const uniforms={farWindowChance:environment.windowChance||{value:0},farWindowPattern:environment.windowPattern||{value:0},farWindowNight:environment.night||{value:0},farWindowGlass:{value:new T.Color(0x79999a)}};
 material.userData.distantWindows=uniforms;
 const before=material.onBeforeCompile;
 material.onBeforeCompile=(shader,renderer)=>{
  before.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='attribute vec4 facadeUv; attribute vec3 facadeFrame; varying vec4 vFacadeUv; varying vec3 vFacadeFrame;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFacadeUv=facadeUv; vFacadeFrame=facadeFrame;');
  shader.fragmentShader='varying vec4 vFacadeUv; varying vec3 vFacadeFrame; uniform float farWindowChance,farWindowPattern,farWindowNight; uniform vec3 farWindowGlass;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 windowCell=fract(vFacadeUv.xy),windowAA=max(fwidth(vFacadeUv.xy),vec2(.0001));
   vec2 windowDistance=abs(windowCell-vec2(.5,.525));
   vec2 windowOuter=1.-smoothstep(vec2(vFacadeUv.z,.225)-windowAA,vec2(vFacadeUv.z,.225)+windowAA,windowDistance);
   vec2 windowInner=1.-smoothstep(vec2(max(0.,vFacadeUv.z-.025),.205)-windowAA,vec2(max(0.,vFacadeUv.z-.025),.205)+windowAA,windowDistance);
   float windowVisibility=step(.001,vFacadeUv.z)*(1.-smoothstep(.18,.65,max(windowAA.x,windowAA.y)));
   float windowFrame=windowOuter.x*windowOuter.y*windowVisibility;
   float windowPane=windowInner.x*windowInner.y*windowVisibility*smoothstep(.008,.008+windowAA.x,windowDistance.x);
   float windowRandom=fract(sin(dot(floor(vFacadeUv.xy),vec2(12.9898,78.233))+vFacadeUv.w*37.719)*43758.5453);
   float windowLit=step(fract(windowRandom+farWindowPattern/16.),farWindowChance)*farWindowNight;
   diffuseColor.rgb=mix(diffuseColor.rgb,vFacadeFrame,windowFrame);
   diffuseColor.rgb=mix(diffuseColor.rgb,mix(farWindowGlass,vec3(.55,.39,.18),windowLit),windowPane);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.65,.36,.12)*windowPane*windowLit;');
 };
 material.customProgramCacheKey=()=> 'distant-windows-v1';
}
