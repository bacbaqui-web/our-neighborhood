"""Reserve connected roads before fitting buildings. Widths are inferred, not surveyed."""
import json,math,copy
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import shape,mapping,LineString,Polygon,box
from shapely.ops import unary_union,transform
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
  preferred=math.atan2(vz,vx);angles=[preferred]+[i*math.tau/16 for i in range(16)]
  angles.sort(key=lambda a:-math.cos(a-preferred));fitted=None;offset=[0,0];method='trimmed'
  for distance in range(1,31):
   for angle in angles:
    dx,dz=distance*math.cos(angle),distance*math.sin(angle)
    if math.hypot(vx,vz)>.1 and dx*vx+dz*vz<-.01:continue
    candidate=translate(local,dx,dz)
    if candidate.intersection(protected).area<1e-7 and candidate.intersection(obstacles).area<1e-7:
     fitted=candidate;offset=[dx,dz];method='moved';break
   if fitted is not None:break
  if fitted is None:
   parts=[g for g in S.get_parts(local.difference(protected.buffer(.001))) if g.geom_type=='Polygon' and g.area>=6]
   if parts:fitted=max(parts,key=lambda g:g.area)
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
  kind=r['properties'].get('class','minor');line=shape(r['geometry']);width=float(r['width']);sidewalk=0;usage=street_type(r['properties'])
  if r.get('grade'):
   sidewalk=r.get('sidewalkEachSide',0)
  elif usage=='carriageway':
   width=19.9 if hasbus and kind!='tertiary' else (7.1 if kind=='tertiary' else 13.5)
   sidewalk=3.0
   # Bus stop widening and the existing main-road furniture band remain protected.
   if hasbus and kind!='tertiary':sidewalk+=2.4
  width=max(1.6,width);r['width']=width;r['streetType']=usage
  pavement=line.buffer(width/2,cap_style=2,join_style=2).intersection(extent)
  paths.append(pavement);byType[usage].append(pavement)
  if sidewalk:
   majorPaths.append(pavement);public.append(line.buffer(width/2+sidewalk,cap_style=2,join_style=2).intersection(extent))
  if usage=='shared':servicePaths.append(line.buffer(width/2+.8,cap_style=2,join_style=2).intersection(extent))
  entries.append({'serviceEachSide':.8 if usage=='shared' else 0,'routeType':usage if usage!='sidewalk' else 'pedestrian','class':kind,'streetType':usage,'vehicleAccess':usage in {'carriageway','shared'},'width':width,'sidewalkEachSide':sidewalk,'source':'road-class-inferred'})
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
