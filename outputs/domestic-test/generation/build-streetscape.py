"""Roadview-informed Korean frontage: connected walls, gateway assemblies, asphalt seams.
Uses inferred parcel boundaries. It is not a cadastral or photographic reconstruction.
"""
import json,math,struct
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import Polygon,LineString,Point,MultiLineString,box
from shapely.ops import unary_union,nearest_points
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC,RADIUS
d=json.load(open(ROOT/'parcels.json'));ap=json.load(open(ROOT/'attached-structures.json'))
lat=math.radians(LAT);mlat=111132.92-559.82*math.cos(2*lat)+1.175*math.cos(4*lat)-.0023*math.cos(6*lat);mlon=111412.84*math.cos(lat)-93.5*math.cos(3*lat)+.118*math.cos(5*lat)
bs={}
for f in json.load(open(ROOT/'buildings.geojson'))['features']:
 rings=f['geometry']['coordinates'] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates'][0]
 bs[int(f['properties']['objectid'])]=Polygon([((p[0]-LON)*mlon,-(p[1]-LAT)*mlat) for p in rings[0]]).buffer(0)
built=unary_union(list(bs.values()));pedestrian=unary_union([LineString(y['entrance']).buffer(.86,cap_style=2) for y in d['yards'] if y['entrance']]);drive=unary_union([Polygon(p['polygon']) for p in ap['drives']]);architecture=unary_union([Polygon(p['footprint']) for p in ap['structures']]);limit=box(-RADIUS+15,-RADIUS+15,RADIUS-15,RADIUS-15)
b=(ROOT/'corrected-base.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);buf=b[28+n:]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];t={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];return np.ndarray((a['count'],c),dtype=t,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(t).itemsize*c),np.dtype(t).itemsize))
roads=[];terrain=[];cells={}
for m in g['meshes']:
 if m.get('name') not in ['ground','road','path']:continue
 for p in m['primitives']:
  pos=acc(p['attributes']['POSITION']);ix=acc(p['indices']).reshape(-1,3)
  for v in pos[ix]:
   shape=Polygon(v[:,[0,2]])
   if shape.area<1e-8:continue
   if m['name']!='ground':roads.append(shape)
   a,b,c=v;den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);idx=len(terrain);terrain.append((v,den))
   for x in range(math.floor(min(v[:,0])/5),math.floor(max(v[:,0])/5)+1):
    for z in range(math.floor(min(v[:,2])/5),math.floor(max(v[:,2])/5)+1):cells.setdefault((x,z),[]).append(idx)
road=unary_union(roads)
def height(x,z):
 ys=[]
 for idx in cells.get((math.floor(x/5),math.floor(z/5)),[]):
  v,den=terrain[idx];a,b,c=v;u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
  if u>=-1e-6 and w>=-1e-6 and 1-u-w>=-1e-6:ys.append(u*a[1]+w*b[1]+(1-u-w)*c[1])
 return float(max(ys)) if ys else 0
forbidden=built.union(road).union(pedestrian).union(drive)
fixtureForbidden=forbidden.union(architecture)
S.prepare(forbidden);S.prepare(fixtureForbidden)
homes={p['owner']:p for p in ap['households']}
styles=['brick-vent','dark-brick','stone-gate','rendered','green-fence','brick-rail']
def style(owner):return homes.get(owner,{}).get('wallStyle','rendered')
by={}
for e in ap['wallSegments']:
 cut=LineString([e['a'],e['b']]).difference(drive.buffer(.135))
 for line in ([cut] if cut.geom_type=='LineString' else getattr(cut,'geoms',[])):
  if line.geom_type=='LineString' and line.length>.025:by.setdefault(e['owner'],[]).append(line)
runs=[];retained=[];piers=[]
for owner,parts in by.items():
 merged=S.line_merge(unary_union(parts));lines=[merged] if merged.geom_type=='LineString' else list(merged.geoms)
 for line in lines:
  if line.length<.24:continue
  simple=line.simplify(.045,preserve_topology=True)
  if simple.buffer(.126,cap_style=2).intersects(forbidden):simple=line
  pts=list(simple.coords);roadFront=line.distance(road)<.9;home=homes.get(owner,{});policy=home.get('policy','courtyard');kind=style(owner);baseHeight=home.get('wallHeight',1.2)
  # A road-flush facade or an open parking apron is already a boundary. Do not enclose it.
  if policy in ['open-villa','street-flush']:
   if roadFront:kind='villa-curb';baseHeight=.12
   elif line.distance(bs[owner])<2.1 and line.length<9:
    kind='brick-rail' if style(owner) in ['dark-brick','brick-vent'] else 'green-fence';baseHeight=.60+home.get('railRatio',.3)
   else:continue
  options={'tint':home.get('wallTint',1),'railRatio':home.get('railRatio',.36),'capProfile':home.get('capProfile','straight') if kind in ['brick-vent','dark-brick'] else 'straight'}
  runs.append({'owner':owner,'points':pts,'style':kind,'front':roadFront,'height':baseHeight,'length':line.length,**options})
  retained.append(simple)
  if line.length>2.8 and baseHeight>1.05 and kind not in ['villa-curb','green-fence','brick-rail']:
   spacing=home.get('pierSpacing',5.6)
   for t in np.arange(.25,line.length-.1,spacing):
    q=line.interpolate(float(t));q2=line.interpolate(min(line.length,float(t)+.1));dx,dz=q2.x-q.x,q2.y-q.y;L=math.hypot(dx,dz)
    if L<1e-5:continue
    ux,uz=dx/L,dz/L;nx,nz=-uz,ux;fp=Polygon([(q.x+ux*x+nx*z,q.y+uz*x+nz*z) for x,z in [(-.18,-.18),(.18,-.18),(.18,.18),(-.18,.18)]])
    if fp.intersects(fixtureForbidden):continue
    piers.append({'owner':owner,'x':q.x,'z':q.y,'ux':ux,'uz':uz,'height':baseHeight+.08,'width':.30,'style':kind,'tint':options['tint'],'footprint':list(fp.exterior.coords)})
print('walls',len(runs),'piers',len(piers),flush=True)
wallShape=unary_union([l.buffer(.126,cap_style=2) for l in retained]);gates=[];gateReserved=[];connections=[]
for y in d['yards']:
 owner=y['owner'];kind=style(owner)
 if not y['entrance'] or homes[owner]['policy'] in ['open-villa','street-flush']:continue
 route=LineString(y['entrance']);yard=unary_union([Polygon(r['outer'],r['holes']) for r in y['rings']]);plot=yard.union(bs[owner]).buffer(.035);cross=route.intersection(plot.boundary)
 points=[cross] if cross.geom_type=='Point' else [p for p in getattr(cross,'geoms',[]) if p.geom_type=='Point']
 if not points:continue
 center=max(points,key=lambda p:route.project(p));distance=route.project(center)
 if center.distance(road)>1.4:continue
 nearwalls=[{'a':a,'b':b} for r in runs if r['owner']==owner and r['style']!='villa-curb' for a,b in zip(r['points'],r['points'][1:]) if LineString([a,b]).distance(center)<2]
 if not nearwalls:continue
 edge=min(nearwalls,key=lambda e:LineString([e['a'],e['b']]).distance(center));a,b=edge['a'],edge['b'];L=math.dist(a,b);ux,uz=(b[0]-a[0])/L,(b[1]-a[1])/L;nx,nz=-uz,ux
 if not yard.buffer(.05).contains(Point(center.x+nx*.3,center.y+nz*.3)):nx,nz=-nx,-nz
 def P(u,v):return(center.x+ux*u+nx*v,center.y+uz*u+nz*v)
 # Posts stay outside the already reserved passage. Open leaves fold into the plot.
 width=2.14;fps=[];pieces=[]
 for side in [-1,1]:
  u=side*(width/2+.17);post=Polygon([P(u+x,z) for x,z in [(-.17,-.15),(.17,-.15),(.17,.15),(-.17,.15)]])
  leaf=Polygon([P(side*(width/2-.025)+x,z) for x,z in [(-.035,.04),(.035,.04),(.035,.92),(-.035,.92)]])
  fps.extend([post,leaf]);pieces.append({'u':u,'side':side,'post':list(post.exterior.coords),'leaf':list(leaf.exterior.coords)})
 solid=unary_union(fps)
 if solid.intersects(fixtureForbidden):continue
 if any(solid.intersects(p) for p in gateReserved):continue
 if not yard.union(wallShape).buffer(.25).covers(solid):continue
 # Join post backs to the cut wall ends so gates never stand alone in a clearing.
 joins=[]
 for side in [-1,1]:
  q=Point(P(side*(width/2+.28),0));wall=unary_union([LineString([e['a'],e['b']]) for e in nearwalls]);a,b=nearest_points(q,wall);l=LineString([a,b]);fp=l.buffer(.12,cap_style=2)
  if l.length>.55 or fp.intersects(fixtureForbidden):break
  if l.length>.02:joins.append({'a':list(a.coords)[0],'b':list(b.coords)[0],'owner':owner,'style':kind,'height':homes[owner]['wallHeight'],'tint':homes[owner]['wallTint']})
 else:
  gateReserved.append(solid);connections.extend(joins);gates.append({'owner':owner,'style':kind,'x':center.x,'z':center.y,'ux':ux,'uz':uz,'nx':nx,'nz':nz,'width':width,'pieces':pieces,'base':height(center.x,center.y),'house':list(bs[owner].centroid.coords)[0]})
# Narrow concrete seams close the former yellow strips between road and private ground.
apron=road.buffer(.62,join_style=2).difference(road).difference(built).intersection(limit)
def triangulate(geom):
 parts=[geom] if geom.geom_type=='Polygon' else [q for q in getattr(geom,'geoms',[]) if q.geom_type=='Polygon'];out=[]
 for p in parts:
  if p.area>.00001:out.extend([list(t.exterior.coords)[:3] for t in S.constrained_delaunay_triangles(p).geoms])
 return out
# Edge paint is only drawn inside roads with a meaningful clear width; tiny alleys stay unmarked.
paint=[];drains=[];roadlines=list(road.boundary.geoms) if road.boundary.geom_type=='MultiLineString' else [road.boundary]
for line in roadlines:
 if line.length<4:continue
 for t in np.arange(.5,line.length-.2,.8):
  a=line.interpolate(float(t));b=line.interpolate(min(line.length,float(t)+.8));L=a.distance(b)
  if L<.1:continue
  ux,uz=(b.x-a.x)/L,(b.y-a.y)/L;nx,nz=-uz,ux
  if not road.contains(Point(a.x+nx*.45,a.y+nz*.45)):nx,nz=-nx,-nz
  if not road.contains(Point(a.x+nx*2.8,a.y+nz*2.8)):continue
  poly=Polygon([(a.x+nx*.20,a.y+nz*.20),(b.x+nx*.20,b.y+nz*.20),(b.x+nx*.29,b.y+nz*.29),(a.x+nx*.29,a.y+nz*.29)]).intersection(road).difference(drive)
  paint.extend(triangulate(poly))
  if int(t*10)%120<8 and a.distance(built)>.28:drains.append({'x':a.x+nx*.07,'z':a.y+nz*.07,'ux':ux,'uz':uz})
allsolids=unary_union([wallShape]+[Polygon(p['footprint']) for p in piers]+gateReserved+[LineString([e['a'],e['b']]).buffer(.12,cap_style=2) for e in connections]);qa={'wallHeightRange':[min(r['height'] for r in runs if r['style']!='villa-curb'),max(r['height'] for r in runs)],'wallStyles':{k:sum(r['style']==k for r in runs) for k in styles+['villa-curb']},'openFronts':sum(h['policy'] in ['open-villa','street-flush'] for h in homes.values()),'wallRuns':len(runs),'wallPiers':len(piers),'gates':len(gates),'gateTypes':{k:sum(g['style']==k for g in gates) for k in styles},'roadApronArea':apron.area,'roadDrains':len(drains),'buildingOverlap':allsolids.intersection(built).area,'roadOverlap':allsolids.intersection(road).area,'pedestrianOverlap':allsolids.intersection(pedestrian).area,'vehicleOverlap':allsolids.intersection(drive).area}
assert max(qa[k] for k in ['buildingOverlap','roadOverlap','pedestrianOverlap','vehicleOverlap'])<1e-5,qa
out={'version':23,'rule':'Road-adjacent Korean household fronts: connected masonry boundary, joined open gates, narrow concrete seam, open parking forecourts. Roadview-inspired, not surveyed.','wallRuns':runs,'piers':piers,'gates':gates,'connections':connections,'apronTriangles':triangulate(apron),'paintTriangles':paint,'drains':drains,'qa':qa}
(ROOT/'streetscape.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False,default=float));(REPORT/'streetscape-validation-v23.json').write_text(json.dumps(qa,indent=2,ensure_ascii=False));print(qa)
