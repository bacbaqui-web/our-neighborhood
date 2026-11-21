// View-only search: never moves buildings, changes roads, or overrides shop placement.
function inside([x,z],ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function shopFocusView(shop,buildings,{roadInfo,elevation}){
 const [x,y,z]=shop.position,[nx,nz]=shop.n,ux=nz,uz=-nx,ideal=Math.max(8,shop.width*1.35);
 const nearby=buildings.filter(b=>Math.min(...b.points.map(p=>p[0]))<=x+ideal*2&&Math.max(...b.points.map(p=>p[0]))>=x-ideal*2&&Math.min(...b.points.map(p=>p[1]))<=z+ideal*2&&Math.max(...b.points.map(p=>p[1]))>=z-ideal*2);
 const blocked=(a,b)=>nearby.some(v=>inside([a,b],v.points)&&!(v.holePoints||[]).some(h=>inside([a,b],h)));
 const target=[x+nx*.12,y+Math.min(1.9,shop.height*.52),z+nz*.12];let best=null;
 for(let d=ideal;d>=.8;d-=.25)for(const shift of [0,-.35,.35,-.7,.7]){
  const side=shift*Math.min(shop.width,d),cx=x+nx*d+ux*side,cz=z+nz*d+uz*side;
  if([[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3]].some(([a,b])=>blocked(cx+a,cz+b)))continue;
  const length=Math.hypot(cx-target[0],cz-target[2]);let hidden=false;
  for(let step=.15;step<length;step+=.15){const t=step/length;if(blocked(target[0]+(cx-target[0])*t,target[2]+(cz-target[2])*t)){hidden=true;break;}}
  if(hidden)continue;
  const score=(roadInfo(cx,cz)?0:100)+(ideal-d)+Math.abs(side)*.8;
  if(!best||score<best.score)best={position:[cx,Math.max(elevation(cx,cz)+1.65,y+Math.min(3.1,1.8+d*.14)),cz],target,score};
 }
 return best;
}
