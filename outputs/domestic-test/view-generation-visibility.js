// Lightweight prism tests run before detailed prop meshes are built.
let context=null;
export function configureViewVisibility(view,qa){context=view?.version===3&&qa?.proxies?{view,qa,stats:{tested:0,hidden:0,startClearance:0}}:null;}
export const viewVisibilityStats=()=>context?{...context.stats}:null;
function segments(g){const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;return polys.flatMap(p=>p.flatMap(r=>r.slice(1).map((b,i)=>[r[i],b])));}
function visibleRay(x,y,z){
 const {qa}=context,[ox,oz]=qa.position,dx=x-ox,dz=z-oz;
 for(const proxy of qa.proxies){
  if(!proxy.edges)proxy.edges=segments(proxy.geometry);
  for(const [[ax,az],[bx,bz]] of proxy.edges){
   const ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
   const t=((ax-ox)*ez-(az-oz)*ex)/den,u=((ax-ox)*dz-(az-oz)*dx)/den;
   // Leave a small tolerance for props attached to the visible facade.
   if(t>.00001&&t<1-.18/(Math.hypot(dx,dz)||1)&&u>=0&&u<=1&&qa.eyeY+(y-qa.eyeY)*t<proxy.top-.05)return false;
  }
 }
 return true;
}
export function visibleObject(x,z,height=2,radius=.5,base=0,checkStart=true){
 if(!context)return true;
 const {qa,stats}=context,[ox,oz]=qa.position;stats.tested++;
 const distance=Math.hypot(x-ox,z-oz);
 if(checkStart&&distance<radius+1.2){stats.startClearance++;return false;}
 if(distance-radius>qa.radius+1){stats.hidden++;return false;}
 for(const [dx,dz] of [[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]])for(const y of [base+.2,base+height])if(visibleRay(x+dx,y,z+dz))return true;
 stats.hidden++;return false;
}
export function visibleRecord(p,elevation=()=>0){
 if(!context||!p||typeof p!=='object')return true;
 let points=p.footprint||p.points;
 if(points?.type==='Polygon')points=points.coordinates[0];
 if(points&&!Array.isArray(points))points=null;
 if(p.a&&p.b)points=[p.a,p.b];
 if(!points&&p.geometry){const g=p.geometry;points=g.type==='Polygon'?g.coordinates[0]:g.type==='LineString'?g.coordinates:null;}
 const point=p.point||(p.root?[p.root[0],p.root[2]]:null)||(Number.isFinite(p.x)&&Number.isFinite(p.z)?[p.x,p.z]:null);
 if(!point&&!points)return true;
 const pts=points?.filter(v=>Array.isArray(v)&&v.length>=2)||[point];if(!pts.length)return true;
 const x=pts.reduce((n,p)=>n+p[0],0)/pts.length,z=pts.reduce((n,p)=>n+p[1],0)/pts.length;
 const radius=Math.max(p.radius||.4,...pts.map(p=>Math.hypot(p[0]-x,p[1]-z)));
 if(pts.length>1){
  const [ox,oz]=context.qa.position;
  const close=pts.slice(1).some((b,i)=>{const a=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((ox-a[0])*dx+(oz-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(ox-a[0]-t*dx,oz-a[1]-t*dz)<1.2;});
  if(close){context.stats.startClearance++;return false;}
 }
 return visibleObject(x,z,p.height||p.h||2,radius,elevation(x,z),pts.length===1);
}
export function filterInfillVisibility(data,elevation){
 if(!context)return data;
 const out={...data};
 for(const key of ['plants','bays','walls','gaps','gates','drains','entranceDrains','props','booths','fences'])if(Array.isArray(data[key]))out[key]=data[key].filter(p=>visibleRecord(p,elevation));
 if(data.siteDetails)out.siteDetails=filterInfillVisibility(data.siteDetails,elevation);
 return out;
}
