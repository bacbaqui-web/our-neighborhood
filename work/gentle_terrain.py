"""Small deterministic hills, independent of measured near-ground elevations."""
import math
from neighborhood_sources import Terrain, scales

VERSION = 'gentle-terrain30'

class GentleTerrain(Terrain):
 def __init__(self, lat, lon):
  self.lat,self.lon=lat,lon;self.sx,self.sy=scales(lat)
  self.datum=0.;self.tiles={}
  self.phase=((round(lat*100000)*31+round(lon*100000)*17)%65521)/65521*math.tau
 def absolute(self,x,z):
  p=self.phase
  return (.9*(math.sin(x/75+z/110+p)-math.sin(p))
          +.55*(math.sin(-x/105+z/65+p*1.7)-math.sin(p*1.7))
          +.25*(math.sin(x/48+z/83+p*2.3)-math.sin(p*2.3)))

def select_buildings(buildings, location):
 """Keep complete footprints intersecting the selected circle, including its edge."""
 from shapely.geometry import shape,Point
 from shapely.ops import transform
 lat,lon=location['origin'];sx,sy=scales(lat)
 circle=Point(0,0).buffer(location.get('detailRadius',location['sizeMetres']/2),quad_segs=128)
 return {**buildings,'features':[f for f in buildings['features'] if
  transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])).intersects(circle)]}

def elevation_info():
 return {'mode':VERSION,'automaticallyFetched':False,'nearGroundRequests':0,
  'notice':'지면은 완만한 임의 높낮이입니다. 멀리 보이는 산에는 실제 지형 자료를 사용합니다.'}
