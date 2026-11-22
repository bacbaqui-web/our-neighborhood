import os
"""Three road-facing open-ground-floor layouts. Geometry is a design inference, not a survey."""
import json,math
from pathlib import Path
from shapely.geometry import shape,Polygon,Point,LineString,mapping
from shapely.ops import unary_union,nearest_points
ROOT=Path(__file__).resolve().parents[2]; OUT=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(ROOT/'outputs/domestic-test/house-plots-test')))
def build():
 d=json.loads((OUT/'infill-plots.json').read_text());road=shape(d['road']);camera_road=road.buffer(-.35);buildings=d['buildings']; plans=[]; counts=[0,0,0]
 for b in sorted(buildings,key=lambda b:b['id']):
  profile=b.get('streetProfile')
  if profile and profile.get('housingType') in ('detached','old-villa'):continue
  if profile and (profile['use']=='mixed' or 'frontEdge' in profile.get('manualFields',[])):continue
  p=shape(b['building'])
  alley=bool(profile and profile.get('housingType')=='piloti')
  if p.geom_type!='Polygon' or p.interiors or not (2 if alley else 3)<=b['levels']<=6 or not (45 if alley else 75)<p.area<(500 if alley else 300):continue
  other=unary_union([shape(x['building']) for x in buildings if x['id']!=b['id'] and shape(x['building']).distance(p)<15])
  ring=list(p.exterior.coords); options=[]
  for i,(a,c) in enumerate(zip(ring,ring[1:])):
   if profile and i!=profile['frontEdge']:continue
   L=math.dist(a,c)
   if L<7:continue
   u=((c[0]-a[0])/L,(c[1]-a[1])/L);n=(-u[1],u[0]);mid=((a[0]+c[0])/2,(a[1]+c[1])/2)
   if not p.contains(Point(mid[0]+n[0]*.2,mid[1]+n[1]*.2)):n=(-n[0],-n[1])
   def pt(x,y):return [a[0]+u[0]*x+n[0]*y,a[1]+u[1]*x+n[1]*y]
   def rect(x,y,w,h):return Polygon([pt(x,y),pt(x+w,y),pt(x+w,y+h),pt(x,y+h)])
   distance=Point(mid).distance(road)
   if distance>9:continue
   camera_points=[]
   for step in range(2,61):
    t=step*.25;q=Point(mid[0]-n[0]*t,mid[1]-n[1]*t)
    if camera_road.contains(q):camera_points.append((q.x,q.y))
    elif camera_points:break
   if not camera_points:continue
   camera_point=camera_points[-1]
   if LineString([mid,camera_point]).buffer(.4).intersection(other).area>.001:continue
   for kind in sorted(range(3),key=lambda k:counts[k]):
    # Rear stair hall; side stair hall; enclosed half with open parking beside it.
    core_specs=[(L/2-1.5,5.8,3,2.7),(.45,2.2,2.8,4.1),(.45,.45,max(3,L*.38),7.3)]
    x,y,w,h=core_specs[kind];core=rect(x,y,w,h)
    if not p.buffer(-.12).covers(core):continue
    bays=[];corridors=[]
    for x0 in [ .65+j*2.85 for j in range(int((L-1.3)/2.85))]:
     bay=rect(x0,.4,2.65,5.2)
     if not p.buffer(-.12).covers(bay) or bay.distance(core)<.25:continue
     front=Point(pt(x0+1.325,.25));r=nearest_points(front,road)[1]
     access=LineString([front,r]).buffer(1.32,cap_style=2)
     if access.intersection(other).area>.001 or not shape(b['plot']).union(road).buffer(.15).covers(access):continue
     bays.append(dict(point=pt(x0+1.325,3),direction=[*u,*n],occupied=(b['id']+len(bays))%4!=0,footprint=mapping(bay),piloti=True));corridors.append(access)
    if not bays:continue
    columns=[]
    # Columns follow the original outline, including setbacks; long spans get supports.
    inner=p.buffer(-.38,join_style=2)
    if inner.geom_type!='Polygon':continue
    for aa,cc in zip(list(inner.exterior.coords),list(inner.exterior.coords)[1:]):
     for j in range(max(1,math.ceil(math.dist(aa,cc)/5.5))):
      t=j/max(1,math.ceil(math.dist(aa,cc)/5.5));q=Point(aa[0]+(cc[0]-aa[0])*t,aa[1]+(cc[1]-aa[1])*t)
      col=q.buffer(.27,cap_style=3)
      if core.intersects(col) or any(shape(v['footprint']).intersects(col) for v in bays):continue
      if p.covers(col) and not any(q.distance(Point(v))<.45 for v in columns):columns.append([q.x,q.y])
    if len(columns)<3:continue
    options.append((distance,dict(id=b['id'],kind=kind,label=['뒤쪽 계단실','옆쪽 계단실','반쪽 필로티'][kind],origin=list(a),u=u,n=n,core=[x,y,w,h],columns=columns,bays=bays,access=[mapping(v) for v in corridors],focus=pt(L/2,3),front=mid,camera=camera_point,clearHeight=2.8,source='roadview-inspired',frontEdge=i)))
    break
  if options:
   plan=min(options,key=lambda v:v[0])[1];plans.append(plan);counts[plan['kind']]+=1
 qa={'buildings':len(plans),'patterns':counts,'parkingBays':sum(len(p['bays']) for p in plans),'columnOutside':0,'coreOutside':0,'parkingOutside':0,'parkingCoreOverlap':0}
 byid={b['id']:shape(b['building']) for b in buildings}
 for v in plans:
  a=v['origin'];u=v['u'];n=v['n'];x,y,w,h=v['core'];pt=lambda x,y:(a[0]+u[0]*x+n[0]*y,a[1]+u[1]*x+n[1]*y)
  core=Polygon([pt(x,y),pt(x+w,y),pt(x+w,y+h),pt(x,y+h)])
  qa['coreOutside']+=core.difference(byid[v['id']]).area
  for bay in v['bays']:
   q=shape(bay['footprint']);qa['parkingOutside']+=q.difference(byid[v['id']]).area;qa['parkingCoreOverlap']+=q.intersection(core).area
  for q in v['columns']:qa['columnOutside']+=Point(q).buffer(.27,cap_style=3).difference(byid[v['id']]).area
 assert max(qa[k] for k in ['coreOutside','parkingOutside','parkingCoreOverlap','columnOutside'])<1e-6,qa
 infill=json.loads((OUT/'infill.json').read_text())
 access=unary_union([shape(g) for v in plans for g in v['access']])
 walls=[]
 for wall in infill['walls']:
  line=LineString([wall['a'],wall['b']]).difference(access.buffer(.16))
  for seg in ([line] if line.geom_type=='LineString' else getattr(line,'geoms',[])):
   if seg.geom_type=='LineString' and seg.length>.2:walls.append({**wall,'a':list(seg.coords[0]),'b':list(seg.coords[-1])})
 infill['walls']=walls
 infill['plants']=[p for p in infill['plants'] if not Point(p['point']).buffer(p['radius']).intersects(access)]
 infill['poles']=[p for p in infill['poles'] if not Point(p['point']).buffer(.2).intersects(access)]
 infill['bays']=[b for b in infill['bays'] if not shape(b['footprint']).intersects(access)]+[b for v in plans for b in v['bays']]
 infill['qa'].update(parkingBays=len(infill['bays']),plants=len(infill['plants']),poles=len(infill['poles']))
 for v in plans:
  infill['zones'].append(dict(kind='yard',geometry=mapping(byid[v['id']]),owner=v['id']))
 all_bays=[shape(b['footprint']) for b in infill['bays']]
 qa['allParkingOverlap']=sum(v.area for v in all_bays)-unary_union(all_bays).area
 qa['columnParkingOverlap']=sum(Point(c).buffer(.27,cap_style=3).intersection(shape(b['footprint'])).area for v in plans for c in v['columns'] for b in v['bays'])
 qa['portalWallOverlap']=sum(LineString([w['a'],w['b']]).buffer(.07,cap_style=2).intersection(access).area for w in infill['walls'])
 assert max(abs(qa[k]) for k in ['allParkingOverlap','columnParkingOverlap','portalWallOverlap'])<1e-6,qa
 (OUT/'piloti-qa.json').write_text(json.dumps(qa,indent=2))
 (OUT/'piloti-infill.json').write_text(json.dumps(infill,ensure_ascii=False,separators=(',',':')))
 (OUT/'piloti.json').write_text(json.dumps({'plans':plans,'qa':qa},ensure_ascii=False,separators=(',',':')))
 print(qa)
 from ground_floors import build as build_ground_floors
 build_ground_floors()
if __name__=='__main__':build()
