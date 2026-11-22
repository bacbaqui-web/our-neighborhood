import {planCanopy} from '../../../canopy-growth.js?v=151';
// Normalize the generated crown and wood together; keep the planted root fixed.
export function normalizeTreeHeight(plan,height,preserveFootprint=false){
 const top=Math.max(0,...plan.nodes.map(n=>n.p[1]-plan.root[1]),...plan.clumps.map(c=>c.center[1]+c.radius*(c.cardScale??1)-plan.root[1]));
 if(!Number.isFinite(top)||top<=0)throw Error('나무 모델의 실제 높이를 확인해 주세요.');
 const vertical=preserveFootprint?Math.min(...plan.nodes.filter(n=>n.p[1]>plan.root[1]).map(n=>height/(n.p[1]-plan.root[1])),...plan.clumps.filter(c=>c.center[1]>plan.root[1]).map(c=>(height-c.radius*(c.cardScale??1))/(c.center[1]-plan.root[1]))):height/top;
 const scale=preserveFootprint?1:vertical,point=p=>p.map((v,i)=>plan.root[i]+(v-plan.root[i])*(i===1?vertical:scale));
 return {...plan,height,radius:plan.radius*scale,nodes:plan.nodes.map(n=>({...n,p:point(n.p),...(n.rest?{rest:point(n.rest)}:{}),radius:n.radius*scale})),clumps:plan.clumps.map(c=>({...c,center:point(c.center),radius:c.radius*scale,...(c.lightingCenter?{lightingCenter:point(c.lightingCenter)}:{}),...(c.lightingRadius?{lightingRadius:c.lightingRadius*scale}:{})})),stats:{...plan.stats,actualTop:height,physicalHeightM:height}};
}
export function planSizedTree(options){return normalizeTreeHeight(planCanopy(options),options.height);}
