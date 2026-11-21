import os
"""Deterministic per-building ground-floor variants; inferred use, geometry constrained."""
import json,math,random
from pathlib import Path
from shapely.geometry import shape,Point,Polygon,LineString,mapping
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2];OUT=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(ROOT/'outputs/domestic-test/house-plots-test')))
LABELS={'gate-solid':'높은 담장과 대문','gate-rail':'낮은 담장과 철제 울타리','lobby-center':'가운데 현관','lobby-side':'옆으로 들어간 현관','lobby-steps':'계단식 현관','shop-single':'통유리 점포','shop-pair':'두 점포와 공용 입구','shop-shutter':'셔터와 점포','basement-ramp':'지하주차장 진입로'}
def build():
 d=json.loads((OUT/'infill-plots.json').read_text());inf=json.loads((OUT/'piloti-infill.json').read_text());pil=json.loads((OUT/'piloti.json').read_text());ids={v['id'] for v in pil['plans']};road=shape(d['road']);rc=road.buffer(-.35);plans=[]
 for b in d['buildings']:
  if b['id'] in ids:continue
  p=shape(b['building']);plot=shape(b['plot']);profile=b.get('streetProfile')
  if p.geom_type!='Polygon' or p.interiors or b['levels']<1:continue
  others=unary_union([shape(v['building']) for v in d['buildings'] if v['id']!=b['id'] and p.distance(shape(v['building']))<18]);opts=[]
  ring=list(p.exterior.coords)
  for i,(a,c) in enumerate(zip(ring,ring[1:])):
   if profile and i!=profile['frontEdge']:continue
   L=math.dist(a,c)
   if L<(2.4 if profile else 5):continue
   u=((c[0]-a[0])/L,(c[1]-a[1])/L);n=(-u[1],u[0]);mid=((a[0]+c[0])/2,(a[1]+c[1])/2)
   if not p.contains(Point(mid[0]+n[0]*.2,mid[1]+n[1]*.2)):n=(-n[0],-n[1])
   pt=lambda x,y:[a[0]+u[0]*x+n[0]*y,a[1]+u[1]*x+n[1]*y]
   rect=lambda x,y,w,h:Polygon([pt(x,y),pt(x+w,y),pt(x+w,y+h),pt(x,y+h)])
   cameras=[]
   for j in range(2,65):
    q=Point(pt(L/2,-j*.25))
    if rc.contains(q):cameras.append([q.x,q.y])
    elif cameras:break
   if not cameras:continue
   access=LineString([mid,cameras[0]]).buffer(.85,cap_style=2)
   if access.intersection(others).area>.001 or not plot.union(road).buffer(.1).covers(access):continue
   # Source supplies shape/floors, not a reliable use label. Stable inferred family.
   roadWidth=math.dist(cameras[0],cameras[-1]);rng=random.Random(b['id']);family='house' if b['levels']<=2 else 'mixed' if roadWidth>=5 or (p.area>170 and b['levels']>=4) else 'villa'
   if profile:family='mixed' if profile['use']=='mixed' else 'house' if b['levels']<=2 else 'villa'
   choices={'house':['gate-solid','gate-rail','lobby-steps'],'villa':['lobby-center','lobby-side','lobby-steps'],'mixed':['shop-single','shop-pair','shop-shutter']}[family];rng.shuffle(choices)
   # Basement layout is only eligible with an uninterrupted 11m deep frontage.
   ramp=rect(.6,0,3.4,11)
   if not profile and b['levels']>=3 and L>8 and p.buffer(.001).covers(ramp) and rng.random()<.45:choices.insert(0,'basement-ramp')
   for kind in choices:
    x=.6 if kind=='basement-ramp' else .6 if kind=='lobby-side' else L/2-1.15
    width=3.4 if kind=='basement-ramp' else L-1 if kind.startswith('shop') else 2.3
    if kind.startswith('shop'):x=.5
    depth=11 if kind=='basement-ramp' else 1.6
    opening=rect(x,-.02,width,depth+.02)
    if not p.buffer(.03).covers(rect(x,.02,width,depth-.02)):continue
    gate=kind.startswith('gate')
    if gate:
     frontStrip=rect(.3,-1.3,L-.6,1.3)
     if not plot.covers(frontStrip) or frontStrip.intersects(road) or frontStrip.intersects(others):continue
    approach=LineString([pt(x+width/2,0),pt(x+width/2,-math.dist(mid,cameras[0]))]).buffer(width/2 if kind=='basement-ramp' else .85,cap_style=2)
    if approach.intersection(others).area>.001 or not plot.union(road).buffer(.1).covers(approach):continue
    opts.append((math.dist(mid,cameras[0]),{'id':b['id'],'kind':kind,'label':LABELS[kind],'family':family,'origin':a,'u':u,'n':n,'length':L,'opening':[x,width,depth],'lower':mapping(p.difference(opening)),'void':mapping(ramp) if kind=='basement-ramp' else None,'plot':mapping(plot.difference(ramp)) if kind=='basement-ramp' else None,'access':mapping(approach),'camera':min(cameras,key=lambda q:abs(math.dist(q,mid)-7)),'focus':pt(L/2,1),'frontEdge':i}));break
  if opts:plans.append(min(opts,key=lambda v:v[0])[1])
 accesses=unary_union([shape(v['access']) for v in plans]);walls=[]
 for w in inf['walls']:
  line=LineString([w['a'],w['b']]).difference(accesses.buffer(.15))
  for g in ([line] if line.geom_type=='LineString' else getattr(line,'geoms',[])):
   if g.geom_type=='LineString' and g.length>.2:walls.append({**w,'a':list(g.coords[0]),'b':list(g.coords[-1])})
 for zone in inf['zones']:
  if zone.get('geometry') and zone['kind'] in ['green','garden','wild']:
   zone['geometry']=mapping(shape(zone['geometry']).difference(accesses))
 inf['zones'].append({'kind':'yard','geometry':mapping(accesses.difference(road)),'owner':None})
 inf['walls']=walls;inf['plants']=[v for v in inf['plants'] if not Point(v['point']).buffer(v['radius']).intersects(accesses)];inf['bays']=[v for v in inf['bays'] if not shape(v['footprint']).intersects(accesses)];inf['poles']=[v for v in inf['poles'] if not Point(v['point']).buffer(.2).intersects(accesses)]
 inf['qa'].update(parkingBays=len(inf['bays']),plants=len(inf['plants']),poles=len(inf['poles']))
 qa={'buildings':len(plans),'patterns':{k:sum(v['kind']==k for v in plans) for k in LABELS},'piloti':len(ids),'seed':'building id','inferredUse':True}
 qa['lowerRoadOverlap']=sum(shape(v['lower']).intersection(road).area for v in plans)
 qa['duplicateOwners']=len(plans)-len({v['id'] for v in plans})
 qa['wallAcrossEntry']=sum(LineString([w['a'],w['b']]).buffer(.07,cap_style=2).intersection(accesses).area for w in inf['walls'])
 assert qa['lowerRoadOverlap']<1e-6 and qa['wallAcrossEntry']<1e-6 and qa['duplicateOwners']==0,qa
 (OUT/'ground-floor-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2))
 (OUT/'ground-floors.json').write_text(json.dumps({'plans':plans,'qa':qa},ensure_ascii=False,separators=(',',':')));(OUT/'ground-infill.json').write_text(json.dumps(inf,ensure_ascii=False,separators=(',',':')));print(qa)
 from enrich_sites import build as enrich
 enrich()
if __name__=='__main__':build()
