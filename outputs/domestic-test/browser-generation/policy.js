// One generation contract for the start page, map picker and saved-map rebuilds.
export const GENERATION_VERSION=11;
export const RULESET='street-visible360-v1';
export function generationPoint(point){
 if(!point||!Array.isArray(point.center)||point.center.length!==2||!point.center.every(Number.isFinite)||point.center[0]<=33||point.center[0]>=39.5||point.center[1]<=124||point.center[1]>=132)throw Error('국내 지도에서 위치를 선택해 주세요.');
 if(!Number.isInteger(point.radius)||point.radius<50||point.radius>300||point.radius%50)throw Error('시야 거리는 50~300m에서 50m 단위로 선택해 주세요.');
 const {heading=0,fov=90,eyeHeight=1.65}=point.view||{};
 if(![heading,fov,eyeHeight].every(Number.isFinite)||heading<0||heading>=360||fov<40||fov>120||eyeHeight<.5||eyeHeight>3)throw Error('방향과 눈높이 설정을 확인해 주세요.');
 return {...point,view:{heading,fov,eyeHeight,mode:'visible360',version:3},ruleset:RULESET};
}
export function currentScene(scene){return scene?.browserGenerationVersion===GENERATION_VERSION&&scene.ruleset===RULESET&&scene.view?.mode==='visible360'&&scene.view?.version===3;}
export function matchingScene(scene,point){
 return currentScene(scene)&&scene.sizeMetres===point.radius*2&&scene.origin?.every((v,i)=>v.toFixed(6)===point.center[i].toFixed(6))&&['heading','fov','eyeHeight'].every(k=>scene.view[k]===point.view[k]);
}
