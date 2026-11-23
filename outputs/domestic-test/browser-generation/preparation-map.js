import {localPolygons} from '../building-assets/preview-data.js';
import {displayedRoadWidth} from '../building-assets/road-map.js';
export const gradeColors=['#6a9770','#8a939a','#d5a050','#bd7758','#8570a7'];
export const gradeLabels=['보행 · 차 없는 길','1차 · 보차 혼용','2차 · 전체 2차로·인도','3차 · 전체 4차로','4차 · 전체 6차로 이상'];
function geometryPath(g){if(!g)return '';if(g.type==='GeometryCollection')return g.geometries.map(geometryPath).join('');const ps=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];return ps.map(p=>p.map(r=>'M'+r.map(q=>q.join(',')).join('L')+'Z').join('')).join('');}
const ns='http://www.w3.org/2000/svg';
export function createPreparationMap(svg,{radius,origin,onRoad,onBuilding,onMove,onFront,onBlank,onView}){
 let view=[-radius*1.4,-radius,radius*2.8,radius*2],data,drag;
 const setView=()=>{svg.setAttribute('viewBox',view.join(' '));onView?.();};
 const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return [q.x,q.y];};
 const node=(name,attrs,text)=>{const n=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;svg.append(n);return n;};
 svg.onwheel=e=>{e.preventDefault();if(drag)return;const p=point(e),factor=Math.exp(Math.max(-.25,Math.min(.25,e.deltaY*(e.deltaMode===1?.025:.002))));const width=Math.max(25,Math.min(radius*8,view[2]*factor)),ratio=width/view[2];view=[p[0]+(view[0]-p[0])*ratio,p[1]+(view[1]-p[1])*ratio,width,view[3]*ratio];setView();};
 svg.addEventListener('wheel',svg.onwheel,{passive:false});svg.onwheel=null;
 svg.onpointerdown=e=>{if(e.button!==0||data?.busy)return;e.preventDefault();svg.focus({preventScroll:true});const building=e.target.closest('[data-building]');drag={id:e.pointerId,start:point(e),client:[e.clientX,e.clientY],view:[...view],scale:svg.getScreenCTM().a,building:data.stage==='buildings'?building?.dataset.building:null,target:e.target,moved:false};svg.setPointerCapture(e.pointerId);};
 svg.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;const p=point(e);if(Math.hypot(e.clientX-drag.client[0],e.clientY-drag.client[1])<4&&!drag.moved)return;drag.moved=true;
  if(drag.building){drag.delta=[p[0]-drag.start[0],p[1]-drag.start[1]];for(const n of svg.querySelectorAll('[data-building]'))if(n.dataset.building===drag.building)n.setAttribute('transform',`translate(${drag.delta.join(' ')})`);}
  else{view=[drag.view[0]-(e.clientX-drag.client[0])/drag.scale,drag.view[1]-(e.clientY-drag.client[1])/drag.scale,drag.view[2],drag.view[3]];setView();}
 };
 svg.onpointerup=e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(d.moved){if(d.building)onMove(d.building,d.delta);return;}
  const edge=d.target.closest('[data-front]');if(data.stage==='buildings'&&edge){onFront(edge.dataset.building,Number(edge.dataset.front));return;}
  const b=d.target.closest('[data-building]'),r=d.target.closest('[data-road]');if(data.stage==='buildings'&&b)onBuilding(b.dataset.building,e);else if(data.stage==='roads'&&r)onRoad(r.dataset.road,e);else onBlank?.();
 };
 svg.onpointercancel=()=>{drag=null;if(data)render(data);};svg.onlostpointercapture=()=>{if(drag){drag=null;if(data)render(data);}};
 svg.onkeydown=e=>{if(data?.busy)return;if(e.target.dataset.front!==undefined&&['Enter',' '].includes(e.key)){e.preventDefault();onFront(e.target.dataset.building,Number(e.target.dataset.front));return;}if(data.stage==='buildings'&&data.selectedBuilding&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();onMove(data.selectedBuilding,{ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key]);return;}if(e.key==='+'||e.key==='='){e.preventDefault();view=[view[0]*.8,view[1]*.8,view[2]*.8,view[3]*.8];setView();}if(e.key==='-'){e.preventDefault();view=view.map(v=>v*1.25);setView();}if(['Enter',' '].includes(e.key)){const b=e.target.dataset.building,r=e.target.dataset.road;if(b||r){e.preventDefault();b?onBuilding(b,e):onRoad(r,e);}}};
 function render(next){data=next;svg.dataset.selectedRoads=JSON.stringify([...data.selection.selected]);svg.dataset.selectedBuilding=data.selectedBuilding||'';svg.replaceChildren();setView();
  node('rect',{x:-radius*8,y:-radius*8,width:radius*16,height:radius*16,fill:'#f0f2eb'});
  node('circle',{cx:0,cy:0,r:radius,fill:'none',stroke:'#ced6ce','stroke-dasharray':'2 3','vector-effect':'non-scaling-stroke'});
  node('path',{d:geometryPath(data.reservation?.surfaces?.sidewalk),fill:'#d9c7a1',stroke:'#a28d67','stroke-width':.6,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd','pointer-events':'none','data-sidewalk':'true'});
  for(const road of data.roads){if(road.sidewalkParents)continue;const grade=data.selection.gradeOf(road.editId),selected=data.stage==='roads'&&data.selection.selected.has(road.editId),points=road.geometry.coordinates.map(p=>p.join(',')).join(' '),width=displayedRoadWidth(road,grade);
   if(selected)node('polyline',{points,fill:'none',stroke:'#264b56','stroke-width':width+2.4,'stroke-linecap':'round','stroke-linejoin':'round'});
   const path=node('polyline',{points,fill:'none',stroke:gradeColors[grade]||gradeColors[1],'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round','data-road':road.editId,tabindex:data.stage==='roads'?0:-1,role:data.stage==='roads'?'button':'presentation','aria-pressed':String(selected),'aria-label':gradeLabels[grade]});
   if(selected)node('polyline',{points,fill:'none',stroke:'#fff','stroke-width':1,'stroke-dasharray':'2 2','vector-effect':'non-scaling-stroke','pointer-events':'none'});
  }
  const conflictIds=new Set((data.conflicts||[]).flatMap(c=>c.ids));
  for(const f of data.buildings?.features||[]){const id=String(f.properties.objectid),rings=localPolygons(f,origin),candidate=data.visibility?.[id]?.visible,selected=data.selectedBuilding===id,profile=f.properties.streetProfile||{};
   const path=node('path',{d:rings.map(p=>p.map(r=>'M'+r.map(q=>q.join(',')).join('L')+'Z').join('')).join(''),fill:selected?'#eecb80':candidate?(profile.use==='mixed'?'#c5b3a4':'#b9cabc'):'#e0e3dc',stroke:conflictIds.has(id)?'#c82828':selected?'#81551d':candidate?'#6c8176':'#c3cac2','stroke-width':selected?2:1,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd','data-building':id,tabindex:data.stage==='buildings'?0:-1,role:data.stage==='buildings'?'button':'presentation','aria-pressed':String(selected),'aria-label':`${profile.use==='mixed'?'상가주택':'주거 건물'}, 기준점에서 ${Math.round(data.visibility?.[id]?.distance||0)}m`,'pointer-events':data.stage==='buildings'?'auto':'none'});
   if(selected&&data.stage==='buildings'){const ring=rings[0][0];ring.forEach((a,i)=>{const b=ring[(i+1)%ring.length];if(Math.hypot(b[0]-a[0],b[1]-a[1])>2.4)node('text',{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,'font-size':2.4,'text-anchor':'middle',fill:'#4e3821',stroke:'#fff','stroke-width':.7,'paint-order':'stroke','pointer-events':'all','data-building':id,'data-front':i,tabindex:0,role:'button','aria-label':`${i+1}번 면을 입구로 선택`},String(i+1));});}
   if(data.stage==='buildings'&&profile.frontStart&&profile.frontEnd){const a=profile.frontStart,b=profile.frontEnd,m=[(a[0]+b[0])/2,(a[1]+b[1])/2],len=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/len,(b[1]-a[1])/len];node('line',{x1:m[0]-u[0]*1.3,y1:m[1]-u[1]*1.3,x2:m[0]+u[0]*1.3,y2:m[1]+u[1]*1.3,stroke:'#b85c36','stroke-width':3,'vector-effect':'non-scaling-stroke','data-building':id,'pointer-events':'none'});}
  }
  for(const conflict of data.conflicts||[])node('path',{d:geometryPath(conflict.geometry),fill:'#e127276e',stroke:'#c82828','stroke-width':1.5,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd','pointer-events':'none','data-conflict':conflict.kind});
  node('circle',{cx:0,cy:0,r:2.1,fill:'#dc3b35',stroke:'white','stroke-width':2,'vector-effect':'non-scaling-stroke','pointer-events':'none'});
 }
 return {render,point,setBusy:value=>{if(data)data.busy=value;},reset:()=>{view=[-radius*1.4,-radius,radius*2.8,radius*2];setView();}};
}
