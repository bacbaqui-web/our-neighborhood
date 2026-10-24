"""Common local-metre geometry for deterministic neighborhood rules."""
import json,struct,math
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import Polygon,Point
from shapely.ops import unary_union
from shapely.strtree import STRtree

class Site:
 def __init__(self,root,origin):
  self.root=Path(root);lat,lon=origin;angle=math.radians(lat)
  sy=111132.92-559.82*math.cos(2*angle)+1.175*math.cos(4*angle)-.0023*math.cos(6*angle);sx=111412.84*math.cos(angle)-93.5*math.cos(3*angle)+.118*math.cos(5*angle)
  self.buildings={};self.levels={}
  for f in json.load(open(self.root/'buildings.geojson'))['features']:
   rings=f['geometry']['coordinates'] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates'][0];owner=int(f['properties']['objectid'])
   self.buildings[owner]=Polygon([((x-lon)*sx,-(y-lat)*sy) for x,y,*_ in rings[0]]).buffer(0);self.levels[owner]=max(1,f['properties']['gro_flo_co'])
  self.built=unary_union(list(self.buildings.values()))
  raw=(self.root/'corrected-base.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);buffer=raw[28+n:]
  def acc(i):
   a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];typ={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];return np.ndarray((a['count'],c),dtype=typ,buffer=buffer,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(typ).itemsize*c),np.dtype(typ).itemsize))
  roads=[];self.terrain=[];self.triangles=[]
  for m in doc['meshes']:
   if m.get('name') not in ['ground','road','path']:continue
   for p in m['primitives']:
    vs=acc(p['attributes']['POSITION']);ix=acc(p['indices']).reshape(-1,3)
    for v in vs[ix]:
     poly=Polygon(v[:,[0,2]])
     if poly.area<1e-8:continue
     self.terrain.append(poly);self.triangles.append(v)
     if m['name']!='ground':roads.append(poly)
  self.road=unary_union(roads).buffer(0);self.tree=STRtree(self.terrain)
 def height(self,x,z):
  q=Point(x,z);ys=[]
  for i in self.tree.query(q):
   if not self.terrain[i].covers(q):continue
   a,b,c=self.triangles[i];den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
   ys.append(u*a[1]+v*b[1]+(1-u-v)*c[1])
  return float(max(ys)) if ys else 0.
