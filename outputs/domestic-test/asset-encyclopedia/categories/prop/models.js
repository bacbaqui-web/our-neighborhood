import {loadStoredModel} from '../../model-resources.js';
export async function createModel(a,context={}){
 if(a.kind==='street'){
  if(typeof context.createStreetPreview!=='function')throw Error('거리 조립 예시 미리보기 연결이 필요합니다.');
  return context.createStreetPreview(a);
 }
 return loadStoredModel(a);
}
