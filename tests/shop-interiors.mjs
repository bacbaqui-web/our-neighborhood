import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scheduleFor,lightingState} from '../outputs/domestic-test/shops/storefront-hours.js';
import {buildStorefront} from '../outputs/domestic-test/shops/storefront-models.js';
import {createStorefrontLighting} from '../outputs/domestic-test/shops/storefront-lighting.js';
const {assets}=JSON.parse(fs.readFileSync('outputs/domestic-test/shops/library/catalog.json'));
for(const spec of assets){
 const s=scheduleFor(spec);
 assert.equal(s.alwaysOpen,spec.category==='convenience');
 if(!s.alwaysOpen){assert(s.closeMinute>=1260&&s.closeMinute<=1320);assert.equal(s.cleanupMinutes,0);assert.equal(lightingState(spec,12).interior,1);assert.equal(lightingState(spec,(s.closeMinute-1)/60).interior,1);assert.equal(lightingState(spec,s.closeMinute/60).interior,0);assert.equal(lightingState(spec,23).interior,0);assert.equal(lightingState(spec,0).interior,0);}
 else for(const h of [0,6,12,21,22,23.999])assert.equal(lightingState(spec,h).interior,1);
 const root=buildStorefront(spec);const interiors=[];root.traverse(o=>{if(o.userData.shopInterior)interiors.push(o);});assert(interiors.length>0,spec.id+' missing interior');
 let triangles=0;for(const m of interiors){if(m.name==='ShopInteriorFurniture')assert(m.material.map&&m.material.emissiveMap===m.material.map);assert.equal(m.userData.storefrontLightRole,'interior');assert([...m.geometry.attributes.position.array].every(Number.isFinite));if(m.geometry.attributes.uv)assert([...m.geometry.attributes.uv.array].every(v=>v>=0&&v<=1));triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;}
 assert.equal(triangles,root.userData.interior.triangles);assert.equal(root.userData.interior.furnitureMeshes,1);assert(root.userData.interior.depth>=2);const room=root.getObjectByName('ShopInteriorRoom');assert(room.userData.furniture.length>=3);for(const f of room.userData.furniture)assert(f.center[2]+f.size[2]/2<0,'furniture must be behind facade');
 const rig=createStorefrontLighting(root,spec);rig.update(12,0);assert(interiors.every(m=>m.material.emissiveIntensity>0));rig.update(23,1);assert(interiors.every(m=>(m.material.emissiveIntensity>0)===(spec.category==='convenience')));
}
// Explicit saved business hours remain authoritative.
assert.equal(lightingState({id:'late',category:'food',hours:{openMinute:600,closeMinute:120,cleanupMinutes:0}},1).interior,1);
console.log('18 shop interiors: recessed rooms, textured cuboid furniture, daytime lighting, exact 21–22h shutdown and 24h convenience stores verified.');

const {createNeighborhoodShops}=await import('../outputs/domestic-test/shops/neighborhood-shops.js');
const T=await import('three');
const placements=assets.map((spec,i)=>({spec,assetId:'shop:'+spec.id,placeId:String(i),name:spec.name,position:[i*10,0,0],scale:[1,1,1],angle:0,n:[0,1],category:spec.category,hours:scheduleFor(spec)}));
const shops=createNeighborhoodShops({placements,qa:{}},{shadowMap:{}},{elevation:()=>0}),scene=new T.Scene();scene.add(shops.group,shops.lamps);
shops.set(12,0,'color',scene);assert(shops.sources.every(s=>s.amount===1));
shops.set(22,1,'color',scene);assert.equal(shops.sources.filter(s=>s.amount>0).length,3);
for(const r of shops.records){const m=r.root.getObjectByName('ShopInteriorFurniture');assert(m);assert.equal(m.material.emissiveIntensity>0,r.p.category==='convenience');}
const unsupported=buildStorefront({...assets[0],category:'pharmacy'});let panes=0;unsupported.traverse(o=>{if(o.userData.storefrontLightRole==='interior')panes++;});assert(panes>0,'unsupported trades must retain original glazing');
console.log('Actual neighborhood shop placement keeps all 18 boxes, switches emissions and spill sources, and preserves other trade glazing.');

// A real opaque host shell must be opened, not hidden by drawing over its wall.
const {createBuildingShellGeometry}=await import('../outputs/domestic-test/building-shell.js');
const first=assets[0],host=new T.Mesh(createBuildingShellGeometry(new T.Shape([new T.Vector2(-10,0),new T.Vector2(10,0),new T.Vector2(10,6),new T.Vector2(-10,6)]),-.1,6,0x999999,0x666666),new T.MeshStandardMaterial({side:T.DoubleSide}));host.userData.objectid='host';
const placement={...placements[0],owner:'host',position:[0,0,.025]};
const fixture=createNeighborhoodShops({placements:[placement],qa:{}},{shadowMap:{}},{elevation:()=>0});
const cut=fixture.cutShells(host);assert.equal(cut.matchedWindows,first.openings.length);assert.equal(cut.blockedPanes,0);
console.log('Real host wall aperture cut and all furniture positions behind the facade verified.');

const {applyInteriorStyle,applyInteriorEmission}=await import('../outputs/domestic-test/shops/interiors.js?v=interiors2');
for(const spec of assets){const root=buildStorefront(spec),room=root.getObjectByName('ShopInteriorRoom');for(const f of room.userData.furniture.filter(f=>f.name==='chair-base'))assert(Math.abs(f.center[1]-f.size[1]/2-root.userData.interior.bottom)<1e-6);const original=root.getObjectByName('ShopInteriorFurniture').material,gray=new T.MeshStandardMaterial();applyInteriorStyle(gray,original,'gray');assert.equal(gray.map,original.map);assert.equal(gray.emissiveMap,original.emissiveMap);const shader={fragmentShader:'#include <opaque_fragment>'};gray.onBeforeCompile(shader);assert(shader.fragmentShader.includes('dot(gl_FragColor.rgb'));applyInteriorEmission(gray,{on:1,night:1});assert.equal(gray.color.r,gray.color.g);}
console.log('Cuboid chair supports reach the floor and grayscale mode retains furniture textures.');
