import {localPolygons} from './preview-data.js';
export const roadGrade=r=>r.grade??({'tertiary':2,'primary':3,'secondary':3,'trunk':3}[r.properties?.class]||1);
export const roadWidth=grade=>({1:5.2,2:7.1,3:13.5,4:19.9}[grade]||3);
export function roadMapData(source,context){
 const radius=Math.max(50,Number(context.detailRadius||source.input.radius||100))+30;
 const overlaps=ps=>Math.min(...ps.map(p=>p[0]))<=radius&&Math.max(...ps.map(p=>p[0]))>=-radius&&Math.min(...ps.map(p=>p[1]))<=radius&&Math.max(...ps.map(p=>p[1]))>=-radius;
 const current=new Map(source.roads.map(r=>[r.editId,r]));
 const roads=source.input.sourceRoads.filter(r=>overlaps(r.geometry.coordinates)).map(r=>({...r,grade:source.edits.roads[r.editId]?.grade??current.get(r.editId)?.grade??roadGrade(r)}));
 const buildings=source.input.buildingCollection.features.flatMap(f=>localPolygons(f,context.origin)).filter(p=>overlaps(p[0]));
 return {radius,roads,buildings,position:context.view?.position||[0,0]};
}
export function closestMapRoad(roads,point,tolerance,grades={}){
 let best=null;
 for(const road of roads){const ps=road.geometry.coordinates;for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;if(!den)continue;const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dz)/den)),distance=Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dz);if(distance<=Math.max(tolerance,roadWidth(grades[road.editId]?.grade??roadGrade(road))/2)&&(!best||distance<best.distance))best={road,distance};}}
 return best?.road||null;
}
export function drawRoadMap(svg,data,selectedId,grades,onSelect){
 const W=640,H=440,scale=Math.min(W,H)/(data.radius*2+12),q=([x,z])=>[W/2+x*scale,H/2+z*scale];
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 const node=(name,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;svg.append(n);return n;};
 node('rect',{width:W,height:H,fill:'#eef1e8'});
 for(const r of data.roads){const grade=grades[r.editId]?.grade??roadGrade(r),selected=r.editId===selectedId,points=r.geometry.coordinates.map(p=>q(p).join(',')).join(' ');node('polyline',{points,fill:'none',stroke:selected?'#e69a25':'#68777d','stroke-width':Math.max(3,roadWidth(grade)*scale)+(selected?4:0),'stroke-linejoin':'round','stroke-linecap':'round','data-road-id':r.editId});}
 for(const rings of data.buildings)node('path',{d:rings.map(ps=>'M'+ps.map(p=>q(p).join(',')).join('L')+'Z').join(''),fill:'#c5ceca',stroke:'#84938c','stroke-width':.7,'fill-rule':'evenodd','pointer-events':'none'});
 for(const r of data.roads.filter(r=>r.editId===selectedId))node('polyline',{points:r.geometry.coordinates.map(p=>q(p).join(',')).join(' '),fill:'none',stroke:'#a65300','stroke-width':2,'stroke-dasharray':'5 3','pointer-events':'none'});
 const pin=(p,color,label)=>{const [x,y]=q(p);node('circle',{cx:x,cy:y,r:6,fill:color,stroke:'white','stroke-width':2,'pointer-events':'none'});node('text',{x:x+10,y:y-10,fill:color,'font-size':13,'font-weight':700,stroke:'white','stroke-width':3,'paint-order':'stroke','pointer-events':'none'},label);};
 pin([0,0],'#df2424','선택 기준점');if(Math.hypot(...data.position)>1)pin(data.position,'#006d8c','길 위 관찰점');
 node('text',{x:W-16,y:24,'text-anchor':'end','font-size':14,fill:'#203b45'},'북 ↑');
 svg.onclick=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const at=p.matrixTransform(svg.getScreenCTM().inverse()),r=closestMapRoad(data.roads,[(at.x-W/2)/scale,(at.y-H/2)/scale],8/scale,grades);if(r)onSelect(r);};
 svg.dataset.selectedRoad=selectedId;svg.dataset.origin='0,0';
}
