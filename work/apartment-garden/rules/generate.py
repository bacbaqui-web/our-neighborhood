"""Building-first apartment grounds. No traced road/parking/garden input.
Run with Python + shapely >= 2.0; output deterministic polygons and placements.
"""
import json, math, random, heapq
from pathlib import Path
from shapely.geometry import Polygon, Point, LineString, MultiPoint
from shapely.ops import unary_union, nearest_points
from shapely import affinity
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'outputs/domestic-test/apartments/garden'
meta=json.loads((OUT/'plan.json').read_text()); geo=json.loads((OUT/'buildings.geojson').read_text())
origin=meta['origin']; rng=random.Random(20261029)
def local(p):return [(p[0]-origin[0])*111320*math.cos(math.radians(37.618)),-(p[1]-origin[1])*111133]
def polys(g):return [g] if g.geom_type=='Polygon' else [p for v in getattr(g,'geoms',[]) for p in polys(v)]
def lines(g):return [g] if g.geom_type in ('LineString','LinearRing') else [p for v in getattr(g,'geoms',[]) for p in lines(v)]
def coord(p):return [round(p[0],3),round(p[1],3)]
def rings(g):return [{'outer':[coord(p) for p in v.exterior.coords[:-1]],'holes':[[coord(p) for p in r.coords[:-1]] for r in v.interiors]} for v in polys(g) if v.area>.02]
buildings=[]
for f in geo['features']:
 p=Polygon([local(c) for c in f['geometry']['coordinates'][0]]).buffer(0)
 buildings.append({'id':f['properties']['objectid'],'name':str(f['properties'].get('buld_nm','')),'poly':p,'props':f['properties']})
B=unary_union([b['poly'] for b in buildings]); zones=polys(B.buffer(22,join_style=2).buffer(10,join_style=2)); site=unary_union(zones).buffer(3)
# Thin planting, a continuous pedestrian band, then a 6m service loop.
GARDEN=1.8; WALK=2.4; ROAD=6
protected=B.buffer(GARDEN+WALK,join_style=2)
center_envelope=B.buffer(GARDEN+WALK+ROAD/2+.3,join_style=2)
road_lines=[LineString(p.exterior.coords) for p in polys(center_envelope)]
# Connect the building loops using free-space routing; no map polylines are read.
road_union=unary_union([r.buffer(ROAD/2,join_style=2) for r in road_lines])
minx,minz,maxx,maxz=site.bounds; step=2
obstacles=B.buffer(GARDEN+WALK+ROAD/2+.12,join_style=2)
def key(p):return (round((p[0]-minx)/step),round((p[1]-minz)/step))
def pos(k):return (minx+k[0]*step,minz+k[1]*step)
def route(a,b):
 start,end=key(a),key(b);queue=[(0,0,start)];cost={start:0};prev={};closed=set();bound=site.buffer(8)
 while queue:
  _,g,n=heapq.heappop(queue)
  if n in closed:continue
  closed.add(n)
  if n==end:
   path=[b,pos(n)]
   while n in prev:n=prev[n];path.append(pos(n))
   path.append(a);return LineString(path[::-1]).simplify(.5,preserve_topology=False)
  for dx,dz in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
   m=(n[0]+dx,n[1]+dz);p=Point(pos(m))
   if m in closed or not bound.covers(p) or (obstacles.contains(p) and m!=end):continue
   if LineString([pos(n),pos(m)]).intersects(obstacles) and n!=start and m!=end:continue
   ng=g+math.hypot(dx,dz)
   if ng>=cost.get(m,1e10):continue
   cost[m]=ng;prev[m]=n;heapq.heappush(queue,(ng+math.dist(m,end),ng,m))
 return None
loops=list(road_lines);network=loops.pop(0);connectors=[]
while loops:
 pairs=[(network.distance(r),i,*nearest_points(network,r)) for i,r in enumerate(loops)];_,i,a,b=min(pairs,key=lambda v:v[0]);other=loops.pop(i);line=LineString([a,b])
 if line.buffer(ROAD/2).intersects(protected):line=route(a.coords[0],b.coords[0])
 if line is not None:connectors.append(line);network=unary_union([network,other,line])
 else:network=unary_union([network,other])
road_lines+=connectors
# An entrance is derived from the west extent, not a traced map gate.
west=min((p for l in road_lines for p in l.coords),key=lambda p:p[0]);gate=(west[0]-16,west[1]);entry=LineString([gate,west]);road_lines.append(entry)
road=unary_union([p for p in polys(unary_union([r.buffer(ROAD/2,join_style=2) for r in road_lines]).difference(protected)) if p.area>30])
site=site.union(entry.buffer(10))
# Front doors cut through the garden and connect to the walking ring.
entries=[];entry_paths=[]
for b in buildings:
 pts=list(b['poly'].exterior.coords);choices=[]
 for i,(a,c) in enumerate(zip(pts,pts[1:])):
  length=math.dist(a,c)
  if length<5:continue
  mid=Point((a[0]+c[0])/2,(a[1]+c[1])/2);q=nearest_points(mid,road)[1];L=LineString([mid,q]);corr=L.buffer(1.15,cap_style=2)
  if corr.intersection(B).area>.05:continue
  choices.append((L.length,-length,i,mid,q,L))
 if choices:
  _,_,edge,a,c,line=min(choices,key=lambda v:v[:2]);entry_paths.append(line.buffer(1.15,cap_style=2));entries.append({'owner':b['id'],'point':coord(a.coords[0]),'end':coord(c.coords[0]),'edge':edge});b['entry']=entries[-1]
walk=B.buffer(GARDEN+WALK,join_style=2).difference(B.buffer(GARDEN,join_style=2)).union(unary_union(entry_paths)).difference(B)
garden=B.buffer(GARDEN,join_style=2).difference(B).difference(unary_union(entry_paths))
# Short crosswalk links connect neighboring building sidewalks into one walk network.
walk_parts=polys(walk);ped_links=[];crossings=[]
for i,a in enumerate(walk_parts):
 options=[]
 for j,b in enumerate(walk_parts):
  if j<=i:continue
  p,q=nearest_points(a,b);line=LineString([p,q])
  if .2<line.length<22 and line.buffer(.9,cap_style=2).intersection(B.buffer(.2)).area<.01:options.append((line.length,line))
 for _,line in sorted(options,key=lambda x:x[0])[:2]:ped_links.append(line.buffer(.95,cap_style=2))
walk=walk.union(unary_union(ped_links));garden=garden.difference(walk)

# Facilities are fitted BEFORE parking. Pedestrian facilities favor courtyards;
# vehicle facilities face a road and get a full-width connection.
specs={'bike':(6,3.6),'recycling':(5.2,3.6),'pergola':(5.8,5.4),'guard':(3.8,3.6),'play':(13,11),'ramp':(5.8,10.4)}
facilities=[];pads=[];access=[]
free=site.difference(B.buffer(GARDEN+WALK+.3)).difference(road.buffer(.5))
def rect(cx,cz,w,d,angle):
 c,s=math.cos(angle),math.sin(angle)
 return Polygon([(cx+c*x+s*z,cz-s*x+c*z) for x,z in [(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]])
# Scan available land once; scores refer to entrances, roads and already placed facilities.
candidates=[]
for x in range(math.floor(minx),math.ceil(maxx),3):
 for z in range(math.floor(minz),math.ceil(maxz),3):
  p=Point(x,z)
  if free.contains(p):candidates.append(p)
counts={'guard':1,'play':2,'pergola':3,'ramp':2,'bike':7,'recycling':4}
for kind,num in counts.items():
 w,d=specs[kind]
 for n in range(num):
  ranked=[]
  for p in candidates:
   target=walk if kind in ['play','pergola','bike'] else road
   q=nearest_points(p,target)[1];dist=p.distance(q)
   if dist>20 or dist<d/2+.4:continue
   ang=math.atan2(q.x-p.x,q.y-p.y);poly=rect(p.x,p.y,w,d,ang)
   if not free.covers(poly.buffer(.5)):continue
   if any(poly.distance(v)<2 for v in pads):continue
   if kind=='recycling' and any(poly.distance(f['_poly'])<18 for f in facilities if f['kind'] in ['play','pergola']):continue
   c,s=math.cos(ang),math.sin(ang);front=(p.x+s*d/2,p.y+c*d/2)
   width=5.4 if kind=='ramp' else 1.8
   connection=LineString([front,q]).buffer(width/2,cap_style=2)
   if connection.intersection(B.buffer(.25)).area>.01 or any(connection.intersects(v) for v in pads):continue
   same=[f for f in facilities if f['kind']==kind]
   separation=min([p.distance(Point(f['point'])) for f in same]or[150])
   if separation<35:continue
   score=dist*.8-min(separation,80)*.12
   if kind=='guard':score+=p.distance(Point(gate))*4
   if kind=='bike':score+=min(p.distance(Point(e['point'])) for e in entries)*.65
   if kind in ['play','pergola']:score-=min(p.distance(road),18)*1.2
   ranked.append((score,p,ang,poly,connection,width))
  if not ranked:break
  _,p,ang,poly,connection,width=min(ranked,key=lambda v:v[0]);pads.append(poly.buffer(.7));access.append(connection)
  facilities.append({'kind':kind,'id':f'{kind}-{n}','point':coord(p.coords[0]),'angle':ang,'w':w,'d':d,'footprint':[coord(p) for p in poly.exterior.coords[:-1]],'accessWidth':width,'_poly':poly})
# Vehicle ramp aprons join the road; pedestrian facility paths join sidewalks.
for f,path in zip(facilities,access):
 if f['kind']=='ramp':road=road.union(path)
 else:walk=walk.union(path)
road=road.buffer(.01,join_style=2).buffer(-.01,join_style=2)
crossing_land=walk.intersection(road);walk=walk.difference(road)
facility_ground=unary_union(pads);reserved=unary_union([walk.buffer(.4),garden,facility_ground,unary_union(access),B.buffer(.5)])
# Parking follows straight outer road edges, with every bay opening onto the road.
parking=[];baypolys=[]
for li,line in enumerate(road_lines):
 coords=list(line.coords)
 for si,(a,b) in enumerate(zip(coords,coords[1:])):
  L=math.dist(a,b)
  if L<13:continue
  ux,uz=(b[0]-a[0])/L,(b[1]-a[1])/L
  for side in [-1,1]:
   nx,nz=-uz*side,ux*side
   for k in range(2,int(L/2.6)-2):
    if k%10>=8:continue  # planted breaks between parking groups
    t=(k+.5)*2.6;p=(a[0]+ux*t+nx*5.6,a[1]+uz*t+nz*5.6);angle=math.atan2(-uz,ux)+(math.pi if side>0 else 0)
    poly=rect(*p,2.55,5,angle)
    if not site.covers(poly) or poly.intersection(reserved).area>.01 or poly.intersection(road).area>.01:continue
    if any(poly.distance(v)<.04 for v in baypolys):continue
    mouth=LineString([(p[0]-nx*2.6-ux*1.1,p[1]-nz*2.6-uz*1.1),(p[0]-nx*2.6+ux*1.1,p[1]-nz*2.6+uz*1.1)])
    if not road.buffer(.15).covers(mouth):continue
    baypolys.append(poly);parking.append({'point':coord(p),'angle':angle,'width':2.55,'depth':5,'row':f'{li}-{si}-{side}','occupied':len(parking)%5!=0,'footprint':[coord(c) for c in poly.exterior.coords[:-1]]})
parking_land=unary_union(baypolys);lawn=site.difference(unary_union([B,road,walk,parking_land,facility_ground])).union(garden)
# Trees fill larger open lawn; low planting follows the thin strips at walls.
trees=[];shrubs=[];benches=[];lamps=[]
for _ in range(14000):
 p=Point(rng.uniform(minx,maxx),rng.uniform(minz,maxz))
 if not lawn.covers(p) or p.distance(B)<4 or p.distance(road)<2 or p.distance(walk)<1.8 or p.distance(facility_ground)<3 or p.distance(parking_land)<2:continue
 if any(p.distance(Point(t['root'][0],t['root'][2]))<6.5 for t in trees):continue
 trees.append({'id':f'rule-tree-{len(trees)}','root':[p.x,.12,p.y],'height':6+rng.random()*3,'radius':2.6,'clearance':2.6,'kind':'tree','asset':'cherry' if len(trees)%5==0 else 'zelkova','source':'building-first-rules'})
 if len(trees)>=140:break
for b in buildings:
 for line in lines(b['poly'].buffer(.95,join_style=2).boundary):
  for n in range(int(line.length/1.15)):
   p=line.interpolate(n*1.15)
   if not garden.buffer(-.25).contains(p):continue
   shrubs.append({'point':coord(p.coords[0]),'radius':.55+rng.random()*.2,'height':.45+rng.random()*.2,'tone':len(shrubs)%4})
for line in lines(walk.boundary):
 for n in range(1,int(line.length/22)):
  p=line.interpolate(n*22)
  if p.distance(road)>.7 and p.distance(B)>3 and p.distance(facility_ground)>2:lamps.append(coord(p.coords[0]))
# Standalone benches follow pedestrian space near garden edges, not road centers.
for f in facilities:
 if f['kind']!='pergola':continue
 p=Point(f['point']);q=nearest_points(p,walk)[1]
 benches.append({'point':coord(q.coords[0]),'angle':f['angle']})
ramps=unary_union([f['_poly'] for f in facilities if f['kind']=='ramp'])
# Zebra stripes mark the road crossing; they do not raise a sidewalk over asphalt.
stripes=[]
for p in polys(crossing_land):
 corners=list(p.minimum_rotated_rectangle.exterior.coords)
 a,b=max(zip(corners,corners[1:]),key=lambda edge:math.dist(*edge))
 angle=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]));flat=affinity.rotate(p,-angle,origin=(0,0))
 min_a,min_b,max_a,max_b=flat.bounds
 for n in range(math.floor(min_a/.8),math.ceil(max_a/.8)):
  x=n*.8
  stripe=Polygon([(x,min_b),(x+.4,min_b),(x+.4,max_b),(x,max_b)]).intersection(flat)
  stripes.append(affinity.rotate(stripe,angle,origin=(0,0)))

# Keep ground apertures for the descending ramp meshes.
surfaces={k:rings(g.difference(ramps)) for k,g in {'site':site,'garden':lawn,'walk':walk.union(facility_ground.difference(road)),'road':road,'parking':parking_land,'crosswalk':unary_union(stripes)}.items()}
# Round the data only after validation so classification is stable.
qa={'buildings':len(buildings),'entries':len(entries),'parkingBays':len(parking),'cars':sum(p['occupied'] for p in parking),'facilities':{k:sum(f['kind']==k for f in facilities) for k in specs},'trees':len(trees),'shrubs':len(shrubs),'roadComponents':len(polys(road)),'gardenWidth':GARDEN,'walkWidth':WALK,'roadWidth':ROAD,'crosswalks':len(polys(crossing_land)),'inputRoadsUsed':0,'inputParkingRowsUsed':0}
assert len(entries)==len(buildings),qa
assert len(polys(road))==1, [(p.area,p.bounds) for p in polys(road)]
assert road.intersection(B).area<.01
assert walk.intersection(B).area<.01
assert len(parking)>30,qa
assert all(qa['facilities'][k]>0 for k in specs),qa
assert parking_land.intersection(walk.union(B).union(facility_ground)).area<.01
for f in facilities:del f['_poly']
result={'version':1,'method':'building-first-rules','rules':{'gardenWidth':GARDEN,'walkWidth':WALK,'roadWidth':ROAD,'parkingWidth':2.55,'parkingDepth':5,'seed':20261029},'origin':origin,'bounds':dict(zip(['minX','minZ','maxX','maxZ'],site.bounds)),'surfaces':surfaces,'entries':entries,'facilities':facilities,'parking':parking,'trees':trees,'shrubs':shrubs,'lamps':lamps,'benches':benches,'gate':coord(gate),'qa':qa}
(OUT/'rule-plan.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
(OUT/'rule-validation.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2))
print(json.dumps(qa,ensure_ascii=False,indent=2))
