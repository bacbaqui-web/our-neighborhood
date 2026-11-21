import json,sys
from shapely.geometry import Polygon,Point
from shapely.strtree import STRtree
p=sys.argv[1].rstrip('/')+'/';rc=json.load(open(p+'arterial/road-context.json'));j=json.load(open(p+'junction-plan.json'));rows=[];polys=[]
for k,vs in {**rc['positions'],**rc['junctions']['geometry']}.items():
 for i in range(0,len(vs),9):
  a,b,c=[vs[i+t:i+t+3]for t in [0,3,6]];g=Polygon([(v[0],v[2])for v in [a,b,c]])
  if g.area<1e-9:continue
  rows.append((k,a,b,c));polys.append(g)
t=STRtree(polys)
for ri,r in enumerate(j['ramps']):
 print('ramp',ri)
 for f in [-.001,0,.001,.1,.75,1.499,1.5,1.501]:
  x=r['center'][0]+r['out'][0]*(f-.75);z=r['center'][1]+r['out'][1]*(f-.75);pt=Point(x,z);out=[]
  for q in t.query(pt.buffer(1e-7)):
   if not polys[q].buffer(1e-7).covers(pt):continue
   k,a,b,c=rows[q];d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;out.append((k,round(u*a[1]+v*b[1]+(1-u-v)*c[1],6)))
  print(f,sorted(set(out)))
