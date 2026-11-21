"""Follow unambiguous straight continuations, including across junctions."""
from collections import defaultdict
from copy import deepcopy
import math
from shapely.geometry import shape, mapping, LineString, Point
from shapely.ops import unary_union

# Geometric tolerances, not road-class or legal standards.
MAX_TURN=35
AMBIGUITY_MARGIN=12

def group_road_sections(roads):
 layers=defaultdict(list)
 for road in roads:
  p=road['properties']
  layers[(str(p.get('layer',0)),p.get('brunnel',''))].append(road)
 result=[]
 def key(p):return tuple(round(v,6) for v in p[:2])
 def manual(r):return r.get('manualGrade') or (r.get('grade') if r.get('gradeSource')=='user' else None)
 def one(r):
  value=str(r['properties'].get('oneway','')).lower()
  return -1 if value=='-1' else 1 if value in ('1','true','yes') else 0
 def compatible(a,b):
  if (a.get('grade')==0)!=(b.get('grade')==0):return False
  # Do not silently expand a user's old correction into previously automatic roads.
  if manual(a)!=manual(b):return False
  for field in ('lanes','vehicle','motor_vehicle'):
   x,y=a['properties'].get(field),b['properties'].get(field)
   if x not in (None,'') and y not in (None,'') and str(x)!=str(y):return False
  return bool(one(a))==bool(one(b))
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
   flow=one(originals[owner])
   a,b=coords[:2]
   # Interior samples avoid the start/end projection seam of closed ways.
   sample=lambda t:Point(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
   if shapes[owner].project(sample(.75))<shapes[owner].project(sample(.25)):flow=-flow
   edges.append((coords,originals[owner],line.length,flow))
   adj[key(coords[0])].append(idx);adj[key(coords[-1])].append(idx)
  def direction(idx,endpoint):
   coords=edges[idx][0]
   if key(coords[0])!=endpoint:coords=list(reversed(coords))
   line=LineString(coords);p=line.interpolate(min(8,line.length))
   dx,dz=p.x-coords[0][0],p.y-coords[0][1];length=math.hypot(dx,dz)
   return (dx/length,dz/length) if length else (0,0)
  links={}
  for endpoint,incident in adj.items():
   best={}
   for i in incident:
    x,z=direction(i,endpoint);candidates=[]
    for j in incident:
     if i==j:continue
     a,b=direction(j,endpoint)
     turn=math.degrees(math.acos(max(-1,min(1,-x*a-z*b))))
     candidates.append((turn,j))
    candidates.sort()
    if candidates and candidates[0][0]<=MAX_TURN and (len(candidates)==1 or candidates[1][0]-candidates[0][0]>=AMBIGUITY_MARGIN):
     best[i]=candidates[0][1]
   for i,j in best.items():
    direction_i=edges[i][3]*(1 if key(edges[i][0][0])==endpoint else -1)
    direction_j=edges[j][3]*(1 if key(edges[j][0][0])==endpoint else -1)
    flows_match=not direction_i or direction_i==-direction_j
    if best.get(j)==i and flows_match and compatible(edges[i][1],edges[j][1]):links[(endpoint,i)]=j
  used=set()
  for idx,(coords,owner,length,flow) in enumerate(edges):
   if idx in used:continue
   used.add(idx);joined=list(coords);members=[idx]
   for reverse in (False,True):
    if reverse:joined.reverse()
    current=idx
    while True:
     endpoint=key(joined[-1]);nxt=links.get((endpoint,current))
     if nxt is None or nxt in used:break
     points,other,_,_=edges[nxt]
     if not all(compatible(edges[j][1],other) for j in members):break
     if key(points[0])!=endpoint:points=list(reversed(points))
     joined.extend(points[1:]);used.add(nxt);members.append(nxt);current=nxt
   # Confirmed lane metadata beats estimates; otherwise use the dominant length.
   weights=defaultdict(float)
   for j in members:weights[edges[j][1].get('grade')]+=edges[j][2]
   representative=max(members,key=lambda j:(bool(edges[j][1]['properties'].get('lanes')),weights[edges[j][1].get('grade')],edges[j][2]))
   copy=deepcopy(edges[representative][1]);copy.pop('editId',None);copy.pop('manualGrade',None)
   explicit=next((manual(edges[j][1]) for j in members if manual(edges[j][1])),None)
   if explicit:copy.update(manualGrade=explicit,grade=explicit,gradeSource='user')
   if edges[representative][3]:
    a,b=map(key,edges[representative][0][:2])
    forward=next((key(x)==a for x,y in zip(joined,joined[1:]) if (key(x),key(y)) in ((a,b),(b,a))),True)
    copy['properties']['oneway']=edges[representative][3]*(1 if forward else -1)
   copy['geometry']=mapping(LineString(joined));copy['sectionVersion']=2
   result.append(copy)
 return result
