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
  self.assertEqual(len(group_road_sections([road([[0,0],[20,0]]),road([[10,0],[10,10]])])),2)
 def test_cross(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[20,0]]),road([[10,-10],[10,10]])])),2)
 def test_lane_change(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0]],lanes=2),road([[10,0],[20,0]],lanes=4)])),2)
 def test_bridge(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[20,0]]),road([[10,-10],[10,10]],layer=1,brunnel='bridge')])),2)
 def test_manual_boundary(self):
  a=road([[0,0],[10,0]]);b=road([[10,0],[20,0]])
  a.update(gradeSource='user',manualGrade=1);b['gradeSource']='inferred'
  result=group_road_sections([b,a]);self.assertEqual(len(result),2)
  self.assertEqual(sum(r.get('manualGrade')==1 for r in result),1)
 def test_inferred_grade_does_not_split_straight_road(self):
  a=road([[0,0],[10,0]]);b=road([[10,0],[20,0]]);b.update(grade=2)
  b['properties']['class']='tertiary'
  self.assertEqual(len(group_road_sections([a,b])),1)
 def test_turn_and_ambiguous_fork(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0]]),road([[10,0],[10,10]])])),2)
  self.assertEqual(len(group_road_sections([road([[-20,0],[0,0]]),road([[0,0],[20,5]]),road([[0,0],[20,-5]])])),3)
 def test_many_junctions_share_one_main(self):
  from shapely.geometry import shape
  roads=[road([[0,0],[40,0]])]+[road([[x,0],[x,10]]) for x in (10,20,30)]
  result=group_road_sections(roads)
  self.assertEqual(len(result),4)
  self.assertEqual(max(shape(r['geometry']).length for r in result),40)
 def test_different_manual_grades_preserved(self):
  a=road([[0,0],[10,0]]);b=road([[10,0],[20,0]]);c=road([[20,0],[30,0]])
  a.update(gradeSource='user',manualGrade=1);c.update(gradeSource='user',grade=2,manualGrade=2)
  result=group_road_sections([a,b,c]);self.assertEqual(len(result),3);self.assertEqual(sorted(r['manualGrade'] for r in result if r.get('manualGrade')),[1,2])
 def test_one_change_reaches_both_sides_of_junction(self):
  from scene_edits import classify_roads
  from shapely.geometry import shape,Point
  roads=group_road_sections([road([[-40,0],[40,0]]),road([[0,0],[0,20]])])
  classify_roads(roads,{})
  main=next(r for r in roads if shape(r['geometry']).covers(Point(-30,0)))
  classify_roads(roads,{main['editId']:{'grade':2}})
  self.assertEqual(main['grade'],2);self.assertTrue(shape(main['geometry']).covers(Point(30,0)))
  self.assertEqual(next(r for r in roads if r is not main)['grade'],1)
 def test_opposed_oneway_directions_stay_separate(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0]],oneway=1),road([[10,0],[20,0]],oneway=-1)])),2)
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0]],oneway=1),road([[20,0],[10,0]],oneway=1)])),2)
 def test_matching_oneway_directions_merge_and_keep_flow(self):
  result=group_road_sections([road([[0,0],[10,0]],oneway=1),road([[20,0],[10,0]],oneway=-1)])
  self.assertEqual(len(result),1)
  r=result[0];ps=r['geometry']['coordinates'];self.assertGreater((ps[-1][0]-ps[0][0])*r['properties']['oneway'],0)
 def test_oneway_loop_keeps_counterclockwise_flow(self):
  result=group_road_sections([road([[0,0],[10,0],[10,10],[0,10],[0,0]],oneway=1),road([[10,0],[20,0]])])
  arc=next(r for r in result if len(r['geometry']['coordinates'])>2)
  ps=arc['geometry']['coordinates'];area=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ps,ps[1:]))
  self.assertGreater(area*arc['properties']['oneway'],0)
 def test_loop(self):
  self.assertEqual(len(group_road_sections([road([[0,0],[10,0],[10,10],[0,0]])])),1)
 def test_duplicate_and_length(self):
  from shapely.geometry import shape
  result=group_road_sections([road([[0,0],[10,0]]),road([[10,0],[0,0]]),road([[10,0],[20,0]])])
  self.assertEqual(len(result),1);self.assertAlmostEqual(sum(shape(r['geometry']).length for r in result),20)
 def test_original_untouched(self):
  r=road([[0,0],[10,0]]);group_road_sections([r]);self.assertNotIn('sectionVersion',r)
if __name__=='__main__':unittest.main()
