import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from '../outputs/domestic-test/vendor/GLTFLoader.js';
import {planFrontages} from '../outputs/domestic-test/frontage.js';
import {planFacilities} from '../outputs/domestic-test/facilities/placement.js';
import {planNeighborhoodShops} from '../outputs/domestic-test/shops/neighborhood-plan.js';
import {arterialShopInputs} from '../outputs/domestic-test/shops/arterial-catalog.js';
import assert from 'node:assert/strict';
const root='outputs/generated-neighborhoods/f20b139277e4d2a5/data/',read=p=>JSON.parse(fs.readFileSync(root+p)),loc=read('location.json');
const bytes=fs.readFileSync(root+'corrected-base.glb'),oldRoot=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene,ground=[];oldRoot.traverse(o=>{if(o.isMesh&&['ground','road','path'].includes(o.name))ground.push(o)});
const source=fs.readFileSync('work/windows-v39/terrain-functions.js.txt','utf8').replace('37.626469',String(loc.origin[0])).replace('127.015677',String(loc.origin[1]));
const terrain=new Function('T','oldRoot','ground',source+';indexTerrain();return {xz,elevation,roadInfo};')(T,oldRoot,ground),{xz,elevation,roadInfo}=terrain;
const specs=[];for(const f of read('arterial/buildings.geojson').features)for(const rings of f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates){const p=f.properties,points=rings[0].slice(0,-1).map(xz),cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;specs.push({properties:p,points,base:Math.min(...points.map(v=>elevation(...v)),elevation(cx,cz))-.1,top:elevation(cx,cz)+Math.max(1,p.gro_flo_co)*3,floor:3,levels:Math.max(1,p.gro_flo_co),seed:Number(p.objectid),address:`${p.street_name} ${p.house_number}`,holes:rings.length>1});}
planFrontages(specs,roadInfo);const facilities=planFacilities(specs,read('shops/places.json').places,terrain),catalog=JSON.parse(fs.readFileSync('outputs/domestic-test/shops/library/catalog.json')),arterial=read('arterial/plan.json'),inputs=arterialShopInputs(catalog,read('shops/places.json').places,arterial),shops=planNeighborhoodShops(specs,inputs.places,inputs.catalog,{...terrain,arterial});
const brands=shops.placements.filter(p=>p.reference==='reference-derived-brand').map(p=>({name:p.name,asset:p.assetId,owner:p.owner,address:p.address,edge:p.edge,width:p.width,clearance:p.clearance}));assert.ok(brands.length>=3);assert.ok(facilities.applied.some(f=>f.id==='apartment'));const report={buildings:specs.length,facilities,brands,shopCount:shops.placements.length};fs.writeFileSync('outputs/domestic-test/first-batch-review/placement-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
