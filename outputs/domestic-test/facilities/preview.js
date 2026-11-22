// Compatibility preview entry; geometry belongs to the encyclopedia.
import {createDetails} from '../details.js?v=replacements3';
import {previewBuilding as buildPreview} from '../asset-encyclopedia/categories/commerce/facility-preview.js';
export function previewBuilding(id,options={}){return buildPreview(id,{...options,createDetails});}
