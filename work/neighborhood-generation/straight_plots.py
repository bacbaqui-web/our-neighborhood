"""Recursive straight cuts in road blocks, avoiding every building footprint."""
# Direct script execution is a compatibility boundary; normal imports are namespaced.
if not __package__:
 from pathlib import Path as _Path
 import runpy as _runpy
 _runpy.run_path(str(_Path(__file__).with_name('legacy.py')))['ensure_package']()
 __package__='neighborhood_generation'
import math
import shapely as S
from shapely.geometry import Polygon,MultiPoint
from shapely.ops import unary_union
from .parking import axis

def partition(blocks,buildings):
 result={};empty=[];cuts=[];exceptions=[]
 def divide(region,owners,base):
  if not owners:empty.append(region);return
  if len(owners)==1:result[owners[0]]=region;return
  choices=[]
  # Prefer the same two axes throughout a block; use oblique lines only when necessary.
  angles=[base,base+90]+[base+i*5 for i in range(1,36) if i!=18]
  for rank,angle in enumerate(angles):
   a=math.radians(angle);nx,nz=math.cos(a),math.sin(a)
   intervals=[]
   for k in owners:
    vals=[x*nx+y*nz for x,y in buildings[k].exterior.coords];intervals.append((min(vals),max(vals),k))
   intervals.sort();right=max(v[1] for v in intervals[:1])
   for i in range(1,len(intervals)):
    low=intervals[i][0]
    if low-right>.12:
     t=(right+low)/2
     # One half plane gives a shared exact straight boundary, with no double walls.
     tx,tz=-nz,nx;L=2000
     clip=Polygon([(nx*t+tx*L,nz*t+tz*L),(nx*t-tx*L,nz*t-tz*L),(nx*(t-L)-tx*L,nz*(t-L)-tz*L),(nx*(t-L)+tx*L,nz*(t-L)+tz*L)])
     left=region.intersection(clip);other=region.difference(clip)
     if left.geom_type=='Polygon' and other.geom_type=='Polygon':
      ids=[v[2] for v in intervals[:i]];rest=[v[2] for v in intervals[i:]]
      length=left.boundary.intersection(other.boundary).length
      score=(0 if rank<2 else 3)+abs(len(ids)-len(rest))/len(owners)+length/300
      choices.append((score,left,other,ids,rest,angle))
    right=max(right,intervals[i][1])
   if choices and rank==1:break
  if choices:
   _,left,right,ids,rest,angle=min(choices,key=lambda v:v[0]);line=left.boundary.intersection(right.boundary)
   cuts.append(S.to_geojson(line));divide(left,ids,base);divide(right,rest,base);return
  # Interlocking footprints cannot always be separated by a single infinite line.
  # Use straight centroid cells locally, reserving each original house in full.
  exceptions.append(owners)
  centers=[buildings[k].representative_point() for k in owners]
  cells=S.voronoi_polygons(MultiPoint(centers),extend_to=region.envelope,ordered=True)
  occupied=unary_union([buildings[k] for k in owners]);used=Polygon()
  for k,cell in zip(owners,cells.geoms):
   p=cell.intersection(region).difference(occupied).union(buildings[k].intersection(region)).difference(used)
   result[k]=p;used=used.union(p)
  for rem in S.get_parts(region.difference(used)):
   if rem.area>1e-9:
    k=min(owners,key=lambda k:buildings[k].distance(rem));result[k]=result[k].union(rem)
 for block in blocks:
  owners=[k for k,h in buildings.items() if h.intersection(block).area>.01]
  divide(block,owners,axis(block))
 return result,empty,dict(straightCuts=len(cuts),exceptionGroups=exceptions,exceptionBuildings=sum(map(len,exceptions)))
