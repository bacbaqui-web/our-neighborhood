import * as T from 'three';
import {loadAssetRegistry} from '../../../registry.js';
import {createPart,dimensions} from './model.js';
import {planBakery} from '../../../../assembly-rules/bakery-blue.js';
import {installInteriorVolume} from '../pharmacy-local/interior-volume.js';
export async function assembleBakery(options={}){
 const registry=await loadAssetRegistry(),plan=planBakery(id=>registry.resolve(id),options),root=new T.Group();root.name='bakery-blue';root.add(createPart('body',options));const layers={};
 for(const k of ['fixed','exterior','interior','lighting']){layers[k]=new T.Group();root.add(layers[k]);}
 for(const [i,p]of plan.placed.entries()){const part=createPart(p.key,{...options,variant:i%5});part.name=p.instanceId;part.position.set(p.x,p.y,p.z);part.rotation.y=p.yaw;part.userData.placement=p;layers[p.layer].add(part);}
 const volume=installInteriorVolume(root,dimensions(options));return{root,layers,plan,registry,volume};
}
