const workerURL=new URL('./worker.js?v=refactor-followup1',import.meta.url);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const asError=value=>value instanceof Error?value:Error(String(value));
export function throwIfGenerationAborted(signal,message='동네 계산을 취소했습니다.'){
  if(signal?.aborted)throw new DOMException(message,'AbortError');
}

function validateResult(data){
  if(!record(data.manifest)||typeof data.manifest.id!=='string'||!data.manifest.id||!record(data.files)||
    !Object.values(data.files).every(bytes=>bytes instanceof ArrayBuffer||ArrayBuffer.isView(bytes)))throw Error('동네 계산 결과의 파일 형식을 확인할 수 없습니다.');
  return {manifest:data.manifest,files:data.files};
}

/** Own one disposable Worker. Settlement detaches every callback before termination. */
export function runGenerationTask(input,onProgress=()=>{},{signal,abortMessage}={}){
  return new Promise((resolve,reject)=>{
    let worker,settled=false,lastStage,messages=Promise.resolve();
    const finish=(error,result)=>{
      if(settled)return;
      settled=true;signal?.removeEventListener('abort',abort);
      if(worker){
        worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;
        try{worker.terminate();}catch(cleanupError){error??=asError(cleanupError);}
      }
      if(error)reject(error);else resolve(result);
    };
    const abort=()=>finish(new DOMException(abortMessage||'동네 계산을 취소했습니다.','AbortError'));
    try{
      throwIfGenerationAborted(signal,abortMessage);
      if(!record(input))throw Error('동네 계산 입력 형식을 확인할 수 없습니다.');
      worker=new Worker(workerURL,{type:'module'});
      worker.onerror=event=>finish(Error(event.message||'동네 계산을 시작하지 못했습니다.'));
      worker.onmessageerror=()=>finish(Error('동네 계산 결과를 전달받지 못했습니다.'));
      worker.onmessage=({data})=>{
        if(settled)return;
        messages=messages.then(async()=>{
          if(settled)return;
          if(!record(data))throw Error('동네 계산 응답 형식을 확인할 수 없습니다.');
          if(data.type==='progress'){
            if(typeof data.message!=='string'||!Number.isFinite(data.percent)||data.percent<0||data.percent>100)throw Error('동네 계산 진행 정보를 확인할 수 없습니다.');
            lastStage=data.message;await onProgress(data.message,data.percent,{saving:false});
          }else if(data.type==='error'){
            const error=Error(typeof data.message==='string'?data.message:'동네 계산에 실패했습니다.');
            error.generationDetail={stage:typeof data.stage==='string'?data.stage:lastStage,detail:typeof data.detail==='string'?data.detail:undefined};
            finish(error);
          }else if(data.type==='complete')finish(null,validateResult(data));
          else throw Error('알 수 없는 동네 계산 응답을 받았습니다.');
        }).catch(error=>finish(asError(error)));
      };
      signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted){abort();return;}
      worker.postMessage(input);
    }catch(error){finish(asError(error));}
  });
}

/** Preparation is cancellable. Once the atomic save starts it must settle honestly. */
export async function saveGenerationResult(result,{signal,onProgress=()=>{},prepare,save,message,failureMessage}){
  throwIfGenerationAborted(signal);
  let prepared;
  try{prepared=prepare(result);}catch(cause){
    const error=Error('동네 계산 결과를 읽지 못했습니다. 이전 동네는 유지됩니다.',{cause});
    error.generationDetail={stage:'result-preparation',detail:asError(cause).message};throw error;
  }
  throwIfGenerationAborted(signal);
  await onProgress(message,99,{saving:true});
  // The callback can synchronously cancel. No await separates this check from save.
  throwIfGenerationAborted(signal);
  try{await save(prepared.manifest,prepared.files);}catch(cause){
    const error=Error(failureMessage+' '+asError(cause).message,{cause});
    error.generationDetail={stage:'save',detail:asError(cause).message};throw error;
  }
  return prepared.manifest;
}
