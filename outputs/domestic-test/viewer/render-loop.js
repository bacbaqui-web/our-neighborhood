/** Frame policy and owned observers/listeners; scene behavior is supplied explicitly. */
export function createRenderLoop({renderer,camera,controls,host,eventTarget=document,ResizeObserverClass=ResizeObserver,
  isPaused,updateNavigation,updateWeather,canStream,updateStream,beforeRender,render,onState}){
  let requested=true,lastRender=0,lastStreamCheck=-Infinity,lastProjection='',disposed=false;
  const lastCamera=camera.matrixWorld.clone();
  const requestRender=()=>{if(!disposed)requested=true;};
  const resize=new ResizeObserverClass(()=>{
    if(disposed)return;
    const w=host.clientWidth,h=host.clientHeight;
    renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();requestRender();
  });
  resize.observe(host);
  controls.addEventListener('change',requestRender);
  const events=['click','input','change','visibilitychange'];
  for(const event of events)eventTarget.addEventListener(event,requestRender);
  renderer.setAnimationLoop(now=>{
    if(disposed||eventTarget.hidden||isPaused())return;
    updateNavigation(now);
    camera.updateMatrixWorld();
    const projection=camera.projectionMatrix.elements.join(',');
    if(!lastCamera.equals(camera.matrixWorld)||projection!==lastProjection){requested=true;lastCamera.copy(camera.matrixWorld);lastProjection=projection;}
    const weatherChanged=updateWeather(now);
    if(weatherChanged&&now-lastRender>=1000/24)requested=true;
    if(canStream()&&now-lastStreamCheck>80){lastStreamCheck=now;updateStream(now);}
    if(!requested){if(now-lastRender>220)onState(false);return;}
    beforeRender();render();lastRender=now;requested=false;onState(true);
  });
  return {requestRender,dispose(){
    if(disposed)return;
    disposed=true;renderer.setAnimationLoop(null);resize.disconnect();
    controls.removeEventListener('change',requestRender);
    for(const event of events)eventTarget.removeEventListener(event,requestRender);
  }};
}
