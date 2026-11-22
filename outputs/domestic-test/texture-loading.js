// Keep the original cause for diagnostics, but never display URL credentials/query data.
export async function loadTexture(loader,url){
 let cause;
 for(let attempt=0;attempt<2;attempt++){
  try{return await loader.loadAsync(url);}catch(error){cause=error;}
 }
 let filename='이미지';
 try{filename=new URL(url,'https://local.invalid/').pathname.split('/').pop()||filename;}catch{}
 throw new Error(`${filename} 이미지를 불러오지 못했습니다. 연결을 확인한 뒤 다시 불러오세요.`,{cause});
}
export async function settleTextureBatch(tasks,release){
 const results=await Promise.allSettled(tasks),failed=results.find(r=>r.status==='rejected');
 if(failed){for(const result of results)if(result.status==='fulfilled')release(result.value);throw failed.reason;}
 return results.map(r=>r.value);
}
export function loadingErrorMessage(error){
 return typeof error?.message==='string'&&error.message.trim()?error.message:'화면 자료를 불러오지 못했습니다. 연결을 확인한 뒤 다시 불러오세요.';
}
