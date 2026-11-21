import fs from 'node:fs';
import {commercialEntries as entries} from '../../outputs/domestic-test/sungshin-commercial/designs.js';
const file=new URL('../../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url);
const contents=fs.readFileSync(file,'utf8');
const catalog=JSON.parse(contents);
const ids=new Set(entries.map(e=>e.id));
catalog.entries=catalog.entries.filter(e=>!ids.has(e.id)).concat(entries);
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+(contents.endsWith('\n')?'\n':''));
