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
 return key,rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:terrain=dict(pool.map(load,tiles))
def elevation(x,z):
 px,py=pixel(x,z);ix,iy=int(px),int(py);fx,fy=px-ix,py-iy
 def at(a,b):return float(terrain[(a//256,b//256)][b%256,a%256])
 return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy
datum=elevation(0,0);radii=[0,80,150,220,300]+list(np.geomspace(400,rad,92));angles=512;positions=[];heights=[]
for r in radii:
 for j in range(angles):
  a=j/angles*math.tau;x=math.sin(a)*r;z=-math.cos(a)*r;h=elevation(x,z)
  positions.extend([round(x,2),round(h-datum,2),round(z,2)]);heights.append(h)
# Contextual buildings are deliberately generic; terrain under them is geographic.
city=[];rng=np.random.default_rng(3201)
for x in np.arange(-2600,2600,48):
 for z in np.arange(-2600,2600,48):
  x1=float(x+rng.uniform(-10,10));z1=float(z+rng.uniform(-10,10));d=math.hypot(x1,z1)
  if max(abs(x1),abs(z1))<235 or d<760 or d>2800 or rng.random()<.31:continue
  h=elevation(x1,z1);slope=max(abs(elevation(x1+35,z1)-h),abs(elevation(x1,z1+35)-h))/35
  if h>145 or slope>.18:continue
  height=float(rng.uniform(7,23) if rng.random()<.93 else rng.uniform(25,48))
  city.append([round(x1,1),round(h-datum,2),round(z1,1),round(float(rng.uniform(10,23)),1),round(height,1),round(float(rng.uniform(10,25)),1),int(rng.integers(0,5))])
for ix,x in enumerate(np.arange(-760,760,25)):
 for iz,z in enumerate(np.arange(-760,760,25)):
  x1=float(x+rng.uniform(-2,2));z1=float(z+rng.uniform(-2,2));d=math.hypot(x1,z1)
  if max(abs(x1),abs(z1))<235 or d>=760 or ix%9==0 or iz%11==0 or rng.random()<.10:continue
  h=elevation(x1,z1);slope=max(abs(elevation(x1+20,z1)-h),abs(elevation(x1,z1+20)-h))/20
  if h>145 or slope>.23:continue
  city.append([round(x1,1),round(h-datum,2),round(z1,1),round(float(rng.uniform(17,23)),1),round(float(rng.uniform(9,22)),1),round(float(rng.uniform(17,23)),1),int(rng.integers(0,5))])
profiles=[]
for j in range(angles):
 best=max(((math.degrees(math.atan2(heights[i*angles+j]-datum-1.65,r)),i) for i,r in enumerate(radii) if r>700))
 profiles.append({'bearing':round(j*360/angles,2),'angle':round(best[0],3),'distance':round(float(radii[best[1]])),'height':round(heights[best[1]*angles+j],1)})
result={'version':32,'origin':[LAT,LON],'axes':'x east, z south, y elevation minus origin DEM','datumMetres':round(datum,3),'radius':rad,'angles':angles,'radii':[round(float(r),2) for r in radii],'positions':positions,'city':city,'skyline':profiles,'sources':{'terrain':'https://registry.opendata.aws/terrain-tiles/','format':'https://github.com/tilezen/joerd/blob/master/docs/formats.md','attribution':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md','accessed':'2026-10-14','tileZoom':ZOOM,'tileCount':len(tiles)},'contextBuildings':'procedural massing only, not surveyed building positions'}
(OUT/'terrain.json').write_text(json.dumps(result,separators=(',',':')))
qa={'tileCount':len(tiles),'datumMetres':datum,'vertices':len(positions)//3,'triangles':(len(radii)-1)*angles*2,'minElevation':min(heights),'maxElevation':max(heights),'contextBuildings':len(city),'highestSkyline':max(profiles,key=lambda a:a['angle']),'allFinite':bool(np.isfinite(positions).all())}
(REPORT/'environment-v32/terrain-validation.json').write_text(json.dumps(qa,indent=2));print(qa)
