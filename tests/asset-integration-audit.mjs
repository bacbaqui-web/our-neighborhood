import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {grade1Assets} from '../outputs/domestic-test/grade1-street/catalog.js';
import {commercialEntries} from '../outputs/domestic-test/sungshin-commercial/designs.js';
const base=new URL('../outputs/domestic-test/',import.meta.url);
const read=path=>JSON.parse(fs.readFileSync(new URL(path,base),'utf8'));
const registry=createRegistry(read('asset-encyclopedia/catalog.json'));
const rawIds=new Set(registry.entries.map(a=>a.id));
const junctions=read('junction-assets/manifest.json');
const shops=read('shops/library/catalog.json').assets;
const vehicles=read('vehicle-catalog.json').items.filter(a=>a.status==='등록');
const groups={grade1:grade1Assets.map(a=>a.id),junction:junctions.map(a=>a.id),shops:shops.map(a=>'shop:'+a.id),sungshin:commercialEntries.map(a=>a.id),vehicles:vehicles.map(a=>'vehicle:'+a.id)};
const excluded=[];
for(const [group,ids]of Object.entries(groups)) {
 assert.equal(new Set(ids).size,ids.length,group+' 중복 ID');
 for(const id of ids){
  assert(rawIds.has(id),id+' 제작 목록에는 있지만 백과 등록부에서 사라졌습니다.');
  const asset=registry.resolve(id);
  if(!asset){excluded.push(id);continue;}
  if(asset.url)assert(fs.existsSync(fileURLToPath(asset.url)),id+' 연결된 모델 파일 누락');
 }
}
assert.equal(groups.grade1.length,8);assert.equal(groups.junction.length,12);assert.equal(groups.sungshin.length,50);
assert.equal(groups.shops.filter(id=>/^shop:alley-\d+$/.test(id)).length,50);
for(const asset of junctions){
 assert(['parametric-curb','parametric-ramp','parametric-crossing','parametric-edge-mark','fixed-dimension-warning-block','reference-only'].includes(asset.integration?.mode),asset.id+' 실제 사용/참고 전용 상태 누락');
 if(asset.integration.mode!=='reference-only'){
  for(const key of ['generator','renderer'])assert(fs.existsSync(new URL('../../'+asset.integration[key],base)),asset.id+' 생성 연결 경로 누락');
 }
}
console.log(JSON.stringify({registered:Object.fromEntries(Object.entries(groups).map(([key,ids])=>[key,ids.length])),curationExcluded:excluded,note:'등록·파일 연결 검사입니다. 자동배치 동작 및 공개 화면 증거를 대신하지 않습니다.'},null,2));
