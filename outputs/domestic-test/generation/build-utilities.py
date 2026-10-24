"""Place roadside utility networks, never preserve a pole at the cost of a blocked road.
All positions are inferred. Observations drive style; hard geometry constraints decide feasibility.
"""
import json,math
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union,nearest_points
from site_geometry import Site
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC;rules=json.load(open(ROOT/'site-rules.json'));cfg=rules['poles'];site=Site(ROOT,rules['origin']);road=site.road
parcel=json.load(open(ROOT/'parcels.json'));arch=json.load(open(ROOT/'attached-structures.json'));street=json.load(open(ROOT/'streetscape.json'))
entrances=unary_union([LineString(y['entrance']).buffer(.9) for y in parcel['yards'] if y['entrance']]+[Polygon(d['polygon']) for d in arch['drives']]+[Polygon(s['entryApron']) for s in arch['structures'] if s['entryApron']])
wall=unary_union([LineString(r['points']).buffer(.145) for r in street['wallRuns'] if r['style']!='villa-curb']+[LineString([r['a'],r['b']]).buffer(.145) for r in street['connections']]+[Polygon(p['footprint']) for p in street['piers']]+[Polygon(p[k]) for g in street['gates'] for p in g['pieces'] for k in ['post','leaf']])
architecture=unary_union([Polygon(s['footprint']) for s in arch['structures']]);limit=box(*rules['localBounds'])
forbidden=site.built.buffer(cfg['buildingClearance']).union(architecture.buffer(.25)).union(entrances.buffer(cfg['entranceClearance'])).union(wall.buffer(.11))
S.prepare(forbidden);S.prepare(road)
# Follow the continuous boundaries of actual road polygons. Normal probes decide which side is public road.
polygons=[road] if road.geom_type=='Polygon' else list(road.geoms);candidates=[]
for polygon in polygons:
 for ring in [polygon.exterior,*polygon.interiors]:
  line=LineString(ring.coords)
  for t in np.arange(0,line.length,cfg['sampleStep']):
   q=line.interpolate(float(t));qa=line.interpolate(max(0,float(t)-.8));qb=line.interpolate(min(line.length,float(t)+.8));L=qa.distance(qb)
   if L<.2:continue
   ux,uz=(qb.x-qa.x)/L,(qb.y-qa.y)/L;nx,nz=-uz,ux
   if road.covers(Point(q.x+nx*.25,q.y+nz*.25)):nx,nz=-nx,-nz
   if not road.covers(Point(q.x-nx*.55,q.y-nz*.55)):continue
   for offset in cfg['edgeOffsets']:
    x,z=q.x+nx*offset,q.y+nz*offset;pt=Point(x,z);fp=pt.buffer(cfg['radius']+.08)
    if not limit.covers(fp) or fp.intersects(forbidden) or fp.intersects(road):continue
    if road.boundary.distance(pt)>1:continue
    if abs(site.height(x,z)-site.height(q.x-nx*.5,q.y-nz*.5))>.45:continue
    # Keep poles out of the actual corner, but favor stable long facade edges nearby.
    bend=0
    for side in [-1,1]:
     qfar=line.interpolate(min(line.length,max(0,float(t)+side*4)))
     vx,vz=qfar.x-q.x,qfar.y-q.y;vl=math.hypot(vx,vz)
     if vl>.2:bend=max(bend,1-abs((vx*ux+vz*uz)/vl))
    if bend>.20:continue
    width=0
    for d in np.arange(.5,14,.5):
     if not road.covers(Point(q.x-nx*d,q.y-nz*d)):break
     width=float(d)
    candidates.append({'x':x,'z':z,'edge':[q.x,q.y],'ux':ux,'uz':uz,'nx':nx,'nz':nz,'width':width,'score':offset*3+site.built.distance(pt)*.05+bend*10,'height':site.height(x,z)});break
print('valid edge candidates',len(candidates),flush=True)
# A sparse network: prefer continuing the same side of a street, with no shortcut through a block.
wireForbidden=site.built.buffer(cfg['wireBuildingClearance']).union(architecture.buffer(.18));S.prepare(wireForbidden)
nearRoad=road.buffer(1.4);S.prepare(nearRoad)
def span(a,b):
 length=math.hypot(a['x']-b['x'],a['z']-b['z'])
 if length<cfg['minSpacing'] or length>cfg['maxSpan']:return None
 line=LineString([(a['x'],a['z']),(b['x'],b['z'])])
 if line.intersects(wireForbidden) or not nearRoad.covers(line):return None
 # All conductors sit on the road-facing half of the arm, with finite cable radius.
 for off in [-.18,-.55,-.92]:
  strand=LineString([(a['x']+a['nx']*off,a['z']+a['nz']*off),(b['x']+b['nx']*off,b['z']+b['nz']*off)])
  if strand.buffer(.025).intersects(wireForbidden):return None
 # Ribbons rather than Euclidean-only links. Crossing the street is a secondary option.
 dx,dz=(b['x']-a['x'])/length,(b['z']-a['z'])/length
 same=a['nx']*b['nx']+a['nz']*b['nz']>.5
 alignment=abs(dx*a['ux']+dz*a['uz'])+abs(dx*b['ux']+dz*b['uz'])
 if alignment<1.1:return None
 return (abs(length-cfg['preferredSpacing'])+(0 if same else 12)+(2-alignment)*8,length)
selected=[];available=set(range(len(candidates)))
while available:
 options=[]
 for i in available:
  a=candidates[i];ds=[math.hypot(a['x']-b['x'],a['z']-b['z']) for b in selected]
  if ds and min(ds)<cfg['minSpacing']:continue
  links=[(span(a,b),j) for j,b in enumerate(selected) if ds[j]<=cfg['maxSpan']];links=[(s,j) for s,j in links if s]
  if links:
   score,j=min(links,key=lambda r:r[0][0]);priority=score[0]+a['score'];parent=j
  else:
   # Start a new disconnected street only when the nearby network cannot reach it.
   priority=100+a['score']+math.hypot(a['x'],a['z'])*.006;parent=None
  options.append((priority,i,parent))
 if not options:break
 _,i,parent=min(options);a=dict(candidates[i]);a['id']=len(selected);a['parent']=parent;selected.append(a)
 available={j for j in available if math.hypot(candidates[j]['x']-a['x'],candidates[j]['z']-a['z'])>=cfg['minSpacing']}
# Kruskal-style street-constrained spans, bounded degree, then a few local branches.
edges=[];degree=[0]*len(selected);parent=list(range(len(selected)))
def find(a):
 while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
 return a
choices=[]
for i,a in enumerate(selected):
 for j,b in enumerate(selected[:i]):
  s=span(a,b)
  if s:choices.append((s[0],i,j,s[1]))
for score,i,j,length in sorted(choices):
 if degree[i]>=cfg['maxDegree'] or degree[j]>=cfg['maxDegree'] or find(i)==find(j):continue
 a,b=selected[i],selected[j];clearances=[]
 for t in np.linspace(0,1,25):
  x,z=a['x']*(1-t)+b['x']*t,a['z']*(1-t)+b['z']*t;y=(a['height']+6.5)*(1-t)+(b['height']+6.5)*t-math.sin(math.pi*t)*min(.55,length*.016)
  clearances.append(y-site.height(x,z))
 if min(clearances)<cfg['minimumWireGroundClearance']:continue
 edges.append({'a':i,'b':j,'length':length,'minimumClearance':min(clearances)});degree[i]+=1;degree[j]+=1;parent[find(i)]=find(j)
# Remove isolated poles: no dangling unsupported wires or arbitrary decorative poles.
used={e[k] for e in edges for k in ['a','b']};mapping={i:n for n,i in enumerate(sorted(used))};poles=[]
for i in sorted(used):
 p=selected[i];p['id']=mapping[i];p.pop('parent',None);p['kind']='distribution' if p['width']>=5 or degree[i]>=3 else 'alley';p['poleHeight']=9.2 if p['kind']=='distribution' else 8.4;p['radius']=cfg['radius'];poles.append(p)
for e in edges:e['a']=mapping[e['a']];e['b']=mapping[e['b']]
# House drops terminate on the outside face of a building, never in the middle of a roof.
drops=[]
for pole in poles:
 opts=[];q=Point(pole['x'],pole['z'])
 for owner,b in site.buildings.items():
  target=nearest_points(q,b)[1];dist=q.distance(target)
  if not 1.2<dist<13:continue
  dx,dz=(q.x-target.x)/dist,(q.y-target.y)/dist;end=Point(target.x+dx*.22,target.y+dz*.22);line=LineString([q,end])
  if line.intersects(site.built.buffer(.09)) or line.intersects(architecture):continue
  y=site.height(target.x,target.y)+min(5.4,site.levels[owner]*3-.45)
  if y-site.height(end.x,end.y)<3.7:continue
  opts.append((dist,owner,end,y))
 for dist,owner,end,y in sorted(opts,key=lambda v:v[0])[:2]:drops.append({'pole':pole['id'],'owner':owner,'end':[end.x,y,end.y]})
body=unary_union([Point(p['x'],p['z']).buffer(cfg['radius']) for p in poles]);legacy=REPORT/'placement-report.json';old_count=sum(p.get('pole',False) for p in json.load(open(legacy)).get('props_placements',[])) if legacy.exists() else None;qa={'oldImportedPoleGroups':old_count,'validCandidates':len(candidates),'poles':len(poles),'isolatedSelectionsOmitted':len(selected)-len(poles),'networkComponents':len(poles)-len(edges),'spans':len(edges),'houseDrops':len(drops),'wireFootprintClearanceChecked':True,'types':{k:sum(p['kind']==k for p in poles) for k in ['alley','distribution']},'roadBodyOverlapArea':body.intersection(road).area,'buildingBodyOverlapArea':body.intersection(site.built).area,'entranceBodyOverlapArea':body.intersection(entrances).area,'structureBodyOverlapArea':body.intersection(architecture).area,'wallBodyOverlapArea':body.intersection(wall).area,'minimumPoleDistance':min((math.hypot(a['x']-b['x'],a['z']-b['z']) for i,a in enumerate(poles) for b in poles[:i]),default=0),'minimumWireGroundClearance':min((e['minimumClearance'] for e in edges),default=0)}
assert all(qa[k]<1e-8 for k in ['roadBodyOverlapArea','buildingBodyOverlapArea','entranceBodyOverlapArea','structureBodyOverlapArea','wallBodyOverlapArea'])
out={'version':23,'source':rules['status'],'rules':cfg,'poles':poles,'spans':edges,'drops':drops,'qa':qa};(ROOT/'utilities.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')));(REPORT/'utility-validation-v23.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2));print(qa,flush=True)
