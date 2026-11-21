import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from road_sections import group_road_sections

def road(ps,**props):
 return {'geometry':{'type':'LineString','coordinates':ps},'properties':{'class':'minor',**props},'width':5.2,'grade':1}
class Sections(unittest.TestCase):
 def test_chain(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0]]),road([[20,0],[10,0]])])),1)
 def test_t_junction(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[20,0]]),road([[10,0],[10,10]])])),3)
 def test_cross(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[20,0]]),road([[10,-10],[10,10]])])),4)
 def test_lane_change(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0]],lanes=2),road([[10,0],[20,0]],lanes=4)])),2)
 def test_bridge(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[20,0]]),road([[10,-10],[10,10]],layer=1,brunnel='bridge')])),2)
 def test_manual_boundary(self):
  a=road([[0,0],[10,0]]);b=road([[10,0],[20,0]])
  a.update(gradeSource='user',manualGrade=1);b['gradeSource']='inferred'
  result=group_road_sections([b,a]);self.assertEqual(len(result),2)
  self.assertEqual(sum(r.get('manualGrade')==1 for r in result),1)
 def test_loop(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0],[10,10],[0,0]])])),1)
 def test_duplicate_and_length(self):
  from shapely.geometry import shape
  result=group_road_sections([road([[0,0],[10,0]]),road([[10,0],[0,0]]),road([[10,0],[20,0]])])
  self.assertEqual(len(result),1);self.assertAlmostEqual(sum(shape(r['geometry']).length for r in result),20)
 def test_original_untouched(self):
  r=road([[0,0],[10,0]]);group_road_sections([r]);self.assertNotIn('sectionVersion',r)
if __name__=='__main__':unittest.main()
