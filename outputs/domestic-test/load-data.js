// Retry an interrupted response once and report the failing asset by name.
// Validate complete bytes before handing a terrain model to Three.js.
export async function loadData(url,kind='json',fetcher=fetch){
 const filename=String(url).split('/').pop().split('?')[0];
 let cause;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetcher(url,{cache:attempt?'reload':'default',signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   if(kind==='json')return await response.json();
   const bytes=await response.arrayBuffer();
   const expected=Number(response.headers.get('content-length'));
   // Browsers decompress gzip/br automatically; Content-Length then describes
   // compressed wire bytes, not the ArrayBuffer returned above (e.g. Pages CDN).
   const encoding=response.headers.get('content-encoding');
   if(expected&&(!encoding||encoding==='identity')&&bytes.byteLength!==expected)throw Error('파일 전송이 중간에 끊겼습니다');
   if(kind==='glb'){
    if(bytes.byteLength<20)throw Error('모델 파일이 비어 있습니다');
    const header=new DataView(bytes);
    if(header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==bytes.byteLength)throw Error('모델 파일이 완전하지 않습니다');
   }
   return bytes;
  }catch(error){cause=error;}
 }
 throw new Error(`${filename} — ${cause?.message==='Failed to fetch'?'서버에서 파일을 받지 못했습니다':cause?.message||'파일을 읽을 수 없습니다'}`,{cause});
}
