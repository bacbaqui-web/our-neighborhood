import assert from 'node:assert/strict';
import * as T from '../outputs/domestic-test/vendor/three.module.js';
// Worker environment has no document; this minimal canvas records actual pixel generation.
let painted=0;
globalThis.OffscreenCanvas=class {
 constructor(width,height){this.width=width;this.height=height;}
 getContext(){return new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{assert.equal(image.data[3],255);painted++;},createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});}
};
const {applyRoadContext}=await import('../outputs/domestic-test/road-context.js');
const root=new T.Group();
applyRoadContext(root,{positions:{asphalt:[0,0,0,10,0,0,0,0,10]},roadPriority:true,qa:{}});
assert.equal(painted,1);assert.equal(root.children[0].children[0].name,'road');
assert.equal(root.children[0].children[0].material.map.image.width,1024);
console.log('Worker road surface generates asphalt without document');
