import json,math
from shapely.geometry import shape,Point,Polygon
from shapely.strtree import STRtree
import sys
p=sys.argv[1].rstrip('/')+'/';plan=json.load(open(p+'junction-plan.json'));rc=json.load(open(p+'arterial/road-context.json'));arterial=json.load(open(p+'arterial/plan.json'));zone=shape(plan['zone']);road=shape(plan['road']);rows=[];polys=[]
for kind,vs in rc['positions'].items():
 for i in range(0,len(vs),9):
  a,b,c=[vs[i+k:i+k+3]for k in [0,3,6]];poly=Polygon([(v[0],v[2])for v in [a,b,c]])
  if poly.area<1e-10:continue
  polys.append(poly);rows.append((kind,a,b,c))
tree=STRtree(polys)
def sample(x,z):
 pt=Point(x,z);out=[]
 for i in tree.query(pt.buffer(1e-6)):
  if not polys[i].buffer(1e-6).covers(pt):continue
  k,a,b,c=rows[i];d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;out.append(u*a[1]+v*b[1]+(1-u-v)*c[1])
 return max(out) if out else None
for name,values in [('white',rc['junctions']['geometry']['white']),('yellow',rc['junctions']['geometry']['yellow']),('blue',arterial['decals']['blue'])]:
 out=[]
 for i in range(0,len(values),3):
  x,y,z=values[i:i+3];pt=Point(x,z)
  if not zone.buffer(1e-5).covers(pt) or zone.boundary.distance(pt)>2:continue
  h=sample(x,z)
  if h is not None:out.append((y-h,x,z))
 print(name,'samples',len(out),'min',min(out) if out else None,'max',max(out) if out else None)
