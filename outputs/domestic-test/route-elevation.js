// A local correction field constrained by observed road profiles. All consumers
// rebuild against the corrected terrain; furniture and buildings are not warped.
export function routeCorrection(data,xz,base){
 const segments=data.segments.map(pair=>pair.map(p=>{const [x,z]=xz(p);return {x,z,delta:p[2]-data.datum-base(x,z),target:p[2]-data.datum};}));
 function delta(x,z){
  let sum=0,weights=0,nearest=Infinity;
  for(const [a,b] of segments){const dx=b.x-a.x,dz=b.z-a.z,L=dx*dx+dz*dz;if(L<1e-8)continue;
   const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/L)),d=Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
   nearest=Math.min(nearest,d);const w=1/(d*d+.04)**2;sum+=w*(a.delta+(b.delta-a.delta)*t);weights+=w;
  }
  const u=Math.max(0,Math.min(1,(nearest-25)/95)),fade=1-u*u*(3-2*u);
  return weights?sum/weights*fade:0;
 }
 return {delta,segments};
}

export function deformTerrain(root,delta){
 let vertices=0,maxShift=0;
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh||!(o.name==='ground'||o.name==='road'||o.name==='path'||o.userData.roadFinish))return;
  // Source terrain and finish geometry use world-space vertices with identity nodes.
  const p=o.geometry.attributes.position;
  for(let i=0;i<p.count;i++){const d=delta(p.getX(i),p.getZ(i));p.setY(i,p.getY(i)+d);maxShift=Math.max(maxShift,Math.abs(d));vertices++;}
  p.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
 });
 return {vertices,maxShift};
}
