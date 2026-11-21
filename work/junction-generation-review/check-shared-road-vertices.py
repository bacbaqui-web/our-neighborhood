import collections,json,sys
from pathlib import Path
from shapely.geometry import shape,Point
p=Path(sys.argv[1]);rc=json.loads((p/'arterial/road-context.json').read_text());plan=json.loads((p/'junction-plan.json').read_text());zone=shape(plan['zone']).buffer(-.01);road=shape(plan['road']).buffer(-.2);points=collections.defaultdict(list)
for kind in ['asphalt','arterial']:
 values=rc['positions'].get(kind,[])
 for i in range(0,len(values),3):
  x,y,z=values[i:i+3];pt=Point(x,z)
  if zone.covers(pt) and road.covers(pt):points[(round(x,6),round(z,6))].append(y)
rows=sorted([(max(ys)-min(ys),xz) for xz,ys in points.items() if len(ys)>1],reverse=True)
print(json.dumps({'sharedVertices':len(rows),'maxDifferenceM':rows[0][0] if rows else None,'over1mm':[r for r in rows if r[0]>.001]}))
