import * as T from 'three';

const screenVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
// Port of Squichup's foreground-face ink, independent HSV controls, and
// camera-axis minimum-distance rule. Conventional WebGL depth (near=0).
export const inkFragment=`
precision highp float;
varying vec2 vUv;
uniform sampler2D image, surfaces, depths;
uniform vec2 texel, widths, outerAdjust, innerAdjust, cameraRange;
uniform float minDistance, acrossObjects, outerFace, innerFace, innerNormalThreshold;
vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 faceAt(vec2 uv){return clamp(srgb(texture2D(image,uv).rgb),0.,1.);}
float meters(float d){return cameraRange.x*cameraRange.y/(cameraRange.y-d*(cameraRange.y-cameraRange.x));}
bool jump(vec2 uv,vec2 offset){
 float before=texture2D(depths,uv-offset).r,center=texture2D(depths,uv).r;
 float after=texture2D(depths,uv+offset).r,beyond=texture2D(depths,uv+2.*offset).r;
 return abs(after-center)>abs(center-before)+abs(beyond-after)+.00000018;
}
vec3 ink(vec3 face,vec2 adjust,float colored){
 if(colored<.5)return vec3(0.);
 float high=max(face.r,max(face.g,face.b)),low=min(face.r,min(face.g,face.b));
 float saturation=high>0.?(high-low)/high:0.;
 float factor=saturation>0.?min(saturation*adjust.y,1.)/saturation:1.;
 float valueScale=high>0.?min(high*adjust.x,1.)/high:0.;
 return clamp((vec3(high)-(vec3(high)-face)*factor)*valueScale,0.,1.);
}
void main(){
 vec3 color=faceAt(vUv),foreground=color;
 vec4 center=texture2D(surfaces,vUv);float d=texture2D(depths,vUv).r;
 // Negative IDs are outer-only cutouts; zero is empty background.
 float nearest=center.a!=0.?d:1.,outer=0.,inner=0.;
 for(int i=0;i<8;i++){
  float angle=float(i)*.78539816339;vec2 dir=vec2(cos(angle),sin(angle));
  vec2 offset=dir*texel*max(.5,widths.x*.5);
  vec4 adjacent=texture2D(surfaces,vUv+offset);float after=texture2D(depths,vUv+offset).r;
  bool both=center.a!=0.&&adjacent.a!=0.;
  float before=texture2D(depths,vUv-offset).r;
  bool outerJump=minDistance>0.?jump(vUv,offset):(abs(after-d)>.0003&&abs(after-d)>4.*abs(d-before)+.00001);
  // All foliage cards share one silhouette, across species and winter leaves.
  // Their real depths still occlude buildings, but overlaps within the canopy
  // must not become strokes just because separate cards sit at different depths.
  bool sameFoliage=center.a==-1000001.&&adjacent.a==-1000001.;
  bool boundary=widths.x>0.&&(center.a!=adjacent.a||(both&&!sameFoliage&&outerJump));
  // Only explicitly ink-free surfaces suppress the foreground contour.
  if(boundary&&(after<d?adjacent.a:center.a)==-16777216.)boundary=false;
  bool limited=both&&(center.a==adjacent.a||acrossObjects>.5);
  if(boundary&&limited&&minDistance>0.&&abs(meters(d)-meters(after))<minDistance)boundary=false;
  if(boundary){outer=1.;if(adjacent.a!=0.&&after<nearest){foreground=faceAt(vUv+offset);nearest=after;}}
  vec2 innerOffset=dir*texel*max(.5,widths.y*.5);vec4 inside=texture2D(surfaces,vUv+innerOffset);
  if(widths.y>0.&&center.a>0.&&center.a==inside.a&&(minDistance<=0.||!jump(vUv,innerOffset)))
    inner=max(inner,step(innerNormalThreshold,length(inside.rgb-center.rgb)));
 }
 color=mix(color,ink(color,innerAdjust,innerFace),inner*min(1.,widths.y));
 color=mix(color,ink(foreground,outerAdjust,outerFace),outer*min(1.,widths.x));
 gl_FragColor=vec4(color,1.);
}`;
// FXAA filters the finished colored/black lines as well as mesh silhouettes.
const aaFragment=`
varying vec2 vUv;uniform sampler2D image;uniform vec2 texel;uniform float enabled;
void main(){
 vec3 center=texture2D(image,vUv).rgb;if(enabled<.5){gl_FragColor=vec4(center,1.);return;}
 vec3 nw=texture2D(image,vUv+vec2(-1.,-1.)*texel).rgb,ne=texture2D(image,vUv+vec2(1.,-1.)*texel).rgb;
 vec3 sw=texture2D(image,vUv+vec2(-1.,1.)*texel).rgb,se=texture2D(image,vUv+vec2(1.,1.)*texel).rgb;
 vec3 luma=vec3(.299,.587,.114);float m=dot(center,luma),a=dot(nw,luma),b=dot(ne,luma),c=dot(sw,luma),d=dot(se,luma);
 float low=min(m,min(min(a,b),min(c,d))),high=max(m,max(max(a,b),max(c,d)));
 if(high-low<max(1./255.,high*.03125)){gl_FragColor=vec4(center,1.);return;}
 vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));float reduce=max((a+b+c+d)*(.25*.125),1./128.);
 direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),-8.,8.)*texel;
 vec3 first=.5*(texture2D(image,vUv+direction*(1./3.-.5)).rgb+texture2D(image,vUv+direction*(2./3.-.5)).rgb);
 vec3 second=first*.5+.25*(texture2D(image,vUv-direction*.5).rgb+texture2D(image,vUv+direction*.5).rgb);
 float candidate=dot(second,luma);gl_FragColor=vec4(candidate<low||candidate>high?first:second,1.);
}`;

export function createIllustrationRenderer(renderer){
 const color=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});
 const surface=new T.WebGLRenderTarget(1,1,{type:T.FloatType,minFilter:T.NearestFilter,magFilter:T.NearestFilter});
 surface.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
 const finished=new T.WebGLRenderTarget(1,1,{depthBuffer:false});
 const uniforms={image:{value:color.texture},surfaces:{value:surface.texture},depths:{value:surface.depthTexture},texel:{value:new T.Vector2(1,1)},widths:{value:new T.Vector2()},outerAdjust:{value:new T.Vector2()},innerAdjust:{value:new T.Vector2()},cameraRange:{value:new T.Vector2()},minDistance:{value:0},acrossObjects:{value:1},outerFace:{value:1},innerFace:{value:1},innerNormalThreshold:{value:.36}};
 const inkMaterial=new T.ShaderMaterial({uniforms,vertexShader:screenVertex,fragmentShader:inkFragment,depthTest:false,depthWrite:false,toneMapped:false});
 const aaMaterial=new T.ShaderMaterial({uniforms:{image:{value:finished.texture},texel:uniforms.texel,enabled:{value:1}},vertexShader:screenVertex,fragmentShader:aaFragment,depthTest:false,depthWrite:false,toneMapped:false});
 const screen=new T.Scene(),screenCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),inkMaterial);screen.add(quad);quad.frustumCulled=false;
 const cache=new WeakMap(),owned=new Set(),size=new T.Vector2();
 let sampleCount=0,lastMetadataKey=null;const stats={calls:0,triangles:0,lines:0,surfaceCalls:0,width:0,height:0};
 function metadataMaterial(object,original){
  let byMaterial=cache.get(object);if(!byMaterial){byMaterial=new WeakMap();cache.set(object,byMaterial);}
  let mat=byMaterial.get(original);if(mat)return mat;
  const atlas=!!object.geometry.attributes.spriteRect,ids=!!object.geometry.attributes.inkObjectId;
  mat=new T.ShaderMaterial({side:original.side,polygonOffset:original.polygonOffset,polygonOffsetFactor:original.polygonOffsetFactor,polygonOffsetUnits:original.polygonOffsetUnits,
   uniforms:{map:{value:original.map||null},alphaCutoff:{value:original.alphaTest||.01},objectId:{value:object.userData.noInk?16777216:object.userData.isFoliageSilhouette?1000001:object.id},outlineSign:{value:object.userData.noInk||object.userData.isFoliageSilhouette||object.userData.isPedestrianBillboard||object.userData.outlineOnly?-1:1}},
   defines:{...(original.map?{HAS_MAP:1}:{}),...(atlas?{HAS_ATLAS:1}:{}),...(ids?{HAS_IDS:1}:{})},
   vertexShader:`varying vec3 vSurfaceNormal;varying float vObjectId;uniform float objectId;
   #ifdef HAS_MAP
   varying vec2 vSurfaceUv;
   #endif
   #ifdef HAS_ATLAS
   attribute vec4 spriteRect;
   #endif
   #ifdef HAS_IDS
   attribute float inkObjectId;
   #endif
   void main(){vec4 p=vec4(position,1.);vec3 n=normal;
   #ifdef USE_INSTANCING
   p=instanceMatrix*p;mat3 im=mat3(instanceMatrix);n/=vec3(dot(im[0],im[0]),dot(im[1],im[1]),dot(im[2],im[2]));n=im*n;
   #endif
   vSurfaceNormal=normalize(normalMatrix*n);vObjectId=objectId;
   #ifdef HAS_IDS
   vObjectId=inkObjectId;
   #endif
   #ifdef HAS_MAP
   vSurfaceUv=uv;
   #ifdef HAS_ATLAS
   vSurfaceUv=spriteRect.xy+vSurfaceUv*spriteRect.zw;
   #endif
   #endif
   gl_Position=projectionMatrix*modelViewMatrix*p;}`,
   fragmentShader:`varying vec3 vSurfaceNormal;varying float vObjectId;uniform float outlineSign;
   #ifdef HAS_MAP
   uniform sampler2D map;uniform float alphaCutoff;varying vec2 vSurfaceUv;
   #endif
   void main(){
   #ifdef HAS_MAP
   if(texture2D(map,vSurfaceUv).a<alphaCutoff)discard;
   #endif
   gl_FragColor=vec4(normalize(vSurfaceNormal)*(gl_FrontFacing?1.:-1.),outlineSign*floor(vObjectId+.5));}`,
  });byMaterial.set(original,mat);owned.add(mat);original.addEventListener('dispose',()=>{mat.dispose();owned.delete(mat);byMaterial.delete(original);});return mat;
 }
 function hideLegacyLines(scene){const hidden=[];scene.traverseVisible(o=>{if(o.isLineSegments){hidden.push(o);o.visible=false;}});return hidden;}
 function render(scene,camera,drawColor,settings,cssScale=renderer.getPixelRatio(),metadataKey=null){
  renderer.getDrawingBufferSize(size);const w=size.x,h=size.y;
  const samples=settings.antialias==='msaa'?Math.min(4,renderer.capabilities.maxSamples):0;
  if(samples!==sampleCount){color.dispose();color.samples=samples;sampleCount=samples;}
  for(const target of [color,surface,finished])if(target.width!==w||target.height!==h){target.setSize(w,h);lastMetadataKey=null;}
  uniforms.texel.value.set(1/w,1/h);uniforms.cameraRange.value.set(camera.near,camera.far);
  uniforms.widths.value.set(settings.lines?settings.outerWidth*cssScale:0,settings.lines?settings.innerWidth*cssScale:0);
  uniforms.outerAdjust.value.set(settings.outerBrightness/100,settings.outerSaturation/100);uniforms.innerAdjust.value.set(settings.innerBrightness/100,settings.innerSaturation/100);
  uniforms.innerNormalThreshold.value=Number.isFinite(settings.innerAngle)?2*Math.sin(settings.innerAngle*Math.PI/360):.36;
  uniforms.minDistance.value=settings.minDistance/100;uniforms.acrossObjects.value=Number(settings.acrossObjects);uniforms.outerFace.value=Number(settings.outerFace);uniforms.innerFace.value=Number(settings.innerFace);aaMaterial.uniforms.enabled.value=settings.antialias==='off'?0:1;
  const target=renderer.getRenderTarget(),auto=renderer.autoClear,shadow=renderer.shadowMap.enabled,clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha(),infoAuto=renderer.info.autoReset;
  const hidden=hideLegacyLines(scene),replaced=[];renderer.info.autoReset=false;renderer.info.reset();
  try{
   renderer.setRenderTarget(color);drawColor();
   // This cheap unlit pass runs only for visible LOD geometry. It never changes
   // the full-scene shadow cache, and transparent shadows / halos aren't edges.
   if(settings.lines&&(settings.outerWidth>0||settings.innerWidth>0)&&(metadataKey===null||metadataKey!==lastMetadataKey)){
    scene.traverseVisible(o=>{
     if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];
      if(mats.some(m=>m.transparent||m.isShaderMaterial)||o.userData.surfaceOverlay){hidden.push(o);o.visible=false;return;}
      replaced.push([o,o.material]);const next=mats.map(m=>metadataMaterial(o,m));o.material=Array.isArray(o.material)?next:next[0];
     }else if(o.isSprite||o.isPoints||o.isLine){hidden.push(o);o.visible=false;}
    });
    const colorCalls=renderer.info.render.calls;renderer.shadowMap.enabled=false;renderer.autoClear=true;renderer.setClearColor(0,0);renderer.setRenderTarget(surface);renderer.render(scene,camera);stats.surfaceCalls=renderer.info.render.calls-colorCalls;lastMetadataKey=metadataKey;
    for(const [o,m] of replaced)o.material=m;replaced.length=0;
   }else stats.surfaceCalls=0;
   renderer.autoClear=true;renderer.shadowMap.enabled=false;quad.material=inkMaterial;renderer.setRenderTarget(finished);renderer.render(screen,screenCamera);
   quad.material=aaMaterial;renderer.setRenderTarget(target);renderer.render(screen,screenCamera);
   Object.assign(stats,{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,lines:renderer.info.render.lines,width:w,height:h,samples,cssScale,metadataReused:stats.surfaceCalls===0});
  }finally{
   for(const [o,m] of replaced)o.material=m;for(const o of hidden)o.visible=true;
   renderer.shadowMap.enabled=shadow;renderer.setClearColor(clear,alpha);renderer.autoClear=auto;renderer.setRenderTarget(target);renderer.info.autoReset=infoAuto;
  }
  return stats;
 }
 function dispose(){for(const t of [color,surface,finished])t.dispose();for(const m of owned)m.dispose();inkMaterial.dispose();aaMaterial.dispose();quad.geometry.dispose();}
 return{render,stats,dispose};
}
