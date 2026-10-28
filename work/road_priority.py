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
 if sub=='sidewalk' or props.get('footway')=='sidewalk':return 'sidewalk'
 if sub in {'footway','pedestrian','steps','cycleway'} or kind in {'path','pedestrian'} or props.get('motor_vehicle')=='no' or props.get('vehicle')=='no':return 'pedestrian'
 if kind in MAJOR or kind=='motorway':return 'carriageway'
 return 'shared'
def scales(lat):
 a=math.radians(lat);return 111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a),111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
def reserve(root,location,roads,buildings):
 root=Path(root);lat,lon=location['origin'];sx,sy=scales(lat);radius=location['sizeMetres']/2;extent=box(-radius-4,-radius-4,radius+4,radius+4)
 major=[r for r in roads if r['properties'].get('class') in MAJOR]
 hasbus=False;cache=Path(__file__).parent/'arterial-v76/seoul-stops-20260902.json'
 if cache.exists():
  for row in json.loads(cache.read_text())[1:]:
   if len(row)>5 and row[5]=='중앙차로':
    p=((float(row[3])-lon)*sx,(lat-float(row[4]))*sy)
    if max(map(abs,p))<radius:hasbus=True;break
 paths=[];majorPaths=[];public=[];entries=[];byType={k:[] for k in ['carriageway','sidewalk','shared','pedestrian']}
 for r in roads:
  kind=r['properties'].get('class','minor');line=shape(r['geometry']);width=float(r['width']);sidewalk=0;usage=street_type(r['properties'])
  if usage=='carriageway':
   width=19.9 if hasbus and kind!='tertiary' else (7.1 if kind=='tertiary' else 13.5)
   sidewalk=3.0
   # Bus stop widening and the existing main-road furniture band remain protected.
   if hasbus and kind!='tertiary':sidewalk+=2.4
  width=max(1.6,width);r['width']=width;r['streetType']=usage
  pavement=line.buffer(width/2,cap_style=2,join_style=2).intersection(extent)
  paths.append(pavement);byType[usage].append(pavement)
  if sidewalk:
   majorPaths.append(pavement);public.append(line.buffer(width/2+sidewalk,cap_style=2,join_style=2).intersection(extent))
  entries.append({'class':kind,'streetType':usage,'vehicleAccess':usage in {'carriageway','shared'},'width':width,'sidewalkEachSide':sidewalk,'source':'road-class-inferred'})
 allRoad=unary_union(paths);majorRoad=unary_union(majorPaths);majorPublic=unary_union(public)
 # Junctions belong to vehicle routes; sidewalk bands stop at side-road mouths.
 carriageway=unary_union(byType['carriageway']);shared=unary_union(byType['shared']).difference(carriageway)
 pedestrian=unary_union(byType['pedestrian']).difference(carriageway.union(shared))
 sidewalk=majorPublic.union(unary_union(byType['sidewalk'])).difference(carriageway.union(shared).union(pedestrian))
 surfaces={'carriageway':carriageway,'shared':shared,'pedestrian':pedestrian,'sidewalk':sidewalk}
 # Keep a small facade/plinth clearance outside road and sidewalk, not inside them.
 protected=allRoad.union(majorPublic).buffer(.4,join_style=2)
 original=copy.deepcopy(buildings);out=[];changed=[];omitted=[]
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
 result={'version':2,'surfaces':{k:mapping(v) for k,v in surfaces.items()},'road':mapping(allRoad),'majorRoad':mapping(majorRoad),'majorPublic':mapping(majorPublic),'protected':mapping(protected),'entries':entries,'qa':{'adjustedBuildings':len(changed),'omittedBuildings':len(omitted),'roadBuildingOverlapM2':round(built.intersection(allRoad).area,7),'sidewalkBuildingOverlapM2':round(built.intersection(majorPublic.difference(allRoad)).area,7),'changes':changed,'omittedIds':omitted},'classification':'OpenFreeMap road classes; Kakao map colors are not available in this dataset'}
 for name,data in [('buildings-source.geojson',original),('buildings.geojson',buildings),('road-reservation.json',result),('roads-source.json',{'roads':roads,'source':'OpenFreeMap / OpenStreetMap'})]:
  (root/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 return result
