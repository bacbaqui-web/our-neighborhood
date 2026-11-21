import sys,unittest,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from view_generation import validate_view,view_region,select_view,select_roads,snap_to_road
from shapely.geometry import box,mapping,Point,shape
from shapely.ops import transform
LAT,LON=37.,127.;a=math.radians(LAT)
SX=111412.84*math.cos(a)-93.5*math.cos(3*a)+.118*math.cos(5*a);SY=111132.92-559.82*math.cos(2*a)+1.175*math.cos(4*a)-.0023*math.cos(6*a)
def feature(g,floors=3):
 return {'type':'Feature','properties':{'gro_flo_co':floors},'geometry':mapping(transform(lambda x,z:(LON+x/SX,LAT-z/SY),g))}
def view():
 v=validate_view({'heading':0});v.update(position=[0,0],snappedMetres=0);return v
class ViewTests(unittest.TestCase):
 def test_validation(self):
  for h in [None,float('nan'),360,-1,'90',True]:
   with self.assertRaises(ValueError):validate_view({'heading':h})
 def test_all_directions_independent_of_heading(self):
  features=[feature(box(-3,-20,3,-15)),feature(box(-3,15,3,20)),feature(box(15,-3,20,3)),feature(box(-20,-3,-15,3))]
  for h in [0,90,200]:
   v=view();v['heading']=h
   result,qa=select_view({'features':features},[LAT,LON],50,v)
   self.assertEqual(len(result['features']),4)
 def test_hidden_house_but_visible_upper_floors(self):
  near=feature(box(-10,10,10,15),3);hidden=feature(box(-3,22,3,26),2);tall=feature(box(-3,22,3,26),12)
  for rear,expected in [(hidden,1),(tall,2)]:
   result,qa=select_view({'features':[near,rear]},[LAT,LON],50,view())
   self.assertEqual(len(result['features']),expected)
   self.assertFalse(shape(qa['region']).covers(Point(0,30)))
 def test_gap_and_narrow_object(self):
  fs=[feature(box(-15,10,-1,15)),feature(box(1,10,15,15)),feature(box(-.1,30,.1,31))]
  result,_=select_view({'features':fs},[LAT,LON],50,view());self.assertEqual(len(result['features']),3)
 def test_snap_and_no_road(self):
  r={'surfaces':{k:mapping(box(8,-20,12,20) if k=='shared' else Point().buffer(0)) for k in ('sidewalk','pedestrian','shared')}}
  v=view();p=snap_to_road(r,v);self.assertAlmostEqual(p.x,8.65);self.assertTrue(shape(r['surfaces']['shared']).covers(p.buffer(.6)))
  r['surfaces']['shared']=mapping(box(40,0,45,10))
  with self.assertRaises(ValueError):snap_to_road(r,view())
 def test_shared_road_centerline_preferred(self):
  from shapely.geometry import LineString
  r={'surfaces':{k:mapping(box(8,-20,12,20) if k=='shared' else Point().buffer(0)) for k in ('sidewalk','pedestrian','shared')}}
  p=snap_to_road(r,view(),roads=[{'streetType':'shared','geometry':mapping(LineString([(10,-20),(10,20)]))}])
  self.assertEqual((p.x,p.y),(10,0))
 def test_building_inside_rejected(self):
  with self.assertRaises(ValueError):select_view({'features':[feature(box(-2,-2,2,2))]},[LAT,LON],50,view())
 def test_roads_clipped_at_occluder(self):
  _,qa=select_view({'features':[feature(box(-10,10,10,15))]},[LAT,LON],50,view())
  roads=select_roads([{'geometry':mapping(__import__('shapely').geometry.LineString([(0,-80),(0,80)])),'width':4}],50,view(),qa)
  self.assertLess(shape(roads[0]['geometry']).bounds[3],12)
 def test_original(self):
  data={'features':[]};self.assertIs(select_view(data,[LAT,LON],50,None)[0],data)
if __name__=='__main__':unittest.main()
