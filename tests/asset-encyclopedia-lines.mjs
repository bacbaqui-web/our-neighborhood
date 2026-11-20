import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyRemakes} from '../outputs/domestic-test/asset-encyclopedia/remakes.js';
import {canonicalId} from '../outputs/domestic-test/asset-encyclopedia/curation.js';
import {props} from '../outputs/domestic-test/prop-remakes/catalog.js';
import {CATALOG_LINES} from '../outputs/domestic-test/asset-encyclopedia/line-options.js';
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url);
const raw=JSON.parse(fs.readFileSync(new URL('catalog.json',base))).entries;
const original=JSON.stringify(raw), entries=applyRemakes(raw);
assert.equal(JSON.stringify(raw),original);
assert.equal(entries.filter(a=>a.remade).length,18);
for(const p of props){const a=entries.find(a=>a.id===canonicalId('road:'+p.old));assert(a?.remade,p.key);assert.equal(a.triangles,p.triangles);assert(fs.existsSync(new URL(a.file,base)));assert(fs.existsSync(new URL(a.originalFile,base)));assert(!entries.some(a=>a.id==='prototype:'+p.key+'-v1'));}
for(const [k,v] of Object.entries({lines:true,outerWidth:2,outerFace:true,outerBrightness:77,outerSaturation:200,minDistance:200,acrossObjects:true,innerWidth:2,innerAngle:16.4,innerFace:true,innerBrightness:90,innerSaturation:152}))assert.equal(CATALOG_LINES[k],v,k);
console.log('18 canonical replacements, preserved originals, no duplicate candidates, screenshot settings passed');
