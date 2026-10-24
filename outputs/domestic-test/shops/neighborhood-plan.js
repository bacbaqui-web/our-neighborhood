import {stableHash,scheduleFor} from './storefront-hours.js?v=71';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const normalize=s=>(s||'').replace(/\s/g,'');
export function inside(p,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
export function categoryFor(p){
 const c=p.category_name||'';
 if(p.category_group_code==='PM9'||c.includes('약국'))return 'pharmacy';
 if(/안경/.test(c))return 'optical';
 if(/이동통신|휴대폰|통신기기/.test(c))return 'telecom';
 if(/화장품|올리브영|생활용품/.test(c))return 'retail';
 if(/제과|베이커리/.test(c))return 'bakery';
 if(/슈퍼마켓/.test(c))return 'convenience';
 if(p.category_group_code==='CS2')return 'convenience';
 if(c.includes('미용실'))return 'salon';
 if(c.includes('세탁소'))return 'laundry';
 if(c.includes('부동산중개'))return 'estate';
 if(p.category_group_code==='CE7')return 'cafe';
 if(p.category_group_code==='FD6'&&!/카페|술집|제과|떡,한과/.test(c))return 'food';
 return null;
}
export function shopLocal(p,x,z){const dx=x-p.position[0],dz=z-p.position[2];return [dx*p.n[1]-dz*p.n[0],dx*p.n[0]+dz*p.n[1]];}
export function inShopApproach(plans,x,z,pad=0){return plans.some(p=>{const [u,v]=shopLocal(p,x,z);return Math.abs(u)<p.width/2+.25+pad&&v>-.1-pad&&v<p.accessDepth+pad;});}
export function planNeighborhoodShops(buildings,places,catalog,{xz,elevation,roadInfo,arterial}){
 const placements=[],skipped=[],byOwner=new Map(),seen=new Set();
 const candidates=places.map(place=>({place,category:categoryFor(place),exact:catalog.assets.find(s=>String(s.source.placeId)===String(place.id))})).sort((a,b)=>Number(!!b.exact)-Number(!!a.exact)||String(a.place.id).localeCompare(String(b.place.id)));
 for(const {place,category,exact} of candidates){
  const skip=reason=>skipped.push({id:place.id,name:place.place_name,reason});
  if(!category){skip('unsupported-category');continue;}
  if(seen.has(place.id))continue;seen.add(place.id);
  const xy=xz([Number(place.x),Number(place.y)]),address=normalize(place.road_address_name);
  const matches=buildings.filter(b=>b.address&&address.endsWith(normalize(b.address)));
  const containing=matches.filter(b=>inside(xy,b.points));
  if(matches.length!==1&&containing.length!==1){skip(matches.length?'ambiguous-building':'outside-or-unmatched-address');continue;}
  const b=containing[0]||matches[0],count=byOwner.get(b.seed)||0;
  // A POI alone gives neither a shop floor nor a unit. Avoid inventing a mall row.
  const frontEdges=(arterial?.shopFrontages||[]).filter(f=>f.owner===b.seed);
  const frontPeers=candidates.filter(c=>c.category&&normalize(c.place.road_address_name).endsWith(normalize(b.address))).length;
  if(count>=(frontEdges.length?6:2)){skip('multiple-units-need-review');continue;}
  const dist=Math.min(...b.points.map((a,i)=>{const c=b.points[(i+1)%b.points.length],dx=c[0]-a[0],dz=c[1]-a[1],t=clamp(((xy[0]-a[0])*dx+(xy[1]-a[1])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(xy[0]-a[0]-t*dx,xy[1]-a[1]-t*dz);}));
  if(!inside(xy,b.points)&&dist>12){skip('poi-too-far-from-address');continue;}
  const sign=Math.sign(b.points.reduce((s,a,i)=>{const c=b.points[(i+1)%b.points.length];return s+a[0]*c[1]-c[0]*a[1];},0));
  const choices=[];
  b.points.forEach((a,edge)=>{
   const c=b.points[(edge+1)%b.points.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<3.6)return;
   const u=[(c[0]-a[0])/L,(c[1]-a[1])/L],n=[u[1]*sign,-u[0]*sign];
   const onArterial=frontEdges.some(f=>f.edge===edge);
   if(frontEdges.length&&!onArterial) return;
   const assets=exact?[exact]:catalog.assets.filter(s=>(onArterial?s.arterialOnly||!catalog.assets.some(a=>a.arterialOnly&&a.category===category):!s.arterialOnly)&&s.category===category&&s.height<4.6&&!(category==='salon'&&s.id==='salon-03')&&!(category==='laundry'&&s.id!=='laundry-02'));
   for(const asset of assets){
    const grade=Math.abs(elevation(a[0]+n[0]*.3,a[1]+n[1]*.3)-elevation(c[0]+n[0]*.3,c[1]+n[1]*.3))/L;
    const width=Math.min(asset.width*(onArterial?1.7:1),L-.7,onArterial?Math.max(3.15,(L-.7)/Math.min(4,frontPeers)-.22):Infinity,onArterial&&grade>.15?1.7/grade:Infinity),sx=width/asset.width;if(sx<(onArterial?.52:.69))continue;
    const target=clamp((xy[0]-a[0])*u[0]+(xy[1]-a[1])*u[1],width/2+.35,L-width/2-.35);
    const slots=onArterial?Array.from({length:Math.max(1,Math.floor((L-.45)/(width+.28)))},(_,i)=>width/2+.35+i*(width+.28)):[];
    for(const center of [...slots,target,L/2,width/2+.35,L-width/2-.35]){
     const lo=center-width/2,hi=center+width/2;if(placements.some(p=>p.owner===b.seed&&p.edge===edge&&hi+.25>p.lo&&lo-.25<p.hi))continue;
     const origin=[a[0]+u[0]*center+n[0]*.025,a[1]+u[1]*center+n[1]*.025],depths=[],heights=[];let blocked=false;
     for(let k=0;k<=8;k++){
      const along=lo+(hi-lo)*k/8,x=a[0]+u[0]*along,z=a[1]+u[1]*along;heights.push(elevation(x+n[0]*.3,z+n[1]*.3));
      let depth=0;for(let d=.3;d<=8;d+=.25){const q=[x+n[0]*d,z+n[1]*d];if(buildings.some(other=>inside(q,other.points))){if(d<1)blocked=true;break;}if(roadInfo(...q)){depth=d;break;}}
      depths.push(depth);
     }
     if(blocked||depths.filter(d=>d>0).length<6||Math.max(...heights)-Math.min(...heights)>(onArterial?1.9:.70))continue;
     const ground=Math.max(...heights)+.025,maxH=Math.min(3.85,b.top-ground-.15),sy=Math.min(1,maxH/asset.height);
     if(sy<.82||Math.min(...asset.openings.filter(o=>o.door!==undefined).map(o=>o.h*sy))<1.9)continue;
     const clearance=Math.min(...depths.filter(d=>d>0)),mean=depths.filter(d=>d>0).reduce((a,b)=>a+b,0)/depths.filter(d=>d>0).length;
     const score=mean*.8+Math.abs(center-target)*.1+(1-sx)*4+Math.abs(asset.width-width)*.2+(edge===b.frontEdge?-.7:0)+(stableHash(place.id+asset.id)%100)/500;
     choices.push({owner:b.seed,edge,lo,hi,width,height:asset.height*sy,groundSamples:heights,arterial:!!onArterial,scale:[sx,sy,1],position:[...origin.slice(0,1),ground,origin[1]],n,angle:Math.atan2(n[0],n[1]),clearance,accessDepth:Math.max(1.3,mean+.3),assetId:asset.id,score,groundMin:Math.min(...heights),address:b.address,category,placeId:place.id,name:place.place_name,placeUrl:place.place_url,reference:exact?.observedLocal||exact&&!exact.arterialOnly?'observed-local-frontage':'category-reference',match:'exact-road-address',floorSource:'ground-floor-inferred',poiDistance:dist});
    }
   }
  });
  choices.sort((a,b)=>a.score-b.score);const chosen=choices[0];
  if(!chosen){skip('no-clear-fitting-frontage');continue;}
  const base=catalog.assets.find(s=>s.id===chosen.assetId),spec=structuredClone(base);
  // Keep the reviewed facade proportions. Only projecting objects yield to narrow streets.
  spec.props=(spec.props||[]).filter(p=>(p.z||.55)+(['freezer','cafeTable'].includes(p.type)?.8:.35)<chosen.clearance-.15);
  spec.steps=(spec.steps||[]).filter(s=>s.z+s.d/2<chosen.clearance-.10);
  for(const a of spec.awnings||[])a.depth=Math.min(a.depth,Math.max(.30,chosen.clearance-.24));
  // The house keeps its real polygon; the shop gets a thin facing, not a second building.
  if(chosen.arterial){for(const o of spec.openings||[])if(o.door!==undefined&&spec.openings.length===1)o.door=(o.panes||2)-1;}
  if(chosen.arterial&&chosen.groundSamples.at(-1)<chosen.groundSamples[0]){
   for(const k of ['signs','openings','awnings','props','steps','sideSigns','panels'])for(const o of spec[k]||[]){o.x=-(o.x||0);if(o.door!==undefined)o.door=(o.panes||2)-1-o.door;for(const p of o.papers||[])p.x=-p.x;}
  }
  chosen.spec=spec;
  const hours=scheduleFor({...spec,id:String(place.id)});hours.alwaysOpen=category==='convenience'||(category==='laundry'&&/무인|셀프|워시|365/.test(place.place_name));chosen.hours=hours;
  b.storefronts??=[];b.storefronts.push(chosen);placements.push(chosen);byOwner.set(b.seed,count+1);
 }
 return {placements,skipped,qa:{sourcePlaces:places.length,placed:placements.length,arterial:placements.filter(p=>p.arterial).length,observed:placements.filter(p=>p.reference==='observed-local-frontage').length,inferred:placements.filter(p=>p.reference!=='observed-local-frontage').length,byCategory:Object.fromEntries(catalog.categories.map(c=>[c.id,placements.filter(p=>p.category===c.id).length])),skips:skipped.reduce((o,p)=>(o[p.reason]=(o[p.reason]||0)+1,o),{})}};
}

// Remove only synthesized residential fixtures crossing the commercial approach.
export function reserveShopApproaches(plan,attached,streetscape){
 const hit=points=>points?.some(p=>inShopApproach(plan.placements,...p,.15));
 const segmentHit=s=>hit([s.a,s.b,[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2]]);
 const architecture={...attached,structures:attached.structures.filter(s=>!hit(s.footprint)),wallSegments:attached.wallSegments.filter(s=>!segmentHit(s))};
 const context={...streetscape,wallRuns:streetscape.wallRuns.flatMap(w=>{if(!w.points.slice(1).some((b,i)=>segmentHit({a:w.points[i],b})))return [w];const runs=[];for(let i=1;i<w.points.length;i++){const a=w.points[i-1],b=w.points[i];if(!segmentHit({a,b}))runs.push({...w,points:[a,b]});}return runs;}),piers:streetscape.piers.filter(p=>!inShopApproach(plan.placements,p.x,p.z,.35)),gates:streetscape.gates.filter(g=>!inShopApproach(plan.placements,g.x,g.z,g.width/2)&&!hit(g.pieces?.flatMap(p=>[...p.post,...p.leaf])))};
 return {architecture,context};
}
