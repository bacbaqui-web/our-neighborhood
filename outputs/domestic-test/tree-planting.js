import {TREE_SPECIES,speciesById} from './tree-species.js?v=151';
import {TREE_PROFILES,treeProfile} from './tree-profiles.js';
import {seededRandom} from './canopy-growth.js?v=151';
// Heights are in metres; mature defaults are range midpoints, not measured averages.
// Yard defaults represent managed trees. Keep the reserved crown footprint.
export function treePlanting({id,species,use='street',radius=null}){
 if(!['street','yard'].includes(use))throw Error('나무 용도는 가로수 또는 마당이어야 합니다.');
 if(radius!==null&&(!Number.isFinite(radius)||radius<=0))throw Error('나무 배치 반경을 확인해 주세요.');
 const candidates=TREE_SPECIES.filter(s=>TREE_PROFILES[s.id].uses.includes(use)&&!(use==='yard'&&radius!==null&&radius<2.5&&!['maple','fringe'].includes(s.id)));
 const random=seededRandom('planting:'+id),chosen=candidates.find(s=>s.id===species)||candidates[Math.floor(random()*candidates.length)],p=treeProfile(chosen.id);
 const height=use==='yard'?p.yardHeightM:p.defaultHeightM;
 return {species:chosen.id,height,radius:radius??chosen.radius*height/chosen.height,use,heightBasis:use==='yard'?'managed-yard':'mature-range-midpoint'};
}

export {normalizeTreeHeight,planSizedTree} from './asset-encyclopedia/categories/nature/tree-shape.js';
