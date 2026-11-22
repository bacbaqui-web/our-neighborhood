import unittest,sys,tempfile,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from scene_edits import classify_roads
from road_priority import reserve
from shapely.geometry import shape

def road(i,points,**p):return {'editId':i,'geometry':{'type':'LineString','coordinates':points},'properties':p}
class Sidewalks(unittest.TestCase):
 def roads(self):return [road('main',[[-60,0],[60,0]],**{'class':'primary','width':12}),road('walk',[[-50,8],[50,8]],**{'class':'path','subclass':'footway'})]
 def test_roadside_attaches_and_regeneration_is_stable(self):
  rs=self.roads();classify_roads(rs,{});self.assertEqual(rs[1]['sidewalkParents'],['main']);classify_roads(rs,{});self.assertEqual(rs[1]['sidewalkParents'],['main'])
 def test_independent_steps_crossing_cycleway_and_grade_separation(self):
  for props,points in [({'subclass':'steps'},[[-50,8],[50,8]]),({'subclass':'cycleway'},[[-50,8],[50,8]]),({'footway':'crossing'},[[0,-10],[0,10]]),({'name':'공원 산책로'},[[-50,8],[50,8]]),({'layer':1},[[-50,8],[50,8]]),({},[[-50,30],[50,30]])]:
   rs=self.roads();rs[1]['properties'].update(props);rs[1]['geometry']['coordinates']=points;classify_roads(rs,{});self.assertNotIn('sidewalkParents',rs[1])
 def test_explicit_sidewalk_and_manual_edit(self):
  rs=self.roads();rs[1]['properties']['subclass']='sidewalk';classify_roads(rs,{});self.assertEqual(rs[1]['grade'],0);self.assertEqual(rs[1]['sidewalkParents'],['main'])
  classify_roads(rs,{'walk':{'grade':1}});self.assertNotIn('sidewalkParents',rs[1]);self.assertEqual(rs[1]['grade'],1)
 def test_no_duplicate_pedestrian_or_carriageway_surface(self):
  rs=self.roads();classify_roads(rs,{})
  with tempfile.TemporaryDirectory() as d:
   result=reserve(d,{'origin':[37.62,127.02],'sizeMetres':160},rs,{'features':[]})
   surfaces={k:shape(v) for k,v in result['surfaces'].items()}
   self.assertEqual(surfaces['pedestrian'].area,0)
   self.assertEqual(surfaces['carriageway'].intersection(surfaces['sidewalk']).area,0)
   from shapely.geometry import Point
   self.assertTrue(surfaces['sidewalk'].covers(Point(0,8)))
   self.assertFalse(shape(result['road']).covers(Point(0,8)))
 def test_stairs_are_not_merged_into_sidewalk(self):
  from road_sections import group_road_sections
  rs=self.roads();rs.append(road('steps',[[50,8],[65,8]],**{'class':'path','subclass':'steps'}));classify_roads(rs,{})
  merged=group_road_sections(rs)
  self.assertEqual(len(merged),3)
if __name__=='__main__':unittest.main()
