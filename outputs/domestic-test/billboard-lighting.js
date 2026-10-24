import * as T from 'three';
import {windowIsLit,bearingVector} from './environment-policy.js?v=43';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const inside=(x,z,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const cross=(a,b,c,d)=>a*d-b*c;

// Occlusion is evaluated against physical buildings, yard walls and shelter roofs,
// never against a rotating billboard. The spatial grid and cached sample paths
// keep this work out of the render loop.
export function createBillboardLightField({plan={lights:[]},windows=[],shops=[],buildings=[],streetscape={},structures={},elevation=()=>0}={}){
 const blockers=[],grid=new Map(),sources=[],sourceGrid=new Map(),cache=new Map();let state={night:0,tint:'#ffffff',painted:true,local:true,lamps:true,chance:0,pattern:0};
 const stats={samples:0,occlusionTests:0,blockedPaths:0,cacheHits:0,sunTests:0,sunBlocked:0,sunCacheHits:0};
 const sunCache=new Map(),sunDirection=new T.Vector3(0,1,0);let sunKey='';
 const sunlight=createBillboardSunUniforms();
 const key=(x,z)=>Math.floor(x/10)+','+Math.floor(z/10);
 const inSolid=(o,x,z)=>inside(x,z,o.points)&&!(o.holes||[]).some(h=>inside(x,z,h));
 function addBlocker(o){o.minX=Math.min(...o.points.map(p=>p[0]));o.maxX=Math.max(...o.points.map(p=>p[0]));o.minZ=Math.min(...o.points.map(p=>p[1]));o.maxZ=Math.max(...o.points.map(p=>p[1]));const index=blockers.push(o)-1;for(let x=Math.floor(o.minX/10);x<=Math.floor(o.maxX/10);x++)for(let z=Math.floor(o.minZ/10);z<=Math.floor(o.maxZ/10);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(index);}}
 for(const s of buildings)addBlocker({points:s.points,holes:s.holePoints,base:s.base,top:s.top});
 for(const w of streetscape.wallRuns||[])for(let i=1;i<w.points.length;i++){const a=w.points[i-1],b=w.points[i];if(Math.hypot(b[0]-a[0],b[1]-a[1])<.05)continue;addBlocker({points:[a,b],base:Math.min(elevation(...a),elevation(...b))-.1,top:Math.max(elevation(...a),elevation(...b))+w.height*(1-(w.railRatio||0))});}
 for(const s of structures.structures||[]){if(s.roofKind==='none')continue;const y=Math.max(...s.footprint.map(p=>elevation(...p)))+(s.roofHeight??2.7);addBlocker({points:s.footprint,base:['shed','workshop'].includes(s.type)?Math.min(...s.footprint.map(p=>elevation(...p))):y-.20,top:y+.12});}
 function* rayCells(ax,az,bx,bz){
  let x=Math.floor(ax/10),z=Math.floor(az/10);const endX=Math.floor(bx/10),endZ=Math.floor(bz/10),dx=bx-ax,dz=bz-az,sx=Math.sign(dx),sz=Math.sign(dz);
  const tx=dx?10/Math.abs(dx):Infinity,tz=dz?10/Math.abs(dz):Infinity;let nextX=dx?((sx>0?(x+1)*10:x*10)-ax)/dx:Infinity,nextZ=dz?((sz>0?(z+1)*10:z*10)-az)/dz:Infinity;
  for(let n=0;n<4096;n++){yield x+','+z;if(x===endX&&z===endZ)return;if(nextX<nextZ){x+=sx;nextX+=tx;}else{z+=sz;nextZ+=tz;}}
 }
 function blocked(a,b,margin=.012){const [ax,ay,az]=a,[bx,by,bz]=b,dx=bx-ax,dy=by-ay,dz=bz-az,seen=new Set();
  for(const cell of rayCells(ax,az,bx,bz))for(const i of grid.get(cell)||[]){if(seen.has(i))continue;seen.add(i);const o=blockers[i];if(Math.max(ay,by)<o.base||Math.min(ay,by)>o.top)continue;
   const valid=t=>t>margin&&t<1-margin;
   for(const ring of [o.points,...(o.holes||[])])for(let j=0;j<ring.length;j++){const A=ring[j],B=ring[(j+1)%ring.length],ex=B[0]-A[0],ez=B[1]-A[1],den=cross(dx,dz,ex,ez);if(Math.abs(den)<1e-8)continue;const t=cross(A[0]-ax,A[1]-az,ex,ez)/den,u=cross(A[0]-ax,A[1]-az,dx,dz)/den,y=ay+dy*t;if(valid(t)&&u>=0&&u<=1&&y>o.base&&y<o.top)return true;}
   if(o.points.length>2){if(Math.abs(dy)>1e-8)for(const y of [o.base,o.top]){const t=(y-ay)/dy;if(valid(t)&&inSolid(o,ax+t*dx,az+t*dz))return true;}if(by>o.base&&by<o.top&&inSolid(o,bx,bz))return true;}
  }return false;
 }
 function addSource(s){sources.push(s);const r=s.range;for(let x=Math.floor((s.position[0]-r)/10);x<=Math.floor((s.position[0]+r)/10);x++)for(let z=Math.floor((s.position[2]-r)/10);z<=Math.floor((s.position[2]+r)/10);z++){const k=x+','+z;if(!sourceGrid.has(k))sourceGrid.set(k,[]);sourceGrid.get(k).push(s);}}
 for(const l of plan.lights){const [x,y,z]=l.root,[nx,nz]=l.direction,p=[x+nx*l.reach,y+l.height+.05,z+nz*l.reach],target=[p[0]+nx*.65,elevation(p[0]+nx*.65,p[2]+nz*.65),p[2]+nz*.65];addSource({id:l.id,kind:'lamp',position:p,direction:new T.Vector3(...target).sub(new T.Vector3(...p)).normalize().toArray(),range:23,intensity:l.intensity??95,angle:Math.PI*.31,penumbra:.72});}
 windows.forEach((w,i)=>{const [x,y,z]=w.position,[nx,nz]=w.normal,p=[x+nx*.10,y,z+nz*.10],target=[x+nx*3,Math.max(elevation(x+nx*3,z+nz*3)+.15,y-1.6),z+nz*3];addSource({id:'window-'+i,kind:'window',band:w.band,position:p,direction:new T.Vector3(...target).sub(new T.Vector3(...p)).normalize().toArray(),range:9,intensity:14,angle:Math.PI*.40,penumbra:.8});});
 for(const s of shops)addSource(s);
 function set(config){state={...state,...config};const p=state.sunProfile;
  sunlight.billboardDayStrength.value=p&&state.shading!==false?(1-p.night):0;
  sunlight.billboardShadeDensity.value=state.density??.7;
  if(p){sunDirection.set(...bearingVector(p.azimuth,p.renderElevation));sunlight.billboardSunDirection.value.copy(sunDirection);
   sunlight.billboardSunColor.value.set(p.sun).multiplyScalar(Math.min(1.2,p.sunIntensity/3.6)*.90);
   sunlight.billboardSkyColor.value.set(p.skyLight).multiplyScalar(p.weather==='clear'?.34:.68);
   const next=sunDirection.toArray().join(',')+p.castsSunShadow;if(next!==sunKey){sunKey=next;sunCache.clear();}
  }
 }
 const maxTop=Math.max(1,...blockers.map(o=>o.top));
 function sunExposure(root,height,radius=0){const p=root.toArray?root.toArray():root,profile=state.sunProfile;
  if(!profile||profile.sunIntensity<.001||sunDirection.y<=0)return [0,0,0];
  if(!profile.castsSunShadow||state.shadows===false)return [1,1,1];
  return [.10,.48,.86].map(h=>{let exposed=0;for(const spread of [-.5,0,.5]){
   const point=[p[0]+sunDirection.z*radius*spread,p[1]+height*h,p[2]-sunDirection.x*radius*spread],key=point.map(v=>v.toFixed(3)).join(',');let hidden=sunCache.get(key);
   if(hidden===undefined){const length=Math.max(2,(maxTop-point[1]+2)/Math.max(.01,sunDirection.y)),end=point.map((v,i)=>v+sunDirection.getComponent(i)*length);hidden=blocked(point,end,.025/length);sunCache.set(key,hidden);stats.sunTests++;if(hidden)stats.sunBlocked++;}else stats.sunCacheHits++;
   if(!hidden)exposed++;
  }return exposed/3;});
 }
 function sample(point){stats.samples++;if(!state.painted)return new T.Color(1,1,1);const color=new T.Color(state.tint);if(!state.local||!state.night)return color;
  for(const s of sourceGrid.get(key(point[0],point[2]))||[]){if(state.sourceIds){const allowed=state.sourceIds[s.kind==='lamp'?'lamps':s.kind==='shop'?'shops':'windows'];if(allowed&&!allowed.includes(s.id))continue;}if(s.kind==='lamp'?!state.lamps:s.kind==='shop'?!s.amount:!windowIsLit((s.band+state.pattern)%16,state.chance))continue;const dx=point[0]-s.position[0],dy=point[1]-s.position[1],dz=point[2]-s.position[2],d=Math.hypot(dx,dy,dz);if(d>=s.range||d<.05)continue;const cosine=(dx*s.direction[0]+dy*s.direction[1]+dz*s.direction[2])/d,cone=smooth(Math.cos(s.angle),Math.cos(s.angle*(1-s.penumbra)),cosine);if(cone<.003)continue;
   const attenuation=(1-(d/s.range)**4)**2,amount=(s.kind==='shop'?s.amount:1)*state.night*cone*attenuation*s.intensity/(d*d+1)*.42;if(amount<.003)continue;
   const k=s.id+':'+point.map(v=>v.toFixed(3)).join(',');let hidden=cache.get(k);if(hidden===undefined){stats.occlusionTests++;hidden=blocked(s.position,point);cache.set(k,hidden);if(hidden)stats.blockedPaths++;}else stats.cacheHits++;if(hidden)continue;
   const warm=s.kind==='lamp'||(s.band+state.pattern)%5!==0,light=new T.Color(s.color||(warm?'#ffd5a0':'#cce4ed'));color.add(light.multiplyScalar(Math.min(1.5,amount)));
  }
  // Preserve the painted palette even directly under a bright fixture.
  color.r=Math.min(1.25,color.r);color.g=Math.min(1.18,color.g);color.b=Math.min(1.10,color.b);return color;
 }
 function sampleFigure(root,height){const p=root.toArray?root.toArray():root;return [.10,.48,.86].map(h=>sample([p[0],p[1]+height*h,p[2]]));}
 function previewFigure(root,height,sourceIds){const saved=state;try{state={...state,sourceIds};return sampleFigure(root,height);}finally{state=saved;}}
 return{set,sample,sampleFigure,previewFigure,sunExposure,sunlight,blocked,stats,sources,blockers,cache};
}

export function createBillboardSunUniforms(){return{billboardDayStrength:{value:0},billboardShadeDensity:{value:.7},billboardSunDirection:{value:new T.Vector3(0,1,0)},billboardSunColor:{value:new T.Color(1,1,1)},billboardSkyColor:{value:new T.Color(.25,.30,.36)}};}
export function writeBillboardSun(geometry,index,root,height,exposure,instanced=false){const p=root.toArray?root.toArray():root;for(const [name,values] of [['billboardCentre',[p[0],p[1]+height*.5,p[2]]],['billboardSunExposure',exposure]]){const a=geometry.getAttribute(name);if(instanced)a.setXYZ(index,...values);else for(let i=0;i<a.count;i++)a.setXYZ(i,...values);a.needsUpdate=true;}}

// Separate per-instance/per-figure attributes prevent people sharing an atlas
// from borrowing one another's brightness. The source pixel height, not card
// world position, controls the soft vertical blend.
export function addBillboardLightAttributes(geometry,count=1,instanced=false){const Attr=instanced?T.InstancedBufferAttribute:T.BufferAttribute,n=instanced?count:geometry.attributes.position.count;for(const name of ['billboardLow','billboardMid','billboardHigh','billboardCentre','billboardSunExposure'])geometry.setAttribute(name,new Attr(new Float32Array(n*3).fill(1),3));geometry.setAttribute('billboardCrop',new Attr(new Float32Array(n*2),2));}
export function writeBillboardLight(geometry,index,colors,instanced=false){for(let k=0;k<3;k++){const a=geometry.getAttribute(['billboardLow','billboardMid','billboardHigh'][k]);if(instanced)a.setXYZ(index,...colors[k].toArray());else for(let i=0;i<a.count;i++)a.setXYZ(i,...colors[k].toArray());a.needsUpdate=true;}}
export function writeBillboardCrop(geometry,index,offset,scale,instanced=false){const a=geometry.getAttribute('billboardCrop');if(instanced)a.setXY(index,offset,scale);else for(let i=0;i<a.count;i++)a.setXY(i,offset,scale);a.needsUpdate=true;}
export function injectBillboardLight(shader,sunlight=createBillboardSunUniforms()){
 Object.assign(shader.uniforms,sunlight);
 shader.vertexShader='attribute vec3 billboardCentre;\nattribute vec3 billboardSunExposure;\nvarying vec3 vBillboardSunExposure;\nvarying vec3 vBillboardView;\nattribute vec3 billboardLow;\nattribute vec3 billboardMid;\nattribute vec3 billboardHigh;\nattribute vec2 billboardCrop;\nvarying vec3 vBillboardLow;\nvarying vec3 vBillboardMid;\nvarying vec3 vBillboardHigh;\nvarying float vBillboardHeight;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vBillboardView=cameraPosition-billboardCentre;vBillboardSunExposure=billboardSunExposure;vBillboardLow=billboardLow;vBillboardMid=billboardMid;vBillboardHigh=billboardHigh;vBillboardHeight=(position.y+.5)*billboardCrop.y+billboardCrop.x;');
 shader.fragmentShader='uniform float billboardDayStrength,billboardShadeDensity;\nuniform vec3 billboardSunDirection,billboardSunColor,billboardSkyColor;\nvarying vec3 vBillboardSunExposure;\nvarying vec3 vBillboardView;\nvarying vec3 vBillboardLow;\nvarying vec3 vBillboardMid;\nvarying vec3 vBillboardHigh;\nvarying float vBillboardHeight;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float bh=clamp(vBillboardHeight,0.,1.);vec3 billboardLight=bh<.48?mix(vBillboardLow,vBillboardMid,smoothstep(.10,.48,bh)):mix(vBillboardMid,vBillboardHigh,smoothstep(.48,.86,bh));diffuseColor.rgb*=billboardLight;\n if(billboardDayStrength>0.){float exposed=bh<.48?mix(vBillboardSunExposure.x,vBillboardSunExposure.y,smoothstep(.10,.48,bh)):mix(vBillboardSunExposure.y,vBillboardSunExposure.z,smoothstep(.48,.86,bh));float facing=pow(clamp(.5+.5*dot(normalize(vBillboardView),billboardSunDirection),0.,1.),1.3);vec3 daylight=billboardSkyColor+billboardSunColor*exposed*facing;diffuseColor.rgb*=mix(vec3(1.),daylight,billboardDayStrength*billboardShadeDensity);}');
}
