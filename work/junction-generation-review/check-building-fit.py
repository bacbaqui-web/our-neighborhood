import sys,json,base64,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from shapely.geometry import shape,Point,box
from shapely.ops import transform,unary_union
from road_priority import scales
j=json.load(open(sys.argv[1]));read=lambda n:json.loads(base64.b64decode(j['files'][n]));ip=read('generation-input.json');lat,lon=j['manifest']['origin'];sx,sy=scales(lat)
local=lambda f:transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry']))
original=ip['sourceBuildingCollection']['features'];fitted=ip['buildingCollection']['features'];rs=ip['sourceRoads'];extent=box(-134,-134,134,134)
protected=unary_union([shape(r['geometry']).buffer(r['width']/2+r.get('sidewalkEachSide',0)+(0.8 if r.get('streetType')=='shared' else 0),cap_style=2,join_style=2).intersection(extent) for r in rs]).buffer(.4,join_style=2)
print('circle100',sum(local(f).intersects(Point(0,0).buffer(100,quad_segs=128)) for f in fitted));print('circle130',sum(local(f).intersects(Point(0,0).buffer(130,quad_segs=128)) for f in fitted))
f=next(f for f in original if f['properties']['objectid']==1100785868);g=local(f);print('omitted',f['properties'], 'area',g.area,'distance',g.centroid.distance(Point(0,0)),'centroid',list(g.centroid.coords),'protected overlap',g.intersection(protected).area, 'remaining',g.difference(protected).area)
near=sorted(rs,key=lambda r:shape(r['geometry']).distance(g))[:5]
for r in near:print('near',r['editId'],r['grade'],r['width'],r.get('sidewalkEachSide'),r['properties'],shape(r['geometry']).distance(g))
# Parallel one-way centreline distances and independent inferred widths.
major=[r for r in rs if r['grade']>=3]
for i,a in enumerate(major):
 for b in major[i+1:]:
  la,lb=shape(a['geometry']),shape(b['geometry']);pa,pb=list(la.coords),list(lb.coords);va=[pa[-1][k]-pa[0][k] for k in [0,1]];vb=[pb[-1][k]-pb[0][k] for k in [0,1]];cos=abs(sum(x*y for x,y in zip(va,vb))/(math.hypot(*va)*math.hypot(*vb)))
  if cos>.95 and la.distance(lb)>1 and la.distance(lb)<25:
   print('parallel',a['editId'],b['editId'],'grades',a['grade'],b['grade'],'widths',a['width'],b['width'],'minGap',la.distance(lb),'overlapRoadArea',la.buffer(a['width']/2,cap_style=2).intersection(lb.buffer(b['width']/2,cap_style=2)).area)
from road_priority import fit_buildings
import copy,time
b=copy.deepcopy(ip['sourceBuildingCollection']);t=__import__('time').monotonic();changed,omitted=fit_buildings(b,protected,rs,[lat,lon]);print('reproduced',len(changed),omitted,'seconds',round(__import__('time').monotonic()-t,3))
# Locate the same small building's residual without carriageway exclusion to distinguish sources.
for name,subset in [('paths only',[r for r in rs if r['grade']==0]),('major only',[r for r in rs if r['grade']>=3])]:
 p=unary_union([shape(r['geometry']).buffer(r['width']/2+r.get('sidewalkEachSide',0),cap_style=2,join_style=2).intersection(extent) for r in subset]).buffer(.4,join_style=2)
 print(name,'overlap original m2',g.intersection(p).area,'residual',g.difference(p).area)
