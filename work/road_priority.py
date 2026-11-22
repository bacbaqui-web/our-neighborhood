"""Reserve connected roads before fitting buildings. Widths are inferred, not surveyed."""
import json,math,copy
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import shape,mapping,LineString,Polygon,box
from shapely.ops import unary_union,transform
from road_geometry import pavement as road_pavement,median_spaces
MAJOR={'primary','secondary','trunk','tertiary'}
def street_type(props):
 # Access restrictions override road class; width alone never means no vehicles.
 kind=props.get('class','minor');sub=props.get('subclass','')
 if props.get('sceneGrade'):return 'shared' if props['sceneGrade']==1 else 'carriageway'
 if sub=='sidewalk' or props.get('footway')=='sidewalk':return 'sidewalk'
 if sub in {'footway','pedestrian','steps','cycleway'} or kind in {'path','pedestrian'} or props.get('motor_vehicle')=='no' or props.get('vehicle')=='no':return 'pedestrian'
 if kind in MAJOR or kind=='motorway':return 'carriageway'
 return 'shared'
def scales(lat):
 a=math.radians(lat);return 111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a),111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
def fit_buildings(buildings,protected,roads,origin):
 """Keep confirmed public space fixed; move nearby, then trim if crowded."""
 from shapely.affinity import translate
 from shapely.ops import nearest_points
 from shapely.strtree import STRtree
 from scene_edits import align_profile
 lat,lon=origin;sx,sy=scales(lat)
 polygons=[S.make_valid(transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry']))) for f in buildings['features']]
 tree=STRtree(polygons);lines=unary_union([shape(r['geometry']) for r in roads]);placed=[];out=[];changes=[];omitted=[]
 for index,(f,local) in enumerate(zip(buildings['features'],polygons)):
  if local.intersection(protected).area<1e-6:out.append(f);continue
  owner=f['properties']['objectid'];near=[polygons[int(j)] for j in tree.query(local.buffer(35)) if int(j)!=index]
  obstacles=unary_union(near+placed).buffer(.05);c=local.centroid;q=nearest_points(c,lines)[1];vx,vz=c.x-q.x,c.y-q.y
  # Push only away from this road. Never search sideways or jump over a neighbor.
  length=math.hypot(vx,vz)
  if length<.001:
   line=min(S.get_parts(lines),key=lambda g:g.distance(c));at=line.project(c)
   a=line.interpolate(max(0,at-.1));b=line.interpolate(min(line.length,at+.1))
   vx,vz=-(b.y-a.y),b.x-a.x;length=math.hypot(vx,vz)
  ux,uz=(vx/length,vz/length) if length else (0,1)
  def shifted(distance):return translate(local,ux*distance,uz*distance)
  def swept(distance):
   # Full swept footprint, including the path between the two positions.
   dx,dz=ux*distance,uz*distance;parts=[local,shifted(distance)]
   for part in S.get_parts(local):
    if part.geom_type!='Polygon':continue
    for ring in [part.exterior,*part.interiors]:
     coords=list(ring.coords)
     for a,b in zip(coords,coords[1:]):
      quad=Polygon([a,b,(b[0]+dx,b[1]+dz),(a[0]+dx,a[1]+dz)])
      if quad.area>1e-10:parts.append(quad)
   return unary_union(parts)
  # Original neighbors remain fixed obstacles, even if another road affects them.
  # If already touching/overlapping, do not push farther into them.
  limit=30.
  if local.intersection(obstacles).area>1e-7:limit=0.
  elif swept(limit).intersection(obstacles).area>1e-7:
   low,high=0.,limit
   for _ in range(22):
    mid=(low+high)/2
    if swept(mid).intersection(obstacles).area>1e-7:high=mid
    else:low=mid
   limit=max(0.,low-.0001)
  # Stop as soon as the building clears the road; otherwise use the available gap.
  distance=limit;last=0.
  for step in range(1,math.ceil(limit/.25)+1):
   trial=min(limit,step*.25)
   if shifted(trial).intersection(protected).area<1e-7:
    low,high=last,trial
    for _ in range(20):
     mid=(low+high)/2
     if shifted(mid).intersection(protected).area<1e-7:high=mid
     else:low=mid
    distance=high;break
   last=trial
  offset=[ux*distance,uz*distance];candidate=shifted(distance)
  fitted=candidate;method='moved'
  if candidate.intersection(protected).area>1e-7:
   parts=[g for g in S.get_parts(candidate.difference(protected.buffer(.001))) if g.geom_type=='Polygon' and g.area>=6]
   fitted=max(parts,key=lambda g:g.area) if parts else None
   method='moved-and-trimmed' if distance>.001 else 'trimmed'
  if fitted is None:
   omitted.append(owner);continue
  if fitted.geom_type!='Polygon':fitted=max((g for g in S.get_parts(fitted) if g.geom_type=='Polygon'),key=lambda g:g.area)
  profile=f['properties'].get('streetProfile')
  if profile:
   profile={**profile,'frontStart':[profile['frontStart'][0]+offset[0],profile['frontStart'][1]+offset[1]],'frontEnd':[profile['frontEnd'][0]+offset[0],profile['frontEnd'][1]+offset[1]]}
   profile=align_profile(profile,fitted);ring=list(fitted.exterior.coords);profile.update(frontStart=list(ring[profile['frontEdge']]),frontEnd=list(ring[profile['frontEdge']+1]));f['properties']['streetProfile']=profile
  info={'method':method,'offset':offset,'beforeM2':round(local.area,2),'afterM2':round(fitted.area,2)}
  f['properties']['roadFit']=info;changes.append({'id':owner,**info})
  f['geometry']=mapping(transform(lambda x,y:(lon+x/sx,lat-y/sy),fitted));out.append(f);placed.append(fitted)
 buildings['features']=out
 return changes,omitted

def reserve(root,location,roads,buildings):
 root=Path(root);lat,lon=location['origin'];sx,sy=scales(lat);radius=location['sizeMetres']/2;extent=box(-radius-4,-radius-4,radius+4,radius+4)
 major=[r for r in roads if r['properties'].get('class') in MAJOR]
 hasbus=False;cache=Path(__file__).parent/'arterial-v76/seoul-stops-20260902.json'
 if cache.exists():
  for row in json.loads(cache.read_text())[1:]:
   if len(row)>5 and row[5]=='중앙차로':
    p=((float(row[3])-lon)*sx,(lat-float(row[4]))*sy)
    if max(map(abs,p))<radius:hasbus=True;break
 paths=[];majorPaths=[];public=[];servicePaths=[];entries=[];byType={k:[] for k in ['carriageway','sidewalk','shared','pedestrian']}
 for r in roads:
  kind=r['properties'].get('class','minor');line=shape(r['geometry']);width=float(r['width']);sidewalk=0;usage='sidewalk' if r.get('sidewalkParents') else street_type(r['properties'])
  if r.get('grade'):
   sidewalk=r.get('sidewalkEachSide',0)
  elif usage=='carriageway':
   width=19.9 if hasbus and kind!='tertiary' else (7.1 if kind=='tertiary' else 13.5)
   sidewalk=3.0
   # Bus stop widening and the existing main-road furniture band remain protected.
   if hasbus and kind!='tertiary':sidewalk+=2.4
  width=max(1.6,width);r['width']=width;r['streetType']=usage
  pavement=road_pavement(r).intersection(extent)
  if r.get('sidewalkParents'):public.append(pavement)
  else:paths.append(pavement)
  byType[usage].append(pavement)
  if sidewalk:
   majorPaths.append(pavement);public.append(road_pavement(r,sidewalk,outer=True).intersection(extent))
  if usage=='shared':servicePaths.append(line.buffer(width/2+.8,cap_style=2,join_style=2).intersection(extent))
  entries.append({'serviceEachSide':.8 if usage=='shared' else 0,'routeType':usage if usage!='sidewalk' else 'pedestrian','class':kind,'streetType':usage,'vehicleAccess':usage in {'carriageway','shared'},'width':width,'sidewalkEachSide':sidewalk,'source':'road-class-inferred'})
 median=median_spaces(roads).intersection(extent)
 paths.append(median);majorPaths.append(median);public.append(median);byType['carriageway'].append(median)
 allRoad=unary_union(paths);majorRoad=unary_union(majorPaths);majorPublic=unary_union(public)
 # Junctions belong to vehicle routes; sidewalk bands stop at side-road mouths.
 carriageway=unary_union(byType['carriageway']);shared=unary_union(byType['shared']).difference(carriageway)
 pedestrian=unary_union(byType['pedestrian']).difference(carriageway.union(shared))
 sidewalk=majorPublic.union(unary_union(byType['sidewalk'])).difference(carriageway.union(shared).union(pedestrian))
 service=unary_union(servicePaths).difference(carriageway.union(shared).union(pedestrian).union(sidewalk))
 surfaces={'service':service,'carriageway':carriageway,'shared':shared,'pedestrian':pedestrian,'sidewalk':sidewalk}
 # Keep a small facade/plinth clearance outside road and sidewalk, not inside them.
 allRoad=allRoad.union(service)
 protected=allRoad.union(majorPublic).buffer(.4,join_style=2)
 original=copy.deepcopy(buildings);out=[];changed=[];omitted=[]
 if any(r.get('grade') for r in roads):
  changed,omitted=fit_buildings(buildings,protected,roads,[lat,lon])
  built=unary_union([transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])) for f in buildings['features']])
  if built.intersection(protected).area>1e-5:raise ValueError('확정한 도로 밖으로 건물을 배치하지 못했습니다.')
  result={'version':5,'surfaces':{k:mapping(v) for k,v in surfaces.items()},'road':mapping(allRoad),'majorRoad':mapping(majorRoad),'majorPublic':mapping(majorPublic),'protected':mapping(protected),'entries':entries,'qa':{'adjustedBuildings':len(changed),'omittedBuildings':len(omitted),'roadBuildingOverlapM2':round(built.intersection(allRoad).area,7),'sidewalkBuildingOverlapM2':round(built.intersection(majorPublic).area,7),'inferredSurfaceTrimmedM2':0,'unresolvedRoadBuildingConflicts':[],'changes':changed,'omittedIds':omitted},'classification':'confirmed-road-first; buildings moved or fitted outside carriageways and sidewalks'}
  source_path=root/'buildings-source.geojson'
  if not source_path.exists():source_path.write_text(json.dumps(original,ensure_ascii=False,separators=(',',':')))
  for name,value in [('buildings.geojson',buildings),('road-reservation.json',result),('roads-source.json',{'roads':roads,'source':'OpenFreeMap / OpenStreetMap'})]:(root/name).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')))
  return result

 for f in buildings['features']:
  local=transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry']))
  cut=S.make_valid(local).difference(protected)
  candidates=[g for g in S.get_parts(cut) if g.geom_type=='Polygon' and g.area>=(6 if local.intersects(protected) else .01)]
  if not candidates:
   omitted.append(f['properties']['objectid']);continue
  # One contiguous footprint per building; avoid isolated slivers across a road.
  fitted=max(candidates,key=lambda g:g.area)
  if local.symmetric_difference(fitted).area>.01:
   changed.append({'id':f['properties']['objectid'],'beforeM2':round(local.area,2),'afterM2':round(fitted.area,2)})
  f['geometry']=mapping(transform(lambda x,y:(lon+x/sx,lat-y/sy),fitted));out.append(f)
 buildings['features']=out
 built=unary_union([transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])) for f in out])
 overlap=built.intersection(protected).area
 if overlap>.0001:raise ValueError('건물이 도로 또는 보도와 겹쳐 생성을 중단했습니다.')
 result={'version':3,'surfaces':{k:mapping(v) for k,v in surfaces.items()},'road':mapping(allRoad),'majorRoad':mapping(majorRoad),'majorPublic':mapping(majorPublic),'protected':mapping(protected),'entries':entries,'qa':{'adjustedBuildings':len(changed),'omittedBuildings':len(omitted),'roadBuildingOverlapM2':round(built.intersection(allRoad).area,7),'sidewalkBuildingOverlapM2':round(built.intersection(majorPublic.difference(allRoad)).area,7),'changes':changed,'omittedIds':omitted},'classification':'OpenFreeMap road classes; Kakao map colors are not available in this dataset'}
 for name,data in [('buildings-source.geojson',original),('buildings.geojson',buildings),('road-reservation.json',result),('roads-source.json',{'roads':roads,'source':'OpenFreeMap / OpenStreetMap'})]:
  (root/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 return result
