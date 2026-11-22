"""Compare building-axis layouts; retain only bays reachable through 2.8m clear lanes."""
import math
import shapely as S
from shapely.geometry import box,Point
from shapely.ops import unary_union
from shapely.affinity import rotate

def axis(h):
 c=list(h.minimum_rotated_rectangle.exterior.coords)
 a,b=max(zip(c,c[1:]),key=lambda ab:math.dist(*ab))
 return math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))

def plan(p,free,road,angle):
 best=[];tested=[]
 # Full-width maneuvering space is tested against road-connected free space.
 for deg in [angle,angle+90]:
  f=S.set_precision(S.make_valid(rotate(free,-deg,origin=(0,0))),1e-6);r=S.set_precision(rotate(road.intersection(p.buffer(14)),-deg,origin=(0,0)),1e-6);xmin,ymin,xmax,ymax=f.bounds
  for ox in [0,1.3]:
   for oy in [0,3.2,6.4]:
    candidates=[];x=xmin+ox
    while x+2.6<=xmax+.001:
     y=ymin+oy
     while y+5.2<=ymax+.001:
      q=box(x,y,x+2.6,y+5.2)
      if f.covers(q):candidates.append((q,x+1.3,y+2.6))
      y+=9.7
     x+=2.6
    if not candidates:continue
    occupied=S.set_precision(unary_union([v[0] for v in candidates]),1e-6)
    drive=f.difference(occupied).union(r).buffer(.025).buffer(-1.425)
    reachable=unary_union([v for v in S.get_parts(drive) if v.intersection(r.buffer(-.4)).area>.01])
    accepted=[]
    for q,x,y in candidates:
     for sign in [-1,1]:
      mouth=Point(x,y+sign*4.05)
      if reachable.distance(mouth)>.15:continue
      a=math.radians(deg);ux,uz=math.cos(a),math.sin(a);nx,nz=sign*math.sin(a),-sign*math.cos(a)
      pt=rotate(Point(x,y),deg,origin=(0,0));foot=rotate(q,deg,origin=(0,0))
      access=rotate(box(x-1.3,min(y+sign*2.6,y+sign*4.05),x+1.3,max(y+sign*2.6,y+sign*4.05)),deg,origin=(0,0))
      accepted.append(dict(point=[pt.x,pt.y],direction=[ux,uz,nx,nz],foot=foot,access=access));break
    tested.append(dict(angle=round(deg,2),offset=[ox,oy],count=len(accepted)))
    if len(accepted)>len(best):best=accepted
 return best,tested
