// Mirrors road_sidewalks.py for existing saved scenes, before the next regeneration.
export function attachSidewalks(roads){
 const result=roads.map(r=>{const copy={...r};delete copy.sidewalkParents;delete copy.sidewalkSource;return copy;});
 const parents=result.filter(r=>r.grade>=2&&r.properties?.class!=='busway');
 const width=r=>{const m=String(r.properties?.width??'').match(/^\s*(\d+(?:\.\d+)?)\s*(m|meters?|metres?|ft|feet)?\s*$/i);return m?Number(m[1])*(/^(ft|feet)$/i.test(m[2]||'')?.3048:1):r.width??({2:7.1,3:13.5,4:19.9}[r.grade]);};
 const nearest=(point,r)=>{const ps=r.geometry.coordinates;let best=null;for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(!len)continue;const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(len*len))),d=Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy);if(!best||d<best.d)best={d,u:[dx/len,dy/len]};}return best;};
 for(const r of result){const p=r.properties||{},sub=p.subclass,foot=p.footway,explicit=sub==='sidewalk'||foot==='sidewalk';
  if(r.grade>0||r.gradeSource==='user'||['steps','cycleway'].includes(sub)||foot==='crossing'||p.crossing||(!explicit&&sub!=='footway'))continue;
  let total=0,matched=0;const owners=new Set(),ps=r.geometry.coordinates;
  for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.01)continue;const u=[(b[0]-a[0])/length,(b[1]-a[1])/length],count=Math.max(1,Math.ceil(length/4)),weight=length/count;
   for(let j=0;j<count;j++){const t=(j+.5)/count,pt=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];total+=weight;let best=null;
    for(const parent of parents){const q=parent.properties||{};if(['layer','brunnel','bridge','tunnel'].some(k=>String(p[k]??'')!==String(q[k]??''))||(p.name&&p.name!==q.name))continue;const n=nearest(pt,parent),half=width(parent)/2,band=parent.sidewalkEachSide??({2:1.5,3:3,4:4}[parent.grade]);if(!n||n.d<Math.max(0,half-1)||n.d>half+band+3||Math.abs(u[0]*n.u[0]+u[1]*n.u[1])<.9)continue;if(!best||n.d<best.d)best={d:n.d,id:parent.editId};}
    if(best){matched+=weight;owners.add(best.id);}
   }
  }
  if(total>=2&&matched/total>=.85){r.sidewalkParents=[...owners].sort();r.sidewalkSource=explicit?'mapped-sidewalk':'parallel-road-edge';}
 }
 return result;
}
