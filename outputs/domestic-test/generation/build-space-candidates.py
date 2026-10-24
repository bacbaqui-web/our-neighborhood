"""Generate conservative footprint candidates; build-attached-structures.py decides household needs and roof presence.
Input: actual building/road footprints, inferred v16 parcels. No survey claims.
Run: work/geo-env/bin/python outputs/domestic-test/generation/build-space-candidates.py
"""
import json,math,struct
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union,nearest_points
from shapely.strtree import STRtree
from location_config import ROOT,SHARED,REPORT,ORIGIN,LAT,LON,CACHE,DYNAMIC
d=json.load(open(ROOT/'parcels.json'));profiles={p['owner']:p for p in json.load(open(REPORT/'alley-placement-report-v17.json'))['parcels']}
lat=math.radians(LAT);mlat=111132.92-559.82*math.cos(2*lat)+1.175*math.cos(4*lat)-.0023*math.cos(6*lat);mlon=111412.84*math.cos(lat)-93.5*math.cos(3*lat)+.118*math.cos(5*lat)
bs={}
for f in json.load(open(ROOT/'buildings.geojson'))['features']:
 rings=f['geometry']['coordinates'] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates'][0]
 bs[int(f['properties']['objectid'])]=Polygon([((p[0]-LON)*mlon,-(p[1]-LAT)*mlat) for p in rings[0]]).buffer(0)
built=unary_union(list(bs.values()));access=unary_union([LineString(y['entrance']).buffer(.9,cap_style=2) for y in d['yards'] if y['entrance']]);wall=unary_union([LineString([e['a'],e['b']]) for e in d['segments']]).buffer(.15)
b=(ROOT/'corrected-base.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);buf=b[28+n:]
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];c={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];t={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];return np.ndarray((a['count'],c),dtype=t,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(t).itemsize*c),np.dtype(t).itemsize))
roads=[];terrain=[];cells={}
for m in g['meshes']:
 if m.get('name') not in ['ground','road','path']:continue
 for p in m['primitives']:
  pos=acc(p['attributes']['POSITION']);ix=acc(p['indices']).reshape(-1,3)
  for v in pos[ix]:
   shape=Polygon(v[:,[0,2]])
   if shape.area<1e-8:continue
   if m['name']!='ground':roads.append(shape)
   a,b,c=v;den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);idx=len(terrain);terrain.append((v,den))
   for x in range(math.floor(min(v[:,0])/5),math.floor(max(v[:,0])/5)+1):
    for z in range(math.floor(min(v[:,2])/5),math.floor(max(v[:,2])/5)+1):cells.setdefault((x,z),[]).append(idx)
road=unary_union(roads)
def height(x,z):
 ys=[]
 for idx in cells.get((math.floor(x/5),math.floor(z/5)),[]):
  v,den=terrain[idx];a,b,c=v;u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
  if u>=-1e-6 and w>=-1e-6 and 1-u-w>=-1e-6:ys.append(u*a[1]+w*b[1]+(1-u-w)*c[1])
 return max(ys) if ys else 0
catalog={a['id']:a for a in json.load(open(SHARED.parent/'alley-library/alley-catalog-210.json'))}
structures=[];drives=[];summary=[]
for y in sorted(d['yards'],key=lambda y:y['x']**2+y['z']**2):
 owner=y['owner'];house=bs[owner];yard=unary_union([Polygon(r['outer'],r['holes']) for r in y['rings']]);profile=profiles.get(owner,{})
 if y['area']<22:continue
 available=yard.difference(wall);ring=list(house.simplify(.07,preserve_topology=True).exterior.coords);candidates=[]
 for a,b in zip(ring,ring[1:]):
  L=math.dist(a,b)
  if L<2.7:continue
  ux=(b[0]-a[0])/L;uz=(b[1]-a[1])/L;nx,nz=-uz,ux
  if house.contains(Point((a[0]+b[0])/2+nx*.05,(a[1]+b[1])/2+nz*.05)):nx,nz=-nx,-nz
  # Local x runs along facade; local z points outward. Both signs are supported.
  def xy(u,v):return(a[0]+ux*u+nx*v,a[1]+uz*u+nz*v)
  for width in sorted(set([round(min(w,L-.36),2) for w in [10,7.5,5.6,4.4,3.2]]),reverse=True):
   if width<2.5:continue
   starts=sorted(set([.18,max(.18,L-width-.18),max(.18,(L-width)/2)]+[round(u,2) for u in np.arange(.18,L-width-.1,1.6)]))
   for u in starts:
    for depth in [5.2,4.2,3.3,2.6,1.9,1.35]:
     fp=Polygon([xy(u,.18),xy(u+width,.18),xy(u+width,depth+.18),xy(u,depth+.18)])
     if not available.covers(fp):continue
     front=Point(xy(u+width/2,depth+.18));near=nearest_points(front,road)[1];nearRoad=front.distance(near)
     levels=profile.get('levels',1);drive=None
     typ='work-canopy' if owner%3==0 else 'living-canopy'
     if depth>=2.6 and width>=4.35 and nearRoad<11:
      line=LineString([front,near]);corridor=line.buffer(1.35,cap_style=2)
      if corridor.intersection(built).area<1e-7 and corridor.difference(yard.union(road).buffer(.5)).area<1:
       typ='carport';drive={'line':list(line.coords),'width':2.7,'polygon':list(corridor.exterior.coords)}
     if typ!='carport' and depth>=1.9 and width<7.6 and not fp.intersects(access):typ='shed' if owner%3 else 'workshop'
     if depth<1.9:typ='bike-canopy' if levels>=3 else 'service-canopy'
     apron=None
     if typ in ['shed','workshop']:
      apronShape=Polygon([xy(u+width/2+xx,depth+.18+zz) for xx,zz in [(-.7,0),(.7,0),(.7,.9),(-.7,.9)]])
      if available.covers(apronShape):apron=list(apronShape.exterior.coords)
      else:typ='work-canopy';apron=None
     corners=list(fp.exterior.coords)[:-1];hs=[height(*p) for p in corners];grade=max(hs)-min(hs)
     if grade>1.4 or typ in ['shed','workshop'] and grade>.85:continue
     post=[]
     for xx in [.12,width-.12]:
      for zz in [.14,depth-.12]:
       pp=Point(xy(u+xx,.18+zz)).buffer(.095)
       if pp.intersects(access):break
       post.append(pp)
      else:continue
      break
     if len(post)!=4:continue
     car=None
     if typ=='carport':
      for centerU in [width/2,width/2-.65,width/2+.65]:
       carShape=Polygon([xy(u+centerU+xx,.18+depth/2+zz) for xx,zz in [(-1.9,-.9),(1.9,-.9),(1.9,.9),(-1.9,.9)]])
       if fp.buffer(-.12).covers(carShape) and not carShape.intersects(access):car={'x':centerU,'z':depth/2,'polygon':list(carShape.exterior.coords)};break
      if car is None:typ='work-canopy';drive=None
     origin=xy(u,.18);score=fp.area*(1.6 if typ=='carport' else 1.05 if typ in ['shed','workshop'] else .94)
     candidates.append({'owner':owner,'type':typ,'origin':origin,'ux':ux,'uz':uz,'nx':nx,'nz':nz,'width':width,'depth':depth,'footprint':list(fp.exterior.coords),'area':fp.area,'grade':grade,'car':car,'drive':drive,'entryApron':apron,'score':score,'shape':fp,'posts':post,'height':max(hs)})
 chosen=[];coverage=0;maxCount=min(9,max(2,math.ceil(y['area']/32)));reserved=None
 for c in sorted(candidates,key=lambda c:-c['score']):
  if reserved is not None and c['shape'].intersects(reserved):continue
  if any(c['shape'].intersects(Polygon(t['entryApron'])) for t in chosen if t['entryApron']):continue
  if c['entryApron'] and any(Polygon(c['entryApron']).intersects(t['shape']) for t in chosen):continue
  if any(c['shape'].buffer(.25).intersects(Polygon(t['drive']['polygon'])) for t in chosen if t['drive']):continue
  if c['drive'] and any(Polygon(c['drive']['polygon']).intersects(t['shape']) for t in chosen):continue
  chosen.append(c);coverage+=c['area'];reserved=unary_union([t['shape'].buffer(.24) for t in chosen])
  if len(chosen)>=maxCount or coverage>=y['area']*.52:break
 for c in chosen:
  c['furnishings']=[]
  if c['type'] not in ['carport','shed','workshop']:
   ids={'work-canopy':[179,189,180,163], 'living-canopy':[178,156,157,160], 'bike-canopy':[171,172,187], 'service-canopy':[166,161,187,188]}[c['type']]
   occupied=[]
   for aid in ids:
    meta=catalog[aid];mn=meta['bounds']['min'];mx=meta['bounds']['max'];ww=2*max(abs(mn[0]),abs(mx[0]))+.12;dd=2*max(abs(mn[2]),abs(mx[2]))+.12
    placed=False
    for u in np.arange(.2+ww/2,c['width']-ww/2-.15,.45):
     for v in [.2+dd/2,c['depth']-.2-dd/2]:
      def P(x,z):return(c['origin'][0]+c['ux']*x+c['nx']*z,c['origin'][1]+c['uz']*x+c['nz']*z)
      fp=Polygon([P(u+x,v+z) for x,z in [(-ww/2,-dd/2),(ww/2,-dd/2),(ww/2,dd/2),(-ww/2,dd/2)]])
      if not c['shape'].buffer(-.15).covers(fp) or fp.intersects(access) or any(fp.intersects(q.buffer(.12)) for q in occupied):continue
      if any(fp.intersects(q.buffer(.15)) for q in c['posts']):continue
      occupied.append(fp);c['furnishings'].append({'id':aid,'x':float(u),'z':float(v),'width':ww,'depth':dd,'height':mx[1]-mn[1],'footprint':list(fp.exterior.coords)});placed=True;break
     if placed:break
  c['id']=len(structures)+1;c['name']={'carport':'건물 부착 주차 차양','shed':'외벽 부착 창고','workshop':'셔터 작업 창고','work-canopy':'지붕 있는 작업 공간','living-canopy':'처마형 생활 공간','bike-canopy':'벽면 자전거 차양','service-canopy':'설비 덮개'}[c['type']]
  for key in ['shape','posts','score']:c.pop(key)
  if c['drive']:drives.append({'owner':owner,**c['drive']})
  structures.append(c)
 if chosen:summary.append({'owner':owner,'yardArea':y['area'],'structureArea':coverage,'count':len(chosen)})
# Cut actual parcel boundaries at vehicle entrances, rather than leaving cars fenced in.
cut=unary_union([Polygon(d['polygon']).buffer(.08) for d in drives]);wallSegments=[]
for e in d['segments']:
 line=LineString([e['a'],e['b']]).difference(cut)
 for part in ([line] if line.geom_type=='LineString' else getattr(line,'geoms',[])):
  if part.geom_type=='LineString' and part.length>.025:
   coords=list(part.coords)
   for a,b in zip(coords,coords[1:]):wallSegments.append({'a':a,'b':b,'owner':e.get('owner')})
qa={'structures':len(structures),'houses':len(summary),'roofArea':sum(c['area'] for c in structures),'types':{},'buildingOverlap':0,'roadOverlap':0,'solidAccessOverlap':0,'maxAttachmentGap':0}
for c in structures:
 for item in c['furnishings']:qa['solidAccessOverlap']+=Polygon(item['footprint']).intersection(access).area
 fp=Polygon(c['footprint']);qa['types'][c['name']]=qa['types'].get(c['name'],0)+1;qa['buildingOverlap']+=fp.intersection(built).area;qa['roadOverlap']+=fp.intersection(road).area;qa['maxAttachmentGap']=max(qa['maxAttachmentGap'],fp.distance(bs[c['owner']]))
 if c['type'] in ['shed','workshop']:qa['solidAccessOverlap']+=fp.intersection(access).area
 for xx in [.12,c['width']-.12]:
  for zz in [.14,c['depth']-.12]:
   x=c['origin'][0]+c['ux']*xx+c['nx']*zz;z=c['origin'][1]+c['uz']*xx+c['nz']*zz;qa['solidAccessOverlap']+=Point(x,z).buffer(.095).intersection(access).area
 if c['car']:qa['solidAccessOverlap']+=Polygon(c['car']['polygon']).intersection(access).area
assert qa['buildingOverlap']<1e-6 and qa['roadOverlap']<1e-6 and qa['solidAccessOverlap']<1e-6
out={'version':18,'rule':'Facade-attached architecture first; roof dimensions fitted to remaining parcel; vehicle approach reserved and wall gates cut; related belongings last. Inferred from roadview, not measured.','structures':structures,'drives':drives,'wallSegments':wallSegments,'houses':summary,'qa':qa}
(ROOT/'generation/space-candidates-v22.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False,default=float));(ROOT/'generation/space-candidate-validation.json').write_text(json.dumps(qa,indent=2,ensure_ascii=False,default=float));print(qa,flush=True)
