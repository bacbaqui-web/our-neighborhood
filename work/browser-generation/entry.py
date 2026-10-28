import sys,os,json,runpy,io,urllib.request,hashlib,datetime
from pathlib import Path
sys.path[:0]=['/work','/outputs/domestic-test/generation']
from js import browserRequest
# All requests occur inside a dedicated Worker. No credentials or local server.
def request(url,headers=None):
 return bytes(browserRequest(str(url)).to_py())
def urlopen(url,*args,**kwargs):
 return io.BytesIO(request(url.full_url if hasattr(url,'full_url') else url))
import neighborhood_sources as source
source.request=request
urllib.request.urlopen=urlopen
params=json.loads(PARAMETERS)
source.kakao=lambda path,params2: {'documents':params.get('stations' if path=='category' else 'exits',[]),'meta':{'is_end':True}}
radius=params['radius'];lat,lon=params['center']
if radius not in range(50,301,50) or not(33<lat<39.5 and 124<lon<132): raise ValueError('국내 위치와 50~300m 범위를 선택해 주세요.')
from kakao_terrain import profile_for,profile_identity,KakaoTerrain,VERSION,flat_correction,LocalFlatTerrain
try: profile=profile_for({'origin':[lat,lon],'sizeMetres':radius*2})
except ValueError: profile=None
correction=flat_correction({'origin':[lat,lon]})
profile_key=profile_identity(profile) if profile else 'mapzen-dem'
elevation_info={'mode':VERSION if profile else 'mapzen-dem','automaticallyFetched':not bool(profile),'profileHash':profile_key,'notice':'저장된 도로 높이를 반영했습니다.' if profile else '이 지역의 지면 높이는 공개 지형 자료로 추정합니다. 실제 도로 높이와 다를 수 있습니다.'}
if correction:
 profile_key=correction['id'];elevation_info={'mode':profile_key,'automaticallyFetched':False,'profileHash':profile_key,'notice':'도봉로 일대는 평지에 가깝게 보정했습니다. 실측 높이는 아닙니다.'}
key=hashlib.sha256(('connected-context-v153:'+VERSION+':'+profile_key+':'+str(radius)+':'+','.join(f'{n:.6f}' for n in [lat,lon])).encode()).hexdigest()[:16]
final=Path('/outputs/generated-neighborhoods')/key;root=final/'data';root.mkdir(parents=True,exist_ok=True)
for name in ['generation','people','vegetation','environment','shops']:(root/name).mkdir(exist_ok=True)
for name in ['alley-v62','environment-v32','vegetation-v31']:(final/name).mkdir(exist_ok=True)
os.environ['NEIGHBORHOOD_DATA']=str(root)
loc={'id':key,'address':params['address'],'query':params['address'],'origin':[lat,lon],'sizeMetres':radius*2,'detailRadius':radius,'contextPadding':80,'roadAddress':None}
def write(name,value): (root/name).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')))
write('location.json',loc)
if correction:write('terrain-correction.json',correction)
if profile: write('kakao-elevation.json',profile)
rules=json.loads(Path('/outputs/domestic-test/site-rules.json').read_text());rules.update(origin=loc['origin'],localBounds=[-radius+14,-radius+14,radius-14,radius-14]);write('site-rules.json',rules)
def stage_base():
 global buildings,terrain
 source_loc={**loc,'sizeMetres':(radius+80)*2}
 buildings=source.acquire_buildings(root,source_loc)
 roads=source.acquire_roads(root,source_loc);terrain=LocalFlatTerrain(lat,lon,correction) if correction else KakaoTerrain(lat,lon,profile) if profile else source.Terrain(lat,lon)
 write('base-qa.json',source.write_glb(root,terrain,roads,buildings,source_loc))
 write('shops/places.json',{'places':params.get('places',[]),'source':'Kakao Maps JavaScript services','center':[lon,lat]})
def stage_scripts(names):
 for name in names.split(','):runpy.run_path('/outputs/domestic-test/generation/'+name+'.py',run_name='__main__')
def stage_finish():
 horizon=json.loads((root/'environment/terrain.json').read_text());delta=horizon['datumMetres']-terrain.datum
 for i in range(1,len(horizon['positions']),3):horizon['positions'][i]+=delta
 for b in horizon['city']:b[1]+=delta
 horizon['datumMetres']=terrain.datum;write('environment/terrain.json',horizon)
 write('manifest.json',{**loc,'version':74,'buildings':len(buildings['features']),'places':len(params.get('places',[])),'generatedAt':datetime.datetime.now().isoformat(),'elevation':elevation_info,'browserGenerated':True,'browserGenerationVersion':8,'roadPriority':json.loads((root/'road-reservation.json').read_text())['qa'],'warnings':params.get('warnings',[]),'sources':{'address':'Kakao Maps','buildings':'MOIS / Esri Korea','roads':'OpenFreeMap / OpenStreetMap','terrain':elevation_info['mode']}})
 import arterial_plan
 arterial_plan.build(root)
