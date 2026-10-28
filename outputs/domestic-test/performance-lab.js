// Opt-in diagnostic harness. Never changes saved appearance or production defaults.
export function installPerformanceLab({T,scene,camera,renderer,controls,appearance,render,apply,lock,unlock,stats,update,host}){
 const panel=document.createElement('section');panel.id='performanceLab';panel.innerHTML='<h3>성능 비교 실험</h3><button id="runPerformanceLab">같은 장면으로 성능 측정</button><pre id="performanceLabResult"></pre>';document.querySelector('aside').prepend(panel);
 const frame=()=>new Promise(r=>requestAnimationFrame(r)),q=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];
 panel.querySelector('button').onclick=async()=>{
  const out=panel.querySelector('pre'),saved={...appearance},size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect,auto=renderer.info.autoReset;
  const foliage=[];scene.traverse(o=>{if(o.userData.isVegetationBillboard||o.userData.part==='leaf'||/foliage|canopy.*leav/i.test(o.name))foliage.push([o,o.visible]);});
  lock();panel.querySelector('button').disabled=true;
  const initialPosition=camera.position.clone(),initialTarget=controls.target.clone();
  const report={at:new Date().toISOString(),viewport:[960,640],camera:camera.position.toArray(),target:controls.target.toArray(),method:'8 warmup + 32 samples, forced redraw, readPixels(1 pixel) + gl.finish; milliseconds include CPU submission and GPU completion; not FPS',cases:[],foliageObjects:foliage.length};
  try{
   renderer.setPixelRatio(1);renderer.setSize(960,640,false);camera.aspect=1.5;camera.updateProjectionMatrix();
   for(const test of [{name:'전체 효과'},{name:'선 끄기',lines:false},{name:'그림자 끄기',shadows:false},{name:'잎 끄기',foliage:false},{name:'AA 끄기',antialias:'off'},{name:'선·그림자·AA 끄기',lines:false,shadows:false,antialias:'off'},{name:'이동 · 전체 효과',moving:true},{name:'이동 · 선 끄기',moving:true,lines:false}]){
    camera.position.copy(initialPosition);camera.lookAt(initialTarget);camera.updateMatrixWorld();Object.assign(appearance,saved,test);for(const [o,v] of foliage)o.visible=test.foliage===false?false:v;apply();
    const samples=[];let cold;const pixel=new Uint8Array(4),gl=renderer.getContext();
    for(let i=0;i<40;i++){await frame();out.textContent=test.name+' '+i+'/40';const start=performance.now();if(test.moving){camera.position.copy(initialPosition);camera.position.x+=Math.sin(i/12)*3;camera.lookAt(initialTarget);camera.updateMatrixWorld();update();}render();gl.readPixels(480,320,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);gl.finish();const ms=performance.now()-start;if(i===0)cold=ms;if(i>=8)samples.push(ms);}
    report.cases.push({name:test.name,median:q(samples,.5),p95:q(samples,.95),cold,...stats(),samples});
   }
   camera.position.copy(initialPosition);camera.lookAt(initialTarget);camera.updateMatrixWorld();Object.assign(appearance,saved);for(const [o,v] of foliage)o.visible=v;apply();scene.updateMatrixWorld(true);
   // Common opaque geometry baseline: identical world-space triangles and colors for WebGL and Metal.
   const chunks=[];let vertices=0,objects=0;const p=new T.Vector3(),mat=new T.Matrix4(),instance=new T.Matrix4();
   scene.traverseVisible(o=>{
    if(!o.isMesh||o.isSkinnedMesh||!o.geometry?.attributes.position)return;
    if(o.userData.environmentOwned)return;
    const g=o.geometry,pos=g.attributes.position,idx=g.index,materials=Array.isArray(o.material)?o.material:[o.material],groups=g.groups.length?g.groups:[{start:0,count:idx?idx.count:pos.count,materialIndex:0}];
    for(const group of groups){const m=materials[group.materialIndex||0];if(!m||m.map||m.alphaMap||m.transparent||m.alphaTest>0||m.visible===false)continue;
     const start=Math.max(group.start,g.drawRange.start),end=Math.min(group.start+group.count,g.drawRange.start+g.drawRange.count,idx?idx.count:pos.count);if(end<=start)continue;
     for(let n=0;n<(o.isInstancedMesh?o.count:1);n++){
      mat.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(n,instance);mat.multiply(instance);}
      const arr=new Float32Array((end-start)*6);let k=0;
      for(let i=start;i<end;i++){const j=idx?idx.getX(i):i;p.fromBufferAttribute(pos,j).applyMatrix4(mat);arr[k++]=p.x;arr[k++]=p.y;arr[k++]=p.z;arr[k++]=m.color?.r??1;arr[k++]=m.color?.g??1;arr[k++]=m.color?.b??1;}
      chunks.push(arr);vertices+=end-start;objects++;
     }
    }
   });
   const packed=new Float32Array(vertices*6);let offset=0;for(const c of chunks){packed.set(c,offset);offset+=c.length;}
   const inter=new T.InterleavedBuffer(packed,6),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.InterleavedBufferAttribute(inter,3,0));geometry.setAttribute('color',new T.InterleavedBufferAttribute(inter,3,3));
   const material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false});const plain=new T.Scene();plain.background=new T.Color('#b7c7d0');plain.add(new T.Mesh(geometry,material));
   const samples=[];renderer.info.autoReset=true;const target=new T.WebGLRenderTarget(960,640,{samples:0});target.texture.colorSpace=T.SRGBColorSpace;renderer.setRenderTarget(target);const pixel=new Uint8Array(4);
   for(let i=0;i<40;i++){await frame();const start=performance.now();renderer.render(plain,camera);renderer.readRenderTargetPixels(target,480,320,1,1,pixel);renderer.getContext().finish();if(i>=8)samples.push(performance.now()-start);}
   const pixels=new Uint8Array(960*640*4);renderer.readRenderTargetPixels(target,0,0,960,640,pixels);const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;const cx=canvas.getContext('2d'),im=cx.createImageData(960,640);for(let y=0;y<640;y++)im.data.set(pixels.subarray((639-y)*960*4,(640-y)*960*4),y*960*4);cx.putImageData(im,0,0);const png=await new Promise(r=>canvas.toBlob(r));await fetch('/api/performance/preview',{method:'POST',headers:{'Content-Type':'image/png'},body:png});renderer.setRenderTarget(null);target.dispose();
   report.baseline={median:q(samples,.5),p95:q(samples,.95),vertices,triangles:vertices/3,sourceObjects:objects,drawCalls:renderer.info.render.calls,view:camera.matrixWorldInverse.toArray(),projection:camera.projectionMatrix.toArray(),note:'opaque untextured geometry only; no lighting, lines, shadows, foliage or AA. Vertex colors/instance colors and material polygon offsets are omitted. Single merged draw on both engines. NOT full-quality comparison'};
   const post=async(path,body,type)=>{const r=await fetch(path,{method:'POST',headers:{'Content-Type':type},body});if(!r.ok)throw Error('측정 파일 저장 실패');};
   await post('/api/performance/vertices',packed.buffer,'application/octet-stream');await post('/api/performance/report',JSON.stringify(report),'application/json');
   geometry.dispose();material.dispose();panel.dataset.result=JSON.stringify(report);panel.dataset.complete='true';out.textContent=report.cases.map(c=>`${c.name}: ${c.median.toFixed(1)} ms`).join('\n')+'\n단색 공통 장면: '+report.baseline.median.toFixed(1)+' ms';
  }catch(e){panel.dataset.error=e.message;out.textContent=e.stack;}finally{camera.position.copy(initialPosition);camera.lookAt(initialTarget);camera.updateMatrixWorld();for(const k of Object.keys(appearance))if(!(k in saved))delete appearance[k];Object.assign(appearance,saved);for(const [o,v] of foliage)o.visible=v;apply();renderer.info.autoReset=auto;renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();unlock();panel.querySelector('button').disabled=false;}
 };
}
