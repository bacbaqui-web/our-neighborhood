// Internal lookup budget; only ray-visible details are generated.
export const AUTO_VIEW_RADIUS=100;
let sdkPromise;
export async function loadSDK(){
 if(window.kakao?.maps?.Map)return;
 if(!sdkPromise)sdkPromise=(async()=>{
  const response=await fetch(new URL('./map-config.json',import.meta.url));
  if(!response.ok)throw Error('지도 설정을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');
  const config=await response.json();
  if(!config.javascriptKey)throw Error('카카오 지도용 JavaScript 키가 필요합니다. .local-settings.json에 kakao_javascript_key를 설정하고 카카오 개발자 사이트에 현재 주소를 허용 도메인으로 등록해 주세요.');
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   const timer=setTimeout(()=>reject(Error('카카오지도를 불러오지 못했습니다. 지도 키와 허용 도메인을 확인해 주세요.')),15000);
   script.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(config.javascriptKey)}&autoload=false&libraries=services`;
   script.onload=()=>window.kakao?.maps?.load(()=>{clearTimeout(timer);resolve();});
   script.onerror=()=>{clearTimeout(timer);reject(Error('카카오지도 연결에 실패했습니다. 인터넷 연결과 지도 키 설정을 확인해 주세요.'));};
   document.head.append(script);
  });
 })().catch(error=>{sdkPromise=null;throw error;});
 return sdkPromise;
}
export function chooseMapPoint({query,origin,radius=AUTO_VIEW_RADIUS}){
 if(location.hostname.endsWith('github.io')){location.assign('https://magamiscom.ing/neighborhood/');return Promise.resolve(null);}
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='map-picker';
  dialog.innerHTML=`<header><h2>지도에서 생성할 위치 선택</h2><button type="button" data-close aria-label="닫기">닫기</button></header><form class="map-search"><input aria-label="주소 또는 장소 검색" placeholder="주소나 장소 이름을 검색하세요"><button>검색</button></form><p class="map-message" role="status">카카오지도를 불러오는 중…</p><div class="map-picker-body"><div class="map-results"></div><div class="map-canvas"></div></div><footer><label>처음 볼 방향 <input data-heading aria-label="처음 볼 방향" title="0도 북쪽 · 90도 동쪽 · 180도 남쪽 · 270도 서쪽" type="number" min="0" max="359" step="15" value="0">°</label><button type="button" data-aim>지도에서 방향 찍기</button><span class="map-selection">지도에서 중심점을 찍어 주세요.</span><button data-confirm disabled>이 위치로 동네 만들기</button></footer>`;
  document.body.append(dialog);dialog.showModal();
  const $=s=>dialog.querySelector(s),message=$('.map-message'),confirm=$('[data-confirm]'),range={value:radius},mode={value:'view'},heading=$('[data-heading]');
  $('.map-search').onsubmit=event=>event.preventDefault();
  $('.map-search input').value=query;range.value=radius;
  let selection=null,map,marker,circle,geocoder,sequence=0,sector,person,aiming=false;
  const finish=value=>{dialog.close();dialog.remove();resolve(value);};
  $('[data-close]').onclick=()=>finish(null);dialog.oncancel=e=>{e.preventDefault();finish(null);};
  confirm.onclick=()=>selection&&finish({...selection,radius:Number(range.value),...(mode.value==='view'?{view:{heading:Number(heading.value),fov:90,eyeHeight:1.65,mode:'visible360'}}:{})});
  mode.onchange=draw;heading.onchange=draw;
  $('[data-aim]').onclick=()=>{aiming=true;message.textContent='사람이 바라볼 곳을 지도에서 찍으세요.';};
  function draw(){
   range.value=Math.max(50,Math.min(300,Math.round(Number(range.value)/50)*50||100));
   if(!selection)return;
   const [lat,lon]=selection.center,r=Number(range.value),dy=r/111132,dx=r/(111320*Math.cos(lat*Math.PI/180));
   heading.value=((Number(heading.value)||0)%360+360)%360;
   sector?.setMap(null);person?.setMap(null);
   const position=new kakao.maps.LatLng(lat,lon);
   person=new kakao.maps.CustomOverlay({map,position,content:'<span style="font-size:28px;background:white;border-radius:50%;padding:3px" aria-label="사람 위치">🚶</span>',yAnchor:1});
   if(mode.value==='view'){
    const path=[position];for(let a=-8;a<=8;a+=2){const t=(Number(heading.value)+a)*Math.PI/180;path.push(new kakao.maps.LatLng(lat+dy*Math.cos(t),lon+dx*Math.sin(t)));}
    sector=new kakao.maps.Polygon({map,path,strokeWeight:2,strokeColor:'#326bea',fillColor:'#326bea',fillOpacity:.22});
   }
   marker.setMap(mode.value==='circle'?map:null);
   circle.setMap(null);
   confirm.textContent=mode.value==='view'?'보이는 곳 만들기':'이 위치로 동네 만들기';
   circle.setPosition(new kakao.maps.LatLng(lat,lon));circle.setRadius(r);
   $('.map-selection').textContent=`${selection.address} · ${mode.value==='view'?'360도 · 처음 '+heading.value+'°':'주변 전체'}`;
  }
  range.onchange=draw;
  function select(point,label){
   const token=++sequence;
   selection={center:[point.getLat(),point.getLng()],address:label||'지도에서 선택한 지점'};
   marker.setPosition(point);marker.setMap(map);draw();confirm.disabled=false;
   geocoder.coord2Address(point.getLng(),point.getLat(),(rows,status)=>{
    if(token!==sequence||!dialog.isConnected)return;
    if(status===kakao.maps.services.Status.OK&&rows[0])selection.address=rows[0].road_address?.address_name||rows[0].address?.address_name||selection.address;
    draw();
   });
  }
  loadSDK().then(()=>{
   if(!dialog.isConnected)return;
   map=new kakao.maps.Map($('.map-canvas'),{center:new kakao.maps.LatLng(...origin),level:3});
   marker=new kakao.maps.Marker();circle=new kakao.maps.Circle({center:new kakao.maps.LatLng(...origin),radius:Number(range.value),strokeWeight:2,strokeColor:'#326bea',fillColor:'#326bea',fillOpacity:.15});
   geocoder=new kakao.maps.services.Geocoder();const places=new kakao.maps.services.Places();
   kakao.maps.event.addListener(map,'click',event=>{
    if(aiming&&selection){const [lat,lon]=selection.center;const x=(event.latLng.getLng()-lon)*Math.cos(lat*Math.PI/180),north=event.latLng.getLat()-lat;heading.value=Math.round((Math.atan2(x,north)*180/Math.PI+360)%360)%360;aiming=false;draw();message.textContent='화살표는 처음 바라볼 방향입니다. 주변 360도를 검사합니다.';}else select(event.latLng);
   });
   message.textContent='찍은 지점을 가까운 길 위로 맞춥니다. 그곳에서 둘러볼 때 보이는 대상을 360도로 만듭니다. 다른 위치로 이동해 가려졌던 곳을 보려면 다시 만들어 주세요.';
   $('.map-search').onsubmit=e=>{
    e.preventDefault();const q=$('.map-search input').value.trim();if(!q)return;
    const token=++sequence;message.textContent='검색 중…';
    Promise.all([new Promise(r=>geocoder.addressSearch(q,(rows,status)=>r(status==='OK'?rows:[]))),new Promise(r=>places.keywordSearch(q,(rows,status)=>r(status==='OK'?rows:[])))]).then(results=>{
     if(token!==sequence||!dialog.isConnected)return;
     const rows=results.flat(),list=$('.map-results');list.replaceChildren();message.textContent=rows.length?'검색 결과를 선택한 뒤 지도에서 위치를 조절하세요.':'검색 결과가 없습니다. 다른 주소나 장소 이름을 입력해 주세요.';
     for(const row of rows.slice(0,20)){const b=document.createElement('button');b.type='button';b.textContent=row.place_name?`${row.place_name} · ${row.road_address_name||row.address_name}`:row.address_name;b.onclick=()=>{const p=new kakao.maps.LatLng(Number(row.y),Number(row.x));map.setCenter(p);select(p,row.address_name);};list.append(b);}
    });
   };
   if(query)$('.map-search').requestSubmit();
  }).catch(error=>{message.textContent=error.message;$('.map-search').onsubmit=e=>e.preventDefault();});
 });
}
