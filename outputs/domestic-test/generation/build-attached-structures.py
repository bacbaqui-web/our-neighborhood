"""Household needs first, fitted structures second. No area-filling coverage target.
Candidate polygons come from build-space-candidates.py and remain inside verified plots.
Run this, then build-streetscape.py and build-utilities.py.
"""
import json,math,copy,collections
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
from site_geometry import Site
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC
site=Site(ROOT,ORIGIN);source=json.load(open(ROOT/'generation/space-candidates-v22.json'));parcel=json.load(open(ROOT/'parcels.json'))
profiles={p['owner']:p for p in json.load(open(REPORT/'alley-placement-report-v22.json'))['parcels']};catalog={p['id']:p for p in json.load(open(SHARED.parent/'alley-library/alley-catalog-212.json'))}
access=unary_union([LineString(y['entrance']).buffer(.9,cap_style=2) for y in parcel['yards'] if y['entrance']]);by=collections.defaultdict(list)
for s in source['structures']:by[s['owner']].append(s)
def hash01(owner,salt=0):return ((owner*2654435761+salt*2246822519)&0xffffffff)/4294967295
styles=['brick-vent','dark-brick','brick-rail','stone-gate','rendered','green-fence']
households=[];structures=[]
for y in parcel['yards']:
 owner=y['owner'];p=profiles.get(owner,{});f=p.get('frontage');levels=site.levels[owner];depth=f['mean'] if f else 8;shape=site.buildings[owner];h=hash01(owner);family=styles[abs(owner)%6]
 policy='open-villa' if levels>=4 else 'street-flush' if depth<1.6 else 'courtyard' if y['area']>35 and f else 'side-yard'
 base=.75+h*.35 if policy=='side-yard' else 1.03+h*.56
 home={'owner':owner,'policy':policy,'levels':levels,'setback':depth,'wallStyle':family,'wallHeight':round(base,2),'wallTint':round(.88+h*.18,3),'railRatio':round(.24+hash01(owner,2)*.24,2),'pierSpacing':round(4.8+hash01(owner,3)*2.2,2),'roofLimit':1,'capProfile':'scalloped' if family in ['dark-brick','brick-vent'] and policy=='courtyard' else 'straight','reason':'주차 진입부 개방' if policy=='open-villa' else '도로에 가까운 건물 외벽이 골목 경계' if policy=='street-flush' else '사적인 마당의 연결 담장'}
 households.append(home);candidates=by.get(owner,[]);chosen=[];covered=False
 # Preserve parked cars and their verified driveway; a parking activity does not imply a roof.
 for old in [c for c in candidates if c['car']]:
  s=copy.deepcopy(old);needs=levels<=3 and policy=='courtyard' and not covered and s['grade']<.8
  s['roofKind']=('arched-poly' if family in ['rendered','stone-gate'] else 'lean-metal') if needs else 'none';s['roofHeight']=round(2.45+h*.25,2);s['roofColor']=[0x658679,0x64737c,0x8c7a68,0x84958e][int(h*4)%4];s['purpose']='covered-parking' if needs else 'open-parking';s['reason']='단독주택의 후퇴 주차 면에만 작은 비가림' if needs else '주차는 유지하고 별도 차양 없이 열린 진입부';s['name']='주택 부착 주차 비가림' if needs else '차양 없는 노외 주차';covered|=needs;chosen.append(s)
 # At most one secondary service/storage niche, attached to its own facade.
 other=[c for c in candidates if not c['car']]
 if len(chosen)<2:
  def score(c):
   u=np.array([c['ux'],c['uz']]);v=np.array([c['nx'],c['nz']]);o=np.array(c['origin']);q=o+u*c['width']/2+v*c['depth']/2;dist=Point(q).distance(site.road)
   useful=(c['type']=='bike-canopy' and levels>=3) or (c['type']=='service-canopy' and levels>=3) or (c['type'] in ['shed','workshop'] and policy in ['courtyard','side-yard']) or (c['type']=='living-canopy' and p.get('type')=='laundry') or (c['type']=='work-canopy' and p.get('type')=='workshop')
   return (0 if useful else 100)+dist*.6+c['area']*.10
  for old in sorted(other,key=score):
   typ=old['type'];purpose=None
   if typ=='bike-canopy' and levels>=3:purpose='bicycle'
   elif typ=='service-canopy' and levels>=3:purpose='equipment'
   elif typ in ['shed','workshop'] and policy in ['courtyard','side-yard'] and y['area']>55:purpose='storage'
   elif typ=='living-canopy' and p.get('type')=='laundry':purpose='laundry'
   elif typ=='work-canopy' and p.get('type')=='workshop' and y['area']>75:purpose='workbench'
   if not purpose:continue
   s=copy.deepcopy(old);w=min(s['width'],3.6 if purpose=='storage' else 3.1 if purpose=='bicycle' else 2.8);d=min(s['depth'],2.3 if purpose=='storage' else 1.35 if purpose=='bicycle' else 1.5)
   o=np.array(s['origin']);u=np.array([s['ux'],s['uz']]);v=np.array([s['nx'],s['nz']]);P=lambda x,z:o+u*x+v*z
   fp=Polygon([P(0,0),P(w,0),P(w,d),P(0,d)])
   if purpose=='storage' and fp.intersects(access):continue
   # A niche must be reachable from the plot, not an invented shed in a hidden gap.
   if Point(P(w/2,d/2)).distance(site.road)>8:continue
   s.update(width=w,depth=d,footprint=list(fp.exterior.coords),area=fp.area,purpose=purpose,car=None,drive=None,entryApron=None,furnishings=[],roofHeight=round((2.22 if purpose=='storage' else 2.12)+h*.26,2),roofColor=[0x668577,0x89988f,0x7e8e99,0x9b8772][int(h*4)%4])
   hasRoof=purpose in ['storage','workbench'] or (purpose=='bicycle' and policy!='street-flush' and levels>=3 and d<=1.4 and not covered)
   s['roofKind']=('gable-metal' if h<.45 else 'lean-metal') if purpose=='storage' else ({'stone-gate':'arched-poly','rendered':'arched-poly','brick-rail':'flat-poly','green-fence':'flat-poly'}.get(family,'braced-sheet')) if purpose=='bicycle' and hasRoof else 'braced-sheet' if purpose=='workbench' and hasRoof else 'none'
   if covered and purpose!='storage':s['roofKind']='none'
   if purpose=='storage':
    s['type']='shed';apron=Polygon([P(w/2+x,d+z) for x,z in [(-.7,0),(.7,0),(.7,.9),(-.7,.9)]])
    oldfree=Polygon(old['footprint']).union(Polygon(old['entryApron']) if old.get('entryApron') else Polygon())
    if not oldfree.covers(apron):continue
    s['entryApron']=list(apron.exterior.coords)
   else:s['type']='service-canopy' if purpose=='equipment' else 'bike-canopy' if purpose=='bicycle' else 'living-canopy' if purpose=='laundry' else 'work-canopy'
   s['reason']={'bicycle':'공동 자전거 보관에 한정한 얕은 벽부 비가림' if s['roofKind']!='none' else '통로 폭을 남긴 개방 자전거 보관','equipment':'실외기는 지붕 없이 외벽 옆 설비 자리','storage':'넓은 사적 마당의 작은 외벽 창고','laundry':'햇빛을 받는 지붕 없는 빨래 자리','workbench':'작업대 위에 한정한 벽부 차양'}[purpose]
   s['name']={'bicycle':'벽 옆 자전거 보관','equipment':'개방형 외벽 설비','storage':'작은 박공·경사 지붕 창고','laundry':'지붕 없는 빨래 자리','workbench':'작업대 벽부 차양'}[purpose]
   ids={'bicycle':[31,101,102],'equipment':[19,91],'storage':[],'laundry':[156,29],'workbench':[189,179]}[purpose];occupied=[]
   for aid in ids:
    b=catalog[aid]['bounds'];ww=2*max(abs(b['min'][0]),abs(b['max'][0]))+.12;dd=2*max(abs(b['min'][2]),abs(b['max'][2]))+.12
    placed=False
    for xx in np.arange(ww/2+.15,w-ww/2-.13,.35):
     for zz in [dd/2+.16,d-dd/2-.16]:
      pf=Polygon([P(xx+dx,zz+dz) for dx,dz in [(-ww/2,-dd/2),(ww/2,-dd/2),(ww/2,dd/2),(-ww/2,dd/2)]])
      if not fp.buffer(-.08).covers(pf) or pf.intersects(access) or any(pf.intersects(q.buffer(.08)) for q in occupied):continue
      occupied.append(pf);s['furnishings'].append({'id':aid,'x':float(xx),'z':float(zz),'width':ww,'depth':dd,'height':b['max'][1]-b['min'][1],'footprint':list(pf.exterior.coords)});placed=True;break
     if placed:break
   if purpose!='storage' and not s['furnishings']:continue
   chosen.append(s);covered|=s['roofKind']!='none';break
 for s in chosen:
  s['id']=len(structures)+1;structures.append(s)
drives=[{'owner':s['owner'],**s['drive']} for s in structures if s['drive']];cut=unary_union([Polygon(d['polygon']).buffer(.08) for d in drives]);walls=[]
for e in parcel['segments']:
 line=LineString([e['a'],e['b']]).difference(cut)
 for part in [line] if line.geom_type=='LineString' else getattr(line,'geoms',[]):
  if part.geom_type=='LineString' and part.length>.025:
   ps=list(part.coords)
   for a,b in zip(ps,ps[1:]):walls.append({'a':a,'b':b,'owner':e.get('owner')})
summary=[{'owner':owner,'yardArea':next(y['area'] for y in parcel['yards'] if y['owner']==owner),'structureArea':sum(s['area'] for s in structures if s['owner']==owner),'count':sum(s['owner']==owner for s in structures)} for owner in sorted(set(s['owner'] for s in structures))]
qa={'structures':len(structures),'houses':len(summary),'roofArea':sum(s['area'] for s in structures if s['roofKind']!='none'),'activityArea':sum(s['area'] for s in structures),'roofedStructures':sum(s['roofKind']!='none' for s in structures),'unroofedActivities':sum(s['roofKind']=='none' for s in structures),'roofTypes':dict(collections.Counter(s['roofKind'] for s in structures)),'types':dict(collections.Counter(s['name'] for s in structures)),'buildingOverlap':0,'roadOverlap':0,'solidAccessOverlap':0,'maxAttachmentGap':0}
for s in structures:
 fp=Polygon(s['footprint']);qa['buildingOverlap']+=fp.intersection(site.built).area;qa['roadOverlap']+=fp.intersection(site.road).area;qa['maxAttachmentGap']=max(qa['maxAttachmentGap'],fp.distance(site.buildings[s['owner']]))
 for item in s['furnishings']:qa['solidAccessOverlap']+=Polygon(item['footprint']).intersection(access).area
 if s['type'] in ['shed','workshop']:qa['solidAccessOverlap']+=fp.intersection(access).area
 if s['car']:qa['solidAccessOverlap']+=Polygon(s['car']['polygon']).intersection(access).area
assert max(qa[k] for k in ['buildingOverlap','roadOverlap','solidAccessOverlap'])<1e-6
out={'version':23,'rule':'Household use and entrance exposure determine roofs. Open parking/equipment/laundry are valid complete activities. One secondary niche per owner; no yard coverage quota. Roadview-informed inference.','structures':structures,'drives':drives,'wallSegments':walls,'houses':summary,'households':households,'qa':qa}
(ROOT/'attached-structures.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False,default=float));(REPORT/'household-structure-validation-v23.json').write_text(json.dumps(qa,indent=2,ensure_ascii=False));print(qa,flush=True)
