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
  group(){if(this.selected.size<2)throw Error('묶을 도로 구간을 두 개 이상 선택해 주세요.');if(this.grade===null)throw Error('선택한 구간의 등급을 하나로 맞춘 뒤 묶어 주세요.');this.ungroup();this.groups.push([...this.selected].sort());},
  ungroup(){this.groups=this.groups.filter(g=>!g.some(id=>this.selected.has(id)));},
  reset(){for(const id of this.selected)delete this.grades[id];this.ungroup();},
  snapshot(){return structuredClone({roads:this.grades,roadGroups:this.groups});}
 };return model;
}
export const roadSelectionControls=`<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-multi> 여러 구간 선택</label><p>Shift를 누른 채 길을 클릭하면 선택을 추가하거나 해제합니다.</p><button type="button" data-group>선택한 구간 묶기</button><button type="button" data-ungroup>묶음 해제</button><p data-selection-status role="status"></p>`;
export function bindRoadSelectionControls(root,getModel,redraw){
 root.querySelector('[data-group]').onclick=()=>{try{getModel().group();redraw();}catch(e){root.querySelector('[data-selection-status]').textContent=e.message;}};
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
