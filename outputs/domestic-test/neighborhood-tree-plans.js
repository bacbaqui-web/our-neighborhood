import {speciesById} from './tree-species.js?v=65';
import {planCanopy,obstacleVolumes,validateCanopy,seededRandom} from './canopy-growth.js?v=67';

const replacements=Object.freeze({jujube:'zelkova',cornelian:'fringe',lilac:'cherry','crape-myrtle':'plane',juniper:'metasequoia'});

// Every planted tree uses the same species library as the tree preview. Old
// whole-tree cards are never a fallback, even when a planting pocket is tight.
export function planNeighborhoodTrees(placements,buildings,structures,elevation,shadowElevation=elevation){
 const obstacles=obstacleVolumes(buildings,structures,elevation).map(o=>({...o,
  minX:Math.min(...o.points.map(p=>p[0])),maxX:Math.max(...o.points.map(p=>p[0])),
  minZ:Math.min(...o.points.map(p=>p[1])),maxZ:Math.max(...o.points.map(p=>p[1]))}));
 const plans=[],omitted=[],trees=placements.filter(p=>p.kind==='tree');
 for(const p of trees){
  const species=speciesById(p.asset)?.id||replacements[p.asset]||'zelkova',profile=speciesById(species),random=seededRandom(p.id);
  const compact=p.source==='existing-plant',root=[p.root[0],compact?Math.max(p.root[1],shadowElevation(p.root[0],p.root[2])):shadowElevation(p.root[0],p.root[2]),p.root[2]];
  const height=compact?Math.max(4.5,Math.min(5.2,p.height*1.25)):Math.max(9,Math.min(12,profile.height*(.93+random()*.12)));
  const radius=compact?Math.max(1.6,Math.min(2.3,p.radius*1.2)):Math.min(profile.radius*(.88+random()*.12),Math.max(2.6,(p.clearance??3.3)+.8));
  const nearby=obstacles.filter(o=>o.minX<root[0]+radius+2&&o.maxX>root[0]-radius-2&&o.minZ<root[2]+radius+2&&o.maxZ>root[2]-radius-2);
  let chosen=null,errors=[];
  // Try another branching pattern, then a narrower crown, without moving the
  // planted root onto a path or into another property.
  for(let attempt=0;attempt<4;attempt++){
   const plan=planCanopy({id:p.id,seed:attempt?p.id+':fit-'+attempt:p.id,root,height,radius:radius*(attempt>=2?.74:1),species,obstacles:nearby});
   errors=validateCanopy(plan,nearby);
   if(!plan.blocked&&!errors.length){chosen=plan;chosen.stats={...chosen.stats,previousAsset:p.asset,source:p.source,compact,fitAttempt:attempt,validationErrors:0};break;}
  }
  if(chosen)plans.push(chosen);else omitted.push({id:p.id,species,root,reason:errors.length?'solid intersection':'no connected crown',errors});
 }
 return {plans,report:{requested:trees.length,replaced:plans.length,omitted,species:plans.reduce((counts,p)=>(counts[p.species]=(counts[p.species]||0)+1,counts),{}),compactTrees:plans.filter(p=>p.stats.compact).length,rootPositionsPreserved:true}};
}
