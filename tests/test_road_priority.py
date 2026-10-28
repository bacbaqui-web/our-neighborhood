import unittest,tempfile,sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from road_priority import reserve,scales
from shapely.geometry import box,mapping,shape,LineString
from shapely.ops import transform,unary_union
class RoadPriority(unittest.TestCase):
 def test_crossing_roads_survive_buildings_and_sidewalks_remain_clear(self):
  lat,lon=37.62,127.02;sx,sy=scales(lat)
  building=lambda i,g:{'type':'Feature','properties':{'objectid':i,'gro_flo_co':3},'geometry':mapping(transform(lambda x,y:(lon+x/sx,lat-y/sy),g))}
  roads=[{'geometry':mapping(LineString([(-40,0),(40,0)])),'width':11,'properties':{'class':'secondary'}},{'geometry':mapping(LineString([(0,-40),(0,40)])),'width':5.2,'properties':{'class':'minor'}}]
  buildings={'type':'FeatureCollection','features':[building(1,box(-20,-16,-10,-3)),building(2,box(-1,-2,1,2)),building(3,box(15,15,25,25))]}
  with tempfile.TemporaryDirectory() as temp:
   result=reserve(temp,{'origin':[lat,lon],'sizeMetres':100},roads,buildings)
   road=shape(result['road']);public=shape(result['majorPublic'])
   for r in roads:self.assertTrue(road.buffer(.0001).covers(shape(r['geometry'])))
   self.assertAlmostEqual(public.bounds[3],9.75)
   self.assertEqual(result['qa']['adjustedBuildings'],1)
   self.assertEqual(result['qa']['omittedBuildings'],1)
   self.assertEqual(result['qa']['roadBuildingOverlapM2'],0)
   self.assertEqual(result['qa']['sidewalkBuildingOverlapM2'],0)
   self.assertEqual(len(json.loads((Path(temp)/'buildings-source.geojson').read_text())['features']),3)
   self.assertEqual(len(buildings['features']),2)
   self.assertEqual(buildings['features'][1]['properties']['objectid'],3)
 def test_road_segments_do_not_change_width(self):
  with tempfile.TemporaryDirectory() as temp:
   roads=[{'geometry':mapping(LineString([(a,0),(b,0)])),'width':11,'properties':{'class':'secondary'}} for a,b in [(-40,0),(0,40)]]
   result=reserve(temp,{'origin':[37.62,127.02],'sizeMetres':100},roads,{'features':[]})
   self.assertEqual([e['width'] for e in result['entries']],[13.5,13.5])
   self.assertEqual(len(list(shape(result['road']).geoms)) if shape(result['road']).geom_type=='MultiPolygon' else 1,1)
if __name__=='__main__':unittest.main()
