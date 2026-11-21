"""Local preview; keep the large, fixed terrain model outside cloud placeholders.
Restart this server after replacing corrected-base.glb to refresh its local mirror.
All authored files remain in outputs; this cache is only a serving copy.
"""
import argparse, hashlib, json, os, struct, re, subprocess, threading, uuid
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from generation_scope import validate_radius, validate_center
from asset_review import handle_review

ROOT=Path(__file__).resolve().parents[1]/'outputs'
CACHE=Path.home()/'Library/Caches/rokehan-neighborhood'
SOURCE=ROOT/'domestic-test/corrected-base.glb'
MODEL=CACHE/'corrected-base.glb'

JOBS=CACHE/'jobs'

def valid_glb(data):
 return len(data)>=20 and data[:4]==b'glTF' and struct.unpack_from('<II',data,4)==(2,len(data))

def prepare_model():
 CACHE.mkdir(parents=True,exist_ok=True)
 try:
  data=SOURCE.read_bytes()
  if not valid_glb(data):raise ValueError('terrain source is empty or incomplete')
  tmp=MODEL.with_suffix('.tmp');tmp.write_bytes(data);os.replace(tmp,MODEL)
 except (OSError,ValueError) as e:
  data=MODEL.read_bytes() if MODEL.exists() else b''
  if not valid_glb(data):raise RuntimeError('No complete terrain model is available') from e
  print('Using complete local recovery model:',e,flush=True)
 (CACHE/'model.json').write_text(json.dumps({'source':str(SOURCE),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},indent=2))

class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def translate_path(self,path):
  local=super().translate_path(path)
  return str(MODEL) if Path(local)==SOURCE and getattr(self.server,"use_terrain_cache",True) else local
 def end_headers(self):
  # The app versions assets itself. Revalidate after edits and after recovery.
  self.send_header('Cache-Control','no-cache')
  super().end_headers()

 def json_response(self,status,body):
  raw=json.dumps(body,ensure_ascii=False).encode();self.send_response(status)
  self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  path=urlparse(self.path).path
  if path=='/api/asset-reviews':return handle_review(self,'GET')
  if path=='/api/buildings':
   if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}' or self.headers.get('Sec-Fetch-Site') not in (None,'same-origin'):
    return self.json_response(403,{'message':'이 서버의 우리동네 화면에서 조회해 주세요.'})
   try:
    from vworld_buildings import fetch_buildings
    query=parse_qs(urlparse(self.path).query)
    bbox=[float(v) for v in query.get('bbox',[''])[0].split(',')]
    return self.json_response(200,fetch_buildings(bbox,int(query.get("minFloors",["1"])[0])))
   except (ValueError,TypeError):return self.json_response(400,{'message':'건물 조회 범위가 올바르지 않습니다.'})
   except RuntimeError as error:return self.json_response(502,{'message':str(error)})
  if path=='/api/map-config':
   settings_path=ROOT.parent/'.local-settings.json'
   settings=json.loads(settings_path.read_text()) if settings_path.exists() else {}
   env_path=Path(os.environ.get('KAKAO_ENV_FILE') or settings.get('kakao_env_file') or ROOT.parent/'.env')
   env=dict(line.split('=',1) for line in env_path.read_text().splitlines() if '=' in line and not line.lstrip().startswith('#')) if env_path.exists() else {}
   key=os.environ.get('KAKAO_JAVASCRIPT_KEY') or settings.get('kakao_javascript_key') or env.get('KAKAO_JAVASCRIPT_KEY','').strip().strip('\"\'')
   return self.json_response(200,{'javascriptKey':key})
  if path=='/api/neighborhoods':
   rows=[]
   for p in (ROOT/'generated-neighborhoods').glob('*/data/manifest.json'):
    try:
     m=json.loads(p.read_text());rows.append({k:m[k] for k in ['id','address','origin','generatedAt','sizeMetres']})
    except (OSError,ValueError,KeyError):continue
   return self.json_response(200,sorted(rows,key=lambda x:x['generatedAt'],reverse=True))
  if path.startswith('/api/neighborhood/jobs/'):
   job=path.rsplit('/',1)[-1]
   if not re.fullmatch('[a-f0-9]{32}',job):return self.json_response(404,{'message':'생성 작업을 찾지 못했습니다.'})
   p=JOBS/job/'status.json'
   if not p.exists():return self.json_response(404,{'message':'생성 작업을 찾지 못했습니다.'})
   result=json.loads(p.read_text())
   if result['state']=='running':result={'state':'error','message':'이전 서버 생성기는 종료했습니다. 시작 화면에서 다시 만들어 주세요.'}
   return self.json_response(200,result)
  return super().do_GET()
 def do_POST(self):
  if urlparse(self.path).path=='/api/asset-reviews':return handle_review(self,'POST')
  if urlparse(self.path).path in {'/api/performance/report','/api/performance/vertices','/api/performance/preview'}:
   if self.headers.get('Host')!=f'127.0.0.1:{self.server.server_port}' or self.headers.get('Origin')!=f'http://127.0.0.1:{self.server.server_port}':return self.json_response(403,{'message':'로컬 측정만 지원합니다.'})
   n=int(self.headers.get('Content-Length',0))
   if not 0<n<250000000:return self.json_response(400,{'message':'측정 파일 크기가 올바르지 않습니다.'})
   folder=ROOT.parent/'native-benchmark/data';folder.mkdir(parents=True,exist_ok=True)
   name='report.json' if self.path.endswith('/report') else ('web-preview.png' if self.path.endswith('/preview') else 'vertices.bin')
   (folder/name).write_bytes(self.rfile.read(n));return self.json_response(200,{'saved':name})
  if urlparse(self.path).path=='/api/neighborhoods':return self.json_response(410,{'message':'이전 생성 방식은 종료했습니다. 우리동네 시작 화면에서 지도 위치를 선택해 주세요.','url':'/domestic-test/start.html'})
  return self.json_response(404,{'message':'지원하지 않는 요청입니다.'})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);parser.add_argument('--direct-files',action='store_true');args=parser.parse_args()
 if not args.direct_files:prepare_model()
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
 server.use_terrain_cache=not args.direct_files
 print(f'Serving {ROOT} at http://127.0.0.1:{args.port}; terrain mirror: {MODEL}',flush=True)
 server.serve_forever()
