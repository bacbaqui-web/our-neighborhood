import * as T from 'three';
const trees=new Set([121,122,154]);
const woodyPlants=new Set([49,124,151,198]);
const plants=new Set([46,47,49,116,117,118,119,120,124,151,152,198,199,200,210]);
const plantAssets=['leafy-herb','hydrangea','pepper'];
// Keep real pots, shelf hardware and trellises; replace only their living plants.
export function extractVegetation(root){
 root.updateMatrixWorld(true);const records=[],assets=[];root.traverse(o=>{if(o.userData.vegetationAssetId)assets.push(o);});
 for(const obj of assets){const id=obj.userData.vegetationAssetId;if(!trees.has(id)&&!plants.has(id))continue;
  const candidates=[];obj.traverse(o=>{if(o.isMesh&&(['green','leaf',...((trees.has(id)||woodyPlants.has(id))?['wood']:[])].includes(o.userData.part)||(['red','yellow'].includes(o.userData.part)&&o.geometry.type==='SphereGeometry'&&new T.Box3().setFromObject(o).getSize(new T.Vector3()).length()<.7)))candidates.push({object:o,box:new T.Box3().setFromObject(o)});});
  if(!candidates.length)continue;
  const clusters=[];
  for(const c of candidates){const touching=[];for(let i=0;i<clusters.length;i++)if(clusters[i].box.clone().expandByScalar(.13).intersectsBox(c.box))touching.push(i);
   const cluster={box:c.box.clone(),objects:[c.object]};for(const i of touching.reverse()){cluster.box.union(clusters[i].box);cluster.objects.push(...clusters[i].objects);clusters.splice(i,1);}clusters.push(cluster);
  }
  // All branches of one full tree share one rooted card.
  if(trees.has(id)&&clusters.length>1){for(const c of clusters.slice(1)){clusters[0].box.union(c.box);clusters[0].objects.push(...c.objects);}clusters.splice(1);}
  for(const c of clusters){const size=c.box.getSize(new T.Vector3()),centre=c.box.getCenter(new T.Vector3()),kind=trees.has(id)?'tree':'plant';if(size.y<.035)continue;
   const radius=Math.max(.08,Math.max(size.x,size.z)/2),height=Math.max(.1,size.y);
   records.push({id:'existing-green-'+records.length,asset:kind==='tree'?(id===121?'juniper':id===122?'maple':'persimmon'):plantAssets[(id+records.length)%3],kind,root:[centre.x,c.box.min.y-(kind==='plant'?height*.12:0),centre.z],height,radius,heading:obj.rotation.y,source:'existing-plant',legacyId:id});
   for(const o of c.objects)o.removeFromParent();
  }
 }
 return records;
}
