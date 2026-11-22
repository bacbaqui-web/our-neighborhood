"""Connect shared boundaries to real facade/gate anchors; never close protected access."""
import math
from shapely.geometry import LineString,Point
from shapely.ops import unary_union,nearest_points

def refine(walls,gaps,houses,protected,road):
 panels=[w for w in walls if w['kind']=='panel'];src=[w for w in walls if w['kind']!='panel']
 gates=[LineString([g['a'],g['b']]) for g in gaps if g['kind']!='passage']
 anchors=unary_union([houses.boundary]+gates)
 forbidden=protected.union(road.buffer(.10)).union(houses.buffer(-.02))
 kept=[];duplicates=0;snaps=0
 # Long continuous runs own the shared boundary. Remove the shorter parallel duplicate.
 for w in sorted(src,key=lambda w:-math.dist(w['a'],w['b'])):
  l=LineString([w['a'],w['b']]);u=[(w['b'][i]-w['a'][i])/l.length for i in (0,1)]
  duplicate=False
  for v,k in kept:
   if l.distance(k)>.65:continue
   du=[(v['b'][i]-v['a'][i])/k.length for i in (0,1)]
   if abs(sum(a*b for a,b in zip(u,du)))>.985 and l.intersection(k.buffer(.65,cap_style=2)).length>l.length*.8:
    duplicate=True;break
  if duplicate:duplicates+=1;continue
  kept.append((dict(w),l))
 # Extend endpoints only to nearby actual facade/gate or an existing wall.
 for idx,(w,l) in enumerate(kept):
  for key,other in [('a','b'),('b','a')]:
   p=Point(w[key]);near=nearest_points(p,anchors)[1];candidates=[near] if p.distance(near)<1.05 else []
   for j,(_,line) in enumerate(kept):
    if j==idx:continue
    q=nearest_points(p,line)[1]
    if .02<p.distance(q)<.45:candidates.append(q)
   for q in sorted(candidates,key=p.distance):
    if p.distance(q)<.015:break
    new=LineString([w[other],q]);extension=LineString([p,q])
    if extension.intersection(forbidden).length>1e-5:continue
    # Keep runs straight; no diagonal hook at a junction.
    if new.distance(p)>.12:continue
    w[key]=list(q.coords[0]);snaps+=1;break
  kept[idx]=(w,LineString([w['a'],w['b']]))
 # A free-floating component cannot divide private property naturally.
 remaining=set(range(len(kept)));result=[];removed=0
 while remaining:
  todo=[remaining.pop()];component=[]
  while todo:
   i=todo.pop();component.append(i)
   touching=[j for j in remaining if kept[i][1].distance(kept[j][1])<.06]
   for j in touching:remaining.remove(j);todo.append(j)
  endpoints=[]
  for i in component:
   for key in ['a','b']:
    p=Point(kept[i][0][key])
    if p.distance(anchors)<.12 and not any(p.distance(q)<.3 for q in endpoints):endpoints.append(p)
  frontage=any(kept[i][0].get("role")=="front" for i in component)
  if len(endpoints)<2 and not frontage:
   removed+=len(component);continue
  for i in component:
   w,l=kept[i];w['cap']=True;w['connectedBoundary']=True
   # No post on every short fragment; put piers at actual entrances or ends.
   w['posts']=frontage and len(endpoints)<2
   result.append(w)
 return panels+result,dict(duplicateRunsRemoved=duplicates,endpointsConnected=snaps,unanchoredSegmentsRemoved=removed,connectedSegments=len(result))
