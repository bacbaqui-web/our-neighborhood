// Runs in an opaque-origin sandbox: provider JSONP cannot access app DOM/storage.
addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='vworld-query')return;
 const {token,params}=event.data;
 const send=result=>parent.postMessage({type:'vworld-result',token,...result},event.origin);
 const url=new URL('https://api.vworld.kr/req/data');
 for(const key of ['key','domain','geomFilter','page'])url.searchParams.set(key,params[key]);
 for(const [key,value] of Object.entries({service:'data',version:'2.0',request:'GetFeature',data:'LT_C_SPBD',crs:'EPSG:4326',format:'json',size:1000,callback:'vworldCallback'}))url.searchParams.set(key,value);
 window.vworldCallback=payload=>send({payload});
 const script=document.createElement('script');script.src=url.href;script.referrerPolicy='origin';
 // Dynamic JSONP has no stable integrity digest and does not support CORS.
 script.onerror=()=>send({error:'브이월드 연결에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'});
 document.head.append(script);
},{once:true});
