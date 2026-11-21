import assert from 'node:assert/strict';
import * as T from 'three';
import {addIdentitySign} from '../outputs/domestic-test/building-remakes/identity.js';
const scales=[];
const ctx=new Proxy({measureText:()=>({width:900}),scale:(x,y)=>scales.push([x,y])},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};
for(const [text,w,h] of [['경찰서',6.1,1.7],['소방서',5,1.6],['긴이름도찌그러지지않게',2,1.6]]){
 const root=new T.Group();addIdentitySign(root,{key:text,x:0,y:3,z:0,w,h,options:{text,preserveAspect:true,size:230}});
 const [sx,sy]=scales.at(-1);assert.equal(sx,sy,text+' glyph aspect changed');assert(sx<=1);assert(root.children[0].material.map.isCanvasTexture);
}
console.log('Police/fire lettering keeps the same horizontal and vertical glyph scale.');
