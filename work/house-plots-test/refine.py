import os
"""Final local street-front refinement. Inferred access, never surveyed parcels."""
import json,math
from pathlib import Path
from shapely.geometry import shape,mapping,Point,LineString,box
from shapely.ops import unary_union,nearest_points
O=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(Path(__file__).resolve().parents[2]/'outputs/domestic-test/house-plots-test')))
def build():
 d=json.loads((O/'gaps-infill.json').read_text());base=json.loads((O/'infill-plots.json').read_text());bs=base['buildings'];road=shape(base['road']);houses=unary_union([shape(b['building']) for b in bs]);pm={p['id']:p for p in json.loads((O/'piloti.json').read_text())['plans']};gm={p['id']:p for p in json.loads((O/'ground-floors.json').read_text())['plans']};fronts={};parapets=[]
 simplified=0
 for b in bs:
  p=shape(b['building']);candidate=p.simplify(.20,preserve_topology=True)
  if b['id'] not in pm and b['id'] not in gm and p.geom_type=='Polygon' and candidate.is_valid and candidate.area>.99*p.area and candidate.symmetric_difference(p).area<.015*p.area and candidate.intersection(road).area<.001 and len(candidate.exterior.coords)<len(p.exterior.coords):
   b['building']=mapping(candidate);simplified+=1
 houses=unary_union([shape(b['building']) for b in bs])
 for b in bs:
  p=shape(b['building']);p=max(p.geoms,key=lambda g:g.area) if p.geom_type=='MultiPolygon' else p
  pts=list(p.exterior.coords)[:-1]; candidates=[];others=houses.difference(p)
  for i,(a,c) in enumerate(zip(pts,pts[1:]+pts[:1])):
   L=math.dist(a,c)
   if L<2.4:continue
   m=Point((a[0]+c[0])/2,(a[1]+c[1])/2);q=nearest_points(m,road)[1];line=LineString([m,q]);
   if line.intersection(p.buffer(-.03)).length>.05 or line.intersection(others.buffer(.15)).length>.05:continue
   candidates.append((line.length-.06*min(L,12),i,line))
  # A landlocked house can front an existing pedestrian access strip.
  if not candidates:
   paths=[shape(g['geometry']) for g in d['gaps'] if g['kind']=='passage']
   for i,(a,c) in enumerate(zip(pts,pts[1:]+pts[:1])):
    if math.dist(a,c)<2.4:continue
    m=Point((a[0]+c[0])/2,(a[1]+c[1])/2)
    for path in paths:
     q=nearest_points(m,path)[1];line=LineString([m,q])
     if line.length<12 and line.intersection(p.buffer(-.03)).length<.05 and line.intersection(others.buffer(.15)).length<.05:candidates.append((line.length,i,line))
  fixed=pm.get(b['id']) or gm.get(b['id']);edge=fixed['frontEdge'] if fixed else min(candidates)[1] if candidates else None
  fronts[str(b['id'])]={'renderBuilding':b['building'],'frontEdge':edge,'styleIndex':3+(abs(b['id'])%2) if b['id'] in pm else abs(b['id'])%6,'verifiedAccess':bool(fixed or candidates)}
  ring=p.buffer(.09,join_style=2).difference(p.buffer(-.09,join_style=2));cap=p.buffer(.14,join_style=2).difference(p.buffer(-.14,join_style=2));parapets.append(dict(id=b['id'],wall=mapping(ring),cap=mapping(cap),top=b['levels']*3))
 def ownerstyle(line):
  b=min(bs,key=lambda b:line.distance(shape(b['building'])));return fronts[str(b['id'])]['styleIndex']
 for w in d['walls']:
  w['styleIndex']=ownerstyle(LineString([w['a'],w['b']]))
 for g in d['gaps']:
  g['styleIndex']=fronts[str(g['pair'][0])]['styleIndex']
  if g['kind']=='shutter':g['kind']='gate' # No proven vehicle bay behind these former random shutters.
  if g['kind']=='passage':
   a,b=g['a'],g['b'];L=math.dist(a,b);u=[(b[i]-a[i])/L for i in range(2)];g['a']=[a[i]-u[i]*.42 for i in range(2)]
   g['geometry']=mapping(LineString([g['a'],b]).buffer(min(1.6,g['width']-.45)/2,cap_style=2).difference(houses.buffer(.08)).difference(road))
 d['entries']=[];d['siteDetails']['gates']=[];d['siteDetails']['booths']=[]
 for zi,z in enumerate(d['zones']):
  if z['kind'] not in ['parking','active','abandoned']:continue
  p=shape(z['geometry']);q=nearest_points(p,road)[0];r=nearest_points(q,road)[1];inner=p.buffer(-.3,join_style=2).simplify(.12,preserve_topology=True)
  if inner.is_empty:continue
  # Use a complete straight frontage segment, rather than an arbitrary corner opening.
  rings=[inner] if inner.geom_type=='Polygon' else list(inner.geoms);candidates=[]
  for poly in rings:
   pts=list(poly.exterior.coords)
   for a,b in zip(pts,pts[1:]):
    line=LineString([a,b]);L=line.length
    if L<3.3:continue
    for t in [.3,.5,.7]:
     m=line.interpolate(max(1.55,min(L-1.55,L*t)));dist=m.distance(road)
     q=nearest_points(m,road)[1];drive=LineString([m,q]).buffer(2,cap_style=2)
     if drive.intersection(houses).area<.01 and LineString([m,q]).intersection(inner.buffer(-.03)).length<.05:candidates.append((dist,line,m))
  if not candidates:continue
  _,line,m=min(candidates,key=lambda v:v[0]);a,b=list(line.coords);L=line.length;u=[(b[i]-a[i])/L for i in range(2)];w=min(L-.2,4 if z['kind']=='parking' else 3.6)
  A=[m.coords[0][i]-u[i]*w/2 for i in range(2)];B=[m.coords[0][i]+u[i]*w/2 for i in range(2)];opening=LineString([A,B]).buffer(.65,cap_style=2)
  def cut(items):
   out=[]
   for f in items:
    l=LineString([f['a'],f['b']]);rem=l.difference(opening)
    for s in ([rem] if rem.geom_type=='LineString' else getattr(rem,'geoms',[])):
     if s.geom_type=='LineString' and s.length>.1:out.append(dict(f,a=list(s.coords[0]),b=list(s.coords[-1])))
   return out
  d['walls']=cut(d['walls']);d['siteDetails']['fences']=cut(d['siteDetails']['fences']);entry=dict(a=A,b=B,zone=zi,kind=z['kind'],width=w);entry['roadDistance']=round(m.distance(road),2);q=nearest_points(m,road)[1];entry['connector']=mapping(LineString([m,q]).buffer(w/2,cap_style=2).difference(road));d['entries'].append(entry)
  if z['kind']!='parking':
   # Rebuild this perimeter so the old arbitrary hole is closed too.
   d['walls']=[v for v in d['walls'] if v.get('zone')!=zi or v.get('kind')!='panel']
   boundary=inner.boundary.difference(opening).difference(houses.buffer(.05)).difference(road)
   for segment in ([boundary] if boundary.geom_type=='LineString' else getattr(boundary,'geoms',[])):
    if segment.geom_type!='LineString':continue
    points=list(segment.coords)
    for C,D in zip(points,points[1:]):
     if math.dist(C,D)>.1:d['walls'].append(dict(a=list(C),b=list(D),kind='panel',height=3,zone=zi))
   # Close the earlier entry too; all perimeter gaps are deliberate visible doors.
   d['siteDetails']['gates'].append(dict(entry,height=3,open=False))
  else:
   # Clear an inward approach connected to the entrance; never park across it.
   c=p.representative_point();nx,ny=-u[1],u[0]
   if not p.covers(Point(m.x+nx,m.y+ny)):nx,ny=-nx,-ny
   corridor=LineString([(m.x,m.y),(m.x+nx*6,m.y+ny*6)]).buffer(2,cap_style=2)
   d['bays']=[v for v in d['bays'] if shape(v['footprint']).intersection(corridor).area<.01]
   entry['approach']=mapping(corridor.intersection(p));occupied=unary_union([shape(v['footprint']).buffer(.2) for v in d['bays']]);safe=p.difference(occupied.union(houses).union(corridor))
   for sign in [-1,1]:
    x=m.x+u[0]*sign*3.4+nx*1.8;y=m.y+u[1]*sign*3.4+ny*1.8;foot=box(x-.95,y-1.1,x+.95,y+1.1)
    if safe.covers(foot):d['siteDetails']['booths'].append(dict(point=[x,y],zone=zi));break
 # Add fence-edge trees: trunk protected, canopy may overhang road but never a building.
 added=[]
 for zi,z in enumerate(d['zones']):
  if z['kind'] not in ['wild','garden']:continue
  p=shape(z['geometry']);edge=p.buffer(-.65)
  if edge.is_empty:continue
  for t in range(0,int(edge.boundary.length),5):
   q=edge.boundary.interpolate(t);r=2.7
   if q.distance(road)<2 and q.distance(houses)>r and p.covers(q.buffer(.22)) and all(q.distance(Point(v['point']))>2 for v in added):added.append(dict(point=[q.x,q.y],radius=r,height=8,kind='tree',zone=zi,dense=True,overhang=True))
 d['plants']+=added
 from access_routes import route
 route_count=route(d,bs,fronts,road,houses)
 # Original wire span policy: nearby poles, sagging three wires, no building crossings.
 links=[]
 for i,p in enumerate(d['poles']):
  near=sorted((math.dist(p['point'],q['point']),j,q) for j,q in enumerate(d['poles']) if j>i)
  for dist,j,q in near:
   if dist>42:break
   if LineString([p['point'],q['point']]).intersects(houses.buffer(.3)):continue
   links.append([i,j]);break
 d['qa']['simplifiedFootprints']=simplified;d['qa']['newAccessPaths']=route_count;d['qa']['poles']=len(d['poles']);d['poleLinks']=links;d['qa'].update(parkingBays=len(d['bays']),plants=len(d['plants']),modernPiloti=len(pm),barredGates=sum(g['kind']=='gate' for g in d['gaps']),entries=len(d['entries']),booths=len(d['siteDetails']['booths']),canopyOverhangTrees=len(added),wireSpans=len(links),frontageUnresolved=[k for k,v in fronts.items() if not v['verifiedAccess']])
 d['qa']['occupiedBays']=sum(v['occupied'] for v in d['bays']);d['qa']['walls']=len(d['walls']);d['qa']['plantRoadOverlap']='canopy overhang allowed; trunks checked';d['qa']['trunkRoadOverlap']=sum(Point(v['point']).buffer(.12).intersection(road).area for v in d['plants'] if v['kind']=='tree')
 (O/'refined-infill.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));(O/'frontages.json').write_text(json.dumps(dict(buildings=fronts,parapets=parapets),separators=(',',':')));(O/'refinement-qa.json').write_text(json.dumps(d['qa'],indent=2));print(d['qa'])
 from street_front import build as build_street_front
 build_street_front()
if __name__=='__main__':build()
