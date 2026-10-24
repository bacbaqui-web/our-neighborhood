import * as T from 'three';
import {sourceImageLayout,chooseCarFrame,wrapDegrees} from './car-billboard-math.js?v=84';
import {WHEEL_POINTS,fitSimilarity,applySimilarity,makeFourWheelGrid,safeFourWheelWarp} from './car-registration.js?v=86';

export async function loadCarBillboardAssets(base='./cars/avante-cn7-v87/'){
  const response=await fetch(base+'catalog.json?v=87');
  if(!response.ok)throw Error('차량 이미지 목록을 불러올 수 없습니다.');
  const catalog=await response.json(),loader=new T.TextureLoader();
  const entries=await Promise.all(catalog.sheets.map(async s=>{
    const texture=await loader.loadAsync(base+s.image);texture.colorSpace=T.SRGBColorSpace;
    texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
    return [s.id,texture];
  }));
  return {catalog,textures:new Map(entries),base,dispose(){for(const [,t] of entries)t.dispose();}};
}

export function createCarBillboard(assets,{x=0,y=0,z=0,heading=0}={}){
  const group=new T.Group();group.position.set(x,y,z);group.rotation.y=heading*Math.PI/180;group.name='아반떼 네 바퀴 접지 메쉬';
  const layout=sourceImageLayout(assets.catalog);
  // Master wheel rig: all four supports retain identity and local 3D position.
  // Occluded wheel pixels do not exist in a photograph. Their support must stay
  // behind the body, not become a deformation handle on the foreground bumper.
  const supportGeometry=new T.BufferGeometry();supportGeometry.setAttribute('position',new T.Float32BufferAttribute(Object.values(WHEEL_POINTS).flat(),3));
  const wheelRig=new T.Points(supportGeometry,new T.PointsMaterial({size:.08,color:0x00be90}));wheelRig.visible=false;wheelRig.name='four-wheel-support-rig';group.add(wheelRig);
  const uniforms={imageMap:{value:null},crop:{value:new T.Vector4()},framePixels:{value:new T.Vector2()},mirror:{value:0},lightTint:{value:new T.Color(0xffffff)},registration:{value:new T.Vector4()},aspect:{value:1},invProjection:{value:new T.Matrix4()},cameraToCar:{value:new T.Matrix4()},carToClip:{value:new T.Matrix4()},debugAnchors:{value:0},landmark0:{value:new T.Vector2()},landmark1:{value:new T.Vector2()},landmark2:{value:new T.Vector2()},landmark3:{value:new T.Vector2()},observedWheels:{value:new T.Vector4()},wheelCenters:{value:Object.values(WHEEL_POINTS).map(p=>new T.Vector3(p[0],p[1]+.31,p[2]))}};
  const material=new T.ShaderMaterial({uniforms,depthWrite:true,side:T.DoubleSide,
    vertexShader:`varying vec2 vUv;varying vec2 vScreen;uniform vec2 framePixels;uniform vec4 registration;uniform float aspect;
    void main(){vUv=uv;vScreen=position.xy;gl_Position=vec4(vScreen,0.,1.);}`,
    fragmentShader:`uniform sampler2D imageMap;uniform vec4 crop;uniform float mirror;uniform vec3 lightTint;uniform mat4 invProjection;uniform mat4 cameraToCar;uniform mat4 carToClip;uniform float debugAnchors;uniform vec2 landmark0;uniform vec2 landmark1;uniform vec2 landmark2;uniform vec2 landmark3;uniform vec4 observedWheels;uniform vec3 wheelCenters[4];uniform vec2 framePixels;varying vec2 vUv;varying vec2 vScreen;
    float boxHit(vec3 ro,vec3 rd,vec3 lo,vec3 hi){vec3 inv=1./(rd+vec3(1.e-8));vec3 a=(lo-ro)*inv,b=(hi-ro)*inv;vec3 mn=min(a,b),mx=max(a,b);float nearT=max(mn.x,max(mn.y,mn.z)),farT=min(mx.x,min(mx.y,mx.z));return farT>=max(nearT,0.)?max(nearT,0.):1.e6;}
    float tireHit(vec3 ro,vec3 rd,vec3 center){vec3 radii=vec3(.13,.31,.31),o=(ro-center)/radii,d=rd/radii;float a=dot(d,d),b=dot(o,d),c=dot(o,o)-1.,h=b*b-a*c;if(h<0.)return 1.e6;float t=(-b-sqrt(h))/a;return t>0.?t:1.e6;}
    void main(){
      vec2 uv=vUv;uv.x=mix(uv.x,1.-uv.x,mirror);vec4 c=texture2D(imageMap,crop.xy+uv*crop.zw);if(any(lessThan(vUv,vec2(0.)))||any(greaterThan(vUv,vec2(1.)))||c.a<.94)discard;
      // Ray-cast a lightweight, fixed proxy for depth only. Artwork supplies colour.
      vec4 eye=invProjection*vec4(vScreen,1.,1.);vec3 ro=(cameraToCar*vec4(0.,0.,0.,1.)).xyz;vec3 rd=normalize((cameraToCar*vec4(eye.xyz/eye.w,0.)).xyz);
      float t=boxHit(ro,rd,vec3(-.88,.24,-2.28),vec3(.88,.85,2.28));
      t=min(t,boxHit(ro,rd,vec3(-.67,.78,-1.35),vec3(.67,1.42,.43)));
      for(int i=0;i<4;i++)t=min(t,tireHit(ro,rd,wheelCenters[i]));
      // Source silhouettes need not coincide exactly with this approximate proxy.
      // Keep unsupported pixels at the object's centre depth and above its ground,
      // instead of pushing the whole picture in front of every scene object.
      if(t>1.e5)t=max(.01,dot(vec3(0.,.71,0.)-ro,rd));
      if(rd.y<-.00001){float ground=(.014-ro.y)/rd.y;if(ground>0.)t=min(t,max(.001,ground-.002));}
      vec4 clip=carToClip*vec4(ro+rd*t,1.);gl_FragDepth=clamp(clip.z/clip.w*.5+.5,0.,1.);
      vec3 color=c.rgb*lightTint;
      if(debugAnchors>.5){vec4 d=vec4(length((vUv-landmark0)*framePixels),length((vUv-landmark1)*framePixels),length((vUv-landmark2)*framePixels),length((vUv-landmark3)*framePixels));for(int i=0;i<4;i++){if(d[i]<3.5&&observedWheels[i]>.5)color=vec3(1.,.23,.08);}}
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const mesh=new T.Mesh(new T.PlaneGeometry(1,1),material);mesh.frustumCulled=false;mesh.userData.isCarBillboard=true;mesh.userData.outlineOnly=true;group.add(mesh);
  const grids=new Map();
  let current=null,selectionStep=15,forcedFrame=null,dirty=true;const lastCamera=new T.Matrix4(),lastProjection=new T.Matrix4(),lastObject=new T.Matrix4();const relative=new T.Vector3(),root=new T.Vector3(),point=new T.Vector3(),inverse=new T.Matrix4();
  function fitFrame(frame,camera){
    const w=frame.pixels[2]-frame.pixels[0],h=frame.pixels[3]-frame.pixels[1],source=[],target=[];
    for(const landmark of frame.wheelLandmarks){source.push([landmark.uv[0]*w,landmark.uv[1]*h]);point.fromBufferAttribute(supportGeometry.attributes.position,Object.keys(WHEEL_POINTS).indexOf(landmark.wheel)).applyMatrix4(group.matrixWorld).project(camera);target.push([point.x*camera.aspect,point.y]);}
    return {...fitSimilarity(source,target),source,target};
  }
  return {group,mesh,wheelRig,layout,setFrame(index=null){forcedFrame=index;current=null;dirty=true;},get frame(){return current;},get step(){return selectionStep;},setStep(value){selectionStep=value===45?45:15;forcedFrame=null;current=null;dirty=true;},
    setDebug(value){uniforms.debugAnchors.value=value?1:0;},
    setLight(color,intensity=1){uniforms.lightTint.value.set(color).multiplyScalar(intensity);},
    update(camera){
      camera.updateMatrixWorld();group.updateWorldMatrix(true,false);
      if(!dirty&&lastCamera.equals(camera.matrixWorld)&&lastProjection.equals(camera.projectionMatrix)&&lastObject.equals(group.matrixWorld))return mesh.userData.view;
      lastCamera.copy(camera.matrixWorld);lastProjection.copy(camera.projectionMatrix);lastObject.copy(group.matrixWorld);dirty=false;
      point.set(0,.71,0).applyMatrix4(group.matrixWorld).applyMatrix4(camera.matrixWorldInverse);mesh.visible=point.z<-.05;
      group.getWorldPosition(root);relative.copy(camera.position).sub(root);
      const worldAngle=wrapDegrees(Math.atan2(relative.x,relative.z)*180/Math.PI),angle=wrapDegrees(worldAngle-heading);
      // The guide camera orbits the body centre, not the ground contact.
      const elevation=Math.max(0,Math.min(70,Math.atan2(relative.y-.71,Math.hypot(relative.x,relative.z))*180/Math.PI));
      // Select among nearby source poses by actual landmark alignment, not just
      // their requested generation angle. Large fitted roll indicates a bad pose.
      let next=chooseCarFrame(angle,elevation,selectionStep,current),bestFit=null,chosenDeformation=null;
      if(forcedFrame!==null){const f=assets.catalog.frames[forcedFrame];next={angle:f.angle,elevation:f.elevation,index:forcedFrame};bestFit=fitFrame(f,camera);}
      else if(assets.catalog.calibration==='fixed-four-wheel-guide'){
        // These new images share the same capture rig. Preserve their intended
        // direction instead of compensating for old, independently invented poses.
        bestFit=fitFrame(assets.catalog.frames[next.index],camera);
      }else{
        const expected=[Infinity,Infinity,-Infinity,-Infinity];
        for(const xx of [-.9125,.9125])for(const yy of [0,1.42])for(const zz of [-2.355,2.355]){point.set(xx,yy,zz).applyMatrix4(group.matrixWorld).project(camera);const px=point.x*camera.aspect;expected[0]=Math.min(expected[0],px);expected[1]=Math.min(expected[1],point.y);expected[2]=Math.max(expected[2],px);expected[3]=Math.max(expected[3],point.y);}
        const candidates=[];
        assets.catalog.frames.forEach((f,index)=>{
          const da=Math.abs(wrapDegrees(angle-f.angle+180)-180),dp=Math.abs(elevation-f.elevation);
          if(f.angle%selectionStep!==0||da>selectionStep+10||dp>32)return;
          const fit=fitFrame(f,camera),w=f.pixels[2]-f.pixels[0],h=f.pixels[3]-f.pixels[1];
          const corners=[[0,0],[w,0],[0,h],[w,h]].map(p=>applySimilarity(fit.transform,p));
          const bw=Math.max(...corners.map(p=>p[0]))-Math.min(...corners.map(p=>p[0])),bh=Math.max(...corners.map(p=>p[1]))-Math.min(...corners.map(p=>p[1]));
          const shapeError=Math.log(bw/(expected[2]-expected[0]))**2+Math.log(bh/(expected[3]-expected[1]))**2;
          const roll=fit.rotation*180/Math.PI;
          const span=Math.max(bw,bh),strain=fit.rms/Math.max(span,.001);
          const score=(da/20)**2+(dp/30)**2+(roll/12)**2+shapeError*3+strain*strain*500-(current?.index===index ? .10 : 0);
          candidates.push({score,index,f,fit});
        });
        candidates.sort((a,b)=>a.score-b.score);
        // A source pose whose correction folds the texture is unsuitable. Try
        // the next nearby pose rather than drawing an inverted wheel/body patch.
        let selected=candidates[0];
        for(const candidate of candidates){
          const {index,f,fit}=candidate,w=f.pixels[2]-f.pixels[0],h=f.pixels[3]-f.pixels[1];
          if(!grids.has(index))grids.set(index,makeFourWheelGrid(w,h,f.wheelLandmarks,f.surfaceRegistration==='high-angle-footprint'));
          const deformation=safeFourWheelWarp(grids.get(index),fit);candidate.deformation=deformation;
          if(!deformation.folded){selected=candidate;break;}
        }
        if(selected){next={angle:selected.f.angle,elevation:selected.f.elevation,index:selected.index};bestFit=selected.fit;chosenDeformation=selected.deformation;}
      }
      if(!current||next.index!==current.index){const frame=assets.catalog.frames[next.index];uniforms.imageMap.value=assets.textures.get(frame.sheet);uniforms.crop.value.fromArray(frame.rect);uniforms.framePixels.value.set(frame.pixels[2]-frame.pixels[0],frame.pixels[3]-frame.pixels[1]);uniforms.mirror.value=frame.mirror?1:0;frame.wheelLandmarks.forEach((p,i)=>uniforms['landmark'+i].value.fromArray(p.uv));uniforms.observedWheels.value.fromArray(frame.wheelLandmarks.map(p=>p.observed?1:0));
        if(!grids.has(next.index))grids.set(next.index,makeFourWheelGrid(uniforms.framePixels.value.x,uniforms.framePixels.value.y,frame.wheelLandmarks,frame.surfaceRegistration==='high-angle-footprint'));
        const grid=grids.get(next.index),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(grid.vertices.length*3),3));geometry.setAttribute('uv',new T.Float32BufferAttribute(grid.uv,2));geometry.setIndex(grid.indices);mesh.geometry.dispose();mesh.geometry=geometry;current={...next,source:frame};}
      const frame=current.source,fit=bestFit??fitFrame(frame,camera),{source,target}=fit;uniforms.registration.value.fromArray(fit.transform);uniforms.aspect.value=camera.aspect;
      const grid=grids.get(current.index),deformation=chosenDeformation??safeFourWheelWarp(grid,fit),{warped,folded}=deformation,positions=mesh.geometry.attributes.position;
      warped.forEach((p,i)=>positions.setXYZ(i,p[0]/camera.aspect,p[1],0));positions.needsUpdate=true;
      const sourceAnchors=grid.anchorIndices.map(i=>[positions.getX(i)*camera.aspect,positions.getY(i)]);
      const visibleWheelIndices=grid.visibleIndices;
      const anchorRms=Math.sqrt(visibleWheelIndices.reduce((s,i)=>s+(sourceAnchors[i][0]-target[i][0])**2+(sourceAnchors[i][1]-target[i][1])**2,0)/Math.max(1,visibleWheelIndices.length));
      uniforms.invProjection.value.copy(camera.projectionMatrixInverse);inverse.copy(group.matrixWorld).invert();uniforms.cameraToCar.value.multiplyMatrices(inverse,camera.matrixWorld);uniforms.carToClip.value.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(group.matrixWorld);
      mesh.userData.view={angle,elevation,frame:current.index,scale:fit.scale,rotation:fit.rotation,anchorRms,baseFitRms:fit.rms,sourceAnchors,targetAnchors:target,anchorVertexIndices:grid.anchorIndices,visibleWheelIndices,supportAnchors:target,foldedTriangles:folded,deformationMode:deformation.mode,estimated:frame.wheelLandmarks.some(p=>!p.observed),method:'four-wheel-rig-visible-surface-mls',requestedFrame:chooseCarFrame(angle,elevation,selectionStep).index};
      return mesh.userData.view;
    },dispose(){mesh.geometry.dispose();material.dispose();supportGeometry.dispose();wheelRig.material.dispose();}};
}
