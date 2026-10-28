"""Connected arterial cross-sections and public-space reservations (v80).
Map centerlines and official transit points are evidence; widths/assets are inferred.
Original alley data stays intact. Overrides are published only after validation.
"""
import json,math,sys,copy
from pathlib import Path
import numpy as np
import shapely as S
from shapely.geometry import Polygon,LineString,Point,box,shape
from shapely.ops import unary_union,transform
from neighborhood_sources import Terrain,scales,kakao
from kakao_terrain import load_terrain
WORK=Path(__file__).resolve().parent

def parts(g,kind='Polygon'):return [q for q in S.get_parts(g) if q.geom_type==kind and not q.is_empty]
def tris(g):
 return [list(t.exterior.coords)[:3] for p in parts(S.make_valid(g)) for t in S.get_parts(S.constrained_delaunay_triangles(p)) if t.area>1e-7]
def rings(g):return [{'outer':list(p.exterior.coords),'holes':[list(h.coords) for h in p.interiors]} for p in parts(g) if p.area>.05]
def write(p,d):p.parent.mkdir(exist_ok=True,parents=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));tmp.replace(p)
def build(root):
 root=Path(root);read=lambda p:json.loads((root/p).read_text());loc=read('location.json');lat,lon=loc['origin'];sx,sy=scales(lat);radius=int(loc.get('sizeMetres',300)/2)
 sources=read('roads-source.json')['roads'];major=[r for r in sources if r['properties']['class'] in ['primary','trunk','secondary','tertiary']]
 if not major:return None
 # Pair parallel carriageways. Keep distinct crossings out of the dominant corridor.
 leader=max(major,key=lambda r:LineString(r['geometry']['coordinates']).length)
 ps=np.asarray(leader['geometry']['coordinates']);u=ps[-1]-ps[0];u=u/np.linalg.norm(u)
 if u[1]<0:u=-u
 n=np.array([u[1],-u[0]])
 major=[r for r in major if abs(np.dot((np.asarray(r['geometry']['coordinates'][-1])-r['geometry']['coordinates'][0])/LineString(r['geometry']['coordinates']).length,u))>.86]
 samples=[]
 for r in major:
  ps=np.asarray(r['geometry']['coordinates']);ts=ps@u;ds=ps@n;order=np.argsort(ts);samples.append((ts[order],ds[order],r))
 t0=max(-radius-13,min(s[0].min() for s in samples));t1=min(radius+13,max(s[0].max() for s in samples))
 knots=[]
 for t in np.linspace(t0,t1,110):
  ds=[np.interp(t,ts,ds) for ts,ds,r in samples if ts.min()-.01<=t<=ts.max()+.01]
  if ds:knots.append([float(t),float((min(ds)+max(ds))/2)])
 kt,kd=np.array(knots).T
 def center(t):return u*t+n*np.interp(t,kt,kd)
 def xy(t,d=0):return (center(t)+n*d).tolist()
 def local(p):
  p=np.asarray(p);t=float(p@u);return t,float((p-center(t))@n)
 def ll(x,y):return [(float(x)-lon)*sx,(lat-float(y))*sy]
 terrain=load_terrain(root,loc);height=terrain.mesh_height
 buildings=read('buildings.geojson');underground={f['properties']['objectid'] for f in buildings['features'] if str(f['properties'].get('house_number','')).startswith('지하')}
 buildings['features']=[f for f in buildings['features'] if f['properties']['objectid'] not in underground]
 built=unary_union([transform(lambda x,y:((x-lon)*sx,(lat-y)*sy),shape(f['geometry'])) for f in buildings['features']]).buffer(.12)
 extent=box(-radius-4,-radius-4,radius+4,radius+4)
 transit={'stops':[],'exits':[]}
 cache=WORK/'arterial-v76/seoul-stops-20260902.json'
 if cache.exists():
  for row in json.loads(cache.read_text())[1:]:
   if len(row)<6:continue
   p=ll(row[3],row[4]);t,d=local(p)
   if abs(d)<22 and t0+7<t<t1-7 and max(map(abs,p))<radius and row[5]=='중앙차로':
    transit['stops'].append({'id':row[1],'name':row[2],'point':p,'t':t,'side':1 if d>0 else -1,'source':'Seoul bus stops 2026-09-02','lon':float(row[3]),'lat':float(row[4])})
 # Reuse previously inspected POIs. Other addresses use category + exact exit filtering.
 evidence=WORK.parent/'outputs/arterial-study-v75/transport-pois.json'
 if root.parent.name=='f20b139277e4d2a5' and evidence.exists():
  raw=json.loads(evidence.read_text());docs=[]
  def collect(v):
   if isinstance(v,dict):
    if 'place_name' in v and '지하철출구' in v.get('category_name',''):docs.append(v)
    else:
     for x in v.values():collect(x)
   elif isinstance(v,list):
    for x in v:collect(x)
  collect(raw)
 else:
  docs=[]
  try:
   stations=kakao('category',{'category_group_code':'SW8','x':lon,'y':lat,'radius':500})['documents']
   for st in stations[:2]:docs+=kakao('keyword',{'query':st['place_name'].split()[0]+' 출구','x':lon,'y':lat,'radius':400,'size':15})['documents']
  except Exception:pass
 seen=set()
 for doc in docs:
  if doc['id'] in seen or '지하철출구' not in doc.get('category_name',''):continue
  seen.add(doc['id']);p=ll(doc['x'],doc['y']);t,d=local(p)
  if max(map(abs,p))>145 or abs(d)>24:continue
  transit['exits'].append({'id':doc['id'],'name':doc['place_name'],'point':p,'t':t,'side':1 if d>0 else -1,'source':doc['place_url']})
 hasbus=bool(transit['stops']) or any(r['properties'].get('class')=='busway' for r in sources)
 # Six lanes for the surveyed Dobong-ro corridor; generic major roads derive count
 # from one-way pair spacing. No bus lane unless there is supporting bus evidence.
 lanes=6 if hasbus else (2 if leader['properties']['class']=='tertiary' else 4)
 lane=3.2;baseHalf=lanes/2*lane+.35
 def widen(t,side):
  return max([0]+[2.4*max(0,min(1,(32-abs(t-s['t']))/12)) for s in transit['stops'] if s['side']==side])
 def half(t,side):return baseHalf+widen(t,side)
 def strip(lo,hi,start=t0,end=t1):
  ts=np.linspace(start,end,max(2,math.ceil((end-start)/2)+1));pts=[xy(t,lo(t)) for t in ts]+[xy(t,hi(t)) for t in ts[::-1]]
  return S.make_valid(Polygon(pts)).intersection(extent)
 road=strip(lambda t:-half(t,-1),lambda t:half(t,1)).difference(built)
 public=strip(lambda t:-half(t,-1)-3.0,lambda t:half(t,1)+3.0).difference(built)
 # Keep intersecting major roads in the network, instead of flattening them
 # into the dominant alignment. Tile fragments never imply extra lanes.
 branches=[];junctionTs=[];junctionArea=Polygon()
 mainLine=LineString([xy(t) for t in np.linspace(t0,t1,110)])
 for r in sources:
  if r['properties']['class'] not in ['primary','trunk','secondary','tertiary'] or r in major:continue
  line=LineString(r['geometry']['coordinates'])
  if line.distance(mainLine)>1:continue
  hits=line.intersection(mainLine.buffer(.6))
  if hits.is_empty:continue
  point=hits.centroid;jt,_=local([point.x,point.y])
  if not any(abs(jt-t)<4 for t in junctionTs):junctionTs.append(jt)
  width=float(r['width'])
  br=line.buffer(width/2,cap_style=2,join_style=2).intersection(extent).difference(built)
  bp=line.buffer(width/2+3,cap_style=2,join_style=2).intersection(extent).difference(built)
  branches.append({'line':line,'road':br,'public':bp,'width':width,'junction':point})
  road=road.union(br);public=public.union(bp)
  junctionArea=junctionArea.union(point.buffer(baseHalf+width/2+2))
 # New scenes reserve roads and both sidewalks before any building is generated.
 reservation=read('road-reservation.json') if (root/'road-reservation.json').exists() else None
 if reservation:
  public=shape(reservation['majorPublic'])
  if not hasbus:road=shape(reservation['road']).intersection(public)
 sidewalks=public.difference(road)
 # Side streets must remain joined to the arterial; remove the sidewalk at mouths.
 mouths=[]
 for r in sources:
  if r['properties']['class'] not in ['minor','tertiary','service']:continue
  ps=r['geometry']['coordinates'];l=LineString(ps)
  for side in [-1,1]:
   edge=LineString([xy(t,side*half(t,side)) for t in np.linspace(t0,t1,100)])
   hits=l.intersection(edge)
   for p in parts(hits,'Point'):
    t,d=local([p.x,p.y])
    if any(abs(t-m['t'])<8 and side==m['side'] for m in mouths):continue
    if t0+8<t<t1-8:mouths.append({'t':t,'side':side,'width':max(3.6,min(8,r['width']))})
 for m in mouths:
  t,side,w=m['t'],m['side'],m['width'];cut=strip(lambda q:side*half(q,side)-.2 if side>0 else -half(q,side)-3.2,lambda q:half(q,side)+3.2 if side>0 else -half(q,side)+.2,t-w/2,t+w/2)
  sidewalks=sidewalks.difference(cut);road=road.union(cut.intersection(public))
 def at_mouth(t,side,pad=0):return any(m['side']==side and abs(m['t']-t)<m['width']/2+pad for m in mouths)
 # Fit exits to the sidewalk. Keep measured position and render offset separately.
 reservations=[];exits=[]
 def rect(t,d,L,W):return Polygon([xy(t-L/2,d-W/2),xy(t+L/2,d-W/2),xy(t+L/2,d+W/2),xy(t-L/2,d+W/2)])
 for ex in transit['exits']:
  t=ex['t'];side=ex['side'];originalD=local(ex['point'])[1];chosen=None
  for dt in [0,-2,2,-4,4]:
   for d in [originalD,side*(half(t+dt,side)+3.6),side*(half(t+dt,side)+3.2),side*(half(t+dt,side)+2.1)]:
    fp=rect(t+dt,d,8.6,2.5)
    if sidewalks.buffer(.05).covers(fp) and all(not fp.intersects(a) for a in reservations):chosen=(t+dt,d,fp);break
   if chosen:break
  if not chosen:continue
  tt,d,fp=chosen;p=xy(tt,d);ex={**ex,'t':tt,'d':d,'position':[p[0],height(*p)+.14,p[1]],'heading':math.atan2(u[0],u[1]),'length':8.6,'width':2.5,'footprint':list(fp.exterior.coords),'offsetMetres':round(Point(p).distance(Point(ex['point'])),2)}
  exits.append(ex);reservations.append(fp.buffer(.45))
 holes=unary_union([Polygon(e['footprint']).buffer(-.16) for e in exits])
 sidewalks=sidewalks.difference(holes)
 # Short level thresholds, with triangulated aprons joining the unchanged sidewalk.
 # Only the approach is levelled; the long opening and street retain their slope.
 landings=[];landingTriangles=[]
 for e in exits:
  t,d,L,W=e['t'],e['d'],e['length'],e['width'];front=t-L/2
  pad=rect(front-.35,d,.7,W-.32).intersection(sidewalks)
  apron=rect(front-.75,d,1.5,W+.9).intersection(sidewalks)
  if pad.area<.3:continue
  entry=max(height(x,z) for x,z in pad.exterior.coords)+.145
  # Shared ring vertices make the level pad and its surrounding slope watertight.
  pad=S.segmentize(pad,.35);apron=S.segmentize(apron,.35)
  rows=[]
  for poly in [pad,apron.difference(pad)]:
   for tr in tris(poly):
    for x,z in (tr[::-1] if (tr[1][0]-tr[0][0])*(tr[2][1]-tr[0][1])-(tr[1][1]-tr[0][1])*(tr[2][0]-tr[0][0])>0 else tr):
     y=entry if pad.distance(Point(x,z))<1e-6 else height(x,z)+.145
     rows.extend([float(x),float(y),float(z)])
  e['position'][1]=entry;e['entryHeight']=entry
  e['landingFootprint']=list(pad.exterior.coords)
  landings.append({'id':e['id'],'triangles':rows,'rings':rings(apron),'entryHeight':entry})
  landingTriangles.extend(rows)
 landingArea=unary_union([Polygon(r['outer'],r['holes']) for l in landings for r in l['rings']])

 platforms=[]
 for s in transit['stops']:
  t=s['t'];d=s['side']*(.35+lane+1.2);fp=rect(t,d,36,2.4).intersection(extent);p=xy(t,d)
  if fp.intersects(built):continue
  platforms.append({**s,'d':d,'position':[p[0],height(*p)+.17,p[1]],'heading':math.atan2(u[0],u[1]),'length':36,'width':2.4,'footprint':list(fp.exterior.coords),'offsetMetres':round(Point(p).distance(Point(s['point'])),2)})
  reservations.append(fp);road=road.difference(fp)
 # Reserve a continuous curb-to-curb crossing before furniture and vehicles.
 # The platform-access relationship is observed; exact stripe positions are inferred.
 crosswalks=[]
 crossingSources=[{'id':s['id'],'t':s['t']-s['length']/2-3,'platform':s['id']} for s in platforms]
 for j,t in enumerate(junctionTs):
  for side in [-1,1]:
   tt=t+side*(baseHalf+10)
   if t0+4<tt<t1-4:crossingSources.append({'id':f'junction-{j}-{side}','t':tt,'platform':None})
 for stop in crossingSources:
  t=stop['t']
  width=4.2
  corridor=rect(t,0,width,2*(baseHalf+8))
  if any(corridor.intersects(Polygon(e['footprint'])) for e in exits):continue
  if any(corridor.intersection(Polygon(s['footprint'])).area>.01 for s in platforms):continue
  if any(abs(c['t']-t)<12 for c in crosswalks):continue
  p=xy(t)
  crosswalks.append({'id':'crossing-'+str(stop['id']),'t':t,'width':width,'position':[p[0],height(*p)+.035,p[1]],'footprint':list(corridor.intersection(public).exterior.coords),'source':'mapped-junction-roadview-form' if stop['platform'] is None else 'roadview-form-platform-access-inferred','platform':stop['platform']})
  reservations.append(corridor.intersection(sidewalks).buffer(.4))
  # Recess only the curb approach; triangulation is shared by paint, feet and walking.
  for side in [-1,1]:
   h=half(t,side)
   ramp=rect(t,side*(h+.7),width+1.2,1.4).intersection(sidewalks)
   for poly in parts(ramp):
    rows=[]
    for tr in tris(S.segmentize(poly,.25)):
     for x,z in (tr[::-1] if (tr[1][0]-tr[0][0])*(tr[2][1]-tr[0][1])-(tr[1][1]-tr[0][1])*(tr[2][0]-tr[0][0])>0 else tr):
      tt,dd=local([x,z]);blend=min(1,max(0,(abs(dd)-half(tt,side))/1.4))
      edge=min(1,max(0,(abs(tt-t)-width/2)/.6));lift=.035+.11*max(blend,edge)
      rows.extend([float(x),float(height(x,z)+lift),float(z)])
    landings.append({'id':crosswalks[-1]['id']+str(side),'kind':'crosswalk-ramp','triangles':rows,'rings':rings(poly)})
    landingTriangles.extend(rows)
 landingArea=unary_union([Polygon(r['outer'],r['holes']) for l in landings for r in l['rings']])
 def at_crossing(t,pad=0):return any(abs(t-c['t'])<c['width']/2+pad for c in crosswalks)
 # All base surfaces tessellate against exactly the same terrain mesh.
 def mesh(g,lift=0):
  out=[]
  if g.is_empty:return out
  if lift>=.14 and landings:
   # Decorations and walking collision use these same apron triangles.
   for i in range(0,len(landingTriangles),9):
    a=np.asarray(landingTriangles[i:i+9]).reshape(3,3);poly=Polygon(a[:,[0,2]])
    if not poly.intersects(g):continue
    coef=np.linalg.solve(np.column_stack([a[:,0],a[:,2],np.ones(3)]),a[:,1])
    for tr in tris(poly.intersection(g)):
     for xx,zz in (tr[::-1] if (tr[1][0]-tr[0][0])*(tr[2][1]-tr[0][1])-(tr[1][1]-tr[0][1])*(tr[2][0]-tr[0][0])>0 else tr):
      out.extend([float(xx),float(np.dot([xx,zz,1],coef)+lift-.145),float(zz)])
   g=g.difference(landingArea)
   if g.is_empty:return out
  minx,minz,maxx,maxz=g.bounds
  for x in range(math.floor(minx/5)*5,math.ceil(maxx/5)*5,5):
   for z in range(math.floor(minz/5)*5,math.ceil(maxz/5)*5,5):
    for tri in [[(x,z),(x+5,z),(x,z+5)],[(x+5,z),(x+5,z+5),(x,z+5)]]:
     p=Polygon(tri)
     if not g.intersects(p):continue
     for tr in tris(p.intersection(g)):
      for xx,zz in (tr[::-1] if (tr[1][0]-tr[0][0])*(tr[2][1]-tr[0][1])-(tr[1][1]-tr[0][1])*(tr[2][0]-tr[0][0])>0 else tr):out.extend([round(xx,5),round(height(xx,zz)+lift,5),round(zz,5)])
  return out
 def cut3(flat,mask):
  out=[]
  for i in range(0,len(flat),9):
   a=np.asarray(flat[i:i+9]).reshape(3,3);p=Polygon(a[:,[0,2]])
   if not p.intersects(mask):out.extend(flat[i:i+9]);continue
   if p.area<1e-9:continue
   coef=np.linalg.solve(np.column_stack([a[:,0],a[:,2],np.ones(3)]),a[:,1])
   for tr in tris(p.difference(mask)):
    for x,z in tr:out.extend([x,float(np.dot([x,z,1],coef)),z])
  return out
 out=root/'arterial';out.mkdir(exist_ok=True)
 override=[]
 def save(name,d):write(out/name,d);override.append(name)
 save('buildings.geojson',buildings)
 rc=read('road-context.json')
 for k,vs in rc['positions'].items():rc['positions'][k]=cut3(vs,public)
 rc['normals']={};rc['positions']['arterial']=mesh(road,.035);rc['positions']['sidewalk']=mesh(sidewalks,.145)
 rc['positions']['platform']=mesh(unary_union([Polygon(s['footprint']) for s in platforms]),.19)
 for k,v in rc.get('wear',{}).get('positions',{}).items():rc['wear']['positions'][k]=cut3(v,public)
 rc['qa']['arterialVersion']=82;save('road-context.json',rc)
 def clipseg(records):
  result=[]
  for r in records:
   if r.get('owner') in underground:continue
   for l in parts(LineString([r['a'],r['b']]).difference(public.buffer(.15)),'LineString'):
    if l.length>.06:result.append({**r,'a':list(l.coords[0]),'b':list(l.coords[-1])})
  return result
 pd=read('parcels.json');yards=[]
 for y in pd['yards']:
  if y['owner'] in underground:continue
  poly=unary_union([Polygon(r['outer'],r['holes']) for r in y['rings']]).difference(public)
  if poly.area<2:continue
  y['rings']=rings(poly);y['triangles']=tris(poly);y['area']=poly.area;y['x'],y['z']=poly.representative_point().coords[0];yards.append(y)
 pd['yards']=yards;pd['segments']=clipseg(pd['segments']);save('parcels.json',pd)
 ap=read('attached-structures.json')
 ap['structures']=[a for a in ap['structures'] if a.get('owner') not in underground and not Polygon(a['footprint']).intersects(public)]
 ap['drives']=[a for a in ap['drives'] if a.get('owner') not in underground and not Polygon(a['polygon']).intersects(public)]
 ap['wallSegments']=clipseg(ap['wallSegments']);ap['qa']['structures']=len(ap['structures']);save('attached-structures.json',ap)
 sp=read('streetscape-context.json');runs=[]
 for r in sp['wallRuns']:
  if r.get('owner') in underground:continue
  for l in parts(LineString(r['points']).difference(public.buffer(.2)),'LineString'):
   if l.length>.2:runs.append({**r,'points':list(l.coords),'length':l.length})
 sp['wallRuns']=runs;sp['connections']=clipseg(sp['connections'])
 for k in ['piers','gates','drains']:sp[k]=[p for p in sp[k] if p.get('owner') not in underground and not public.buffer(1 if k=='gates' else .3).covers(Point(p['x'],p['z']))]
 for k in ['apronTriangles','paintTriangles']:sp[k]=[tr for t in sp[k] for tr in tris(Polygon(t).difference(public))]
 sp['qa']['gates']=len(sp['gates']);save('streetscape-context.json',sp)
 up=read('utilities.json');keep=[i for i,p in enumerate(up['poles']) if not public.buffer(.3).covers(Point(p['x'],p['z']))];remap={old:new for new,old in enumerate(keep)};up['poles']=[up['poles'][i] for i in keep]
 up['spans']=[{**s,'a':remap[s['a']],'b':remap[s['b']]} for s in up['spans'] if s['a'] in remap and s['b'] in remap]
 up['drops']=[{**s,'pole':remap[s['pole']]} for s in up['drops'] if s['pole'] in remap]
 up['spans']=[s for s in up['spans'] if not LineString([(up['poles'][i]['x'],up['poles'][i]['z']) for i in [s['a'],s['b']]]).intersects(road)]
 up['drops']=[s for s in up['drops'] if not LineString([(up['poles'][s['pole']]['x'],up['poles'][s['pole']]['z']),(s['end'][0],s['end'][2])]).intersects(road)]
 up['qa'].update(poles=len(up['poles']),spans=len(up['spans']),houseDrops=len(up['drops']));save('utilities.json',up)
 # Street furniture belongs in the kerb strip, leaving the frontage-side clear path.
 furniture=[];trees=[];lights=[];occupied=list(reservations)
 def place(kind,t,d,L,W,extra=None):
  fp=rect(t,d,L,W)
  if not sidewalks.covers(fp) or any(fp.buffer(.4).intersects(p) for p in occupied):return False
  p=xy(t,d);furniture.append({'kind':kind,'position':[p[0],height(*p)+.15,p[1]],'heading':math.atan2(u[0],u[1]),'footprint':list(fp.exterior.coords),**(extra or {})});occupied.append(fp);return True
 # Roadview-supported station furniture is reserved before repeating trees/lamps.
 # These are observed relative positions, fitted to this sidewalk, not new POIs.
 reviewed=[]
 if root.parent.name=='f20b139277e4d2a5':
  ex=next((e for e in exits if e['id']=='22906186'),None)
  if ex:
   for kind,dt,L,W in [('station-vent',14,6.4,1.7),('scooter-bay',8,2.3,1.5),('cycle-dock',-12,5.0,1.8)]:
    for adjust in [0,1.5,-1.5,3,-3]:
     t=ex['t']+dt+adjust;d=ex['side']*(half(t,ex['side'])+1.15)
     if at_mouth(t,ex['side'],L/2+1):continue
     if place(kind,t,d,L,W,{'side':ex['side'],'length':L,'width':W,'source':'roadview-2026-06-relative-fit','cluster':'mia-exit-4'}):
      reviewed.append(kind);break
 # The tiny mapped 188-1 structure is a street kiosk, not a one-storey house.
 mappedKiosks=[]
 if root.parent.name=='f20b139277e4d2a5':
  f=next((f for f in buildings['features'] if f['properties']['objectid']==5965444),None)
  if f:
   ps=[ll(*q) for q in f['geometry']['coordinates'][0]];fp=Polygon(ps);p=list(fp.centroid.coords)[0]
   a,b=max(zip(ps[:-1],ps[1:]),key=lambda ab:Point(ab[0]).distance(Point(ab[1])));L=Point(a).distance(Point(b));W=fp.area/L
   furniture.append({'kind':'kiosk','position':[p[0],height(*p)+.02,p[1]],'heading':math.atan2(b[0]-a[0],b[1]-a[1]),'side':1,'length':L,'width':W,'footprint':ps,'mappedBuilding':5965444,'source':'mapped-footprint-roadview-form'})
   mappedKiosks.append(5965444);reviewed.append('kiosk')
 # Build a narrow kerb service strip. Keep a continuous pedestrian strip behind it.
 for side in [-1,1]:
  for t in np.arange(t0+8,t1-5,12):
   if not at_mouth(t,side,2):
    d=side*(half(t,side)-.24);fp=rect(t,d,.7,.30)
    if road.covers(fp) and not junctionArea.intersects(fp):
     p=xy(t,d);furniture.append({'kind':'drain','position':[p[0],height(*p)+.043,p[1]],'heading':math.atan2(u[0],u[1]),'footprint':list(fp.exterior.coords),'walkable':True})
  for t in np.arange(t0+20,t1-8,53):
   if not at_mouth(t,side,3):place('utility-cover',t,side*(half(t,side)+.72),.7,.55)
 for side in [-1,1]:
  for i,t in enumerate(np.arange(t0+12,t1-10,17)):
   d=side*(half(t,side)+.95)
   if at_mouth(t,side,4) or any(rect(t,d,1.55,1.55).distance(Polygon(e['footprint']))<3.5 for e in exits):continue
   if place('tree-pit',t,d,1.55,1.55):
    x,z=xy(t,d);trees.append({'id':f'arterial-tree-{side}-{i}','asset':'ginkgo' if side==1 else 'zelkova','kind':'tree','root':[x,height(x,z)+.15,z],'height':9,'radius':2.8,'clearance':2.4,'heading':0,'owner':None,'source':'arterial-row'})
  for i,t in enumerate(np.arange(t0+18,t1-10,32)):
   d=side*(half(t,side)+.55)
   if at_mouth(t,side,4):continue
   if place('lamp-base',t,d,.7,.7):
    x,z=xy(t,d);lights.append({'id':f'arterial-light-{side}-{i}','type':'arterial','root':[x,height(x,z)+.15,z],'direction':(-side*n).tolist(),'height':8.6,'reach':2,'variant':2})
  for m in mouths:
   if m['side']!=side:continue
   for delta in [-m['width']/2-.65,m['width']/2+.65]:place('bollard',m['t']+delta,side*(half(m['t'],side)+.6),.38,.38)
  for i,t in enumerate(np.arange(t0+37,t1-15,64)):
   if at_mouth(t,side,5):continue
   place('cabinet' if i%2==0 else 'hydrant',t,side*(half(t,side)+1),1.1,.65)
  for i,t in enumerate(np.arange(t0+52,t1-18,92)):place('bike-rack',t,side*(half(t,side)+1.25),3.5,1.3)
 vp=read('vegetation/placements.json');vp['trees']=[p for p in vp['trees'] if not public.buffer(1).covers(Point(p['root'][0],p['root'][2]))]+trees;save('vegetation/placements.json',vp)
 transitLights=[]
 for obj in platforms+exits:
  for j,dz in enumerate([-3,0,3] if obj in platforms else [-2,2]):
   x,z=xy(obj['t']+dz,obj['d']);transitLights.append({'id':f"transit-light-{obj['id']}-{j}",'type':'transit','root':[x,height(x,z)+.17 if obj in platforms else obj['position'][1],z],'direction':n.tolist(),'height':2.53,'reach':.05,'variant':2,'intensity':36})
 sl=read('environment/streetlights.json');ids={p['id'] for p in up['poles']};sl['lights']=[l for l in sl['lights'] if not public.buffer(.3).covers(Point(l['root'][0],l['root'][2])) and (l['type']!='pole' or l.get('poleId') in ids)]+lights+transitLights;sl['qa']['lights']=len(sl['lights']);save('environment/streetlights.json',sl)
 pp=read('people/placements.json');characters=[p['character'] for p in pp['people']];pp['people']=[p for p in pp['people'] if not public.covers(Point(p['x'],p['z']))]
 for side in [-1,1]:
  for i,t in enumerate(np.arange(t0+20,t1-12,15.5)):
   p=xy(t,side*(half(t,side)+2.1));fp=Point(p).buffer(.42)
   if not sidewalks.covers(fp) or any(fp.intersects(o.buffer(.3)) for o in occupied):continue
   pp['people'].append({'id':f'arterial-person-{side}-{i}','x':p[0],'z':p[1],'ground':height(*p)+.15,'height':1.62+i%5*.025,'heading':math.atan2(u[0]*side,u[1]*side),'character':characters[i%len(characters)],'radius':.42,'pose':'walk-mid-stride','animated':False})
 save('people/placements.json',pp)
 # Markings and curb geometry are generated from the SAME connected alignment.
 decals={'white':[],'blue':[],'yellow':[],'tactile':[],'joint':[],'paverLight':[],'paverMid':[],'paverDark':[]};curbs=[];fences=[];crossings=[]
 def mark(g,color,lift=.052):decals[color].extend(mesh(g.intersection(public).difference(holes),lift))
 if root.parent.name=='f20b139277e4d2a5' and exits:
  e=next((e for e in exits if e['side']>0),exits[0])
  for i,t in enumerate(np.arange(e['t']-6,e['t']+30,.85)):
   for j,offset in enumerate(np.arange(.35,5.05,.85)):
    tile=rect(t,e['side']*(half(t,e['side'])+offset),.82,.82).intersection(sidewalks)
    if tile.area>.15:mark(tile,['paverLight','paverMid','paverLight','paverDark'][(i+j)%4],.151)
 for side in [-1,1]:
  if hasbus:mark(strip(lambda t:side*(.35+lane)-.065,lambda t:side*(.35+lane)+.065).difference(unary_union([rect(c['t'],0,c['width']+2,40) for c in crosswalks])),'blue')
  for t in np.arange(t0,t1-4,9):
   for k in range(1,lanes//2):
    if k==1 and hasbus:continue
    if at_crossing(t+2,3) or junctionArea.covers(Point(xy(t+2))):continue
    d=lambda q:side*(.35+lane*k+widen(q,side))
    mark(strip(lambda q:d(q)-.06,lambda q:d(q)+.06,t,t+4),'white')
  for t in np.arange(t0,t1-1,1.1):
   if at_mouth(t,side,.3) or at_crossing(t,.9):continue
   a=xy(t,side*half(t,side));b=xy(min(t+1.1,t1),side*half(min(t+1.1,t1),side))
   if any(br['road'].buffer(.1).intersects(LineString([a,b])) for br in branches):continue
   curbs.append({'a':a,'b':b})
  def tactileD(t):
   offset=2.7
   for e in exits:
    if e['side']!=side:continue
    proximity=max(0,min(1,(11.5-abs(t-e['t']))/5))
    offset=min(offset,2.7-1.5*proximity)
   # The exit bypass must also clear adjacent cycles/scooters, not cut through them.
   for f in furniture:
    if f['kind'] not in ['station-vent','scooter-bay','cycle-dock']:continue
    tt,dd=local([f['position'][0],f['position'][2]])
    if dd*side<0:continue
    proximity=max(0,min(1,(f['length']/2+2.4-abs(t-tt))/2.4))
    required=abs(dd)-half(t,side)+f['width']/2+.38
    offset=max(offset,offset*(1-proximity)+required*proximity)
   return side*(half(t,side)+offset)
  for t in np.arange(t0,t1-.5,.5):
   g=strip(lambda q:tactileD(q)-.15,lambda q:tactileD(q)+.15,t,t+.5)
   if sidewalks.covers(g):mark(g,'tactile',.16)
  # Coarse paving courses stay subordinate to line art (no dense brick wireframe).
  for t in np.arange(t0,t1,.8):
   mark(rect(t,side*(half(t,side)+2.65),.012,5.3).intersection(sidewalks),'joint',.15)
 for side in [-1,1]:
  for t in np.arange(t0+32,t1-10,62):
   for k in range(lanes//2):
    if at_crossing(t,5) or junctionArea.covers(Point(xy(t))):continue
    d=side*(.35+lane*(k+.5)+(widen(t,side) if k else 0));flow=-side
    arrow=Polygon([xy(t+v*flow,d+w) for w,v in [(-.16,-2),(.16,-2),(.16,.55),(.65,.55),(0,2),(-.65,.55),(-.16,.55)]])
    mark(arrow.intersection(road),'white')
 for t in np.arange(t0+2,t1-2,2.4):
  if junctionArea.intersects(LineString([xy(t),xy(t+2.4)])):continue
  # Gaps at the ends of bus platforms connect passengers to a marked crosswalk.
  if any(min(abs(t-c['t']),abs(t+2.4-c['t']))<c['width']/2+1.1 for c in crosswalks):continue
  fences.append({'a':xy(t,0),'b':xy(min(t+2.4,t1),0)})
 for c in crosswalks:
  t,W=c['t'],c['width']
  lo,hi=-half(t,-1)+.15,half(t,1)-.15
  for dd in np.arange(lo+.28,hi-.25,.95):mark(rect(t,dd,W,.48).intersection(road),'white')
  for side in [-1,1]:
   # Signals stand beside the crossing, never in the route or on a zebra stripe.
   tt=t+side*(W/2+.8);d=side*(half(tt,side)+.6);p=xy(tt,d)
   crossings.append({'crosswalkId':c['id'],'t':t,'side':side,'position':[p[0],height(*p)+.145,p[1]],'heading':math.atan2(u[0]*(-side),u[1]*(-side))})
   stopT=t+side*(W/2+2.3)
   if not junctionTs or min(abs(stopT-j) for j in junctionTs)>min(abs(t-j) for j in junctionTs):
    mark(rect(stopT,side*half(stopT,side)/2,.45,half(stopT,side)-.4).intersection(road),'white')
   # Detectable warning strip and a branch from the longitudinal tactile route.
   mark(rect(t,side*(half(t,side)+1.45),W-.4,.55).intersection(sidewalks),'tactile',.162)
   mark(rect(t,side*(half(t,side)+2.15),.30,1.45).intersection(sidewalks),'tactile',.162)
 for m in mouths:
  side=m['side'];d=side*(half(m['t'],side)+2.4)
  for tt in np.arange(m['t']-m['width']/2+.4,m['t']+m['width']/2,.85):mark(rect(tt,d,.43,3.4),'white')
 branchCrosswalks=0
 # Paint and curbs on the other junction arms follow their own centerlines.
 for bi,br in enumerate(branches):
  line=br['line'];L=line.length;halfB=br['width']/2
  def bxy(t,d):
   p=np.array(line.interpolate(max(0,min(L,t))).coords[0]);v=np.array(line.interpolate(min(L,t+.2)).coords[0])-np.array(line.interpolate(max(0,t-.2)).coords[0]);v/=np.linalg.norm(v)
   return (p+np.array([v[1],-v[0]])*d).tolist()
  def brect(t,d,l,w):return Polygon([bxy(t-l/2,d-w/2),bxy(t+l/2,d-w/2),bxy(t+l/2,d+w/2),bxy(t-l/2,d+w/2)])
  jt=line.project(br['junction']);direction=1 if jt<L/2 else -1;ct=jt+direction*(baseHalf+10)
  for t in np.arange(1,L-1,1):
   if junctionArea.covers(line.interpolate(t)):continue
   if abs(t-ct)>3:
    for d in [-.13,.13]:mark(brect(t,d,1,.09).intersection(road),'yellow')
   if abs(t-ct)>4 and int(t)%9<4:
    for side in [-1,1]:mark(brect(t,side*halfB/2,1,.12).intersection(road),'white')
   for side in [-1,1]:
    a,b=bxy(t,side*halfB),bxy(min(t+1,L),side*halfB)
    if abs(t-ct)>3 and sidewalks.distance(LineString([a,b]))<.08:curbs.append({'a':a,'b':b})
  if 3<ct<L-3:
   branchCrosswalks+=1
   for d in np.arange(-halfB+.4,halfB-.2,.95):mark(brect(ct,d,4.2,.48).intersection(road),'white')
   for side in [-1,1]:
    if side==direction:mark(brect(ct+side*4.4,side*halfB/2,.4,halfB-.3).intersection(road),'white')
 vehicles=[]
 for side in [-1,1]:
  for i,t in enumerate(np.arange(t0+22,t1-15,42)):
   k=i%(lanes//2);d=side*(.35+lane*(k+.5)+widen(t,side));p=xy(t,d)
   if not road.covers(rect(t,d,5.2,2)) or at_crossing(t,5.2) or junctionArea.intersects(rect(t,d,5.2,2)):continue
   vehicles.append({'kind':'car','position':[p[0],height(*p)+.045,p[1]],'heading':math.atan2(u[0]*(-side),u[1]*(-side)),'variant':(i+(side+1)*2)%5,'footprint':list(rect(t,d,4.7,1.85).exterior.coords)})
  if hasbus:
   t=next((s['t'] for s in platforms if s['side']==side),side*50);d=side*(.35+lane/2);p=xy(t,d)
   vehicles.append({'kind':'bus','position':[p[0],height(*p)+.045,p[1]],'heading':math.atan2(u[0]*(-side),u[1]*(-side)),'variant':0 if side<0 else 1,'footprint':list(rect(t,d,11,2.45).exterior.coords)})
 commercial=[]
 if root.parent.name=='f20b139277e4d2a5':
  for f in buildings['features']:
   pr=f['properties'];owner=pr['objectid']
   if owner not in [5965443,5965441]:continue
   poly=f['geometry']['coordinates'][0] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates'][0][0]
   pts=np.asarray([ll(*p) for p in poly[:-1]])
   area=sum(pts[i,0]*pts[(i+1)%len(pts),1]-pts[(i+1)%len(pts),0]*pts[i,1] for i in range(len(pts)))
   for i,a in enumerate(pts):
    b=pts[(i+1)%len(pts)];vec=b-a;L=np.linalg.norm(vec)
    if L<3.4:continue
    normal=np.array([vec[1],-vec[0]])/L*(1 if area>=0 else -1);mid=(a+b)/2;t,d=local(mid)
    if np.dot(normal,n*(-1 if d>0 else 1))<.65:continue
    commercial.append({'owner':owner,'edge':i,'style':'ribbon-glass' if owner==5965443 else 'curtain-glass','source':'2026-06-roadview-form-reference','confidence':'appearance-observed-placement-inferred'})
 frontages=[]
 for f in buildings['features']:
  pr=f['properties'];owner=pr['objectid']
  if owner in mappedKiosks:continue
  poly=f['geometry']['coordinates'][0] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates'][0][0]
  pts=np.asarray([ll(*p) for p in poly[:-1]])
  area=sum(pts[i,0]*pts[(i+1)%len(pts),1]-pts[(i+1)%len(pts),0]*pts[i,1] for i in range(len(pts)))
  for i,a in enumerate(pts):
   b=pts[(i+1)%len(pts)];vec=b-a;L=np.linalg.norm(vec)
   if L<3.5:continue
   normal=np.array([vec[1],-vec[0]])/L*(1 if area>=0 else -1);mid=(a+b)/2;t,d=local(mid)
   if abs(d)>half(t,1 if d>0 else -1)+12 or not t0+2<t<t1-2:continue
   if np.dot(normal,n*(-1 if d>0 else 1))<.65:continue
   ray=LineString([mid+normal*.35,center(t)+n*np.sign(d)*(half(t,1 if d>0 else -1)+.4)])
   if ray.intersection(built).length>.1:continue
   frontages.append({'owner':owner,'edge':i,'length':float(L),'t':t,'side':1 if d>0 else -1})
 qa={'version':82,'roadPriority':reservation['qa'] if reservation else None,'junctionArms':len(branches),'lanes':lanes,'busLanes':2 if hasbus else 0,'platforms':len(platforms),'subwayExits':len(exits),'streetTrees':len(trees),'streetlights':len(lights),'transitLights':len(transitLights),'vehicles':len(vehicles),'sideStreetMouths':len(mouths),'roadBuildingOverlapM2':round(road.intersection(built).area,7),'sidewalkBuildingOverlapM2':round(sidewalks.intersection(built).area,7),'footprintBuildingOverlapM2':round(sum(Polygon(o['footprint']).intersection(built).area for o in furniture+exits+platforms+vehicles if not o.get('mappedBuilding')),7),'undergroundBuildingFootprintsExcluded':len(underground),'originalDataPreserved':True,'reviewedFurniture':reviewed,'commercialFacades':len(commercial),'crosswalks':len(crosswalks)+branchCrosswalks,'crossingSignals':len(crossings),'shopFacingEdges':len(frontages)}
 if qa['footprintBuildingOverlapM2']>.01:raise ValueError('Arterial footprint/building intersection')
 storefrontOverrides=json.loads((WORK/'arterial-v77/frontage-references.json').read_text()) if root.parent.name=='f20b139277e4d2a5' else []
 extent=int(loc.get('sizeMetres',300)/2)+20
 supportTerrain={'origin':[-extent,-extent],'step':5,'size':extent*2//5+1,'heights':[round(height(x,z),6) for z in range(-extent,extent+1,5) for x in range(-extent,extent+1,5)]}
 plan={'version':82,'supportTerrain':supportTerrain,'landings':landings,'name':(loc.get('roadAddress') or {}).get('road_name','큰길'),'alignment':{'u':u.tolist(),'n':n.tolist(),'knots':knots},'halfWidth':baseHalf,'laneWidth':lane,'lanes':lanes,'busLanes':hasbus,'publicRings':rings(public),'surfaces':{'ground':mesh(box(-extent,-extent,extent,extent).difference(holes))},'decals':decals,'curbs':curbs,'fences':fences,'crossings':crossings,'crosswalks':crosswalks,'shopFrontages':frontages,'platforms':platforms,'exits':exits,'furniture':furniture,'vehicles':vehicles,'commercialFacades':commercial,'mappedKiosks':mappedKiosks,'storefrontOverrides':storefrontOverrides,'qa':qa,'provenance':{'road':'OpenStreetMap / OpenFreeMap','busStops':'https://data.seoul.go.kr/dataList/OA-15067/A/1/datasetView.do','exits':'Kakao Local POI','appearance':'2026-06 Kakao Roadview, samples in arterial-study-v75 and arterial-v77/roadview','inferred':'Widths, lengths, furniture intervals and crossing access are visual reconstruction, not measured survey.'}}
 write(out/'plan.json',plan)
 manifest=read('manifest.json') if (root/'manifest.json').exists() else {}
 manifest['arterial']={'version':82,'plan':'arterial/plan.json','overrides':override,'qa':qa};write(root/'manifest.json',manifest)
 print(json.dumps(qa,ensure_ascii=False));return manifest['arterial']
if __name__=='__main__':build(sys.argv[1])
