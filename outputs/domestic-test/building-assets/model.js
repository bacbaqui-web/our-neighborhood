import * as T from 'three';
import {createDetails} from '../details.js?v=building-edit1';
import {facadeStyles} from '../korean-facades.js?v=masonry19';
import {facilityById} from '../facilities/catalog.js';
import {chooseApartment} from '../apartments/models.js';
import {createBuildingShellGeometry} from '../building-shell.js?v=recess22';
export function applyAssetToSpec(b,asset){if(!asset)return;delete b.facility;delete b.apartment;delete b.styleIndex;b.assetChoice=asset.id;if(asset.styleIndex!==undefined)b.styleIndex=asset.styleIndex;if(asset.facilityId){b.facility={id:asset.facilityId,frontEdge:b.frontEdge,match:'user-choice'};if(asset.era)b.apartment=chooseApartment({...b,properties:{...b.properties,apartment_era:asset.era,apartment_variant:0}});}}
export function assetColors(asset,fallback){if(!asset)return fallback;return asset.styleIndex!==undefined?facadeStyles[asset.styleIndex]:{wall:facilityById[asset.facilityId].wall,roof:0x798c80};}
export function previewModel(asset){const group=new T.Group(),levels=asset.category==='apartment'?7:3,b={points:[[-5,-4],[5,-4],[5,4],[-5,4]],seed:24,inkObjectId:1,base:0,top:levels*3,floor:3,levels,frontEdge:2,properties:{},holes:false};applyAssetToSpec(b,asset);const colors=assetColors(asset,facadeStyles[0]),shape=new T.Shape(b.points.map(([x,z])=>new T.Vector2(x,-z)));group.add(new T.Mesh(createBuildingShellGeometry(shape,0,b.top,colors.wall,colors.roof),new T.MeshStandardMaterial({vertexColors:true,roughness:1})));group.add(createDetails([b],()=>0,{structures:[]}));return group;}
