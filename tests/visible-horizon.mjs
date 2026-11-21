import assert from 'node:assert/strict';
import {createHorizon,createTileFrontier,tileBounds} from '../outputs/domestic-test/visible-horizon-policy.js';
const box=(owner,x,z,w=20,height=12,base=0)=>({key:String(owner),owner,height,base,top:base+height,rings:[[[x-w/2,z-w/2],[x+w/2,z-w/2],[x+w/2,z+w/2],[x-w/2,z+w/2]]]});
const h=createHorizon({position:[0,0],eyeHeight:2});
let visible=h.rebuild([box(1,100,0,30,9),box(2,400,0,30,9),box(3,650,0,30,90)]);
assert.deepEqual(visible.map(b=>b.owner),[1,3],'hidden low building omitted, tall far building retained');
visible=h.rebuild([box(4,5000,0,20,30)]);assert.equal(visible.length,1,'no 250m or 3km cutoff');
const many=Array.from({length:300},(_,i)=>box(i,1000*Math.cos(i*Math.PI*2/300),1000*Math.sin(i*Math.PI*2/300),4,15));
assert.equal(h.rebuild(many).length,300,'no 256-building cutoff, thin silhouettes retained');
h.rebuild([box(5,5000,0,1000,600)]);assert(h.tileVisible(1,0),'a farther building must not occlude a nearer query tile');
const f=createTileFrontier();const seen=new Set();for(let i=0;i<100;i++){const t=f.next();assert(t);assert(!seen.has(`${t.x},${t.z}`));seen.add(`${t.x},${t.z}`);f.expand(t);}
assert(tileBounds([37.62,127.02],50,0)[0]>127.1,'queries can expand beyond the old limit');
console.log('Visibility: far/tall/thin buildings, occlusion, 300 buildings, frontier uniqueness and outward queries passed');

const thin=(owner,x,top)=>({key:String(owner),owner,top,height:top,base:0,rings:[[[x,-1],[x+10,-1],[x+10,1],[x,1]]]});
assert.deepEqual(h.rebuild([thin(1,1000,30),thin(2,2000,10)]).map(b=>b.owner),[1]);
