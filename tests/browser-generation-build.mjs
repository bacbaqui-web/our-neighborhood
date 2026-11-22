import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {bundleGeneration,checkGenerationBundle} from '../scripts/build-browser-generation.mjs';

const initial=await checkGenerationBundle();
assert.equal((await bundleGeneration()).text,initial.text,'Repeated builds must produce identical bytes');
const modules=Object.keys(initial.metafile.inputs);
assert.equal(new Set(modules.map(p=>p.split('?')[0])).size,modules.length,'Cache versions must not duplicate module state');
assert.equal(modules.filter(p=>p.endsWith('/memo-scene.js')).length,1,'Generation bounds share one module instance');
assert(initial.text.includes('../asset-encyclopedia/registry.js'),'Registry URLs retain their original module base');
assert(initial.text.includes('createAssemblyReport'),'Current assembly code is included');
const worker=await import('../outputs/domestic-test/browser-generation/prepare-scene.js');
assert.equal(typeof worker.prepareScene,'function','Worker bundle loads without DOM globals');

const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'neighborhood-bundle-test-'));
try{
  for(const name of initial.inputs){const dest=path.join(temporary,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(name,dest);}
  const output=path.join(temporary,'outputs/domestic-test/browser-generation/prepare-scene.js');
  await fs.mkdir(path.dirname(output),{recursive:true});
  await fs.writeFile(output,initial.text);
  await checkGenerationBundle(temporary);
  await fs.appendFile(output,'\n// stale output\n');
  await assert.rejects(checkGenerationBundle(temporary),/원본과 다릅니다/);
  await fs.writeFile(output,initial.text);
  const dependency=path.join(temporary,'outputs/domestic-test/details.js');
  await fs.appendFile(dependency,'\n// changed source, including tree-shaken changes\n');
  await assert.rejects(checkGenerationBundle(temporary),/원본과 다릅니다/);
  await fs.copyFile('outputs/domestic-test/details.js',dependency);
  const entry=path.join(temporary,'work/browser-generation/prepare-scene.js');
  await fs.appendFile(entry,"\nimport {installGenerationBounds as repeated} from '../../outputs/domestic-test/memo-scene.js?v=another-version';\nexport {repeated};\n");
  const duplicate=await bundleGeneration(temporary);
  assert.equal(Object.keys(duplicate.metafile.inputs).filter(p=>p.endsWith('/memo-scene.js')).length,1);
  await fs.appendFile(entry,"\nexport {createRegistry} from '../../outputs/domestic-test/asset-encyclopedia/registry.js';\n");
  await fs.writeFile(output,(await bundleGeneration(temporary)).text);
  const {createRegistry}=await import(pathToFileURL(output));
  const asset=createRegistry({entries:[{id:'test:bundle-url',kind:'prop',file:'../asset.glb'}]}).resolve('test:bundle-url');
  assert.equal(asset.url,pathToFileURL(path.join(await fs.realpath(temporary),'outputs/domestic-test/asset.glb')).href,'Asset paths remain relative to their source module');
  await fs.appendFile(entry,"\nimport '../../outputs/domestic-test/memo-scene.js?raw';\n");
  await assert.rejects(bundleGeneration(temporary),/Unsupported module URL/);
}finally{await fs.rm(temporary,{recursive:true,force:true});}
console.log('Browser bundle: reproducible bytes, source/output drift, shared module state and source-relative URLs passed.');
