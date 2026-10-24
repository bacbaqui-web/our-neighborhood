import * as T from 'three';

// Modify the final light contribution, not light direction or the shared clock.
// Keep the existing billboard atlas / illumination hooks intact.
export function createIllustrationShading(){
 const uniforms={inkBrightness:{value:1},inkDensity:{value:.7},inkBands:{value:0},inkMonochrome:{value:0},inkDayClarity:{value:0},inkBaseTint:{value:new T.Color(1,1,1)}};
 const installed=new WeakSet();
 function install(scene){scene.traverse(object=>{
  if(!object.isMesh||object.userData.isBillboardShadow||object.userData.isPedestrianShadow)return;
  const mats=[...(Array.isArray(object.material)?object.material:[object.material]),...(object._originalMaterial?(Array.isArray(object._originalMaterial)?object._originalMaterial:[object._originalMaterial]):[])];
  for(const material of mats){if(!material||installed.has(material)||(!material.isMeshStandardMaterial&&!material.isMeshBasicMaterial))continue;
   installed.add(material);const before=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
   const billboard=object.userData.isVegetationBillboard||object.userData.isPedestrianBillboard;
   material.onBeforeCompile=(shader,renderer)=>{
    before.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
    shader.fragmentShader='uniform float inkBrightness, inkDensity, inkBands, inkMonochrome, inkDayClarity;\nuniform vec3 inkBaseTint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
     ${billboard?'outgoingLight *= inkBrightness;':`
     // Emission is an independent light source, never a quantized shadow band.
     vec3 inkEmission=${material.isMeshStandardMaterial?'totalEmissiveRadiance':'vec3(0.)'};
     vec3 inkIllumination=max(outgoingLight-inkEmission,vec3(0.))/max(diffuseColor.rgb,vec3(.0001));
     vec3 inkPaint=diffuseColor.rgb;
     // Clear-day adaptation for pale warm paint. Saturated brick, blue glass,
     // green roofs and billboard artwork keep their original material hues.
     float inkMax=max(inkPaint.r,max(inkPaint.g,inkPaint.b));
     float inkMin=min(inkPaint.r,min(inkPaint.g,inkPaint.b));
     float inkSat=1.-inkMin/max(inkMax,.001);
     float inkWarm=smoothstep(0.,.06,inkPaint.r-inkPaint.b)*smoothstep(-.005,.025,inkPaint.r-inkPaint.g);
     float inkPale=(1.-smoothstep(.32,.60,inkSat))*smoothstep(.12,.38,inkMin)*inkWarm*inkDayClarity;
     float inkPaintLuma=dot(inkPaint,vec3(.2126,.7152,.0722));
     inkPaint=mix(inkPaint,vec3(mix(inkPaintLuma,1.,.18)),inkPale*.75);
     if(inkBands>0.){
       float inkLuma=dot(inkIllumination,vec3(.2126,.7152,.0722));
       float inkBand=inkBands<1.5?step(.63,inkLuma):(inkLuma<.40?0.:inkLuma<.78?.5:1.);
       inkIllumination *= mix(.32,1.12,inkBand)/max(inkLuma,.001);
     }
     outgoingLight=(mix(inkPaint*inkBaseTint,inkPaint*inkIllumination,inkDensity)+inkEmission)*inkBrightness;
     `}
     if(inkMonochrome>.5)outgoingLight=vec3(dot(outgoingLight,vec3(.2126,.7152,.0722)));
     #include <opaque_fragment>`);
   };
   material.customProgramCacheKey=()=>cacheKey+'-illustration-shading-v42-'+Number(!!billboard);
   material.needsUpdate=true;
  }
 });}
 function set(settings,profile,style){
  uniforms.inkBrightness.value=settings.brightness/100;
  uniforms.inkMonochrome.value=style==='color'?0:1;
  uniforms.inkDayClarity.value=style==='color'?(profile.dayClarity||0):0;
  uniforms.inkDensity.value=settings.shading?settings.density/100:0;
  uniforms.inkBands.value=settings.shadingMode==='two'?1:settings.shadingMode==='three'?2:0;
  uniforms.inkBaseTint.value.set(style==='color'?profile.tint:'#ffffff');
 }
 return{install,set};
}
