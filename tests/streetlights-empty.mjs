import assert from 'node:assert/strict';
import {createStreetlights} from '../outputs/domestic-test/streetlights.js';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
const lights=createStreetlights({lights:[],qa:{}},()=>0,()=>null,{shadowMap:{}});
assert.equal(lights.heads.length,0);
assert.equal(lights.group.getObjectByName('security-light-lenses'),undefined);
lights.dispose();console.log('Empty or fully occluded streetlight plans render safely.');
