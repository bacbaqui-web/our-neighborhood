import * as T from 'three';
// A quiet, blurred sky/building environment shared by the vehicle's windows.
export function createGlassEnvironment(renderer){
 const w=256,h=128,data=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const elevation=Math.cos(Math.PI*y/(h-1)),a=x/w*Math.PI*2;
  const sky=Math.max(0,Math.min(1,(elevation+.15)/.7));
  const buildings=Math.exp(-Math.pow((elevation+.03)/.25,2))*(.5+.5*Math.sin(a*5+.7))*22;
  const cloud=Math.exp(-Math.pow((elevation-.4)/.17,2))*(.5+.5*Math.sin(a*2))*12;
  const i=(y*w+x)*4;
  data[i]=100+sky*82-buildings+cloud;data[i+1]=110+sky*87-buildings+cloud;data[i+2]=111+sky*99-buildings+cloud;data[i+3]=255;
 }
 const tex=new T.DataTexture(data,w,h,T.RGBAFormat);tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;tex.needsUpdate=true;
 const cube=new T.WebGLCubeRenderTarget(128);cube.fromEquirectangularTexture(renderer,tex);tex.dispose();return cube;
}
export function rayGlassMaterial(source,environment,lit=false){
 const Material=lit?T.MeshLambertMaterial:T.MeshBasicMaterial;
 const material=new Material({map:source.map,color:source.color,side:source.side,envMap:environment,combine:T.MixOperation,reflectivity:.14});
 material.name='Ray unified slate glass / subtle reflection';
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 rayLocalPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrayLocalPosition = position;');
  shader.fragmentShader='varying vec3 rayLocalPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 c=diffuseColor.rgb;
   float blueGlass=smoothstep(.002,.012,c.b-c.r)*smoothstep(.001,.008,c.g-c.r);
   float darkGlass=1.0-smoothstep(.18,.28,max(c.r,max(c.g,c.b)));
   float glassMask=blueGlass*darkGlass;
   diffuseColor.rgb=mix(c,vec3(.055,.075,.091),glassMask);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_fragment>','specularStrength *= glassMask;\n#include <envmap_fragment>');
 };
 material.customProgramCacheKey=()=> 'ray-glass-v1';return material;
}
