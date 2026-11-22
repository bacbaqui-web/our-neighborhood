import * as T from 'three';
import {designs} from './designs.js';
import {buildSurveyExterior} from './survey-models.js?v=placement1';
import {prepareCommercialInteriors,addCommercialInteriors} from './interiors.js';
import {createSignLettering} from './sign-lettering.js';

const SUFFIX='fidelity2';
const printCache=new Map();
// A shop loads only the sheets sampled by its printed surfaces.
const sheets=[
  ['poster','posters',[1,10,17,19,20,25,27,29,32,40,43,47,48]],
  ['yard','fidelity-signs-01-09',[1,9]],
  ['south','fidelity-south',[2,3,4,5,7,8,10,12,15,25]],
  ['mid','fidelity-mid',[16,17,18,19,20,21,22,24,26,27,28,29,30,32,33]],
  ['north','fidelity-north',[36,37,38,39,40,41,42,44,45,46,47,49]],
  ['fidelity','fidelity-signs',[25,43,48,50]],
  ['corners','fidelity-corners',[21,34,35,48]],
  ['small','fidelity-small',[14,31]],
  ['menji','menji',[44]],
];
export const artworkFor=number=>Object.fromEntries(sheets.filter(([, ,numbers])=>numbers.includes(number)).map(([key,file])=>[key,file]));
function artwork(file){
  if(!printCache.has(file)){
    const loading=new T.TextureLoader().loadAsync(new URL('./textures/'+file+'.webp?v='+SUFFIX,import.meta.url).href)
      .then(texture=>{texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return texture;})
      .catch(error=>{printCache.delete(file);throw error;});
    printCache.set(file,loading);
  }
  return printCache.get(file);
}
export async function loadCommercialBuilding(key){
  const s=designs.find(item=>item.id===key);
  if(!s)throw Error('성신여대 상가를 찾을 수 없습니다.');
  await prepareCommercialInteriors();
  const loaded=await Promise.all(Object.entries(artworkFor(s.number)).map(async([name,file])=>[name,await artwork(file)]));
  return buildCommercial(s,Object.fromEntries(loaded));
}
export function buildCommercial(s,maps={}){
  const root=new T.Group(),materials=new Map();
  const mat=color=>{
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.92}));
    return materials.get(color);
  };
  function mesh(parent,name,geometry,material,x=0,y=0,z=0){
    const object=new T.Mesh(geometry,material);object.name=name;object.position.set(x,y,z);
    object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
  }
  const box=(p,name,x,y,z,w,h,d,color)=>mesh(p,name,new T.BoxGeometry(w,h,d),mat(color),x,y,z);
  function decal(p,name,x,y,z,width,height,texture,cell,columns,rows,bounds=null){
    const sourceKey=Object.entries(maps).find(([,map])=>map===texture)?.[0];
    const lettering=name==='PandaBadge'?null:createSignLettering(sourceKey+':'+cell,width,height);
    const geometry=new T.PlaneGeometry(width,height),uv=geometry.attributes.uv;
    const row=Math.floor(cell/columns),top=bounds?bounds[row]/bounds.at(-1):row/rows;
    const bottom=bounds?bounds[row+1]/bounds.at(-1):(row+1)/rows;
    if(!lettering)for(let i=0;i<uv.count;i++)uv.setXY(i,(cell%columns+.018+uv.getX(i)*.964)/columns,1-bottom+(bottom-top)*(.018+uv.getY(i)*.964));
    const material=new T.MeshStandardMaterial({map:lettering??texture??null,roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
    const m=mesh(p,name,geometry,material,x,y,z);m.castShadow=false;return m;
  }
  const result=buildSurveyExterior(s,{root,mesh,box,mat,decal,maps});
  addCommercialInteriors(result,s);
  result.disposePreview=()=>{
    const geometries=new Set(),ownedMaterials=new Set(),letteringTextures=new Set();
    result.traverse(object=>{
      if(object.geometry)geometries.add(object.geometry);
      const current=Array.isArray(object.material)?object.material:object.material?[object.material]:[],original=Array.isArray(object._originalMaterial)?object._originalMaterial:object._originalMaterial?[object._originalMaterial]:[];
      for(const material of [...current,...original]){
        ownedMaterials.add(material);
        if(material.map?.userData.sungshinLettering)letteringTextures.add(material.map);
      }
    });
    geometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());
    letteringTextures.forEach(t=>t.dispose());
  };
  return result;
}
