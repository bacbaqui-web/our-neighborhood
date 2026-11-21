import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const three=new URL('../outputs/domestic-test/vendor/three.module.js',import.meta.url).href;
const T=await import(three);
const source=(await readFile(new URL('../outputs/domestic-test/vehicle-lighting.js',import.meta.url),'utf8')).replace("from 'three'",`from '${three}'`);
const {createVehicleLighting}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scene=new T.Scene(),camera=new T.PerspectiveCamera();camera.position.set(0,3,7);
function car(x=0){const root=new T.Group();root.userData={memoVehicle:'test',vehicleFamily:'sonata-dn8',dimensions:[2,1.5,5]};const body=new T.Mesh(new T.BoxGeometry(2,1.5,5),new T.MeshStandardMaterial());body.position.y=.75;root.add(body);root.position.x=x;scene.add(root);return root;}
const a=car(),b=car(4),c=car(8),system=createVehicleLighting(scene);
system.set(1);assert.equal(system.stats().vehicles,3);assert.equal(a.children[1].children.filter(o=>o.isMesh).length,4);assert.equal(system.update(camera),4);
assert.equal(scene.children.filter(o=>o.isSpotLight).length,4);
const glow=a.children[1].children.filter(o=>o.isSprite);assert.equal(glow.length,4);assert(glow.filter(o=>o.userData.vehicleGlow==='front').every(o=>o.visible));assert(glow.filter(o=>o.userData.vehicleGlow==='rear').every(o=>!o.visible));
let lights=scene.children.filter(o=>o.isSpotLight);assert(lights[0].target.position.z>lights[0].position.z);assert(lights[0].position.x<lights[1].position.x);assert(lights[0].position.distanceTo(lights[1].position)>1);
b.visible=c.visible=false;a.rotation.y=Math.PI;a.rotation.x=.15;system.update(camera);assert(lights[0].target.position.z<lights[0].position.z);b.visible=c.visible=true;
system.set(0);assert.equal(system.update(camera),0);assert.equal(a.children[1].visible,false);
system.set(1,'line');assert.equal(system.update(camera),0);
system.set(1);system.set(1);assert.equal(a.children.length,2);a.visible=false;system.update(camera);assert.equal(system.stats().activeLights,4);
scene.remove(b,c);system.set(1);assert.equal(system.stats().vehicles,1);assert.equal(system.update(camera),0);assert.equal(b.children.length,1);
car(2);system.set(1);assert.equal(system.stats().vehicles,2);assert.equal(system.update(camera),2);
system.dispose();assert.equal(scene.children.filter(o=>o.isSpotLight).length,0);console.log('PASS: day/night, rear/front, rotated/sloped vehicles, bounded lights, hidden/removed/new vehicles, cleanup');
// Bus cabin uses the existing textured body, without adding window geometry.
const bus=car();bus.userData.vehicleFamily='city-bus';bus.userData.dimensions=[2,3.2,5];
const busBody=bus.children[0],original=busBody.material;original.map=new T.Texture();
const cabinSystem=createVehicleLighting(scene);cabinSystem.set(1);
assert.equal(cabinSystem.stats().litBusCabins,1);
const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <emissivemap_fragment>'};
busBody.material.onBeforeCompile(shader);assert(shader.uniforms.busCabinStrength.value>0);
assert.equal(bus.children[1].children.filter(o=>o.isMesh).length,4);
cabinSystem.set(0);assert.equal(shader.uniforms.busCabinStrength.value,0);assert.equal(cabinSystem.stats().litBusCabins,0);
cabinSystem.set(1,'line');assert.equal(shader.uniforms.busCabinStrength.value,0);
cabinSystem.set(1);assert(shader.uniforms.busCabinStrength.value>0);
cabinSystem.dispose();assert.equal(busBody.material,original);
console.log('PASS: bus cabin night/day/line transitions, no added window geometry, material cleanup');

// Reinstalling illustration shading on a bus material clone must be idempotent.
const inkSource=(await readFile(new URL('../outputs/domestic-test/illustration-shading.js',import.meta.url),'utf8')).replace("from 'three'",`from '${three}'`);
const {createIllustrationShading}=await import('data:text/javascript;base64,'+Buffer.from(inkSource).toString('base64'));
const ink=createIllustrationShading();ink.install(scene);
const integrated=createVehicleLighting(scene);integrated.set(1);ink.install(scene);
const combined={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <emissivemap_fragment>\n#include <opaque_fragment>'};
busBody.material.onBeforeCompile(combined);
assert.equal(combined.fragmentShader.split('uniform float inkBrightness').length-1,1);
assert.equal(combined.fragmentShader.split('vec3 inkEmission=').length-1,1);
assert(combined.uniforms.busCabinStrength.value>0);integrated.dispose();
console.log('PASS: bus cabin and repeated illustration shader installation');
