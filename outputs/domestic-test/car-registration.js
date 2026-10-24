// Similarity registration: one scale + rotation + translation (no stretch/shear).
// Same four-parameter transform as OpenCV estimateAffinePartial2D.
export const WHEEL_POINTS=Object.freeze({FL:[.80,.014,1.36],FR:[-.80,.014,1.36],RL:[.80,.014,-1.36],RR:[-.80,.014,-1.36]});
export function fitSimilarity(source,target){
  const n=source.length;if(n<2||target.length!==n)throw Error('Two corresponding wheel landmarks are required.');
  const c=source.reduce((s,p)=>[s[0]+p[0]/n,s[1]+p[1]/n],[0,0]),d=target.reduce((s,p)=>[s[0]+p[0]/n,s[1]+p[1]/n],[0,0]);
  let den=0,real=0,imag=0;
  for(let i=0;i<n;i++){const x=source[i][0]-c[0],y=source[i][1]-c[1],u=target[i][0]-d[0],v=target[i][1]-d[1];den+=x*x+y*y;real+=x*u+y*v;imag+=x*v-y*u;}
  if(den<1e-9)throw Error('Coincident source landmarks.');
  const a=real/den,b=imag/den,tx=d[0]-a*c[0]+b*c[1],ty=d[1]-b*c[0]-a*c[1];
  let squaredError=0;
  source.forEach((p,i)=>{const q=applySimilarity([a,b,tx,ty],p);squaredError+=(q[0]-target[i][0])**2+(q[1]-target[i][1])**2;});
  return {transform:[a,b,tx,ty],scale:Math.hypot(a,b),rotation:Math.atan2(b,a),rms:Math.sqrt(squaredError/n)};
}
export function applySimilarity([a,b,tx,ty],[x,y]){return [a*x-b*y+tx,b*x+a*y+ty];}

// Schaefer/McPhail/Warren 2006, §2.3: rigid moving least squares.
// Work in source pixel units after removing the global similarity transform.
// Each handle interpolates exactly; locally the map is a rotation + translation.
// Unlike a ground-plane homography this does not flatten the entire roof/body.
export function inverseSimilarity([a,b,tx,ty],[x,y]){
  const d=a*a+b*b,xx=x-tx,yy=y-ty;
  return [(a*xx+b*yy)/d,(-b*xx+a*yy)/d];
}
export function prepareRigidMLS(handles,vertices){
  return vertices.map(v=>{
    const exact=handles.findIndex(p=>(p[0]-v[0])**2+(p[1]-v[1])**2<1e-12);
    if(exact>=0)return {exact};
    const weights=handles.map(p=>1/((p[0]-v[0])**2+(p[1]-v[1])**2));
    const sum=weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++)weights[i]/=sum;
    const center=handles.reduce((s,p,i)=>[s[0]+p[0]*weights[i],s[1]+p[1]*weights[i]],[0,0]);
    return {weights,mu:handles.reduce((s,p,i)=>s+weights[i]*((p[0]-center[0])**2+(p[1]-center[1])**2),0),relative:handles.map(p=>[p[0]-center[0],p[1]-center[1]]),v:[v[0]-center[0],v[1]-center[1]]};
  });
}
export function applyRigidMLS(prepared,targets,mode='rigid'){
 return prepared.map(p=>{
   if(p.exact!==undefined)return [...targets[p.exact]];
   let x=0,y=0,a=0,b=0;
   for(let i=0;i<targets.length;i++){const w=p.weights[i],[qx,qy]=targets[i],[px,py]=p.relative[i];x+=w*qx;y+=w*qy;a+=w*(px*qx+py*qy);b+=w*(px*qy-py*qx);}
   const n=mode==='similarity'?p.mu:Math.hypot(a,b);if(n<1e-12)return [x+p.v[0],y+p.v[1]];
   return [x+(a*p.v[0]-b*p.v[1])/n,y+(b*p.v[0]+a*p.v[1])/n];
 });
}

// Grid lines pass through all source wheel positions. Visible tire contacts are actual vertices;
// hidden wheels belong to the separate 3D support cage, NOT to the bumper/paint in front.
// (rather than checking a formula at a point that the rendered mesh never uses).
export function makeFourWheelGrid(width,height,landmarks,footprint=false){
 const wheelPixels=landmarks.map(p=>[p.uv[0]*width,p.uv[1]*height]);
 const guards=[[.12*width,.94*height],[.5*width,.98*height],[.88*width,.94*height]];
 const visibleIndices=landmarks.flatMap((p,i)=>p.observed?[i]:[]);
 const handles=[...visibleIndices.map(i=>wheelPixels[i]),...guards];
 const axes=(n,extra)=>[...new Set([...Array.from({length:n+1},(_,i)=>i/n),...extra])].sort((a,b)=>a-b);
 const xs=axes(32,landmarks.map(p=>p.uv[0])),ys=axes(24,landmarks.map(p=>p.uv[1]));
 const uv=[],vertices=[],indices=[];
 for(const y of ys)for(const x of xs){uv.push(x,y);vertices.push([x*width,y*height]);}
 for(let y=0;y<ys.length-1;y++)for(let x=0;x<xs.length-1;x++){const i=y*xs.length+x;indices.push(i,i+1,i+xs.length,i+1,i+xs.length+1,i+xs.length);}
 const anchorIndices=landmarks.map(p=>ys.indexOf(p.uv[1])*xs.length+xs.indexOf(p.uv[0]));
 return {uv,vertices,indices,anchorIndices,guards,handles,visibleIndices,footprint,prepared:prepareRigidMLS(handles,vertices)};
}
export function warpFourWheelGrid(grid,fit,mode='rigid'){
 const targets=[...grid.visibleIndices.map(i=>inverseSimilarity(fit.transform,fit.target[i])),...grid.guards];
 return applyRigidMLS(grid.prepared,targets,mode).map(p=>applySimilarity(fit.transform,p));
}

export function countFoldedTriangles(grid,warped){
 let count=0;for(let i=0;i<grid.indices.length;i+=3){const a=warped[grid.indices[i]],b=warped[grid.indices[i+1]],c=warped[grid.indices[i+2]];if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])<-1e-10)count++;}return count;
}
export function safeFourWheelWarp(grid,fit){
 if(grid.footprint){
   const project=fitFootprintProjection(fit.source,fit.target);
   if(project){const warped=grid.vertices.map(project);if(warped.every(p=>p.every(Number.isFinite))&&!countFoldedTriangles(grid,warped))return {warped,folded:0,mode:'high-angle-footprint'};}
 }
 const rigid=warpFourWheelGrid(grid,fit),folded=countFoldedTriangles(grid,rigid);
 if(!folded)return {warped:rigid,folded:0,mode:'rigid'};
 // At grazing angles the projected axle quadrilateral compresses strongly.
 // Similarity MLS permits local UNIFORM scale, keeping visible contacts exact.
 const similar=warpFourWheelGrid(grid,fit,'similarity'),other=countFoldedTriangles(grid,similar);
 if(!other)return {warped:similar,folded:0,mode:'similarity'};
 return other<folded?{warped:similar,folded:other,mode:'similarity'}:{warped:rigid,folded,mode:'rigid'};
}

// Four-contact plane projection, used only for high views where a footprint is
// well conditioned. Never apply this to grazing views or a hidden wheel under
// the foreground bumper. Source images are preserved; rendered aspect can change.
export function fitFootprintProjection(source,target){
 const rows=[];
 source.forEach(([x,y],i)=>{const [u,v]=target[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
 for(let col=0;col<8;col++){let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
  if(Math.abs(rows[pivot][col])<1e-12)return null;[rows[pivot],rows[col]]=[rows[col],rows[pivot]];
  const d=rows[col][col];for(let j=col;j<9;j++)rows[col][j]/=d;
  for(let row=0;row<8;row++)if(row!==col){const f=rows[row][col];for(let j=col;j<9;j++)rows[row][j]-=f*rows[col][j];}}
 const h=rows.map(r=>r[8]);return p=>{const [x,y]=p,d=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];};
}
