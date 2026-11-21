"""Generate junctions from confirmed road footprints, never stretched demo GLBs.
All dimensions below are art defaults, not measured or statutory dimensions.
"""
import json,math
from pathlib import Path
import shapely as S
from shapely.geometry import Point,LineString,Polygon,shape,mapping,box
from shapely.ops import unary_union
from road_geometry import width_at

def parts(g,kind):
 if g.geom_type==kind:return [g] if not g.is_empty else []
 return [p for c in getattr(g,'geoms',[]) for p in parts(c,kind)]
def triangles(g):
 return [list(t.exterior.coords)[:3] for p in parts(S.make_valid(g),'Polygon') for t in S.get_parts(S.constrained_delaunay_triangles(p)) if t.area>1e-8]
def local_rect(q,u,n,a,b,c,d):return Polygon([(q[0]+u[0]*t+n[0]*s,q[1]+u[1]*t+n[1]*s) for t,s in [(a,c),(b,c),(b,d),(a,d)]])
def grade(r):return int(r.get('grade') or 0)
def layer(r):
 p=r.get('properties',{});return (str(p.get('layer',0)),str(p.get('brunnel','')),str(p.get('bridge','')),str(p.get('tunnel','')))
def junction_nodes(roads):
 groups={};nodes=[]
 for r in roads:
  p=r.get('properties',{})
  if grade(r)<1 or any(p.get(k)=='no' for k in ('motor_vehicle','vehicle','access')) or p.get('class')=='busway':continue
  groups.setdefault(layer(r),[]).append(r)
 for rs in groups.values():
  lines=[shape(r['geometry']) for r in rs];edges=parts(unary_union(lines),'LineString');adj={}
  for e in edges:
   mid=e.interpolate(.5,normalized=True);owner=min(range(len(rs)),key=lambda i:lines[i].distance(mid));r=rs[owner]
   for reverse in [False,True]:
    ps=list(e.coords);ps=ps[::-1] if reverse else ps;q=ps[0];k=tuple(round(v,5) for v in q);l=LineString(ps);s=l.interpolate(min(4,l.length));dx,dz=s.x-q[0],s.y-q[1];L=math.hypot(dx,dz)
    if L:adj.setdefault(k,[]).append({'road':r,'line':l,'u':[dx/L,dz/L],'length':l.length})
  for q,arms in adj.items():
   transition=len(arms)==2 and any(a['road'].get('endTapers') for a in arms) and abs(arms[0]['road']['width']-arms[1]['road']['width'])>.1
   if len(arms)>=3 or transition:nodes.append({'point':list(q),'arms':arms,'grades':sorted(set(grade(a['road']) for a in arms)),'kind':'width-transition' if transition else 'junction'})
 return nodes

def plan_junctions(roads,road,sidewalk,height,protected=None,barriers=None):
 nodes=junction_nodes(roads);public=road.union(sidewalk);zones=[];crossings=[];skipped=[];marks={'white':[],'yellow':[]};curbs=[];ramps=[];assets=[]
 # Fill only concave corners already reserved as public ground. No building expands/moves here.
 for node in nodes:
  node['radius']=max(a['road']['width']/2 for a in node['arms'])+16
  zones.append(Point(node['point']).buffer(node['radius'],quad_segs=12))
 if protected is not None and not protected.is_empty:
  kept=[(n,z) for n,z in zip(nodes,zones) if not z.intersects(protected)]
  skipped += [{'point':n['point'],'reason':'existing transit access preserved; needs specific review'} for n,z in zip(nodes,zones) if z.intersects(protected)]
  nodes=[n for n,z in kept];zones=[z for n,z in kept]
 zone=unary_union(zones).intersection(public)
 for node,mask in zip(nodes,zones):
  sines=[abs(a['u'][0]*b['u'][1]-a['u'][1]*b['u'][0]) for i,a in enumerate(node['arms']) for b in node['arms'][i+1:]]
  angle=min((s for s in sines if s>.05),default=1)
  radius=min(2.4,max(.45,min(a['road']['width'] for a in node['arms'])*.12))*(.65+.35*angle)
  node['cornerRadius']=round(radius,3);mask=mask.intersection(public)
  rounded=road.buffer(radius,quad_segs=6).buffer(-radius,quad_segs=6).intersection(public)
  road=road.difference(mask).union(rounded.intersection(mask))
 sidewalk=public.difference(road)
 def mark(g,kind):
  clipped=g.intersection(road).intersection(zone)
  if not clipped.is_empty:marks[kind].append(clipped)
 occupied=Polygon()
 for ji,node in enumerate(nodes):
  if node['kind']=='width-transition':continue
  q=node['point']
  for ai,arm in enumerate(node['arms']):
   u=arm['u'];n=[-u[1],u[0]];r=arm['road'];half=r['width']/2
   # Crossing is beyond all adjacent carriageways, not at a fixed distance from the centre.
   d=0
   for other in node['arms']:
    sine=abs(u[0]*other['u'][1]-u[1]*other['u'][0])
    if sine>.25:d=max(d,(other['road']['width']/2+(half+2)*abs(u[0]*other['u'][0]+u[1]*other['u'][1]))/sine)
   d+=4.2
   if arm['length']<d+5:skipped.append({'junction':ji,'arm':ai,'reason':'short arm; crossing requires two clear landings'});continue
   center=[q[0]+u[0]*d,q[1]+u[1]*d];corridor=local_rect(center,u,n,-1.2,1.2,-half,half)
   landing_rows=[]
   for sign in [-1,1]:
    # Only use existing sidewalks. Narrow sidewalks receive a shorter generated ramp, no stretched GLB.
    depth=0
    for candidate in [1.8,1.5,1.2,.9]:
     fp=local_rect(center,u,n,-1.2,1.2,sign*half,sign*(half+candidate))
     if sidewalk.buffer(.04).covers(fp):depth=candidate;break
    if not depth:break
    fp=local_rect(center,u,n,-1.2,1.2,sign*half,sign*(half+depth));landing_rows.append({'footprint':mapping(fp),'center':[center[0]+n[0]*sign*(half+depth/2),center[1]+n[1]*sign*(half+depth/2)],'out':[n[0]*sign,n[1]*sign],'depth':depth,'width':2.4})
   if len(landing_rows)!=2:skipped.append({'junction':ji,'arm':ai,'reason':'no pair of clear sidewalk landings'});continue
   allfp=corridor.union(unary_union([shape(l['footprint']) for l in landing_rows]))
   if not unary_union(zones).buffer(-2).covers(allfp):skipped.append({'junction':ji,'arm':ai,'reason':'complete crossing exceeds junction patch'});continue
   if barriers is not None and allfp.intersects(barriers):skipped.append({'junction':ji,'arm':ai,'reason':'existing divider blocks inferred crossing'});continue
   if allfp.intersects(occupied):skipped.append({'junction':ji,'arm':ai,'reason':'crossing conflicts with another crossing'});continue
   occupied=occupied.union(allfp.buffer(.2))
   crossings.append({'junction':ji,'arm':ai,'center':center,'direction':u,'width':2.4,'landings':landing_rows,'footprint':mapping(allfp),'source':'inferred pedestrian connection; not surveyed traffic control'})
   for s in range(math.ceil(r['width']/.65)):
    lo=-half+.18+s*.65;hi=min(lo+.4,half-.18)
    if hi>lo:mark(local_rect(center,u,n,-1.2,1.2,lo,hi),'white')
   # Right-hand inbound half only. One-way direction is not inferred from grade.
   one=str(r.get('properties',{}).get('oneway','')).lower()
   if grade(r)>=2 and one not in ('yes','1','true','-1'):mark(local_rect(center,u,n,2.1,2.45,.15,half-.2),'white')
   for landing in landing_rows:
    ramps.append(landing)
    out=landing['out'];depth=landing['depth'];c=landing['center'];top=[c[0]+out[0]*(depth/2-.22),c[1]+out[1]*(depth/2-.22)]
    assets.append({'assetId':'junction:tactile-warning','position':[top[0],height(*top)+.035+.15,top[1]],'heading':math.atan2(-out[1],out[0]),'slope':[height(top[0]+.5,top[1])-height(top[0]-.5,top[1]),height(top[0],top[1]+.5)-height(top[0],top[1]-.5)]})
 # Paint only approaches; major/minor intersections keep the through road centreline when side arms are grade 1.
 for node in nodes:
  q=node['point'];main=max(node['grades']);minor=any(g==1 for g in node['grades'])
  for a in node['arms']:
   r=a['road'];g=grade(r)
   if g<2:continue
   u=a['u'];n=[-u[1],u[0]];half=r['width']/2;start=0 if node['kind']=='width-transition' or minor and g==main else max(x['road']['width']/2 for x in node['arms'])+2
   end=min(a['length'],node['radius']+2)
   line=LineString([[q[0]+u[0]*start,q[1]+u[1]*start],[q[0]+u[0]*end,q[1]+u[1]*end]])
   if str(r.get('properties',{}).get('oneway','')).lower() not in ('yes','1','true','-1'):mark(line.buffer(.06,cap_style=2),'yellow')
   if g>=3:
    lanes={3:2,4:3}[g]
    fractions=[-0.5+j/lanes for j in range(1,lanes)] if r.get('carriagewayPair') else [j/(2*lanes)*sign for j in range(1,lanes) for sign in [-1,1]]
    source_line=shape(r['geometry'])
    for fraction in fractions:
     t=start
     while t<end:
      points=[]
      for distance in (t,min(t+1.5,end)):
       center=Point(q[0]+u[0]*distance,q[1]+u[1]*distance);offset=width_at(r,source_line.project(center),source_line)*fraction
       points.append([center.x+n[0]*offset,center.y+n[1]*offset])
      mark(LineString(points).buffer(.06,cap_style=2).difference(occupied),'white');t+=3
 rampmask=unary_union([shape(r['footprint']) for r in ramps])
 # Curb along the shared boundary only, segmented on the terrain, with crossing openings removed.
 boundary=sidewalk.boundary.intersection(road.buffer(.015)).intersection(zone).difference(rampmask.buffer(.08))
 for line in parts(boundary,'LineString'):
  for a,b in zip(line.coords,line.coords[1:]):
   L=math.dist(a,b);steps=max(1,math.ceil(L/.5))
   for i in range(steps):
    p=[a[k]+(b[k]-a[k])*i/steps for k in (0,1)];s=[a[k]+(b[k]-a[k])*(i+1)/steps for k in (0,1)]
    if math.dist(p,s)>.02:curbs.append({'a':p,'b':s})
 mark_shapes={k:(unary_union(v).difference(occupied) if k=='yellow' else unary_union(v)) for k,v in marks.items()}
 result={'version':1,'junctions':[{'point':n['point'],'grades':n['grades'],'arms':len(n['arms']),'radius':n['radius'],'cornerRadius':n['cornerRadius'],'kind':n['kind']} for n in nodes],'zone':mapping(zone),'road':mapping(road),'sidewalk':mapping(sidewalk),'crossings':crossings,'ramps':ramps,'curbs':curbs,'assets':assets,'marks':{k:mapping(v) for k,v in mark_shapes.items()},'skipped':skipped}
 result['qa']={'junctions':len(nodes),'crossings':len(crossings),'curbSegments':len(curbs),'tactileParts':len(assets),'roadSidewalkOverlapM2':round(road.intersection(sidewalk).area,8),'markOutsideRoadM2':round(sum(g.difference(road).area for g in mark_shapes.values()),8),'gradePairs':sorted(set('-'.join(map(str,n['grades'])) for n in nodes)),'inferred':True}
 return result

def cut_positions(values,mask):
 """Clip each original 3D triangle without flattening its supporting plane."""
 out=[]
 for i in range(0,len(values),9):
  vs=[values[i+j:i+j+3] for j in (0,3,6)];p=Polygon([(v[0],v[2]) for v in vs])
  if p.area<1e-9:continue
  if not p.intersects(mask):out.extend(values[i:i+9]);continue
  a,b,c=vs;den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2])
  for t in triangles(p.difference(mask)):
   for x,z in t:
    u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den
    out.extend([x,u*a[1]+v*b[1]+(1-u-v)*c[1],z])
 return out

def draped_positions(g,surface,lift):
 """Paint shares the final ground's triangle planes, including seam blending."""
 out=[]
 for i in range(0,len(surface),9):
  a,b,c=[surface[i+j:i+j+3] for j in (0,3,6)];poly=Polygon([(v[0],v[2]) for v in (a,b,c)])
  if poly.area<1e-9 or not poly.intersects(g):continue
  d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2])
  for tri in triangles(poly.intersection(g)):
   for x,z in tri:
    u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d
    out.extend([x,u*a[1]+v*b[1]+(1-u-v)*c[1]+lift,z])
 return out

def surface_positions(g,height,offset=0):
 result=[]
 if g.is_empty:return result
 # Terrain changes on a 5m triangulation; split using the exact same diagonal.
 x0,z0,x1,z1=g.bounds
 for x in range(math.floor(x0/5)*5,math.ceil(x1/5)*5,5):
  for z in range(math.floor(z0/5)*5,math.ceil(z1/5)*5,5):
   for cell in [Polygon([(x,z),(x+5,z),(x,z+5)]),Polygon([(x+5,z),(x+5,z+5),(x,z+5)])]:
    if not cell.intersects(g):continue
    for t in triangles(cell.intersection(g)):
     for px,pz in t:result.extend([px,height(px,pz)+(offset(px,pz) if callable(offset) else offset),pz])
 return result

def build(root,roads=None,terrain=None):
 root=Path(root);read=lambda p:json.loads((root/p).read_text());write=lambda p,v:(root/p).write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')))
 if not (root/'road-reservation.json').exists():return None
 loc=read('location.json');roads=roads or read('roads-source.json')['roads']
 if terrain is None:
  from kakao_terrain import load_terrain
  terrain=load_terrain(root,loc)
 height=terrain.mesh_height;s=read('road-reservation.json')['surfaces'];road=shape(s['carriageway']).union(shape(s['shared']));sidewalk=shape(s['sidewalk'])
 arterial=read('arterial/plan.json') if (root/'arterial/plan.json').exists() else None
 protected=Polygon();barriers=Polygon()
 if arterial:
  footprints=[Polygon(a['footprint']) for key in ['platforms','exits'] for a in arterial.get(key,[]) if a.get('footprint')]
  for l in arterial.get('landings',[]):
   if l.get('kind')!='crosswalk-ramp':footprints += [Polygon(r['outer'],r.get('holes',[])) for r in l.get('rings',[])]
  protected=unary_union(footprints).buffer(2)
  barriers=unary_union([LineString([p['a'],p['b']]).buffer(.2) for p in arterial.get('fences',[])])
 plan=plan_junctions(roads,road,sidewalk,height,protected,barriers)
 path='arterial/road-context.json' if (root/'arterial/road-context.json').exists() else 'road-context.json';rc=read(path)
 zone=shape(plan['zone']);feather_boundary=unary_union([Point(j['point']).buffer(j['radius'],quad_segs=12) for j in plan['junctions']]).boundary
 if zone.is_empty:
  write('junction-plan.json',plan);manifest=read('manifest.json');manifest['junctions']={'version':1,'qa':plan['qa'],'plan':'junction-plan.json'};write('manifest.json',manifest);return plan['qa']
 # Blend into existing surface datum at patch edges, including legacy flat sidewalks.
 original={k:list(v) for k,v in rc['positions'].items()};cells={};seam_polys=[];seam_band=feather_boundary.buffer(2).intersection(zone)
 for kind,values in original.items():
  for i in range(0,len(values),9):
   vs=[values[i+j:i+j+3] for j in (0,3,6)];p=Polygon([(v[0],v[2]) for v in vs])
   if p.area<1e-9 or not p.intersects(zone.buffer(.1)):continue
   a,b,c=vs;den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);x0,z0,x1,z1=p.bounds
   if p.intersects(seam_band):seam_polys.append((p,a,b,c,den))
   for x in range(math.floor(x0/5),math.floor(x1/5)+1):
    for z in range(math.floor(z0/5),math.floor(z1/5)+1):cells.setdefault((x,z),[]).append((a,b,c,den))
 def old_offset(x,z):
  for a,b,c,d in cells.get((math.floor(x/5),math.floor(z/5)),[]):
   u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d
   if u>=-1e-5 and v>=-1e-5 and u+v<=1.00001:return u*a[1]+v*b[1]+(1-u-v)*c[1]-height(x,z)
  return .026
 def offset(x,z,target):
  f=min(1,feather_boundary.distance(Point(x,z))/2);return old_offset(x,z)*(1-f)+target*f
 def asphalt(x,z):return offset(x,z,.035)
 def walk(x,z):return offset(x,z,.185)
 def connected_surface(g,target,lift=0):
  # Keep the original triangle edges AND its own plane at the patch boundary.
  # A global point lookup is ambiguous where old surface triangles touch/overlap.
  datum=lambda x,z:offset(x,z,target)+lift
  band=g.intersection(seam_band);out=surface_positions(g.difference(seam_band),height,datum)
  for poly,a,b,c,d in seam_polys:
   piece=band.intersection(poly)
   if piece.is_empty:continue
   def plane_datum(x,z):
    u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d
    old=u*a[1]+v*b[1]+(1-u-v)*c[1]-height(x,z);f=min(1,feather_boundary.distance(Point(x,z))/2)
    return old*(1-f)+target*f+lift
   out+=surface_positions(piece,height,plane_datum);band=band.difference(poly)
  out+=surface_positions(band,height,datum)
  return out
 ramps=[r for r in plan['ramps'] if zone.covers(shape(r['footprint']))];rm=unary_union([shape(r['footprint']) for r in ramps])
 for k,v in rc['positions'].items():rc['positions'][k]=cut_positions(v,zone)
 rc['normals']={}
 road_surface=connected_surface(shape(plan['road']).intersection(zone),.035)
 # Adjacent blended triangles can sample the feather at different subdivisions.
 # Share interior road vertices; keep old outer seam and real curb heights fixed.
 interior=shape(plan['road']).buffer(-.2).intersection(zone.buffer(-.01));vertices={}
 for i in range(0,len(road_surface),3):
  x,y,z=road_surface[i:i+3]
  if interior.covers(Point(x,z)):vertices.setdefault((round(x,6),round(z,6)),[]).append(i)
 for indices in vertices.values():
  heights={road_surface[i+1] for i in indices}
  if max(heights)-min(heights)>.000001:
   shared=sum(heights)/len(heights)
   for i in indices:road_surface[i+1]=shared
 rc['positions'].setdefault('asphalt',[]);rc['positions']['asphalt']+=road_surface
 rc['positions'].setdefault('sidewalk',[]);rc['positions']['sidewalk']+=connected_surface(shape(plan['sidewalk']).intersection(zone).difference(rm),.185)
 # Both classes use the same asphalt material. One mesh avoids a false object
 # silhouette at the patch edge while retaining real depth/normal contours.
 rc['positions']['asphalt']+=rc['positions'].pop('arterial',[])
 # Existing wear and large-road overlays relinquish this exact region.
 for k,v in rc.get('wear',{}).get('positions',{}).items():rc['wear']['positions'][k]=cut_positions(v,zone)
 geometry={'white':[],'yellow':[],'curb':[],'ramp':[]}
 # Confirmed bus-lane boundaries retain their colour and alignment through minor junctions.
 blue=(arterial or {}).get('decals',{}).get('blue',[])
 blue_area=unary_union([Polygon([(blue[i+j],blue[i+j+2]) for j in (0,3,6)]) for i in range(0,len(blue),9)])
 for k,g in plan['marks'].items():geometry[k]=draped_positions(shape(g).intersection(zone).difference(rm).difference(blue_area.buffer(.15)),road_surface,.008)
 for r in ramps:
  c=r['center'];n=r['out'];d=r['depth']
  def ry(x,z):
   distance=(x-c[0])*n[0]+(z-c[1])*n[1]+d/2;f=max(0,min(1,distance/(d-.2)));return asphalt(x,z)+(walk(x,z)-asphalt(x,z))*f
  geometry['ramp']+=surface_positions(shape(r['footprint']),height,ry)
 for seg in plan['curbs']:
  a,b=seg['a'],seg['b'];mid=Point((a[0]+b[0])/2,(a[1]+b[1])/2)
  if not zone.covers(mid):continue
  dx,dz=b[0]-a[0],b[1]-a[1];L=math.hypot(dx,dz);nx,nz=-dz/L*.07,dx/L*.07
  # Concrete ribbon has top and both side walls; follows ground and patch feather.
  ps=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]]
  top=[[x,height(x,z)+walk(x,z)+.01,z] for x,z in ps];bottom=[[x,height(x,z)+asphalt(x,z),z] for x,z in ps]
  for tri in [(top[0],top[1],top[2]),(top[0],top[2],top[3])]:geometry['curb'] += [v for p in tri for v in p]
  for i in range(4):
   j=(i+1)%4
   for tri in [(bottom[i],bottom[j],top[j]),(bottom[i],top[j],top[i])]:geometry['curb'] += [v for p in tri for v in p]
 plan['assets']=[a for a in plan['assets'] if zone.covers(Point(a['position'][0],a['position'][2])) and feather_boundary.distance(Point(a['position'][0],a['position'][2]))>2]
 rc['junctions']={'geometry':geometry,'assets':plan['assets'],'qa':plan['qa'],'parts':{'curb':'junction:curb-straight','ramp':'junction:curb-ramp','white':'junction:crossing-stop','yellow':'junction:edge-corner'},'dimensions':'parameterized from reviewed parts; inferred, not survey dimensions'}
 rc.setdefault('qa',{})['junctions']=plan['qa'];write(path,rc)
 if arterial:
  for k,values in arterial['decals'].items():
   if k=='blue':
    clear=unary_union([shape(c['footprint']) for c in plan['crossings']])
    inside=blue_area.intersection(zone).difference(clear)
    arterial['decals'][k]=cut_positions(values,zone)+draped_positions(inside,road_surface,.009)
   else:arterial['decals'][k]=cut_positions(values,zone)
  for key in ['curbs']:
   arterial[key]=[p for p in arterial.get(key,[]) if not LineString([p['a'],p['b']]).intersects(zone)]
  for key in ['landings','crosswalks','crossings','furniture','vehicles']:
   def intersects(p):
    if p.get('footprint'):return Polygon(p['footprint']).intersects(zone)
    if p.get('rings'):return any(Polygon(r['outer'],r.get('holes',[])).intersects(zone) for r in p['rings'])
    return bool(p.get('position') and zone.covers(Point(p['position'][0],p['position'][2])))
   arterial[key]=[p for p in arterial.get(key,[]) if not intersects(p)]
  arterial['qa']['junctionOverride']=plan['qa'];write('arterial/plan.json',arterial)
 # Shared source surfaces inform parcel paint and prop placement as well as the renderer.
 base=read('road-context.json') if path!='road-context.json' else rc
 base['junctionExclusion']=mapping(zone);base['junctionCrossingExclusion']=mapping(unary_union([shape(c['footprint']) for c in plan['crossings']]).intersection(zone))
 if path!='road-context.json':write('road-context.json',base)
 else:write(path,base)
 plan['qa']['activePatchAreaM2']=round(zone.area,3);write('junction-plan.json',plan)
 # Preserve pole/span indices when excluding newly reserved crossing approaches.
 crossing_clear=unary_union([shape(c['footprint']) for c in plan['crossings']]).intersection(zone).buffer(.3)
 if (root/'utilities.json').exists():
  util=read('utilities.json');ids={};kept=[]
  for i,p in enumerate(util['poles']):
   if crossing_clear.covers(Point(p['x'],p['z'])):continue
   ids[i]=len(kept);kept.append({**p,'id':len(kept)})
  util['poles']=kept;util['spans']=[{**s,'a':ids[s['a']],'b':ids[s['b']]} for s in util['spans'] if s['a'] in ids and s['b'] in ids];util['drops']=[{**d,'pole':ids[d['pole']]} for d in util['drops'] if d['pole'] in ids]
  util['qa'].update(poles=len(kept),spans=len(util['spans']),houseDrops=len(util['drops']));write('utilities.json',util)
  if (root/'environment/streetlights.json').exists():
   lights=read('environment/streetlights.json');lights['lights']=[{**p,**({'poleId':ids[p['poleId']]} if p.get('poleId') in ids else {})} for p in lights['lights'] if (p.get('poleId') is None or p['poleId'] in ids) and not crossing_clear.covers(Point(p['root'][0],p['root'][2]))];write('environment/streetlights.json',lights)
 if (root/'vegetation/placements.json').exists():
  trees=read('vegetation/placements.json');trees['trees']=[p for p in trees['trees'] if not crossing_clear.covers(Point(p['root'][0],p['root'][2]))];write('vegetation/placements.json',trees)
 manifest=read('manifest.json');manifest['junctions']={'version':1,'qa':plan['qa'],'plan':'junction-plan.json'};write('manifest.json',manifest)
 return plan['qa']
