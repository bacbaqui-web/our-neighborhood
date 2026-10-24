// Detail levels retain the same silhouettes and face colors; only sub-parts expire.
// Level 0 = full, 1 = medium, 2 = distant. Values are CSS pixels per world metre.
export function chooseLOD(pixelsPerMetre, previous=null) {
 const near=22,far=9,margin=.12;
 if(previous===0&&pixelsPerMetre>=near*(1-margin))return 0;
 if(previous===2&&pixelsPerMetre<=far*(1+margin))return 2;
 if(previous===1){if(pixelsPerMetre>near*(1+margin))return 0;if(pixelsPerMetre<far*(1-margin))return 2;return 1;}
 return pixelsPerMetre>=near?0:pixelsPerMetre>=far?1:2;
}

// Called before material batching, while a mesh still represents one authored part.
// Foliage masses, body panels, wheels, frames, walls and roof forms stay at every level.
export function partMaxLOD(object) {
 if(object.isLineSegments&&object.parent?.isMesh)return partMaxLOD(object.parent);
 if(Number.isInteger(object.userData.lodMaxLevel))return object.userData.lodMaxLevel;
 if(!object.isMesh)return 2;
 const g=object.geometry,p=g.parameters||{},part=object.userData.part||object.name?.split('-')[0];
 if(['green','leaf','soil','glass'].includes(part))return 2;
 if(g.type==='CylinderGeometry') {const r=Math.max(p.radiusTop??1,p.radiusBottom??1);if(r<.0075)return 0;if(r<.015)return 1;}
 if(g.type==='TubeGeometry') {if(p.radius<.009)return 0;if(p.radius<.017)return 1;}
 if(g.type==='TorusGeometry') {if(p.tube<.008)return 0;if(p.tube<.012)return 1;}
 g.computeBoundingBox();const b=g.boundingBox,s=object.scale;
 const dimensions=[(b.max.x-b.min.x)*Math.abs(s.x),(b.max.y-b.min.y)*Math.abs(s.y),(b.max.z-b.min.z)*Math.abs(s.z)].sort((a,b)=>a-b);
 if(dimensions[2]<.06)return 0;
 if(dimensions[2]<.17||dimensions[1]<.024)return 1;
 return 2;
}
