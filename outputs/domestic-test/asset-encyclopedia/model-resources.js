// Shared model-file loading. This module does not decide where an asset is placed.
import * as T from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
const loader=new GLTFLoader(),legacyPacks=new Map(),base=new URL('./',import.meta.url);
export async function loadStoredModel(a){
 if(a.kind==='glb'){const g=(await loader.loadAsync(new URL(a.file,base).href)).scene;g.userData.encyclopediaGLB=true;return g;}
 if(a.kind==='legacy'){
  if(a.key>210)return(await import('../../alley-library/resident-vehicles.js?v=151')).createLegacyResidentVehicle(a.key);
  const file=a.key<=50?'alley-library-50.glb':a.key<=150?'alley-additional-100.glb':'alley-additional-60-v17.glb';
  if(!legacyPacks.has(file))legacyPacks.set(file,loader.loadAsync(new URL('../../alley-library/'+file,base).href));
  const pack=(await legacyPacks.get(file)).scene;let source;pack.traverse(o=>{if(o.name===a.name||o.name===T.PropertyBinding.sanitizeNodeName(a.name)||o.userData.name===a.name)source=o;});
  if(!source)throw Error('보관 묶음에서 모델을 찾지 못했습니다: '+a.name);
  const copy=source.clone(true);copy.position.set(0,0,0);copy.traverse(o=>{if(o.geometry)o.geometry=o.geometry.clone();if(o.material)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();});return copy;
 }
 throw Error('연결된 모델 생성기가 없습니다: '+a.id);
}
export function release(model){if(model?.disposePreview){model.disposePreview();return;}const geos=new Set(),mats=new Set(),tex=new Set();model?.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){mats.add(m);if(model.userData.encyclopediaGLB)for(const v of Object.values(m))if(v?.isTexture)tex.add(v);}});geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());tex.forEach(x=>x.dispose());}
