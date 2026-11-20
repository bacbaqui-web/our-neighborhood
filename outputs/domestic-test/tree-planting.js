import {TREE_SPECIES,speciesById} from './tree-species.js?v=151';
import {TREE_PROFILES,treeProfile} from './tree-profiles.js';
import {planCanopy,seededRandom} from './canopy-growth.js?v=151';
// Heights are in metres; mature defaults are range midpoints, not measured averages.
// Yard defaults represent managed trees. Keep the reserved crown footprint.
export function treePlanting({id,species,use='street',radius=null}){
 if(!['street','yard'].includes(use))throw Error('나무 용도는 가로수 또는 마당이어야 합니다.');
 if(radius!==null&&(!Number.isFinite(radius)||radius<=0))throw Error('나무 배치 반경을 확인해 주세요.');
 const candidates=TREE_SPECIES.filter(s=>TREE_PROFILES[s.id].uses.includes(use)&&!(use==='yard'&&radius!==null&&radius<2.5&&!['maple','fringe'].includes(s.id)));
 const random=seededRandom('planting:'+id),chosen=candidates.find(s=>s.id===species)||candidates[Math.floor(random()*candidates.length)],p=treeProfile(chosen.id);
 const height=use==='yard'?p.yardHeightM:p.defaultHeightM;
 return {species:chosen.id,height,radius:radius??chosen.radius*height/chosen.height,use,heightBasis:use==='yard'?'managed-yard':'mature-range-midpoint'};
}

// Normalize the generated crown and wood together; keep the planted root fixed.
export function normalizeTreeHeight(plan,height,preserveFootprint=false){
 const top=Math.max(0,...plan.nodes.map(n=>n.p[1]-plan.root[1]),...plan.clumps.map(c=>c.center[1]+c.radius*(c.cardScale??1)-plan.root[1]));
 if(!Number.isFinite(top)||top<=0)throw Error('나무 모델의 실제 높이를 확인해 주세요.');
 const vertical=preserveFootprint?Math.min(...plan.nodes.filter(n=>n.p[1]>plan.root[1]).map(n=>height/(n.p[1]-plan.root[1])),...plan.clumps.filter(c=>c.center[1]>plan.root[1]).map(c=>(height-c.radius*(c.cardScale??1))/(c.center[1]-plan.root[1]))):height/top;
 const scale=preserveFootprint?1:vertical,point=p=>p.map((v,i)=>plan.root[i]+(v-plan.root[i])*(i===1?vertical:scale));
 return {...plan,height,radius:plan.radius*scale,nodes:plan.nodes.map(n=>({...n,p:point(n.p),...(n.rest?{rest:point(n.rest)}:{}),radius:n.radius*scale})),clumps:plan.clumps.map(c=>({...c,center:point(c.center),radius:c.radius*scale,...(c.lightingCenter?{lightingCenter:point(c.lightingCenter)}:{}),...(c.lightingRadius?{lightingRadius:c.lightingRadius*scale}:{})})),stats:{...plan.stats,actualTop:height,physicalHeightM:height}};
}
export function planSizedTree(options){return normalizeTreeHeight(planCanopy(options),options.height);}
