"""Route inferred landlocked entrances through unbuilt ground; do not move houses."""
import math
import numpy as np
import shapely
from collections import deque
from shapely.geometry import shape,Point,LineString,mapping
from shapely.ops import unary_union

def route(d,bs,fronts,road,houses):
 s=.8;minx,miny,maxx,maxy=unary_union([shape(b['plot']) for b in bs]).bounds;x0=math.floor(minx)-2;y0=math.floor(miny)-2;nx=int((maxx-x0+2)/s)+1;ny=int((maxy-y0+2)/s)+1
 xx,yy=np.meshgrid(np.arange(nx)*s+x0,np.arange(ny)*s+y0);points=shapely.points(xx.ravel(),yy.ravel());blocked=houses.buffer(.65).union(unary_union([shape(b['footprint']).buffer(.3) for b in d['bays'] if not b.get('piloti')]))
 blocked=blocked.union(unary_union([shape(z['geometry']) for z in d['zones'] if z['kind'] in ['active','abandoned','parking','wild','garden']]))
 free=~shapely.intersects(blocked,points);seeds=np.flatnonzero(shapely.intersects(road,points)&free);parent=np.full(nx*ny,-1,dtype=np.int32);parent[seeds]=seeds;queue=deque(seeds.tolist())
 while queue:
  k=queue.popleft();row,col=divmod(k,nx)
  for j in ([k-1] if col else [])+([k+1] if col<nx-1 else [])+([k-nx] if row else [])+([k+nx] if row<ny-1 else []):
   if free[j] and parent[j]<0:parent[j]=k;queue.append(j)
 paths=[]
 for b in bs:
  if fronts[str(b['id'])]['verifiedAccess']:continue
  p=shape(b['building']);p=max(p.geoms,key=lambda g:g.area) if p.geom_type=='MultiPolygon' else p;pts=list(p.exterior.coords)[:-1];choices=[]
  for i,(a,c) in enumerate(zip(pts,pts[1:]+pts[:1])):
   L=math.dist(a,c)
   if L<2.5:continue
   m=[(a[0]+c[0])/2,(a[1]+c[1])/2];u=[(c[0]-a[0])/L,(c[1]-a[1])/L]
   for sign in [-1,1]:
    q=[m[0]-u[1]*sign*1.2,m[1]+u[0]*sign*1.2];col=round((q[0]-x0)/s);row=round((q[1]-y0)/s)
    if not(0<=col<nx and 0<=row<ny):continue
    k=row*nx+col
    if parent[k]<0:continue
    coords=[m];n=k
    for _ in range(200):
     rr,cc=divmod(n,nx);coords.append((x0+cc*s,y0+rr*s))
     if parent[n]==n:break
     n=int(parent[n])
    else:continue
    line=LineString(coords).simplify(.15);corridor=line.buffer(.5,cap_style=2,join_style=2)
    if corridor.intersection(houses).area>.03:continue
    choices.append((line.length,i,corridor))
  if choices:
   L,i,g=min(choices,key=lambda v:v[0]);fronts[str(b['id'])].update(frontEdge=i,verifiedAccess=True,accessKind='inferred-footpath');paths.append(dict(owner=b['id'],geometry=mapping(g.difference(houses.buffer(.025))),length=round(L,2)))
 d['accessPaths']=paths
 clear=unary_union([shape(p['geometry']).buffer(.12) for p in paths])
 def cut(items):
  out=[]
  for f in items:
   rem=LineString([f['a'],f['b']]).difference(clear)
   for l in ([rem] if rem.geom_type=='LineString' else getattr(rem,'geoms',[])):
    if l.geom_type=='LineString' and l.length>.1:out.append(dict(f,a=list(l.coords[0]),b=list(l.coords[-1])))
  return out
 d['walls']=cut(d['walls']);d['siteDetails']['fences']=cut(d['siteDetails']['fences']);d['gaps']=[g for g in d['gaps'] if g['kind']=='passage' or not shape(g['geometry']).intersects(clear)];d['plants']=[p for p in d['plants'] if not Point(p['point']).buffer(.2).intersects(clear)];d['poles']=[p for p in d['poles'] if not Point(p['point']).buffer(.2).intersects(clear)]
 return len(paths)
