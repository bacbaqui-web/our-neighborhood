import {crookedTrunkPaths} from './trunk-crookedness.js?v=151';
import {Tree} from './vendor/ez-tree/tree.js';
import oak from './vendor/ez-tree/presets/oak_medium.js';

// EZ-Tree supplies a recursive woody skeleton. Leaves are only attachments:
// removing them or changing a season never changes this topology.
export function growTreeSkeleton({root,height,radius,seed,trunkBend,space,leafSpace,random,profile}) {
 const generator=new Tree();generator.options.copy(oak);
 generator.options.seed=hash(seed);generator.options.leaves.count=0;
 Object.assign(generator.options.branch,{children:{0:6,1:3,2:3},sections:{0:14,1:10,2:7,3:5},segments:{0:12,1:9,2:7,3:5},
  angle:{1:50,2:46,3:30},radius:{0:1.41,1:.74,2:.60,3:.48},start:{1:.42,2:.25,3:.28},
  gnarliness:{0:0,1:.065,2:.085,3:.045},taper:{0:.73,1:.57,2:.67,3:.98},force:{direction:{x:0,y:1,z:0},strength:.0025}});
 if(profile){generator.options.type=profile.type||'deciduous';Object.assign(generator.options.branch,profile.branch);}
 const raw=generator.generateSkeleton().branches,points=raw.flatMap(b=>b.sections.map(s=>s.origin)),top=Math.max(...points.map(p=>p.y)),reach=Math.max(...points.map(p=>Math.hypot(p.x,p.z))),sy=height*.94/top,sx=radius*.94/reach,sr=(.28+height*.009)*Math.min(1,height/8)/raw[0].sections[0].radius;
 const nodes=[],paths=[],byRaw=new Map();let rejected=0;
 const rest=raw.map(b=>b.sections.map(s=>[root[0]+s.origin.x*sx,root[1]+s.origin.y*sy,root[2]+s.origin.z*sx]));
 const grown=crookedTrunkPaths(rest,raw.map(b=>b.parentIndex),{seed,height,amount:trunkBend});
 for(let bi=0;bi<raw.length;bi++){
  const branch=raw[bi],parentPath=byRaw.get(branch.parentIndex);if(bi&&!parentPath)continue;
  const first=grown[bi][0];let parent=-1;
  if(parentPath){let closest=Infinity;for(let j=1;j<parentPath.nodes.length;j++){const a=nodes[parentPath.nodes[j-1]].p,b=nodes[parentPath.nodes[j]].p,delta=b.map((v,k)=>v-a[k]),l=delta.reduce((s,v)=>s+v*v,0),t=Math.max(0,Math.min(1,delta.reduce((s,v,k)=>s+(first[k]-a[k])*v,0)/(l||1))),d=Math.hypot(...first.map((v,k)=>v-a[k]-delta[k]*t));if(d<closest){closest=d;parent=parentPath.nodes[t>.999999?j:j-1];}}if(closest>.025)continue;}
  const path={nodes:[],level:branch.level,parent:parentPath?.index??-1,index:paths.length};
  for(let k=0;k<branch.sections.length;k++){
   const section=branch.sections[k],p=grown[bi][k],r=Math.max(.0002,section.radius*sr),prior=path.nodes.length?nodes[path.nodes.at(-1)]:null;
   if(!space.clearSphere(p,r)||(prior&&!space.clearBranch(prior.p,p,Math.max(prior.radius,r)))){rejected++;break;}
   const index=nodes.length;nodes.push({p,rest:rest[bi][k],parent:path.nodes.at(-1)??parent,trunk:bi===0,radius:r,active:true,level:branch.level,path:path.index});path.nodes.push(index);
  }
  if(path.nodes.length<2){nodes.splice(nodes.length-path.nodes.length,path.nodes.length);continue;}
  // Obstacle-truncated axes end with a short tapered tip instead of a cut pipe.
  if(path.nodes.length<branch.sections.length)nodes[path.nodes.at(-1)].radius=.0002;
  paths.push(path);byRaw.set(bi,path);
 }
 const children=nodes.map(()=>0);nodes.forEach(n=>{if(n.parent>=0)children[n.parent]++;});
 for(const path of paths){const tip=nodes[path.nodes.at(-1)];if(!children[path.nodes.at(-1)])tip.radius=.0002;}
 const clumps=[],restCenters=[],leafSize=Math.min(1,height/8,radius/2.8);
 for(const path of paths){if(path.level<2)continue;
  // More foliage attachment points per twig, without adding woody branches.
  for(const fraction of profile&&(path.level===3||profile.type==='evergreen')?[.32,.52,.74,.94]:path.level===3?[.32,.64,.9]:[.7,.92]){
   const index=path.nodes[Math.max(1,Math.floor((path.nodes.length-1)*fraction))],node=nodes[index],p=node.p;
   const r=Math.min((1.02+random()*.43)*(profile?.leafScale||1)*leafSize,root[1]+height-p[1]-.015,p[1]-root[1]-Math.min(2.6,height*.26));
   if(r<.35*leafSize||!leafSpace(p,r)||restCenters.some(c=>Math.hypot(...c.map((v,k)=>v-node.rest[k]))<.44*leafSize))continue;
   restCenters.push(node.rest);clumps.push({center:[...p],radius:r,variant:Math.floor(random()*4),tone:.89+random()*.16,node:index,seasonRank:random()});
  }
 }
 generator.branchesMesh.geometry.dispose();generator.branchesMesh.material.dispose();generator.leavesMesh.geometry.dispose();generator.leavesMesh.material.dispose();
 return{nodes,paths,clumps,rejected,engine:'EZ-Tree',orders:paths.reduce((o,p)=>(o[p.level]=(o[p.level]||0)+1,o),{}),tips:children.filter((count,i)=>!count&&nodes[i].active).length};
}
function hash(s){let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
