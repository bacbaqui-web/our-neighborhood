// Native buttons/selects keep the layer list usable without custom tree key bindings.
export function renderRoadLayers(host,roads,model,redraw){
 const previous=host.querySelector(':focus')?.dataset.focus,scroll=host.scrollTop;
 const knownGroups=new Set([...host.querySelectorAll('details')].map(d=>d.dataset.layerGroup));
 const open=new Set([...host.querySelectorAll('details[open]')].map(d=>d.dataset.layerGroup));
 const fresh=!host.dataset.ready;host.dataset.ready='1';host.className='road-layers';host.replaceChildren();
 const style=document.createElement('style');style.textContent=`.road-layers{max-height:320px;overflow:auto;border:1px solid #b1c2bf;border-radius:8px;padding:6px;background:#fff}.road-layers .road-layer-row{display:flex;align-items:center;gap:5px;margin:3px 0}.road-layers button,.road-layers select{font:inherit;min-height:32px;padding:5px!important;border:1px solid #b1c2bf;border-radius:5px;background:white;color:#243c3a}.road-layers select{width:55px!important;flex:none}.road-layers .road-layer-name{flex:1;text-align:left;overflow-wrap:anywhere}.road-layers button[aria-pressed=true]{background:#fff0cf;border-color:#c78613}.road-layers details>section{padding-left:16px;border-left:2px solid #d5dfdc}.road-layers summary{cursor:pointer;padding:7px;font-weight:600}.road-layers button:focus-visible,.road-layers select:focus-visible,.road-layers summary:focus-visible{outline:2px solid #215c50;outline-offset:2px}`;host.append(style);
 const names=new Map(roads.map((r,i)=>[r.editId,`${i+1}. ${r.properties?.name||'도로'}`]));
 const visible=roads.filter(r=>!model.excluded.has(r.editId)),byId=new Map(visible.map(r=>[r.editId,r]));
 function row(parent,ids,name,key){
  const el=document.createElement('div');el.className='road-layer-row';
  const grades=new Set(ids.map(id=>model.gradeOf(id))),grade=document.createElement('select');grade.setAttribute('aria-label',name+' 등급');grade.dataset.focus='grade-'+key;
  if(grades.size!==1)grade.add(new Option('—',''));if(ids.every(id=>model.gradeOf(id)===0))grade.add(new Option('보행','0'));
  for(let i=1;i<=4;i++)grade.add(new Option(String(i),String(i)));grade.value=grades.size===1?String([...grades][0]):'';
  grade.onchange=()=>{if(grade.value==='')return;model.selectMany(ids);model.setGrade(Number(grade.value));redraw();};
  const button=document.createElement('button');button.type='button';button.className='road-layer-name';button.textContent=name;button.dataset.focus='select-'+key;button.setAttribute('aria-pressed',String(ids.every(id=>model.selected.has(id))));
  const road=byId.get(ids[0]);button.title=road?`원본 분류: ${road.properties?.class||'없음'} / ${road.properties?.subclass||'없음'} · ${model.grades[ids[0]]?'사용자 지정':'자료로 추정'}`:name;
  button.onclick=e=>{model.select(ids[0],e.shiftKey||e.metaKey||e.ctrlKey||!!host.closest('dialog')?.querySelector('[data-multi]')?.checked);redraw();};
  el.append(grade,button);parent.append(el);
 }
 const grouped=new Set();
 for(const [i,group] of model.groups.entries()){
  const ids=group.filter(id=>byId.has(id));if(!ids.length)continue;ids.forEach(id=>grouped.add(id));
  const details=document.createElement('details');details.dataset.layerGroup=group.join(',');details.open=fresh||!knownGroups.has(details.dataset.layerGroup)||open.has(details.dataset.layerGroup);
  const summary=document.createElement('summary');summary.textContent=`도로 묶음 ${i+1} · ${group.filter(id=>!model.excluded.has(id)).length}구간`;details.append(summary);
  const body=document.createElement('section');row(body,ids,`묶음 ${i+1} 전체 선택`,'group-'+group[0]);
  ids.forEach(id=>row(body,[id],names.get(id),id));details.append(body);host.append(details);
 }
 visible.filter(r=>!grouped.has(r.editId)).forEach((r,i)=>row(host,[r.editId],names.get(r.editId),r.editId));
 if(!visible.length){const p=document.createElement('p');p.textContent='표시할 도로가 없습니다. 삭제한 도로를 복원할 수 있습니다.';host.append(p);}
 host.scrollTop=scroll;if(previous)[...host.querySelectorAll('[data-focus]')].find(e=>e.dataset.focus===previous)?.focus({preventScroll:true});
}
