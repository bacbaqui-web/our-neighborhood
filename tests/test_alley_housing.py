import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from shapely.geometry import Polygon,LineString,mapping
from shapely.affinity import rotate
from scene_edits import classify_roads,apply_building_rules

class AlleyHousing(unittest.TestCase):
 def classify(self,p,manual=None,grade=1):
  roads=[{'properties':{'class':'minor'},'geometry':mapping(LineString([(-80,0),(80,0)]))}]
  classify_roads(roads,{})
  if grade!=1:classify_roads(roads,{roads[0]['editId']:{'grade':grade}})
  f={'properties':{'objectid':1,'gro_flo_co':1,'floorsEstimated':True},'geometry':mapping(p)}
  apply_building_rules({'features':[f]},roads,{'1':manual} if manual else {},local=True)
  return f['properties']
 def test_tilted_house_is_red_brick_two_storey(self):
  p=self.classify(rotate(Polygon([(0,7),(10,7),(10,17),(0,17)]),12))
  self.assertEqual(p['streetProfile'].get('housingType'),'detached')
  self.assertEqual(p['gro_flo_co'],2)
  self.assertEqual(p['streetProfile']['styleIndex'],0)
 def test_rectangle_is_piloti(self):
  self.assertEqual(self.classify(Polygon([(0,7),(10,7),(10,17),(0,17)]))['streetProfile'].get('housingType'),'piloti')
 def test_recess_is_old_villa(self):
  p=self.classify(Polygon([(0,7),(10,7),(10,17),(4,17),(4,13),(0,13)]))
  self.assertEqual(p['streetProfile'].get('housingType'),'old-villa')
  self.assertEqual(p['streetProfile']['era'],'old')
 def test_major_road_is_not_alley(self):
  self.assertIsNone(self.classify(Polygon([(0,10),(10,10),(10,20),(0,20)]),grade=2)['streetProfile'].get('housingType'))
 def test_known_apartment_is_not_turned_into_two_storey_house(self):
  roads=[{'properties':{'class':'minor'},'geometry':mapping(LineString([(-80,0),(80,0)]))}];classify_roads(roads,{})
  f={'properties':{'objectid':4,'gro_flo_co':15,'floorsEstimated':False,'bdtyp_cd':'02001'},'geometry':mapping(rotate(Polygon([(0,7),(10,7),(10,17),(0,17)]),12))}
  apply_building_rules({'features':[f]},roads,{},local=True)
  self.assertEqual(f['properties']['gro_flo_co'],15)
  self.assertIsNone(f['properties']['streetProfile'].get('housingType'))
 def test_manual_design_kept(self):
  p=self.classify(rotate(Polygon([(0,7),(10,7),(10,17),(0,17)]),12),{'floors':4,'styleIndex':3})
  self.assertEqual(p['gro_flo_co'],4);self.assertEqual(p['streetProfile']['styleIndex'],3)

class AlleyParcels(unittest.TestCase):
 def package(self,gap=3,tilted=False):
  from shapely.geometry import box
  first=rotate(box(0,7,10,17),12) if tilted else box(0,7,10,17)
  bs=[{'id':1,'building':mapping(first),'plot':mapping(box(-3,3,11.5,21)),'streetProfile':{'housingType':'detached' if tilted else 'old-villa','roadTangent':[1,0],'styleIndex':0,'frontStart':[0,7],'frontEnd':[10,7]}}]
  if not tilted:bs.append({'id':2,'building':mapping(box(10+gap,7,20+gap,17)),'plot':mapping(box(11.5,3,24,21)),'streetProfile':{'housingType':'old-villa','roadTangent':[1,0],'styleIndex':0,'frontStart':[10+gap,7],'frontEnd':[20+gap,7]}})
  return {'plots':{'buildings':bs,'road':mapping(box(-50,-3,50,3))},'piloti':{'plans':[]},'groundFloors':{'plans':[]},'infill':{'walls':[],'gaps':[],'zones':[],'plants':[],'bays':[],'poles':[],'entries':[],'accessPaths':[],'siteDetails':{'fences':[]}}}
 def test_detached_has_parallel_gate_wall_and_tree(self):
  import alley_housing
  self.assertTrue(hasattr(alley_housing,'decorate'))
  p=self.package(tilted=True);alley_housing.decorate(p)
  d=p['infill'];self.assertTrue(d['walls']);self.assertTrue(d['plants'])
  gates=[g for g in d['gaps'] if g.get('role')=='yard-gate'];self.assertEqual(len(gates),1)
  self.assertAlmostEqual(gates[0]['a'][1],gates[0]['b'][1]);self.assertTrue(all(w['height']==1.8 for w in d['walls']))
 def test_wide_gap_has_one_full_bay_and_closed_shutter(self):
  import alley_housing
  self.assertTrue(hasattr(alley_housing,'decorate'))
  p=self.package();alley_housing.decorate(p)
  shutters=[g for g in p['infill']['gaps'] if g['kind']=='shutter'];self.assertEqual(len(shutters),1)
  from shapely.geometry import shape
  self.assertAlmostEqual(shape(shutters[0]['garageFootprint']).area,2.6*5.2)
 def test_narrow_gap_is_barred_not_passage(self):
  import alley_housing
  self.assertTrue(hasattr(alley_housing,'decorate'))
  p=self.package(gap=1.2);alley_housing.decorate(p)
  closures=[g for g in p['infill']['gaps'] if g.get('role')=='private-gap'];self.assertEqual(len(closures),1);self.assertEqual(closures[0]['kind'],'gate')

 def test_setback_parcel_still_gets_road_facing_wall(self):
  from alley_housing import decorate
  from shapely.geometry import box
  p=self.package(tilted=True);p['plots']['buildings'][0]['plot']=mapping(box(-3,4,11.5,21))
  decorate(p)
  self.assertTrue(p['infill']['walls'])
  self.assertTrue(any(g.get('role')=='yard-gate' for g in p['infill']['gaps']))
 def test_garage_approach_is_not_blocked_by_new_front_wall(self):
  from alley_housing import decorate
  from shapely.geometry import shape
  p=self.package();decorate(p)
  bay=next(b for b in p['infill']['bays'] if b.get('enclosed'))
  approach=shape(bay['entrance'])
  overlap=sum(LineString([w['a'],w['b']]).intersection(approach).length for w in p['infill']['walls'])
  self.assertLess(overlap,.001)

if __name__=='__main__':unittest.main()
