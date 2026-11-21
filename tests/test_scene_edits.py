import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from scene_edits import classify_roads, apply_building_rules, align_profile
from shapely.geometry import mapping,LineString,Polygon
class SceneEdits(unittest.TestCase):
 def test_corner_prefers_major_and_preserves_known_floors(self):
  roads=[{'geometry':mapping(LineString([(-30,0),(30,0)])),'width':5,'properties':{'class':'minor'}}, {'geometry':mapping(LineString([(0,-30),(0,30)])),'width':5,'properties':{'class':'minor'}}]
  classify_roads(roads,{})
  edit={roads[1]['editId']:{'grade':2}}
  classify_roads(roads,edit)
  b={'type':'Feature','properties':{'objectid':1,'gro_flo_co':3,'floorsEstimated':False},'geometry':mapping(Polygon([(8,8),(16,8),(16,16),(8,16)]))}
  apply_building_rules({'features':[b]},roads,{},local=True)
  self.assertEqual(b['properties']['streetProfile']['grade'],2)
  self.assertEqual(b['properties']['gro_flo_co'],3)
  self.assertEqual(b['properties']['streetProfile']['use'],'mixed')
 def test_manual_fields_survive_road_change(self):
  r=[{'geometry':mapping(LineString([(-30,0),(30,0)])),'width':5,'properties':{'class':'minor'}}]
  classify_roads(r,{})
  b={'properties':{'objectid':9,'gro_flo_co':1,'floorsEstimated':True},'geometry':mapping(Polygon([(0,10),(10,10),(10,20),(0,20)]))}
  edit={'9':{'floors':7,'frontEdge':2,'era':'new','styleIndex':3,'use':'residential'}}
  classify_roads(r,{r[0]['editId']:{'grade':4}})
  apply_building_rules({'features':[b]},r,edit,local=True)
  self.assertEqual(b['properties']['gro_flo_co'],7)
  self.assertEqual(b['properties']['streetProfile']['frontEdge'],2)
  self.assertEqual(b['properties']['streetProfile']['use'],'residential')
 def test_front_stays_on_same_wall_after_ring_reversal(self):
  poly=Polygon([(0,0),(10,0),(10,10),(0,10)])
  profile={'frontStart':[0,0],'frontEnd':[10,0],'frontEdge':0}
  reverse=Polygon(list(poly.exterior.coords)[::-1]);result=align_profile(profile,reverse)
  a,b=list(reverse.exterior.coords)[result['frontEdge']:result['frontEdge']+2]
  self.assertEqual(set([a,b]),set([(0,0),(10,0)]))
 def test_hidden_major_road_does_not_claim_back_house(self):
  roads=[{'geometry':mapping(LineString([(-30,0),(30,0)])),'width':5,'properties':{'class':'primary'}}, {'geometry':mapping(LineString([(-30,35),(30,35)])),'width':5,'properties':{'class':'minor'}}]
  classify_roads(roads,{})
  def feature(owner,poly):return {'properties':{'objectid':owner,'gro_flo_co':2,'floorsEstimated':True},'geometry':mapping(poly)}
  front=feature(1,Polygon([(-25,8),(25,8),(25,18),(-25,18)]))
  back=feature(2,Polygon([(-5,21),(5,21),(5,29),(-5,29)]))
  apply_building_rules({'features':[front,back]},roads,{},local=True)
  self.assertEqual(back['properties']['streetProfile']['grade'],1)
 def test_inferred_floors_change_but_actual_use_and_footprint_stay(self):
  roads=[{'geometry':mapping(LineString([(-100,0),(100,0)])),'width':5,'properties':{'class':'minor'}}]
  classify_roads(roads,{})
  b={'properties':{'objectid':6,'gro_flo_co':1,'floorsEstimated':True,'bdtyp_cd':'01000'},'geometry':mapping(Polygon([(0,12),(30,12),(30,42),(0,42)]))}
  geometry=b['geometry']
  apply_building_rules({'features':[b]},roads,{},local=True)
  self.assertLessEqual(b['properties']['gro_flo_co'],4)
  classify_roads(roads,{roads[0]['editId']:{'grade':4}})
  apply_building_rules({'features':[b]},roads,{},local=True)
  self.assertGreater(b['properties']['gro_flo_co'],10)
  self.assertEqual(b['properties']['streetProfile']['use'],'residential')
  self.assertEqual(b['geometry'],geometry)
 def test_bad_grade(self):
  r=[{'geometry':mapping(LineString([(0,0),(10,0)])),'width':5,'properties':{'class':'minor'}}]
  classify_roads(r,{})
  with self.assertRaises(ValueError):classify_roads(r,{r[0]['editId']:{'grade':7}})
if __name__=='__main__':unittest.main()
