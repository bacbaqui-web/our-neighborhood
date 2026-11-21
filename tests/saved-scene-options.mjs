import assert from 'node:assert/strict';
import {savedSceneOptions} from '../outputs/domestic-test/saved-scene-options.js';
const rows=[{id:'a',address:'같은 주소'},{id:'b',address:'같은 주소'},{id:'c',address:'다른 주소'},{id:'a',address:'같은 주소'}];
const options=savedSceneOptions(rows);
assert.equal(options.length,3);
assert.equal(new Set(options.map(o=>o.value)).size,3);
for(const id of ['a','b','c'])assert.equal(options.find(o=>o.id===id).id,id);
assert.equal(options.find(o=>o.id==='c').value,'다른 주소');
console.log('Saved scene choices preserve distinct scenes at the same address');
