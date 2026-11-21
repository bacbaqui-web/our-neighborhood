import os
"""30 roadview-derived rules. Local test; placements are inferred, never official allocations."""
import json,math
from pathlib import Path
from shapely.geometry import shape,mapping,Point,LineString,Polygon
from shapely.ops import unary_union,nearest_points
from shapely.strtree import STRtree
O=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(Path(__file__).resolve().parents[2]/'outputs/domestic-test/house-plots-test')))
def parts(g,kind='LineString'):
 if g.is_empty:return []
 if g.geom_type==kind or kind=='LineString' and g.geom_type=='LinearRing':return [g]
 return [a for c in getattr(g,'geoms',[]) for a in parts(c,kind)]
def read(n):return json.loads((O/n).read_text())
def plan_parking(road,noPark,boundaries):
 claimed=[];marked=[];unmarked=[];rows=[]
 def candidate(ring,t,length,width,clear=2.8):
  A=ring.interpolate(t-length/2);B=ring.interpolate(t+length/2);m=ring.interpolate(t);L=A.distance(B)
  if L<length-.12 or m.distance(LineString([A,B]))>.15:return None
  # A bend near either bumper is not a continuous parking edge.
  before=ring.interpolate(max(0,t-length/2-1.5));after=ring.interpolate(min(ring.length,t+length/2+1.5))
  if before.distance(LineString([A,B]))>1.7 or after.distance(LineString([A,B]))>1.7:return None
  ux,uz=(B.x-A.x)/L,(B.y-A.y)/L;nx,nz=-uz,ux
  if not road.covers(Point(m.x+nx*.5,m.y+nz*.5)):nx,nz=-nx,-nz
  def rect(v0,v1):return Polygon([(m.x+ux*u+nx*v,m.y+uz*u+nz*v) for u,v in [(-length/2,v0),(length/2,v0),(length/2,v1),(-length/2,v1)]])
  foot=rect(.30,.30+width);drive=rect(.35+width,.35+width+clear)
  if not road.covers(foot) or not road.covers(drive) or foot.intersects(noPark):return None
  if any(foot.buffer(.6).intersects(p) or drive.intersects(p) for p in claimed):return None
  return dict(point=[m.x+nx*(.3+width/2),m.y+nz*(.3+width/2)],direction=[nx,nz,ux,uz],footprint=mapping(foot),drive=mapping(drive),length=length,width=width,road=True,official=False,owner=None)
 # One side at a time, contiguous windows become rows. Windows near blank building sides/walls rank first.
 rings=parts(road.boundary);runs=[]
 for ri,r in enumerate(rings):
  run=[]
  for t in range(4,int(r.length)-4,6):
   b=candidate(r,t,5.6,2.1)
   if b and Point(b["point"]).distance(boundaries)<3.5:run.append((t,b))
   elif run:runs.append((ri,run));run=[]
  if run:runs.append((ri,run))
 for ri,run in sorted(runs,key=lambda v:-len(v[1])):
  if len(marked)>=18:break
  if len(run)<2:continue
  row=[]
  for t,_ in run:
   b=candidate(rings[ri],t,5.6,2.1)
   if not b:continue
   b.update(number=len(marked)+1,row=len(rows)+1,occupied=len(row)%3!=0,marked=True,label='추정 구획');marked.append(b);row.append(b);claimed.append(shape(b['footprint']))
  if row:rows.append(row)
 # Isolated bays are valid only with a long blank frontage; no fabricated resident designation.
 if not marked:
  for ri,run in runs:
   for t,_ in run:
    b=candidate(rings[ri],t,5.6,2.1)
    if b:b.update(number=len(marked)+1,row=1,occupied=len(marked)%3!=0,marked=True,label='추정 구획');marked.append(b);claimed.append(shape(b['footprint']))
    if len(marked)>=6:break
   if len(marked)>=6:break
 # Unmarked cars: sparse candidates beside walls, short compact-car envelope, no paint/stoppers.

 for ri,r in enumerate(rings):
  for t in range(3,int(r.length)-3,7):
   if len(unmarked)>=24:break
   b=candidate(r,t,4.2,1.95)
   if not b or Point(b['point']).distance(boundaries)>3.5:continue
   if any(Point(b['point']).distance(Point(a['point']))<13 for a in unmarked+marked):continue
   b.update(occupied=True,marked=False,carModel=len(unmarked)%2*2,label='선 없는 추정 주차');unmarked.append(b);claimed.append(shape(b['footprint']))
 return marked,unmarked
def build():
 d=read('refined-infill.json');base=read('infill-plots.json');front=read('frontages.json')['buildings'];gf=read('ground-floors.json')['plans'];piloti=read('piloti.json')['plans']
 road=shape(base['road']);bs=base['buildings'];polys=[shape(front[str(b['id'])]['renderBuilding']) for b in bs];houses=unary_union(polys);ht=STRtree(polys);inner=houses.buffer(-.08)
 vehicle=[shape(p['access']) for p in gf if p['kind']=='basement-ramp']+[shape(a) for p in piloti for a in p['access']]
 access=[shape(p['access']) for p in gf]+[shape(a) for p in piloti for a in p['access']]+[shape(p['geometry']) for p in d.get('accessPaths',[])]+[shape(e['connector']) for e in d['entries']]
 # Yeonnam: reserve the whole open shop frontage, not only its central door.
 shopAprons=[]
 for g in gf:
  if not g['kind'].startswith('shop'):continue
  start,width,_=g['opening'];o=g['origin'];u=g['u'];n=g['n']
  a=(o[0]+u[0]*start,o[1]+u[1]*start);b=(a[0]+u[0]*width,a[1]+u[1]*width)
  edge=LineString([a,b]);distance=edge.distance(road)
  if distance>6:continue
  depth=min(6,distance+1.0)
  apron=Polygon([a,b,(b[0]-n[0]*depth,b[1]-n[1]*depth),(a[0]-n[0]*depth,a[1]-n[1]*depth)]).difference(houses)
  if not apron.is_empty:shopAprons.append(apron);access.append(apron)
 shopClear=unary_union(shopAprons)
 d['shopFrontages']=[mapping(g) for g in shopAprons]
 oldBayCount=len(d['bays'])
 d['bays']=[b for b in d['bays'] if shape(b['footprint']).intersection(shopClear).area<.05]
 d['shopParkingRemoved']=oldBayCount-len(d['bays'])
 # Only entrance mouths, not every private gap, reserve access.
 doors=[]
 for b,p in zip(bs,polys):
  f=front[str(b['id'])];idx=f['frontEdge']
  if idx is None:continue
  p=max(parts(p,'Polygon'),key=lambda x:x.area);coords=list(p.exterior.coords)[:-1]
  if idx>=len(coords):continue
  a,c=coords[idx],coords[(idx+1)%len(coords)];m=Point((a[0]+c[0])/2,(a[1]+c[1])/2);q=nearest_points(m,road)[1];l=LineString([m,q])
  if l.intersection(inner).length<.1:access.append(l.buffer(.85,cap_style=2));doors.append(dict(id=b['id'],point=list(m.coords[0]),geometry=mapping(l.buffer(.85,cap_style=2))))
 for b in d['bays']:
  if b.get('entrance'):access.append(shape(b['entrance']));vehicle.append(shape(b['entrance']))
 access +=[shape(e['approach']) for e in d['entries'] if e.get('approach')]
 # Existing parking mouths sometimes stop at a planting strip: connect only clear short gaps.
 approaches=[]
 for g in vehicle:
  a,b=nearest_points(g,road)
  if .05<a.distance(b)<6:
   link=LineString([a,b]).buffer(1.3,cap_style=2,join_style=2)
   if link.intersection(inner).area<.02:approaches.append(link)
 vehicle+=approaches;access+=approaches
 d['vehicleApproaches']=[mapping(g.difference(road)) for g in approaches]
 known=unary_union(access);kept=[]
 for g in d['gaps']:
  if g['kind']=='passage':
   if not shape(g['geometry']).intersects(known) and Point(g['b']).distance(road)>1:continue
   access.append(shape(g['geometry']))
  kept.append(g)
 d['gaps']=kept
 protected=unary_union(access).buffer(.15);roadClear=road.buffer(.12);wallForbidden=unary_union([protected,houses.buffer(-.02),roadClear]);parked=unary_union([shape(b['footprint']) for b in d['bays']]);wallForbidden=wallForbidden.union(parked.buffer(.15))
 pilotiids={p['id'] for p in piloti}
 openids={p['id'] for p in piloti}|{p['id'] for p in gf if p['kind'].startswith('shop') or p['kind']=='basement-ramp'}
 # Keep internal boundaries, remove road-tracing pieces; owner/material is stable per long segment.
 walls=[]
 for w in d['walls']:
  l=LineString([w['a'],w['b']])
  if w['kind']=='panel':walls.append(w);continue
  if l.distance(road)<1.1:continue
  for line in parts(l.difference(wallForbidden)):
   if line.length<1.2:continue
   owner=bs[int(ht.nearest(line.interpolate(.5,normalized=True)))]['id']
   walls.append(dict(w,a=list(line.coords[0]),b=list(line.coords[-1]),height=.45 if owner in pilotiids else min(w['height'],1.25),rail=owner in pilotiids,styleIndex=front[str(owner)]['styleIndex'],owner=owner,role='side',cap=True))
 # Road-facing parcel boundary: preserve openings, enclose the remaining frontage.
 new=[];seen=Polygon()
 roadside=road.buffer(.48,join_style=2).boundary
 for b,p in zip(bs,polys):
  f=front[str(b['id'])];plot=shape(b['plot'])
  allowed=plot.buffer(.08).difference(wallForbidden.union(houses.buffer(.20)))
  for run in parts(roadside.intersection(allowed).difference(seen)):
   # Simplify tiny survey bends, without crossing the allowed property/access area.
   run=run.simplify(.12,preserve_topology=True)
   coords=list(run.coords)
   for a,c in zip(coords,coords[1:]):
    for seg in parts(LineString([a,c]).intersection(allowed)):
     if seg.length<.8:continue
     new.append(dict(a=list(seg.coords[0]),b=list(seg.coords[-1]),height=1.4,kind='frontage',role='front',styleIndex=f['styleIndex'],owner=b['id'],cap=True,posts=True,rail=False,baseA=0,baseB=0))
     seen=seen.union(seg.buffer(.22))
 walls+=new
 from wall_connections import refine as connect_walls
 walls,connectionQA=connect_walls(walls,d['gaps'],houses,protected,road)
 new=[w for w in walls if w.get('role') in ('front','return')]
 d['walls']=walls;d['wallConnectionQA']=connectionQA
 # Width and turning-approach exclusions, followed by fixed street furniture.
 vehicleAccess=unary_union(vehicle)
 noPark=protected.buffer(.45).union(vehicleAccess.buffer(.85))
 furniture=unary_union([Point(p['point']).buffer(.55) for p in d['poles']]+[Point(p['point']).buffer(.4) for p in d['drains']])
 noPark=noPark.union(furniture);marked,unmarked=plan_parking(road,noPark,unary_union([houses.boundary]+[LineString([w['a'],w['b']]) for w in walls]))
 d['roadBays']=marked;d['unmarkedCars']=unmarked;d['bays']+=marked+unmarked
 paint=road.buffer(-.24,join_style=2).boundary.difference(unary_union([shape(b['footprint']) for b in marked]).buffer(.4).union(vehicleAccess.buffer(.5)))
 # Drain channels stay on the property side and follow the road-facing entrance mouth.
 trenches=[];occupied=Polygon()
 mouth=road.buffer(.18,join_style=2).boundary.intersection(vehicleAccess)
 for line in parts(mouth):
  cs=list(line.coords)
  for a,b in zip(cs,cs[1:]):
   seg=LineString([a,b])
   if seg.length<1.4:continue
   mid=seg.interpolate(.5,normalized=True)
   if houses.distance(mid)<.25 or occupied.distance(mid)<.5:continue
   trenches.append(dict(a=list(a),b=list(b),kind='vehicle-mouth'))
   occupied=occupied.union(seg.buffer(.25))
 d['entranceDrains']=trenches
 d['vehicleAccess']=mapping(vehicleAccess)
 d['yellowLines']=[list(l.coords) for l in parts(paint) if l.length>.4]
 d['protectedAccess']=mapping(protected);d['entryDoors']=doors
 qa={'shopFrontages':len(shopAprons),'shopParkingRemoved':d['shopParkingRemoved'],'shopParkingOverlap':sum(shape(b['footprint']).intersection(shopClear).area for b in d['bays']),'entranceDrainSegments':len(trenches),'lowPilotiSideSegments':sum(w.get('rail',False) and w.get('role')=='side' for w in walls),'yellowAccessOverlap':sum(LineString(l).intersection(vehicleAccess).length for l in d['yellowLines']),'frontageWallSegments':len(new),'wallSegments':len(walls),'residentParkingBays':len(marked),'residentCars':sum(b['occupied'] for b in marked),'unmarkedCars':len(unmarked),'roadBayOutside':sum(shape(b['footprint']).difference(road).area for b in marked+unmarked),'roadBayAccessOverlap':sum(shape(b['footprint']).intersection(noPark).area for b in marked+unmarked),'frontageAccessOverlap':sum(LineString([w['a'],w['b']]).intersection(protected).length for w in new),'officialResidentBays':0,'terrainMode':'flat; slope rules verified in labelled fixture only'}
 assert qa['roadBayOutside']<1e-6 and qa['roadBayAccessOverlap']<1e-6 and qa['frontageAccessOverlap']<1e-6,qa
 d['streetQA']=qa;d['qa']['parkingBays']=len(d['bays'])-len(unmarked)
 (O/'street-infill.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));(O/'street-front-qa.json').write_text(json.dumps(qa,indent=2));print(qa)
if __name__=='__main__':build()
