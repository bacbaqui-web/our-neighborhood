import * as T from 'three';
import {signGlyphs} from './sign-glyphs.js';
// Flat printed letters follow scene lighting and are embedded in the GLB geometry.
export function signLetter(b,char,width,height,material,x,y,z,back=false){
 const glyph=signGlyphs[char];if(!glyph)throw Error('Unknown sign letter: '+char);
 const path=new T.ShapePath();
 for(const [op,...p]of glyph.commands){if(op==='M')path.moveTo(...p);else if(op==='L')path.lineTo(...p);else if(op==='Q')path.quadraticCurveTo(...p);else if(op==='C')path.bezierCurveTo(...p);else path.currentPath.closePath();}
 const largest=path.subPaths.reduce((a,p)=>Math.abs(T.ShapeUtils.area(p.getPoints(8)))>Math.abs(T.ShapeUtils.area(a.getPoints(8)))?p:a);
 const shapes=path.toShapes(!T.ShapeUtils.isClockWise(largest.getPoints(8)));
 const g=new T.ShapeGeometry(shapes,8),[left,bottom,w,h]=glyph.bounds;
 g.translate(-left-w/2,-bottom-h/2,0);g.scale(width/w,height/h,1);if(back)g.rotateY(Math.PI);
 b.add(g,material,[x,y,z]);
}
