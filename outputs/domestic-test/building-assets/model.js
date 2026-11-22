// Compatibility API for town editors and old preview links.
import {createDetails} from '../details.js?v=replacements3';
import {previewModel as buildPreview} from '../asset-encyclopedia/categories/house/building-preview.js';
export {applyAssetToSpec,assetColors} from '../asset-encyclopedia/categories/house/building-preview.js';
export function previewModel(asset,specs=null){return buildPreview(asset,specs,{createDetails});}
