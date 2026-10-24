"""Road-facing Korean security lights; artistic locations, not surveyed fixtures."""
import json,math
from pathlib import Path
from shapely.geometry import Point,LineString,Polygon
from shapely.ops import unary_union,nearest_points
from site_geometry import Site
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC;site=Site(ROOT,ORIGIN);up=json.load(open(ROOT/'utilities.json'));ap=json.load(open(ROOT/'attached-structures.json'))
roofs=unary_union([Polygon(s['footprint']).buffer(.15) for s in ap['structures'] if s['roofKind']!='none']);blocked=site.built.union(roofs)
lamps=[]
for p in up['poles']:
 x,z=p['x'],p['z'];nx,nz=-p['nx'],-p['nz'];head=Point(x+nx*1.15,z+nz*1.15)
 if blocked.intersects(LineString([(x+nx*.2,z+nz*.2),head.coords[0]]).buffer(.16)):continue
 if not site.road.buffer(.15).covers(head):continue
 lamps.append({'id':'pole-light-'+str(p['id']),'type':'pole','poleId':p['id'],'root':[x,site.height(x,z),z],'direction':[nx,nz],'height':5.5 if p['width']<6 else 6.1,'reach':1.15,'variant':p['id']%3})
# Wall brackets fill dark stretches without placing additional posts in narrow lanes.
for owner,poly in site.buildings.items():
 if len(lamps)>=60:break
 coords=list(poly.exterior.coords);area=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(coords,coords[1:]));sign=1 if area>=0 else -1
 for a,b in zip(coords,coords[1:]):
  length=math.dist(a,b)
  if length<3.8:continue
  ux,uz=(b[0]-a[0])/length,(b[1]-a[1])/length;nx,nz=uz*sign,-ux*sign;x,z=a[0]+(b[0]-a[0])*.23,a[1]+(b[1]-a[1])*.23
  if max(abs(x),abs(z))>145:continue
  root=Point(x+nx*.10,z+nz*.10);roadPoint=nearest_points(root,site.road)[1];gap=root.distance(roadPoint)
  if gap>.9 or gap<.12 or (roadPoint.x-root.x)*nx+(roadPoint.y-root.y)*nz<gap*.7:continue
  if lamps and min(math.hypot(x-l['root'][0],z-l['root'][2]) for l in lamps)<18:continue
  head=Point(x+nx*.85,z+nz*.85)
  if blocked.intersects(LineString([(x+nx*.18,z+nz*.18),head.coords[0]]).buffer(.12)):continue
  lamps.append({'id':'wall-light-'+str(owner),'type':'wall','owner':owner,'root':[root.x,site.height(roadPoint.x,roadPoint.y),root.y],'direction':[nx,nz],'height':3.8,'reach':.75,'variant':owner%3});break
qa={'total':len(lamps),'poleMounted':sum(l['type']=='pole' for l in lamps),'wallMounted':sum(l['type']=='wall' for l in lamps),'newPostsInRoad':0,'headBuildingOverlaps':sum(site.built.covers(Point(l['root'][0]+l['direction'][0]*l['reach'],l['root'][2]+l['direction'][1]*l['reach'])) for l in lamps)}
assert (DYNAMIC or qa['total']>20) and qa['headBuildingOverlaps']==0,qa
out={'version':32,'source':'inferred security-light positions; reused poles and wall brackets; no surveyed streetlight inventory','lights':lamps,'qa':qa}
(ROOT/'environment/streetlights.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));(REPORT/'environment-v32/streetlight-validation.json').write_text(json.dumps(qa,indent=2));print(qa)
