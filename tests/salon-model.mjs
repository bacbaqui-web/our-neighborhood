import assert from'node:assert/strict';import fs from'node:fs';
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const{createPart,definitions,PREFIX}=await import('../outputs/domestic-test/asset-encyclopedia/categories/commerce/salon-local/model.js');
const{planSalon}=await import('../outputs/domestic-test/assembly-rules/salon-local.js');
const entries=JSON.parse(fs.readFileSync('outputs/domestic-test/asset-encyclopedia/catalog.json')).entries;const resolve=id=>entries.find(e=>e.id===id);
for(const width of[3.4,4.4,5.4])for(const height of[2.8,3,3.3])for(const depth of[5.4,6.2,7.2])for(const frontDepth of[0,.5,1.5]){
 const p=planSalon(resolve,{width,height,depth,frontDepth});assert.equal(p.requiredFailures.length,0);assert.equal(p.placed.filter(x=>x.key==='station').length,depth===7.2?3:2);assert.equal(p.placed.filter(x=>x.key==='planter').length,frontDepth===1.5?1:0);
 const chairs=p.placed.filter(x=>x.key==='chair');for(const c of chairs){assert([-Math.PI/2,Math.PI].includes(c.yaw));assert(c.z-.45>p.partitionZ);}
 const central=chairs.filter(c=>c.yaw===Math.PI);assert.equal(central.length,width>=5.2?2:(width>=4.4||depth>=7?1:0));
 for(const c of central){const station=p.placed.find(q=>q.key==='centerstation'&&q.x===c.x);assert(station&&station.z<c.z);assert(c.x-.43-(-width/2+.94+.45)>=.849);}
 const floorKeys=['chair','stock','reception','waiting','towels','wash','centerstation','trolley','station'];const furniture=p.placed.filter(x=>floorKeys.includes(x.key));const bounds=q=>{const cs=Math.abs(Math.cos(q.yaw)),sn=Math.abs(Math.sin(q.yaw));return{hx:(q.size[0]*cs+q.size[2]*sn)/2,hz:(q.size[0]*sn+q.size[2]*cs)/2};};
 for(let i=0;i<furniture.length;i++){const a=furniture[i],aa=bounds(a);assert(a.x-aa.hx>=-width/2-.01&&a.x+aa.hx<=width/2+.01,a.key+' wall');for(const b of furniture.slice(i+1)){const bb=bounds(b);assert(!(Math.abs(a.x-b.x)<aa.hx+bb.hx-.005&&Math.abs(a.z-b.z)<aa.hz+bb.hz-.005),a.key+' overlaps '+b.key);}}
 for(const kit of p.placed.filter(x=>x.key==='toolkit')){assert(p.placed.some(s=>s.instanceId===kit.support&&['station','centerstation'].includes(s.key)));assert.equal(kit.y,p.floor+.5875);}
 const terminal=p.placed.find(x=>x.key==='terminal');assert.equal(terminal.y,p.floor+1.1);assert(p.placed.some(x=>x.instanceId===terminal.support&&x.key==='reception'));
 for(const key of Object.keys(definitions)){const a=createPart(key,{width,height,depth});assert.equal(a.userData.assetId,PREFIX+key);a.traverse(o=>{if(o.geometry)for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v),key);});}
}
assert.throws(()=>planSalon(()=>null),/필수 에셋 누락/);console.log('PASS 81 size/space combinations, 20 registered models, finite geometry, wall/central chair orientation, furniture collisions, clear central aisle, rear partition separation and supported terminal');
