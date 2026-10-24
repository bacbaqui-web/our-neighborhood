// Inferred rooftop access structures, not a survey of the actual rooftop rooms.
// Stable building seeds preserve the same design when the view or LOD changes.
export const rooftopCatalog=[
 {id:'compact',name:'소형 평지붕 계단실',w:2.35,d:3.25,h:2.35},
 {id:'brick',name:'벽돌 난간 계단실',w:2.9,d:3.6,h:2.45},
 {id:'shed',name:'긴 경사지붕 계단실',w:2.45,d:4.65,h:2.35},
 {id:'gable',name:'박공지붕 계단실',w:2.85,d:3.85,h:2.30},
 {id:'elbow',name:'ㄱ자형 옥상 출입실',w:4.45,d:4.25,h:2.5},
 {id:'stepped',name:'단차형 계단·설비실',w:3.9,d:4.75,h:2.45},
 {id:'lift',name:'승강기실·계단실 결합형',w:5.1,d:4.8,h:2.55},
 {id:'hatch',name:'낮은 옥상 출입 해치',w:1.65,d:2.8,h:1.15},
];
export function rooftopRandom(seed,salt=0){let x=(seed^Math.imul(salt+1,0x9e3779b9))|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return ((x^(x>>>15))>>>0)/4294967296;}
export const rooftopDoorX=(kind,w)=>kind==='elbow'?-w*.21:kind==='lift'?-w*.25:0;
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function polygonArea(p){return Math.abs(p.reduce((a,v,i)=>{const w=p[(i+1)%p.length];return a+v[0]*w[1]-w[0]*v[1]},0))/2;}
export function pointInside(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function crosses(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<-1e-10&&cross(c,d,a)*cross(c,d,b)<-1e-10;}
function edgesCross(a,b){for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(crosses(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;return false;}
export function polygonsOverlap(a,b){return edgesCross(a,b)||a.some(p=>pointInside(p,b))||b.some(p=>pointInside(p,a));}
// All edges as well as corners are checked: four inside corners alone are not
// enough on a concave roof. A courtyard fully enclosed by the rectangle also fails.
export function roofContains(poly,building){
 if(!poly.every(p=>pointInside(p,building.points))||edgesCross(poly,building.points))return false;
 return !(building.holePoints||[]).some(hole=>polygonsOverlap(poly,hole));
}
export function roofRectangle(x,z,w,d,angle,front=0){const c=Math.cos(angle),s=Math.sin(angle);return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2+front],[-w/2,d/2+front]].map(([u,v])=>[x+c*u-s*v,z+s*u+c*v]);}
function bounds(points){return {x0:Math.min(...points.map(p=>p[0])),x1:Math.max(...points.map(p=>p[0])),z0:Math.min(...points.map(p=>p[1])),z1:Math.max(...points.map(p=>p[1]))};}
function bboxOverlaps(a,b){return a.x0<b.x1&&a.x1>b.x0&&a.z0<b.z1&&a.z1>b.z0;}
export function planRooftops(buildings){
 const indexed=buildings.map(b=>({b,bounds:bounds(b.points)})),plans=[];
 for(const [buildingIndex,building] of [...buildings.entries()].sort((a,b)=>a[1].seed-b[1].seed||a[0]-b[0])){
  const {points,seed,levels,top}=building,area=polygonArea(points);
  if(levels<2||area<16||(building.holes&&!building.holePoints?.length))continue;
  const longest=points.reduce((k,p,i)=>dist(p,points[(i+1)%points.length])>dist(points[k],points[(k+1)%points.length])?i:k,0);
  const edge=Number.isInteger(building.frontEdge)?building.frontEdge:longest;
  const a=points[edge],b=points[(edge+1)%points.length],length=dist(a,b);if(length<.01)continue;
  const signed=points.reduce((v,p,i)=>{const q=points[(i+1)%points.length];return v+p[0]*q[1]-q[0]*p[1]},0),sign=signed>=0?1:-1;
  const ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length,ix=-uz*sign,iz=ux*sign;
  const projected=points.map(p=>[(p[0]-a[0])*ux+(p[1]-a[1])*uz,(p[0]-a[0])*ix+(p[1]-a[1])*iz]),bb=bounds(projected);
  const entry=building.frontage?.entry??length/2;
  // Most cores follow the inferred entrance/stair column; some older buildings
  // have a side/rear access core. Do not put every core at the polygon centroid.
  const mode=rooftopRandom(seed,2),hintU=mode<.65?entry:mode<.83?bb.x0+(bb.x1-bb.x0)*.24:bb.x0+(bb.x1-bb.x0)*.76;
  const hintV=mode<.65?Math.min(5,(bb.z1-bb.z0)*.3):bb.z1*.68;
  const hint=[a[0]+ux*hintU+ix*hintV,a[1]+uz*hintU+iz*hintV];
  const allowed=area<40?['compact','hatch']:levels<=3?['compact','brick','shed','gable','elbow']:levels<5?['compact','brick','shed','gable','elbow','stepped']:['brick','shed','elbow','stepped','lift','lift'];
  // Avoid a run of identical huts on neighboring roofs without forcing a grid.
  const neighborhood=plans.filter(p=>dist([p.x,p.z],hint)<42);
  const designScore=id=>rooftopRandom(seed,5+rooftopCatalog.findIndex(r=>r.id===id)*13)-(id==='lift'?.15:0)+neighborhood.reduce((score,p)=>score+(p.kind===id?(1-dist([p.x,p.z],hint)/42)*.85:0),0);
  const ranked=[...new Set(allowed)].sort((a,b)=>designScore(a)-designScore(b));
  const choices=[...new Set([...ranked,'compact',...(area<65?['hatch']:[])])];
  const nearbyPlans=plans.filter(p=>Math.abs(p.top-top)<5&&bboxOverlaps(bounds(p.envelope),bounds(points)));
  const blockers=indexed.filter(q=>q.b!==building&&q.b.top>top+.1&&q.b.base<top+4.8&&bboxOverlaps(q.bounds,bounds(points)));
  let best=null;
  for(const id of choices){
   const design=rooftopCatalog.find(r=>r.id===id),scale=.92+rooftopRandom(seed,7)*.16,w=design.w*scale,d=design.d*scale,h=design.h*(.94+rooftopRandom(seed,8)*.12);
   let candidate=null;
   // Candidate grid in the building's axes, with the stair hint inserted exactly.
   const us=[hintU],vs=[hintV];for(let i=0;i<=8;i++)us.push(bb.x0+(bb.x1-bb.x0)*(i+.5)/9);for(let i=0;i<=8;i++)vs.push(bb.z0+(bb.z1-bb.z0)*(i+.5)/9);
   for(let turn=0;turn<4;turn++){
    const angle=Math.atan2(uz,ux)+turn*Math.PI/2,nx=-Math.sin(angle),nz=Math.cos(angle);
    for(const u of us)for(const v of vs){
     const x=a[0]+ux*u+ix*v,z=a[1]+uz*u+iz*v;
     const envelope=roofRectangle(x,z,w+1.1,d+1.1,angle);
     if(!roofContains(envelope,building))continue;
     const doorX=rooftopDoorX(id,w),landing=roofRectangle(x+Math.cos(angle)*doorX+nx*(d/2+.78),z+Math.sin(angle)*doorX+nz*(d/2+.78),1.3,1.4,angle);
     if(!roofContains(landing,building))continue;
     if(blockers.some(q=>polygonsOverlap(envelope,q.b.points)||polygonsOverlap(landing,q.b.points)))continue;
     if(nearbyPlans.some(p=>polygonsOverlap(envelope,p.envelope)||polygonsOverlap(landing,p.envelope)||polygonsOverlap(envelope,p.doorLanding)))continue;
     let open=0;for(const t of [2,3,4])if(pointInside([x+nx*(d/2+t),z+nz*(d/2+t)],points))open++;
     const preferredTurn=Math.floor(rooftopRandom(seed,9)*4),score=dist([x,z],hint)-open*.25+(turn===preferredTurn?-.20:0);
     if(candidate&&score>=candidate.score)continue;
     candidate={buildingIndex,owner:seed,inkObjectId:building.inkObjectId,kind:id,x,z,top,w,d,h,angle,doorNormal:[nx,nz],doorLanding:landing,envelope,footprint:roofRectangle(x,z,w+.32,d+.32,angle),score,area,levels,frontEdge:edge,variation:Math.floor(rooftopRandom(seed,11)*1000)};
    }
   }
   if(candidate){best=candidate;break;}
  }
  if(best){delete best.score;plans.push(best);}
 }
 return plans;
}
