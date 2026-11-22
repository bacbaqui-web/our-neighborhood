import assert from 'node:assert/strict';
import {defaultFilters,filterAssets,changeScope,parseFilters,serializeFilters,facetValues,UNKNOWN} from '../outputs/domestic-test/asset-encyclopedia/filter-state.js';
const make=(id,domain,role,era,colors,materials)=>({id,name:id,taxonomy:{domain,role,era,colors,materials,tags:[]}});
const entries=[make('old-red','house','wall',['old'],['red'],['brick']),make('new-red','house','wall',['new'],['red'],['brick']),make('old-white','house','window',['old'],['white'],['metal']),make('unknown','house','window',[],[],[]),make('car','vehicle','car',[],['red'],['metal'])];
const state={...defaultFilters,role:'wall',era:'old',color:'red',material:'brick'};
assert.deepEqual(filterAssets(entries,state).map(a=>a.id),['old-red'],'all facets combine with AND');
assert.equal(filterAssets(entries,{...state,color:'white'}).length,0,'empty result does not loosen the request');
assert.deepEqual(filterAssets(entries,{...defaultFilters,role:'window',era:UNKNOWN}).map(a=>a.id),['unknown']);
assert(facetValues(entries,{...defaultFilters,role:'window'},'era').includes(UNKNOWN));
assert.deepEqual(changeScope(entries,state,'vehicle'),{...defaultFilters,domain:'vehicle',color:'red'},'valid color survives while incompatible role, era, material clear');
assert.equal(changeScope(entries,state,'house','window').era,'old');
assert.equal(changeScope(entries,state,'house','window').color,'');
const roundtrip={...state,query:'붉은 벽 & 창',treeUse:''};
assert.deepEqual(parseFilters(new URLSearchParams(serializeFilters(roundtrip))),roundtrip);
assert.equal(parseFilters(new URLSearchParams('tab=car')).domain,'vehicle');
assert.equal(parseFilters(new URLSearchParams('domain=garbage')).domain,'house');
assert.equal(filterAssets(entries,{...defaultFilters,domain:'all'}).length,entries.length);
assert.equal(filterAssets(entries,{...defaultFilters,query:'old-red'}).length,1);
console.log('asset filter state: cumulative facets, unknown, reset, category changes and URL roundtrip passed');
const {readFileSync}=await import('node:fs');
const {createRegistry}=await import('../outputs/domestic-test/asset-encyclopedia/registry.js');
const {canonicalId,curation}=await import('../outputs/domestic-test/asset-encyclopedia/curation.js');
const {DOMAINS}=await import('../outputs/domestic-test/asset-encyclopedia/filter-state.js');
const catalog=JSON.parse(readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url)));
const actual=createRegistry(catalog).entries.filter(a=>canonicalId(a.id)===a.id&&curation.items[a.id]?.state!=='deleted');
const browsable=Object.keys(DOMAINS).filter(domain=>domain!=='all').flatMap(domain=>filterAssets(actual,{...defaultFilters,domain}));
assert.deepEqual(new Set(browsable.map(a=>a.id)),new Set(actual.map(a=>a.id)),'all visible assets are reachable through exactly one domain');
assert.equal(browsable.length,actual.length);
for(const domain of Object.keys(DOMAINS))for(const role of new Set(actual.filter(a=>domain==='all'||a.taxonomy.domain===domain).map(a=>a.taxonomy.role))){const scoped={...defaultFilters,domain,role};assert(filterAssets(actual,scoped).length>0);for(const facet of ['era','color','material'])for(const value of facetValues(actual,scoped,facet))assert(filterAssets(actual,{...scoped,[facet]:value}).length>0);}
console.log(`${actual.length} current visible assets: domain, role and individual facet reachability passed`);
const {colorPresentation}=await import('../outputs/domestic-test/asset-encyclopedia/filter-state.js');
assert.deepEqual(colorPresentation('#ffffff'),{color:'#ffffff',label:'흰색 계열'});
assert.equal(colorPresentation('#000000').label,'검정 계열');
assert.equal(colorPresentation('#2869b0').label,'파랑 계열');
assert.equal(colorPresentation('미확인').color,null);
assert.equal(colorPresentation('#notcolor').color,null);
const colorCases=[
 make('named-white','house','wall',[],['#eeeeed','백색'],[]),
 make('white-alias','house','wall',[],['흰색'],[]),
 make('cream','house','wall',[],['크림'],[]),
 make('cream-alias','house','wall',[],['크림색'],[]),
 make('raw-brown-a','house','wall',[],['#865c42'],[]),
 make('raw-brown-b','house','wall',[],['#895e50'],[]),
];
const colorOptions=facetValues(colorCases,defaultFilters,'color');
assert(!colorOptions.some(value=>value.startsWith('#')),'raw hex codes are not duplicated in color buttons');
assert(!colorOptions.includes('백색'));
assert(!colorOptions.includes('크림'));
assert.deepEqual(filterAssets(colorCases,{...defaultFilters,color:'흰색'}).map(a=>a.id),['named-white','white-alias']);
assert.equal(filterAssets(colorCases,{...defaultFilters,color:'크림색'}).length,2);
const brown=colorOptions.find(value=>colorPresentation(value).label==='갈색 계열');
assert(brown);
assert.equal(filterAssets(colorCases,{...defaultFilters,color:brown}).length,2);
assert.equal(colorOptions.length,3,'named aliases and hex-only families share one button each');
console.log('color facets: named colors supersede hex, synonyms merge and hex families match all members');
