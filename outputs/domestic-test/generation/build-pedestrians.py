"""Road-edge walking-pose extras. Placement is inferred, not real resident data."""
import json,math,random
from pathlib import Path
import numpy as np
from shapely.geometry import Point,Polygon,LineString,box,shape
from shapely.ops import unary_union
from site_geometry import Site
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC;site=Site(ROOT,ORIGIN);r=json.load(open(REPORT/'alley-placement-report-v23.json'));catalog=json.load(open(SHARED/'people/catalog.json'))['people'];ap=json.load(open(ROOT/'attached-structures.json'));sp=json.load(open(ROOT/'streetscape.json'));up=json.load(open(ROOT/'utilities.json'));parcels=json.load(open(ROOT/'parcels.json'))
# Reserve the entire rotating sprite silhouette, not only the torso centre.
radius=max(max(abs(f['rect'][0]-f['anchorPixels'][0]),abs(f['rect'][0]+f['rect'][2]-f['anchorPixels'][0]))/f['bodyHeightPixels']*p['height'] for p in catalog for f in p['frames'])+.12
walls=[LineString(w['points']).buffer(.15) for w in sp['wallRuns']]+[Polygon(p['footprint']) for p in sp['piers']]+[Polygon(p[k]) for g in sp['gates'] for p in g['pieces'] for k in ['post','leaf']]
props=[Polygon(p['footprint']) for p in r['placements'] if p['id'] not in range(201,206) and p.get('lift',0)<1.85]
fixed=unary_union([site.built,*walls,*props,*[Polygon(s['footprint']) for s in ap['structures']],*[Point(p['x'],p['z']).buffer(p['radius']+.05) for p in up['poles']]])
entries=unary_union([LineString(y['entrance']).buffer(.95) for y in parcels['yards'] if y['entrance']]+[Polygon(p['polygon']).buffer(.40) for p in ap['drives']]);limits=box(-128,-128,128,128);candidates=[]
walking=site.road
if (ROOT/'road-reservation.json').exists():
 reservation=json.loads((ROOT/'road-reservation.json').read_text())
 if reservation.get('surfaces'):walking=site.road.difference(shape(reservation['surfaces']['carriageway']))
polys=[walking] if walking.geom_type=='Polygon' else [p for p in getattr(walking,'geoms',[]) if p.geom_type=='Polygon']
for poly in polys:
 for ring in [poly.exterior,*poly.interiors]:
  line=LineString(ring.coords)
  for t in np.arange(2,line.length-2,3.2):
   q=line.interpolate(float(t));a=line.interpolate(float(t)-1.2);b=line.interpolate(float(t)+1.2);L=a.distance(b)
   if L<1.9:continue
   ux,uz=(b.x-a.x)/L,(b.y-a.y)/L;nx,nz=-uz,ux
   if not walking.covers(Point(q.x+nx*.45,q.y+nz*.45)):nx,nz=-nx,-nz
   for off in [radius+.16,radius+.36,radius+.56]:
    x,z=q.x+nx*off,q.y+nz*off;pt=Point(x,z);fp=pt.buffer(radius)
    if not limits.covers(fp) or not walking.covers(fp) or fp.intersects(fixed) or fp.intersects(entries):continue
    hs=[site.height(x+dx,z+dz) for dx,dz in [(0,0),(radius,0),(-radius,0),(0,radius),(0,-radius)]]
    if max(hs)-min(hs)>.20:continue
    direction=1 if (int(abs(x)*13+abs(z)*19)%2) else -1
    candidates.append({'x':x,'z':z,'heading':math.atan2(ux*direction,uz*direction),'ground':site.height(x,z),'grade':max(hs)-min(hs),'roadEdgeDistance':site.road.boundary.distance(pt),'ux':ux,'uz':uz});break
# Vary spacing deterministically and distribute across lanes. Avoid mechanically repeating crowds.
selected=[]
# A balanced shuffled cycle keeps every catalog type visible as the library grows.
character_order=list(catalog);random.Random(26).shuffle(character_order)
for c in sorted(candidates,key=lambda p:math.hypot(p['x'],p['z'])+.3*math.sin(p['x']*12.7+p['z']*4.3)):
 if any(math.hypot(c['x']-p['x'],c['z']-p['z'])<12.5 for p in selected):continue
 if sum(math.hypot(c['x']-p['x'],c['z']-p['z'])<30 for p in selected)>=5:continue
 i=len(selected);character=character_order[i%len(character_order)];selected.append({**c,'id':i+1,'character':character['id'],'height':character['height'],'radius':radius,'pose':'walk-mid-stride','animated':False})
 if len(selected)==42:break
qa={'people':len(selected),'characters':len(set(p['character'] for p in selected)),'imageDirections':8,'fullSpriteSafetyRadius':radius,'minimumSpacing':min((math.hypot(p['x']-q['x'],p['z']-q['z']) for i,p in enumerate(selected) for q in selected[:i]),default=0),'maxGroundVariation':max((p['grade'] for p in selected),default=0),'buildingOrPropOverlap':0,'entranceOverlap':0,'outsideRoadArea':0}
for p in selected:
 fp=Point(p['x'],p['z']).buffer(radius);qa['buildingOrPropOverlap']+=fp.intersection(fixed).area;qa['entranceOverlap']+=fp.intersection(entries).area;qa['outsideRoadArea']+=fp.difference(site.road).area
assert DYNAMIC or (len(selected)>=24 and qa['characters']==len(catalog))
assert max(qa[k] for k in ['buildingOrPropOverlap','entranceOverlap','outsideRoadArea'])<1e-7
out={'version':26,'rule':'8-direction image cutouts; frozen ordinary walking poses; clear road-edge locations, full rotating silhouette clearance, no door/driveway occupation. Fictional extras, inferred placement.','people':selected,'qa':qa};(ROOT/'people/placements.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));(REPORT/'pedestrian-placement-validation-v26.json').write_text(json.dumps(qa,indent=2));print(qa)
