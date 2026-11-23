"""Shared street decisions and explicit per-scene corrections, before generation."""
import hashlib,json,math,re
from shapely.geometry import shape,Point,LineString,Polygon
from shapely.strtree import STRtree
from shapely.ops import transform,nearest_points,unary_union
WIDTHS={1:(5.2,0),2:(7.1,1.5),3:(13.5,3),4:(19.9,4)}
def measured_width(properties):
 raw=properties.get('width')
 if raw in (None,''):return None
 match=re.fullmatch(r'\s*(\d+(?:\.\d+)?)\s*(m|meters?|metres?|ft|feet)?\s*',str(raw),re.I)
 if not match:raise ValueError('도로 폭 정보의 단위나 숫자를 확인해 주세요: '+str(raw))
 width=float(match[1])*(.3048 if (match[2] or '').lower() in ('ft','feet') else 1)
 if not .5<=width<=100:raise ValueError('도로 폭 정보는 0.5~100m 범위여야 합니다.')
 return width

def classify_roads(roads,edits,origin=None):
 stops=[]
 if origin:
  from pathlib import Path
  from road_priority import scales
  sx,sy=scales(origin[0]);cache=Path(__file__).parent/'arterial-v76/seoul-stops-20260902.json'
  if cache.exists():
   for row in json.loads(cache.read_text())[1:]:
    if len(row)>5 and row[5]=='중앙차로':
     x=(float(row[3])-origin[1])*sx;z=(origin[0]-float(row[4]))*sy
     if abs(x)<600 and abs(z)<600:stops.append(Point(x,z))
 for r in roads:
  if not r.get('editId'):
   coords=list(map(list,r['geometry']['coordinates']));canonical=min(coords,list(reversed(coords)))
   r['editId']=hashlib.sha256(json.dumps(canonical,separators=(',',':')).encode()).hexdigest()[:16]
  p=r['properties'];kind=p.get('class','minor');sub=p.get('subclass','')
  pedestrian=kind in ('path','pedestrian') or sub in ('footway','sidewalk','pedestrian','steps','cycleway') or p.get('footway')=='sidewalk' or p.get('vehicle')=='no' or p.get('motor_vehicle')=='no'
  grade=0 if pedestrian else 2 if kind=='tertiary' else 3 if kind in ('primary','secondary','trunk','motorway') else 1
  raw=p.get('lanes')
  try:
   n=int(raw)
   if not pedestrian and not p.get('oneway'):grade=4 if n>=6 else 3 if n==4 else 2 if n==2 else grade
  except (TypeError,ValueError):pass
  if grade>=2 and any(shape(r['geometry']).distance(p)<12 for p in stops):grade=4
  value=edits.get(r['editId'])
  if value is not None:
   if not isinstance(value,dict) or type(value.get('grade')) is not int or value['grade'] not in (0,1,2,3,4):raise ValueError('도로 등급은 보행·1~4차도로 중에서 선택해 주세요.')
   grade=value['grade']
  r['grade']=grade;r['gradeSource']='user' if value else 'inferred'
  if grade:
   r['width'],r['sidewalkEachSide']=WIDTHS[grade]
   actual=measured_width(p)
   if actual is not None:r['width']=actual
   p['sceneGrade']=grade
  else:
   r['width']=measured_width(p) or 2.2
   r['sidewalkEachSide']=0
   if value is not None:p['sceneGrade']=0
   else:p.pop('sceneGrade',None)
 from road_geometry import pair_and_taper
 pair_and_taper(roads)
 for r in roads:
  if r.get('grade') and measured_width(r['properties']) is not None:r['widthSource']='source-width'
 from road_sidewalks import attach_sidewalks
 return attach_sidewalks(roads)

def apply_building_rules(collection,roads,edits,origin=None,local=False,only_ids=None):
 from road_priority import scales
 sx,sy=scales(origin[0]) if origin else (1,1)
 def geometry(f):return shape(f['geometry']) if local else transform(lambda x,y:((x-origin[1])*sx,(origin[0]-y)*sy),shape(f['geometry']))
 polygons=[geometry(f) for f in collection['features']]
 tree=STRtree(polygons)
 road_candidates=[r for r in roads if r.get('grade')]
 road_lines=[shape(r['geometry']) for r in road_candidates]
 road_tree=STRtree(road_lines)
 road_reach=max((r['width']/2+r.get('sidewalkEachSide',0)+12 for r in road_candidates),default=0)
 for index,(f,poly) in enumerate(zip(collection['features'],polygons)):
  p=f['properties'];owner=str(p['objectid'])
  if only_ids is not None and owner not in only_ids:continue
  manual=edits.get(owner,{})
  if not isinstance(manual,dict):raise ValueError('건물 수정 정보 형식이 올바르지 않습니다.')
  if poly.geom_type!='Polygon':poly=max(poly.geoms,key=lambda g:g.area)
  ring=list(poly.exterior.coords);candidates=[]
  others=unary_union([polygons[j] for j in tree.query(poly.buffer(40)) if j!=index])
  inner=poly.buffer(-.1);blocked=others.buffer(.1)
  for road_index in sorted(road_tree.query(poly.buffer(road_reach))):
   r=road_candidates[road_index];line=road_lines[road_index];gap=poly.distance(line)-r['width']/2-r.get('sidewalkEachSide',0)
   if gap>12:continue
   for i,(a,b) in enumerate(zip(ring,ring[1:])):
    edge=LineString([a,b])
    if edge.length<=2.4:continue
    mid=edge.interpolate(.5,normalized=True);q=nearest_points(mid,line)[1]
    access=LineString([mid,q])
    if access.intersection(inner).length>.1 or access.intersection(blocked).length>.1:continue
    candidates.append((-r['grade'],max(0,mid.distance(line)-r['width']/2),-edge.length,i,r))
  best=min(candidates,key=lambda c:c[:4]) if candidates else None
  grade=best[4]['grade'] if best else 1;front=best[3] if best else 0
  if 'frontEdge' in manual:
   if type(manual['frontEdge']) is not int or not 0<=manual['frontEdge']<len(ring)-1:raise ValueError('입구를 놓을 건물 면을 다시 선택해 주세요.')
   front=manual['frontEdge']
   if LineString([ring[front],ring[front+1]]).length<=2.4:raise ValueError('입구를 놓으려면 길이가 2.4m보다 긴 면을 선택해 주세요.')
  if 'floors' in manual:
   if type(manual['floors']) is not int or not 1<=manual['floors']<=200:raise ValueError('층수는 1~200 사이의 정수로 입력해 주세요.')
   p['gro_flo_co']=manual['floors'];p['floorsEstimated']=False;p['floorsSource']='user'
  elif p.get('floorsEstimated'):
   p['gro_flo_co']=min(4,2+int(poly.area>100)+int(poly.area>200)) if grade<=2 else (min(8,3+int(poly.area/100)) if grade==3 else min(16,4+int(poly.area/100)))
  era=manual.get('era','old' if poly.area<180 else 'new');style=manual.get('styleIndex',([0,1,2,4][int(owner)%4] if era=='old' else 4 if era=='middle' else [3,4,5][int(owner)%3]))
  if era not in ('old','middle','new') or type(style) is not int or style not in range(6):raise ValueError('건물 연식과 디자인을 다시 선택해 주세요.')
  known_use=str(p.get('bdtyp_cd') or '')
  default_use='residential' if known_use.startswith(('01','02')) else 'mixed' if known_use.startswith(('03','04','05','07')) else 'residential' if grade==1 else 'mixed'
  use=manual.get('use',default_use)
  if use not in ('residential','mixed'):raise ValueError('건물 용도를 다시 선택해 주세요.')
  housing={}
  apartment=known_use=='02001' or any(word in str(p.get('building_name') or p.get('buld_nm_dc') or '') for word in ('아파트','아너스빌','래미안','힐스테이트','푸르지오'))
  if not apartment and best and grade==1 and use=='residential' and not manual.get('assetId') and (not known_use or known_use.startswith(('01','02'))):
   from alley_housing import classify
   housing=classify(poly,front,shape(best[4]['geometry']))
   if housing['housingType']=='detached':
    if 'floors' not in manual:p['gro_flo_co']=2;p['floorsSource']='alley-housing-rule';p['floorsEstimated']=True
    if 'styleIndex' not in manual:style=0
    if 'era' not in manual:era='old'
   elif housing['housingType']=='old-villa':
    if 'era' not in manual:era='old'
    if 'styleIndex' not in manual:style=[0,1,2,4][int(owner)%4]
   if 'floors' not in manual and p.get('floorsEstimated'):p['gro_flo_co']=max(2,p['gro_flo_co'])
  p['streetProfile']={**housing,'grade':grade,'roadId':best[4]['editId'] if best else None,'frontEdge':front,'frontStart':list(ring[front]),'frontEnd':list(ring[front+1]),'era':era,'styleIndex':style,'use':use,'source':'user' if manual else 'inferred','manualFields':list(manual),'assetId':manual.get('assetId'),'resetLegacyAsset':bool(manual.get('resetLegacyAsset'))}
 return collection

def align_profile(profile,polygon):
 if not profile:return None
 ring=list(polygon.exterior.coords);a=Point(profile['frontStart']);b=Point(profile['frontEnd'])
 def score(pair):
  c,d=map(Point,pair)
  return min(a.distance(c)+b.distance(d),a.distance(d)+b.distance(c))
 edge=min(range(len(ring)-1),key=lambda i:score((ring[i],ring[i+1])))
 return {**profile,'frontEdge':edge}

def validate_road_groups(roads,groups):
 if not isinstance(groups,list):raise ValueError('도로 묶음 정보를 읽지 못했습니다.')
 by_id={r['editId']:r for r in roads};seen=set()
 for group in groups:
  if not isinstance(group,list) or len(group)<2:raise ValueError('도로 묶음에는 두 구간 이상이 필요합니다.')
  for key in group:
   if not isinstance(key,str) or key not in by_id or key in seen:raise ValueError('도로 묶음의 구간 정보가 맞지 않습니다.')
   seen.add(key)
  if len({by_id[key]['grade'] for key in group})!=1:raise ValueError('묶은 도로의 등급을 하나로 맞춰 주세요.')

def prepare_editable_roads(roads,edits,origin=None,preserve=False):
 from road_sections import group_road_sections
 for road in roads:road.pop('manualGrade',None)
 classify_roads(roads,edits.get('roads',{}),origin)
 for road in roads:
  if road.get('gradeSource')=='user':road['manualGrade']=road['grade']
 # Once a user has edited logical groups, keep original segment identities,
 # including after unlinking the last group. Never merge their IDs away.
 if not preserve:
  roads=group_road_sections(roads)
  classify_roads(roads,{},origin)
 validate_road_groups(roads,edits.get('roadGroups',[]))
 return roads

def remap_building_edits(edits,before,after,origin):
 """Keep the user's selected wall through translation or footprint trimming."""
 import copy
 result=copy.deepcopy(edits);sx,sy=__import__('road_priority').scales(origin[0])
 old={str(f['properties']['objectid']):f for f in before.get('features',[])}
 new={str(f['properties']['objectid']):f for f in after.get('features',[])}
 for owner,edit in result.items():
  if 'frontEdge' not in edit or owner not in old or owner not in new:continue
  def polygon(f):
   p=transform(lambda x,y:((x-origin[1])*sx,(origin[0]-y)*sy),shape(f['geometry']))
   return p if p.geom_type=='Polygon' else max(p.geoms,key=lambda g:g.area)
  a,b=polygon(old[owner]),polygon(new[owner]);ring=list(a.exterior.coords);i=edit['frontEdge']
  if type(i) is not int or i<0 or i>=len(ring)-1:continue # normal validation reports malformed input
  old_offset=old[owner]['properties'].get('roadFit',{}).get('offset',[0,0]);new_offset=new[owner]['properties'].get('roadFit',{}).get('offset',[0,0]);old_manual=old[owner]['properties'].get('positionOffset',[0,0]);new_manual=new[owner]['properties'].get('positionOffset',[0,0]);dx,dz=new_offset[0]-old_offset[0]+new_manual[0]-old_manual[0],new_offset[1]-old_offset[1]+new_manual[1]-old_manual[1]
  start=Point(ring[i][0]+dx,ring[i][1]+dz);end=Point(ring[i+1][0]+dx,ring[i+1][1]+dz);target=list(b.exterior.coords)
  choices=[j for j in range(len(target)-1) if LineString(target[j:j+2]).length>2.4]
  if choices:edit['frontEdge']=min(choices,key=lambda j:min(start.distance(Point(target[j]))+end.distance(Point(target[j+1])),end.distance(Point(target[j]))+start.distance(Point(target[j+1]))))
 return result


def active_roads(roads,edits):
 """Exclude user-deleted segments without discarding the original snapshot."""
 ids=edits.get('excludedRoads',[])
 known={r['editId'] for r in roads}
 if not isinstance(ids,list) or any(not isinstance(i,str) or i not in known for i in ids) or len(set(ids))!=len(ids):
  raise ValueError('삭제한 도로 정보를 읽지 못했습니다.')
 excluded=set(ids)
 return [r for r in roads if r['editId'] not in excluded]
