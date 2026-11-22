import assert from 'node:assert/strict';
import * as T from 'three';
import {loadTexture,loadingErrorMessage} from '../outputs/domestic-test/texture-loading.js';
import {loadPedestrianAssets} from '../outputs/domestic-test/pedestrians.js';
import {loadVegetationAssets} from '../outputs/domestic-test/vegetation.js';
import {loadCanopyTexture,loadSpeciesTextures} from '../outputs/domestic-test/asset-encyclopedia/categories/nature/hybrid-tree.js';
import {TREE_SPECIES} from '../outputs/domestic-test/tree-species.js';
const event=new Event('error'),texture={};let calls=0;
assert.equal(await loadTexture({loadAsync:async()=>{calls++;return texture;}},'ok.webp'),texture);assert.equal(calls,1);
calls=0;assert.equal(await loadTexture({loadAsync:async()=>{if(++calls===1)throw event;return texture;}},'ok.webp'),texture);assert.equal(calls,2);
calls=0;await assert.rejects(loadTexture({loadAsync:async()=>{calls++;throw event;}},'https://user:secret@example.com/path/woman.webp?token=private#hidden'),error=>{assert.equal(error.cause,event);assert(error.message.includes('woman.webp'));assert(!/secret|private|token|hidden|example/.test(error.message));return true;});assert.equal(calls,2);
assert(!loadingErrorMessage(event).includes('undefined'));assert(loadingErrorMessage(null).length);assert.equal(loadingErrorMessage(Error('detail')),'detail');
const original=T.TextureLoader.prototype.loadAsync,originalFetch=globalThis.fetch;let created=[],failURL;
T.TextureLoader.prototype.loadAsync=async function(url){if(failURL&&url.includes(failURL))throw event;const t=new T.Texture();t.userData.disposals=0;t.dispose=()=>t.userData.disposals++;created.push(t);return t;};
try{
 failURL='bad.webp';created=[];await assert.rejects(loadPedestrianAssets({people:[{id:'a',image:'good.webp'},{id:'b',image:'bad.webp'}]}),/bad.webp/);assert.equal(created.length,1);assert.equal(created[0].userData.disposals,1);
 created=[];await assert.rejects(loadVegetationAssets({assets:[{id:'a',image:'good.webp'},{id:'b',image:'bad.webp'}]}),/bad.webp/);assert.equal(created.length,1);assert.equal(created[0].userData.disposals,1);
 failURL=null;created=[];globalThis.fetch=async()=>({ok:false});await assert.rejects(loadCanopyTexture(TREE_SPECIES[0].id),/나무 잎/);assert.equal(created[0].userData.disposals,1);
 created=[];let fetched=0;globalThis.fetch=async()=>({ok:++fetched!==1,json:async()=>Object.fromEntries(TREE_SPECIES.map(s=>[s.id,{frames:[]}]))});await assert.rejects(loadSpeciesTextures());assert.equal(created.length,TREE_SPECIES.length);assert(created.every(t=>t.userData.disposals===1),'failed leaf owns its texture; batch frees each successful leaf');
}finally{T.TextureLoader.prototype.loadAsync=original;globalThis.fetch=originalFetch;}
console.log('Texture loading: 1/2 attempt contract, safe filename/cause, non-Error fallback and three consumer cleanup paths passed');
