"""Generate a complete independent location dataset; publish manifest only on success."""
import argparse,sys,json,os,subprocess,hashlib,time,shutil
from pathlib import Path
from generation_scope import validate_radius
from arterial_plan import build as build_arterial
from neighborhood_sources import geocode,acquire_buildings,acquire_roads,write_glb,Terrain,acquire_places
WORK=Path(__file__).resolve().parent;PROJECT=WORK.parent;SHARED=PROJECT/'outputs/domestic-test';GEN=SHARED/'generation'
def write(path,value):
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2));os.replace(tmp,path)
def generate(query,job_dir,radius=150):
 radius=validate_radius(radius)
 job_dir=Path(job_dir);job_dir.mkdir(parents=True,exist_ok=True)
 def progress(message,percent):
  write(job_dir/'status.json',{'state':'running','message':message,'percent':percent});print(message,flush=True)
 progress('주소의 중심 좌표를 확인하고 있습니다…',3);loc=geocode(query);loc['sizeMetres']=radius*2;loc['detailRadius']=radius
 key=hashlib.sha256(('v137:'+str(radius)+':'+','.join(f'{n:.6f}' for n in loc['origin'])).encode()).hexdigest()[:16]
 final=PROJECT/'outputs/generated-neighborhoods'/key;root=final/'data';root.mkdir(parents=True,exist_ok=True)
 if (root/'manifest.json').exists():
  if json.loads((root/'manifest.json').read_text()).get('arterial',{}).get('version')!=80:build_arterial(root)
  return {'id':key,'address':loc['address'],'url':f'/domestic-test/?location={key}','cached':True}
 for folder in ['generation','people','vegetation','environment','shops']:(root/folder).mkdir(exist_ok=True)
 for folder in ['alley-v62','environment-v32','vegetation-v31']:(final/folder).mkdir(exist_ok=True)
 write(root/'location.json',loc)
 rules=json.loads((SHARED/'site-rules.json').read_text());rules['origin']=loc['origin'];rules['localBounds']=[-radius+14,-radius+14,radius-14,radius-14];write(root/'site-rules.json',rules)
 progress(loc['address']+' · 국내 건물을 조회하고 있습니다…',8)
 buildings=acquire_buildings(root,loc)
 progress(f'건물 {len(buildings["features"])}개 · 도로와 지형을 조회하고 있습니다…',16)
 roads=acquire_roads(root,loc);terrain=Terrain(*loc['origin']);baseQA=write_glb(root,terrain,roads,buildings,loc);write(root/'base-qa.json',baseQA)
 progress('새 주소 주변 상가를 확인하고 있습니다…',24)
 warnings=[]
 try:places=acquire_places(root,loc)
 except Exception:
  places=0;warnings.append('상가 조회 실패: 이 지역은 상가 연결 없이 생성했습니다.');write(root/'shops/places.json',{'places':[],'error':'lookup failed'})
 env={**os.environ,'NEIGHBORHOOD_DATA':str(root)}
 def py(name):
  result=subprocess.run([sys.executable,str(GEN/name)],env=env,cwd=PROJECT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=600)
  (final/(name+'.log')).write_text(result.stdout)
  if result.returncode:raise RuntimeError(name+' 생성 실패: '+result.stdout[-1500:])
 def node(mode):
  result=subprocess.run(['node','--experimental-loader',str(WORK/'canopy-v54/three-loader.mjs'),str(WORK/'location-v74/prepare-scene.mjs'),str(root),mode],cwd=PROJECT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=600)
  (final/(mode+'.log')).write_text(result.stdout)
  if result.returncode:raise RuntimeError(mode+' 배치 실패: '+result.stdout[-1500:])
 progress('건물 윤곽과 도로에 맞춰 마당을 나누고 있습니다…',30);py('build-parcels.py');node('profile')
 progress('주차공간·차양·담장·대문을 배치하고 있습니다…',40)
 for name in ['build-space-candidates.py','build-attached-structures.py','build-streetscape.py']:py(name)
 progress('연결된 도로의 포장과 골목 설비를 만들고 있습니다…',54)
 py('build-road-context.py');py('build-utilities.py')
 progress('상가와 생활 소품의 겹침을 확인하고 있습니다…',66);node('placement')
 progress('행인·나무·가로등을 배치하고 있습니다…',78)
 for name in ['build-pedestrians.py','build-vegetation.py','build-streetlights.py']:py(name)
 progress('새 위치에서 보이는 산과 원경을 만들고 있습니다…',90);py('build-environment.py')
 # Match the near terrain's datum, rather than moving a different location's backdrop.
 horizon=json.loads((root/'environment/terrain.json').read_text());delta=horizon['datumMetres']-terrain.datum
 for i in range(1,len(horizon['positions']),3):horizon['positions'][i]+=delta
 for b in horizon['city']:b[1]+=delta
 horizon['datumMetres']=terrain.datum;write(root/'environment/terrain.json',horizon)
 manifest={**loc,'id':key,'version':74,'buildings':len(buildings['features']),'places':places,'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'warnings':warnings,'sources':{'address':'Kakao Local','buildings':'MOIS / Esri Korea','roads':'OpenFreeMap / OpenMapTiles / OpenStreetMap','terrain':'Mapzen Terrain Tiles'},'inferred':'Road widths and surfaces, facade styles, plot boundaries, props and shop appearances are procedural, not surveyed.'}
 required=['corrected-base.glb','buildings.geojson','parcels.json','attached-structures.json','streetscape-context.json','utilities.json','people/placements.json','vegetation/placements.json','environment/terrain.json','environment/streetlights.json','road-context.json','shops/places.json']
 for name in required:
  if not (root/name).stat().st_size:raise RuntimeError(name+' 결과가 비어 있습니다.')
 write(root/'manifest.json',manifest)
 progress('큰길의 차로·보도·대중교통 시설을 배치하고 있습니다…',96);build_arterial(root)
 return {'id':key,'address':loc['address'],'url':f'/domestic-test/?location={key}','cached':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('query');p.add_argument('--radius',type=int,default=150);p.add_argument('--job-dir',required=True);args=p.parse_args()
 try:
  result=generate(args.query,args.job_dir,args.radius);write(Path(args.job_dir)/'status.json',{'state':'complete','message':'새 동네 생성 완료','percent':100,**result})
 except Exception as e:
  write(Path(args.job_dir)/'status.json',{'state':'error','message':str(e)});raise
