import assert from 'node:assert/strict';
import {createSignLettering,signCanvasSize} from '../outputs/domestic-test/sungshin-commercial/sign-lettering.js';
import {signDesigns} from '../outputs/domestic-test/sungshin-commercial/sign-designs.js';
let draws=[];
const context={font:'',fillRect(){},strokeRect(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},arc(){},ellipse(){},fill(){},stroke(){},save(){},restore(){},translate(){},rotate(){},
  measureText(value){return {width:[...value].length*parseFloat(this.font.match(/[\d.]+(?=px)/)[0])*.72};},
  fillText(value,x,y,...extra){assert.equal(extra.length,0,'글자를 가로로 압축하면 안 됩니다.');draws.push({value,x,y,font:this.font});}};
globalThis.document={createElement(){return {width:0,height:0,getContext(){return context;}};}};
for(const [key,design] of Object.entries(signDesigns))for(const [w,h] of [[8,.65],[2,1],[.7,3]]){
  draws=[];const t=createSignLettering(key,w,h);assert(t?.isCanvasTexture,key);
  assert(Math.abs(t.image.width/t.image.height-w/h)<.1,key+' 판형');
  assert(draws.length>0,key);assert(draws.every(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)));
  assert(t.userData.uniformGlyphScale);
}
assert.equal(createSignLettering('unknown:0',1,1),null);
assert.throws(()=>signCanvasSize(0,2));
console.log(Object.keys(signDesigns).length+'개 간판 디자인, 가로·정사각·세로 판형과 비균등 글자 확대 방지 검사 통과');
