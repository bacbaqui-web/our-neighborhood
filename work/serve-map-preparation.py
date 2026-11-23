"""Local-only preview of the isolated map-preparation branch."""
import argparse,json
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
ROOT=Path(__file__).resolve().parents[1]/'outputs'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
 def do_GET(self):
  if urlparse(self.path).path=='/api/neighborhoods':
   self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'[]');return
  if urlparse(self.path).path!='/api/buildings':return super().do_GET()
  if self.headers.get('Host')!=f'127.0.0.1:{self.server.server_port}' or self.headers.get('Sec-Fetch-Site') not in (None,'same-origin'):
   self.send_error(403,'Local preview only');return
  try:
   from vworld_buildings import fetch_buildings
   query=parse_qs(urlparse(self.path).query)
   data=fetch_buildings([float(v) for v in query['bbox'][0].split(',')],int(query.get('minFloors',['1'])[0]));status=200
  except (ValueError,KeyError):data={'message':'건물 조회 범위를 확인해 주세요.'};status=400
  except Exception as error:data={'message':str(error)};status=502
  raw=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.end_headers();self.wfile.write(raw)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8799);args=parser.parse_args()
 print(f'Local map preparation: http://127.0.0.1:{args.port}/domestic-test/start.html',flush=True)
 ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
