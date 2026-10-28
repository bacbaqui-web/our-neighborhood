"""Real DEM horizon, in the neighborhood's east/X, south/Z metre frame."""
import json, math, urllib.request, concurrent.futures
from pathlib import Path
import numpy as np
from PIL import Image

from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC; OUT=ROOT/'environment'; OUT.mkdir(exist_ok=True)

ZOOM=11; N=2**ZOOM; p=math.radians(LAT)
MX=111412.84*math.cos(p)-93.5*math.cos(3*p)+.118*math.cos(5*p)
MZ=111132.92-559.82*math.cos(2*p)+1.175*math.cos(4*p)-.0023*math.cos(6*p)
def pixel(x,z):
 lat=LAT-z/MZ;lon=LON+x/MX
 return (lon+180)/360*N*256,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*N*256
rad=22000;corners=[pixel(x,z) for x in [-rad,rad] for z in [-rad,rad]]
tiles=[(x,y) for x in range(int(min(a for a,b in corners)//256),int(max(a for a,b in corners)//256)+1) for y in range(int(min(b for a,b in corners)//256),int(max(b for a,b in corners)//256)+1)]
def load(key):
 x,y=key;path=CACHE/f'{ZOOM}-{x}-{y}.png';url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png'
 if not path.exists():
  with urllib.request.urlopen(url,timeout=50) as r:path.write_bytes(r.read())
 rgb=np.array(Image.open(path).convert('RGB'),dtype=np.float32)
 heights=rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768
 # Empty DEM pixels can decode to -32768 m. Fill them from valid neighbours.
 invalid=heights < -100
 if invalid.any():
  from scipy.ndimage import distance_transform_edt
  if invalid.all():raise ValueError('주변 산의 표고 자료가 비어 있습니다.')
  indices=distance_transform_edt(invalid,return_distances=False,return_indices=True)
  heights=heights[tuple(indices)]
 return key,heights
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:terrain=dict(pool.map(load,tiles))
def elevation(x,z):
 px,py=pixel(x,z);ix,iy=int(px),int(py);fx,fy=px-ix,py-iy
 def at(a,b):return float(terrain[(a//256,b//256)][b%256,a%256])
 return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy
# Use the same near-ground source and datum as the detailed map.
import sys
sys.path.insert(0,str(SHARED.parents[1]/'work'))
from neighborhood_sources import acquire_buildings
from kakao_terrain import load_terrain
near=load_terrain(ROOT,{'origin':ORIGIN})
coarse_elevation=elevation
def elevation(x,z):
 d=math.hypot(x,z)
 if d>=2200:return coarse_elevation(x,z)
 fine=near.absolute(x,z)
 u=max(0,min(1,(d-1400)/800));u=u*u*(3-2*u)
 return fine*(1-u)+coarse_elevation(x,z)*u
datum=near.datum;radii=list(range(0,401,10))+list(np.geomspace(425,rad,92));angles=512;positions=[];heights=[]
for r in radii:
 for j in range(angles):
  a=j/angles*math.tau;x=math.sin(a)*r;z=-math.cos(a)*r;h=elevation(x,z)
  positions.extend([round(x,2),round(h-datum,2),round(z,2)]);heights.append(h)
# Real building records within 2 km; no invented towers or buildings on mountains.
from shapely.geometry import shape,Polygon
context=OUT/'context';context.mkdir(exist_ok=True)
cache=context/'buildings-2000.geojson'
if cache.exists():raw=json.loads(cache.read_text())
else:
 records={}
 for dx in range(-1750,2000,500):
  for dz in range(-1750,2000,500):
   part=context/f'{dx}_{dz}';part.mkdir(exist_ok=True)
   saved=part/'buildings.geojson'
   try:batch=json.loads(saved.read_text()) if saved.exists() else acquire_buildings(part,{'origin':[LAT-dz/MZ,LON+dx/MX],'sizeMetres':500})
   except ValueError as error:
    if '조회 가능한 국내 건물' not in str(error):raise
    batch={'type':'FeatureCollection','features':[]};saved.write_text(json.dumps(batch))
   for f in batch['features']:records[f['properties']['objectid']]=f
 raw={'type':'FeatureCollection','features':list(records.values()),'origin':ORIGIN}
 cache.write_text(json.dumps(raw,separators=(',',':')))
city=[];cityFootprints=[]
for f in raw['features']:
 g=shape(f['geometry'])
 for poly in ([g] if g.geom_type=='Polygon' else g.geoms):
  points=[((lon-LON)*MX,(LAT-lat)*MZ) for lon,lat,*_ in poly.exterior.coords[:-1]]
  local=Polygon(points)
  if local.is_empty or local.area<3:continue
  rect=list(local.minimum_rotated_rectangle.exterior.coords)[:4]
  x,z=local.minimum_rotated_rectangle.centroid.coords[0]
  if math.hypot(x,z)>2000:continue
  w=math.dist(rect[0],rect[1]);d=math.dist(rect[1],rect[2])
  if min(w,d)<.5:continue
  angle=-math.atan2(rect[1][1]-rect[0][1],rect[1][0]-rect[0][0])
  h=max(1,float(f['properties'].get('gro_flo_co') or 1))*3
  ground=min(elevation(xx,zz) for xx,zz in rect)
  city.append([round(x,2),round(ground-datum,2),round(z,2),round(w,2),round(h,2),round(d,2),int(f['properties']['objectid']),angle])
  cityFootprints.append(points)
profiles=[]
for j in range(angles):
 best=max(((math.degrees(math.atan2(heights[i*angles+j]-datum-1.65,r)),i) for i,r in enumerate(radii) if r>700))
 profiles.append({'bearing':round(j*360/angles,2),'angle':round(best[0],3),'distance':round(float(radii[best[1]])),'height':round(heights[best[1]*angles+j],1)})
result={'version':32,'origin':[LAT,LON],'axes':'x east, z south, y elevation minus origin DEM','datumMetres':round(datum,3),'radius':rad,'angles':angles,'radii':[round(float(r),2) for r in radii],'positions':positions,'city':city,'cityFootprints':cityFootprints,'contextRadius':2000,'skyline':profiles,'sources':{'terrain':'https://registry.opendata.aws/terrain-tiles/','format':'https://github.com/tilezen/joerd/blob/master/docs/formats.md','attribution':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md','accessed':'2026-10-14','tileZoom':ZOOM,'tileCount':len(tiles)},'contextBuildings':'MOIS / Esri Korea footprints; minimum bounding rectangles; height estimated as floors x 3m'}
(OUT/'terrain.json').write_text(json.dumps(result,separators=(',',':')))
qa={'tileCount':len(tiles),'datumMetres':datum,'vertices':len(positions)//3,'triangles':(len(radii)-1)*angles*2,'minElevation':min(heights),'maxElevation':max(heights),'contextBuildings':len(city),'highestSkyline':max(profiles,key=lambda a:a['angle']),'allFinite':bool(np.isfinite(positions).all())}
(REPORT/'environment-v32/terrain-validation.json').write_text(json.dumps(qa,indent=2));print(qa)
