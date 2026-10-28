// Roadview-informed heuristics, not surveyed utility connections or measured dimensions.
export const LIVING_RULE_VERSION=138;
export function polygonArea(points=[]){return Math.abs(points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
export function nearestFacade(x,z,owner,specs){let best=Infinity;for(const s of specs){if(s.seed!==owner)continue;for(let i=0;i<s.points.length;i++){const a=s.points[i],b=s.points[(i+1)%s.points.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}}return best;}
const fixtureIds=new Set([157,188]);
const storageIds=new Set([160,186]);
export function livingRejection({id,role,lift,area,zone,footprintArea,depth,wallGap,facadeDistance,entryDistance,existing=[],x,z,owner}){
 if(lift>0||/^(wall-|vehicle|parking|boundary|street)/.test(role))return null;
 const decor=/^(courtyard-|cluster|district-|garden-rest|entry-storage)/.test(role);
 if(!decor)return null;
 if(!Number.isFinite(area)||area<=0)return 'living-missing-yard';
 if(zone==='narrow'&&footprintArea>.65)return 'living-narrow-passage';
 if(storageIds.has(id)&&entryDistance>3.8)return 'living-storage-needs-entry';
 // A retaining wall is not evidence of plumbing; wet work stays by its own building.
 if(fixtureIds.has(id)&&facadeDistance>depth/2+.8)return 'living-wet-work-needs-facade';
 const own=existing.filter(v=>v.owner===owner&&v.lift===0&&/^(courtyard-|cluster|district-|garden-rest|entry-storage)/.test(v.role));
 const used=own.reduce((s,v)=>s+polygonArea(v.footprint),0);
 if(used+footprintArea>area*(zone==='narrow'?.08:.14))return 'living-open-space-budget';
 if(own.length>=Math.min(12,Math.max(2,Math.floor(area/14))))return 'living-household-budget';
 if(own.some(v=>v.id===id)&&[157,160,186,188].includes(id))return 'living-one-functional-fixture';
 if([157,188,156].includes(id)&&existing.some(v=>v.owner!==owner&&v.id===id&&Math.hypot(v.x-x,v.z-z)<12))return 'living-neighbor-repetition';
 return null;
}
export function rankPocketAssets(ids,owner,x,z,placements){
 const rotation=Math.abs(Number(owner)||0)%ids.length,rotated=ids.slice(rotation).concat(ids.slice(0,rotation));
 const score=id=>placements.reduce((sum,p)=>sum+(p.id===id&&Math.hypot(p.x-x,p.z-z)<18?(p.owner===owner?6:1):0),0);
 return rotated.sort((a,b)=>score(a)-score(b));
}
