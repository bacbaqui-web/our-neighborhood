"""Deterministic, metre-scaled worn alley finishes, clipped to real road triangles.
The surface choice and weathering are an art rule, not surveyed pavement data.
"""
import math, random
from collections import defaultdict
import numpy as np
import shapely as S
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union
from shapely.strtree import STRtree

def polys(g):
 if g.geom_type=='Polygon':return [g]
 return [p for child in getattr(g,'geoms',[]) for p in polys(child)]

def seed_for(p):
 c=p.centroid
 return (round(c.x*100)*73856093 ^ round(c.y*100)*19349663 ^ round(p.area*10)) & 0xffffffff

def build_wear(regions,source_triangles,built):
 rng=random.Random(60015)
 source_polys=[Polygon(v[:,[0,2]]) for v in source_triangles]
 tree=STRtree(source_polys)
 batches=defaultdict(list);counts=defaultdict(int);feature_areas=defaultdict(float)
 triangles_out=0;max_lift=0
 source_triangles=np.asarray(source_triangles)
 a=source_triangles[:,0];b=source_triangles[:,1];c=source_triangles[:,2]
 den=(b[:,2]-c[:,2])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,2]-c[:,2])
 planes=[]
 for aa,bb,cc,dd in zip(a,b,c,den):
  # Precomputed y = A*x + B*z + C, always the imported ROAD plane.
  A=((bb[2]-cc[2])*(aa[1]-cc[1])+(cc[2]-aa[2])*(bb[1]-cc[1]))/dd
  B=((cc[0]-bb[0])*(aa[1]-cc[1])+(aa[0]-cc[0])*(bb[1]-cc[1]))/dd
  planes.append((float(A),float(B),float(cc[1]-A*cc[0]-B*cc[2])))
 def height(x,z):
  q=Point(x,z)
  for i in tree.query(q,predicate='intersects'):
   A,B,C=planes[i];return A*x+B*z+C+.008
  return None
 def stamp(g,key,lift=.010):
  nonlocal triangles_out,max_lift
  if g.is_empty:return
  out=batches[key];max_lift=max(max_lift,lift)
  feature_areas[key]+=g.area
  # Split every overlay on source triangle boundaries: no flat patches cutting
  # through a slope, and no reliance on a nearest-ground-height fallback.
  for i in tree.query(g,predicate='intersects'):
   clipped=g.intersection(source_polys[i]);A,B,C=planes[i]
   for p in polys(clipped):
    if p.area<1e-7:continue
    for t in S.get_parts(S.constrained_delaunay_triangles(p)):
     if t.area<1e-8:continue
     coords=list(t.exterior.coords)[:3]
     if (coords[1][0]-coords[0][0])*(coords[2][1]-coords[0][1])-(coords[1][1]-coords[0][1])*(coords[2][0]-coords[0][0])>0:coords.reverse()
     for x,z in coords:out.extend([round(x,5),round(A*x+B*z+C+.008+lift,5),round(z,5)])
     triangles_out+=1
 def frame(p):
  coords=list(p.minimum_rotated_rectangle.exterior.coords)
  _,a,b=max((math.dist(a,b),a,b) for a,b in zip(coords,coords[1:]))
  d=math.dist(a,b);u=((b[0]-a[0])/d,(b[1]-a[1])/d);v=(-u[1],u[0]);origin=p.centroid.coords[0]
  def local(x,z):return ((x-origin[0])*u[0]+(z-origin[1])*u[1],(x-origin[0])*v[0]+(z-origin[1])*v[1])
  def world(x,z):return (origin[0]+x*u[0]+z*v[0],origin[1]+x*u[1]+z*v[1])
  r=Polygon([local(x,z) for x,z in p.exterior.coords]);return world,r.bounds
 def random_point(p,r):
  x0,z0,x1,z1=p.bounds
  for _ in range(100):
   q=Point(r.uniform(x0,x1),r.uniform(z0,z1))
   if p.contains(q):return q
  return p.representative_point()
 cracks=[];broken=[];paver_refs=[]
 for pi,p in enumerate(polys(regions['pavers'])):
  if p.area<.04:continue
  r=random.Random(seed_for(p));world,(x0,z0,x1,z1)=frame(p);S.prepare(p)
  # Running bond; 24 x 12 cm blocks with a 7 mm weathered joint.
  bw,bh=.24,.12;gap=.007
  for row in range(math.floor(z0/bh),math.ceil(z1/bh)):
   y=row*bh;offset=(row%2)*bw*.5
   for col in range(math.floor((x0-offset)/bw),math.ceil((x1-offset)/bw)):
    x=col*bw+offset
    square=Polygon([world(x+gap/2,y+gap/2),world(x+bw-gap/2,y+gap/2),world(x+bw-gap/2,y+bh-gap/2),world(x+gap/2,y+bh-gap/2)])
    if not p.intersects(square):continue
    tile=square if p.covers(square) else square.intersection(p)
    if tile.area<.001:continue
    counts['pavers']+=1
    roll=r.random()
    # Wear follows broad damp/dry patches instead of a random checkerboard.
    cx,cz=world(x+bw/2,y+bh/2)
    damp=math.sin(cx*.7+cz*.31)+math.sin(cz*.91-cx*.16)
    shade=2 if damp>1 else 3 if damp<-1 else r.choices([0,1,2,3,4],[42,37,8,10,3])[0]
    key='block'+str(shade)
    if roll<.007 and tile.area>.018:
     # A few half-broken blocks expose the old bedding and a small loose chip.
     cut=Polygon([world(x,y),world(x+bw,y),world(x+bw,y+bh*.63),world(x+bw*.4,y+bh*.42),world(x,y+bh*.6)])
     tile=tile.difference(cut)
     fragment=Polygon([world(x+.03,y+.02),world(x+.07,y+.024),world(x+.045,y+.043)]).intersection(p)
     stamp(fragment,'repairEdge',.005);counts['brokenBlocks']+=1;broken.append(Point(world(x+bw*.5,y+bh*.4)))
    if .007<=roll<.055 and tile.area>.012:
     # A few missing corners reveal the recessed mortar below, not spikes.
     corner=world(x+gap/2,y+gap/2);chip=Polygon([corner,world(x+r.uniform(.025,.065),y),world(x,y+r.uniform(.02,.05))])
     tile=tile.difference(chip);counts['chippedBlocks']+=1;broken.append(Point(corner))
    stamp(tile,key,.012)
    if .055<=roll<.075 and tile.area>.015:
     line=LineString([world(x+.025,y+.025),world(x+.10,y+.06),world(x+bw-.02,y+bh-.025)])
     stamp(line.buffer(.0025,cap_style=2).intersection(tile),'crack',.015);counts['splitBlocks']+=1
    if r.random()<.009:paver_refs.append(Point(world(x,y)))
 for p in polys(regions['concrete']):
  if p.area<.2:continue
  r=random.Random(seed_for(p));world,(x0,z0,x1,z1)=frame(p);inner=p.buffer(-.025)
  if inner.is_empty:continue
  # Longitudinal utility repairs interrupt occasional transverse pour joints.
  for x in np.arange(x0+r.uniform(.6,2.3),x1,r.uniform(2.5,4.8)):
   line=LineString([world(x,z0-.5),world(x+r.uniform(-.05,.05),z1+.5)])
   clipped=line.intersection(inner)
   stamp(clipped.buffer(.006,cap_style=2).intersection(inner),'joint',.009)
   counts['pourJoints']+=1
  for _ in range(max(0,int(p.area/14))):
   q=random_point(inner,r);radius=r.uniform(.28,.8)
   patch=Polygon([(q.x+radius*r.uniform(.8,1.2)*math.cos(i*math.tau/7),q.y+radius*r.uniform(.5,.85)*math.sin(i*math.tau/7)) for i in range(7)]).buffer(0).intersection(inner)
   stamp(patch,'repair'+str(r.randrange(3)),.014);counts['repairs']+=1
   stamp(patch.boundary.buffer(.007).intersection(inner),'repairEdge',.016)
  # Broad faint stains remain quiet behind the explicit broken-edge detail.
  for _ in range(int(p.area/6)):
   q=random_point(inner,r);rr=r.uniform(.1,.37)
   stain=Polygon([(q.x+rr*r.uniform(.6,1.3)*math.cos(i*math.tau/6),q.y+rr*r.uniform(.6,1.3)*math.sin(i*math.tau/6)) for i in range(6)]).intersection(inner)
   stamp(stain,'wear'+str(r.randrange(2)),.018)
  for _ in range(max(1,int(p.area/3.8))):
   q=random_point(inner,r);angle=r.random()*math.tau;length=r.uniform(.3,1.4);pts=[(q.x,q.y)]
   for j in range(1,5):
    angle+=r.uniform(-.5,.5);step=length/4
    pts.append((pts[-1][0]+math.cos(angle)*step,pts[-1][1]+math.sin(angle)*step))
   line=LineString(pts).intersection(inner)
   stamp(line.buffer(r.uniform(.004,.009),cap_style=2,join_style=2).intersection(inner),'crack',.021)
   if r.random()<.5:
    mid=pts[2];branch=LineString([mid,(mid[0]+math.cos(angle+1.1)*length*.33,mid[1]+math.sin(angle+1.1)*length*.33)])
    stamp(branch.buffer(.003,cap_style=2).intersection(inner),'crack',.021)
   cracks.append(q);counts['cracks']+=1
 # Place weeds by source (wall foot / joint / crack), never random lawn coverage.
 narrow=regions['concrete'].union(regions['pavers']);safe=narrow.buffer(-.035)
 wallband=narrow.intersection(built.buffer(.40)).difference(built.buffer(.10))
 S.prepare(safe);tufts=[]
 for p in polys(wallband):
  if p.area<.05:continue
  r=random.Random(seed_for(p)^600)
  for _ in range(min(24,max(1,int(p.area*1.6)))):
   q=random_point(p,r)
   if safe.covers(q):tufts.append((q,'wall'))
 for q in cracks+paver_refs+broken[::9]:
  # Most disturbed, busy middle portions remain bare.
  d=q.distance(built)
  if d<.85 and rng.random()<.35 and safe.covers(q):tufts.append((q,'joint'))
 accepted=[];weed_sources=defaultdict(int)
 for q,source in tufts:
  if any(q.distance(other)<.20 for other in accepted[-80:]):continue
  h=height(q.x,q.y)
  if h is None:continue
  accepted.append(q);weed_sources[source]+=1
  # Muted irregular dirt/moss at the root, plus several narrow bent grass blades.
  base=q.buffer(rng.uniform(.025,.065),quad_segs=3).intersection(safe)
  stamp(base,'moss',.023)
  for j in range(rng.randint(4,8)):
   angle=rng.uniform(0,math.tau);height_blade=rng.uniform(.045,.15);width=rng.uniform(.006,.014);lean=rng.uniform(.018,.055)
   ux,uz=math.cos(angle),math.sin(angle);vx,vz=-uz,ux
   rx=q.x+rng.uniform(-.018,.018);rz=q.y+rng.uniform(-.018,.018)
   coords=[(rx+vx*width,h+.024,rz+vz*width),(rx-vx*width,h+.024,rz-vz*width),(rx+ux*lean*.55,h+height_blade*.65,rz+uz*lean*.55),(rx+ux*lean,h+height_blade,rz+uz*lean)]
   for a,b,c in [(0,1,2),(0,2,3)]:
    for v in [coords[a],coords[b],coords[c]]:batches['grass'+str(j%3)].extend(round(n,5) for n in v)
  counts['weedTufts']+=1
 qa={**dict(counts),'weedSources':dict(weed_sources),'overlayTriangles':sum(len(v)//9 for v in batches.values()),'finishLiftMaxM':max_lift,'materialBatches':len(batches),'areasM2':{k:round(v,2) for k,v in feature_areas.items()},'pavementSource':'inferred art rule; not a surveyed material map'}
 return {'positions':dict(batches),'qa':qa}
