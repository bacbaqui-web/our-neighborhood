// Masonry has a level coping. Only its foundation follows the terrain.
export function wallSections(w,elevation){
 const [x,z]=w.a,[X,Z]=w.b,L=Math.hypot(X-x,Z-z);if(L<.03)return [];
 const ux=(X-x)/L,uz=(Z-z)/L,at=t=>[x+ux*t,z+uz*t];
 const n=Math.ceil(L/.25),points=Array.from({length:n+1},(_,i)=>{const t=L*i/n,p=at(t);return{t,p,y:elevation(...p)};});
 const maxHeight=w.maxHeight??(w.kind==='panel'?3:2),requested=Math.min(maxHeight,Math.max(.4,w.height||1.8)),out=[];
 let start=0;
 while(start<n){let end=start+1,low=Math.min(points[start].y,points[end].y),high=Math.max(points[start].y,points[end].y);
  while(end<n){const q=points[end+1],lo=Math.min(low,q.y),hi=Math.max(high,q.y);if(hi-lo>.28)break;low=lo;high=hi;end++;}
  const top=low+requested-.07;
  out.push({a:points[start].p,b:points[end].p,top,bottom:low-.08,length:points[end].t-points[start].t,angle:-Math.atan2(uz,ux),height:requested,groundMin:low,groundMax:high});start=end;
 }
 return out;
}
