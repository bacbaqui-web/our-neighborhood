// A frontage is inferred from clear sightlines to a road, not a cadastral parcel.
export function planFrontages(specs,roadInfo){
 const inside=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const boxes=specs.map(s=>({s,minX:Math.min(...s.points.map(p=>p[0])),maxX:Math.max(...s.points.map(p=>p[0])),minZ:Math.min(...s.points.map(p=>p[1])),maxZ:Math.max(...s.points.map(p=>p[1]))}));
 const occupied=(x,z)=>boxes.some(b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ&&inside(x,z,b.s.points));
 for(const s of specs){let area=0;s.points.forEach((a,i)=>{const b=s.points[(i+1)%s.points.length];area+=a[0]*b[1]-b[0]*a[1]});let best=null;
 s.points.forEach((a,i)=>{const b=s.points[(i+1)%s.points.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<3)return;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,nx=uz*(area>0?1:-1),nz=-ux*(area>0?1:-1),depths=[];
 for(const t of [.08,.25,.5,.75,.92]){let hit=0;for(let d=.45;d<=9;d+=.25){const x=a[0]+ux*L*t+nx*d,z=a[1]+uz*L*t+nz*d;if(occupied(x,z))break;if(roadInfo(x,z)){hit=d;break}}depths.push(hit)}
 const coverage=depths.filter(d=>d>0).length;if(coverage<3)return;const mean=depths.reduce((n,d)=>n+d,0)/coverage,score=L*coverage/5/(1+mean*.1);if(best&&score<=best.score)return;
 const style=Math.abs(s.seed)%6,bays=Math.max(1,Math.floor((L-.5)/(style===4?1.9:style===3?3.6:style===0?3.2:2.7))),spacing=(L-.5)/bays,entry=L/2;
 best={edge:i,a,b,L,ux,uz,nx,nz,angle:Math.atan2(nx,nz),depths,coverage,mean,score,entry,bays,spacing,owner:s.seed};});
 s.frontage=best;if(best)s.frontEdge=best.edge;
 }
 return specs;
}
