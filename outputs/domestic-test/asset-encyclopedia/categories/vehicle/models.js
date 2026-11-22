import {loadStoredModel} from '../../model-resources.js';
export async function createModel(a){
 if(a.kind==='korean')return(await import('../../../../alley-library/korean-vehicles.js')).createKoreanVehicle(a.key);
 return loadStoredModel(a);
}
