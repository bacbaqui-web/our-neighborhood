"""Generate the shared roadview-derived parcel package for the main application."""
import json,os,runpy,sys
from pathlib import Path

def protect_public_surfaces(package,root):
 """The arterial overlay is finalized after parcel inference. Give it priority."""
 from shapely.geometry import Polygon,Point,LineString,shape,mapping
 from shapely.ops import unary_union
 path=Path(root)/'arterial/plan.json'
 plan=json.loads(path.read_text()) if path.exists() else {}
 public=unary_union([Polygon(r['outer'],r.get('holes',[])) for r in plan.get('publicRings',[])])
 context=json.loads((Path(root)/'road-context.json').read_text())
 if context.get('junctionExclusion'):public=public.union(shape(context['junctionExclusion']))
 if public.is_empty:return
 data=package['infill']; removed={}
 def footprint(p):
  if p.get('footprint'):return shape(p['footprint'])
  if p.get('a') and p.get('b'):return LineString([p['a'],p['b']]).buffer(.12)
  if p.get('point'):return Point(*p['point']).buffer(p.get('radius',.3))
  if 'x' in p and 'z' in p:return Point(p['x'],p['z']).buffer(.3)
  return None
 def clean(rows):
  return [p for p in rows if (g:=footprint(p)) is None or g.intersection(public).area<1e-6]
 for key in ['bays','roadBays','plants','walls','gaps']:
  if key in data:
   before=len(data[key]);data[key]=clean(data[key]);removed[key]=before-len(data[key])
 if 'poles' in data:
  kept=clean(data['poles'])
  ids={id(p) for p in kept}
  indices={i:j for j,i in enumerate(i for i,p in enumerate(data['poles']) if id(p) in ids)}
  removed['poles']=len(data['poles'])-len(kept)
  data['poles']=kept
  data['poleLinks']=[(indices[a],indices[b]) for a,b in data.get('poleLinks',[]) if a in indices and b in indices]
 for key in ['fences','gates','props','booths']:
  if key in data.get('siteDetails',{}):data['siteDetails'][key]=clean(data['siteDetails'][key])
 for z in data['zones']:z['geometry']=mapping(shape(z['geometry']).difference(public))
 for e in data.get('entries',[]):
  if e.get('connector'):e['connector']=mapping(shape(e['connector']).difference(public))
 data['vehicleApproaches']=[mapping(shape(g).difference(public)) for g in data.get('vehicleApproaches',[])]
 # Road-marking authority belongs to the arterial plan inside this surface.
 data['yellowLines']=[line for line in data.get('yellowLines',[]) if not LineString(line).intersects(public)]
 package['publicSurfaceQA']={'removed':removed,'source':'arterial/plan.json publicRings'}
 return public

def align_road_paint(package,root):
 from shapely.geometry import shape,mapping
 from shapely.ops import unary_union
 context=json.loads((Path(root)/'road-context.json').read_text())
 surfaces=context.get('surfaces',{})
 roads=unary_union([shape(surfaces[k]) for k in ('asphalt','arterial') if k in surfaces])
 if roads.is_empty:return surfaces
 # The test's flat road mask is not the rendered road mask. Preserve every road surface.
 road_area=unary_union([shape(g) for g in surfaces.values()])
 for z in package['infill']['zones']:
  z['geometry']=mapping(shape(z['geometry']).difference(road_area))
 for e in package['infill'].get('entries',[]):
  if e.get('connector'):e['connector']=mapping(shape(e['connector']).difference(road_area))
 package['infill']['vehicleApproaches']=[mapping(shape(g).difference(road_area)) for g in package['infill'].get('vehicleApproaches',[])]
 for p in package['infill'].get('siteDetails',{}).get('patches',[]):
  p['geometry']=mapping(shape(p['geometry']).difference(road_area))
 paint=roads.buffer(-.20,join_style=2).boundary
 if context.get('junctionExclusion'):paint=paint.difference(shape(context['junctionExclusion']))
 access=package['infill'].get('vehicleAccess')
 if access:paint=paint.difference(shape(access).buffer(.2))
 def lines(g):
  if g.geom_type in ('LineString','LinearRing'):return [list(g.coords)] if g.length>1 else []
  return [line for child in getattr(g,'geoms',[]) for line in lines(child)]
 package['infill']['yellowLines']=lines(paint)
 package['infill']['paintSource']='rendered asphalt boundary, inset 0.20m'
 return surfaces

def build(root,origin,radius,roads=None):
 root=Path(root).resolve(); out=root/'site-layout';out.mkdir(parents=True,exist_ok=True)
 source=Path(__file__).resolve().parent/'house-plots-test'
 if not json.loads((root/'buildings.geojson').read_text()).get('features'):
  (root/'site-layout.json').write_text(json.dumps({'version':1,'origin':origin,'radius':radius,'plots':{'buildings':[]},'reason':'no mapped buildings'}))
  return {'buildings':0}
 keys={'NEIGHBORHOOD_DATA':str(root),'NEIGHBORHOOD_ORIGIN':json.dumps(origin),'NEIGHBORHOOD_LAYOUT_OUTPUT':str(out),'NEIGHBORHOOD_LAYOUT_RADIUS':str(radius)}
 previous={k:os.environ.get(k) for k in keys}; oldpath=sys.path[:]
 try:
  os.environ.update(keys);sys.path.insert(0,str(source))
  # Each call must use this scene's output directory, including repeated local builds.
  for name in ['infill','piloti','ground_floors','enrich_sites','gaps','refine','street_rules','street_front','wall_connections']:
   sys.modules.pop(name,None)
  runpy.run_path(str(source/'build.py'),run_name='__main__')
  package={'version':1,'source':'roadview-derived; inferred parcels and uses','origin':origin,'radius':radius}
  for key,file in [('plots','infill-plots'),('frontages','frontages'),('piloti','piloti'),('groundFloors','ground-floors'),('infill','street-infill')]:
   package[key]=json.loads((out/(file+'.json')).read_text())
  from alley_housing import decorate
  decorate(package)
  surfaces=align_road_paint(package,root)
  public=protect_public_surfaces(package,root)
  if roads and surfaces:
   from grade1_poles import apply_alley_poles
   apply_alley_poles(package,roads,surfaces,public)
  (root/'site-layout.json').write_text(json.dumps(package,ensure_ascii=False,separators=(',',':')))
  return package['plots']['qa']
 finally:
  sys.path[:]=oldpath
  for k,v in previous.items():
   if v is None:os.environ.pop(k,None)
   else:os.environ[k]=v
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--root',default='outputs/domestic-test');p.add_argument('--radius',type=float,default=150);p.add_argument('--origin',default='37.626469,127.015677');a=p.parse_args()
 build(a.root,list(map(float,a.origin.split(','))),a.radius)
