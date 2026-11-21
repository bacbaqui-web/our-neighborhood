import {writeFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFExporter} from '../../outputs/domestic-test/vendor/GLTFExporter.js';
import {grade1Factories} from '../../outputs/domestic-test/grade1-street/models.js';

globalThis.FileReader = class {
 readAsArrayBuffer(blob) {
  blob.arrayBuffer().then(result => {
   this.result = result;
   this.onloadend?.();
  }, error => this.onerror?.(error));
 }
};

const directory = new URL('../../outputs/domestic-test/grade1-street/', import.meta.url);
const manifest = {};
for (const [key,create] of Object.entries(grade1Factories)) {
 const model = create();
 const bounds = new T.Box3().setFromObject(model);
 const size = bounds.getSize(new T.Vector3()).toArray().map(value=>Number(value.toFixed(4)));
 const file = key + '-v1.glb';
 const bytes = await new GLTFExporter().parseAsync(model,{binary:true});
 await writeFile(new URL(file,directory),Buffer.from(bytes));
 manifest[key] = {
  file, size, bytes:bytes.byteLength, materials:model.children.length,
  triangles:model.children.reduce((sum,mesh)=>sum+(mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count)/3,0),
 };
}
await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');
console.table(manifest);
