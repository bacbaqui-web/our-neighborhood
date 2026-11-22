// Town visibility adapter. The encyclopedia provides geometry for already selected plans.
import {visibleRecord} from './view-generation-visibility.js?v=view3c';
import {createHybridTrees as buildTrees} from './asset-encyclopedia/categories/nature/hybrid-tree.js?v=loading-diagnostics1';
export {loadCanopyTexture,loadSpeciesTextures} from './asset-encyclopedia/categories/nature/hybrid-tree.js?v=loading-diagnostics1';
export function createHybridTrees(plans,texture,overrides=new Map()){return buildTrees(plans.filter(p=>visibleRecord(p,()=>p.root[1])),texture,overrides);}
