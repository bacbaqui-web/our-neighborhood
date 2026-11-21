// Public map responses only. Cache failure must never prevent generation.
export function createMapCache({fetcher=fetch,storage=globalThis.caches}={}){
 const memory=new Map(),pending=new Map();let cache;
 const stats={hits:0,downloads:0};
 const ready=Promise.resolve().then(()=>storage?.open('neighborhood-map-v1')).then(c=>cache=c).catch(()=>{});
 const valid=url=>['https://portal.esrikr.com/','https://tiles.openfreemap.org/','https://s3.amazonaws.com/elevation-tiles-prod/'].some(p=>url.startsWith(p));
 async function get(url){
  if(!valid(url))throw Error('허용되지 않은 지도 자료 주소입니다.');
  if(memory.has(url)){stats.hits++;return memory.get(url);}
  await ready;
  const saved=await cache?.match(url).catch(()=>null);
  if(saved&&Date.now()-Number(saved.headers.get('x-saved-at'))<7*86400000){const b=new Uint8Array(await saved.arrayBuffer());memory.set(url,b);stats.hits++;return b;}
  const response=await fetcher(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('지도 자료를 받지 못했습니다.');
  const b=new Uint8Array(await response.arrayBuffer());remember(url,b);stats.downloads++;return b;
 }
 function remember(url,bytes){if(!valid(url))return;memory.set(url,bytes);pending.set(url,bytes);}
 async function prefetch(urls,concurrency=6){let next=0;await Promise.all(Array.from({length:Math.min(concurrency,urls.length)},async()=>{while(next<urls.length){const url=urls[next++];try{await get(url);}catch{/* Normal acquisition retries failed prefetches. */}}}));}
 async function flush(){await ready;if(!cache)return;for(const [url,b] of pending){try{await cache.put(url,new Response(b,{headers:{'x-saved-at':String(Date.now())}}));}catch{break;}}pending.clear();}
 return {memory,remember,prefetch,flush,stats};
}
