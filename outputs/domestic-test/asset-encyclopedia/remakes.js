import {canonicalId} from './curation.js';
import {props} from '../prop-remakes/catalog.js';
const replacements=new Map(props.map(p=>[canonicalId('road:'+p.old),p]));
const candidates=new Set(props.map(p=>'prototype:'+p.key+'-v1'));
export function applyRemakes(entries){return entries.filter(a=>!candidates.has(a.id)).map(a=>{const p=replacements.get(a.id);return p?{...a,file:'../prop-remakes/'+p.key+'-v1.glb',triangles:p.triangles,originalFile:a.file,remade:true,note:'새 제작본을 적용했습니다. '+(p.support==='leaning'?'벽에 기대어 배치하는 사다리입니다. ':''),link:'../prop-remakes/?asset='+p.key}:a;});}
