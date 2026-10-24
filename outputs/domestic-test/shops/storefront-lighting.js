import {applySignEmission} from './sign-lighting.js?v=73';
import * as T from 'three';
import {lightingState} from './storefront-hours.js?v=71';

// Lighting follows the facade's local coordinates so it can move with a building.
export function createStorefrontLighting(root,spec){
  const interiorTint={convenience:'#eef5e8',laundry:'#e5efff',salon:'#ffe8cb',estate:'#f3ecd9',food:'#ffdfa9',cafe:'#ffd39d'}[spec.category]||'#ffe1aa';
  const lamps=new T.Group();lamps.name='StorefrontLights';lamps.userData.noPlacementCollision=true;
  const door=(spec.openings||[]).find(o=>o.door!==undefined)||spec.openings?.[0];
  const fixtures=[];
  const add=(role,x,y,z,color,power)=>{
    const light=new T.PointLight(color,0,role==='interior'?6:3.8,2);light.position.set(x,y,z);light.name=`${role}-spill`;
    light.castShadow=role==='interior';light.shadow.mapSize.set(256,256);light.shadow.bias=-.0002;light.shadow.normalBias=.025;light.shadow.camera.near=.1;
    light.userData={storefrontLight:role,power};lamps.add(light);fixtures.push(light);
  };
  if(door)add('interior',door.x,Math.min(2.2,door.y+.55),.85,interiorTint,9);
  const sign=spec.signs?.[0];
  if(sign)add('sign',sign.x,sign.y,.75,sign.color,1.4);
  else if(spec.props?.some(p=>p.type==='signLight'))add('sign',0,spec.height-.2,1.05,'#e6e8d7',5);
  root.add(lamps);
  const materials=[];root.traverse(o=>{if(o.isMesh&&o.userData.storefrontLightRole){materials.push({material:o.material,role:o.userData.storefrontLightRole,base:o.material.color.clone()});}});
  function update(hour,night){
    const state=lightingState(spec,hour),n=T.MathUtils.clamp(night,0,1);
    for(const {material,role,base} of materials){
      const on=role==='interior'?state.interior:state.sign;
      material.color.copy(base);
      if(role==='interior'){
        material.color.lerp(new T.Color(interiorTint).multiplyScalar(.6),on*n*.32);
        material.emissive.set(interiorTint);material.emissiveIntensity=on*(.10+n*.72);
      }else{
        applySignEmission(material,base,{on,night:n});
      }
    }
    for(const light of fixtures){const on=light.userData.storefrontLight==='interior'?state.interior:state.sign;light.intensity=light.userData.power*on*(.12+.88*n);light.visible=on>0;}
    root.userData.storefrontHours=state.schedule;root.userData.lightingPreview={hour:state.hour,phase:state.phase,sign:state.sign,interior:state.interior};
    return state;
  }
  return {update,dispose(){for(const light of fixtures)light.shadow?.map?.dispose();}};
}
