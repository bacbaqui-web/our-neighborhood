import unittest,sys,tempfile,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from shapely.geometry import box,mapping,LineString,shape
from shapely.ops import transform
from road_priority import scales
from map_preparation import prepare_layout, flat_visibility
ORIGIN=[37.62,127.02]
sx,sy=scales(ORIGIN[0])
def feature(i,p):
 return {'type':'Feature','properties':{'objectid':i,'gro_flo_co':3,'floorsEstimated':False},'geometry':mapping(transform(lambda x,y:(ORIGIN[1]+x/sx,ORIGIN[0]-y/sy),p))}
def collection():return {'type':'FeatureCollection','source':'test','features':[feature(1,box(-5,10,5,20)),feature(2,box(-5,25,5,35))]}
def roads():return [{'editId':'main','properties':{'class':'minor'},'geometry':mapping(LineString([(-60,0),(60,0)]))}]
class Preparation(unittest.TestCase):
 def prepare(self,edits=None,source=None,previous=None,preview=False):
  with tempfile.TemporaryDirectory() as d:return prepare_layout(d,{'origin':ORIGIN,'sizeMetres':200},source or collection(),roads(),edits or {'roads':{},'buildings':{}},previous,preview=preview)
 def test_preview_is_repeatable_and_preserves_source(self):
  src=collection();before=copy.deepcopy(src)
  first=self.prepare(source=src);second=self.prepare(source=src)
  self.assertEqual(first['buildings'],second['buildings']);self.assertEqual(src,before)
 def test_manual_use_front_and_move_survive(self):
  data=self.prepare({'roads':{'main':{'grade':2}},'buildings':{'1':{'use':'mixed','frontEdge':0,'positionOffset':[12,0]}}})
  f=data['buildings']['features'][0];p=f['properties']['streetProfile']
  self.assertEqual(p['use'],'mixed');self.assertEqual(p['frontEdge'],0)
  self.assertAlmostEqual((shape(f['geometry']).centroid.x-ORIGIN[1])*sx,12,places=4)
 def test_reject_invalid_offsets(self):
  for offset in [[float('nan'),0],[31,0],[True,0],['2',0],[0]]:
   with self.assertRaises(ValueError):self.prepare({'roads':{},'buildings':{'1':{'positionOffset':offset}}})
 def test_reject_move_into_neighbor_or_road(self):
  for offset in [[0,15],[0,-12]]:
   with self.assertRaises(ValueError):self.prepare({'roads':{},'buildings':{'1':{'positionOffset':offset}}})
 def test_preview_keeps_overlap_and_final_rejects_it(self):
  edits={'roads':{},'buildings':{'1':{'positionOffset':[0,15]}}}
  result=self.prepare(edits,preview=True)
  self.assertTrue(result['conflicts'])
  self.assertEqual(result['conflicts'][0]['kind'],'building')
  self.assertEqual(result['sceneEdits']['buildings']['1']['positionOffset'],[0,15])
  with self.assertRaises(ValueError):self.prepare(edits)
 def test_deleted_building_is_absent_and_source_preserved(self):
  src=collection();result=self.prepare({'roads':{},'buildings':{'1':{'deleted':True}}},source=src)
  self.assertEqual([f['properties']['objectid'] for f in result['buildings']['features']],[2])
  self.assertEqual(len(src['features']),2)
 def test_low_grade_allows_facade_near_road_and_major_has_sidewalk(self):
  from map_preparation import local_shape
  src={'type':'FeatureCollection','features':[feature(1,box(-4,2.6,4,9))]}
  a=self.prepare({'roads':{'main':{'grade':1}},'buildings':{}},source=src)
  self.assertLess(local_shape(a['buildings']['features'][0],ORIGIN).bounds[1],3)
  b=self.prepare({'roads':{'main':{'grade':2}},'buildings':{}})
  self.assertGreater(shape(b['reservation']['surfaces']['sidewalk']).area,0)
 def test_cached_drag_matches_fresh_calculation(self):
  from map_preparation import reposition_layout
  a=self.prepare();edits={'roads':{},'buildings':{'1':{'positionOffset':[0,15],'frontEdge':0}}}
  cached=reposition_layout(a,edits,ORIGIN,100)
  fresh=self.prepare(edits,preview=True)
  self.assertTrue(cached['conflicts'])
  self.assertEqual(cached['sceneEdits'],fresh['sceneEdits'])
  for a,b in zip(cached['buildings']['features'],fresh['buildings']['features']):
   self.assertLess(shape(a['geometry']).symmetric_difference(shape(b['geometry'])).area,1e-12)
  restored=reposition_layout(cached,{'roads':{},'buildings':{}},ORIGIN,100)
  self.assertFalse(restored['conflicts'])
 def test_distant_source_overlap_does_not_block_generation_area(self):
  src=collection();src['features'] += [feature(3,box(200,200,210,210)),feature(4,box(205,205,215,215))]
  self.assertFalse(self.prepare(source=src)['conflicts'])
 def test_deletion_flag_must_be_boolean(self):
  with self.assertRaises(ValueError):self.prepare({'roads':{},'buildings':{'1':{'deleted':'yes'}}})
 def test_flat_visibility_front_hides_back_without_height(self):
  result=flat_visibility(collection(),ORIGIN,100)
  self.assertTrue(result['1']['visible']);self.assertFalse(result['2']['visible'])
  self.assertAlmostEqual(result['1']['distance'],10,places=2)
 def test_move_reopen_keeps_selected_wall_and_does_not_accumulate(self):
  edits={'roads':{},'buildings':{'1':{'frontEdge':0,'positionOffset':[12,0]}}}
  a=self.prepare(edits);b=self.prepare(a['sceneEdits'],previous=a['buildings'])
  self.assertEqual(a['buildings'],b['buildings'])
 def test_single_building_edit_matches_full_rebuild(self):
  from scene_edits import apply_building_rules
  initial=self.prepare();edits={'roads':{},'buildings':{'1':{'use':'mixed','frontEdge':1}}}
  cached=copy.deepcopy(initial['buildings'])
  apply_building_rules(cached,initial['roads'],edits['buildings'],ORIGIN,only_ids={'1'})
  full=self.prepare(edits)
  self.assertEqual(cached,full['buildings'])
 def test_manual_pedestrian_road_is_not_a_carriageway(self):
  a=self.prepare({'roads':{'main':{'grade':0}},'buildings':{}})
  self.assertEqual(a['roads'][0]['grade'],0)
  self.assertEqual(a['reservation']['entries'][0]['streetType'],'pedestrian')
 def test_road_change_recalculates_fitted_footprints(self):
  a=self.prepare();b=self.prepare({'roads':{'main':{'grade':4}},'buildings':{}})
  self.assertNotEqual(a['buildings']['features'][0]['geometry'],b['buildings']['features'][0]['geometry'])
if __name__=='__main__':unittest.main()
