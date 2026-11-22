import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from '../outputs/domestic-test/vendor/GLTFLoader.js';
import {loadStoredModel} from '../outputs/domestic-test/asset-encyclopedia/model-resources.js';
import {loadCanopyTexture} from '../outputs/domestic-test/asset-encyclopedia/categories/nature/hybrid-tree.js';
import {TREE_SPECIES} from '../outputs/domestic-test/tree-species.js';
import * as oldFacade from '../outputs/domestic-test/korean-facades.js';
import * as facade from '../outputs/domestic-test/asset-encyclopedia/categories/house/korean-facades.js';
import * as oldTexture from '../outputs/domestic-test/facade-textures.js';
import * as texture from '../outputs/domestic-test/asset-encyclopedia/categories/house/facade-textures.js';
import {previewModel} from '../outputs/domestic-test/asset-encyclopedia/categories/house/building-preview.js';
import {createModel} from '../outputs/domestic-test/asset-encyclopedia/models.js';
const outputs=fileURLToPath(new URL('../outputs/',import.meta.url)),base=path.join(outputs,'domestic-test/asset-encyclopedia');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'model-source-ownership.json'))).sources,seen=new Map();
const domains=['house','commerce','nature','vehicle','prop','road','person'];
for(const domain of domains){
 const todo=[path.join(base,'categories',domain,'models.js')],visited=new Set();
 while(todo.length){const file=todo.pop();if(visited.has(file))continue;visited.add(file);
 const rel=path.relative(outputs,file);if(rel.includes('/vendor/'))continue;
 assert(!/(?:^|\/)(?:details|tree-planting|view-generation-visibility|preview-assembly|neighborhood-plan|site-layout)\.js$|\/placement\.js$/.test(rel),`model depends on placement: ${rel}`);
 assert(fs.existsSync(file),`missing import ${rel}`);assert(manifest[rel]?.domains.includes(domain),`unowned ${domain}: ${rel}`);
 seen.set(rel,true);
 const source=fs.readFileSync(file,'utf8');
 for(const match of source.matchAll(/\b(?:from\s*|import\s*\(|import\s+)\s*['"]([^'"]+)['"]/g)){const spec=match[1].split('?')[0];if(spec.startsWith('.'))todo.push(path.resolve(path.dirname(file),spec));}
 }
}
assert.deepEqual([...seen.keys()].sort(),Object.keys(manifest).sort());
for(const [old,current] of [[oldFacade,facade],[oldTexture,texture]]){assert.deepEqual(Object.keys(old),Object.keys(current));for(const key of Object.keys(old))assert.equal(old[key],current[key]);}
assert.throws(()=>previewModel({}),/연결|createDetails|필요/);
await assert.rejects(()=>createModel({id:'bad',kind:'glb'}),/분류/);
await assert.rejects(()=>createModel({id:'part',kind:'part',taxonomy:{domain:'house'}}),/미리보기/);
await assert.rejects(()=>createModel({id:'portrait',kind:'image',taxonomy:{domain:'person'}}),/생성기/);
const vehicle=await createModel({id:'vehicle-test',kind:'korean',key:213,taxonomy:{domain:'vehicle'}});assert(vehicle.children.length>10);
await assert.rejects(()=>createModel({id:'commercial-test',kind:'building',pack:'sungshin-commercial',key:'missing',taxonomy:{domain:'commerce'}}),/상가를 찾을/);
// Capture actual loader/fetch inputs; no network or canvas is used.
const originalTexture=T.TextureLoader.prototype.loadAsync,originalGLTF=GLTFLoader.prototype.loadAsync,originalFetch=globalThis.fetch;
const urls=[];
try{
 T.TextureLoader.prototype.loadAsync=async url=>{urls.push(String(url));return new T.Texture();};
 globalThis.fetch=async url=>{urls.push(String(url));return{ok:true,json:async()=>Object.fromEntries(TREE_SPECIES.map(s=>[s.id,{frames:[]}]))};};
 const oldTreeURL=new URL('../outputs/domestic-test/hybrid-tree.js',import.meta.url);
 for(const species of TREE_SPECIES){urls.length=0;await loadCanopyTexture(species.id);assert.equal(urls[0],new URL(species.atlas||'./vegetation/clusters/broadleaf-flat-v46.png',oldTreeURL).href);assert.equal(urls[1],new URL('./vegetation/species-v65/frames.json',oldTreeURL).href);}
 GLTFLoader.prototype.loadAsync=async url=>{urls.push(String(url));return{scene:new T.Group()};};
 urls.length=0;await loadStoredModel({kind:'glb',file:'../building-remakes/example.glb'});
 assert.equal(urls[0],new URL('../outputs/domestic-test/building-remakes/example.glb',import.meta.url).href);
}finally{T.TextureLoader.prototype.loadAsync=originalTexture;GLTFLoader.prototype.loadAsync=originalGLTF;globalThis.fetch=originalFetch;}
console.log(`PASS: ${seen.size} owned model modules, seven providers, no placement dependency, compatibility identity, explicit preview errors, tree/GLB URL parity.`);
