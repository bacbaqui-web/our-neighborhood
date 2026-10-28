import {planFacilities} from '../../outputs/domestic-test/facilities/placement.js';
import {installGenerationBounds} from '../../outputs/domestic-test/memo-scene.js?v=134';
import * as T from 'three';
import {GLTFLoader} from '../../outputs/domestic-test/vendor/GLTFLoader.js';
import {planFrontages} from '../../outputs/domestic-test/frontage.js';
import {classifyYards} from '../../outputs/domestic-test/neighborhood-rules.js';
import {createDetails} from '../../outputs/domestic-test/details.js';
import {decorateAlleys} from '../../outputs/domestic-test/alley-placement.js';
import {createUtilityNetwork} from '../../outputs/domestic-test/utility-network.js';
import {applyRoadContext} from '../../outputs/domestic-test/road-context.js';
import {planNeighborhoodShops,reserveShopApproaches} from '../../outputs/domestic-test/shops/neighborhood-plan.js';
export async function prepareScene(FS,root,mode,terrainText,bounds){
installGenerationBounds(bounds);
const read=p=>JSON.parse(FS.readFile(root+'/'+p,{encoding:'utf8'})),location=read('location.json');
const binary=FS.readFile(root+'/corrected-base.glb');
const oldRoot=(await new GLTFLoader().parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'')).scene;
if(mode==='placement')applyRoadContext(oldRoot,read('road-context.json'));
const ground=[];oldRoot.traverse(o=>{if(o.isMesh&&['ground','road','path'].includes(o.name))ground.push(o)});
const terrainSource=terrainText.replace('37.626469',String(location.origin[0])).replace('127.015677',String(location.origin[1]));
const terrain=new Function('T','oldRoot','ground',terrainSource+';indexTerrain();return {xz,elevation,roadInfo};')(T,oldRoot,ground);
const {xz,elevation,roadInfo}=terrain,data=read('buildings.geojson'),specs=[];
for(const f of data.features)for(const rings of f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates){
 const pr=f.properties,points=rings[0].slice(0,-1).map(xz),cx=points.reduce((n,p)=>n+p[0],0)/points.length,cz=points.reduce((n,p)=>n+p[1],0)/points.length;
 specs.push({properties:pr,inkObjectId:specs.length+1,points,base:Math.min(...points.map(v=>elevation(...v)),elevation(cx,cz))-.1,top:elevation(cx,cz)+Math.max(1,pr.gro_flo_co)*3,floor:3,levels:Math.max(1,pr.gro_flo_co),seed:Number(pr.objectid),address:`${pr.street_name} ${pr.house_number}`,basementLevels:pr.und_flo_co,holes:rings.length>1,holePoints:rings.slice(1).map(r=>r.slice(0,-1).map(xz))});
}
elevation.detailRadius=location.sizeMetres/2;
planFrontages(specs,roadInfo);
const parcel=read('parcels.json');
if(mode==='profile'){
 const parcels=classifyYards(parcel,specs,elevation);for(const version of [17,22])FS.writeFile(root+'/../'+`alley-placement-report-v${version}.json`,JSON.stringify({parcels}));
 console.log(JSON.stringify({buildings:specs.length,yards:parcels.length}));
}else{
 const catalog=JSON.parse(FS.readFile('/outputs/domestic-test/shops/library/catalog.json',{encoding:'utf8'}));
 planFacilities(specs,read('shops/places.json').places,{xz});
 const plan=planNeighborhoodShops(specs,read('shops/places.json').places,catalog,terrain);
 const {architecture,context}=reserveShopApproaches(plan,read('attached-structures.json'),read('streetscape-context.json'));
 const details=createDetails(specs,elevation,architecture),utility=createUtilityNetwork(read('utilities.json'),elevation);
 const alley=decorateAlleys(specs,elevation,roadInfo,[details,utility],parcel,architecture,context);
 FS.writeFile(root+'/../alley-placement-report-v23.json',JSON.stringify(alley.userData));
 FS.writeFile(root+'/../shop-plan.json',JSON.stringify(plan));
 console.log(JSON.stringify({props:alley.userData.count,shops:plan.placements.length,footprintOverlap:alley.userData.footprintOverlap}));
}

oldRoot.traverse(o=>{o.geometry?.dispose();});
}
