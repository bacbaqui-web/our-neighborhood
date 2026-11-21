import {approvedBuildingProfiles} from '../building-remakes/models.js?v=approvedbuildings1';
import * as T from 'three';
import {createDetails} from '../details.js?v=approvedbuildings1';
import {facadeStyles} from '../korean-facades.js?v=masonry19';
import {facilityById} from '../facilities/catalog.js';
import {chooseApartment} from '../apartments/models.js';
import {createBuildingShellGeometry} from '../building-shell.js?v=recess22';
export function applyAssetToSpec(b,asset){if(!asset)return;delete b.facility;delete b.apartment;delete b.styleIndex;b.assetChoice=asset.id;if(asset.styleIndex!==undefined)b.styleIndex=asset.styleIndex;if(asset.facilityId){b.facility={id:asset.facilityId,frontEdge:b.frontEdge,match:'user-choice'};if(asset.era)b.apartment=chooseApartment({...b,properties:{...b.properties,apartment_era:asset.era,apartment_variant:0}});}}
export function assetColors(asset,fallback){if(!asset)return fallback;return asset.styleIndex!==undefined?facadeStyles[asset.styleIndex]:{wall:facilityById[asset.facilityId].wall,roof:0x798c80};}
export function previewModel(asset,specs=null){
 const group=new T.Group(),approved=approvedBuildingProfiles['building:'+asset.id];
 if(!specs&&approved){const [w,h,d]=approved.nominal;specs=[{points:[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]],seed:24,inkObjectId:1,base:0,top:h,floor:h/Math.round(h/3),levels:Math.round(h/3),frontEdge:2,properties:{},holes:false}];}
 if(!specs){const levels=asset.category==='apartment'?7:3;specs=[{points:[[-5,-4],[5,-4],[5,4],[-5,4]],seed:24,inkObjectId:1,base:0,top:levels*3,floor:3,levels,frontEdge:2,properties:{},holes:false}];}
 for(const original of specs){
  const b={...original,properties:{...original.properties}};applyAssetToSpec(b,asset);
  const colors=assetColors(asset,facadeStyles[b.styleIndex??Math.abs(b.seed)%6]),shape=new T.Shape(b.points.map(([x,z])=>new T.Vector2(x,-z)));
  for(const ring of b.holePoints||[])shape.holes.push(new T.Path(ring.map(([x,z])=>new T.Vector2(x,-z))));
  const shell=new T.Mesh(createBuildingShellGeometry(shape,0,b.top,colors.wall,colors.roof),new T.MeshStandardMaterial({vertexColors:true,roughness:1}));shell.userData.windowOwner=b.seed;group.add(shell);
  group.add(createDetails([b],()=>0,{structures:[]},approved?{shells:[shell],auditWindows:true}:{}));
  const a=b.points[b.frontEdge],c=b.points[(b.frontEdge+1)%b.points.length];
  if(a&&c){const points=[a,c].map(([x,z])=>new T.Vector3(x,.08,z));const marker=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x087e84}));marker.name='preview-entrance-face';group.add(marker);}
 }
 group.userData.preview={buildings:specs.length,floors:specs[0].levels,frontEdge:specs[0].frontEdge,assetId:asset.id};
 return group;
}
