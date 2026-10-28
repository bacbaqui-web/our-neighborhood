import fs from 'node:fs';
import * as T from '../../outputs/domestic-test/vendor/three.module.js';
import {GLTFLoader} from '../../outputs/domestic-test/vendor/GLTFLoader.js';
globalThis.ProgressEvent=class ProgressEvent{constructor(type,data){Object.assign(this,{type},data)}};
const root=new URL('../../outputs/domestic-test/',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('vehicle-catalog.json',root))),out={};
const lengths={'grand-starex-school':5.15,'city-bus':10.8,porter2:5.1,'porter2-delivery':5.1,'sonata-dn8':4.9,ray:3.595,'carnival-ka4':5.15,'grandeur-ig':4.93,'spark-m400':3.595};
for(const a of catalog.items.filter(a=>a.status==='등록')){
 const raw=fs.readFileSync(new URL(a.model,root)),n=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+n)),bin=raw.subarray(28+n);
 delete doc.images;delete doc.textures;doc.materials=[{}];for(const m of doc.meshes)for(const p of m.primitives)p.material=0;
 doc.buffers[0].uri='data:application/octet-stream;base64,'+bin.toString('base64');
 const original=(await new GLTFLoader().parseAsync(JSON.stringify(doc),'')).scene;
 let b=new T.Box3().setFromObject(original),s=b.getSize(new T.Vector3());if(s.x>s.z)original.rotation.y=Math.PI/2;original.updateMatrixWorld(true);b=new T.Box3().setFromObject(original);s=b.getSize(new T.Vector3());
 const scale=(lengths[a.family]||4.7)/s.z,width=({'city-bus':2.9,ray:1.95,'spark-m400':1.95,'porter2-delivery':2.3,'grand-starex-school':2.2}[a.family]||2.35);
 out[a.id]={size:[Math.min(s.x*scale,width),a.family==='city-bus'?3.2:s.y*scale,s.z*scale],family:a.family};
}
fs.writeFileSync(new URL('browser-generation/vehicle-bounds.json',root),JSON.stringify(out));console.log('Measured',Object.keys(out).length,'registered models');
