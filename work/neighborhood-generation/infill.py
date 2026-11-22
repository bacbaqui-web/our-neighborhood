import os
"""Illustrative land use; parking needs a full bay and a 3m road entrance."""
import json,math,random
from pathlib import Path
import shapely as S
from parking import plan,axis
from shapely.geometry import shape,mapping,Polygon,Point,LineString
from shapely.ops import unary_union,nearest_points
ROOT=Path(__file__).resolve().parents[2];out=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(ROOT/'outputs/domestic-test/house-plots-test')))
d=json.loads((out/'plots.json').read_text());road=shape(d['road']);houses=unary_union([shape(b['building']) for b in d['buildings']]);rng=random.Random(41)
def parts(g):return [p for p in S.get_parts(g) if p.geom_type=='Polygon' and p.area>.02]
def rect(x,z,ux,uz,nx,nz,w,depth,start=0):return Polygon([(x+ux*a+nx*b,z+uz*a+nz*b) for a,b in [(-w/2,start),(w/2,start),(w/2,start+depth),(-w/2,start+depth)]])
zones=[];bays=[];plants=[];walls=[];reserved=[];independent=[]
# Large broad pockets become independent land, not arbitrary giant house yards.
for b in d['buildings']:
 p=shape(b['plot']);h=shape(b['building']);yard=p.difference(h.buffer(1.0,join_style=2))
 core=yard.buffer(-3,join_style=2).buffer(3,join_style=2).intersection(yard)
 for q in parts(core):
  if q.area<120 or (b.get('streetProfile') or {}).get('housingType')=='detached':continue
  remaining=p.difference(q)
  keepers=[v for v in parts(remaining) if v.covers(h)]
  if not keepers:continue
  keep=max(keepers,key=lambda v:v.area)
  independent.extend((v,b['id']) for v in parts(p.difference(keep)))
  p=keep
 b['plot']=mapping(p);b['area']=round(p.area,1);b['yardArea']=round(p.difference(h).area,1)
for q in parts(shape(d['common'])):
 if q.area>12:independent.append((q,None))
# Parking candidates follow local street tangent. Full bay + entrance are in owner's land.
layout_reports=[]
def parking(p,free,owner,limit):
 reference=next((shape(b['building']) for b in d['buildings'] if b['id']==owner),None)
 if reference is None:reference=min([shape(b['building']) for b in d['buildings']],key=lambda h:h.distance(p))
 chosen,tested=plan(p,free,road,axis(reference))
 layout_reports.append(dict(owner=owner,area=round(p.area,1),tested=tested,chosen=len(chosen)))
 found=[]
 for v in chosen:
  footprint=v['foot'];reserved.append(footprint);found.append(footprint)
  bays.append(dict(owner=owner,point=v['point'],direction=v['direction'],footprint=mapping(footprint),entrance=mapping(v['access']),occupied=len(bays)%5!=0))
 return found
for b in d['buildings']:
 p=shape(b['plot']);h=shape(b['building']);free=p.difference(h.buffer(.45));ps=[] if (b.get('streetProfile') or {}).get('housingType')=='detached' else parking(p,free,b['id'],3)
 zones.append(dict(kind='yard',owner=b['id'],geometry=mapping(p.difference(h)),reason='출입·정비 공간은 비워 둡니다.'))
 # Behind or beside houses: reserve facade access strip and road frontage.
 green=free.intersection(h.buffer(1.6)).difference(h.buffer(.7)).difference(road.buffer(1.1)).difference(unary_union(ps).buffer(.7)) if b['id']%5==0 else Polygon()
 for g in parts(green):
  if g.area>2:zones.append(dict(kind='garden' if g.area>30 and b['id']%4==0 else 'green',owner=b['id'],focus=list(g.representative_point().coords)[0],geometry=mapping(g),reason='도로에서 떨어진 집의 여분 땅'))
for i,(p,owner) in enumerate(independent):
 kind=['parking','construction','wild','garden'][i%4]
 ps=parking(p,p,None,16) if kind=='parking' else []
 if kind=='parking' and not ps:kind='garden'
 if kind=='construction' and p.distance(road)>.2:kind='wild'
 zones.append(dict(kind=kind,owner=None,formerOwner=owner,focus=list(p.representative_point().coords)[0],geometry=mapping(p),reason='넓은 빈땅을 별도 부지로 추정',area=round(p.area,1)))
# Walls follow shared rear/side plot boundaries, deduplicated once; never across driveway.
blocked=unary_union([shape(b['entrance']).union(shape(b['footprint'])) for b in bays]).buffer(.3)
lines=[]
for b in d['buildings']:
 line=shape(b['plot']).boundary.difference(road.buffer(.45)).difference(houses.buffer(.3)).difference(blocked)
 lines.append(line)
for z in zones:
 if z['kind']=='construction':lines.append(shape(z['geometry']).buffer(-.15).boundary)
for raw in S.get_parts(S.line_merge(unary_union(lines))):
 if raw.geom_type!='LineString':continue
 clipped=raw.simplify(.7).difference(road.buffer(.15)).difference(houses.buffer(.15)).difference(blocked)
 for line in S.get_parts(clipped):
  if line.geom_type!='LineString':continue
  coords=list(line.coords)
  for a,b in zip(coords,coords[1:]):
   if math.dist(a,b)<.02:continue
   mid=Point((a[0]+b[0])/2,(a[1]+b[1])/2)
   panel=any(z['kind']=='construction' and shape(z['geometry']).buffer(-.15).boundary.distance(mid)<.8 for z in zones)
   walls.append(dict(a=a,b=b,height=2 if panel else 1.2,kind='panel' if panel else 'wall'))
# Plants use the existing tree growth/leaf atlas in the viewer. Full crown stays in green.
for zi,z in enumerate(zones):
 if z['kind'] not in ['green','wild','garden']:continue
 p=shape(z['geometry']);x0,y0,x1,y1=p.bounds;step=2.3 if z['kind']=='green' else 2.0
 x=x0+.6
 while x<x1:
  y=y0+.6
  while y<y1:
   q=Point(x+rng.uniform(-.25,.25),y+rng.uniform(-.25,.25));r=.45
   if p.covers(q.buffer(r)):
    tree=(len(plants)%13==0 and p.covers(q.buffer(1.25)));r=1.25 if tree else .45
    plants.append(dict(point=[q.x,q.y],radius=r,height=3.4 if tree else rng.uniform(.25,.8),kind='tree' if tree else 'cover',zone=zi))
   y+=step
  x+=step
for bay in bays:zones.append(dict(kind='bay',owner=bay['owner'],geometry=bay['footprint'],reason='건물 방향 2개·시작 위치 6개를 비교해 주차 칸 수가 가장 많은 배치 선택'))
# Narrow cement drainage edge: 0.4m, matching the 0.4m grating width.
edge=road.buffer(.4,join_style=2).difference(road).difference(houses)
zones.append(dict(kind='edge',owner=-1,geometry=mapping(edge),reason='배수구 폭에 맞춘 40cm 시멘트 띠'))
poles=[];drains=[]
for w in walls:
 for pt in [w['a'],w['b']]:
  q=Point(*pt)
  if .4<q.distance(road)<1.4 and q.distance(houses)>.45 and not blocked.intersects(q.buffer(.2)) and all(q.distance(Point(*v['point']))>18 for v in poles):
   poles.append(dict(point=pt,height=7.5))
for part in parts(road):
 ring=part.exterior
 for t in range(0,int(ring.length),16):
  q=ring.interpolate(t);a=ring.interpolate(max(0,t-.3));b=ring.interpolate(t+.3);dx=b.x-a.x;dz=b.y-a.y;L=math.hypot(dx,dz)
  if L<.1:continue
  for sign in [-1,1]:
   x=q.x-sign*dz/L*.21;y=q.y+sign*dx/L*.21
   drain=rect(x,y,dx/L,dz/L,-dz/L,dx/L,.65,.38,-.19)
   if edge.covers(drain):drains.append(dict(point=[x,y],angle=math.atan2(dz,dx)));break
# QA checks actual parking surface and plants, not modified road geometry.
qa=dict(parkingBays=len(bays),occupiedBays=sum(b['occupied'] for b in bays),plants=len(plants),walls=len(walls),independentSites=sum(z['owner'] is None for z in zones if z['kind'] not in ['bay']),types={k:sum(z['kind']==k for z in zones) for k in ['green','parking','construction','wild','garden']},parkingRoadOverlap=sum(shape(b['footprint']).intersection(road).area for b in bays),parkingBuildingOverlap=sum(shape(b['footprint']).intersection(houses).area for b in bays),plantRoadOverlap=sum(Point(*p['point']).buffer(p['radius']).intersection(road).area for p in plants),plantBuildingOverlap=sum(Point(*p['point']).buffer(p['radius']).intersection(houses).area for p in plants))
all_land=[shape(b['plot']) for b in d['buildings']]+[shape(z['geometry']) for z in zones if z['owner'] is None and z['kind']!='bay']
qa['plotSiteOverlap']=sum(p.area for p in all_land)-unary_union(all_land).area
qa['bayOverlap']=sum(shape(b['footprint']).area for b in bays)-unary_union([shape(b['footprint']) for b in bays]).area
qa['poleRoadOverlap']=sum(Point(*p['point']).buffer(.18).intersection(road).area for p in poles)
qa['poleBuildingOverlap']=sum(Point(*p['point']).buffer(.18).intersection(houses).area for p in poles)
assert abs(qa['bayOverlap'])<1e-6 and qa['poleRoadOverlap']<1e-6 and qa['poleBuildingOverlap']<1e-6,qa
qa['poles']=len(poles)
qa['drains']=len(drains)
qa['layoutsCompared']=sum(len(v['tested']) for v in layout_reports)
qa['wallRoadOverlap']=sum(LineString([w['a'],w['b']]).buffer(.07,cap_style=2).intersection(road).area for w in walls)
qa['independentTypes']={k:sum(z['kind']==k and z['owner'] is None for z in zones) for k in ['parking','construction','wild','garden']}
assert abs(qa['plotSiteOverlap'])<1e-6 and qa['wallRoadOverlap']<1e-6,qa
assert max(qa[k] for k in ['parkingRoadOverlap','parkingBuildingOverlap','plantRoadOverlap','plantBuildingOverlap'])<1e-6,qa
(out/'infill.json').write_text(json.dumps(dict(zones=zones,bays=bays,plants=plants,walls=walls,qa=qa,poles=poles,drains=drains,layouts=layout_reports),ensure_ascii=False,separators=(',',':')))
# Dedicated display parcels: keep baseline plots.json reproducible and unchanged.
(out/'infill-plots.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
(out/'infill-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2));print(qa)

# Rebuild the optional local open-ground-floor experiment after parcel changes.
from piloti import build as build_piloti
build_piloti()
