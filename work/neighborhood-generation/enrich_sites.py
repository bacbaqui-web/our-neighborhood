"""Dense foliage, two construction states, restrained parking wear. Local inferred sites."""
# Direct script execution is a compatibility boundary; normal imports are namespaced.
if not __package__:
 from pathlib import Path as _Path
 import runpy as _runpy
 _runpy.run_path(str(_Path(__file__).with_name('legacy.py')))['ensure_package']()
 __package__='neighborhood_generation'
import json,random,math
from pathlib import Path
from shapely.geometry import shape,Point,LineString,box,mapping
from shapely.ops import unary_union,nearest_points
def build(context):
 OUT=context.output
 d=json.loads((OUT/'ground-infill.json').read_text());base=json.loads((OUT/'infill-plots.json').read_text());road=shape(base['road']);houses=unary_union([shape(b['building']) for b in base['buildings']]);parking=unary_union([shape(v['footprint']) for v in d['bays']]);access=unary_union([shape(v['access']) for v in json.loads((OUT/'ground-floors.json').read_text())['plans']]+[shape(a) for v in json.loads((OUT/'piloti.json').read_text())['plans'] for a in v['access']]);blocked=road.union(houses).union(parking).union(access)
 rng=random.Random(637);props=[];fences=[];patches=[];sites=[];newplants=[];replaced=set();construction=0
 for zi,z in enumerate(d['zones']):
  if z['kind'] not in ['green','garden','wild','construction','parking']:continue
  p=shape(z['geometry']);safe=p.difference(blocked.buffer(.16));kind=z['kind']
  if kind=='construction':
   kind='abandoned' if construction%2 else 'active';construction+=1;z['kind']=kind;z['reason']='방치된 기초와 무성한 풀' if kind=='abandoned' else '기초 공사·굴착기·자재 적치'
  if p.is_empty:continue
  focus=list(p.representative_point().coords[0]);z['focus']=focus;z['area']=round(p.area,1)
  if kind in ['active','abandoned','parking','garden','wild']:sites.append({'kind':kind,'focus':focus,'area':p.area,'zone':zi})
  claimed=[]
  def place(typ,w,h,count):
   bounds=safe.bounds
   if safe.is_empty:return
   for trial in range(count*150):
    if sum(q['type']==typ and q['zone']==zi for q in props)>=count:break
    x=rng.uniform(bounds[0],bounds[2]);y=rng.uniform(bounds[1],bounds[3]);foot=box(x-w/2,y-h/2,x+w/2,y+h/2)
    if safe.covers(foot) and all(foot.distance(v)>.7 for v in claimed):props.append(dict(type=typ,point=[x,y],zone=zi,footprint=mapping(foot)));claimed.append(foot)
  if kind=='active':place('excavator',4.8,4,1);place('foundation',4.6,4.6,2);place('materials',2.6,2.2,3);place('soil',3,2.8,2)
  if kind=='abandoned':place('ruin',3.2,3.2,2)
  if kind in ['green','garden','wild','abandoned']:
   replaced.add(zi);allowed=safe.difference(unary_union(claimed).buffer(.15));trees=[]
   x0,y0,x1,y1=allowed.bounds if not allowed.is_empty else (0,0,0,0)
   # Overlapping crowns and a separate tall undergrowth layer, not isolated tiny shrubs.
   step=3.3
   for ix in range(int((x1-x0)/step)+1):
    for iy in range(int((y1-y0)/step)+1):
     q=Point(x0+(ix+.5)*step+rng.uniform(-.6,.6),y0+(iy+.5)*step+rng.uniform(-.6,.6));r=rng.uniform(1.7,2.5)
     if kind=='abandoned':r*=.75
     if allowed.covers(q.buffer(r)):
      trees.append(q);newplants.append(dict(point=[q.x,q.y],radius=r,height=rng.uniform(5,8.5) if kind!='abandoned' else rng.uniform(3.5,5.5),kind='tree',zone=zi,dense=True))
   step=1.05 if kind!='green' else .85
   for ix in range(int((x1-x0)/step)+1):
    for iy in range(int((y1-y0)/step)+1):
     q=Point(x0+(ix+.5)*step+rng.uniform(-.2,.2),y0+(iy+.5)*step+rng.uniform(-.2,.2));r=rng.uniform(.52,.8)
     if allowed.covers(q.buffer(r)):
      newplants.append(dict(point=[q.x,q.y],radius=r,height=rng.uniform(.75,1.65),kind='cover',zone=zi,dense=True))
  # Closed panel boundaries leave one usable entry; wire boundaries leave access gaps.
  if kind in ['active','abandoned']:
   d['walls']=[w for w in d['walls'] if not (w.get('kind')=='panel' and p.buffer(.4).covers(LineString([w['a'],w['b']])))]
   inner=p.buffer(-.25,join_style=2);entry=nearest_points(p,road)[0]
   ring=inner.boundary.difference(entry.buffer(2.2 if kind=='active' else .8).union(access.buffer(.2)).union(blocked.buffer(.16)))
   for line in ([ring] if ring.geom_type=='LineString' else getattr(ring,'geoms',[])):
    if line.geom_type!='LineString':continue
    for a,b in zip(line.coords,list(line.coords)[1:]):
     if math.dist(a,b)>.3:d['walls'].append(dict(a=list(a),b=list(b),height=3,kind='panel',zone=zi))
  if kind in ['garden','wild','parking'] and p.area>60:
   inner=p.buffer(-.25,join_style=2);entry=nearest_points(p,road)[0];opening=entry.buffer(2.4 if kind=='parking' else .8)
   ring=inner.boundary.difference(opening.union(access.buffer(.2)).union(blocked.buffer(.1)))
   for line in ([ring] if ring.geom_type=='LineString' else getattr(ring,'geoms',[])):
    if line.geom_type!='LineString':continue
    for a,b in zip(line.coords,list(line.coords)[1:]):
     if math.dist(a,b)>.3:fences.append(dict(a=list(a),b=list(b),height=1.5,zone=zi))
  if kind=='parking':
   x0,y0,x1,y1=p.bounds
   for _ in range(16):
    x=rng.uniform(x0,x1);y=rng.uniform(y0,y1);w=rng.uniform(.6,2.4);h=rng.uniform(.5,1.8);q=box(x-w/2,y-h/2,x+w/2,y+h/2)
    if p.covers(q):patches.append(dict(geometry=mapping(q),tone=rng.randrange(3)))
 for wall in d['walls']:
  if wall.get('kind')=='panel':wall['height']=3
 d['plants']=[v for v in d['plants'] if v.get('zone') not in replaced]+newplants
 d['siteDetails']=dict(props=props,fences=fences,patches=patches,sites=sites)
 qa={'trees':sum(v['kind']=='tree' for v in newplants),'tallPlantClumps':sum(v['kind']!='tree' for v in newplants),'activeSites':sum(v['kind']=='active' for v in sites),'abandonedSites':sum(v['kind']=='abandoned' for v in sites),'props':len(props),'fenceSegments':len(fences),'parkingPatches':len(patches),'plantBlockedOverlap':sum(Point(v['point']).buffer(v['radius']).intersection(blocked).area for v in newplants),'propBlockedOverlap':sum(shape(v['footprint']).intersection(blocked).area for v in props),'fenceBlockedOverlap':sum(LineString([v['a'],v['b']]).buffer(.035).intersection(blocked).area for v in fences)}
 assert max(qa[k] for k in ['plantBlockedOverlap','propBlockedOverlap','fenceBlockedOverlap'])<1e-6,qa
 d['qa']['plants']=len(d['plants']);d['siteDetails']['qa']=qa
 (OUT/'enriched-infill.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));(OUT/'site-enrichment-qa.json').write_text(json.dumps(qa,indent=2));print(qa)
 return qa

if __name__=='__main__':
 from .legacy import run_cli
 run_cli('enrich_sites')
