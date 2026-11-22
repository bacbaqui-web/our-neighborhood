import {loadStoredModel} from '../../model-resources.js';
import {planSizedTree} from './tree-shape.js';
import {treeProfile} from '../../../tree-profiles.js';
import {speciesById} from '../../../tree-species.js?v=151';
import {loadCanopyTexture,createHybridTrees} from './hybrid-tree.js';
export {planSizedTree,normalizeTreeHeight} from './tree-shape.js';
export {loadCanopyTexture,loadSpeciesTextures,createHybridTrees} from './hybrid-tree.js';
export async function createModel(a,options={}){
 if(a.kind!=='tree')return loadStoredModel(a);
 const species=speciesById(a.key),height=options.height??treeProfile(a.key).defaultHeightM,season=options.season??'summer';
 if(!Number.isFinite(height)||height<3||height>30||!['spring','summer','autumn','winter'].includes(season))throw Error('나무 높이는 3~30m, 계절은 봄·여름·가을·겨울 중에서 선택해 주세요.');
 const texture=await loadCanopyTexture(a.key);
 const tree=createHybridTrees([planSizedTree({id:a.key,seed:'encyclopedia-'+a.key,species:a.key,height,radius:species.radius*height/species.height})],texture);
 tree.setFoliage({season});tree.group.updatePreview=c=>tree.update(c);
 tree.group.userData.previewSettings={height,season};
 tree.group.disposePreview=()=>{tree.dispose();texture.dispose();};return tree.group;
}
