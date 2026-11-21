import * as T from 'three';

// A cable is a sampled centreline, expanded in screen space. No tube faces or
// duplicate post-process contours: one draw call shades its core and border.
export function createOutlinedWires(paths){
 const positions=[],ends=[],corners=[],radii=[];
 for(const {points,radius=.012} of paths){
  if(!Array.isArray(points)||points.length<2||points.some(p=>p.length!==3||p.some(v=>!Number.isFinite(v))))throw Error('전선 좌표를 확인해 주세요.');
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];if(a.every((v,j)=>v===b[j]))continue;
   for(const [t,side] of [[0,-1],[1,-1],[1,1],[0,-1],[1,1],[0,1]]){positions.push(...a);ends.push(...b);corners.push(t,side);radii.push(radius);}
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('end',new T.Float32BufferAttribute(ends,3));geometry.setAttribute('corner',new T.Float32BufferAttribute(corners,2));geometry.setAttribute('radius',new T.Float32BufferAttribute(radii,1));
 const uniforms={viewport:{value:new T.Vector2(1,1)},pixelRatio:{value:1},border:{value:.65},nearPlane:{value:.1},coreColor:{value:new T.Color('#59615e')},edgeColor:{value:new T.Color('#202724')}};
 const material=new T.ShaderMaterial({uniforms,transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,
 vertexShader:`attribute vec3 end;attribute vec2 corner;attribute float radius;
 uniform vec2 viewport;uniform float pixelRatio,border,nearPlane;
 varying float across;varying float coreHalf;varying float alive;
 void main(){
  vec4 a=modelViewMatrix*vec4(position,1.),b=modelViewMatrix*vec4(end,1.);
  float nearZ=-nearPlane*1.01;alive=(a.z>=nearZ&&b.z>=nearZ)?0.:1.;
  if(a.z>nearZ&&b.z<nearZ)a=mix(a,b,(nearZ-a.z)/(b.z-a.z));
  if(b.z>nearZ&&a.z<nearZ)b=mix(b,a,(nearZ-b.z)/(a.z-b.z));
  vec4 pa=projectionMatrix*a,pb=projectionMatrix*b;
  vec2 direction=(pb.xy/max(.00001,pb.w)-pa.xy/max(.00001,pa.w))*viewport;
  vec2 normal=vec2(-direction.y,direction.x)/max(.0001,length(direction));
  vec4 clip=mix(pa,pb,corner.x);
  coreHalf=clamp(radius*projectionMatrix[1][1]*viewport.y*.5/max(nearPlane,clip.w),.45*pixelRatio,3.*pixelRatio);
  float outer=coreHalf+border*pixelRatio+pixelRatio;
  clip.xy+=normal*corner.y*outer*2./viewport*clip.w;
  gl_Position=clip;across=corner.y*outer;
 }`,
 fragmentShader:`uniform vec3 coreColor,edgeColor;uniform float border,pixelRatio;varying float across,coreHalf,alive;
 void main(){if(alive<.5)discard;float dist=abs(across),aa=max(fwidth(across),.65*pixelRatio);float edge=coreHalf+border*pixelRatio;
 float alpha=1.-smoothstep(edge-aa*.5,edge+aa*.5,dist);if(alpha<.01)discard;
 vec3 color=mix(coreColor,edgeColor,smoothstep(coreHalf-aa*.5,coreHalf+aa*.5,dist)*step(.01,border));
 gl_FragColor=vec4(color,alpha);
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(geometry,material);mesh.name='utility-outlined-centrelines';mesh.frustumCulled=false;mesh.renderOrder=3;
 mesh.userData={detailKind:'wire',environmentOwned:true,noInk:true,noPlacementCollision:true,centrelineCount:paths.length,segments:positions.length/18,styledWire:true};
 mesh.userData.setWireLighting=night=>{uniforms.coreColor.value.set('#59615e').lerp(new T.Color('#1e2429'),Math.max(0,Math.min(1,night)));uniforms.edgeColor.value.set('#202724').lerp(new T.Color('#10161c'),Math.max(0,Math.min(1,night)));};
 mesh.userData.setWireStyle=settings=>{uniforms.border.value=settings.lines?Math.min(1.1,Math.max(0,settings.outerWidth)*.35):0;};
 mesh.onBeforeRender=renderer=>{const target=renderer.getRenderTarget();if(target)uniforms.viewport.value.set(target.width,target.height);else renderer.getDrawingBufferSize(uniforms.viewport.value);uniforms.pixelRatio.value=renderer.getPixelRatio();};
 const before=mesh.onBeforeRender;mesh.onBeforeRender=(renderer,scene,camera)=>{before(renderer);uniforms.nearPlane.value=camera.near;};
 return mesh;
}
export function saggingCable(a,b,sag,segments=24){return Array.from({length:segments+1},(_,i)=>{const t=i/segments;return a.map((v,j)=>v*(1-t)+b[j]*t-(j===1?Math.sin(Math.PI*t)*sag:0));});}
