import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from shapely.geometry import Polygon, shape, box
from street_end_context import build_context
import math
LAT,LON=37.62,127.02
a=math.radians(LAT);SX=111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a);SY=111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
def feature(i,points,floors=3):
 return {'type':'Feature','properties':{'objectid':i,'gro_flo_co':floors},'geometry':{'type':'Polygon','coordinates':[[[LON+x/SX,LAT-z/SY] for x,z in points]]}}
def collection(fs):return {'type':'FeatureCollection','features':fs,'source':'fixture'}
class ContextTest(unittest.TestCase):
 def test_real_shapes_roads_and_occlusion(self):
  front=feature(1,[(12,-10),(25,-10),(25,10),(12,10),(12,-10)],10)
  hidden=feature(2,[(90,-9),(100,-9),(100,9),(90,9),(90,-9)])
  visible=feature(3,[(-10,80),(-10,95),(10,95),(10,80),(-10,80)])
  roads=[{'width':6,'geometry':{'type':'LineString','coordinates':[[0,0],[0,190]]}}]
  out=build_context(collection([front,hidden,visible]),roads,[LAT,LON],50,{'position':[0,0],'eyeHeight':2},collection([front]))
  self.assertEqual([b['owner'] for b in out['buildings']],[3])
  self.assertEqual(out['buildings'][0]['height'],9)
  self.assertLessEqual(out['qa']['buildings'],256)
  for road in out['roads']:
   poly=Polygon(road['rings'][0],road['rings'][1:])
   self.assertLess(poly.intersection(box(-10,80,10,95)).area,.001)
  self.assertTrue(any(Polygon(r['rings'][0],r['rings'][1:]).covers(__import__('shapely').geometry.Point(0,50)) for r in out['roads']))
 def test_uphill_roof_and_narrow_facade(self):
  front=feature(1,[(12,-10),(25,-10),(25,10),(12,10),(12,-10)],3)
  back=feature(2,[(150,-2),(153,-2),(153,2),(150,2),(150,-2)],3)
  class Hill:
   def height(self,x,z):return max(0,x-25)*.8
  out=build_context(collection([front,back]),[],[LAT,LON],50,{'position':[0,0],'eyeHeight':2},collection([front]),Hill())
  self.assertEqual([b['owner'] for b in out['buildings']],[2])
 def test_empty(self):
  out=build_context(collection([]),[],[LAT,LON],50,{'position':[0,0],'eyeHeight':2},collection([]))
  self.assertEqual(out['buildings'],[]);self.assertEqual(out['roads'],[])
 def test_holes_and_multi_polygons(self):
  f=feature(4,[(-20,80),(-20,110),(20,110),(20,80),(-20,80)])
  hole=feature(5,[(-5,90),(-5,100),(5,100),(5,90),(-5,90)])['geometry']['coordinates'][0]
  f['geometry']['coordinates'].append(hole)
  f['geometry']={'type':'MultiPolygon','coordinates':[f['geometry']['coordinates']]}
  out=build_context(collection([f]),[],[LAT,LON],50,{'position':[0,0],'eyeHeight':2},collection([]))
  self.assertEqual(len(out['buildings'][0]['rings']),2)
if __name__=='__main__':unittest.main()
