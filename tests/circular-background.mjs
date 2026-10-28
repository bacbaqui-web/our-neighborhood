import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {withinScope,fullyInScope,cropTerrain,scopePlan} from '../outputs/domestic-test/scene-budget.js';
import {createAtmosphere} from '../outputs/domestic-test/atmosphere.js';
assert(!withinScope([[45,45],[49,45],[49,49]],50),'square corners are outside circle');
assert(withinScope([[-100,-100],[100,-100],[100,100],[-100,100]],50));
assert(!fullyInScope([[0,0],[51,0]],50));
const root=new T.Group(),m=new T.Mesh(new T.PlaneGeometry(200,200,10,10),new T.MeshBasicMaterial());m.geometry.rotateX(-Math.PI/2);m.name='ground';root.add(m);cropTerrain(root,50);
const p=m.geometry.attributes.position;let area=0;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);area+=b.sub(a).cross(c.sub(a)).length()/2;}
for(let i=0;i<p.count;i++)assert(Math.hypot(p.getX(i),p.getZ(i))<=50.001);
assert(Math.abs(area-Math.PI*2500)/(Math.PI*2500)<.002);
assert.equal(scopePlan({plants:[{owner:1,root:[49,0,0],radius:3},{owner:1,root:[20,0,0],radius:2}]},new Set([1]),50).plants.length,1);
const d=JSON.parse(fs.readFileSync('outputs/domestic-test/environment/terrain.json'));
assert(d.contextBuildings.includes('MOIS'));assert(d.city.length>1000);assert.equal(d.city.length,d.cityFootprints.length);
const system=createAtmosphere(d,undefined,50);system.fitGround((x,z,alt)=>Math.hypot(x,z)<=50?0:alt);system.set(12,'clear');const day=system.scene.getObjectByName('GeographicContextBuildings').material.uniforms.night.value;system.set(22,'clear');const night=system.scene.getObjectByName('GeographicContextBuildings').material.uniforms.night.value;assert(night>day);assert.equal(system.stats.windowGeometry,0);system.dispose();
console.log(JSON.stringify({passed:true,area,expectedArea:Math.PI*2500,contextBuildings:d.city.length,day,night,windowGeometry:0}));
// Touching buildings remain whole, and only their actual records leave the background.
assert(withinScope([[45,-8],[70,-8],[70,8],[45,8]],50));
assert(!fullyInScope([[45,-8],[70,-8],[70,8],[45,8]],50));
const owner=d.city[0][6],joined=createAtmosphere(d,undefined,50,new Set([owner]));
assert.equal(joined.stats.excludedDetailed,d.city.filter(b=>b[6]===owner).length);
assert(Number.isFinite(joined.heightAt(75,0)));
const near=new T.Group(),land=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial());land.name='ground';near.add(land);joined.bridgeGround(near);
assert(land.material.isShaderMaterial&&land.userData.noInk&&land.userData.environmentOwned);
assert(near.getObjectByName('GroundShadowReceiver').receiveShadow);
joined.dispose();
console.log('Crossing buildings, background deduplication, continuous ground, and shadow receivers passed.');
