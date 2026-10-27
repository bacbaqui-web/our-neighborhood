import {planPlantCanopies} from './plant-canopy-layout.js?v=2';
import {fitSupportBase} from './support-geometry.js?v=82';
import {createVegetation} from './vegetation.js?v=44';
import {createHybridTrees} from './hybrid-tree.js?v=117';
import {planNeighborhoodTrees} from './neighborhood-tree-plans.js?v=82';
export function createNeighborhoodVegetation(placements,assets,elevation,shadowElevation,texture,buildings,structures){
 const {plans,report}=planNeighborhoodTrees(placements,buildings,structures,elevation,shadowElevation);
 const plants=placements.filter(p=>p.kind!=='tree'),contacts=[...plants,...plans.map(p=>({...p,kind:'tree',source:p.stats.source}))];
 const plantPlans=planPlantCanopies(plants);
 const original=createVegetation([],assets,elevation,shadowElevation,contacts),hybrid=createHybridTrees([...plans,...plantPlans],texture);
 for(const figure of hybrid.figures)if(figure.plan.stats.kind==='plant')figure.placement.kind='plant';
 original.group.userData.plants=plants.length;original.group.userData.plantFoliage={method:'same createHybridTrees atlas renderer',plants:plants.length,species:'fringe',layout:'compact-offset-crown-v2',maxCardsPerPlant:7,cards:plantPlans.reduce((n,p)=>n+p.clumps.length,0),triangles:plantPlans.reduce((n,p)=>n+p.clumps.length*2,0),oldCards:plantPlans.length*3,oldTriangles:plantPlans.length*6,lightSamplesPerPlant:1};original.group.add(hybrid.group);
 let rootRims=0;
 for(const mesh of hybrid.wood.children){const plan=plans.find(p=>mesh.name==='rooted-trunk-'+p.id);if(!plan)continue;let offset=0;const indices=[];
  for(const path of plan.paths){const sides=[12,9,7,5][path.level]||5,node=plan.nodes[path.nodes[0]];if(Math.hypot(...node.p.map((v,i)=>v-plan.root[i]))<.001)for(let j=0;j<sides;j++)indices.push(offset+j);offset+=path.nodes.length*sides;}
  if(indices.length){mesh.geometry.userData.supportIndices=indices;fitSupportBase(mesh.geometry,(x,z)=>plan.stats.compact?Math.max(plan.root[1],shadowElevation(x,z)):shadowElevation(x,z),.045);rootRims++;}
 }
 original.group.userData.supportFit={treeRoots:rootRims,pottedPlantAnchorsPreserved:true};
 let currentSeason=null;
 function setSeason(season){
  if(currentSeason===season)return;currentSeason=season;hybrid.setFoliage({season});
  original.group.userData.foliage={season,trees:plans.length,batches:hybrid.batches.map(b=>({...b.group.userData.foliage}))};
 }
 Object.assign(original.group.userData,{trees:plans.length,hybridTrees:plans.length,replacement:{...report,legacyTreeBillboards:original.figures.filter(f=>f.placement.kind==='tree').length},clusters:hybrid.leaves.length,canopyPlans:hybrid.group.userData.canopyPlans,triangles:original.group.userData.triangles+hybrid.leaves.length*2+hybrid.wood.children.reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),drawCalls:original.group.userData.drawCalls+plans.length+hybrid.batches.length});
 const sunShadows={batches:[...original.sunShadows.batches,...hybrid.sunShadows.batches],stats:{},set(profile,on,legacy){original.sunShadows.set(profile,on,legacy);hybrid.sunShadows.set(profile,on);Object.assign(this.stats,{...original.sunShadows.stats,casters:original.sunShadows.stats.casters+hybrid.sunShadows.stats.casters,batches:this.batches.length,hybridTrees:plans.length,leafClusters:hybrid.leaves.length});}};
 return{...original,figures:[...original.figures,...hybrid.figures],plans,sunShadows,setSeason,update(camera){original.update(camera);hybrid.update(camera);},setLighting(field){original.setLighting(field);hybrid.setLighting(field);},setStyle(value){original.setStyle(value);hybrid.setStyle(value);},exportGroup(){const out=original.exportGroup();out.add(hybrid.exportGroup());return out;}};
}
