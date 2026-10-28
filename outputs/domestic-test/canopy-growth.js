import {growTreeSkeleton} from './tree-skeleton.js?v=151';
import {speciesById} from './tree-species.js?v=151';
import {subdivideLeafClusters} from './leaf-cluster-layout.js?v=151';
// Production rule shared by the neighborhood and preview. Branches avoid solids;
// only leaf-card edges may approach the wall. A seed keeps each tree's bend stable.
export function seededRandom(seed){let s=2166136261;for(const c of String(seed))s=Math.imul(s^c.charCodeAt(0),16777619);return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function edgeDistance(p,ring){let d=Infinity;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],q=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(p[0]-a[0]-q*dx,p[1]-a[1]-q*dz));}return d;}
export function obstacleVolumes(buildings=[],structures=[],elevation=()=>0){return [...buildings.map(b=>({id:b.seed,points:b.points,holes:b.holePoints||[],base:b.base,top:b.top+.3})),...structures.filter(s=>s.footprint&&s.roofHeight).map(s=>({id:'attachment-'+s.id,points:s.footprint,holes:[],base:elevation(...s.footprint[0])-.2,top:Math.max(...s.footprint.map(p=>elevation(...p)))+s.roofHeight+.2}))];}
export function createTreeSpace(obstacles,margin=.15){
 const volumes=obstacles.map(o=>({...o,holes:o.holes||[],minX:Math.min(...o.points.map(p=>p[0])),maxX:Math.max(...o.points.map(p=>p[0])),minZ:Math.min(...o.points.map(p=>p[1])),maxZ:Math.max(...o.points.map(p=>p[1]))}));
 function clearSphere(c,r){r+=margin;for(const o of volumes){if(c[1]+r<o.base||c[1]-r>o.top||c[0]+r<o.minX||c[0]-r>o.maxX||c[2]+r<o.minZ||c[2]-r>o.maxZ)continue;
  const p=[c[0],c[2]],solid=inside(p,o.points)&&!o.holes.some(h=>inside(p,h));const horizontal=solid?0:Math.min(edgeDistance(p,o.points),...o.holes.map(h=>edgeDistance(p,h))),vertical=Math.max(o.base-c[1],c[1]-o.top,0);if(Math.hypot(horizontal,vertical)<=r)return false;
 }return true;}
 function clearBranch(a,b,r){const length=dist(a,b),steps=Math.max(1,Math.ceil(length/.16));for(let i=0;i<=steps;i++){const t=i/steps;if(!clearSphere(a.map((v,k)=>v+(b[k]-v)*t),r+.08))return false;}return true;}
 return{clearSphere,clearBranch};
}
export function trunkPath({id,root,height,bend=1}){
 const random=seededRandom('trunk-'+id),angle=random()*Math.PI*2,amount=(.65+random()*.4)*(height/10.5)*bend,sign=random()>.5?1:-1;
 const anchors=[[0,0,0],[.20,.13,.03],[.48,1,.12*sign],[.76,.63,.5*sign],[1,1.02,.14*sign]];
 const points=[];
 for(let i=0;i<=16;i++){const t=i/16,j=Math.min(anchors.length-2,anchors.findIndex((a,k)=>k<anchors.length-1&&t>=a[0]&&t<=anchors[k+1][0])),a=anchors[j],b=anchors[j+1],u=(t-a[0])/(b[0]-a[0]),smooth=u*u*(3-2*u),along=(a[1]+(b[1]-a[1])*smooth)*amount,side=(a[2]+(b[2]-a[2])*smooth)*amount;
  points.push([root[0]+Math.cos(angle)*along-Math.sin(angle)*side,root[1]+height*.69*t,root[2]+Math.sin(angle)*along+Math.cos(angle)*side]);
 }return points;
}
export const TREE_GROWTH_POLICY=Object.freeze({growthMode:'close',minBend:.2,maxBend:.6});
export function treeGrowthSettings(seed){
 const {growthMode,minBend,maxBend}=TREE_GROWTH_POLICY;
 const trunkBend=Math.round((minBend+(maxBend-minBend)*seededRandom('growth-policy:'+seed)())*100)/100;
 return{growthMode,trunkBend};
}
export function planCanopy({id='tree',root=[0,0,0],species=null,height=10.5,radius=4.4,seed=id,obstacles=[]}={}){
 // Always enforce the rule here, including callers with stale mode/bend options.
 const {growthMode,trunkBend}=treeGrowthSettings(seed);
 const random=seededRandom(seed),space=createTreeSpace(obstacles,.03);
 const profile=speciesById(species);
 const result=growTreeSkeleton({root,height,radius,seed,trunkBend,space,random,profile,leafSpace:(p,r)=>space.clearSphere(p,r*.22)});
 const {nodes,paths}=result,clumps=subdivideLeafClusters(result.clumps,{random:seededRandom(seed+':twigs'),space,nodes,leafScale:profile?.leafScale||1}),actualTop=Math.max(0,...nodes.map(n=>n.p[1]-root[1]),...clumps.map(c=>c.center[1]+c.radius*(c.cardScale??1)-root[1]));
 return{id,seed,root,height,radius,species:profile?.id??null,growthMode,trunkBend,nodes,paths,clumps,blocked:!paths.length||clumps.length<8,stats:{species:profile?.id??null,engine:result.engine,growthMode,trunkBend,clusters:clumps.length,twigGroups:result.clumps.length,maxLeafCardWidth:Math.max(0,...clumps.map(c=>c.radius*(c.cardScale??1)*Math.SQRT2*(profile?.leafAspect||1)*(c.aspect||1))),branches:Math.max(0,nodes.length-1),woodyAxes:paths.length,orders:result.orders,tips:result.tips,rejectedCandidates:result.rejected,actualTop,rootFixed:true}};
}

export function validateCanopy(plan,obstacles){const space=createTreeSpace(plan.growthMode==='free'?[]:obstacles,plan.growthMode==='close'?.03:.15),errors=[];for(const [i,c] of plan.clumps.entries()){if(!space.clearSphere(c.center,c.radius*(plan.growthMode==='close'?.22:1)))errors.push('clump '+i);let node=c.node,steps=0;while(node>0&&steps++<plan.nodes.length)node=plan.nodes[node].parent;if(node!==0)errors.push('disconnected '+i);}for(let i=1;i<plan.nodes.length;i++){const n=plan.nodes[i],p=plan.nodes[n.parent];if(n.active&&!space.clearBranch(p.p,n.p,Math.max(n.radius,p.trunk&&n.trunk?p.radius:n.radius)))errors.push('branch '+i);}return errors;}

// Physical overlaps are observations, not generation failures in free-growth mode.
export function canopyOverlapReport(plan,obstacles){const space=createTreeSpace(obstacles,0);return{leafClusters:plan.clumps.filter(c=>!space.clearSphere(c.center,c.radius*(c.cardScale??1))).length,branches:plan.nodes.filter((n,i)=>i&&n.active&&!space.clearBranch(plan.nodes[n.parent].p,n.p,n.radius)).length};}
