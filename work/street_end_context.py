"""Bounded real-map backdrop; no network, detailed models, or invented buildings."""
import math, time
from shapely.geometry import Point, LineString, Polygon, shape
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree

def build_context(collection, roads, origin, radius, view, detailed, terrain=None):
 start=time.perf_counter();lat,lon=origin;a=math.radians(lat)
 sx=111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a)
 sy=111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
 extent=max(200,radius+150);p=Point(*view.get('position',[0,0]));region=Point(0,0).buffer(extent,quad_segs=64)
 detailed_ids={int(f['properties']['objectid']) for f in detailed['features']}
 items=[]
 for f in collection['features']:
  g=transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])).buffer(0)
  if g.is_empty or not g.intersects(region):continue
  items.append((g,int(f['properties']['objectid']),max(1,float(f['properties'].get('gro_flo_co') or 1))*3))
 visible=set();geometries=[v[0] for v in items]
 if items:
  tree=STRtree(geometries);height=terrain.height if terrain else lambda x,z:0
  eye=height(p.x,p.y)+view.get('eyeHeight',2)
  tops=[height(g.centroid.x,g.centroid.y)+h for g,owner,h in items]
  # A bounded set of facade-targeted rays also catches narrow distant buildings.
  angles={j*math.tau/360 for j in range(360)}
  candidates=sorted((i for i,g in enumerate(geometries) if g.distance(p)>radius),key=lambda i:geometries[i].distance(p))[:512]
  for i in candidates:
   q=geometries[i].representative_point();angles.add(math.atan2(q.y-p.y,q.x-p.x)%math.tau)
  for angle in sorted(angles):
   ray=LineString([p.coords[0],(p.x+math.cos(angle)*(extent+30),p.y+math.sin(angle)*(extent+30))])
   hits=sorted((p.distance(geometries[int(i)].intersection(ray)),int(i)) for i in tree.query(ray,predicate='intersects'))
   horizon=-math.inf
   for distance,i in hits:
    slope=(tops[i]-eye)/max(.1,distance)
    if slope>horizon-.015:visible.add(i)
    horizon=max(horizon,slope)
 def parts(g):return [g] if g.geom_type=='Polygon' else [v for v in getattr(g,'geoms',[]) if v.geom_type=='Polygon']
 def rings(poly):return [[[round(x,3),round(z,3)] for x,z in r.coords[:-1]] for r in [poly.exterior,*poly.interiors]]
 buildings=[]
 for i in sorted(visible,key=lambda i:geometries[i].distance(p)):
  g,owner,height=items[i]
  # Keep foreground selection unchanged, including objects touching its boundary.
  if owner in detailed_ids or g.intersects(p.buffer(radius)):continue
  for poly in parts(g.simplify(.15,preserve_topology=True)):
   if len(buildings)>=256:break
   if poly.area>=3:buildings.append({'owner':owner,'height':height,'rings':rings(poly)})
 surfaces=[]
 for road in roads:
  g=shape(road['geometry']);width=max(1,float(road.get('width',4)))
  surfaces.append(g.buffer(width/2,cap_style=2,join_style=2))
 road_polys=[]
 if surfaces:
  ground=unary_union(surfaces).intersection(region).difference(p.buffer(max(0,radius-8),quad_segs=64))
  if geometries:ground=ground.difference(unary_union(geometries).buffer(.25))
  road_polys=[{'rings':rings(poly)} for poly in parts(ground.simplify(.08,preserve_topology=True)) if poly.area>.1]
 return {'version':1,'radius':extent,'source':collection.get('source'),'buildings':buildings,'roads':road_polys,
  'qa':{'buildings':len(buildings),'roads':len(road_polys),'rays':len(angles) if items else 0,'extraRequests':0,'processingMs':round((time.perf_counter()-start)*1000,1)}}
