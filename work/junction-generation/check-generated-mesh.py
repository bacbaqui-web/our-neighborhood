"""Read-only geometry audit of a downloaded actual generated scene."""
import sys,json,math
from pathlib import Path
from collections import defaultdict
from shapely.geometry import Point,Polygon,shape
from shapely.strtree import STRtree
root=Path(sys.argv[1]);plan=json.loads((root/'junction-plan.json').read_text());rc=json.loads((root/'arterial/road-context.json' if (root/'arterial/road-context.json').exists() else root/'road-context.json').read_text());zone=shape(plan['zone']);road=shape(plan['road']);inside=road.buffer(-.2).intersection(zone.buffer(-.01));polys=[];rows=[];vertices=defaultdict(list)
for kind,values in rc['positions'].items():
 if kind not in ('asphalt','arterial'):continue
 for i in range(0,len(values),9):
  a,b,c=[values[i+j:i+j+3] for j in (0,3,6)];poly=Polygon([(v[0],v[2]) for v in (a,b,c)])
  if poly.area<1e-10:continue
  polys.append(poly);rows.append((a,b,c))
 for i in range(0,len(values),3):
  x,y,z=values[i:i+3]
  if inside.covers(Point(x,z)):vertices[round(x,6),round(z,6)].append(y)
tree=STRtree(polys)
def heights(point):
 out=[];x,z=point.x,point.y
 for i in tree.query(point.buffer(1e-7)):
  if not polys[i].buffer(1e-7).covers(point):continue
  a,b,c=rows[i];den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
  out.append(u*a[1]+v*b[1]+(1-u-v)*c[1])
 return out
edges=[]
for poly in ([zone] if zone.geom_type=='Polygon' else zone.geoms):
 for a,b in zip(poly.exterior.coords,list(poly.exterior.coords)[1:]):
  p=Point((a[0]+b[0])/2,(a[1]+b[1])/2)
  if not road.buffer(-.2).covers(p):continue
  ys=heights(p)
  if ys:edges.append((math.dist(a,b),max(ys)-min(ys)))
shared=[max(v)-min(v) for v in vertices.values() if len(v)>1];paint={}
for name,values in rc['junctions']['geometry'].items():
 if name not in ('white','yellow'):continue
 offsets=[]
 for i in range(0,len(values),3):
  x,y,z=values[i:i+3];p=Point(x,z)
  if not zone.buffer(1e-7).covers(p):continue
  ys=heights(p)
  if ys:offsets.append(y-max(ys))
 paint[name]={'verticesChecked':len(offsets),'minLiftM':min(offsets,default=None),'maxLiftM':max(offsets,default=None)}
manifest=json.loads((root/'manifest.json').read_text())
result={'scene':manifest['id'],'generatedAt':manifest.get('generatedAt'),'junctionQA':plan['qa'],'edgeSegments':len(edges),'edgeLengthM':sum(e[0] for e in edges),'maxEdgeHeightDifferenceM':max((e[1] for e in edges),default=0),'interiorSharedVertices':len(shared),'maxInteriorHeightDifferenceM':max(shared,default=0),'paint':paint}
print(json.dumps(result,ensure_ascii=False,indent=2))
assert result['maxEdgeHeightDifferenceM']<.001
assert result['maxInteriorHeightDifferenceM']<.001
for item in paint.values():
 if item['verticesChecked']:assert .0079<item['minLiftM']<=item['maxLiftM']<.0081
