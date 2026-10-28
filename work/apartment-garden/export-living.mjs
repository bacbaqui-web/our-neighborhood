import fs from 'node:fs';
import {GLTFExporter} from '../../outputs/domestic-test/vendor/GLTFExporter.js';
import {livingCatalog} from '../../outputs/domestic-test/apartments/garden/living-layout.js';
import {makeLivingAsset,addExistingFurniture} from '../../outputs/domestic-test/apartments/garden/living-models.js';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result='data:'+b.type+';base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}};
const dir='outputs/domestic-test/apartments/garden/';fs.mkdirSync(dir+'assets',{recursive:true});
for(const asset of livingCatalog){const root=makeLivingAsset(asset.id);await addExistingFurniture(root,{placed:[{kind:asset.id,point:[0,0],angle:0}]});root.name=asset.name;root.userData={reference:asset.reference,placement:'제안 배치, 실제 시설 위치 미확인',units:'metres'};const glb=await new GLTFExporter().parseAsync(root,{binary:true});fs.writeFileSync(dir+'assets/'+asset.id+'.glb',Buffer.from(glb));}
fs.writeFileSync(dir+'living-catalog.json',JSON.stringify({scope:'사진과 승인된 이미지의 분위기를 반영한 모형. 지도상 실제 시설 위치를 확정한 복제본은 아닙니다.',assets:livingCatalog.map(a=>({...a,file:'assets/'+a.id+'.glb'})),reused:[{id:31,name:'자전거',source:'../../../alley-library/models.js'},{id:44,name:'분리수거함',source:'../../../alley-library/models.js'},{id:126,name:'목재 벤치',source:'../../../alley-library/models.js'}],sources:'infill-study/sources.json'},null,2));console.log('6 furnished assets exported');
