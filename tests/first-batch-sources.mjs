import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../outputs/domestic-test/',import.meta.url);
const report=JSON.parse(readFileSync(new URL('first-batch-review/sources.json',root)));
assert.equal(report.items.length,17);
assert.equal(new Set(report.items.map(a=>a.id)).size,17);
for(const a of report.items){
 assert.equal(a.originalModelSource,null);
 assert.equal(a.autoPlacement,true);
 assert.ok(a.references.length);
 for(const s of a.references)assert.ok(existsSync(new URL('first-batch-review/'+s.image,root)));
 assert.equal(a.modelStatus,'자료 반영 재제작');
 assert.ok(a.candidate.observed&&a.candidate.unknown&&a.candidate.captureMonth);
 assert.ok(existsSync(new URL('first-batch-review/'+a.candidate.screenshot,root)));
 assert.equal(new URL(a.candidate.placeUrl).hostname,'place.map.kakao.com');
}
for(const path of ['app.js','shops/neighborhood-plan.js']){
 const source=readFileSync(new URL(path,root),'utf8');
 assert.ok(!source.includes('addLandmarkFacade')&&!source.includes('first-batch.js'));
}
console.log('17 remade model records and reference files verified; original unsupported provenance preserved');
