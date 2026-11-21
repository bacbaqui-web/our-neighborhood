import unittest,sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from scene_edits import prepare_editable_roads,validate_road_groups,classify_roads
class RoadGroups(unittest.TestCase):
 def roads(self):return [{'editId':k,'properties':{'class':'minor'},'geometry':{'type':'LineString','coordinates':[[i*10,0],[(i+1)*10,0]]}} for i,k in enumerate('abc')]
 def test_roundtrip_and_unlink_keep_ids(self):
  edits={'roads':{'a':{'grade':2},'b':{'grade':2}},'roadGroups':[['a','b']]}
  roads=prepare_editable_roads(self.roads(),edits,preserve=True)
  self.assertEqual([r['editId'] for r in roads],list('abc'));self.assertEqual([r['grade'] for r in roads],[2,2,1])
  saved=json.loads(json.dumps({'roads':roads,'edits':edits}));saved['edits']['roadGroups']=[]
  self.assertEqual([r['editId'] for r in prepare_editable_roads(saved['roads'],saved['edits'],preserve=True)],list('abc'))
 def test_group_only_keeps_inferred_geometry(self):
  original=self.roads();roads=prepare_editable_roads(original,{'roadGroups':[['a','b']]},preserve=True)
  self.assertTrue(all(r['gradeSource']=='inferred' for r in roads));self.assertEqual([r['geometry'] for r in roads],[r['geometry'] for r in self.roads()])
 def test_invalid_groups(self):
  roads=classify_roads(self.roads(),{})
  for groups in ({},[['a']], [['a','missing']],[['a','b'],['b','c']]):
   with self.assertRaises(ValueError):validate_road_groups(roads,groups)
  roads[0]['grade']=2
  with self.assertRaises(ValueError):validate_road_groups(roads,[['a','b']])
if __name__=='__main__':unittest.main()
