"""User-directed grade-one housing. Coordinates are metres; parcels remain inferred."""
import math
from shapely.geometry import Point,LineString,Polygon,shape,mapping
from shapely.ops import unary_union,nearest_points

def classify(poly,front,road):
 ring=list(poly.exterior.coords);a,b=ring[front:front+2]
 mid=Point((a[0]+b[0])/2,(a[1]+b[1])/2)
 segments=[LineString([c,d]) for c,d in zip(road.coords,list(road.coords)[1:]) if math.dist(c,d)>.01]
 segment=min(segments,key=lambda s:s.distance(mid));c,d=segment.coords
 u=((d[0]-c[0])/segment.length,(d[1]-c[1])/segment.length)
 length=math.dist(a,b);dot=abs(((b[0]-a[0])*u[0]+(b[1]-a[1])*u[1])/length)
 angle=math.degrees(math.acos(min(1,dot)))
 simple=poly.simplify(.03,preserve_topology=True);rect=poly.minimum_rotated_rectangle
 rectangular=not poly.interiors and len(simple.exterior.coords)==5 and poly.area/rect.area>=.995
 return {'housingType':'detached' if angle>5 else 'piloti' if rectangular else 'old-villa','roadAngle':round(angle,3),'roadTangent':list(u),'rectangular':rectangular}

def parts(g,kind='LineString'):
 if g.is_empty:return []
 if g.geom_type==kind or kind=='LineString' and g.geom_type=='LinearRing':return [g]
 return [p for child in getattr(g,'geoms',[]) for p in parts(child,kind)]

def decorate(package):
 """Apply closures after legacy infill, retaining essential entrances and public space."""
 d=package['infill'];bs=package['plots']['buildings'];road=shape(package['plots']['road'])
 selected=[b for b in bs if (b.get('streetProfile') or {}).get('housingType')]
 houses=unary_union([shape(b['building']) for b in bs]);issues=[]
 entries=unary_union([shape(p['access']) for p in package['groundFloors']['plans']]+[shape(a) for p in package['piloti']['plans'] for a in p['access']]+[shape(p['geometry']) for p in d.get('accessPaths',[])])
 def cut_rows(rows,mask):
  return [dict(w,a=list(s.coords[0]),b=list(s.coords[-1])) for w in rows for s in parts(LineString([w['a'],w['b']]).difference(mask)) if s.length>.15]
 def clear(mask):
  d['walls']=cut_rows(d['walls'],mask)
  d['siteDetails']['fences']=cut_rows(d['siteDetails'].get('fences',[]),mask)
  d['plants']=[p for p in d['plants'] if not mask.intersects(Point(p['point']).buffer(p['radius']))]
  d['gaps']=[g for g in d['gaps'] if not mask.intersects(shape(g['geometry']))]
 def wall(line,owner,style):
  return dict(a=list(line.coords[0]),b=list(line.coords[-1]),height=1.8,kind='frontage',role='front',styleIndex=style,owner=owner,cap=True,posts=True,rail=False,alleyHousing=True)
 for b in selected:
  profile=b['streetProfile'];kind=profile['housingType'];poly=shape(b['building']);plot=shape(b['plot']);owner=b['id']
  if kind=='piloti':
   if owner not in {p['id'] for p in package['piloti']['plans']}:issues.append({'owner':owner,'reason':'필로티 계단실·기둥·주차 공간 부족'})
   continue
  # A single straight road-facing boundary, with a deliberate gate opening.
  d['walls']=[w for w in d['walls'] if not (w.get('owner')==owner and w.get('role')=='front')]
  safe=plot.buffer(.01).difference(houses.buffer(.18)).difference(road.buffer(.12))
  runs=[]
  for line in parts(road.buffer(.3,join_style=2).boundary.intersection(safe)):
   for a,c in zip(line.coords,list(line.coords)[1:]):
    seg=LineString([a,c]);u=profile['roadTangent']
    if seg.length>1.6 and abs(((c[0]-a[0])*u[0]+(c[1]-a[1])*u[1])/seg.length)>math.cos(math.radians(5)):runs.append(seg)
  gate=None
  if runs:
   front=LineString([profile['frontStart'],profile['frontEnd']]);mid=front.interpolate(.5,normalized=True)
   run=min(runs,key=lambda s:s.distance(mid));t=max(.7,min(run.length-.7,run.project(mid)))
   gate=LineString([run.interpolate(t-.6),run.interpolate(t+.6)])
   path=LineString([gate.interpolate(.5,normalized=True),mid]).buffer(.65,cap_style=2)
   if path.intersection(houses.difference(poly).buffer(.1)).area>.01:gate=None
   if gate:
    mouth=gate.buffer(.15,cap_style=2);clear(mouth.union(path))
    entries=entries.union(path)
    d.setdefault('accessPaths',[]).append({'owner':owner,'geometry':mapping(path.difference(houses).difference(road))})
    d['gaps'].append(dict(kind='gate',role='yard-gate',a=list(gate.coords[0]),b=list(gate.coords[-1]),geometry=mapping(mouth),width=1.2,owner=owner,styleIndex=profile['styleIndex'],alleyHousing=True))
    # Keep gates on the road axis, not on the tilted building's facade axis.
    for line in runs:
     for s in parts(line.difference(gate.buffer(.03,cap_style=2)).difference(entries.buffer(.05))):
      if s.length>.25:d['walls'].append(wall(s,owner,profile['styleIndex']))
   else:issues.append({'owner':owner,'reason':'다른 집을 통과하지 않는 대문 연결 공간 부족'})
  else:issues.append({'owner':owner,'reason':'도로 평행 담장 공간 부족'})
  if kind=='detached':
   d['bays']=[bay for bay in d['bays'] if bay.get('owner')!=owner]
   yard=plot.difference(houses).difference(road)
   d['zones']=[z for z in d['zones'] if z.get('owner')!=owner]
   d['zones'].append(dict(kind='yard',owner=owner,geometry=mapping(yard)))
   excluded=entries.buffer(.1)
   if gate:excluded=excluded.union(path)
   room=yard.difference(excluded).difference(road.buffer(.5)).difference(houses.buffer(.65))
   core=room.buffer(-.7)
   if not core.is_empty:
    q=max(parts(core,'Polygon'),key=lambda p:p.area).representative_point()
    d['plants']=[p for p in d['plants'] if Point(p['point']).distance(q)>1.2]
    d['plants'].append(dict(point=[q.x,q.y],radius=.7,height=3.4,kind='tree',treeUse='yard',owner=owner,alleyHousing=True))
   else:issues.append({'owner':owner,'reason':'출입 공간을 남기면 마당 나무 공간 부족'})
 # Close private gaps only when no house entrance or public path uses them.
 for i,a in enumerate(selected):
  pa=shape(a['building']);u=a['streetProfile']['roadTangent']
  for b in selected[i+1:]:
   tangent=b['streetProfile']['roadTangent']
   if abs(sum(x*y for x,y in zip(u,tangent)))<math.cos(math.radians(5)):continue
   if a['streetProfile'].get('roadId')!=b['streetProfile'].get('roadId'):continue
   pb=shape(b['building']);width=pa.distance(pb)
   if not .35<width<5:continue
   A,B=nearest_points(pa,pb);mid=Point((A.x+B.x)/2,(A.y+B.y)/2);q=nearest_points(mid,road)[1]
   n=(-u[1],u[0])
   if (mid.x-q.x)*n[0]+(mid.y-q.y)*n[1]<0:n=(-n[0],-n[1])
   found=None
   # Walk inward from the street until both side walls flank the opening.
   for step in range(1,81):
    x,y=q.x+n[0]*step*.25,q.y+n[1]*step*.25
    cross=LineString([(x-u[0]*20,y-u[1]*20),(x+u[0]*20,y+u[1]*20)])
    ca,cb=cross.intersection(pa),cross.intersection(pb)
    if ca.is_empty or cb.is_empty:continue
    aa,bb=nearest_points(ca,cb);line=LineString([aa,bb])
    if not .35<line.length<5:continue
    foot=line.buffer(.08,cap_style=2)
    if foot.intersection(road).area>.001 or foot.intersection(houses.buffer(-.09)).area>.001:continue
    if foot.intersects(entries):break
    found=(line,foot);break
   if not found:continue
   line,foot=found;center=line.interpolate(.5,normalized=True);L=line.length
   def pt(dx,dy):return (center.x+u[0]*dx+n[0]*dy,center.y+u[1]*dx+n[1]*dy)
   garage=Polygon([pt(-1.3,.15),pt(1.3,.15),pt(1.3,5.35),pt(-1.3,5.35)])
   approach=LineString([center,nearest_points(center,road)[1]]).buffer(1.3,cap_style=2)
   land=shape(a['plot']).union(shape(b['plot']));free=land.difference(houses.buffer(.04)).difference(road)
   parking=L>=2.7 and free.covers(garage) and garage.intersection(entries).area<.01 and approach.intersection(houses.buffer(.04)).area<.01 and land.union(road).buffer(.02).covers(approach)
   parking=parking and not any(garage.union(approach).intersects(Point(p['point']).buffer(.25)) for p in d.get('poles',[]))
   if L>=2.7 and not parking:
    issues.append({'pair':[a['id'],b['id']],'reason':'한 대 차고의 깊이 또는 진입 공간 부족'})
   mask=foot.buffer(.15).union(garage.union(approach).buffer(.15) if parking else Polygon());clear(mask)
   item=dict(kind='shutter' if parking else 'gate',role='private-gap',a=list(line.coords[0]),b=list(line.coords[-1]),geometry=mapping(foot),width=L,pair=[a['id'],b['id']],alleyHousing=True)
   if parking:
    item['garageFootprint']=mapping(garage)
    d['bays']=[v for v in d['bays'] if shape(v['footprint']).intersection(mask).area<.001]
    d['bays'].append(dict(owner=a['id'],point=list(garage.centroid.coords[0]),direction=[*u,*n],footprint=mapping(garage),entrance=mapping(approach.difference(road)),occupied=False,enclosed=True))
    d['zones'].append(dict(kind='yard',owner=a['id'],geometry=mapping(garage)))
   d['gaps'].append(item)
 d['alleyHousingQA']={'types':{kind:sum(b['streetProfile']['housingType']==kind for b in selected) for kind in ['detached','piloti','old-villa']},'walls':sum(w.get('alleyHousing',False) for w in d['walls']),'gates':sum(g.get('role')=='yard-gate' for g in d['gaps']),'shutters':sum(g.get('role')=='private-gap' and g['kind']=='shutter' for g in d['gaps']),'issues':issues}
