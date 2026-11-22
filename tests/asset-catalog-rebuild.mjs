import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'asset-catalog-rebuild-'));
try{
 const destination=path.join(temp,'catalog.json');
 execFileSync(process.execPath,['--no-warnings','--loader','./tests/three-loader.mjs','scripts/build-asset-encyclopedia.mjs','--output',destination],{cwd:root,stdio:'pipe'});
 const rebuilt=createRegistry(JSON.parse(fs.readFileSync(destination))),current=createRegistry(read('outputs/domestic-test/asset-encyclopedia/catalog.json'));
 for(const row of current.entries.filter(a=>/^(junction:|shop:|building:sungshin-|example:housing-|grade1:|vehicle:)/.test(a.id))){
  const found=rebuilt.entries.find(a=>a.id===row.id);assert(found,row.id+' 재생성 후 고정 ID 소실');
  for(const key of ['key','file','productionReferenceId','approvedReferenceId','pack'])assert.deepEqual(found[key],row[key],row.id+' '+key+' 소실');
  if(row.id.startsWith('junction:'))assert.deepEqual(found.integration,row.integration);
  if(row.id.startsWith('example:housing-')||row.id.startsWith('building:sungshin-'))assert.deepEqual(found.placement,row.placement);
 }
 console.log('백과 재생성 후 고정 ID·제작 근거·모델 연결·예시 상태 유지 검사 통과');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
