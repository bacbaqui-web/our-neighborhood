import {prepareShopInteriors} from '../shops/interiors.js?v=shop50v3';
import {createStorefrontLighting} from '../shops/storefront-lighting.js?v=shop50v3';
import {prepareBuildingIdentity} from '../building-remakes/identity.js?v=replacements3';
import {planSizedTree} from '../tree-planting.js';
import {treeProfile} from '../tree-profiles.js';
import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
const loader=new GLTFLoader();let shopData;const legacyPacks=new Map();
export async function createModel(a,options={}){
 if(a.kind==='korean')return(await import('../../alley-library/korean-vehicles.js')).createKoreanVehicle(a.key);
 if(a.kind==='street')return(await import('../street.js?v=ribbon2')).createStreet([],()=>0,()=>null,a.key);
 if(a.kind==='glb'){const g=(await loader.loadAsync(a.file)).scene;g.userData.encyclopediaGLB=true;return g;}
 if(a.kind==='legacy'){
  if(a.key>210)return(await import('../../alley-library/resident-vehicles.js?v=151')).createLegacyResidentVehicle(a.key);
  const file=a.key<=50?'alley-library-50.glb':a.key<=150?'alley-additional-100.glb':'alley-additional-60-v17.glb';
  if(!legacyPacks.has(file))legacyPacks.set(file,loader.loadAsync('../../alley-library/'+file));
  const pack=(await legacyPacks.get(file)).scene;let source;pack.traverse(o=>{if(o.name===a.name||o.name===T.PropertyBinding.sanitizeNodeName(a.name)||o.userData.name===a.name)source=o;});
  if(!source)throw Error('보관 묶음에서 모델을 찾지 못했습니다: '+a.name);
  const copy=source.clone(true);copy.position.set(0,0,0);copy.traverse(o=>{if(o.geometry)o.geometry=o.geometry.clone();if(o.material)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();});return copy;
 }
 if(a.kind==='part'){const m=await import('../building-parts/parts.js?v=yard22');const p=m.parts.find(p=>p.id===a.key);if(p.category==='gardens')await(await import('../perimeter-garden.js?v=garden21')).preparePerimeterGardens();if(p.category==='courtyards')await(await import('../road-facing-courtyard.js?v=yard22')).prepareCourtyards();return p.make();}
 if(a.kind==='building'){await prepareBuildingIdentity();const m=await import('../building-assets/model.js?v=replacements3');const c=await import('../building-assets/catalog.js');return m.previewModel(c.assetById[a.key]);}
 if(a.kind==='facility'){await prepareBuildingIdentity();return(await import('../facilities/preview.js?v=replacements3')).previewBuilding(a.key,{neighbors:false});}
 if(a.kind==='shop'){await Promise.all([prepareBuildingIdentity(),prepareShopInteriors()]);shopData??=fetch('../shops/library/catalog.json?v=shop50v3').then(r=>{if(!r.ok)throw Error('상가 목록을 읽지 못했습니다.');return r.json();});const spec=(await shopData).assets.find(s=>s.id===a.key),root=(await import('../shops/storefront-models.js?v=shop50v3')).buildStorefront(spec),rig=createStorefrontLighting(root,spec);root.updateShopTime=(hour,night)=>rig.update(hour,night);root.updateShopTime(12,0);return root;}
 if(a.kind==='tree'){
  const m=await import('../hybrid-tree.js?v=151'),{speciesById}=await import('../tree-species.js?v=151');
  const species=speciesById(a.key),height=options.height??treeProfile(a.key).defaultHeightM,season=options.season??'summer';
  if(!Number.isFinite(height)||height<3||height>30||!['spring','summer','autumn','winter'].includes(season))throw Error('나무 높이는 3~30m, 계절은 봄·여름·가을·겨울 중에서 선택해 주세요.');
  const texture=await m.loadCanopyTexture(a.key);
  const tree=m.createHybridTrees([planSizedTree({id:a.key,seed:'encyclopedia-'+a.key,species:a.key,height,radius:species.radius*height/species.height})],texture);
  tree.setFoliage({season});tree.group.updatePreview=c=>tree.update(c);
  tree.group.userData.previewSettings={height,season};
  tree.group.disposePreview=()=>{tree.dispose();texture.dispose();};return tree.group;
 }

 throw Error('연결된 모델 생성기가 없습니다.');
}
export function release(model){if(model?.disposePreview){model.disposePreview();return;}const geos=new Set(),mats=new Set(),tex=new Set();model?.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){mats.add(m);if(model.userData.encyclopediaGLB)for(const v of Object.values(m))if(v?.isTexture)tex.add(v);}});geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());tex.forEach(x=>x.dispose());}
