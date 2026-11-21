import assert from 'node:assert/strict';
import {editorContext,previewSpecs,eraStyle} from '../outputs/domestic-test/building-assets/preview-data.js';
const origin=[37.6,127],feature=(id,dx=0)=>({properties:{objectid:id,gro_flo_co:4},geometry:{type:'Polygon',coordinates:[[[127+dx,37.6],[127.0001+dx,37.6],[127.0001+dx,37.6002],[127+dx,37.6002],[127+dx,37.6]]]}});
const f=feature(1),context=editorContext(f,[f,feature(2,.0002),feature(3,.1)],[{editId:'r',width:7.1,sidewalkEachSide:1.5,geometry:{coordinates:[[-100,5],[100,5]]},properties:{class:'tertiary'}}],origin);
assert.equal(context.neighbors.length,1);assert.equal(context.roads.length,1);assert.ok(context.bounds.minX<0&&context.bounds.maxX>8);
const spec=previewSpecs(f,origin,{floors:7,frontEdge:2,era:'new',use:'mixed'});
assert.equal(spec[0].levels,7);assert.equal(spec[0].top,21);assert.equal(spec[0].frontEdge,2);assert.equal(spec[0].seed,1);assert.ok(spec[0].points[1][0]>8);assert.equal(spec[0].previewUse,'mixed');
const multi={...f,geometry:{type:'MultiPolygon',coordinates:[f.geometry.coordinates,feature(2,.0003).geometry.coordinates]}};
assert.equal(previewSpecs(multi,origin,{floors:2,frontEdge:1}).length,2);
assert.equal(previewSpecs(f,origin,{floors:3,frontEdge:1})[0].top,9);
console.log('Building preview: geographic context, nearby filtering, real footprint, floors and entrance passed.');

assert.equal(eraStyle(1,'old'),1);assert.equal(eraStyle(1,'new'),4);assert.equal(eraStyle(2,'middle'),4);
