import assert from'node:assert/strict';import * as T from'../outputs/domestic-test/vendor/three.module.js';
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const{createPart,definitions}=await import('../outputs/domestic-test/asset-encyclopedia/categories/commerce/bakery-blue/model.js');
for(const key of Object.keys(definitions)){const p=createPart(key);assert.equal(p.userData.assetId,'commerce:bakery-blue-'+key);p.traverse(o=>{if(o.geometry)for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v),key);});}
for(const [key,levels]of[['wallrack',3],['island',1]]){const r=createPart(key);assert.equal(r.children.filter(c=>c.name==='OpenShelf').length,levels);assert.equal(r.children.filter(c=>c.name==='BreadTray').length,levels*3);assert(r.children.some(c=>c.name==='TexturedBreadGroup'));}
const sign=createPart('sign');assert(sign.getObjectByName('GoldBorder'));assert(sign.getObjectByName('LeftCopy').position.x<sign.getObjectByName('Name').position.x);assert(createPart('awning').getObjectByName('StripedSlope'));
console.log('PASS 17 assets: finite geometry, isolated IDs, open shelf tiers, bread groups, separate gold-border sign and striped awning');
const board=createPart('board');board.updateMatrixWorld(true);
const front=board.getObjectByName('AFrameFront'),back=board.getObjectByName('AFrameBack');
const upperGap=Math.abs(front.localToWorld(new T.Vector3(0,.47,0)).z-back.localToWorld(new T.Vector3(0,.47,0)).z);
const lowerGap=Math.abs(front.localToWorld(new T.Vector3(0,-.47,0)).z-back.localToWorld(new T.Vector3(0,-.47,0)).z);
assert(lowerGap>.40 && upperGap<.05,'A frame must widen toward its feet');
const poster=board.getObjectByName('PinkBreadPoster');assert.equal(poster.rotation.x,front.rotation.x);
const localPoster=front.worldToLocal(poster.getWorldPosition(new T.Vector3()));assert(Math.abs(localPoster.z-.024)<1e-6,'poster flush with front face');
assert(new T.Vector3(0,0,1).applyQuaternion(poster.getWorldQuaternion(new T.Quaternion())).z>0,'poster faces outside');
console.log('PASS A-frame feet spread, top closes, poster flush and outward-facing');
