import assert from 'node:assert/strict';
import {createShopWorkspace,defaultDraft,validateDraft,galleryFilters} from '../outputs/domestic-test/asset-encyclopedia/shop-workspace.js';
const id='commerce:salon-local-assembly',pack='salon-local';const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const a=createShopWorkspace(storage),b=createShopWorkspace(storage);const draft=defaultDraft(pack);draft.request='경대 제품 보완';draft.dimensions.width=5.4;
a.save(id,pack,draft,0);assert.equal(b.read(id,pack).request,draft.request);assert.throws(()=>b.save(id,pack,draft,0),/다른 창/);
assert.throws(()=>validateDraft(pack,{...draft,dimensions:{...draft.dimensions,width:100}}));assert.throws(()=>validateDraft(pack,{...draft,floors:[]}));assert.throws(()=>validateDraft(pack,{...draft,request:'x'.repeat(5001)}));
const bad=createShopWorkspace({getItem:()=>'{',setItem(){}});assert.throws(()=>bad.read(id,pack),/읽지/);
const full=createShopWorkspace({getItem:()=>null,setItem(){throw Error('quota')}});assert.throws(()=>full.save(id,pack,draft,0),/저장하지/);
assert.equal(a.read(id,pack).revision,1);assert.equal(defaultDraft('convenience-local').dimensions.width,undefined);
console.log('PASS workspace persistence, conflict, corruption, quota, dimension bounds and condition validation');

const f={domain:'commerce',role:'display',color:'red',material:'wood',era:'modern',query:'빵집'};assert.deepEqual(galleryFilters(f,true),{...f,role:'',color:'',material:'',era:''});assert.equal(galleryFilters(f,false),f);assert.equal(galleryFilters({...f,domain:'house'},true).role,'display');console.log('PASS gallery ignores hidden part filters and preserves search/other domains');
