import {PEOPLE_SEASON_NAMES,seasonalPeopleCatalog} from './pedestrian-seasons.js';

export const peopleActionForWeather=weather=>weather==='rain'||weather==='snow'?'umbrella':'walk';

export function umbrellaPeopleCatalog(catalog,manifest,season){
 if(!Object.hasOwn(PEOPLE_SEASON_NAMES,season))throw Error('사람 옷의 계절을 확인해 주세요.');
 return {...catalog,season,action:'umbrella',people:catalog.people.map(person=>{
  const tiers=manifest.people?.[person.id]?.seasons?.[season]?.elevations;
  if(!Array.isArray(tiers)||tiers.length!==3||tiers.some((t,i)=>t.pitch!==i*30||!/^umbrella\/[a-z0-9-]+\.(?:png|webp)$/.test(t.image)||!(t.imageWidth>0&&t.imageHeight>0)||t.frames?.length!==8||t.frames.some(f=>!(f.bodyHeightPixels>0&&f.bodyHeightPixels<f.artHeightPixels)||!Array.isArray(f.rect)||f.rect.length!==4||f.rect.some(v=>!Number.isFinite(v))||f.rect[0]<0||f.rect[1]<0||f.rect[2]<=0||f.rect[3]<=0||f.rect[0]+f.rect[2]>t.imageWidth||f.rect[1]+f.rect[3]>t.imageHeight||f.anchorPixels?.length!==2||f.anchorPixels.some(v=>!Number.isFinite(v)))))throw Error(person.name+'의 '+PEOPLE_SEASON_NAMES[season]+' 우산 그림과 크기 정보를 확인해 주세요.');
  return {...person,...tiers[0],season,action:'umbrella',elevations:tiers};
 })};
}

export function createPedestrianVariantLoader(catalog,seasons,umbrella,load){
 const cache=new Map();
 return (season,action='walk')=>{
  if(!['walk','umbrella'].includes(action))throw Error('사람 동작을 확인해 주세요.');
  const key=season+':'+action;
  if(!cache.has(key)){
   const selected=action==='umbrella'?umbrellaPeopleCatalog(catalog,umbrella,season):{...seasonalPeopleCatalog(catalog,seasons,season),action};
   cache.set(key,Promise.resolve().then(()=>load(selected)).catch(error=>{cache.delete(key);throw error;}));
  }
  return cache.get(key);
 };
}
