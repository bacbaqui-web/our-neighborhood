import assert from 'node:assert/strict';
import * as T from '../outputs/domestic-test/vendor/three.module.js';
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const {createPart,dimensions}=await import('../outputs/domestic-test/asset-encyclopedia/categories/commerce/bakery-local/model.js');
for(const width of [3.2,4.8,6.4,9]){
 const s=createPart('sign',{width});s.updateMatrixWorld(true);
 const name=s.getObjectByName('Name'),label=s.getObjectByName('BakeryLabel');
 assert(!s.getObjectByName('BreadMark'));
 assert(Math.abs(name.position.x-.47-(-(width-.16)/2+.10))<1e-8);
 assert(Math.abs(label.position.x+.36-((width-.16)/2-.10))<1e-8);
 assert(s.getObjectByName('CreamSlopedCanopy').rotation.x>.9);
}
const d=dimensions();assert.equal(d.width,3.2);assert(d.signTop/d.width>1.4);
const c=createPart('showcase');c.updateMatrixWorld(true);assert(!c.getObjectByName('DisplayBreadBlock'));
let products=0,trays=0;const heights=new Set();
c.traverse(o=>{if(o.name==='TexturedBreadGroup'){products++;const b=new T.Box3().setFromObject(o);assert(b.min.y>.88&&b.max.y<1.63);assert(b.min.x>-.69&&b.max.x<.69);assert(b.min.z>-.34&&b.max.z<.34);}if(o.name==='BreadTray'){trays++;heights.add(o.position.y);}if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));});
assert.equal(products,12);assert.equal(trays,6);assert.equal(heights.size,2);assert(c.getObjectByName('CaseFrontGlass').material.transparent);
console.log('PASS model geometry: reference proportions, edge-aligned sign, open glass case, two tray tiers and 12 textured bread groups inside glazing');
