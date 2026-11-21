"""Select whole visible objects using cheap building prisms before detailed generation."""
import math
from shapely.geometry import Point, Polygon, LineString, shape, mapping
from shapely.ops import transform, unary_union, nearest_points
from shapely.strtree import STRtree

VERSION = 3

def validate_view(value):
 if value is None:return None
 if not isinstance(value,dict):raise ValueError('시야 설정이 올바르지 않습니다.')
 heading=value.get('heading',0);fov=value.get('fov',90);eye=value.get('eyeHeight',1.65)
 if any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) for v in [heading,fov,eye]):raise ValueError('시야 설정에는 유효한 숫자가 필요합니다.')
 if not 0<=heading<360 or not 40<=fov<=120 or not .5<=eye<=3:raise ValueError('방향은 0~359도, 화면 시야는 40~120도, 눈높이는 0.5~3m로 설정하세요.')
 return {'heading':heading,'fov':fov,'eyeHeight':eye,'mode':'visible360','version':VERSION}

def local_shapes(buildings,origin):
 lat,lon=origin;a=math.radians(lat)
 sx=111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a)
 sy=111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
 return [transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])).buffer(0) for f in buildings['features']]

def snap_to_road(reservation,view,max_distance=30,roads=None):
 """Use the actual reserved surface, with clearance; never silently start off-road."""
 surfaces=reservation['surfaces'];origin=Point(0,0)
 walk=unary_union([shape(surfaces[k]) for k in ('sidewalk','pedestrian','shared')]).buffer(-.65)
 # Only use carriageway if there is no nearby pedestrian/shared surface.
 if walk.is_empty or walk.distance(origin)>max_distance:
  raise ValueError('30m 안에 사람을 놓을 길이나 인도가 없습니다. 지도에서 길 가까운 곳을 선택해 주세요.')
 candidates=[]
 for road in roads or []:
  if road.get('streetType') in ('shared','pedestrian','sidewalk'):
   q=nearest_points(origin,shape(road['geometry']))[1]
   if walk.covers(q):candidates.append(q)
 sidewalk=shape(surfaces['sidewalk']).buffer(-.8)
 if not sidewalk.is_empty:candidates.append(nearest_points(origin,sidewalk)[1])
 nearest=nearest_points(origin,walk)[1]
 # Prefer a nearby centreline/sidewalk, never discard closer safe walking space.
 candidates=[p for p in candidates if p.distance(origin)<=min(max_distance,nearest.distance(origin)+3)]
 p=min(candidates,key=origin.distance) if candidates else nearest
 if p.distance(origin)>max_distance:raise ValueError('선택한 곳에서 길이 너무 멉니다. 길 가까운 곳을 선택해 주세요.')
 view['position']=[round(p.x,5),round(p.y,5)]
 view['snappedMetres']=round(p.distance(origin),3)
 return p

def view_region(view,radius):
 return Point(*view.get('position',[0,0])).buffer(radius,quad_segs=180)

def select_view(buildings,origin,radius,view,terrain=None):
 if view is None:return buildings,None
 polygons=local_shapes(buildings,origin);p=Point(*view.get('position',[0,0]));region=view_region(view,radius)
 if any(g.contains(p) for g in polygons):raise ValueError('보정한 길 위치가 건물과 겹칩니다. 다른 길을 선택해 주세요.')
 height=(lambda x,z:terrain.height(x,z)) if terrain else (lambda x,z:0)
 eye=height(p.x,p.y)+view['eyeHeight']
 # Conservative height bounds retain roofs visible over a lower foreground house.
 tops=[height(g.centroid.x,g.centroid.y)+max(1,float(f.get('properties',{}).get('gro_flo_co') or 1))*3 for g,f in zip(polygons,buildings['features'])]
 tree=STRtree(polygons);angles={i*math.tau/1440 for i in range(1440)}
 for g in polygons:
  for part in ([g] if g.geom_type=='Polygon' else g.geoms):
   for x,z in part.exterior.coords:
    a=math.atan2(z-p.y,x-p.x)
    angles.update((a+d)%math.tau for d in (-.00001,0,.00001))
 kept=set();ground=[]
 for a in sorted(angles):
  dx,dz=math.cos(a),math.sin(a);ray=LineString([(p.x,p.y),(p.x+dx*radius,p.y+dz*radius)])
  hits=[]
  for idx in tree.query(ray,predicate='intersects'):
   idx=int(idx);d=p.distance(polygons[idx].intersection(ray))
   if d<=radius:hits.append((d,idx))
  hits.sort();horizon=-math.inf
  for d,idx in hits:
   slope=(tops[idx]-eye)/max(d,.01)
   if (tops[idx]+3-eye)/max(d,.01)>horizon-.015:kept.add(idx)
   horizon=max(horizon,slope)
  reach=hits[0][0] if hits else radius
  ground.append((p.x+dx*reach,p.y+dz*reach))
 visibility=Polygon(ground).buffer(0).simplify(.06,preserve_topology=True)
 selected=[f for i,f in enumerate(buildings['features']) if i in kept]
 qa={'inputBuildings':len(polygons),'generatedBuildings':len(selected),'skippedBuildings':len(polygons)-len(selected),'region':mapping(visibility),'occlusion':'360-degree building-prism rays with roof-height horizon','rays':len(angles),'position':view['position'],'snappedMetres':view['snappedMetres'],'proxies':[{'geometry':mapping(g),'top':top} for g,top in zip(polygons,tops)],'eyeY':eye,'radius':radius}
 return {**buildings,'features':selected},qa

def select_roads(roads,radius,view,qa=None):
 if view is None:return roads
 # Small overlap avoids cracks at the visible ends; no broad hidden-road generation.
 region=shape(qa['region']).buffer(1) if qa else view_region(view,radius)
 out=[]
 for road in roads:
  g=shape(road['geometry']).intersection(region)
  parts=[g] if g.geom_type=='LineString' else [p for p in getattr(g,'geoms',[]) if p.geom_type=='LineString']
  for part in parts:
   if part.length>.1:out.append({**road,'geometry':mapping(part)})
 # A person on a wide sidewalk must keep the adjacent road, even if its centre is occluded.
 if not out:raise ValueError('선택한 위치에서 연결된 길을 찾지 못했습니다. 다른 길을 선택해 주세요.')
 return out
