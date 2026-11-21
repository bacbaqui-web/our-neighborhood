"""Three route types; sidewalks and service strips are attached surfaces."""
from shapely.geometry import Polygon,LineString,Point,shape,box
from shapely.ops import unary_union
import math

def classify_surfaces(free,regions,network,reservation=None):
 if reservation and reservation.get('surfaces'):
  s={k:shape(v).intersection(free) for k,v in reservation['surfaces'].items()}
  sidewalk=s['sidewalk'];ped=s['pedestrian'].difference(sidewalk)
  shared=s['shared'];strip=s.get('service',shared.difference(shared.buffer(-.7,join_style=2)))
 else:
  # Old scenes have no source access tags. Preserve existing inferred footpaths.
  ped=regions['pavers'];shared=free.difference(ped)
  major=[];strokes={s['id']:s for s in network['strokes']}
  for e in network['edges']:
   s=strokes[e['stroke']]
   if s['medianWidth']>=8:major.append(LineString(e['points']).buffer(s['medianWidth']/2,join_style=2))
  major=unary_union(major).intersection(shared)
  sidewalk=major.difference(major.buffer(-1.5,join_style=2))
  # Existing scenes keep buildings fixed; the strip uses the road-edge margin.
  strip=shared.difference(shared.buffer(-.7,join_style=2)).difference(major)
  shared=shared.difference(major)
 strip=strip.difference(sidewalk.union(ped))
 asphalt=free.difference(sidewalk.union(ped).union(strip))
 return {'asphalt':asphalt,'concrete':strip,'pavers':ped,'sidewalk':sidewalk}

def drain_positions(strip,built):
 result=[]
 for polygon in ([strip] if strip.geom_type=='Polygon' else getattr(strip,'geoms',[])):
  if polygon.geom_type!='Polygon':continue
  line=LineString(polygon.exterior.coords)
  for i in range(0,int(line.length),10):
   q=line.interpolate(i);a=line.interpolate(max(0,i-.2));b=line.interpolate(min(line.length,i+.2));length=a.distance(b)
   if length<.01:continue
   ux,uz=(b.x-a.x)/length,(b.y-a.y)/length
   for side in [-1,1]:
    x,z=q.x-uz*.25*side,q.y+ux*.25*side
    corners=[(x+ux*u-uz*v,z+uz*u+ux*v) for u,v in [(-.36,-.18),(.36,-.18),(.36,.18),(-.36,.18)]]
    fp=Polygon(corners)
    if strip.covers(fp) and not built.intersects(fp) and all(math.hypot(x-p['x'],z-p['z'])>7 for p in result):
     result.append({'x':x,'z':z,'ux':ux,'uz':uz});break
 return result
