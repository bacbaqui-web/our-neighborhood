"""Attach roadside footways without hiding independent paths or changing source geometry."""
import math
from shapely.geometry import shape

def attach_sidewalks(roads):
 for r in roads:
  r.pop('sidewalkParents',None);r.pop('sidewalkSource',None)
 parents=[r for r in roads if r.get('grade',0)>=2 and r['properties'].get('class')!='busway']
 lines={r['editId']:shape(r['geometry']) for r in parents}
 for r in roads:
  p=r['properties'];sub=p.get('subclass','');foot=p.get('footway','')
  if r.get('grade',0)>0 or r.get('gradeSource')=='user' or sub in ('steps','cycleway') or foot=='crossing' or p.get('crossing'):continue
  explicit=sub=='sidewalk' or foot=='sidewalk'
  if not explicit and sub!='footway':continue
  ps=list(shape(r['geometry']).coords);total=0;matched=0;owners=set()
  for a,b in zip(ps,ps[1:]):
   length=math.dist(a,b)
   if length<.01:continue
   u=((b[0]-a[0])/length,(b[1]-a[1])/length);count=max(1,math.ceil(length/4));weight=length/count
   from shapely.geometry import Point
   for i in range(count):
    t=(i+.5)/count;pt=Point(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]));total+=weight;best=None
    for parent in parents:
     q=parent['properties']
     if any(str(p.get(k,''))!=str(q.get(k,'')) for k in ('layer','brunnel','bridge','tunnel')):continue
     if p.get('name') and p.get('name')!=q.get('name'):continue
     line=lines[parent['editId']];at=line.project(pt);near=line.interpolate(at);d=pt.distance(near)
     half=parent['width']/2;band=parent.get('sidewalkEachSide',0)
     if not max(0,half-1)<=d<=half+band+3:continue
     x=line.interpolate(max(0,at-.5));y=line.interpolate(min(line.length,at+.5));n=math.hypot(y.x-x.x,y.y-x.y)
     if not n or abs(u[0]*(y.x-x.x)/n+u[1]*(y.y-x.y)/n)<.9:continue
     if best is None or d<best[0]:best=(d,parent['editId'])
    if best:matched+=weight;owners.add(best[1])
  if total>=2 and matched/total>=.85:
   r['sidewalkParents']=sorted(owners);r['sidewalkSource']='mapped-sidewalk' if explicit else 'parallel-road-edge'
 return roads
