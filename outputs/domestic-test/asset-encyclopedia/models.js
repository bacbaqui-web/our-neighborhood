// The registry selects the owning category; providers supply models, never map placement.
const providers={
 house:()=>import('./categories/house/models.js'),commerce:()=>import('./categories/commerce/models.js'),
 road:()=>import('./categories/road/models.js'),vehicle:()=>import('./categories/vehicle/models.js'),
 nature:()=>import('./categories/nature/models.js'),prop:()=>import('./categories/prop/models.js'),person:()=>import('./categories/person/models.js'),
};
export async function createModel(a,options={}){
 const domain=a.taxonomy?.domain||a.ownership?.domain;
 if(!providers[domain])throw Error('에셋의 소유 분류를 확인해 주세요: '+a.id);
 return(await providers[domain]()).createModel(a,options);
}
export {release} from './model-resources.js';
