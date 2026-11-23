import * as T from 'three';
import {loadAssetRegistry} from '../../../registry.js';
import {createPart} from './modular-assets.js';
import {planConvenience,id} from '../../../../assembly-rules/convenience-local.js';
export async function assembleConvenience(options={}){
 const registry=await loadAssetRegistry(),root=new T.Group();root.name='SEVENA-local-assembly';
 const bodyEntry=registry.resolve(id('body'));if(!bodyEntry)throw Error('백과에서 점포 본체를 찾지 못했습니다.');
 const body=createPart(bodyEntry.key);root.add(body);
 const layers={};for(const name of ['fixed','exterior','interior','lighting']){layers[name]=new T.Group();layers[name].name=name;root.add(layers[name]);}
 const plan=planConvenience(assetId=>registry.resolve(assetId),options);
 if(plan.requiredFailures.length)throw Error('필수 에셋 배치 실패: '+plan.requiredFailures.map(p=>p.assetId+' '+p.reason).join(' / '));
 for(const p of plan.placed){
  const a=registry.resolve(p.assetId);if(!a||a.pack!=='convenience-local')throw Error('지원하지 않는 편의점 에셋: '+p.assetId);
  const part=createPart(a.key);part.name=p.instanceId;part.position.set(p.x,p.y,p.z);part.rotation.y=p.yaw;part.userData.placement=p;layers[p.layer].add(part);
  if(a.key==='light'){
   const light=new T.SpotLight('#edf2d7',25,8,1.05,.50,2);light.position.set(p.x,p.y-.07,p.z);light.target.position.set(p.x,0,p.z);light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-.0003;light.shadow.normalBias=.015;layers.lighting.add(light,light.target);
  }
 }
 root.userData={plan,bodyAssetId:id('body')};
 return {root,layers,plan,registry};
}
