import unittest,sys,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from scene_edits import active_roads
class RoadExclusion(unittest.TestCase):
 def test_filter_preserves_source(self):
  roads=[{'editId':'a'},{'editId':'b'}];original=copy.deepcopy(roads)
  self.assertEqual(active_roads(roads,{'excludedRoads':['a']}),[roads[1]])
  self.assertEqual(roads,original)
  self.assertEqual(active_roads(roads,{'excludedRoads':[]}),original)
 def test_invalid(self):
  for ids in [['x'],['a','a'],'a',[1]]:
   with self.assertRaises(ValueError):active_roads([{'editId':'a'}],{'excludedRoads':ids})
