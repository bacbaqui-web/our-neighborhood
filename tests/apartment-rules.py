"""Geometry checks for building-first ground generation (Python + shapely)."""
import json,math,unittest
from pathlib import Path
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'outputs/domestic-test/apartments/garden'
class Rules(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.d=json.loads((D/'rule-plan.json').read_text());d=cls.d
  cls.s={k:unary_union([Polygon(r['outer'],r['holes']).buffer(0) for r in rows]) for k,rows in d['surfaces'].items()}
  geo=json.loads((D/'buildings.geojson').read_text());o=d['origin'];cls.buildings=unary_union([Polygon([((p[0]-o[0])*111320*math.cos(math.radians(37.618)),-(p[1]-o[1])*111133) for p in f['geometry']['coordinates'][0]]) for f in geo['features']])
 def test_generated_not_traced(self):
  self.assertEqual(self.d['qa']['inputRoadsUsed'],0);self.assertEqual(self.d['qa']['inputParkingRowsUsed'],0);self.assertEqual(self.d['qa']['roadComponents'],1)
 def test_ground_order(self):
  b=self.buildings;s=self.s
  self.assertLess(s['road'].intersection(b.buffer(4.15,join_style=2)).area,.5)
  self.assertLess(s['walk'].intersection(b.buffer(1.7,join_style=2)).difference(unary_union([LineString([e['point'],e['end']]).buffer(1.2) for e in self.d['entries']])).area,.5)
  self.assertLess(s['walk'].intersection(s['road']).area,.5)
 def test_every_entrance(self):
  self.assertEqual(len(self.d['entries']),28);self.assertEqual(len({e['owner'] for e in self.d['entries']}),28)
  for e in self.d['entries']:
   line=LineString([e['point'],e['end']]);self.assertLess(line.difference(self.s['walk'].buffer(.02)).length,.05)
 def test_parking_access_and_clearance(self):
  ps=[Polygon(p['footprint']) for p in self.d['parking']]
  for i,p in enumerate(ps):
   self.assertLess(p.intersection(self.buildings.union(self.s['walk']).union(self.s['road'])).area,.02)
   self.assertLess(p.distance(self.s['road']),.15)
   for q in ps[i+1:]:self.assertLess(p.intersection(q).area,.01)
 def test_facilities(self):
  self.assertEqual(set(f['kind'] for f in self.d['facilities']),{'bike','guard','ramp','recycling','pergola','play'})
  for f in self.d['facilities']:
   p=Polygon(f['footprint']);self.assertLess(p.intersection(self.buildings).area,.01);self.assertLess(p.intersection(self.s['parking']).area,.01)
  for f in self.d['facilities']:
   if f['kind']=='ramp':self.assertGreaterEqual(f['accessWidth'],5.4)
 def test_trees_clear_vehicle_and_walk_space(self):
  blocked=self.s['road'].union(self.s['walk']).union(self.s['parking']).union(self.buildings)
  for t in self.d['trees']:self.assertFalse(blocked.contains(Point(t['root'][0],t['root'][2])))
if __name__=='__main__':unittest.main()
