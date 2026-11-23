import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planPharmacy,id} from '../outputs/domestic-test/assembly-rules/pharmacy-local.js';
const {entries}=JSON.parse(await readFile(new URL('../outputs/domestic-test/asset-encyclopedia/categories/commerce/catalog.json',import.meta.url)));
const resolve=id=>entries.find(a=>a.id===id);
for(const width of [4.8,6.4,9])for(const height of [2.7,3.3])for(const depth of [3.5,5]){const p=planPharmacy(resolve,{width,height,depth});assert.equal(p.requiredFailures.length,0);const furniture=p.placed.filter(a=>a.layer==='interior');for(const a of furniture){const d=resolve(a.assetId).assembly.dimensions,w=a.yaw?d.depth:d.width,z=a.yaw?d.width:d.depth;assert.ok(Math.abs(a.x)+w/2<width/2);assert.ok(a.z-z/2>=-depth);assert.ok(a.z+z/2<=0);}}
const narrow=planPharmacy(resolve,{width:4.8}),wide=planPharmacy(resolve,{width:9});assert.ok(wide.shelfCount>narrow.shelfCount);assert.equal(narrow.placed.find(a=>a.assetId===id('counter')).yaw,0);assert.equal(planPharmacy(resolve,{frontDepth:0}).omitted.length,2);assert.equal(planPharmacy(a=>a===id('counter')?null:resolve(a)).requiredFailures.length,2);assert.throws(()=>planPharmacy(resolve,{width:4}));console.log('PASS: 12 size combinations, furniture bounds, rear reception, repeating modules, missing required assets and unsupported size');

const {frontage}=await import('../outputs/domestic-test/asset-encyclopedia/categories/commerce/pharmacy-local/frontage.js');for(const height of [2.7,3,3.3]){const d=frontage({height});assert.equal(d.doorTop-d.floor,2.4);assert.ok(d.transomHeight>.2);assert.ok(d.signBottom>d.glassTop);assert.ok(Math.abs(d.fasciaHeight-.28)<1e-8);}console.log('PASS: door height, transom and fascia across ceiling heights');

for(const width of [4.8,6.4,9]){const d=frontage({width});assert.ok(Math.abs((.825+d.side)-(width/2-.06))<1e-8);const plan=planPharmacy(resolve,{width});for(const p of plan.placed.filter(p=>p.assetId.includes('poster-'))){assert.ok(Math.abs(p.x)+.24<width/2-.06);assert.ok(Math.abs(p.x)-.24>.825);assert.equal(p.z,-.012);}}console.log('PASS: wall/window contact and poster glass bounds at all widths');

for(const width of [4.8,6.4,9])for(const depth of [3.5,4,5]){const plan=planPharmacy(resolve,{width,depth});const parts=plan.placed.filter(p=>p.layer==='interior');const bounds=p=>{const d=resolve(p.assetId).assembly.dimensions;return {x:p.x,z:p.z,w:p.yaw?d.depth:d.width,h:p.yaw?d.width:d.depth};};for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const a=bounds(parts[i]),b=bounds(parts[j]);if(parts[i].supportIndex!==undefined&&parts[j].instanceId==='pharmacy-'+parts[i].supportIndex||parts[j].supportIndex!==undefined&&parts[i].instanceId==='pharmacy-'+parts[j].supportIndex)continue;assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2-.001||Math.abs(a.z-b.z)>=(a.h+b.h)/2-.001,'Furniture overlap');}const counter=parts.find(p=>p.assetId===id('counter'));assert.ok(counter.z+.35<=-.8);assert.ok((counter.z-.35)-(-depth+.6)>=.749);}
console.log('PASS: internal furniture collisions, customer space and 0.75m staff aisle');

const standard=planPharmacy(resolve);assert.equal(standard.counterLength,3.6);assert.equal(standard.shelfCount,3);assert.equal(standard.placed.filter(p=>p.assetId===id('lowdisplay')).length,2);
assert.ok(wide.counterLength>standard.counterLength);
console.log('PASS: longer modular reception, full rear storage and two window displays');

for(const width of [4.8,6.4,9]){const p=planPharmacy(resolve,{width});for(const item of p.placed.filter(a=>a.supportIndex!==undefined)){const counter=p.placed.find(a=>a.instanceId==='pharmacy-'+item.supportIndex);assert.equal(counter.assetId,id('counter'));const d=resolve(item.assetId).assembly.dimensions;assert.ok(Math.abs(item.x-counter.x)+d.width/2<=.9);assert.ok(Math.abs(item.z-counter.z)+d.depth/2<=.35);assert.ok(Math.abs(item.y-(counter.y+1.02))<1e-8);}}
console.log('PASS: countertop props rest on their support and stay within its surface');

for(const width of [4.8,6.4,9]){const d=frontage({width});assert.equal(d.frostTop,d.handleBottom);assert.equal(d.signSideGap,.28);assert.ok(Math.abs((-d.signLeftX-.39-d.signNameWidth/2)-.28)<1e-8);assert.ok(Math.abs((d.signRightX-.34-d.signNameWidth/2)-.28)<1e-8);assert.ok(Math.abs(d.signLeftX)+.39<(width-.15)/2);assert.ok(d.signRightX+.34<(width-.15)/2);}
console.log('PASS: handle-height frost and fixed sign group spacing across widths');

for(const width of [4.8,6.4,9]){const p=planPharmacy(resolve,{width});assert.equal(p.placed.filter(a=>a.assetId===id('doorprint')).length,2);assert.equal(p.placed.filter(a=>a.assetId===id('window-papers')).length,0);for(const a of p.placed.filter(a=>[id('doorprint'),id('window-papers')].includes(a.assetId)))assert.ok(a.z<0);}
console.log('PASS: door and window decal assets are registered and mounted inside glazing');

for(const height of [2.7,3,3.3]){const d=frontage({height});assert.equal(d.glassLabelCenter,(d.frostTop+d.glassTop)/2);assert.ok(d.glassLabelCenter-.74>d.frostTop);}
console.log('PASS: window lettering centered in clear glazing above frost');

for(const width of [4.8,6.4,9]){const p=planPharmacy(resolve,{width});const papers=p.placed.filter(a=>a.assetId===id('a4-notice'));assert.equal(papers.length,12);for(const a of papers){assert.ok(a.y>=1.15&&a.y+.42<2.25);assert.ok(a.z<0);assert.ok(Math.abs(a.x)+.1485<width/2);assert.ok(Math.abs(a.x)+.1485<.80||Math.abs(a.x)-.1485>.85);}for(let i=0;i<papers.length;i++)for(let j=i+1;j<papers.length;j++)assert.ok(Math.abs(papers[i].x-papers[j].x)>.297||Math.abs(papers[i].y-papers[j].y)>.42);}
console.log('PASS: twelve enlarged A3 sheets, middle height, door clearance and no paper overlap across widths');
