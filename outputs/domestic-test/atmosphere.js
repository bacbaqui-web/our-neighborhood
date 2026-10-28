import * as T from 'three';
import {environmentProfile,bearingVector} from './environment-policy.js?v=43';

// A separate depth pass keeps 22 km terrain from reducing the precision of nearby roofs.
export function createAtmosphere(data,solarContext,detailRadius=150){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1,1,60000),root=new T.Group();scene.add(root);
 const color=s=>new T.Color(s),u={zenith:{value:color('#6b9fc8')},horizon:{value:color('#dbe6e2')},cloud:{value:color('#ffffff')},sunColor:{value:color('#fff0d1')},sunDir:{value:new T.Vector3()},night:{value:0},sunset:{value:0},sunVisibility:{value:1},windowChance:{value:0},windowPattern:{value:0},cloudiness:{value:0},style:{value:0}};
 const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:false,uniforms:u,vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 precision highp float; varying vec3 vDir;uniform vec3 zenith,horizon,cloud,sunColor,sunDir;uniform float night,sunset,sunVisibility,cloudiness,style;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){return .55*noise(p)+.27*noise(p*2.03+4.)+.13*noise(p*4.1+12.)+.05*noise(p*8.2);}
 void main(){vec3 d=normalize(vDir);float height=max(d.y,0.);vec3 c=mix(horizon,zenith,pow(height,.55));
 // The warm horizon follows the astronomical sun direction at dawn and dusk.
 float sunFacing=max(dot(normalize(vec3(d.x,.00001,d.z)),normalize(vec3(sunDir.x,0.,sunDir.z))),0.);
 float sunsetBand=exp(-height*7.)*pow(sunFacing,2.)*sunset;
 c=mix(c,vec3(1.,.43,.20),sunsetBand*.28*(1.-cloudiness*.55));
 vec2 q=d.xz/(.18+max(d.y,.01))*1.1;float n=fbm(q+vec2(3.4,9.));float coverage=mix(smoothstep(.60,.73,n),smoothstep(.32,.63,n),cloudiness);coverage*=smoothstep(-.015,.12,d.y);c=mix(c,cloud,coverage*mix(.75,.9,cloudiness));
 float angular=dot(d,sunDir);float disc=smoothstep(mix(.99982,.99965,sunset),mix(.99994,.99984,sunset),angular);float glow=pow(max(angular,0.),180.)*.22+pow(max(angular,0.),9.)*sunset*.16;c+=sunColor*(disc*.8+glow)*sunVisibility*(1.-cloudiness*.87)*(1.-coverage*.75);
 vec2 starUV=vec2(atan(d.x,d.z)*140.,asin(d.y)*160.);vec2 cell=floor(starUV);float h=hash(cell);float star=step(.997,h)*(1.-smoothstep(.02,.15,length(fract(starUV)-.5)));c+=vec3(star)*smoothstep(.7,1.,night)*(1.-cloudiness)*smoothstep(.1,.45,d.y)*.6;
 if(style>.5){float gray=dot(c,vec3(.2126,.7152,.0722));c=style<1.5?mix(vec3(1.),vec3(.90),coverage):vec3(gray);}
 gl_FragColor=vec4(c,1.);#include <colorspace_fragment>
 }`.replace(';#include',';\n#include')});
 const sky=new T.Mesh(new T.SphereGeometry(34000,40,24),skyMaterial);sky.renderOrder=-100;sky.frustumCulled=false;scene.add(sky);
 const terrainUniforms={nearColor:{value:color('#75816c')},hazeColor:{value:color('#b2c8d2')},sunDir:u.sunDir,night:u.night,style:u.style,cloudiness:u.cloudiness,windowChance:u.windowChance,windowPattern:u.windowPattern};
 function landMaterial(city=false){return new T.ShaderMaterial({uniforms:terrainUniforms,side:T.DoubleSide,vertexShader:`varying vec3 vWorld,vNormal,vLocal,vScale,vSeed,vFace;void main(){vec4 p=vec4(position,1.);vLocal=position;vFace=normal;vScale=vec3(1.);vSeed=vec3(0.);
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;vScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));vSeed=instanceMatrix[3].xyz;
 #endif
 vec4 world=modelMatrix*p;vWorld=world.xyz;vec3 n=normal;
 #ifdef USE_INSTANCING
 n=mat3(instanceMatrix)*n;
 #endif
 vNormal=normalize(mat3(modelMatrix)*n);gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`precision highp float;varying vec3 vWorld,vNormal,vLocal,vScale,vSeed,vFace;uniform vec3 nearColor,hazeColor,sunDir;uniform float night,style,cloudiness,windowChance,windowPattern;
 void main(){float distance=length(vWorld.xz-cameraPosition.xz);float haze=1.-exp(-distance*mix(.00019,.00030,cloudiness));float shade=.77+.23*max(dot(normalize(vNormal),sunDir),0.);vec3 c=nearColor*shade;
 ${city?`c=mix(c,vec3(.47,.49,.48),.40*(1.-night));float across=abs(vFace.x)>.5?vLocal.z:vLocal.x;float width=abs(vFace.x)>.5?vScale.z:vScale.x;vec2 cell=vec2((across+.5)*max(1.,floor(width/3.6)),(vLocal.y+.5)*max(1.,floor(vScale.y/3.)));vec2 uv=fract(cell),aa=max(fwidth(cell),vec2(.015));vec2 pane=smoothstep(vec2(.20,.28)-aa,vec2(.20,.28)+aa,uv)*(1.-smoothstep(vec2(.78,.80)-aa,vec2(.78,.80)+aa,uv));float window=pane.x*pane.y;float random=fract(sin(dot(vSeed+vec3(floor(cell),0.),vec3(12.9898,78.233,37.719)))*43758.5453);if(abs(vFace.y)<.3){c*=1.-window*.18*(1.-night);c+=vec3(.82,.51,.24)*window*night*step(fract(random+windowPattern/16.),windowChance);}else c*=.86;haze=1.-exp(-distance*mix(.00038,.00055,cloudiness));`:`float urban=(1.-smoothstep(800.,1300.,length(vWorld.xz)))*(1.-smoothstep(70.,120.,vWorld.y));c=mix(c,mix(vec3(.39,.43,.42),vec3(.055,.07,.085),night)*shade,urban);float altitude=smoothstep(60.,600.,vWorld.y);c=mix(c,c*vec3(.89,.96,1.04),altitude*.35);`}
 c=mix(c,hazeColor,min(.96,haze));if(style>.5){float g=dot(c,vec3(.2126,.7152,.0722));c=style<1.5?vec3(.94-.13*shade*(1.-haze)):vec3(g);}gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));const indices=[],N=data.angles;
 for(let r=0;r<data.radii.length-1;r++)for(let j=0;j<N;j++){const a=r*N+j,b=r*N+(j+1)%N,c=a+N,d=b+N;indices.push(a,b,c,b,d,c);}geo.setIndex(indices);geo.computeVertexNormals();
 const terrain=new T.Mesh(geo,landMaterial());terrain.name='GeographicTerrain22km';root.add(terrain);
 const entries=data.city.map((b,i)=>({b,points:data.cityFootprints?.[i]})).filter(({b,points})=>{
  // Full detailed buildings are retained; all other records remain as simple background.
  if(points)return !points.every(p=>Math.hypot(...p)<=detailRadius);
  return Math.hypot(b[0],b[2])-Math.hypot(b[3],b[5])/2>detailRadius;
 });
 const city=new T.InstancedMesh(new T.BoxGeometry(1,1,1),landMaterial(true),entries.length),matrix=new T.Matrix4(),rotation=new T.Quaternion();
 const place=(b,i)=>{const [x,y,z,w,h,d,v,angle=0]=b;rotation.setFromAxisAngle(new T.Vector3(0,1,0),angle);matrix.compose(new T.Vector3(x,y+h/2,z),rotation,new T.Vector3(w,h,d));city.setMatrixAt(i,matrix);};
 entries.forEach(({b},i)=>place(b,i));city.computeBoundingSphere();city.name='GeographicContextBuildings';root.add(city);
 const stats={calls:0,triangles:0,contextBuildings:entries.length,contextRadius:data.contextRadius||null,terrainRadius:data.radius,detailRadius,source:data.contextBuildings,windowGeometry:0};
 function fitGround(sample){
  const p=geo.attributes.position,changes=new Map();
  // Match the inner terrain to the actual road/ground surface and ease out the correction.
  for(let j=0;j<N;j++){
   const angle=j/N*Math.PI*2,sx=Math.sin(angle),sz=-Math.cos(angle),edge=detailRadius;
   const current=sample(sx*edge,sz*edge,NaN);
   const ring=data.radii.reduce((best,r,i)=>Math.abs(r-edge)<Math.abs(data.radii[best]-edge)?i:best,0);
   const delta=Number.isFinite(current)?current-p.getY(ring*N+j):0;changes.set(j,delta);
   for(let r=0;r<data.radii.length;r++){
    const index=r*N+j,d=data.radii[r],x=p.getX(index),z=p.getZ(index),actual=d<=edge?sample(x,z,NaN):NaN;
    const u=Math.max(0,Math.min(1,(d-edge)/140)),fade=1-u*u*(3-2*u);
    p.setY(index,Number.isFinite(actual)?actual-.08:p.getY(index)+delta*fade-.08);
   }
  }
  entries.forEach(({b},i)=>{const d=Math.hypot(b[0],b[2]),angle=(Math.atan2(b[0],-b[2])+Math.PI*2)%(Math.PI*2),j=Math.round(angle/(Math.PI*2)*N)%N,u=Math.max(0,Math.min(1,(d-detailRadius)/140));place([b[0],b[1]+changes.get(j)*(1-u*u*(3-2*u)),...b.slice(2)],i);});
  p.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();city.instanceMatrix.needsUpdate=true;city.computeBoundingSphere();
 }
 let profile=environmentProfile(12,'clear',solarContext),style='color',enabled=true;
 function set(hour,weather,nextStyle=style,chance,pattern=0){
  profile=environmentProfile(hour,weather,solarContext);style=nextStyle;
  for(const k of ['zenith','horizon','cloud'])u[k].value.set(profile[k]);
  u.sunColor.value.set(profile.sun);u.sunDir.value.set(...bearingVector(profile.azimuth,profile.renderElevation));u.night.value=profile.night;
  u.sunset.value=profile.sunset;u.sunVisibility.value=profile.sunVisibility;u.cloudiness.value=profile.cloudiness;u.style.value=style==='line'?1:style==='tone'?2:0;
  u.windowChance.value=chance??profile.windowChance;u.windowPattern.value=pattern;
  terrainUniforms.nearColor.value.set(profile.terrain);terrainUniforms.hazeColor.value.set(profile.haze);return profile;
 }
 function render(renderer,mainCamera){camera.copy(mainCamera,false);camera.near=1;camera.far=60000;camera.updateProjectionMatrix();camera.updateMatrixWorld();sky.position.copy(mainCamera.position);root.visible=enabled;const auto=renderer.autoClear;renderer.autoClear=true;renderer.render(scene,camera);stats.calls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;renderer.clearDepth();renderer.autoClear=false;return auto;}
 function dispose(){scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 return{set,render,dispose,fitGround,setEnabled:value=>{enabled=value;},data,scene,stats};
}
