"""Bounded, server-only map acquisition. Credentials never enter public assets."""
import json, math, os, struct, io, datetime
from pathlib import Path
import urllib.request, urllib.parse
import numpy as np
import shapely as S
from shapely.geometry import Polygon,LineString,box,shape,mapping
from shapely.ops import unary_union,transform
from PIL import Image
import mapbox_vector_tile
CACHE=Path.home()/'Library/Caches/rokehan-neighborhood'
UA='NeighborhoodWebtoonLocal/0.74'
LOCAL_SETTINGS=Path(__file__).resolve().parents[1]/'.local-settings.json'
settings=json.loads(LOCAL_SETTINGS.read_text()) if LOCAL_SETTINGS.exists() else {}
ENV_FILE=Path(os.environ.get('KAKAO_ENV_FILE') or settings.get('kakao_env_file') or Path(__file__).resolve().parents[1]/'.env')
def request(url,headers=None):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA,**(headers or {})}),timeout=55) as r:return r.read()
def getjson(url,params=None,headers=None):
 return json.loads(request(url+('?' + urllib.parse.urlencode(params) if params else ''),headers))
def kakao(path,params):
 key=os.environ.get('KAKAO_REST_API_KEY')
 if not key:
  if not ENV_FILE.exists():raise ValueError('서버에 KAKAO_REST_API_KEY 또는 KAKAO_ENV_FILE을 설정해 주세요.')
  env=dict(l.split('=',1) for l in ENV_FILE.read_text().splitlines() if '=' in l and not l.lstrip().startswith('#'))
  key=env['KAKAO_REST_API_KEY'].strip().strip('\"\'')
 return getjson('https://dapi.kakao.com/v2/local/search/'+path+'.json',params,{'Authorization':'KakaoAK '+key})
def geocode(query):
 docs=kakao('address',{'query':query,'size':10})['documents']
 if not docs:raise ValueError('주소를 찾지 못했습니다. 시·구와 도로명, 건물 번호를 확인해 주세요.')
 if len(docs)>1:raise ValueError('주소가 여러 곳입니다. 시·구와 건물 번호까지 입력해 주세요.')
 d=docs[0];lat,lon=float(d['y']),float(d['x'])
 if not (33<lat<39.5 and 124<lon<132):raise ValueError('현재는 국내 주소만 지원합니다.')
 return {'address':d['address_name'],'query':query,'origin':[lat,lon],'roadAddress':d.get('road_address'),'sizeMetres':300}
def scales(lat):
 a=math.radians(lat);return 111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a),111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
def acquire_buildings(root,location):
 lat,lon=location['origin'];sx,sy=scales(lat);r=location.get('sizeMetres',300)/2
 bbox=[lon-r/sx,lat-r/sy,lon+r/sx,lat+r/sy];features=[];offset=0
 while True:
  d=getjson('https://portal.esrikr.com/arcgis/rest/services/MOIS_KR_Buildings_v2/FeatureServer/0/query',{'f':'geojson','where':'1=1','geometry':','.join(map(str,bbox)),'geometryType':'esriGeometryEnvelope','inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','outSR':4326,'returnGeometry':'true','resultOffset':offset,'resultRecordCount':1000,'orderByFields':'objectid'})
  if 'error' in d:raise RuntimeError('국내 건물 서비스 조회에 실패했습니다.')
  batch=d.get('features',[]);features.extend(batch)
  if not d.get('exceededTransferLimit') and len(batch)<1000:break
  if not batch or len(features)>5000:raise RuntimeError('건물 조회 범위가 너무 큽니다.')
  offset=len(features)
 if not features:raise ValueError('이 주소 주변에는 조회 가능한 국내 건물 데이터가 없습니다.')
 clean=[]
 for f in features:
  if not f.get('geometry'):continue
  g=shape(f['geometry']);g=S.make_valid(g)
  parts=[g] if g.geom_type=='Polygon' else [x for x in getattr(g,'geoms',[]) if x.geom_type=='Polygon']
  if not parts:continue
  f['geometry']=mapping(parts[0] if len(parts)==1 else S.MultiPolygon(parts))
  p=f['properties'];p['gro_flo_co']=max(1,int(p.get('gro_flo_co') or 1));p['und_flo_co']=max(0,int(p.get('und_flo_co') or 0));p['street_name']=p.get('street_name') or '';p['house_number']=str(p.get('house_number') or '')
  clean.append(f)
 d={'type':'FeatureCollection','features':clean,'source':'MOIS / Esri Korea','origin':location['origin']}
 (root/'buildings.geojson').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
 return d
class Terrain:
 def __init__(self,lat,lon):
  self.lat,self.lon=lat,lon;self.sx,self.sy=scales(lat);self.tiles={};self.zoom=14;self.n=2**14;self.datum=self.absolute(0,0)
 def absolute(self,x,z):
  lat=self.lat-z/self.sy;lon=self.lon+x/self.sx;n=self.n
  px=(lon+180)/360*n*256;py=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n*256;ix,iy=int(px),int(py);fx,fy=px-ix,py-iy
  def sample(a,b):
   key=a//256,b//256
   if key not in self.tiles:
    directory=CACHE/'terrain-tiles';directory.mkdir(parents=True,exist_ok=True);path=directory/f'14-{key[0]}-{key[1]}.png'
    if not path.exists():path.write_bytes(request(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/14/{key[0]}/{key[1]}.png'))
    rgb=np.asarray(Image.open(path).convert('RGB'),dtype=np.float32);heights=rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768
    invalid=heights < -100
    if invalid.any():
     from scipy.ndimage import distance_transform_edt
     if invalid.all():raise ValueError('이 위치의 표고 자료가 비어 있습니다.')
     heights=heights[tuple(distance_transform_edt(invalid,return_distances=False,return_indices=True))]
    self.tiles[key]=heights
   return float(self.tiles[key][b%256,a%256])
  return (sample(ix,iy)*(1-fx)+sample(ix+1,iy)*fx)*(1-fy)+(sample(ix,iy+1)*(1-fx)+sample(ix+1,iy+1)*fx)*fy
 def height(self,x,z):return self.absolute(x,z)-self.datum
 def mesh_height(self,x,z):
  # Both ground and road reuse the same 5 m piecewise planar surface.
  ax=math.floor(x/5)*5;az=math.floor(z/5)*5;u=(x-ax)/5;v=(z-az)/5
  a,b,c,d=[self.height(xx,zz) for xx,zz in [(ax,az),(ax+5,az),(ax,az+5),(ax+5,az+5)]]
  return a*(1-u-v)+b*u+c*v if u+v<=1 else d*(u+v-1)+b*(1-v)+c*(1-u)
def acquire_roads(root,location):
 lat,lon=location['origin'];sx,sy=scales(lat);r=location.get('sizeMetres',300)/2;z=14;n=2**z
 def tile(lon,lat):return (lon+180)/360*n,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
 corners=[tile(lon+x/sx,lat-d/sy) for x in [-r-35,r+35] for d in [-r-35,r+35]]
 source=getjson('https://tiles.openfreemap.org/planet');template=source['tiles'][0];lines=[];limit=box(-r-5,-r-5,r+5,r+5)
 directory=CACHE/'map-tiles'/template.split('/')[-4];directory.mkdir(parents=True,exist_ok=True)
 for tx in range(int(min(p[0] for p in corners)),int(max(p[0] for p in corners))+1):
  for ty in range(int(min(p[1] for p in corners)),int(max(p[1] for p in corners))+1):
   path=directory/f'{z}-{tx}-{ty}.pbf'
   if not path.exists():path.write_bytes(request(template.format(z=z,x=tx,y=ty)))
   layers=mapbox_vector_tile.decode(path.read_bytes(),default_options={'y_coord_down':True});layer=layers.get('transportation',{});extent=layer.get('extent',4096)
   def local(x,y):
    gx=(tx+x/extent)/n;gy=(ty+y/extent)/n
    return ((gx*360-180-lon)*sx,-(math.degrees(math.atan(math.sinh(math.pi*(1-2*gy))))-lat)*sy)
   for f in layer.get('features',[]):
    props=f['properties'];kind=props.get('class','');sub=props.get('subclass','')
    if kind in ['rail','transit','aerialway','ferry'] or props.get('brunnel')=='tunnel' or props.get('layer',0)<0:continue
    g=transform(local,shape(f['geometry'])).intersection(limit)
    if g.is_empty or g.geom_type not in ['LineString','MultiLineString']:continue
    # Generalized tile centerlines do not supply measured widths. Keep their
    # connectivity and fit inferred widths to domestic building footprints.
    width={'motorway':22,'trunk':20,'primary':18,'secondary':11,'tertiary':8,'minor':5.2,'service':3.5,'path':2.2,'track':2.5}.get(kind,4)
    if sub in ['footway','pedestrian','steps','cycleway']:width=2.2
    if props.get('oneway')==1 and kind in ['primary','secondary','trunk']:width*=.6
    for q in ([g] if g.geom_type=='LineString' else g.geoms):
     if q.length>.1:lines.append({'geometry':mapping(q),'width':width,'properties':props})
 if not lines:raise ValueError('새 지역의 도로 데이터를 받지 못했습니다.')
 (root/'roads-source.json').write_text(json.dumps({'source':template,'roads':lines},ensure_ascii=False))
 return lines

def write_glb(root,terrain,roads,buildings,location):
 from road_priority import reserve
 reserved=reserve(root,location,roads,buildings)
 lat,lon=location['origin'];sx,sy=scales(lat);radius=int(location.get('sizeMetres',300)/2)
 built=unary_union([transform(lambda x,y:((x-lon)*sx,-(y-lat)*sy),shape(f['geometry'])) for f in buildings['features']])
 road=shape(reserved['road']).union(shape(reserved['majorPublic'])).intersection(box(-radius,-radius,radius,radius))
 if road.area<1:raise ValueError('표시할 도로 영역이 없습니다.')
 # Indexed glTF, world coordinates; no node transforms. Existing site rules read it directly.
 doc={'asset':{'version':'2.0','generator':'Neighborhood location pipeline v74'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'bufferViews':[],'accessors':[],'buffers':[{'byteLength':0}]};binary=bytearray()
 def acc(values,cols,typ):
  arr=np.asarray(values,dtype='<f4' if typ==5126 else '<u4');binary.extend(b'\0'*((-len(binary))%4));offset=len(binary);raw=arr.tobytes();binary.extend(raw);v=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)})
  a={'bufferView':v,'componentType':typ,'count':len(arr),'type':{1:'SCALAR',3:'VEC3'}[cols]}
  if cols==3:a.update(min=arr.min(0).tolist(),max=arr.max(0).tolist())
  doc['accessors'].append(a);return len(doc['accessors'])-1
 def mesh(name,tris,color,offset=0):
  pos=[];norm=[]
  for t in tris:
   vs=np.array([[x,terrain.mesh_height(x,z)+offset,z] for x,z in t]);nn=np.cross(vs[1]-vs[0],vs[2]-vs[0])
   if nn[1]<0:vs=vs[[0,2,1]];nn=-nn
   nn/=np.linalg.norm(nn);pos.extend(vs);norm.extend([nn]*3)
  if not pos:return
  i=len(doc['meshes']);mat=len(doc['materials']);doc['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[*color,1],'metallicFactor':0,'roughnessFactor':.95}})
  doc['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':acc(pos,3,5126),'NORMAL':acc(norm,3,5126)},'indices':acc(list(range(len(pos))),1,5125),'material':mat}]});doc['nodes'].append({'mesh':i,'name':name});doc['scenes'][0]['nodes'].append(i)
 ground=[];roadtris=[];S.prepare(road)
 for x in range(-radius-20,radius+20,5):
  for z in range(-radius-20,radius+20,5):
   for pts in [[(x,z),(x+5,z),(x,z+5)],[(x+5,z),(x+5,z+5),(x,z+5)]]:
    ground.append(pts);cell=Polygon(pts)
    if not road.intersects(cell):continue
    clipped=cell.intersection(road)
    for poly in S.get_parts(clipped):
     if poly.geom_type!='Polygon' or poly.area<1e-7:continue
     roadtris.extend([list(t.exterior.coords)[:3] for t in S.get_parts(S.constrained_delaunay_triangles(poly)) if t.area>1e-7])
 mesh('ground',ground,[.54,.55,.50]);mesh('road',roadtris,[.20,.225,.26],.018)
 doc['buffers'][0]['byteLength']=len(binary);j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary+=b'\0'*((-len(binary))%4)
 raw=struct.pack('<4sII',b'glTF',2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
 (root/'corrected-base.glb').write_bytes(raw)
 return {'roadAreaM2':round(road.area,2),'buildingOverlapM2':round(road.intersection(built).area,8),'roadSegments':len(roads),'terrainDatum':terrain.datum,'source':'OpenFreeMap / OpenMapTiles / OpenStreetMap; inferred widths; Mapzen Terrain Tiles'}

def acquire_places(root,location):
 lat,lon=location['origin'];found={};radius=math.ceil(location.get('sizeMetres',300)/2*math.sqrt(2))
 queries=[('category',{'category_group_code':c}) for c in ['CS2','FD6','CE7','MT1','PM9','SC4','PO3']]+[('keyword',{'query':q}) for q in ['미용실','세탁소','부동산','소방서','다이소']]
 for kind,extra in queries:
  for page in range(1,4):
   d=kakao(kind,{**extra,'x':lon,'y':lat,'radius':radius,'sort':'distance','size':15,'page':page})
   for p in d['documents']:found[p['id']]={k:p.get(k,'') for k in ['id','place_name','category_name','category_group_code','category_group_name','address_name','road_address_name','x','y','place_url']}
   if d['meta']['is_end']:break
 out={'version':74,'source':'Kakao Local REST API','center':[lon,lat],'radius':radius,'observedAt':datetime.date.today().isoformat(),'places':list(found.values())}
 (root/'shops/places.json').write_text(json.dumps(out,ensure_ascii=False));return len(found)
