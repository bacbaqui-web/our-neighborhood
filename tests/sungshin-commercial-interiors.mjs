import assert from 'node:assert/strict';
import * as T from 'three';
import {designs} from '../outputs/domestic-test/sungshin-commercial/designs.js';
import {buildCommercial} from '../outputs/domestic-test/sungshin-commercial/model.js';
import {addCommercialInteriors} from '../outputs/domestic-test/sungshin-commercial/interiors.js';

let totalRooms=0,totalItems=0;
for(const design of designs){
  const model=buildCommercial(design);
  assert(model.userData.commercialInteriors,design.id+' 정상 모델 생성 경로에 실내가 없습니다.');
  const collect=()=>{
    const rooms=[],meshes=[];
    model.traverse(o=>{if(o.name==='CommercialInteriorRoom')rooms.push(o);if(o.isMesh)meshes.push(o);});
    return {rooms,meshes};
  };
  const {rooms,meshes}=collect();
  assert(rooms.length>0,design.id);
  // Reopening the same preview must not insert a second copy into each opening.
  addCommercialInteriors(model,design);
  assert.equal(collect().rooms.length,rooms.length);
  model.updateMatrixWorld(true);

  for(const room of rooms){
    const [width,height,depth]=room.userData.size;
    const furniture=room.userData.furniture;
    assert(width>0&&height>0&&depth>0);
    assert(room.getObjectByName('InteriorFloor')&&room.getObjectByName('InteriorCeiling'));
    for(const m of room.children.filter(m=>['InteriorFloor','InteriorCeiling','InteriorBackWall','InteriorSideWall'].includes(m.name))){
      assert(['BoxGeometry','ExtrudeGeometry'].includes(m.geometry.type));
      assert(m.material.map?.isDataTexture&&m.material.map.image.data.length>0);
    }
    if(room.userData.trade==='vacant')assert.equal(furniture.length,0);
    else assert(furniture.length>0,design.id+' '+room.userData.trade);
    for(const item of furniture){
      assert(item.size.every(n=>Number.isFinite(n)&&n>0));
      assert(item.center.every(Number.isFinite));
      assert(Math.abs(item.center[0])+item.size[0]/2<=width/2+.001);
    }
    totalItems+=furniture.length;
    let furnitureVisible=false,surfaceVisible=false;
    const direction=new T.Vector3(0,0,-1).transformDirection(room.matrixWorld);
    for(const x of [-.34,-.21,-.075,.10,.225,.36]){
      for(const y of [.28,.39,.51,.62,.76]){
        const eye=new T.Vector3(x*width,height*y,.99).applyMatrix4(room.matrixWorld);
        const ray=new T.Raycaster(eye,direction,0,depth+1.22);
        const visible=ray.intersectObjects(meshes,false).find(hit=>hit.object.material?.opacity>=.97);
        if(visible?.object.userData.shopInterior)surfaceVisible=true;
        if(visible?.object.name==='PrintedShopFurniture'||visible?.object.name==='PrintedShopGoods'){
          assert(visible.object.material.map.isTexture);furnitureVisible=true;break;
        }
      }
      if(furnitureVisible)break;
    }
    assert(surfaceVisible,design.id+' 실내 마감이 보이지 않습니다.');
    if(furniture.length)assert(furnitureVisible,design.id+' '+room.userData.trade+' 가구가 보이지 않습니다.');
  }
  if([19,40,47].includes(design.number))assert.equal(rooms.filter(r=>r.getObjectByName('CurvedSillFloor')).length,1);
  totalRooms+=rooms.length;
}
console.log('상가 '+designs.length+'종, 실내 '+totalRooms+'곳, 가구 구성 박스 '+totalItems+'개, 외부 시야 검사 통과');
