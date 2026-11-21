import unittest,tempfile,sys,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from road_priority import reserve,scales
from scene_edits import classify_roads
from shapely.geometry import box,LineString,mapping,shape
from shapely.ops import transform
class GradeOverlap(unittest.TestCase):
 def run_case(self,footprint,manual):
  lat,lon=37.62,127.02;sx,sy=scales(lat)
  roads=[{'editId':'main','geometry':mapping(LineString([(-40,0),(40,0)])),'properties':{'class':'tertiary'},'width':7.1}]
  classify_roads(roads,{'main':{'grade':2}} if manual else {})
  buildings={'features':[{'properties':{'objectid':1,'gro_flo_co':4},'geometry':mapping(transform(lambda x,y:(lon+x/sx,lat-y/sy),footprint))}]};original=copy.deepcopy(buildings)
  with tempfile.TemporaryDirectory() as temp:result=reserve(temp,{'origin':[lat,lon],'sizeMetres':100},roads,buildings)
  self.assertEqual(buildings,original);self.assertEqual(result['qa']['roadBuildingOverlapM2'],0);self.assertEqual(result['qa']['sidewalkBuildingOverlapM2'],0)
  return result
 def test_same_grade_manual_and_inferred_have_same_surface(self):
  inferred=self.run_case(box(-10,1,10,10),False);manual=self.run_case(box(-10,1,10,10),True)
  self.assertTrue(shape(inferred['road']).equals(shape(manual['road'])));self.assertEqual(manual['qa']['unresolvedRoadBuildingConflicts'],[])
  self.assertEqual(shape(manual['road']).geom_type,'Polygon')
 def test_centerline_conflict_preserves_building_and_reports_unresolved(self):
  result=self.run_case(box(-4,-2,4,2),True)
  self.assertEqual(result['qa']['unresolvedRoadBuildingConflicts'][0]['roadId'],'main')
  self.assertGreater(result['qa']['unresolvedRoadBuildingConflicts'][0]['insideBuildingMetres'],7)
if __name__=='__main__':unittest.main()
