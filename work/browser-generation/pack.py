"""Package only public generation sources and fixed asset metadata; no local settings."""
import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
files={}
for p in (ROOT/'outputs/domestic-test/generation').glob('*.py'):
 text=p.read_text().replace('with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:terrain=dict(pool.map(load,tiles))','terrain=dict(map(load,tiles))')
 files['/'+str(p.relative_to(ROOT))]=text
for name in ['neighborhood_sources.py','arterial_plan.py','kakao_terrain.py','road_priority.py']:
 text=(ROOT/'work'/name).read_text()
 if name=='neighborhood_sources.py':
  start=text.index('LOCAL_SETTINGS=');end=text.index('def request(')
  text=text[:start]+text[end:]
  start=text.index('def kakao(');end=text.index('def scales(')
  text=text[:start]+'''def kakao(path,params):
 return {'documents': [], 'meta': {'is_end': True}}
'''+text[end:]
 text=text.replace("loc['roadAddress'].get(","(loc.get('roadAddress') or {}).get(")
 files['/work/'+name]=text
for name in ['domestic-test/route-elevation.json','domestic-test/site-rules.json','domestic-test/people/catalog.json','domestic-test/vegetation/catalog.json','domestic-test/shops/library/catalog.json','alley-library/alley-catalog-210.json','alley-library/alley-catalog-212.json']:
 files['/outputs/'+name]=(ROOT/'outputs'/name).read_text()
p=ROOT/'work/arterial-v76/seoul-stops-20260902.json'
if p.exists(): files['/work/arterial-v76/seoul-stops-20260902.json']=p.read_text()
files['/work/browser-entry.py']=(ROOT/'work/browser-generation/entry.py').read_text()
out=ROOT/'outputs/domestic-test/browser-generation'
payloads={'sources.json':json.dumps(files,ensure_ascii=False,separators=(',',':')),'terrain-source.txt':(ROOT/'work/windows-v39/terrain-functions.js.txt').read_text()}
if '--check' in sys.argv:
 stale=[name for name,text in payloads.items() if not (out/name).exists() or (out/name).read_text()!=text]
 if stale:raise SystemExit('생성 코드 묶음을 갱신하세요: python3 work/browser-generation/pack.py ('+', '.join(stale)+')')
 print('Public source bundle is current:',len(files),'files')
else:
 for name,text in payloads.items():(out/name).write_text(text)
 print('Public source bundle:',len(files),'files')
