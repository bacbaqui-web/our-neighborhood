"""Shared road-first layout for the setup map and final generation; no 3D assets."""
import copy, math
from shapely.geometry import shape, mapping, Point, LineString
from shapely.ops import transform
from shapely.affinity import translate
from shapely.strtree import STRtree
from road_priority import reserve, scales
from scene_edits import classify_roads, apply_building_rules, remap_building_edits, validate_road_groups, active_roads

def local_shape(feature, origin):
 sx,sy=scales(origin[0])
 return transform(lambda x,y:((x-origin[1])*sx,(origin[0]-y)*sy),shape(feature['geometry']))

def prepare_layout(root, location, collection, source_roads, edits, previous=None, progress=lambda text: None,preview=False):
 buildings=copy.deepcopy(collection);roads=copy.deepcopy(source_roads);edits=copy.deepcopy(edits)
 location={**location,'mapPreparation':True}
 origin=location['origin'];sx,sy=scales(origin[0])
 for edit in edits.get('buildings',{}).values():
  if 'deleted' in edit and type(edit['deleted']) is not bool:raise ValueError('건물 삭제 정보가 올바르지 않습니다.')
 buildings['features']=[f for f in buildings['features'] if not edits.get('buildings',{}).get(str(f['properties']['objectid']),{}).get('deleted')]
 manual=remap_building_edits(edits.get('buildings',{}),previous or collection,buildings,origin)
 classify_roads(roads,edits.get('roads',{}),origin);validate_road_groups(roads,edits.get('roadGroups',[]))
 original_roads=copy.deepcopy(roads);roads=active_roads(roads,edits)
 if not roads:raise ValueError('동네를 만들 도로를 하나 이상 남겨 주세요.')
 classify_roads(roads,edits.get('roads',{}),origin)
 progress('건물의 기준 도로와 입구를 계산합니다…')
 apply_building_rules(buildings,roads,manual,origin)
 progress('도로와 겹치는 건물을 조정합니다…')
 before=copy.deepcopy(buildings);reservation=reserve(root,location,roads,buildings)
 manual=remap_building_edits(manual,before,buildings,origin)
 before_move=copy.deepcopy(buildings)
 polygons=[local_shape(f,origin) for f in buildings['features']]
 protected=shape(reservation['protected'])
 moved=[]
 for i,f in enumerate(buildings['features']):
  offset=manual.get(str(f['properties']['objectid']),{}).get('positionOffset',[0,0])
  if not isinstance(offset,list) or len(offset)!=2 or any(type(v) not in (int,float) or not math.isfinite(v) for v in offset) or math.hypot(*offset)>30:
   raise ValueError('건물 이동은 원래 배치에서 30m 안의 유효한 좌표로 지정해 주세요.')
  candidate=translate(polygons[i],*offset)
  moved.append(candidate)
 conflicts=layout_conflicts(buildings,moved,protected,location['sizeMetres']/2)
 if conflicts and not preview:raise ValueError('겹친 도로·인도·건물을 수정한 뒤 동네를 만들어 주세요.')
 for i,(f,p) in enumerate(zip(buildings['features'],moved)):
  offset=manual.get(str(f['properties']['objectid']),{}).get('positionOffset',[0,0])
  if not any(offset):continue
  f['geometry']=mapping(transform(lambda x,y:(origin[1]+x/sx,origin[0]-y/sy),p))
  f['properties']['positionOffset']=offset
 manual=remap_building_edits(manual,before_move,buildings,origin)
 progress('조정한 건물의 용도와 입구를 맞춥니다…')
 apply_building_rules(buildings,roads,manual,origin)
 edits['buildings']=manual
 return {'buildings':buildings,'roads':roads,'sourceRoads':original_roads,'sceneEdits':edits,'reservation':reservation,'conflicts':conflicts}

def layout_conflicts(buildings,polygons,protected,radius=float('inf')):
 tree=STRtree(polygons);result=[]
 ids=[str(f['properties']['objectid']) for f in buildings['features']]
 for i,p in enumerate(polygons):
  overlap=p.intersection(protected)
  if p.distance(Point(0,0))<=radius and overlap.area>1e-5:result.append({'kind':'road','ids':[ids[i]],'geometry':mapping(overlap)})
  for j in tree.query(p):
   if j<=i or min(p.distance(Point(0,0)),polygons[j].distance(Point(0,0)))>radius:continue
   overlap=p.intersection(polygons[j])
   if overlap.area>1e-5:result.append({'kind':'building','ids':[ids[i],ids[j]],'geometry':mapping(overlap)})
 return result

def flat_visibility(collection,origin,radius):
 """Nearest footprint hit by planar straight rays; excludes height/terrain."""
 polygons=[local_shape(f,origin) for f in collection['features']];tree=STRtree(polygons)
 origin_point=Point(0,0);visible=set();angles=set(i*math.tau/720 for i in range(720))
 for p in polygons:
  if p.distance(origin_point)>radius:continue
  for part in ([p] if p.geom_type=='Polygon' else p.geoms):
   for x,z in part.exterior.coords:
    a=math.atan2(z,x);angles.update([a-1e-6,a,a+1e-6])
 for a in angles:
  ray=LineString([(0,0),(radius*math.cos(a),radius*math.sin(a))]);hits=[]
  for j in tree.query(ray):
   hit=polygons[j].intersection(ray)
   if not hit.is_empty:hits.append((origin_point.distance(hit),int(j)))
  if hits:visible.add(min(hits)[1])
 return {str(f['properties']['objectid']):{'visible':i in visible,'distance':round(polygons[i].distance(origin_point),2)} for i,f in enumerate(collection['features'])}


def reposition_layout(cached,edits,origin,radius):
 """Reuse unchanged road fitting for a building drag; keep original offset origin."""
 result=copy.deepcopy(cached);before=copy.deepcopy(result['buildings']);sx,sy=scales(origin[0]);moved_areas=[]
 changed={k for k in set(edits.get('buildings',{}))|set(cached['sceneEdits'].get('buildings',{})) if edits.get('buildings',{}).get(k)!=cached['sceneEdits'].get('buildings',{}).get(k)}
 for f in result['buildings']['features']:
  owner=str(f['properties']['objectid']);offset=edits.get('buildings',{}).get(owner,{}).get('positionOffset',[0,0])
  if not isinstance(offset,list) or len(offset)!=2 or any(type(v) not in (int,float) or not math.isfinite(v) for v in offset) or math.hypot(*offset)>30:raise ValueError('건물 이동은 원래 배치에서 30m 안으로 지정해 주세요.')
  old=cached['sceneEdits'].get('buildings',{}).get(owner,{}).get('positionOffset',[0,0])
  if offset==old:continue
  previous=local_shape(f,origin);p=translate(previous,offset[0]-old[0],offset[1]-old[1]);moved_areas.extend([previous,p])
  f['geometry']=mapping(transform(lambda x,y:(origin[1]+x/sx,origin[0]-y/sy),p));f['properties']['positionOffset']=offset
 manual=remap_building_edits(edits.get('buildings',{}),before,result['buildings'],origin)
 polygons=[local_shape(f,origin) for f in result['buildings']['features']]
 affected=changed|{str(f['properties']['objectid']) for f,p in zip(result['buildings']['features'],polygons) if any(p.distance(area)<=40 for area in moved_areas)}
 apply_building_rules(result['buildings'],result['roads'],manual,origin,only_ids=affected)
 result['sceneEdits']={**copy.deepcopy(edits),'buildings':manual}
 result['conflicts']=layout_conflicts(result['buildings'],polygons,shape(result['reservation']['protected']),radius)
 result['visibility']=flat_visibility(result['buildings'],origin,radius-30)
 return result
