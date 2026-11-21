import sys,os,json,runpy,io,urllib.request,hashlib,datetime
from pathlib import Path
sys.path[:0]=['/work','/outputs/domestic-test/generation']
from js import browserRequest
# Requests occur inside a dedicated Worker; building credentials stay on the server.
def request(url,headers=None):
 return bytes(browserRequest(str(url)).to_py())
def urlopen(url,*args,**kwargs):
 return io.BytesIO(request(url.full_url if hasattr(url,'full_url') else url))
import neighborhood_sources as source
source.request=request
urllib.request.urlopen=urlopen
params=json.loads(PARAMETERS)
source.fetch_building_collection=lambda bbox: params['buildingCollection']
source.kakao=lambda path,params2: {'documents':params.get('stations' if path=='category' else 'exits',[]),'meta':{'is_end':True}}
from view_generation import validate_view,select_view,select_roads,snap_to_road
view=validate_view(params.get('view') or {})
radius=params['radius'];lat,lon=params['center']
if radius not in (range(50,501,50) if params.get('structureLab') else range(50,301,50)) or not(33<lat<39.5 and 124<lon<132): raise ValueError('국내 위치와 50~300m 범위를 선택해 주세요.')
from gentle_terrain import GentleTerrain,select_buildings,VERSION,elevation_info as terrain_info
elevation_info=terrain_info()
key=hashlib.sha256(('vworld-street-end-v1:'+json.dumps(view,sort_keys=True)+':'+VERSION+':'+str(radius)+':'+','.join(f'{n:.6f}' for n in [lat,lon])).encode()).hexdigest()[:16]
final=Path('/outputs/generated-neighborhoods')/key;root=final/'data';root.mkdir(parents=True,exist_ok=True)
for name in ['generation','people','vegetation','environment','shops']:(root/name).mkdir(exist_ok=True)
for name in ['alley-v62','environment-v32','vegetation-v31']:(final/name).mkdir(exist_ok=True)
os.environ['NEIGHBORHOOD_DATA']=str(root)
loc={'id':key,'address':params['address'],'query':params['address'],'origin':[lat,lon],'sizeMetres':radius*2,'detailRadius':radius,'contextPadding':30,'terrainMode':VERSION,'contextBuildings':False,'roadAddress':None}
if view:loc['view']=view
def write(name,value): (root/name).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')))
write('location.json',loc)
rules=json.loads(Path('/outputs/domestic-test/site-rules.json').read_text());rules.update(origin=loc['origin'],localBounds=[-radius+14,-radius+14,radius-14,radius-14]);write('site-rules.json',rules)
def stage_base():
 global buildings,terrain
 source_loc={**loc,'sizeMetres':(radius+30)*2}
 all_buildings=source.acquire_buildings(root,source_loc if view else loc)
 buildings=select_buildings(all_buildings,source_loc if view else loc)
 all_roads=source.acquire_roads(root,{**source_loc,'sizeMetres':max(200,radius+150)*2})
 from shapely.geometry import box,shape,mapping
 road_limit=box(-radius-35,-radius-35,radius+35,radius+35)
 roads=[]
 for road_index,road in enumerate(all_roads):
  road['_contextIndex']=road_index
  g=shape(road['geometry']).intersection(road_limit)
  for part in ([g] if g.geom_type=='LineString' else getattr(g,'geoms',[])):
   if part.geom_type=='LineString' and part.length>.1:roads.append({**road,'geometry':mapping(part)})
 terrain=GentleTerrain(lat,lon)
 view_qa=None
 if view:
  from road_priority import reserve
  reservation=reserve(root,source_loc,roads,buildings)
  snap_to_road(reservation,view,roads=roads)
  buildings,view_qa=select_view(buildings,loc['origin'],radius,view,terrain)
  loc['viewQA']=view_qa;write('location.json',loc);write('view-selection.json',view_qa)
  roads=select_roads(roads,radius,view,view_qa)
 write('buildings.geojson',buildings)
 write('base-qa.json',source.write_glb(root,terrain,roads,buildings,source_loc))
 final_road=json.loads((root/'road-reservation.json').read_text())
 from street_end_context import build_context
 for road in roads:
  all_roads[road['_contextIndex']]['width']=road['width']
 context=build_context(all_buildings,all_roads,loc['origin'],radius,view or {},buildings,terrain,shape(final_road['road']).union(shape(final_road['majorPublic'])))
 write('environment/street-end-context.json',context)
 loc['streetEndContext']={**context['qa'],'version':1,'radius':context['radius']};write('location.json',loc)
 if view:
  from shapely.geometry import Point,shape
  final_road=json.loads((root/'road-reservation.json').read_text())
  p=Point(*view['position'])
  if not any(shape(final_road['surfaces'][k]).buffer(.02).covers(p) for k in ('shared','sidewalk','pedestrian')):
   raise ValueError('생성한 길 위에 사람을 놓을 수 없습니다. 지도에서 다른 길을 선택해 주세요.')
 write('shops/places.json',{'places':params.get('places',[]),'source':'Kakao Maps JavaScript services','center':[lon,lat]})
def stage_scripts(names):
 for name in names.split(','):runpy.run_path('/outputs/domestic-test/generation/'+name+'.py',run_name='__main__')
def stage_finish():
 write('manifest.json',{**loc,'version':74,'buildings':len(buildings['features']),'places':len(params.get('places',[])),'generatedAt':datetime.datetime.now().isoformat(),'elevation':elevation_info,'browserGenerated':True,'browserGenerationVersion':11,'ruleset':'street-visible360-v1','roadPriority':json.loads((root/'road-reservation.json').read_text())['qa'],'warnings':params.get('warnings',[]),'sources':{'address':'Kakao Maps','buildings':buildings['source'],'roads':'OpenFreeMap / OpenStreetMap','terrain':elevation_info['mode']}})
 import arterial_plan
 arterial_plan.build(root)


def stage_site_layout():
 import site_layout
 site_layout.build(root,[lat,lon],radius)

# Outside-city building requests are intentionally omitted; real mountains remain.
def context_request_urls():
 return '[]'
