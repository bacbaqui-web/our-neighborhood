import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url),source=new URL('../outputs/domestic-test/asset-encyclopedia/categories/',import.meta.url),temp=fs.mkdtempSync(path.join(os.tmpdir(),'category-ownership-'));
try{
 const categories=path.join(temp,'categories');fs.cpSync(source,categories,{recursive:true});const file=path.join(categories,'house/catalog.json'),original=JSON.parse(fs.readFileSync(file));
 const run=()=>spawnSync(process.execPath,['scripts/build-asset-encyclopedia.mjs','--categories',categories,'--output',path.join(temp,'catalog.json')],{cwd:root,encoding:'utf8'});
 assert.equal(run().status,0);
 let modified=structuredClone(original);modified.entries.pop();fs.writeFileSync(file,JSON.stringify(modified));assert.match(run().stderr,/Missing stable ID/);
 modified=structuredClone(original);modified.entries.push(modified.entries[0]);fs.writeFileSync(file,JSON.stringify(modified));assert.match(run().stderr,/Duplicate ID/);
 modified=structuredClone(original);delete modified.entries.find(a=>a.note).note;fs.writeFileSync(file,JSON.stringify(modified));assert.match(run().stderr,/Erased metadata/);
 modified=structuredClone(original);modified.entries.find(a=>a.taxonomy.colors.length).taxonomy.colors=[];fs.writeFileSync(file,JSON.stringify(modified));assert.match(run().stderr,/Erased taxonomy/);
 for(const mutate of [a=>{delete a.assembly.dimensions},a=>{a.assembly.dimensions=null},a=>{delete a.assembly.dimensions.width},a=>{a.assembly.slots=[]},a=>{delete a.assembly.slots[0].surface},a=>{a.ownership.sources=[]},a=>{a.ownership.sources.pop()},a=>{delete a.ownership.preview}]){modified=structuredClone(original);mutate(modified.entries.find(a=>a.id==='part:basic-window-room'));fs.writeFileSync(file,JSON.stringify(modified));assert.notEqual(run().status,0,'nested metadata deletion must fail');}
 modified=structuredClone(original);const archiveRow=modified.entries.find(a=>a.id==='part:basic-window-room');archiveRow.ownership.sources.push('../missing-archival-model.glb');archiveRow.ownership.sourceAvailability['../missing-archival-model.glb']='local-archive';fs.writeFileSync(file,JSON.stringify(modified));assert.equal(run().status,0,'explicit local archives may be absent from public export');archiveRow.ownership.sourceAvailability['../missing-archival-model.glb']='public-required';fs.writeFileSync(file,JSON.stringify(modified));assert.match(run().stderr,/Missing model source/,'public model sources must exist');
 console.log('Generator rejects missing/duplicate IDs and erased metadata while preserving source catalogs');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
