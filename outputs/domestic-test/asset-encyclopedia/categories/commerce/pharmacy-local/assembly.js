import {installInteriorVolume} from './interior-volume.js';
import {dimensions} from './model.js?v=15';
import * as T from 'three';
import {loadAssetRegistry} from '../../../registry.js?v=pharmacy-a3-14';
import {createPart} from './model.js?v=15';
import {planPharmacy,id} from '../../../../assembly-rules/pharmacy-local.js?v=15';
export async function assemblePharmacy(options={}){
 const registry=await loadAssetRegistry(),root=new T.Group();root.name='pharmacy-local-assembly';
 const bodyEntry=registry.resolve(id('body'));if(!bodyEntry)throw Error('백과에서 점포 본체를 찾지 못했습니다.');
 const body=createPart(bodyEntry.key,options);root.add(body);
 const layers={};for(const name of ['fixed','exterior','interior','lighting']){layers[name]=new T.Group();layers[name].name=name;root.add(layers[name]);}
 const plan=planPharmacy(assetId=>registry.resolve(assetId),options);
 if(plan.requiredFailures.length)throw Error('필수 에셋 배치 실패: '+plan.requiredFailures.map(p=>p.assetId+' '+p.reason).join(' / '));
 for(const p of plan.placed){
  const a=registry.resolve(p.assetId);if(!a||a.pack!=='pharmacy-local')throw Error('지원하지 않는 약국 에셋: '+p.assetId);
  const part=createPart(a.key,{...options,variant:Number(p.instanceId.split('-').at(-1))%6});part.name=p.instanceId;part.position.set(p.x,p.y,p.z);part.rotation.y=p.yaw;part.userData.placement=p;layers[p.layer].add(part);

 }
 const volume=installInteriorVolume(root,dimensions(options));
 root.userData={plan,bodyAssetId:id('body')};
 return {root,layers,plan,registry,volume};
}
