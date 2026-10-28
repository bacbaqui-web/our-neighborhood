import {generateInBrowser} from './client.js?v=151';
export async function createNeighborhood(point){
 const dialog=document.createElement('dialog');dialog.className='generation-progress';
 dialog.innerHTML='<h2>동네를 만들고 있습니다</h2><p class="generation-step" role="status"></p><progress max="100" value="0"></progress><p>이 기기에서 계산하고 저장합니다. 처음에는 필요한 파일을 받는 시간이 걸립니다. 완료될 때까지 이 탭을 열어 두세요.</p><button type="button">만들기 취소</button>';
 document.body.append(dialog);dialog.showModal();const controller=new AbortController();
 const cancel=()=>controller.abort();dialog.querySelector('button').onclick=cancel;dialog.oncancel=event=>{event.preventDefault();cancel();};
 const unload=event=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',unload);
 try{return await generateInBrowser(point,(text,percent)=>{dialog.querySelector('.generation-step').textContent=text;dialog.querySelector('progress').value=percent;},{signal:controller.signal});}
 finally{window.removeEventListener('beforeunload',unload);dialog.close();dialog.remove();}
}
