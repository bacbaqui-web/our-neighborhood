import sys,unittest,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from shapely.geometry import LineString,mapping,shape,Point,box
from scene_edits import classify_roads
from road_geometry import pavement,median_spaces,width_at
from road_priority import reserve

def road(points,oneway=1,layer=0):return {'geometry':mapping(LineString(points)),'properties':{'class':'primary','oneway':oneway,'layer':layer}}
class Geometry(unittest.TestCase):
 def test_paired_half_width_and_no_inner_sidewalk(self):
  rs=[road([[-50,-5],[50,-5]]),road([[50,5],[-50,5]])];classify_roads(rs,{})
  self.assertEqual([r['width'] for r in rs],[6.75,6.75]);self.assertEqual([r['outerSide'] for r in rs],[-1,-1])
  self.assertTrue(median_spaces(rs).covers(Point(0,0)))
  with tempfile.TemporaryDirectory() as d:
   plan=reserve(d,{'origin':[37.62,127.02],'sizeMetres':100},rs,{'features':[]})
   self.assertFalse(shape(plan['surfaces']['sidewalk']).intersects(box(-30,-1,30,1)))
   self.assertTrue(shape(plan['road']).covers(Point(0,0)))
  classify_roads(rs,{})
  self.assertEqual([r['width'] for r in rs],[6.75,6.75])
 def test_pair_split_into_fragments(self):
  rs=[road([[-60,-5],[60,-5]]),road([[60,5],[0,5]]),road([[0,5],[-60,5]])];classify_roads(rs,{})
  self.assertEqual([r['width'] for r in rs],[6.75]*3)
 def test_single_same_flow_or_grade_separated_unchanged(self):
  for rs in [[road([[-50,0],[50,0]])],[road([[-50,-5],[50,-5]]),road([[-50,5],[50,5]])],[road([[-50,-5],[50,-5]]),road([[50,5],[-50,5]],layer=1)]]:
   classify_roads(rs,{});self.assertTrue(all(r['width']==13.5 for r in rs))
 def test_partial_pair_and_bridge_preserved(self):
  rs=[road([[-100,-5],[100,-5]]),road([[40,5],[-40,5]])];classify_roads(rs,{})
  self.assertTrue(all('carriagewayPair' not in r for r in rs))
  rs=[road([[-50,-5],[50,-5]]),road([[50,5],[-50,5]])];rs[1]['properties']['brunnel']='bridge';classify_roads(rs,{})
  self.assertTrue(all('carriagewayPair' not in r for r in rs))
 def test_busway_does_not_hide_through_width_transition(self):
  rs=[road([[-50,0],[0,0]],0),road([[0,0],[50,0]],0),road([[0,0],[20,5]],1)]
  rs[2]['properties']['class']='busway';classify_roads(rs,{})
  classify_roads(rs,{rs[1]['editId']:{'grade':4}})
  self.assertAlmostEqual(width_at(rs[1],0),13.5)
 def test_explicit_width_or_lanes_are_not_halved(self):
  for tag,value in [('width','9'),('lanes','3')]:
   rs=[road([[-50,-5],[50,-5]]),road([[50,5],[-50,5]])]
   for r in rs:r['properties'][tag]=value
   classify_roads(rs,{})
   self.assertTrue(all('carriagewayPair' not in r for r in rs))
 def test_reverse_oneway_uses_actual_flow(self):
  rs=[road([[-50,-5],[50,-5]],-1),road([[50,5],[-50,5]],-1)];classify_roads(rs,{})
  self.assertEqual([r['width'] for r in rs],[6.75,6.75])
  rs=[road([[-50,-5],[50,-5]],-1),road([[50,5],[-50,5]],1)];classify_roads(rs,{})
  self.assertTrue(all('carriagewayPair' not in r for r in rs))
 def test_wide_arm_tapers_without_gap(self):
  rs=[road([[-50,0],[0,0]],0),road([[0,0],[50,0]],0)];classify_roads(rs,{})
  classify_roads(rs,{rs[1]['editId']:{'grade':4}})
  self.assertAlmostEqual(width_at(rs[1],0),13.5);self.assertAlmostEqual(width_at(rs[1],30),19.9)
  a,b=map(pavement,rs);self.assertTrue(a.union(b).covers(LineString([[-40,0],[40,0]])))
  self.assertLess(b.intersection(box(0,-20,.01,20)).area,.14)
if __name__=='__main__':unittest.main()
