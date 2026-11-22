// Selection groups only: retain original centre lines, IDs and per-carriageway widths.
export function automaticRoadGroups(roads){
 const usable=roads.filter(r=>r.grade>0&&r.properties?.class!=='busway'&&r.geometry?.type==='LineString');
 const parent=new Map(usable.map(r=>[r.editId,r.editId]));
 const find=x=>parent.get(x)===x?x:(parent.set(x,find(parent.get(x))),parent.get(x));
 const join=(a,b)=>parent.set(find(a.editId),find(b.editId));
 const flow=r=>String(r.properties?.oneway)==='-1'?-1:['1','yes','true'].includes(String(r.properties?.oneway))?1:0;
 const compatible=(a,b)=>{
  const p=a.properties||{},q=b.properties||{};
  return ['layer','brunnel','bridge','tunnel'].every(k=>String(p[k]??'')===String(q[k]??''))&&(!p.name||!q.name||p.name===q.name)&&p.class===q.class&&!!flow(a)===!!flow(b)&&!(a.manualGrade&&b.manualGrade&&a.manualGrade!==b.manualGrade);
 };
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const data=new Map(usable.map(r=>{const p=r.geometry.coordinates,length=p.slice(1).reduce((s,v,i)=>s+dist(v,p[i]),0);return [r.editId,{p,length}];}));
 const sample=(r,t)=>{const {p,length}=data.get(r.editId);let left=t*length;for(let i=1;i<p.length;i++){const d=dist(p[i-1],p[i]);if(!d)continue;if(left<=d||i===p.length-1)return {p:[p[i-1][0]+(p[i][0]-p[i-1][0])*left/d,p[i-1][1]+(p[i][1]-p[i-1][1])*left/d],u:[(p[i][0]-p[i-1][0])/d,(p[i][1]-p[i-1][1])/d]};left-=d;}return null;};
 const ends=[];
 for(const r of usable){const d=data.get(r.editId);if(d.length<.1)continue;for(const end of [0,1]){const a=sample(r,end),b=sample(r,end?Math.max(0,1-8/d.length):Math.min(1,8/d.length));const l=dist(a.p,b.p);if(l)ends.push({r,end,p:a.p,u:[(b.p[0]-a.p[0])/l,(b.p[1]-a.p[1])/l]});}}
 // A continuation must be the unique best straight choice from both ends.
 const best=new Map();
 for(const a of ends){const choices=ends.filter(b=>a.r!==b.r&&compatible(a.r,b.r)&&dist(a.p,b.p)<=1.5&&(!flow(a.r)||flow(a.r)*(a.end?-1:1)===-flow(b.r)*(b.end?-1:1))).map(b=>({b,angle:Math.acos(Math.max(-1,Math.min(1,-a.u[0]*b.u[0]-a.u[1]*b.u[1])))*180/Math.PI})).sort((a,b)=>a.angle-b.angle);if(choices[0]?.angle<=35&&(!choices[1]||choices[1].angle-choices[0].angle>=12))best.set(a,choices[0].b);}
 for(const [a,b] of best)if(best.get(b)===a)join(a.r,b.r);
 const nearest=(point,r)=>{const {p}=data.get(r.editId);let best=null;for(let i=1;i<p.length;i++){const dx=p[i][0]-p[i-1][0],dy=p[i][1]-p[i-1][1],l=Math.hypot(dx,dy);if(!l)continue;const t=Math.max(0,Math.min(1,((point[0]-p[i-1][0])*dx+(point[1]-p[i-1][1])*dy)/(l*l)));const q=[p[i-1][0]+t*dx,p[i-1][1]+t*dy],d=dist(point,q);if(!best||d<best.d)best={p:q,d,u:[dx/l,dy/l]};}return best;};
 const pairs=new Map();
 for(const a of usable){if(!flow(a)||!['primary','secondary','trunk','tertiary','motorway'].includes(a.properties.class))continue;
  const choices=[];
  for(const b of usable){if(a===b||!compatible(a,b))continue;const shorter=data.get(a.editId).length<=data.get(b.editId).length?a:b,longer=shorter===a?b:a;if(data.get(shorter.editId).length<6)continue;let hits=0,total=0;
   for(const t of [.2,.5,.8]){const s=sample(shorter,t),n=nearest(s.p,longer);if(!n)continue;const delta=[n.p[0]-s.p[0],n.p[1]-s.p[1]];if(n.d>3&&n.d<24&&(s.u[0]*n.u[0]+s.u[1]*n.u[1])*flow(shorter)*flow(longer)<-.94&&Math.abs(delta[0]*s.u[0]+delta[1]*s.u[1])<n.d*.25){hits++;total+=n.d;}}
   if(hits>=2)choices.push({b,d:total/hits});
  }
  choices.sort((a,b)=>a.d-b.d);if(choices.length)pairs.set(a,choices.filter(c=>c.d<choices[0].d+2));
 }
 for(const [a,cs] of pairs)for(const {b} of cs)if(pairs.get(b)?.some(c=>c.b===a))join(a,b);
 const groups=new Map();for(const r of usable){const k=find(r.editId);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r.editId);}return [...groups.values()].filter(g=>g.length>1).map(g=>g.sort());
}
