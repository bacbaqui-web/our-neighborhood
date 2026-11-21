import {approvedBuildingProfiles} from '../building-remakes/profiles.js';
import {approvedRoad} from '../approved-road/catalog.js?v=signtexture3';
import {canonicalId} from './curation.js';
import {props} from '../prop-remakes/catalog.js';
const approved=new Map(approvedRoad.map(p=>[p.id,p]));
const replacements=new Map(props.map(p=>[canonicalId('road:'+p.old),p]));
export const remakeAliases=new Map(props.map(p=>[canonicalId('representative:'+p.old),canonicalId('road:'+p.old)]).filter(([a,b])=>a!==b));
const candidates=new Set(props.map(p=>'prototype:'+p.key+'-v1'));
export function applyRemakes(entries){return entries.filter(a=>!candidates.has(a.id)&&!remakeAliases.has(a.id)).map(a=>{const building=approvedBuildingProfiles[a.id];if(building)return {...a,remade:true,approvedReferenceId:building.referenceId,note:'승인 사진을 바탕으로 창틀·외벽·출입구·옥상을 새로 제작했습니다. 사진에 없는 측면·뒤·옥상은 추정 구성입니다. 지도에서는 원래 윤곽과 층수를 따릅니다.'};const v=approved.get(a.id);if(v)return {...a,file:'../approved-road/'+v.file,triangles:v.triangles,originalFile:a.file,remade:true,approvedReferenceId:v.approvedReferenceId,note:'승인한 참고 이미지로 새로 제작했습니다. '+v.referenceNote+' 치수 표기가 없는 부분은 추정 크기입니다.',link:null};const p=replacements.get(a.id);return p?{...a,file:'../prop-remakes/'+p.key+'-v1.glb',triangles:p.triangles,originalFile:a.file,remade:true,note:'새 제작본을 적용했습니다. '+(p.support==='leaning'?'벽에 기대어 배치하는 사다리입니다. ':''),link:'../prop-remakes/?asset='+p.key}:a;});}
