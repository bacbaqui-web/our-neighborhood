// Consumer-owned rules. Bounds are rendering limits, not surveyed building dimensions.
const all=[0,1,2,3,4,5];
const rules=[];
const wallStyles=[0,1,2,3,4,5,0,1,2,0,3,3,3,4,4,4,5,5];
wallStyles.forEach((style,i)=>rules.push({id:`part:wall-${i}`,role:'wall',styles:[style],min:[.01,.01],basic:i<6,model:i}));
for(const [id,styles,min,basic] of [
 ['white-slider',all,[.85,.6],true],['brown-slider',[1],[.85,.6],true],['wide-slider',all,[1.8,.8]],['veranda',all,[2,1.2]],['guard',all,[.85,.6]],['basement',all,[.85,.35]],['frosted',all,[.55,.4]],['stair',all,[.6,1.2]],['awning',all,[.85,.6]],['bay',all,[1.5,1]],
])rules.push({id:'part:'+id,role:'window',styles,min,basic:!!basic,model:id});
for(const id of ['original-steel-door','original-glass-door'])rules.push({id:'part:'+id,role:'door',styles:all,min:[1,1.9],basic:true,model:id});
export const houseAssemblyRules=Object.freeze(rules.map(r=>Object.freeze({...r,styles:Object.freeze(r.styles),min:Object.freeze(r.min),attachment:'facade',evidence:'현재 주택 생성기의 부착면과 형상 한계에 따른 규칙입니다. 실제 건물의 실측 호환 인증은 아닙니다.'})));
export function getAssemblyRuleDescriptions(asset){
 const id=typeof asset==='string'?asset:asset?.id;
 const matches=id?houseAssemblyRules.filter(r=>r.id===id):houseAssemblyRules;
 return matches.length?matches.map(r=>({...r,status:'automatic',description:`주택 외벽 부착 · 스타일 ${r.styles.join(', ')} · 최소 ${r.min[0]} × ${r.min[1]}m. 창과 문은 확보된 벽면 안에서만 배치합니다.`})):[{id,status:'unverified',description:'이 에셋의 자동 조립 조건은 아직 확인하지 않았습니다. 참고·완성본을 임의로 부품으로 사용하지 않습니다.'}];
}
export function resolveHouseComponent(registry,request){
 const {role,requestedId,styleIndex,width,height,attachment='facade'}=request;
 const rejected=[],required={role,styleIndex,width,height,attachment,circumstances:request.circumstances||{}};
 const candidates=[requestedId,...houseAssemblyRules.filter(r=>r.role===role&&r.basic).map(r=>r.id)].filter((id,i,a)=>id&&a.indexOf(id)===i);
 for(const id of candidates){
  const r=houseAssemblyRules.find(r=>r.id===id),asset=registry.resolve(id),reasons=[];
  if(!asset)reasons.push('등록되지 않았거나 삭제·교체되어 사용할 수 없습니다.');
  if(asset&&asset.id!==id)reasons.push('교체된 에셋의 모델 연결은 아직 이 부품 규칙에서 확인하지 않았습니다.');
  if(asset?.taxonomy&&(asset.taxonomy.domain!=='house'||asset.taxonomy.role!==role))reasons.push('등록된 분류가 요청한 주택 부품과 다릅니다.');
  if(!r||r.role!==role)reasons.push('요청한 부품 역할의 조립 규칙이 없습니다.');
  if(asset?.assembly&&asset.assembly.kind!=='component')reasons.push('완성본·참고·보관 항목은 독립 부품으로 자동 조립하지 않습니다.');
  if(r){
   if(!r.styles.includes(styleIndex))reasons.push('집의 외벽 스타일과 맞지 않습니다.');
   if(attachment!==r.attachment)reasons.push('외벽 부착 위치가 아닙니다.');
   if(!Number.isFinite(width)||!Number.isFinite(height)||width<r.min[0]||height<r.min[1])reasons.push('부착 공간이 유효하지 않거나 부품 최소 크기보다 좁습니다.');
   if(r.model==='awning'&&request.circumstances?.sheltered)reasons.push('이미 지붕이 있는 위치에는 차양을 겹치지 않습니다.');
   if(r.model==='bay'&&request.circumstances?.projectionClear===false)reasons.push('돌출창 앞 공간을 확보하지 못했습니다.');
  }
  if(reasons.length){rejected.push({id,reasons});continue;}
  return {owner:request.owner,position:request.position,role,requestedId,selectedId:asset.id,model:r.model,status:id===requestedId?'exact':'fallback',required,rejected,reason:id===requestedId?'요청한 등록 부품이 조건에 맞습니다.':'요청 부품을 사용할 수 없어 같은 집 스타일의 호환 기본 부품으로 바꿨습니다.',collider:role!=='wall'};
 }
 return {owner:request.owner,position:request.position,role,requestedId,selectedId:null,model:null,status:'error',required,rejected,reason:'호환 부품이 없어 벽면에 표시 전용 오류 표식을 남겼습니다.',collider:false};
}
export function createAssemblyReport(){return {version:1,decisions:[],counts:{exact:0,fallback:0,error:0,excluded:0}};}
export function recordAssemblyDecision(report,decision){report.decisions.push(decision);report.counts[decision.status]++;return decision;}
// Surface-only quad: no physical proxy, no road obstruction, no unregistered model.
export function emitAssemblyError(out,width=.24,height=.24){const w=Math.max(.04,Math.min(.24,Number.isFinite(width)?width:.24)),h=Math.max(.04,Math.min(.24,Number.isFinite(height)?height:.24));out.quad(0,0,.012,w,h,0xd73b77,true);out.quad(0,0,.014,w*.65,h*.16,0xffffff,true);}
// Final ground-floor cutouts supersede facade choices. Keep the original failure
// evidence, but do not claim the removed attachment still exists in the scene.
export function excludeClippedAssemblyDecisions(report,plans){
 if(!report)return;
 for(const d of report.decisions){
  if(d.status==='excluded'||!Array.isArray(d.position))continue;
  const [x,y,z]=d.position;
  const cut=plans.find(p=>{
   if(String(p.id)!==String(d.owner)||y>=3+(p.base??0)||!p.detailCut)return false;
   const u=(x-p.origin[0])*p.u[0]+(z-p.origin[1])*p.u[1],v=(x-p.origin[0])*p.n[0]+(z-p.origin[1])*p.n[1];
   return u>p.detailCut[0]&&u<p.detailCut[1]&&v>p.detailCut[2]&&v<p.detailCut[3];
  });
  if(!cut)continue;
  report.counts[d.status]--;report.counts.excluded=(report.counts.excluded||0)+1;
  d.originalStatus=d.status;d.originalReason=d.reason;d.originalSelectedId=d.selectedId;
  d.status='excluded';d.selectedId=null;d.collider=false;
  d.reason='1층 출입구·필로티 공간을 확보하면서 이 부착 위치를 잘라냈습니다. 최종 배치 대상에서 제외했으며 원래 후보와 실패 이유는 기록에 남깁니다.';
 }
}
