import {generateInBrowser} from './client.js?v=refactor-followup1';
import {configureRoads} from './road-setup.js?v=map-preparation1';
export async function createNeighborhood(point){
 point=await configureRoads(point);
 const dialog=document.createElement('dialog');dialog.className='generation-progress';
 dialog.innerHTML='<h2>동네를 만들고 있습니다</h2><p class="generation-step" role="status"></p><progress max="100" value="0"></progress><p>이 기기에서 계산하고 저장합니다. 처음에는 필요한 파일을 받는 시간이 걸립니다. 완료될 때까지 이 탭을 열어 두세요.</p><button type="button">만들기 취소</button>';
 document.body.append(dialog);dialog.showModal();const controller=new AbortController();let saving=false;
 const cancel=()=>{if(!saving)controller.abort();};dialog.querySelector('button').onclick=cancel;dialog.oncancel=event=>{event.preventDefault();cancel();};
 const unload=event=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',unload);
 try{return await generateInBrowser(point,(text,percent,phase)=>{saving=!!phase?.saving;dialog.querySelector('button').disabled=saving;dialog.querySelector('.generation-step').textContent=text;dialog.querySelector('progress').value=percent;},{signal:controller.signal});}
 catch(error){if(error.generationDetail){document.body.dataset.generationError=JSON.stringify(error.generationDetail);console.error('동네 생성 실패',error.generationDetail);}throw error;}
 finally{window.removeEventListener('beforeunload',unload);dialog.close();dialog.remove();}
}
