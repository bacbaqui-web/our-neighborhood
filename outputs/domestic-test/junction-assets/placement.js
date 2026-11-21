import * as T from 'three';
import {factories} from './models.js';
import {isDeleted} from '../asset-encyclopedia/curation.js';
// Parametric surfaces use reviewed part proportions without scaling fixed GLBs.
export function createJunctionParts(plan){
 const root=new T.Group();root.name='GeneratedJunctionParts';root.userData={...plan.qa,generatedJunctions:true};
 const colors={white:0xe9e9da,yellow:0xd6b642,curb:0xb7b7a9,ramp:0x9ba49f};
 for(const [kind,positions]of Object.entries(plan.geometry||{})){
  if(!positions.length||isDeleted(plan.parts[kind]))continue;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();
  const m=new T.Mesh(g,new T.MeshStandardMaterial({color:colors[kind],roughness:1,side:T.DoubleSide}));
  m.name=kind==='ramp'?'road':'junction-'+kind;m.userData={assetId:plan.parts[kind],detailKind:['white','yellow'].includes(kind)?'roadmark':'paving',roadClass:kind==='ramp'?'sidewalk':undefined,parameterized:true,source:'reviewed junction parts'};m.receiveShadow=true;root.add(m);
 }
 for(const p of plan.assets||[]){
  if(p.assetId!=='junction:tactile-warning'||isDeleted(p.assetId))continue;
  const part=factories['tactile-warning']();part.position.fromArray(p.position);
  const [dx,dz]=p.slope;part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-dx,1,-dz).normalize());part.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),p.heading));
  part.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.userData={...o.userData,detailKind:'paving',assetId:p.assetId};}});root.add(part);
 }
 return root;
}
