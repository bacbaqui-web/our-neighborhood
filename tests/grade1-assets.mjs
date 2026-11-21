import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from '../outputs/domestic-test/vendor/GLTFLoader.js';
import {grade1Factories, createSecurityLamp} from '../outputs/domestic-test/grade1-street/models.js';
import {grade1Assets} from '../outputs/domestic-test/grade1-street/catalog.js';

const directory = new URL('../outputs/domestic-test/grade1-street/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', directory)));
assert.equal(grade1Assets.length, 8);
assert.deepEqual(new Set(Object.keys(grade1Factories)), new Set(grade1Assets.map(asset => asset.key)));
for (const {key, support, reference, size} of grade1Assets) {
 const model = grade1Factories[key]();
 const bounds = new T.Box3().setFromObject(model);
 const measured = bounds.getSize(new T.Vector3()).toArray();
 assert.equal(model.userData.support, support);
 assert.equal(model.userData.front, '+Z');
 assert.equal(reference.approvedOn, '2026-11-22');
 assert.match(reference.photoId, /^roadview-100\/\d{3}$/);
 assert.ok(measured.every((value, i) => Math.abs(value - size[i]) < .012), key + ' catalog size');
 assert.ok(manifest[key].triangles > 100 && manifest[key].triangles < 8500, key + ' triangle budget');
 assert.ok(manifest[key].materials <= 7, key + ' material budget');
 if (support === 'wall') assert.ok(Math.abs(bounds.min.z) < .0001, key + ' wall plane');
 else assert.ok(Math.abs(bounds.min.y) < .0001, key + ' ground plane');
 for (const point of model.userData.contactPoints) {
  assert.ok(bounds.clone().expandByScalar(.0002).containsPoint(new T.Vector3(...point)), key + ' contact');
  assert.equal(point[support === 'wall' ? 2 : 1], 0);
 }
 const glb = await readFile(new URL(key + '-v1.glb', directory));
 const scene = (await new GLTFLoader().parseAsync(new Uint8Array(glb).buffer, '')).scene;
 const reloaded = new T.Box3().setFromObject(scene);
 assert.ok(reloaded.min.distanceTo(bounds.min) < .0001, key + ' reloaded min');
 assert.ok(reloaded.max.distanceTo(bounds.max) < .0001, key + ' reloaded max');
}
const lamp = createSecurityLamp({poleRadius:.14, emissiveIntensity:.9});
const emitter = lamp.children.find(mesh => mesh.userData.lampEmitter);
assert.ok(emitter);
assert.equal(emitter.material.emissiveIntensity, .9);
assert.ok(new T.Box3().setFromObject(lamp).min.z < -.28, 'bands wrap behind the pole');
assert.ok(lamp.userData.lightOrigin[2] > .5);
console.log('8 grade-1 props: contacts, catalog dimensions, material budgets, GLB round-trips and lit pole lamp');
