import {loadStoredModel} from '../../model-resources.js';
import {prepareBuildingIdentity} from '../../../building-remakes/identity.js?v=replacements3';
import {previewModel} from './building-preview.js';
import {assetById} from '../../../building-assets/catalog.js';
export async function createModel(a,context={}){
 if(a.kind==='part'){
  if(typeof context.createPartPreview!=='function')throw Error('부품·조립 예시 미리보기 연결이 필요합니다.');
  return context.createPartPreview(a);
 }
 if(a.kind==='building'){await prepareBuildingIdentity();return previewModel(assetById[a.key],null,context);}
 return loadStoredModel(a);
}
