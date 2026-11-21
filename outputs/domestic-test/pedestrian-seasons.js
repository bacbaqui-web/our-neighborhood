export const PEOPLE_SEASON_NAMES={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'};

export function seasonalPeopleCatalog(catalog,manifest,season){
 if(!Object.hasOwn(PEOPLE_SEASON_NAMES,season))throw Error('사람 옷의 계절을 확인해 주세요.');
 return {...catalog,season,people:catalog.people.map(person=>{
  if(season==='spring')return {...person,season};
  const variant=manifest.people?.[person.id]?.seasons?.[season];
  if(!variant||!variant.image?.startsWith('seasons/')||variant.image.includes('..')||!Array.isArray(variant.frames)||variant.frames.length!==8||!(variant.imageWidth>0&&variant.imageHeight>0))throw Error(person.name+'의 '+PEOPLE_SEASON_NAMES[season]+' 옷 파일을 확인해 주세요.');
  const tiers=variant.elevations;
  if(!Array.isArray(tiers)||tiers.length!==3||tiers.some((tier,i)=>tier.pitch!==i*30||!tier.image?.startsWith('seasons/')||tier.image.includes('..')||tier.frames?.length!==8||!(tier.imageWidth>0&&tier.imageHeight>0)))throw Error(person.name+'의 '+PEOPLE_SEASON_NAMES[season]+' 시점별 옷 파일을 확인해 주세요.');
  // Each camera tier belongs to the selected outfit, including elevated views.
  return {...person,...variant,season,elevations:tiers};
 })};
}

export function createPedestrianSeasonLoader(catalog,manifest,load){
 const cache=new Map();
 return season=>{
  if(!cache.has(season)){
   const selected=seasonalPeopleCatalog(catalog,manifest,season);
   const pending=Promise.resolve().then(()=>load(selected)).catch(error=>{cache.delete(season);throw error;});
   cache.set(season,pending);
  }
  return cache.get(season);
 };
}
