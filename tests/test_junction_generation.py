import sys,unittest,tempfile,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from shapely.geometry import LineString,mapping,shape,Point,Polygon,box
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
 def test_width_transition_and_grade_based_corners(self):
  from scene_edits import classify_roads
  from road_geometry import pavement
  rs=[road([[-60,0],[0,0]],3),road([[0,0],[60,0]],4)]
  classify_roads(rs,{})
  classify_roads(rs,{rs[0]['editId']:{'grade':3},rs[1]['editId']:{'grade':4}})
  r=unary_union([pavement(x) for x in rs]);public=unary_union([pavement(x,x['sidewalkEachSide'],True) for x in rs])
  p=plan_junctions(rs,r,public.difference(r),lambda x,z:0)
  self.assertEqual([n['kind'] for n in p['junctions']],['width-transition'])
  self.assertEqual(p['crossings'],[])
  self.assertTrue(shape(p['road']).covers(LineString([[-40,0],[40,0]])))
  self.assertLess(shape(p['marks']['white']).difference(shape(p['road'])).area,1e-7)
  small=plan([road([[-50,0],[50,0]],1),road([[0,0],[0,50]],1)])
  large=plan([road([[-50,0],[50,0]],4),road([[0,0],[0,50]],4)])
  self.assertLess(small['junctions'][0]['cornerRadius'],large['junctions'][0]['cornerRadius'])
 def test_busway_is_not_a_shared_alley(self):
  rs=[road([[-50,0],[50,0]],4),road([[0,0],[0,50]],1)]
  rs[1]['properties'].update({'class':'busway','access':'no','foot':'no'})
  self.assertEqual(plan(rs)['junctions'],[])
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
   (root/'arterial').mkdir();blue=LineString([[-45,.8],[45,.8]]).buffer(.06,cap_style=2)
   write('arterial/plan.json',{'decals':{'blue':surface_positions(blue,terrain.mesh_height,.04)},'qa':{}})
   build(root,rs,terrain);out=json.loads((root/'road-context.json').read_text());jp=json.loads((root/'junction-plan.json').read_text())
   preserved=json.loads((root/'arterial/plan.json').read_text())['decals']['blue']
   restored=unary_union([Polygon([(preserved[i+j],preserved[i+j+2]) for j in (0,3,6)]) for i in range(0,len(preserved),9)])
   clearance=unary_union([shape(c['footprint']) for c in jp['crossings']])
   self.assertLess(blue.difference(clearance).difference(restored).area,1e-6)
   self.assertEqual(len(jp['crossings']),4);self.assertEqual(len(out['junctions']['assets']),8)
   for c in jp['crossings']:self.assertLess(shape(c['footprint']).difference(shape(jp['zone'])).area,1e-6)
   values=out['junctions']['geometry']['ramp'];self.assertTrue(all(math.isfinite(v) for v in values))
   offsets=[values[i+1]-terrain.mesh_height(values[i],values[i+2]) for i in range(0,len(values),3)]
   self.assertAlmostEqual(min(offsets),.035);self.assertAlmostEqual(max(offsets),.185)
   for a in out['junctions']['assets']:self.assertAlmostEqual(a['position'][1]-terrain.mesh_height(a['position'][0],a['position'][2]),.185)
 def test_patch_boundary_preserves_old_height_hinge(self):
  from junction_generation import parts
  rs=[road([[-50,0],[50,0]],3),road([[0,-50],[0,50]],2)]
  r=unary_union([shape(x['geometry']).buffer(x['width']/2,cap_style=2) for x in rs]);public=unary_union([shape(x['geometry']).buffer(x['width']/2+x['sidewalkEachSide'],cap_style=2) for x in rs])
  class Terrain:
   def mesh_height(self,x,z):return 0
  def original(g):return sum([surface_positions(g.intersection(b),lambda x,z:.02*abs(x-2.23),.026) for b in [box(-100,-100,2.23,100),box(2.23,-100,100,100)]],[])
  with tempfile.TemporaryDirectory() as f:
   root=Path(f)
   def write(n,x):(root/n).write_text(json.dumps(x))
   write('location.json',{'origin':[37.6,127]});write('manifest.json',{})
   write('road-reservation.json',{'surfaces':{'carriageway':mapping(r),'shared':mapping(Polygon()),'sidewalk':mapping(public.difference(r))}})
   write('road-context.json',{'positions':{'asphalt':original(r),'sidewalk':original(public.difference(r))}})
   build(root,rs,Terrain());out=json.loads((root/'road-context.json').read_text());plan=json.loads((root/'junction-plan.json').read_text())
   points=parts(shape(plan['zone']).boundary.intersection(LineString([[2.23,-50],[2.23,50]])),'Point')
   self.assertTrue(points)
   for point in points:
    ys=[]
    for values in out['positions'].values():
     for i in range(0,len(values),9):
      a,b,c=[values[i+j:i+j+3] for j in (0,3,6)];poly=Polygon([(p[0],p[2]) for p in [a,b,c]])
      if poly.area<1e-9 or not poly.buffer(1e-7).covers(point):continue
      x,z=point.x,point.y;den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;ys.append(u*a[1]+v*b[1]+(1-u-v)*c[1])
    self.assertTrue(ys);self.assertLess(max(ys)-min(ys),1e-6)
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
