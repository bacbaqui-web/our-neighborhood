import sys,unittest,tempfile,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from shapely.geometry import LineString,mapping,shape,Point
from shapely.ops import unary_union
from junction_generation import plan_junctions,build,surface_positions

def road(points,grade,layer=0):
 w={1:4.2,2:6.4,3:13,4:19.5}[grade]
 return {'geometry':mapping(LineString(points)),'grade':grade,'width':w,'sidewalkEachSide':0 if grade==1 else 1.8,'properties':{'layer':layer,'class':'minor' if grade==1 else 'secondary'}}
def plan(rs):
 carriage=unary_union([shape(r['geometry']).buffer(r['width']/2,cap_style=2) for r in rs]);public=unary_union([shape(r['geometry']).buffer(r['width']/2+r['sidewalkEachSide'],cap_style=2) for r in rs]);return plan_junctions(rs,carriage,public.difference(carriage),lambda x,z:.03*x+.02*z)
class Junctions(unittest.TestCase):
 def test_all_mixed_pairs(self):
  for a in range(1,5):
   for b in range(a,5):
    p=plan([road([[-50,0],[50,0]],a),road([[0,0],[0,50]],b)])
    self.assertEqual(len(p['junctions']),1,(a,b));self.assertEqual(p['junctions'][0]['grades'],sorted(set([a,b])))
    self.assertEqual(p['qa']['roadSidewalkOverlapM2'],0)
    self.assertEqual(p['qa']['markOutsideRoadM2'],0)
    self.assertTrue(shape(p['road']).covers(Point(0,0)))
    if a==b==1:self.assertEqual(p['crossings'],[])
 def test_grade_separation(self):
  p=plan([road([[-50,0],[50,0]],4),road([[0,-50],[0,50]],2,1)])
  self.assertEqual(p['junctions'],[])
 def test_oblique_and_four_openings(self):
  p=plan([road([[-50,0],[50,0]],3),road([[-20,-50],[20,50]],2)])
  self.assertEqual(len(p['junctions']),1)
  self.assertGreaterEqual(len(p['crossings']),2)
  for c in p['crossings']:
   self.assertEqual(len(c['landings']),2)
   for l in c['landings']:self.assertGreater(shape(p['sidewalk']).intersection(shape(l['footprint'])).area,0)
 def test_sloped_output_and_complete_crossings(self):
  rs=[road([[-50,0],[50,0]],3),road([[0,-50],[0,50]],2)]
  r=unary_union([shape(x['geometry']).buffer(x['width']/2,cap_style=2) for x in rs]);p=unary_union([shape(x['geometry']).buffer(x['width']/2+x['sidewalkEachSide'],cap_style=2) for x in rs])
  class Terrain:
   def mesh_height(self,x,z):return .03*x+.02*z
  terrain=Terrain()
  with tempfile.TemporaryDirectory() as f:
   root=Path(f)
   def write(n,x):(root/n).write_text(json.dumps(x))
   write('location.json',{'origin':[37.6,127]});write('manifest.json',{});write('road-reservation.json',{'surfaces':{'carriageway':mapping(r),'shared':mapping(r.difference(r)),'sidewalk':mapping(p.difference(r))}})
   write('road-context.json',{'positions':{'asphalt':surface_positions(r,terrain.mesh_height,.026),'sidewalk':surface_positions(p.difference(r),terrain.mesh_height,.026)}})
   build(root,rs,terrain);out=json.loads((root/'road-context.json').read_text());jp=json.loads((root/'junction-plan.json').read_text())
   self.assertEqual(len(jp['crossings']),4);self.assertEqual(len(out['junctions']['assets']),8)
   for c in jp['crossings']:self.assertLess(shape(c['footprint']).difference(shape(jp['zone'])).area,1e-6)
   values=out['junctions']['geometry']['ramp'];self.assertTrue(all(math.isfinite(v) for v in values))
   offsets=[values[i+1]-terrain.mesh_height(values[i],values[i+2]) for i in range(0,len(values),3)]
   self.assertAlmostEqual(min(offsets),.035);self.assertAlmostEqual(max(offsets),.185)
   for a in out['junctions']['assets']:self.assertAlmostEqual(a['position'][1]-terrain.mesh_height(a['position'][0],a['position'][2]),.185)
 def test_shallow_crossing_is_skipped_whole(self):
  p=plan([road([[-80,0],[80,0]],4),road([[0,0],[70,30]],2)])
  for c in p['crossings']:self.assertLess(shape(c['footprint']).difference(shape(p['zone'])).area,1e-6)
 def test_preserve_divider_and_transit_access(self):
  rs=[road([[-50,0],[50,0]],4),road([[0,0],[0,50]],2)]
  r=unary_union([shape(x['geometry']).buffer(x['width']/2,cap_style=2) for x in rs]);p=unary_union([shape(x['geometry']).buffer(x['width']/2+x['sidewalkEachSide'],cap_style=2) for x in rs]);wall=LineString([[-40,0],[40,0]]).buffer(.2)
  result=plan_junctions(rs,r,p.difference(r),lambda x,z:0,barriers=wall)
  for c in result['crossings']:self.assertFalse(shape(c['footprint']).intersects(wall))
  result=plan_junctions(rs,r,p.difference(r),lambda x,z:0,protected=Point(0,10).buffer(3))
  self.assertEqual(result['junctions'],[]);self.assertEqual(result['crossings'],[]);self.assertEqual(result['assets'],[])
 def test_short_arm_skips_crossing(self):
  p=plan([road([[-50,0],[50,0]],3),road([[0,0],[0,8]],2)])
  self.assertTrue(any('short' in s['reason'] for s in p['skipped']))
if __name__=='__main__':unittest.main()
