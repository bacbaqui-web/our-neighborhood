// A single renderer processes visible rows serially across list replacements.
export function createThumbnailQueue({createModel,release,createEngine,imageThumb,paintImage,unavailableArchive,
  Observer=globalThis.IntersectionObserver,nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve)),warn=console.warn}){
  const cache=new Map();let version=0,observer,queue=[],running=false,disposed=false,engine;
  const current=v=>!disposed&&v===version;
  async function drain(){
    if(running||disposed)return;
    running=true;
    try{while(queue.length&&!disposed){
      const {row:[asset,host],v}=queue.shift();if(!current(v))continue;
      if(unavailableArchive(asset)){host.textContent='로컬 보관 원본 · 공개 파일 아님';continue;}
      try{
        let src=cache.get(asset.id);
        if(!src){
          if(asset.kind==='image')src=await imageThumb(asset);
          else{
            const model=await createModel(asset);
            if(!current(v)){release(model);continue;}
            // Ownership transfers to the engine, including failures while framing.
            if(!engine){try{engine=createEngine();}catch(error){release(model);throw error;}}engine.show(model);src=engine.photo();
          }
          if(!current(v))continue;
          cache.set(asset.id,src);if(cache.size>150)cache.delete(cache.keys().next().value);
        }
        if(current(v))paintImage(host,src,asset);
      }catch(error){if(current(v))host.textContent='미리보기 확인 필요';warn(asset.id+': '+error.message);}
      await nextFrame();
    }}finally{running=false;}
  }
  function cancel(){++version;observer?.disconnect();observer=null;queue=[];}
  return {
    cancel,
    observe(rows){
      cancel();if(disposed)return;
      const v=version,byHost=new Map(rows.map(row=>[row[1],row]));
      const ownObserver=new Observer(records=>{
        if(!current(v))return;
        for(const entry of records){
          if(!entry.isIntersecting)continue;
          const row=byHost.get(entry.target);if(!row)continue;
          ownObserver.unobserve(entry.target);byHost.delete(entry.target);queue.push({row,v});
        }
        void drain();
      },{rootMargin:'400px'});
      observer=ownObserver;for(const [,host]of rows)observer.observe(host);
    },
    dispose(){if(disposed)return;disposed=true;cancel();engine?.dispose();engine=null;cache.clear();}
  };
}
