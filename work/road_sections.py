"""Join tile fragments, stopping at junctions and known structure changes."""
from collections import defaultdict
from copy import deepcopy
from shapely.geometry import shape, mapping, LineString
from shapely.ops import unary_union

def group_road_sections(roads):
 layers=defaultdict(list)
 for road in roads:
  p=road['properties']
  layers[(str(p.get('layer',0)),p.get('brunnel',''))].append(road)
 result=[]
 def key(p):return tuple(round(v,6) for v in p[:2])
 def signature(r):
  p=r['properties']
  return (r.get('grade'),r.get('gradeSource'),*(str(p.get(k,'')) for k in ('lanes','oneway','vehicle','motor_vehicle')))
 for originals in layers.values():
  shapes=[shape(r['geometry']) for r in originals]
  union=unary_union(shapes)
  lines=[union] if union.geom_type=='LineString' else list(union.geoms)
  edges=[];adj=defaultdict(list)
  for line in lines:
   if line.geom_type!='LineString' or line.length<.01:continue
   mid=line.interpolate(.5,normalized=True)
   owner=min(range(len(shapes)),key=lambda i:shapes[i].distance(mid))
   coords=list(line.coords);idx=len(edges)
   edges.append((coords,originals[owner]))
   adj[key(coords[0])].append(idx);adj[key(coords[-1])].append(idx)
  used=set()
  for idx,(coords,owner) in enumerate(edges):
   if idx in used:continue
   used.add(idx);joined=list(coords)
   for reverse in (False,True):
    if reverse:joined.reverse()
    while True:
     endpoint=key(joined[-1]);incident=adj[endpoint]
     if len(incident)!=2:break
     nexts=[j for j in incident if j not in used]
     if not nexts:break
     nxt=nexts[0];points,other=edges[nxt]
     if signature(other)!=signature(owner):break
     if key(points[0])!=endpoint:points=list(reversed(points))
     joined.extend(points[1:]);used.add(nxt)
   copy=deepcopy(owner);copy.pop('editId',None)
   copy['geometry']=mapping(LineString(joined));copy['sectionVersion']=1
   result.append(copy)
 return result
