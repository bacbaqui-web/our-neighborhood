"""Shared street decisions and explicit per-scene corrections, before generation."""
import hashlib,json,math
from shapely.geometry import shape,Point,LineString,Polygon
from shapely.strtree import STRtree
from shapely.ops import transform,nearest_points,unary_union
WIDTHS={1:(5.2,0),2:(7.1,1.5),3:(13.5,3),4:(19.9,4)}
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
  pedestrian=kind in ('path','pedestrian') or sub in ('footway','pedestrian','steps','cycleway') or p.get('vehicle')=='no' or p.get('motor_vehicle')=='no'
  grade=0 if pedestrian else 2 if kind=='tertiary' else 3 if kind in ('primary','secondary','trunk','motorway') else 1
  raw=p.get('lanes')
  try:
   n=int(raw)
   if not pedestrian and not p.get('oneway'):grade=4 if n>=6 else 3 if n==4 else 2 if n==2 else grade
  except (TypeError,ValueError):pass
  if grade>=2 and any(shape(r['geometry']).distance(p)<12 for p in stops):grade=4
  value=edits.get(r['editId'])
  if value is not None:
   if not isinstance(value,dict) or type(value.get('grade')) is not int or value['grade'] not in WIDTHS:raise ValueError('도로 등급은 1~4차도로 중에서 선택해 주세요.')
   grade=value['grade']
  r['grade']=grade;r['gradeSource']='user' if value else 'inferred'
  if grade:
   r['width'],r['sidewalkEachSide']=WIDTHS[grade]
   p['sceneGrade']=grade
  else:
   r['sidewalkEachSide']=0;p.pop('sceneGrade',None)
 return roads

def apply_building_rules(collection,roads,edits,origin=None,local=False):
 from road_priority import scales
 sx,sy=scales(origin[0]) if origin else (1,1)
 def geometry(f):return shape(f['geometry']) if local else transform(lambda x,y:((x-origin[1])*sx,(origin[0]-y)*sy),shape(f['geometry']))
 polygons=[geometry(f) for f in collection['features']]
 tree=STRtree(polygons)
 for index,(f,poly) in enumerate(zip(collection['features'],polygons)):
  p=f['properties'];owner=str(p['objectid']);manual=edits.get(owner,{})
  if not isinstance(manual,dict):raise ValueError('건물 수정 정보 형식이 올바르지 않습니다.')
  if poly.geom_type!='Polygon':poly=max(poly.geoms,key=lambda g:g.area)
  ring=list(poly.exterior.coords);candidates=[]
  others=unary_union([polygons[j] for j in tree.query(poly.buffer(40)) if j!=index])
  for r in roads:
   if not r.get('grade'):continue
   line=shape(r['geometry']);gap=poly.distance(line)-r['width']/2-r.get('sidewalkEachSide',0)
   if gap>12:continue
   for i,(a,b) in enumerate(zip(ring,ring[1:])):
    edge=LineString([a,b])
    if edge.length<=2.4:continue
    mid=edge.interpolate(.5,normalized=True);q=nearest_points(mid,line)[1]
    access=LineString([mid,q])
    if access.intersection(poly.buffer(-.1)).length>.1 or access.intersection(others.buffer(.1)).length>.1:continue
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
  p['streetProfile']={'grade':grade,'roadId':best[4]['editId'] if best else None,'frontEdge':front,'frontStart':list(ring[front]),'frontEnd':list(ring[front+1]),'era':era,'styleIndex':style,'use':use,'source':'user' if manual else 'inferred','manualFields':list(manual),'assetId':manual.get('assetId'),'resetLegacyAsset':bool(manual.get('resetLegacyAsset'))}
 return collection

def align_profile(profile,polygon):
 if not profile:return None
 ring=list(polygon.exterior.coords);a=Point(profile['frontStart']);b=Point(profile['frontEnd'])
 def score(pair):
  c,d=map(Point,pair)
  return min(a.distance(c)+b.distance(d),a.distance(d)+b.distance(c))
 edge=min(range(len(ring)-1),key=lambda i:score((ring[i],ring[i+1])))
 return {**profile,'frontEdge':edge}
