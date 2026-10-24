import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../outputs/domestic-test/load-data.js',import.meta.url),'utf8');
const {loadData}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=new Uint8Array(24),header=new DataView(data.buffer);
header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,data.length,true);
const response=headers=>new Response(data,{headers});
assert.equal((await loadData('model.glb','glb',async()=>response({'content-length':'24'}))).byteLength,24);
// A CDN advertises compressed length, while fetch returns decompressed bytes.
assert.equal((await loadData('model.glb','glb',async()=>response({'content-encoding':'gzip','content-length':'17'}))).byteLength,24);
let attempts=0;
await assert.rejects(loadData('model.glb','glb',async()=>{attempts++;return response({'content-length':'30'});}),/전송이 중간/);
assert.equal(attempts,2);
await assert.rejects(loadData('broken.glb','glb',async()=>new Response('not a glb')),/비어 있습니다/);
const code=await readFile(new URL('../outputs/domestic-test/location-loader.js',import.meta.url),'utf8');
assert(!code.includes("fetch('/api/"),'API URLs must preserve the deployment prefix');
for(const host of ['http://localhost:8765/domestic-test/location-loader.js','https://example.test/our-neighborhood/domestic-test/location-loader.js']){
 const expected=host.replace('domestic-test/location-loader.js','generated-neighborhoods/test/data/');
 assert.equal(new URL('../generated-neighborhoods/test/data/',host).href,expected);
}
console.log('Loading checks passed: CDN compression, complete GLB, retries, subpath URLs.');
