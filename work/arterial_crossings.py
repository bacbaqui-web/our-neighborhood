"""Pure arterial approach geometry; no map acquisition, file writes or input mutation.

Rect/xy/local/half callbacks describe the already selected arterial alignment;
height is the shared terrain mesh sampler. Geometry output uses the existing
arterial plan schema. Invalid inferred exit pads preserve their source exits.
"""
import copy
import shapely as S
from shapely.geometry import Polygon,Point
from shapely.ops import unary_union

def parts(g,kind='Polygon'):return [q for q in S.get_parts(g) if q.geom_type==kind and not q.is_empty]
def tris(g):
 return [list(t.exterior.coords)[:3] for p in parts(S.make_valid(g)) for t in S.get_parts(S.constrained_delaunay_triangles(p)) if t.area>1e-7]
def rings(g):return [{'outer':list(p.exterior.coords),'holes':[list(h.coords) for h in p.interiors]} for p in parts(g) if p.area>.05]

def build_exit_landings(*,exits,sidewalks,rect,height):
 """Return copied exits with valid thresholds, surfaces and omission reasons."""
 exits=copy.deepcopy(exits)
 landings=[];landingTriangles=[];skipped=[]
 for e in exits:
  t,d,L,W=e['t'],e['d'],e['length'],e['width'];front=t-L/2
  pad=rect(front-.35,d,.7,W-.32).intersection(sidewalks)
  apron=rect(front-.75,d,1.5,W+.9).intersection(sidewalks)
  reason=('empty-exit-landing' if pad.is_empty else
          'disconnected-exit-landing' if pad.geom_type!='Polygon' else
          'holed-exit-landing' if pad.interiors else
          'insufficient-exit-landing-area' if pad.area<.3 else None)
  if reason:
   skipped.append({'id':e['id'],'reason':reason,'geometryType':pad.geom_type,'empty':pad.is_empty})
   continue
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

 return {"exits":exits,"landings":landings,"triangles":landingTriangles,"area":landingArea,"skipped":skipped}

def build_crosswalks(*,platforms,exits,junctionTs,baseHalf,t0,t1,public,sidewalks,rect,xy,local,half,height):
 """Return continuous crossings, curb ramps and reserved sidewalk footprints."""
 landings=[];landingTriangles=[];reservations=[]
 crosswalks=[];skippedCrosswalks=[]
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
  footprint=corridor.intersection(public)
  # A single outline cannot represent disconnected pieces or holes. Do not fill
  # those gaps or publish a partial crossing as a continuous pedestrian route.
  if footprint.is_empty or footprint.geom_type!='Polygon' or footprint.interiors:
   skippedCrosswalks.append({'id':'crossing-'+str(stop['id']),'reason':'disconnected-public-crossing','geometryType':footprint.geom_type,'empty':footprint.is_empty})
   continue
  p=xy(t)
  crosswalks.append({'id':'crossing-'+str(stop['id']),'t':t,'width':width,'position':[p[0],height(*p)+.035,p[1]],'footprint':list(footprint.exterior.coords),'source':'mapped-junction-roadview-form' if stop['platform'] is None else 'roadview-form-platform-access-inferred','platform':stop['platform']})
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
 return {"crosswalks":crosswalks,"landings":landings,"triangles":landingTriangles,"area":landingArea,"reservations":reservations,"skipped":skippedCrosswalks}
