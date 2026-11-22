import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {designs,commercialEntries} from '../outputs/domestic-test/sungshin-commercial/designs.js';
import {assetPolicies} from '../outputs/domestic-test/assembly-rules/asset-policies.js';
import {elevations} from '../outputs/domestic-test/sungshin-commercial/elevations.js';
import {buildCommercial,artworkFor} from '../outputs/domestic-test/sungshin-commercial/model.js';

const library=new URL('../outputs/domestic-test/sungshin-commercial/',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('../asset-encyclopedia/catalog.json',library))).entries;
assert.equal(designs.length,50);
assert.equal(new Set(designs.map(a=>a.id)).size,50);
const commercialCatalog=catalog.filter(a=>a.pack==='sungshin-commercial');
assert.deepEqual(commercialCatalog.map(({taxonomy,assembly,ownership,...a})=>a),commercialEntries);
for(const a of commercialCatalog){assert.equal(a.taxonomy.domain,'commerce');assert.equal(a.assembly.kind,'complete');assert.equal(assetPolicies[a.id].placement.status,'automatic-conditional');assert.equal(assetPolicies[a.id].placement.automatic,true);assert(!('placement' in a));}

const artFiles={poster:'posters',fidelity:'fidelity-signs',yard:'fidelity-signs-01-09',south:'fidelity-south',mid:'fidelity-mid',north:'fidelity-north',corners:'fidelity-corners',small:'fidelity-small',menji:'menji'};
const dummy=file=>{
  const raw=fs.readFileSync(new URL('textures/'+file+'.webp',library));
  assert.equal(raw.toString('ascii',8,12),'WEBP',file);
  const texture=new T.Texture();texture.name=file;return texture;
};
const maps=Object.fromEntries(Object.entries(artFiles).map(([key,file])=>[key,dummy(file)]));

const count=(objects,name)=>objects.filter(o=>o.name===name).length;
const checks={
  1:{MetalShutter:2,CopperHood:2,YardSteppingStone:16},
  2:{AwningFabric:2},3:{RoundedWindowCorner:2,UpperCafeSign:1},
  4:{SideVinyl:2},8:{PaperLantern:3},9:{WovenSeat:4,StoolLeg:16},
  25:{RidgeTile:10,StoreShelf:3,PickupCondenser:1},29:{WindowPrint:15},
  34:{TerraceTable:2,TerraceSeat:4},40:{PandaEar:2},41:{ShoeShelf:2,UpperRestaurantPrint:2},
  42:{CapsuleOrnament:10},43:{UpperTenantSign:3,BasementStep:10},44:{RamenLantern:6,TimberStairCladding:2},
  48:{DarkCurtainMullion:4,BlackLouvre:8},49:{SteelLanding:2,ServicePipe:1},50:{BladePrint:2,FanlightSpoke:2},
};
const geometrySignatures=new Set(),stats=[];
for(const s of designs){
  assert(s.photos.length&&s.photos.every(n=>/^([0-9]{3})$/.test(n)&&+n>0&&+n<=100),s.id);
  const spec=elevations[s.number];
  if(spec){
    assert.equal(s.floors,1+spec.upper.length,s.id+' 층수');
    for(const row of [spec.front,spec.side].filter(Boolean)){
      assert(Math.abs(row.reduce((sum,b)=>sum+b.width,0)-1)<1e-7,s.id+' 점포 폭');
      assert(row.every(b=>b.width>0),s.id);
    }
  }
  const model=buildCommercial(s,maps);model.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(model);
  assert(bounds.max.y>s.floors*2.5&&bounds.max.z-bounds.min.z>=s.depth-.01&&bounds.max.x-bounds.min.x>=s.width-.01,s.id);
  const objects=[],materials=new Set(),names=new Set(),usedFiles=new Set();
  let triangles=0,prints=0;
  model.traverse(o=>{
    if(o.material)materials.add(o.material.uuid);
    if(!o.isMesh)return;
    objects.push(o);names.add(o.name);
    const pos=o.geometry.attributes.position;
    assert(pos?.count&&pos.array.every(Number.isFinite)&&o.matrixWorld.elements.every(Number.isFinite),s.id+' '+o.name);
    triangles+=(o.geometry.index?.count??pos.count)/3;
    if(o.material.map&&!o.userData.shopInterior){
      usedFiles.add(o.material.map.name);prints++;assert.equal(o.geometry.type,'PlaneGeometry',o.name);
      assert(o.geometry.attributes.uv.array.every(v=>v>=0&&v<=1));
    }
    if(o.name==='Glazing')assert(o.material.transparent&&o.material.opacity<.8,s.id);
    if(o.name==='ShopSign'||o.name==='BladePrint'||o.name==='UpperTenantSign')assert(o.material.map,s.id+' 인쇄면 누락');
  });
  assert.deepEqual([...usedFiles].sort(),Object.values(artworkFor(s.number)).sort(),s.id+' 그림 파일 조회 범위');
  assert(names.has('GroundFloor')&&names.has('RoofDeck'));
  for(const [name,expected] of Object.entries(checks[s.number]??{}))assert.equal(count(objects,name),expected,s.id+' '+name);
  // Different topology is a regression check, not evidence of geographic fidelity.
  const signature=JSON.stringify(objects.map(o=>[o.name,o.geometry.attributes.position.count,...o.matrixWorld.elements.slice(12,15).map(v=>v.toFixed(3))]));
  assert(!geometrySignatures.has(signature),s.id+' 동일 구조');geometrySignatures.add(signature);
  if(s.number===12){
    const ray=new T.Raycaster(new T.Vector3(s.width*.32,1.1,s.depth+1),new T.Vector3(0,0,-1));
    assert.equal(ray.intersectObjects(objects).length,0,'주차 통과로 내부가 막혔습니다.');
  }
  if(s.number===43){
    const floor=model.getObjectByName('GroundFloor');
    const ray=new T.Raycaster(new T.Vector3(s.width*.31,1,s.depth/2-.60),new T.Vector3(0,-1,0));
    assert.equal(ray.intersectObject(floor).length,0,'B1 입구가 바닥에 막혔습니다.');
    assert(objects.filter(o=>o.name==='UpperTenantSign').every(o=>o.material.map===maps.fidelity));
  }
  stats.push({id:s.id,triangles,materials:materials.size,prints});
}
console.log(JSON.stringify(stats,null,2));
