import * as T from 'three';
export const TREE_ASSET_IDS=new Set([121,122,154]);
const trees=TREE_ASSET_IDS;
const woodyPlants=new Set([49,124,151,198]);
export const PLANT_ASSET_IDS=new Set([46,47,48,49,68,145,116,117,118,119,120,123,124,125,151,152,153,155,182,196,197,198,199,200,210]);
const plants=PLANT_ASSET_IDS;
const plantAssets=['leafy-herb','hydrangea','pepper'];
// Keep real pots, shelf hardware and trellises; replace only their living plants.
export function extractVegetation(root){
 root.updateMatrixWorld(true);const records=[],assets=[];root.traverse(o=>{if(o.userData.vegetationAssetId)assets.push(o);});
 for(const obj of assets){const id=obj.userData.vegetationAssetId;if(!trees.has(id)&&!plants.has(id))continue;
  const candidates=[];obj.traverse(o=>{if(o.isMesh&&((o.userData.part==='leaf'||o.userData.part==='green'&&(id===197||!['CylinderGeometry','TubeGeometry'].includes((o.userData.representativeOriginalGeometryType||o.geometry.type)))||trees.has(id)&&o.userData.part==='wood')||(['red','yellow'].includes(o.userData.part)&&(o.userData.representativeOriginalGeometryType||o.geometry.type)==='SphereGeometry'&&new T.Box3().setFromObject(o).getSize(new T.Vector3()).length()<.7)))candidates.push({object:o,box:new T.Box3().setFromObject(o)});});
  if(!candidates.length)continue;
  const clusters=[];
  for(const c of candidates){const touching=[];for(let i=0;i<clusters.length;i++)if(clusters[i].box.clone().expandByScalar(obj.userData.roadview50?.assetId?.startsWith('a')?.008:.13).intersectsBox(c.box))touching.push(i);
   const cluster={box:c.box.clone(),objects:[c.object]};for(const i of touching.reverse()){cluster.box.union(clusters[i].box);cluster.objects.push(...clusters[i].objects);clusters.splice(i,1);}clusters.push(cluster);
  }
  // Long vines and bamboo retain their distributed foliage, not a single central blob.
  if(!trees.has(id)&&!obj.userData.roadview50){for(let j=clusters.length-1;j>=0;j--){const c=clusters[j],size=c.box.getSize(new T.Vector3());if(size.y<=1.2&&Math.max(size.x,size.z)<=1.3)continue;const bins=new Map();for(const object of c.objects){const box=new T.Box3().setFromObject(object),v=box.getCenter(new T.Vector3()),key=[Math.floor(v.x/.7),Math.floor(v.y/.6),Math.floor(v.z/.7)].join(',');if(!bins.has(key))bins.set(key,{box:box.clone(),objects:[]});const b=bins.get(key);b.box.union(box);b.objects.push(object);}clusters.splice(j,1,...bins.values());}}
  // All branches of one full tree share one rooted card.
  if(trees.has(id)&&clusters.length>1){for(const c of clusters.slice(1)){clusters[0].box.union(c.box);clusters[0].objects.push(...c.objects);}clusters.splice(1);}
  for(const c of clusters){const size=c.box.getSize(new T.Vector3()),centre=c.box.getCenter(new T.Vector3()),kind=trees.has(id)?'tree':'plant';if(size.y<.035)continue;
   const radius=Math.max(.08,Math.max(size.x,size.z)/2),height=Math.max(.1,size.y);
   records.push({id:'existing-green-'+records.length,asset:kind==='tree'?(id===121?'juniper':id===122?'maple':'persimmon'):plantAssets[(id+records.length)%3],kind,root:[centre.x,c.box.min.y-(kind==='plant'?height*.12:0),centre.z],height,radius,heading:obj.rotation.y,source:'existing-plant',legacyId:id,owner:obj.userData.placementOwner??null,assetId:obj.userData.roadview50?.assetId??('legacy-'+id)});
   for(const o of c.objects)o.removeFromParent();
  }
 }
 root.userData.foliageExtraction={method:"tree-hybrid-atlas",registeredPlantTypes:[...plants],registeredTreeTypes:[...trees],groups:records.length,byLegacyId:Object.fromEntries([...new Set(records.map(p=>p.legacyId))].map(id=>[id,records.filter(p=>p.legacyId===id).length]))};
 return records;
}
