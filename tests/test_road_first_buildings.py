import unittest,tempfile,sys,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from road_priority import reserve,scales
from scene_edits import classify_roads,apply_building_rules
from shapely.geometry import box,LineString,mapping,shape
from shapely.ops import transform
class RoadFirstBuildings(unittest.TestCase):
 def run_case(self,polys,grade=2):
  lat,lon=37.62,127.02;sx,sy=scales(lat)
  roads=[{'editId':'main','geometry':mapping(LineString([(-40,0),(40,0)])),'properties':{'class':'minor'},'width':5.2}];classify_roads(roads,{'main':{'grade':grade}})
  buildings={'features':[{'properties':{'objectid':i,'gro_flo_co':4},'geometry':mapping(transform(lambda x,y:(lon+x/sx,lat-y/sy),p))} for i,p in enumerate(polys)]}
  original=copy.deepcopy(buildings)
  apply_building_rules(buildings,roads,{'0':{'floors':7,'frontEdge':0}},[lat,lon])
  with tempfile.TemporaryDirectory() as temp:
   result=reserve(temp,{'origin':[lat,lon],'sizeMetres':100},roads,buildings)
   second=reserve(temp,{'origin':[lat,lon],'sizeMetres':100},roads,copy.deepcopy(buildings))
  self.assertTrue(shape(result['road']).equals(shape(second['road'])))
  fitted=[transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])) for f in buildings['features']]
  self.assertTrue(shape(result['road']).covers(LineString([(-39,0),(39,0)])))
  self.assertTrue(all(p.intersection(shape(result['protected'])).area<1e-6 for p in fitted))
  return result,buildings,fitted,original
 def test_move_before_shrink_preserves_dimensions_and_manual_fields(self):
  result,buildings,fitted,original=self.run_case([box(-5,1,5,11)])
  self.assertAlmostEqual(fitted[0].area,100,places=4);self.assertEqual(buildings['features'][0]['properties']['gro_flo_co'],7)
  self.assertEqual(buildings['features'][0]['properties']['roadFit']['method'],'moved');self.assertEqual(result['qa']['adjustedBuildings'],1)
  self.assertNotEqual(buildings['features'][0]['geometry'],original['features'][0]['geometry'])
 def test_crowded_lot_shrinks_without_moving_into_neighbors(self):
  result,buildings,fitted,_=self.run_case([box(-5,1,5,11),box(-40,11,40,50),box(-40,1,-5,11),box(5,1,40,11)])
  target=next(f for f in buildings['features'] if f['properties']['objectid']==0)
  self.assertEqual(target['properties']['roadFit']['method'],'trimmed')
  self.assertLess(fitted[0].area,100)
  for i,p in enumerate(fitted):
   for q in fitted[i+1:]:self.assertLess(p.intersection(q).area,1e-6)
 def test_centerline_under_building_does_not_cut_the_road(self):
  result,buildings,fitted,_=self.run_case([box(-4,-2,4,2)],4)
  self.assertEqual(len(buildings['features']),1);self.assertEqual(result['qa']['roadBuildingOverlapM2'],0)
 def test_manual_wall_roundtrip_after_move_and_ring_reordering(self):
  from scene_edits import remap_building_edits
  from shapely.geometry import Polygon
  lat,lon=37.62,127.02;sx,sy=scales(lat)
  def collection(points,offset):return {'features':[{'properties':{'objectid':1,'roadFit':{'offset':offset}},'geometry':mapping(transform(lambda x,y:(lon+x/sx,lat-y/sy),Polygon(points)))}]}
  old=collection([(0,10),(10,10),(10,20),(0,20)],[0,0]);new=collection([(10,25),(0,25),(0,15),(10,15)],[0,5]);edits={'1':{'frontEdge':0,'floors':7}}
  moved=remap_building_edits(edits,old,new,[lat,lon]);self.assertEqual(moved['1']['frontEdge'],2);self.assertEqual(moved['1']['floors'],7)
  self.assertEqual(remap_building_edits(moved,new,old,[lat,lon]),edits)
if __name__=='__main__':unittest.main()
