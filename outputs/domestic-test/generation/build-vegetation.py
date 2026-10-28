"""Illustrated garden trees: inferred art placement, not surveyed vegetation."""
import json,math,random
from pathlib import Path
from collections import Counter
import numpy as np
from shapely.geometry import Point,Polygon,LineString,box
from shapely.ops import unary_union
from site_geometry import Site
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC,RADIUS
site=Site(ROOT,ORIGIN);catalog=json.load(open(SHARED/'vegetation/catalog.json'))
types=[a for a in catalog['assets'] if a['kind']=='tree']
parcels=json.load(open(ROOT/'parcels.json'));ap=json.load(open(ROOT/'attached-structures.json'));sp=json.load(open(ROOT/'streetscape.json'));up=json.load(open(ROOT/'utilities.json'))
report=json.load(open(REPORT/'alley-placement-report-v23.json'))
yards=[]
for y in parcels['yards']:
 p=unary_union([Polygon(r['outer'],r['holes']).buffer(0) for r in y['rings']]);yards.append((y,p))
roofs=unary_union([Polygon(s['footprint']).buffer(.12) for s in ap['structures']])
drives=unary_union([Polygon(d['polygon']).buffer(.28) for d in ap['drives']])
entries=unary_union([LineString(y['entrance']).buffer(.95) for y in parcels['yards'] if len(y.get('entrance') or [])>1])
walls=unary_union([LineString(w['points']).buffer(.18) for w in sp['wallRuns']]+[Polygon(p['footprint']) for p in sp['piers']])
props=unary_union([Polygon(p['footprint']).buffer(.14) for p in report['placements'] if p['id'] not in range(201,206) and p.get('lift',0)<1.8])
utilities=unary_union([Point(p['x'],p['z']).buffer(.4) for p in up['poles']])
poles={p['id']:p for p in up['poles']}
cables=unary_union([LineString([(poles[s['a']]['x'],poles[s['a']]['z']),(poles[s['b']]['x'],poles[s['b']]['z'])]).buffer(.4) for s in up['spans']]+[LineString([(poles[d['pole']]['x'],poles[d['pole']]['z']),(d['end'][0],d['end'][2])]).buffer(.3) for d in up['drops']])
legacyCrowns=unary_union([Polygon(p['footprint']).buffer(.15) for p in report['placements'] if p['id'] in [121,122,154]])
rootBlock=unary_union([site.built,site.road.buffer(.55),roofs,drives,entries,walls,props,utilities])
crownBlock=unary_union([site.built.buffer(.25),roofs,site.road.buffer(.22),cables,legacyCrowns])
limits=box(-RADIUS+3,-RADIUS+3,RADIUS-3,RADIUS-3)
counts=Counter();ownerCount=Counter();trees=[];candidates=[];rng=random.Random(3107)
for y,poly in yards:
 if poly.area<12:continue
 minx,minz,maxx,maxz=poly.bounds
 for x in np.arange(minx+.9,maxx-.4,2.3):
  for z in np.arange(minz+.9,maxz-.4,2.3):
   p=Point(x,z)
   if not poly.covers(p) or not limits.covers(p) or rootBlock.distance(p)<.48:continue
   clear=crownBlock.distance(p)
   if clear<.83:continue
   # Favour pockets near buildings and spread the selection across the neighbourhood.
   score=min(clear,2.6)*2+min(poly.area,90)*.007+rng.random()*.7
   candidates.append((score,float(x),float(z),int(y['owner']),float(clear),poly.area))
candidates.sort(reverse=True)
for score,x,z,owner,clear,area in candidates:
 if len(trees)>=96:break
 if ownerCount[owner]>=(2 if area>95 else 1):continue
 if any(math.hypot(x-t['root'][0],z-t['root'][2])<t['radius']+1.2+.7 for t in trees):continue
 ranked=sorted(types,key=lambda a:(counts[a['id']],(abs(owner)*31+sum(map(ord,a['id'])))%101))
 chosen=None
 for a in ranked:
  scale=min(1.12,max(.65,min(clear-.08,2.6)/a['radius']))
  radius=a['radius']*scale;height=a['height']*scale
  if radius>clear-.03 or height<2.8:continue
  crown=Point(x,z).buffer(radius,resolution=24)
  if crown.intersects(crownBlock):continue
  if any(math.hypot(x-t['root'][0],z-t['root'][2])<radius+t['radius']+.6 for t in trees):continue
  # Keep branch volumes away from utility poles and their overhead cable runs.
  if utilities.distance(Point(x,z))<radius+.25:continue
  heights=[site.height(x+math.cos(t)*radius,z+math.sin(t)*radius) for t in np.arange(0,math.tau,math.tau/8)]
  if max(heights)-min(heights)>.9:continue
  chosen=(a,scale,radius,height);break
 if not chosen:continue
 a,scale,radius,height=chosen
 trees.append({'id':'garden-tree-'+str(len(trees)+1),'asset':a['id'],'kind':'tree','root':[round(x,4),round(site.height(x,z)+.015,4),round(z,4)],'height':round(height,4),'radius':round(radius,4),'heading':round(rng.random()*math.tau,5),'owner':owner,'source':'inferred private-yard pocket','clearance':round(clear,4)})
 counts[a['id']]+=1;ownerCount[owner]+=1
assert DYNAMIC or len(counts)==10,(len(trees),counts)
# Independent final intersection checks use the serialized, rounded coordinates.
qa={'newGardenTrees':len(trees),'species':dict(counts),'buildingCrownOverlaps':0,'roadCrownOverlaps':0,'structureCrownOverlaps':0,'blockedRootPositions':0,'treeCrownOverlaps':0}
for i,t in enumerate(trees):
 q=Point(t['root'][0],t['root'][2]);c=q.buffer(t['radius'],resolution=24)
 qa['buildingCrownOverlaps']+=int(c.intersection(site.built).area>1e-6)
 qa['roadCrownOverlaps']+=int(c.intersection(site.road).area>1e-6)
 qa['structureCrownOverlaps']+=int(c.intersection(roofs).area>1e-6)
 qa['blockedRootPositions']+=int(q.buffer(.4).intersects(rootBlock))
 for b in trees[:i]:qa['treeCrownOverlaps']+=int(q.distance(Point(b['root'][0],b['root'][2]))<t['radius']+b['radius'])
assert not any(qa[k] for k in qa if k.endswith('Overlaps') or k=='blockedRootPositions'),qa
out={'version':31,'rule':'private garden pockets; full crown outside buildings, road and annex roofs; trunk outside entrances, driveways, props and wall footings; sparse owner-based spacing; not surveyed tree positions','trees':trees,'qa':qa}
(ROOT/'vegetation/placements.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
(REPORT/'vegetation-v31/placement-validation.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2));print(qa)
