import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from '../../outputs/domestic-test/vendor/GLTFLoader.js';
const root=new URL('../../outputs/domestic-test/cars/avante-cn7-mesh-v91/',import.meta.url);
const file=await fs.readFile(new URL('avante-cn7.glb',root));
assert.equal(file.readUInt32LE(0),0x46546c67);
const json=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString().trim());
assert.equal(json.images?.length??0,0,'GLB must contain no image textures');
assert.equal(json.textures?.length??0,0,'All colour must be constant material factors');
const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
const scene=gltf.scene;scene.rotation.y=Math.PI;scene.updateMatrixWorld(true);
let triangles=0,meshCount=0,invalidVertices=0,invalidNormals=0,degenerateTriangles=0;
const tires=[],bodies=[];
scene.traverse(o=>{
 if(!o.isMesh)return;meshCount++;
 const p=o.geometry.getAttribute('position'),n=o.geometry.getAttribute('normal');
 for(const v of p.array)if(!Number.isFinite(v))invalidVertices++;
 for(const v of n.array)if(!Number.isFinite(v))invalidNormals++;
 const index=o.geometry.index?.array??Array.from({length:p.count},(_,i)=>i);
 triangles+=index.length/3;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<index.length;i+=3){a.fromBufferAttribute(p,index[i]);b.fromBufferAttribute(p,index[i+1]);c.fromBufferAttribute(p,index[i+2]);if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-18)degenerateTriangles++;}
 const box=new T.Box3().setFromObject(o),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 if(/tire$/i.test(o.name))tires.push({name:o.name,minY:box.min.y,center:center.toArray(),size:size.toArray()});
 if(/Body_shell/.test(o.name))bodies.push({name:o.name,size:size.toArray()});
 for(const value of Object.values(o.material))assert(!value?.isTexture,`Unexpected map: ${o.name}`);
});
assert.equal(invalidVertices,0);assert.equal(invalidNormals,0);assert.equal(tires.length,4);
for(const tire of tires){assert(Math.abs(tire.minY)<1e-5,'Tire must touch ground');assert(Math.abs(Math.abs(tire.center[2])-1.36)<1e-5);assert(Math.abs(Math.abs(tire.center[0])-.8025)<1e-5);}
assert(bodies.length>=1);assert(bodies.some(b=>Math.abs(b.size[2]-4.71)<.002));
assert(triangles<=2000,`Triangle budget exceeded: ${triangles}`);
const result={assetVersion:91,meshCount,triangles,materials:json.materials.length,imageTextures:0,invalidVertices,invalidNormals,degenerateTriangles,tires,bodies};
await fs.writeFile(new URL('qa.json',root),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
