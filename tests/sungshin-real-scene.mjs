import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from '../outputs/domestic-test/vendor/GLTFLoader.js';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {designs} from '../outputs/domestic-test/sungshin-commercial/designs.js';
import {buildCommercial} from '../outputs/domestic-test/sungshin-commercial/model.js';
import {planCommercialCandidates,fitCommercialModel} from '../outputs/domestic-test/sungshin-commercial/placement.js';
const path=process.argv[2]||'/tmp/junction-public-ramp-final/data';
const loc=JSON.parse(fs.readFileSync(path+'/location.json')),data=JSON.parse(fs.readFileSync(path+'/buildings.geojson')),phi=loc.origin[0]*Math.PI/180;
const mLat=111132.92-559.82*Math.cos(2*phi)+1.175*Math.cos(4*phi)-.0023*Math.cos(6*phi),mLon=111412.84*Math.cos(phi)-93.5*Math.cos(3*phi)+.118*Math.cos(5*phi),xz=([lon,lat])=>[(lon-loc.origin[1])*mLon,-(lat-loc.origin[0])*mLat];
const buffer=fs.readFileSync(path+'/corrected-base.glb'),root=(await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'')).scene;
const triangles=[];root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh||o.name==='road')return;const p=o.geometry.attributes.position,ix=o.geometry.index;for(let i=0;i<(ix?.count??p.count);i+=3){const vs=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(i+k):i+k).applyMatrix4(o.matrixWorld));triangles.push({road:o.name==='road',vs});}});
const rc=JSON.parse(fs.readFileSync(path+'/arterial/road-context.json'));for(const[k,ps]of Object.entries(rc.positions))for(let i=0;i<ps.length;i+=9)triangles.push({road:true,vs:[0,3,6].map(d=>new T.Vector3(...ps.slice(i+d,i+d+3)))});
const cells=new Map();for(const t of triangles){const xs=t.vs.map(v=>v.x),zs=t.vs.map(v=>v.z);for(let x=Math.floor(Math.min(...xs)/5);x<=Math.floor(Math.max(...xs)/5);x++)for(let z=Math.floor(Math.min(...zs)/5);z<=Math.floor(Math.max(...zs)/5);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(t);}}
function samples(x,z){const out=[];for(const t of cells.get(Math.floor(x/5)+','+Math.floor(z/5))||[]){const[a,b,c]=t.vs,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-8)continue;const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;if(u>=-1e-6&&v>=-1e-6&&1-u-v>=-1e-6)out.push({road:t.road,y:u*a.y+v*b.y+(1-u-v)*c.y});}return out;}
const elevation=(x,z)=>Math.max(...samples(x,z).map(t=>t.y)),roadInfo=(x,z)=>samples(x,z).find(t=>t.road);
const buildings=data.features.filter(f=>f.geometry.type==='Polygon').map(f=>{const points=f.geometry.coordinates[0].slice(0,-1).map(xz),cx=points.reduce((s,p)=>s+p[0]/points.length,0),cz=points.reduce((s,p)=>s+p[1]/points.length,0);return{seed:f.properties.objectid,points,properties:f.properties,levels:f.properties.gro_flo_co,frontEdge:f.properties.streetProfile.frontEdge,address:f.properties.street_name+' '+f.properties.house_number,base:Math.min(...points.map(p=>elevation(...p)))-.1,top:elevation(cx,cz)+f.properties.gro_flo_co*3};});
const registry=createRegistry(JSON.parse(fs.readFileSync('outputs/domestic-test/asset-encyclopedia/catalog.json'))),plan=planCommercialCandidates(buildings,registry,{elevation,places:JSON.parse(fs.readFileSync(path+'/shops/places.json')).places}),placed=[],rejected=[];
for(const c of plan.choices){const b=buildings.find(b=>b.seed===c.owner);for(const candidate of c.candidates){const d=designs.find(d=>d.id===candidate.key),model=buildCommercial(d),fit=fitCommercialModel(model,d,b,c.frame,{elevation,roadInfo,buildings,requireRoad:true});model.disposePreview();if(fit.ok){placed.push({owner:b.seed,assetId:fit.assetId,ground:fit.ground,front:fit.position,height:fit.height});break;}else rejected.push({owner:b.seed,key:d.id,reason:fit.reason});}}
console.log(JSON.stringify({scene:loc.id,input:buildings.length,candidates:plan.choices.length,placed,skipped:plan.skipped,rejected},null,2));assert(placed.length>0,'실제 생성 동네 적용 0');
