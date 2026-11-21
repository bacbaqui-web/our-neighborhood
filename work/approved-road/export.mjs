import fs from 'node:fs';
import assert from 'node:assert/strict';
import {embedBusAtlas} from './embed-bus-atlas.mjs';
import * as T from 'three';
import {factories} from '../../outputs/domestic-test/approved-road/models.js';
import {GLTFExporter} from '../../outputs/domestic-test/vendor/GLTFExporter.js';
const approvals=JSON.parse(fs.readFileSync(new URL('./approvals.json',import.meta.url))).items;
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}};
const out=new URL('../../outputs/domestic-test/approved-road/',import.meta.url),manifest=[];
for(const [key,create] of Object.entries(factories)){
 const m=create(),id=m.userData.assetId,a=approvals.find(a=>a.assetId===id);assert(a&&a.status==='approved'&&a.approvedReferenceId===a.reference.id,'Missing exact image approval: '+id);
 m.userData.approvedReferenceId=a.reference.id;m.userData.approvalRevision=a.revision;
 let triangles=0,materials=0;m.traverse(n=>{if(!n.isMesh)return;materials++;const g=n.geometry,p=g.attributes.position,norm=g.attributes.normal;assert(Array.from(p.array).every(Number.isFinite));assert(Array.from(norm.array).every(Number.isFinite));triangles+=(g.index?.count??p.count)/3;assert(!n.material.map);});
 const box=new T.Box3().setFromObject(m),size=box.getSize(new T.Vector3()).toArray();assert(Math.abs(box.min.y)<.004,key+' ground');assert(triangles>100&&triangles<20000);assert(size.every(n=>n>0&&n<4));
 let binary=await new GLTFExporter().parseAsync(m,{binary:true});if(key==='bus')binary=embedBusAtlas(binary,fs.readFileSync(new URL('bus-sign-atlas-v1.png',out)));const file=key+'-approved-'+(key==='bus'?'v4':['speed','parking'].includes(key)?'v2':'v1')+'.glb';fs.writeFileSync(new URL(file,out),Buffer.from(binary));
 manifest.push({id,key,name:m.name,file,triangles,materials,size,bytes:binary.byteLength,approvedReferenceId:a.reference.id,approvalRevision:a.revision,approvedAt:a.updatedAt,support:m.userData.support,surfaceY:m.userData.surfaceY??null,referenceNote:m.userData.referenceNote??'',dimensions:m.userData.dimensions});
}
fs.writeFileSync(new URL('manifest.json',out),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(new URL('catalog.js',out),'export const approvedRoad = '+JSON.stringify(manifest,null,2)+';\n');console.log(JSON.stringify(manifest,null,2));
