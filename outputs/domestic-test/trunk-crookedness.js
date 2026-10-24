// Bend only the main stem. Each branch subtree is translated at its attachment,
// preserving its own shape instead of rotating / rescaling the whole crown.
export function crookedTrunkPaths(rest,parents,{seed,height,amount=1}){
 if(!rest.length)return[];
 const n=Number(amount),strength=Number.isFinite(n)?Math.max(0,Math.min(1.5,n)):1;
 if(!strength)return rest.map(points=>points.map(p=>[...p]));
 let state=2166136261;for(const c of 'stem-'+seed)state=Math.imul(state^c.charCodeAt(0),16777619);
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
 const angle=random()*Math.PI*2,amplitude=.30*(height/10.5)*strength;
 const levels=[0,.08,.28,.50,.74,1],lateral=[0,0,.8,-.68,.55,0];
 const knots=levels.map((t,i)=>{const along=lateral[i]*(.88+random()*.24),across=i>1&&i<5?(random()-.5)*.32:0;return{t,x:along*Math.cos(angle)-across*Math.sin(angle),z:along*Math.sin(angle)+across*Math.cos(angle)};});
 const firstY=rest[0][0][1],length=rest[0].at(-1)[1]-firstY;
 const result=[rest[0].map(p=>{const t=(p[1]-firstY)/(length||1);return[p[0]+amplitude*sample(knots,t,'x'),p[1],p[2]+amplitude*sample(knots,t,'z')];})];
 for(let i=1;i<rest.length;i++){
  const parent=parents[i],a=rest[parent],b=result[parent];
  if(!a||!b)throw new Error('Tree branch parent must precede its child');
  const attachment=closestSegment(rest[i][0],a),j=attachment.index,t=attachment.t;
  const delta=[0,1,2].map(k=>(b[j][k]-a[j][k])*(1-t)+(b[j+1][k]-a[j+1][k])*t);
  result.push(rest[i].map(p=>p.map((v,k)=>v+delta[k])));
 }
 return result;
}
function sample(knots,t,key){
 if(t<=0||t>=1)return 0;
 let i=0;while(i<knots.length-2&&t>knots[i+1].t)i++;
 const a=knots[i],b=knots[i+1],span=b.t-a.t,u=(t-a.t)/span;
 const slope=j=>j===0||j===knots.length-1?0:(knots[j+1][key]-knots[j-1][key])/(knots[j+1].t-knots[j-1].t);
 const u2=u*u,u3=u2*u;
 return(2*u3-3*u2+1)*a[key]+(u3-2*u2+u)*span*slope(i)+(-2*u3+3*u2)*b[key]+(u3-u2)*span*slope(i+1);
}
function closestSegment(p,points){
 let result={index:0,t:0,distance:Infinity};
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],d=b.map((v,k)=>v-a[k]),l=d.reduce((s,v)=>s+v*v,0),t=Math.max(0,Math.min(1,d.reduce((s,v,k)=>s+v*(p[k]-a[k]),0)/(l||1))),distance=Math.hypot(...p.map((v,k)=>v-a[k]-d[k]*t));
  if(distance<result.distance)result={index:i,t,distance};
 }
 return result;
}
