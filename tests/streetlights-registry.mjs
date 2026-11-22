import assert from 'node:assert/strict';
import {createStreetlights} from '../outputs/domestic-test/streetlights.js';
import {curation} from '../outputs/domestic-test/asset-encyclopedia/curation.js';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
const item={id:'audit-lamp',type:'wall',root:[0,0,0],direction:[0,1],height:4,reach:1,intensity:80};
const previous=curation.items['grade1:security-lamp'];
try {
 const visible=createStreetlights({lights:[item],qa:{}},()=>0,()=>null,{shadowMap:{}});
 assert.equal(visible.heads.length,1);assert(visible.group.children.some(o=>o.userData.assetId==='grade1:security-lamp'));
 visible.dispose();
 curation.items['grade1:security-lamp']={state:'deleted'};
 const removed=createStreetlights({lights:[item],qa:{}},()=>0,()=>null,{shadowMap:{}});
 assert.equal(removed.heads.length,0,'백과에서 제외한 보안등의 등기구와 광원은 함께 제외해야 합니다.');
 assert(!removed.group.children.some(o=>o.userData.assetId==='grade1:security-lamp'));
 removed.dispose();
} finally {if(previous)curation.items['grade1:security-lamp']=previous;else delete curation.items['grade1:security-lamp'];}
console.log('Security lamp registry exclusion removes fixture and light sources together.');
