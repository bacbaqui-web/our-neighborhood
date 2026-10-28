"""Road-profile terrain. Missing route evidence must never silently become Mapzen.
Mapzen remains the background away from observed road corridors.
"""
import json, math, hashlib
from pathlib import Path
import numpy as np
from neighborhood_sources import Terrain, scales

PROFILE=Path(__file__).resolve().parents[1]/'outputs/domestic-test/route-elevation.json'
VERSION='kakao-road-v1'

def profile_for(location):
 data=json.loads(PROFILE.read_text());lat,lon=location['origin'];sx,sy=scales(lat)
 def xy(p):return ((p[0]-lon)*sx,(lat-p[1])*sy)
 segments=[];radius=location.get('sizeMetres',300)/2
 for a,b in data['segments']:
  aa,bb=xy(a),xy(b);dx,dz=bb[0]-aa[0],bb[1]-aa[1];l=dx*dx+dz*dz
  t=max(0,min(1,-(aa[0]*dx+aa[1]*dz)/l)) if l else 0
  if math.hypot(aa[0]+t*dx,aa[1]+t*dz)<=radius+25:segments.append([a,b])
 if not segments:
  raise ValueError('이 위치의 카카오 경로 고도를 아직 받지 못했습니다. 현재는 고도를 확보한 솔매로 주변만 생성할 수 있습니다. 다른 위치는 카카오 경로 고도 자료를 먼저 추가해야 합니다.')
 return {**data,'segments':segments}

def profile_identity(data):
 return hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()[:12]

class KakaoTerrain(Terrain):
 def __init__(self,lat,lon,profile):
  self.correction=None;super().__init__(lat,lon)
  segments=[];seen=set()
  for pair in profile['segments']:
   points=[]
   for lon1,lat1,h in pair:
    x,z=(lon1-lon)*self.sx,(lat-lat1)*self.sy
    points.append([x,z,h-Terrain.absolute(self,x,z)])
   key=tuple(round(v,5) for p in points for v in p)
   if key not in seen:segments.append(points);seen.add(key)
  self.correction=np.asarray(segments);self.datum=self.absolute(0,0)
 def absolute(self,x,z):
  baseline=Terrain.absolute(self,x,z)
  if self.correction is None:return baseline
  a,b=self.correction[:,0],self.correction[:,1];d=b[:,:2]-a[:,:2];l=np.sum(d*d,axis=1)
  t=np.clip(np.sum((np.array([x,z])-a[:,:2])*d,axis=1)/np.maximum(l,1e-9),0,1)
  distance=np.linalg.norm(np.array([x,z])-a[:,:2]-t[:,None]*d,axis=1)
  weights=1/(distance*distance+.04)**2;u=np.clip((float(distance.min())-25)/95,0,1)
  return baseline+float(np.sum(weights*(a[:,2]+t*(b[:,2]-a[:,2])))/weights.sum())*(1-u*u*(3-2*u))

# Local art correction confirmed by the user; not surveyed elevations.
DOBONG_CENTER=(37.625513523469,127.026651155374)
def flat_correction(location):
 lat,lon=location['origin'];sx,sy=scales(lat)
 if math.hypot((lon-DOBONG_CENTER[1])*sx,(lat-DOBONG_CENTER[0])*sy)>120:return None
 return {'id':'dobong-flat-v1','center':list(DOBONG_CENTER),'flatRadius':180,'blendRadius':400,'source':'user-confirmed-near-flat; inferred height, not surveyed'}
class LocalFlatTerrain(Terrain):
 def __init__(self,lat,lon,correction):
  self.flat=None;super().__init__(lat,lon)
  clat,clon=correction['center'];self.cx=(clon-lon)*self.sx;self.cz=(lat-clat)*self.sy
  # Lower samples reduce building-height contamination in this local DEM.
  samples=[Terrain.absolute(self,self.cx+x,self.cz+z) for x in range(-100,101,25) for z in range(-100,101,25)]
  self.level=float(np.quantile(samples,.2));self.flat=correction;self.datum=self.absolute(0,0)
 def absolute(self,x,z):
  raw=Terrain.absolute(self,x,z)
  if self.flat is None:return raw
  distance=math.hypot(x-self.cx,z-self.cz)
  t=np.clip((distance-self.flat['flatRadius'])/(self.flat['blendRadius']-self.flat['flatRadius']),0,1)
  return self.level+(raw-self.level)*float(t*t*(3-2*t))
def load_terrain(root,location):
 correction=Path(root)/'terrain-correction.json'
 if correction.exists():return LocalFlatTerrain(*location['origin'],json.loads(correction.read_text()))
 path=Path(root)/'kakao-elevation.json'
 if path.exists():return KakaoTerrain(*location['origin'],json.loads(path.read_text()))
 return Terrain(*location['origin'])  # Existing saved maps retain their original data.
