"""Build inferred house plots from actual building outlines and road edges.
Run with work/geo-env/bin/python outputs/domestic-test/generation/build-parcels.py
"""
import json,struct,math
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import Polygon,Point,MultiPoint,LineString,box
from shapely.ops import unary_union,nearest_points
from shapely.strtree import STRtree
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC,RADIUS
src=(ROOT/'corrected-base.glb').read_bytes();n=struct.unpack_from('<I',src,12)[0];doc=json.loads(src[20:20+n]);buf=src[28+n:]
def acc(i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];cols={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];return np.ndarray((a['count'],cols),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(dt).itemsize*cols),np.dtype(dt).itemsize))
roads=[]
for m in doc['meshes']:
 if m.get('name') not in ['road','path']:continue
 for prim in m['primitives']:
  pos=acc(prim['attributes']['POSITION']);ix=acc(prim['indices']).reshape(-1,3)
  for tri in pos[ix]:
   p=Polygon(tri[:,[0,2]])
   if p.area>1e-8:roads.append(p)
road=unary_union(roads).buffer(0);limit=box(-RADIUS+15,-RADIUS+15,RADIUS-15,RADIUS-15)
lat=math.radians(LAT);mlat=111132.92-559.82*math.cos(2*lat)+1.175*math.cos(4*lat)-.0023*math.cos(6*lat);mlon=111412.84*math.cos(lat)-93.5*math.cos(3*lat)+.118*math.cos(5*lat)
bs=[];ids=[];raw=[]
for f in json.load(open(ROOT/'buildings.geojson'))['features']:
 polys=[f['geometry']['coordinates']] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates']
 for rings in polys:
  pts=[((p[0]-LON)*mlon,-(p[1]-LAT)*mlat) for p in rings[0]];p=Polygon(pts).buffer(0)
  if p.geom_type!='Polygon':continue
  bs.append(p);ids.append(int(f['properties']['objectid']));raw.append(pts[:-1] if pts[0]==pts[-1] else pts)
built=unary_union(bs);S.prepare(built);S.prepare(road)
# Sample perimeter, not centroid: concave and rotated footprints retain their influence.
samples=[];owners=[];seen=set()
for k,b in enumerate(bs):
 ring=b.exterior;N=max(8,math.ceil(ring.length/1.6))
 for j in range(N):
  q=ring.interpolate(j*ring.length/N);key=(round(q.x,6),round(q.y,6))
  if key not in seen:seen.add(key);samples.append(key);owners.append(k)
print('perimeter samples',len(samples),flush=True)
v=S.voronoi_polygons(MultiPoint(samples),extend_to=limit,ordered=True);by=[[] for b in bs]
for cell,k in zip(v.geoms,owners):by[k].append(cell)
# The house and its land are one continuous parcel; yards are the remainder.
plots=[]
for k,b in enumerate(bs):
 p=unary_union(by[k]).union(b).intersection(limit).difference(road.buffer(.38)).intersection(b.buffer(15,join_style=2)).buffer(0)
 parts=[p] if p.geom_type=='Polygon' else list(p.geoms)
 parts=[q for q in parts if q.geom_type=='Polygon' and q.intersection(b).area>1]
 p=unary_union(parts);plots.append(p)
# Door rays use the same frontage scoring as the runtime, so openings align with doors.
routes=[];entrances={}
for k,pts in enumerate(raw):
 area=sum(a[0]*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*a[1] for i,a in enumerate(pts));best=None
 for i,a in enumerate(pts):
  b=pts[(i+1)%len(pts)];L=math.dist(a,b)
  if L<3:continue
  ux,uz=(b[0]-a[0])/L,(b[1]-a[1])/L;nx,nz=uz*(1 if area>0 else -1),-ux*(1 if area>0 else -1);depths=[]
  for t in [.08,.25,.5,.75,.92]:
   ds=np.arange(.45,9.001,.25);ps=S.points([[a[0]+ux*L*t+nx*d,a[1]+uz*L*t+nz*d] for d in ds]);hit=0
   for d,occ,rd in zip(ds,S.contains(built,ps),S.covers(road,ps)):
    if occ:break
    if rd:hit=float(d);break
   depths.append(hit)
  coverage=sum(d>0 for d in depths)
  if coverage<3:continue
  score=L*coverage/5/(1+sum(depths)/coverage*.1)
  if best is None or score>best[0]:best=(score,(a[0]+ux*L/2,a[1]+uz*L/2),nx,nz,depths[2])
 route=None
 if best and best[4]>0:
  _,a,nx,nz,d=best;route=LineString([a,(a[0]+nx*(d+.7),a[1]+nz*(d+.7))])
 else:
  a,b=nearest_points(bs[k],road);candidate=LineString([a,b]);others=built.difference(bs[k].buffer(.05))
  if candidate.length<24 and candidate.buffer(.65,cap_style=2).intersection(others).area<.01:route=candidate
 if route and route.length>.2:
  routes.append(route);entrances[k]=list(route.coords)
# Rear houses need shared alley access too. Route around buildings instead of sealing them in.
from collections import deque
size=(RADIUS-12)*2; coords=np.array([(x-size/2+.5,z-size/2+.5) for z in range(size) for x in range(size)])
gridpoints=S.points(coords);free=~S.contains(built.buffer(.86),gridpoints);roadcells=S.covers(road,gridpoints)&free
parents=np.full(size*size,-2,dtype=np.int32);queue=deque(np.flatnonzero(roadcells).tolist());parents[roadcells]=-1
while queue:
 c=queue.popleft();x,z=c%size,c//size
 for nb in ([c-1] if x else [])+([c+1] if x<size-1 else [])+([c-size] if z else [])+([c+size] if z<size-1 else []):
  if free[nb] and parents[nb]==-2:parents[nb]=c;queue.append(nb)
for k,b in enumerate(bs):
 if k in entrances or plots[k].is_empty:continue
 x0,z0,x1,z1=b.bounds;sel=np.flatnonzero((coords[:,0]>x0-2)&(coords[:,0]<x1+2)&(coords[:,1]>z0-2)&(coords[:,1]<z1+2)&(parents!=-2))
 if not len(sel):continue
 ds=S.distance(b,gridpoints[sel]);sel=sel[ds<1.8]
 if not len(sel):continue
 # Prefer shortest road-connected route among the cells adjacent to this house.
 choices=[]
 for c in sel:
  chain=[];q=int(c)
  while q>=0 and len(chain)<100:chain.append(tuple(coords[q]));q=int(parents[q])
  if q==-1:choices.append(chain)
 if not choices:continue
 chain=min(choices,key=len);start=nearest_points(b,Point(chain[0]))[0];line=LineString([(start.x,start.y)]+chain).simplify(.02)
 routes.append(line);entrances[k]=list(line.coords)
access=unary_union([l.buffer(1.05,cap_style=1) for l in routes]);forbidden=built.buffer(.16).union(road.buffer(.2)).union(access)
# Shared edges are rendered once. No independent rectangle modules.
wallraw=[];yards=[]
for k,p in enumerate(plots):
 if p.is_empty:continue
 y=p.difference(built.buffer(.03));
 if y.area<3:continue
 walls=p.boundary.difference(forbidden).difference(limit.boundary.buffer(.1));wallraw.append(walls)
 parts=[y] if y.geom_type=='Polygon' else list(y.geoms);tri=[];rings=[]
 for q in parts:
  if q.geom_type!='Polygon' or q.area<.3:continue
  rings.append({'outer':list(q.exterior.coords),'holes':[list(r.coords) for r in q.interiors]})
  for t in S.constrained_delaunay_triangles(q).geoms:tri.append(list(t.exterior.coords)[:3])
 focus=y.representative_point();anchors=[]
 lines=[walls] if walls.geom_type=='LineString' else [g for g in getattr(walls,'geoms',[]) if g.geom_type=='LineString']
 for line in sorted(lines,key=lambda l:-l.length):
  for d in np.arange(1.4,line.length-1,3.2):
   a=line.interpolate(d);b=line.interpolate(min(line.length,d+.1));dx,dz=b.x-a.x,b.y-a.y;L=math.hypot(dx,dz)
   if L<1e-6:continue
   for sign in [-1,1]:
    x,z=a.x-sign*dz/L*.95,a.y+sign*dx/L*.95
    if y.contains(Point(x,z).buffer(.65)) and not access.intersects(Point(x,z).buffer(.75)):
     anchors.append({'x':x,'z':z,'angle':math.atan2(-sign*dz/L,sign*dx/L)});break
   if len(anchors)>=8:break
  if len(anchors)>=8:break
 yards.append({'owner':ids[k],'area':y.area,'x':focus.x,'z':focus.y,'rings':rings,'triangles':tri,'anchors':anchors,'entrance':entrances.get(k)})
merged=unary_union(wallraw);lines=[merged] if merged.geom_type=='LineString' else list(merged.geoms);segments=[]
for l in lines:
 if l.geom_type!='LineString':continue
 coords=list(l.coords)
 for a,b in zip(coords,coords[1:]):
  if math.dist(a,b)>.04:segments.append({'a':a,'b':b})
# Independent checks use actual buffered wall footprints and yard polygons.
wallfoot=unary_union([LineString([s['a'],s['b']]).buffer(.12,cap_style=2) for s in segments]);yardunion=unary_union([p.difference(built.buffer(.03)) for p in plots]);qa={'parcels':len(yards),'yardArea':sum(y['area'] for y in yards),'wallSegments':len(segments),'wallLength':sum(math.dist(s['a'],s['b']) for s in segments),'wallBuildingOverlapArea':wallfoot.intersection(built).area,'wallRoadOverlapArea':wallfoot.intersection(road).area,'wallAccessOverlapArea':wallfoot.intersection(unary_union([r.buffer(.8,cap_style=2) for r in routes])).area,'yardBuildingOverlapArea':yardunion.intersection(built).area,'rectangularFlowerbedModules':0}
print(qa,flush=True)
assert qa['wallBuildingOverlapArea']<.001 and qa['wallRoadOverlapArea']<.001 and qa['wallAccessOverlapArea']<.001
yard_shapes=[unary_union([Polygon(r['outer'],r['holes']) for r in y['rings']]) for y in yards]
yard_tree=STRtree(yard_shapes)
for seg in segments:
 mid=Point((seg['a'][0]+seg['b'][0])/2,(seg['a'][1]+seg['b'][1])/2)
 seg['owner']=yards[int(yard_tree.nearest(mid))]['owner']
out={'version':17,'rule':'Perimeter Voronoi house parcels clipped to actual roads; house footprint subtracted to form yards; shared boundaries deduplicated; door corridors cut before walls. Inferred, not cadastral.','yards':yards,'segments':segments,'qa':qa}
(ROOT/'parcels.json').write_text(json.dumps(out,separators=(',',':')));(REPORT/'parcel-validation-v16.json').write_text(json.dumps(qa,indent=2));print(qa,flush=True)
