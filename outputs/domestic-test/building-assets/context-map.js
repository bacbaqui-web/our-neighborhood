export function drawContextMap(svg,context,frontEdge,onSelect){
 const width=600,height=320,pad=22,{bounds,polygons,neighbors,roads}=context,scale=Math.min((width-pad*2)/(bounds.maxX-bounds.minX),(height-pad*2)/(bounds.maxZ-bounds.minZ));
 const cx=(bounds.minX+bounds.maxX)/2,cz=(bounds.minZ+bounds.maxZ)/2,q=p=>[width/2+(p[0]-cx)*scale,height/2+(p[1]-cz)*scale];
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.replaceChildren();
 const node=(tag,attrs,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;svg.append(el);return el;};
 const path=rings=>rings.map(r=>'M'+r.map(p=>q(p).join(',')).join('L')+'Z').join(''),line=ps=>ps.map(p=>q(p).join(',')).join(' ');
 node('rect',{width,height,fill:'#f3f3eb'});
 for(const r of roads){const points=line(r.geometry.coordinates),w=(r.width||5)*scale,side=(r.sidewalkEachSide||0)*scale;
  if(side)node('polyline',{points,fill:'none',stroke:'#d8d3c5','stroke-width':w+side*2,'stroke-linejoin':'round','stroke-linecap':'round'});
  node('polyline',{points,fill:'none',stroke:'#606a70','stroke-width':w,'stroke-linejoin':'round','stroke-linecap':'round'});
  node('polyline',{points,fill:'none',stroke:'#e6e5d2','stroke-width':1,'stroke-dasharray':'5 6'});
 }
 for(const n of neighbors)node('path',{d:path(n.rings),fill:'#ccd2d1',stroke:'#8f9a98','stroke-width':1,'fill-rule':'evenodd','data-neighbor':n.id});
 polygons.forEach((p,i)=>node('path',{d:path(p),fill:i===0?'#bbdedd':'#d2e8e6',stroke:'#267d80','stroke-width':2,'fill-rule':'evenodd'}));
 const ps=polygons[0][0];
 ps.forEach((a,i)=>{const b=ps[(i+1)%ps.length],valid=Math.hypot(b[0]-a[0],b[1]-a[1])>2.4,[x1,y1]=q(a),[x2,y2]=q(b),active=i===frontEdge;
  node('line',{x1,y1,x2,y2,stroke:active?'#087e84':'#397d7d','stroke-width':active?6:2});
  if(valid){const hit=node('line',{x1,y1,x2,y2,stroke:'transparent','stroke-width':14,'data-face':i});hit.style.cursor='pointer';}
 });
 svg.onclick=event=>{const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const at=point.matrixTransform(svg.getScreenCTM().inverse());let best=null;ps.forEach((a,i)=>{const b=ps[(i+1)%ps.length];if(Math.hypot(b[0]-a[0],b[1]-a[1])<=2.4)return;const [x,y]=q(a),[bx,by]=q(b),dx=bx-x,dy=by-y,t=Math.max(0,Math.min(1,((at.x-x)*dx+(at.y-y)*dy)/(dx*dx+dy*dy))),distance=Math.hypot(at.x-x-t*dx,at.y-y-t*dy);if(distance<=10&&(!best||distance<best.distance))best={i,distance};});if(best)onSelect(best.i);};
 const a=ps[frontEdge],b=ps[(frontEdge+1)%ps.length];
 if(a&&b){const signed=ps.reduce((v,a,i)=>{const b=ps[(i+1)%ps.length];return v+a[0]*b[1]-b[0]*a[1];},0),sign=signed>=0?1:-1,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=dz/len*sign,nz=-dx/len*sign,[x,y]=q([(a[0]+b[0])/2,(a[1]+b[1])/2]),tx=x+nx*25,ty=y+nz*25;
  node('line',{x1:x,y1:y,x2:tx,y2:ty,stroke:'#087e84','stroke-width':3});node('polygon',{points:[[tx,ty],[tx-nx*9+nz*5,ty-nz*9-nx*5],[tx-nx*9-nz*5,ty-nz*9+nx*5]].map(p=>p.join(',')).join(' '),fill:'#087e84'});
  node('text',{x:tx+nx*12,y:ty+nz*12,'text-anchor':'middle','font-size':13,'font-weight':700,fill:'#07585e',stroke:'#f3f3eb','stroke-width':3,'paint-order':'stroke','pointer-events':'none'},'입구 '+(frontEdge+1));
 }
 node('text',{x:width-18,y:25,'text-anchor':'end','font-size':14,fill:'#203b45'},'북 ↑');
 const bar=10*scale;node('path',{d:`M22 ${height-24}v5h${bar}v-5`,stroke:'#34494c',fill:'none','stroke-width':2});node('text',{x:22,y:height-30,'font-size':12,fill:'#34494c'},'10m');
 svg.dataset.neighborCount=String(neighbors.length);svg.dataset.roadCount=String(roads.length);svg.dataset.selectedFace=String(frontEdge);
}
