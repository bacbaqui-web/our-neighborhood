import json,math
from shapely.geometry import shape,Point,Polygon
from shapely.strtree import STRtree
import sys
p=sys.argv[1].rstrip('/')+'/';plan=json.load(open(p+'junction-plan.json'));rc=json.load(open(p+'arterial/road-context.json'));zone=shape(plan['zone']);road=shape(plan['road']);rows=[];polys=[]
for kind,vs in rc['positions'].items():
 for i in range(0,len(vs),9):
  a,b,c=[vs[i+k:i+k+3]for k in [0,3,6]];poly=Polygon([(v[0],v[2])for v in [a,b,c]])
  if poly.area<1e-10:continue
  polys.append(poly);rows.append((kind,a,b,c))
tree=STRtree(polys)
def sample(pt):
 out=[]
 for i in tree.query(pt.buffer(1e-6)):
  if not polys[i].buffer(1e-6).covers(pt):continue
  k,a,b,c=rows[i];x,z=pt.x,pt.y;d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;out.append((k,u*a[1]+v*b[1]+(1-u-v)*c[1]))
 return out
segments=[]
for ring in [zone.exterior] if zone.geom_type=='Polygon' else [a.exterior for a in zone.geoms]:
 ps=list(ring.coords)
 for a,b in zip(ps,ps[1:]):
  mid=Point((a[0]+b[0])/2,(a[1]+b[1])/2)
  if road.buffer(-.2).covers(mid):
   s=sample(mid)
   if s:segments.append({'p':list(mid.coords)[0],'length':math.dist(a,b),'surfaces':s,'spread':max(y for k,y in s)-min(y for k,y in s)})
print('road interior patch edge segments',len(segments),'totalLength',sum(s['length']for s in segments),'max height spread',max(s['spread']for s in segments));print(segments[:8])
print('nonmatching', [s for s in segments if s['spread']>.001])
