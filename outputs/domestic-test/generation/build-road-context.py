"""Fit imported roads to domestic footprints and classify connected street routes.
Narrow concrete is an inferred art rule, not a surveyed surface classification.
"""
import json, math, struct
import numpy as np
from pathlib import Path
import shapely as S
from shapely.geometry import Polygon, LineString, Point, shape
from shapely.ops import unary_union
from site_geometry import Site
from road_wear import build_wear
from road_network import build_road_network
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC
site=Site(ROOT,ORIGIN)
# Match the visible wall plinth; keep the true building footprints unchanged.
blocked=site.built.buffer(.065,join_style=2)
free=site.road.difference(blocked).buffer(0)
def polygons(g):
 if g.geom_type=='Polygon':return [g]
 return [p for child in getattr(g,'geoms',[]) for p in polygons(child)]
def triangles(g):
 return [[list(p) for p in t.exterior.coords[:-1]] for poly in polygons(g) if poly.area>1e-8 for t in S.get_parts(S.constrained_delaunay_triangles(poly)) if t.area>1e-8]
# Infer connected routes first; classify each whole street, not width blobs.
print('Tracing connected street network…',flush=True)
regions,network=build_road_network(free)
if (ROOT/'road-reservation.json').exists():
 # A connected alley remains asphalt regardless of local width.
 reservation=json.loads((ROOT/'road-reservation.json').read_text())
 surfaces=reservation.get('surfaces')
 if surfaces:
  sidewalk=shape(surfaces['sidewalk']).intersection(free)
  pedestrian=shape(surfaces['pedestrian']).intersection(free).difference(sidewalk)
  regions={'asphalt':free.difference(sidewalk.union(pedestrian)),'concrete':pedestrian,'pavers':Polygon(),'sidewalk':sidewalk}
 else:regions={'asphalt':free,'concrete':Polygon(),'pavers':Polygon()}
 network['qa']['surfacePolicy']='four-street-types'
 network['streetTypes']=reservation['entries']

wide=regions['asphalt'];concrete=regions['concrete'];narrow=free.difference(wide)
# Preserve every source terrain triangle plane; retriangulating the whole road
# created folds where the imported ground and road elevations differ.
raw=(ROOT/'corrected-base.glb').read_bytes();size=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+size]);buffer=raw[28+size:]
def acc(i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];typ={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
 return np.ndarray((a['count'],c),dtype=typ,buffer=buffer,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(typ).itemsize*c),np.dtype(typ).itemsize))
vertices={k:[] for k in regions};normals={k:[] for k in regions};source_triangles=[]
for region in regions.values():S.prepare(region)
for mesh in doc['meshes']:
 if mesh.get('name') not in ['road','path']:continue
 for primitive in mesh['primitives']:
  source=acc(primitive['attributes']['POSITION']);normalSource=acc(primitive['attributes']['NORMAL']);ix=acc(primitive['indices']).reshape(-1,3)
  for ids in ix:
   vs=source[ids];ns=normalSource[ids]
   poly=Polygon(vs[:,[0,2]])
   if poly.area<1e-8:continue
   source_triangles.append(vs.copy())
   a,b,c=vs;den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2])
   def y_at(x,z):
    u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
    return float(u*a[1]+v*b[1]+(1-u-v)*c[1])+.008
   for kind,region in regions.items():
    if not region.intersects(poly):continue
    ts=[list(poly.exterior.coords[:-1])] if region.covers(poly) else triangles(poly.intersection(region))
    for t in ts:
     # Stable upward orientation, retaining the imported local slope.
     if (t[1][0]-t[0][0])*(t[2][1]-t[0][1])-(t[1][1]-t[0][1])*(t[2][0]-t[0][0])>0:t=[t[0],t[2],t[1]]
     for x,z in t:
      vertices[kind].extend([round(x,6),round(y_at(x,z),6),round(z,6)])
      u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
      normal=u*ns[0]+v*ns[1]+(1-u-v)*ns[2];normal/=np.linalg.norm(normal)
      normals[kind].extend([round(float(n),6) for n in normal])
plan=json.load(open(ROOT/'streetscape.json'))
paint=unary_union([Polygon(t) for t in plan['paintTriangles']]).intersection(wide.buffer(.18)).difference(blocked.buffer(.12))
if (ROOT/'road-reservation.json').exists():paint=Polygon()
plan['paintTriangles']=triangles(paint)
plan['apronTriangles']=triangles(unary_union([Polygon(t) for t in plan['apronTriangles']]).difference(blocked).difference(narrow))
# Remove freestanding curb fragments on constrained fronts; retain real masonry boundaries.
original_runs=len(plan['wallRuns']);runs=[];curbBlocked=blocked.buffer(.13);wideEdge=wide.buffer(.65)
for run in plan['wallRuns']:
 if run['style']!='villa-curb':runs.append(run);continue
 for a,b in zip(run['points'],run['points'][1:]):
  line=LineString([a,b]);allowed=line.difference(curbBlocked).intersection(wideEdge)
  for part in S.get_parts(allowed):
   if part.geom_type=='LineString' and part.length>.5:runs.append({**run,'points':[list(p) for p in part.coords]})
plan['wallRuns']=runs
drainBlocked=blocked.buffer(.32)
plan['drains']=[d for d in plan['drains'] if not drainBlocked.contains(Point(d['x'],d['z']))]
# All finish marks are generated together and share the exact imported slope.
seams=[]
print('Building aged concrete, block paving and wall-foot weeds…',flush=True)
wear=build_wear(regions,source_triangles,site.built)
qa={'originalBuildingOverlapM2':round(site.road.intersection(site.built).area,3),'remainingBuildingOverlapM2':round(free.intersection(site.built).area,8),'surfaceAreasM2':{k:round(g.area,2) for k,g in regions.items()},'surfaceOverlapM2':round(sum(g.area for g in regions.values())-free.area,8),'paintBuildingOverlapM2':round(paint.intersection(blocked).area,8),'concretePatches':len(polygons(concrete)),'concreteSeams':wear['qa'].get('pourJoints',0),'wear':wear['qa'],'network':network['qa'],'vertices':{k:len(v)//3 for k,v in vertices.items()}}
assert qa['remainingBuildingOverlapM2']==0 and abs(qa['surfaceOverlapM2'])<.0001 and qa['paintBuildingOverlapM2']==0
out={'version':62,'roadPriority':(ROOT/'road-reservation.json').exists(),'rule':'footprints first; connected centerline graph; one material per continuous street stroke; through streets own junctions; width is measured over a whole path; worn concrete and pavers on alleys','source':'OSM road geometry; Korean alley surface rules inferred, not surveyed','positions':vertices,'normals':normals,'seams':seams,'wear':wear,'network':network,'qa':qa}
# Publish complete files atomically so a browser cannot read a half-written JSON.
import os
for name,body in [('road-context.json',out),('streetscape-context.json',plan)]:
 temp=ROOT/(name+'.tmp');temp.write_text(json.dumps(body,separators=(',',':')));os.replace(temp,ROOT/name)
(REPORT/'alley-v62/road-network.json').write_text(json.dumps(network,separators=(',',':')))
from shapely.geometry import mapping
(REPORT/'alley-v62/regions.json').write_text(json.dumps({k:mapping(g) for k,g in regions.items()},separators=(',',':')))
(REPORT/'alley-v62/road-qa.json').write_text(json.dumps(qa,indent=2));print(json.dumps(qa,indent=2))
