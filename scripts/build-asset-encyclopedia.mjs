// Public catalog: models available in this release; local construction experiments stay in the canonical workspace.
import {treeProfile} from '../outputs/domestic-test/tree-profiles.js';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TREE_SPECIES} from '../outputs/domestic-test/tree-species.js';
import {koreanVehicleCatalog} from '../outputs/alley-library/korean-vehicles.js';
import {facilities} from '../outputs/domestic-test/facilities/catalog.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../outputs'),base=path.join(root,'domestic-test'),out=path.join(base,'asset-encyclopedia');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));const entries=[],paths=new Set();
const url=p=>path.posix.relative('domestic-test/asset-encyclopedia',p);
function add(e){if(e.file){e.file=path.posix.normalize(e.file);if(!fs.existsSync(path.join(root,e.file)))throw Error('Missing asset '+e.file);if(paths.has(e.file))return;paths.add(e.file);e.file=url(e.file);}entries.push(e);}
const legacy=read('alley-library/alley-catalog-212.json');
for(const a of legacy)add({id:'legacy:'+a.id,key:a.id,name:a.name,category:a.category,collection:'초기 골목 소품',kind:'legacy',triangles:a.triangles,note:a.source});
for(const a of koreanVehicleCatalog)add({id:'korean:'+a.id,key:a.id,name:a.name,category:'차량',collection:'초기 차량 모델',kind:'korean',note:a.source});
for(const [key,name] of [[0,'분리수거함'],[1,'자전거·거치대'],[2,'실외기'],[3,'꽃 화단'],[4,'배전함'],[6,'동네 게시판']])add({id:'street:'+key,key,name,category:'생활 소품',collection:'최초 생활 소품',kind:'street',link:'../assets.html'});
const road=read('domestic-test/roadview50/model-meta.json'),lookup=Object.fromEntries(road.map(a=>[a.id,a]));
for(const a of road)add({id:'road:'+a.id,name:a.name,category:a.category,collection:'로드뷰 참고 소품',kind:'glb',file:'domestic-test/roadview50/'+a.file,triangles:a.triangles,note:a.reason||a.description});
const reps=read('domestic-test/representatives/manifest.json');
for(const a of Object.values(reps.assets))if(a.file)add({id:'representative:'+a.id,name:a.name||lookup[a.id]?.name||a.id,category:lookup[a.id]?.category||'생활 소품',collection:'통합 수정본',kind:'glb',file:'domestic-test/representatives/'+a.file,note:a.memoBaked?'사용자 수정 의견 반영':'통합 대표 모델'});
for(const a of read('domestic-test/memo-131/audit.json'))add({id:'memo:'+a.id,name:a.name,category:lookup[a.id]?.category||'생활 소품',collection:'메모 수정본',kind:'glb',file:'domestic-test/memo-131/'+a.id+'.glb',triangles:a.triangles,note:a.change});
for(const a of read('domestic-test/vehicle-catalog.json').items)add({id:'vehicle:'+a.id,name:a.name+' · '+a.variant,category:'차량',collection:'차량 등록본',kind:'glb',file:'domestic-test/'+a.model,triangles:a.triangles,note:a.note});
for(const a of facilities)add({id:'facility:'+a.id,key:a.id,name:a.name,category:'시설·매장',collection:'시설 외관',kind:'facility',link:'../first-batch-review/#'+a.id});
for(const a of TREE_SPECIES)add({id:'tree:'+a.id,key:a.id,name:a.name,category:'나무·식물',collection:'입체 나무',kind:'tree',treeProfile:treeProfile(a.id),note:a.description,link:'../tree-growth.html?species='+a.id});
const peopleSeasons=read('domestic-test/people/seasons.json').people;
for(const a of read('domestic-test/people/catalog.json').people)add({seasons:Object.fromEntries(Object.entries(peopleSeasons[a.id].seasons).map(([season,v])=>[season,{file:'../people/'+v.image,elevations:v.elevations.map(t=>({pitch:t.pitch,file:'../people/'+t.image}))}])),id:'person:'+a.id,name:a.name,category:'사람',collection:'사람 빌보드',kind:'image',file:'domestic-test/people/'+a.image,rect:a.frames[0].rect,note:'방향별 원본 이미지 · 높이 '+a.height+'m',link:'../people.html'});
for(const a of read('domestic-test/vegetation/catalog.json').assets)add({id:'plant:'+a.id,name:a.name,category:'나무·식물',collection:'초기 식물 빌보드',kind:'image',file:'domestic-test/vegetation/'+a.image,rect:a.frames[0].rect,note:'초기 식물 원본 · 전체 이미지에서 각 방향을 확인할 수 있습니다.',link:'../vegetation.html'});
const shops=read('domestic-test/shops/library/catalog.json');for(const a of shops.assets)add({id:'shop:'+a.id,key:a.id,name:shops.categories.find(c=>c.id===a.category).name+' · '+a.name,category:'상가 전면',collection:'업종별 상가',kind:'shop',note:'글자 없는 상가 전면 모델',link:'../storefronts.html'});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):(d.isFile()||d.isSymbolicLink())&&d.name.endsWith('.glb')?[path.join(dir,d.name)]:[]);}
const excluded=[];for(const f of walk(base)){const rel=path.relative(root,f).split(path.sep).join('/');if(rel==='domestic-test/corrected-base.glb'){excluded.push(rel);continue;}if(paths.has(rel))continue;add({id:'file:'+rel,name:path.basename(f,'.glb'),category:rel.includes('/vehicles/')||rel.includes('/cars/')?'차량':rel.includes('/apartments/')?'아파트·단지':'기타 모델',collection:'보관 모델·이전 버전',kind:'glb',file:rel,note:'개별 목록에 없는 보관 모델입니다. 파일명을 표시합니다.'});}
if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('Duplicate ID');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify({version:1,scope:'현재 프로젝트의 개별 3D 모델과 코드로 만드는 모델, 사람·식물 이미지를 모았습니다. 전체 지도, 연구용 사진, 외부 백업의 중복 파일은 제외합니다. 원본·수정본·색상 변형은 각각 셉니다.',excluded,entries},null,2));console.log(entries.length+' entries; '+paths.size+' asset files');
