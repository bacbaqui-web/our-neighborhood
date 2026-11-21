import fs from 'node:fs';
import * as T from 'three';
import {factories} from './models.mjs';
import {GLTFExporter} from '../../outputs/domestic-test/vendor/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}};
const out=new URL('../../outputs/domestic-test/junction-assets/',import.meta.url),manifest=[];
for(const [key,fn]of Object.entries(factories)){
 const m=fn();let triangles=0;const mats=new Set();m.traverse(n=>{if(n.isMesh){triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;mats.add(n.material);}});
 const binary=await new GLTFExporter().parseAsync(m,{binary:true});const file=key+'-v1.glb';fs.writeFileSync(new URL(file,out),Buffer.from(binary));
 manifest.push({id:'junction:'+key,name:m.name,file,triangles,materials:mats.size,size:new T.Box3().setFromObject(m).getSize(new T.Vector3()).toArray(),bytes:binary.byteLength,...m.userData,authorization:'2026-11-22 user explicitly requested assets based on collected 200 photos; no individual image approval event fabricated',placement:'asset library only; not auto-generated in neighborhoods'});
}
fs.writeFileSync(new URL('manifest.json',out),JSON.stringify(manifest,null,2)+'\n');console.log(manifest.map(a=>`${a.id}: ${a.triangles} triangles`).join('\n'));
