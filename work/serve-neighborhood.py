"""Local preview; keep the large, fixed terrain model outside cloud placeholders.
Restart this server after replacing corrected-base.glb to refresh its local mirror.
All authored files remain in outputs; this cache is only a serving copy.
"""
import argparse, hashlib, json, os, struct, re, subprocess, threading, uuid
from urllib.parse import urlparse
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT=Path(__file__).resolve().parents[1]/'outputs'
CACHE=Path.home()/'Library/Caches/rokehan-neighborhood'
SOURCE=ROOT/'domestic-test/corrected-base.glb'
MODEL=CACHE/'corrected-base.glb'

JOBS=CACHE/'jobs'
PYTHON=Path(os.environ.get('NEIGHBORHOOD_PYTHON') or (Path(__file__).resolve().parents[1]/'.venv/bin/python' if (Path(__file__).resolve().parents[1]/'.venv/bin/python').exists() else CACHE/'geo-env-v74/bin/python'))
JOB_LOCK=threading.Lock()
ACTIVE={}
def start_job(address):
 with JOB_LOCK:
  for job,item in list(ACTIVE.items()):
   if item['process'].poll() is None:
    if item['address']==address:return job
    raise ValueError('다른 지역을 생성 중입니다. 완료 후 새 주소를 입력해 주세요.')
   del ACTIVE[job]
  if not PYTHON.exists():raise ValueError('지역 생성용 Python 환경이 없습니다.')
  job=uuid.uuid4().hex;directory=JOBS/job;directory.mkdir(parents=True)
  (directory/'status.json').write_text(json.dumps({'state':'running','message':'새 동네 생성을 준비하고 있습니다…','percent':1}))
  log=(directory/'worker.log').open('w')
  process=subprocess.Popen([str(PYTHON),str(Path(__file__).with_name('generate-neighborhood.py')),address,'--job-dir',str(directory)],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
  log.close();ACTIVE[job]={'address':address,'process':process};return job

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
  return str(MODEL) if Path(local)==SOURCE else local
 def end_headers(self):
  # The app versions assets itself. Revalidate after edits and after recovery.
  self.send_header('Cache-Control','no-cache')
  super().end_headers()

 def json_response(self,status,body):
  raw=json.dumps(body,ensure_ascii=False).encode();self.send_response(status)
  self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  path=urlparse(self.path).path
  if path=='/api/neighborhoods':
   rows=[]
   for p in (ROOT/'generated-neighborhoods').glob('*/data/manifest.json'):
    try:
     m=json.loads(p.read_text());rows.append({k:m[k] for k in ['id','address','origin','generatedAt']})
    except (OSError,ValueError,KeyError):continue
   return self.json_response(200,sorted(rows,key=lambda x:x['generatedAt'],reverse=True))
  if path.startswith('/api/neighborhood/jobs/'):
   job=path.rsplit('/',1)[-1]
   if not re.fullmatch('[a-f0-9]{32}',job):return self.json_response(404,{'message':'생성 작업을 찾지 못했습니다.'})
   p=JOBS/job/'status.json'
   if not p.exists():return self.json_response(404,{'message':'생성 작업을 찾지 못했습니다.'})
   result=json.loads(p.read_text());item=ACTIVE.get(job)
   if result['state']=='running' and (not item or item['process'].poll() is not None):
    result={'state':'error','message':'생성 프로세스가 종료되었습니다. 주소를 다시 입력해 주세요.'}
   return self.json_response(200,result)
  return super().do_GET()
 def do_POST(self):
  if urlparse(self.path).path!='/api/neighborhoods':return self.json_response(404,{'message':'지원하지 않는 요청입니다.'})
  # Restrict mutation to this local application; the API is never exposed remotely.
  if self.headers.get('Host') not in {f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'}:return self.json_response(403,{'message':'로컬 주소에서만 사용할 수 있습니다.'})
  origin=self.headers.get('Origin')
  if origin and origin!=f'http://{self.headers.get("Host")}':return self.json_response(403,{'message':'다른 사이트에서 생성 요청을 보낼 수 없습니다.'})
  if self.headers.get('Sec-Fetch-Site')=='cross-site' or self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.json_response(403,{'message':'앱의 주소 입력창을 사용해 주세요.'})
  try:
   n=int(self.headers.get('Content-Length',0))
   if not 0<n<2048:raise ValueError('주소 입력이 올바르지 않습니다.')
   data=json.loads(self.rfile.read(n))
   if not isinstance(data,dict):raise ValueError('주소 입력이 올바르지 않습니다.')
   address=data.get('address')
   if not isinstance(address,str) or not 3<=len(address.strip())<=160:raise ValueError('시·구, 도로명과 건물 번호를 입력해 주세요.')
   job=start_job(address.strip());return self.json_response(202,{'job':job})
  except (ValueError,TypeError,KeyError) as e:return self.json_response(400,{'message':str(e)})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);args=parser.parse_args()
 prepare_model()
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
 print(f'Serving {ROOT} at http://127.0.0.1:{args.port}; terrain mirror: {MODEL}',flush=True)
 server.serve_forever()
