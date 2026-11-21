import assert from 'node:assert/strict';
import * as T from 'three';
import {prepareBuildingIdentity,addIdentitySign} from '../outputs/domestic-test/building-remakes/identity.js';
// Model browser image loading asynchronously: constructing an approved logo must wait.
const pending=[],drawn=[];
globalThis.Image=class{naturalWidth=1024;naturalHeight=256;set src(value){this.url=value;pending.push(this);}};
const context=new Proxy({drawImage(img){assert(img.loaded,'logo drawn before image loaded');drawn.push(img.url);},measureText:()=>({width:400})},{get(target,key){return target[key]??(()=>{});}});
globalThis.document={createElement:()=>({getContext:()=>context})};
const root=new T.Group(),sign=key=>addIdentitySign(root,{key,x:0,y:1,z:0,w:2,h:.5});
assert.throws(()=>sign('costco'),/준비가 끝나지/);
const first=prepareBuildingIdentity();
assert.equal(prepareBuildingIdentity(),first,'concurrent galleries should share preparation');
assert.equal(pending.length,7);
let finished=false;first.then(()=>{finished=true;});
await Promise.resolve();assert.equal(finished,false);
for(const image of pending){image.loaded=true;image.onload();}
await first;
for(const key of ['costco','gs25','homeplus','starbucks','starbucks-emblem','police-emblem','fire-emblem'])sign(key);
assert.equal(drawn.length,7);
assert.equal(root.children.length,7);
assert(root.children.every(o=>o.material.map.isCanvasTexture));
assert.equal(prepareBuildingIdentity(),first,'completed preparation should be reused');
console.log('Browser logo preload waits for all seven images and enables every image-backed sign.');
