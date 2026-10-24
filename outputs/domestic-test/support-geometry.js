// Geometry is already in world coordinates. Extend only its lower rim into the
// finished surface; columns stay vertical and roofs/doors are never sheared.
export function fitSupportBase(geometry,surface,embed=.035){
 geometry.computeBoundingBox();const bottom=geometry.boundingBox.min.y,p=geometry.attributes.position,contacts=[];
 const indices=geometry.userData.supportIndices??Array.from({length:p.count},(_,i)=>i).filter(i=>p.getY(i)<=bottom+.0001);geometry.userData.supportIndices=indices;
 for(const i of indices){
  const x=p.getX(i),z=p.getZ(i),y=surface(x,z)-embed;p.setY(i,y);contacts.push([x,y,z]);
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.groundRim=contacts;return geometry;
}

// A level top needs clearance over the whole footprint, including a terrain
// crease inside it. Sampling just its centre misses downhill/uphill corners.
export function footprintHeights(world,width,depth,surface,step=.2){
 const heights=[],nx=Math.max(1,Math.ceil(width/step)),nz=Math.max(1,Math.ceil(depth/step));
 for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++)heights.push(surface(...world(width*(i/nx-.5),depth*(j/nz-.5))));
 return {low:Math.min(...heights),high:Math.max(...heights)};
}
