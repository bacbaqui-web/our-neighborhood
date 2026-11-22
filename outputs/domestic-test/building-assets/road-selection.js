import {automaticRoadGroups} from './road-corridors.js';
// Logical road groups retain every original geometry and stable editId.
export function validateRoadGroups(groups=[],ids){
 const seen=new Set();
 if(!Array.isArray(groups))throw Error('도로 묶음 정보를 읽지 못했습니다.');
 for(const group of groups){
  if(!Array.isArray(group)||group.length<2)throw Error('도로 묶음에는 두 구간 이상이 필요합니다.');
  for(const id of group){if(typeof id!=='string'||!id||seen.has(id)||(ids&&!ids.has(id)))throw Error('도로 묶음의 구간 정보가 맞지 않습니다.');seen.add(id);}
 }
 return structuredClone(groups);
}
export function createRoadSelection(roads,edits={}){
 const byId=new Map(roads.map(r=>[r.editId,r])),initialGrades=structuredClone(edits.roads||{});
 const model={grades:structuredClone(edits.roads||{}),groups:validateRoadGroups(edits.roadGroups,new Set(byId.keys())),selected:new Set(),
  members(id){if(!byId.has(id))throw Error('선택한 도로 구간을 찾지 못했습니다.');return this.groups.find(g=>g.includes(id))||[id];},
  select(id,additive=false){const members=this.members(id),remove=additive&&members.every(v=>this.selected.has(v));if(!additive)this.selected.clear();for(const v of members)remove?this.selected.delete(v):this.selected.add(v);},
  selectMany(ids){this.selected=new Set(ids.flatMap(id=>this.members(id)));},
  gradeOf(id){return this.grades[id]?.grade??byId.get(id)?.grade??1;},
  get grade(){const values=new Set([...this.selected].map(id=>this.gradeOf(id)));return values.size===1?[...values][0]:null;},
  get canRestorePedestrian(){return this.selected.size>0&&[...this.selected].every(id=>byId.get(id)?.grade===0);},
  setGrade(grade){if(grade===0&&this.canRestorePedestrian){for(const id of this.selected)delete this.grades[id];return;}if(!Number.isInteger(grade)||grade<1||grade>4)throw Error('도로 등급은 1~4차도로 중에서 선택해 주세요.');for(const id of this.selected){if(grade===(initialGrades[id]?.grade??byId.get(id)?.grade??1)){if(initialGrades[id])this.grades[id]=structuredClone(initialGrades[id]);else delete this.grades[id];}else if(this.gradeOf(id)!==grade)this.grades[id]={grade};}},
  group(){if(this.selected.size<2)throw Error('묶을 도로 구간을 두 개 이상 선택해 주세요.');if(this.grade===null)this.setGrade(this.gradeOf([...this.selected][0]));this.ungroup();this.groups.push([...this.selected].sort());},
  ungroup(){this.groups=this.groups.filter(g=>!g.some(id=>this.selected.has(id)));},
  reset(){for(const id of this.selected)delete this.grades[id];this.ungroup();},
  snapshot(){return structuredClone({roads:this.grades,roadGroups:this.groups,roadGroupingVersion:2});}
 };
 if(edits.roadGroupingVersion!==2){
  const reserved=new Set(model.groups.flat());
  for(const group of automaticRoadGroups(roads.filter(r=>!reserved.has(r.editId)))){
   // Preserve conflicting explicit edits; users can resolve these with manual grouping.
   const explicit=new Set(group.filter(id=>initialGrades[id]).map(id=>initialGrades[id].grade));
   if(explicit.size>1)continue;
   model.groups.push(group);
   const grade=explicit.size?[...explicit][0]:Math.max(...group.map(id=>model.gradeOf(id)));
   model.selectMany(group);model.setGrade(grade);
  }
  model.selected.clear();
 }
 return model;
}
export const roadSelectionControls=`<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-multi> 여러 구간 선택</label><p>Shift를 누른 채 길을 클릭하면 선택을 추가하거나 해제합니다. ⌘G (Windows: Ctrl+G)로 묶습니다. 등급이 다르면 먼저 선택한 도로에 맞춥니다.</p><button type="button" data-group aria-keyshortcuts="Meta+g Control+g">선택한 구간 묶기</button><button type="button" data-ungroup>묶음 해제</button><p data-selection-status role="status"></p>`;
export function bindRoadSelectionControls(root,getModel,redraw){
 root.querySelector('[data-group]').onclick=()=>{try{getModel().group();redraw();}catch(e){root.querySelector('[data-selection-status]').textContent=e.message;}};
 root.addEventListener('keydown',event=>{
  if(!(event.metaKey||event.ctrlKey)||event.altKey||event.shiftKey||event.repeat||event.isComposing||event.key.toLowerCase()!=='g')return;
  if(event.target?.closest?.('input:not([type=checkbox]),textarea,[contenteditable=true]'))return;
  const model=getModel();if(!model||model.selected.size<2)return;
  event.preventDefault();event.stopPropagation();root.querySelector('[data-group]').click();
 });
 root.querySelector('[data-ungroup]').onclick=()=>{getModel().ungroup();redraw();};
}
export function updateRoadSelectionControls(root,model){
 root.querySelector('[data-group]').disabled=model.selected.size<2;
 root.querySelector('[data-ungroup]').disabled=!model.groups.some(g=>g.some(id=>model.selected.has(id)));
 root.querySelector('[data-selection-status]').textContent=`${model.selected.size}개 구간 선택 · 저장할 도로 묶음 ${model.groups.length}개`;
 const grade=root.querySelector('[data-grade]');grade.replaceChildren();
 grade.add(new Option(model.selected.size?'등급이 다릅니다 · 함께 바꿀 등급 선택':'도로를 선택해 주세요.',''));
 for(const [i,label] of ['보행 전용길','1차도로 · 사람과 차가 함께','2차도로 · 왕복 2차선과 인도','3차도로 · 왕복 4차선','4차도로 · 왕복 6차선 이상'].entries())if(i||model.grade===0||model.canRestorePedestrian)grade.add(new Option(label,String(i)));
 grade.value=model.grade===null?'':String(model.grade);grade.disabled=!model.selected.size;
}
