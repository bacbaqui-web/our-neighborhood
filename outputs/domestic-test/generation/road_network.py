"""Infer connected street strokes from a footprint-clipped road surface.
The imported mesh has no OSM way IDs. This is a geometry-derived road graph,
not a claim to recover official road names or surveyed pavement materials.
"""
import math, hashlib
from collections import defaultdict
import numpy as np
import shapely as S
from shapely.geometry import Point,LineString,Polygon,box
from shapely.ops import unary_union
from scipy import ndimage as ndi
from skimage.morphology import skeletonize
from skimage.segmentation import watershed

KINDS=['asphalt','concrete','pavers']
def polys(g):
 if g.is_empty:return []
 if g.geom_type=='Polygon':return [g]
 return [p for child in getattr(g,'geoms',[]) for p in polys(child)]
def parts(g):
 return [g] if g.geom_type=='LineString' else [l for l in S.get_parts(g) if l.geom_type=='LineString']
def graph_from_mask(mask,distance,step,origin):
 skel=skeletonize(mask);pixels=set(map(tuple,np.argwhere(skel)))
 def adjacent(p):
  y,x=p;out=[]
  for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
   q=(y+dy,x+dx)
   if q not in pixels:continue
   # Avoid tiny triangular cycles around an orthogonal junction.
   if dy and dx and ((y+dy,x) in pixels or (y,x+dx) in pixels):continue
   out.append(q)
  return out
 adj={p:adjacent(p) for p in pixels}
 junction=np.zeros(mask.shape,bool)
 for p,n in adj.items():
  if len(n)>2:junction[p]=True
 near=ndi.binary_dilation(junction,iterations=2)&skel
 labels,num=ndi.label(near,np.ones((3,3)))
 nodes={};owner={}
 def world(p):return (origin[0]+(p[1]+.5)*step,origin[1]+(p[0]+.5)*step)
 for i in range(1,num+1):
  ps=list(map(tuple,np.argwhere(labels==i)));key=len(nodes);nodes[key]=ps
  for p in ps:owner[p]=key
 for p,n in adj.items():
  if len(n)<=1 and p not in owner:key=len(nodes);nodes[key]=[p];owner[p]=key
 # A closed isolated lane needs one anchor as well.
 connected,cc=ndi.label(skel,np.ones((3,3)))
 for c in range(1,cc+1):
  ps=list(map(tuple,np.argwhere(connected==c)))
  if not any(p in owner for p in ps):key=len(nodes);nodes[key]=[ps[0]];owner[ps[0]]=key
 def center(key):
  ps=nodes[key];weights=np.array([max(.1,distance[p]) for p in ps]);ws=np.array([world(p) for p in ps]);return tuple(np.average(ws,axis=0,weights=weights))
 centers={k:center(k) for k in nodes};used=set();edges=[]
 for key,ps in nodes.items():
  for p in ps:
   for q in adj[p]:
    token=tuple(sorted([p,q]))
    if owner.get(q)==key or token in used:continue
    path=[p,q];used.add(token);prev,now=p,q
    while now not in owner:
     opts=[n for n in adj[now] if n!=prev]
     if not opts:break
     nxt=opts[0];used.add(tuple(sorted([now,nxt])));path.append(nxt);prev,now=now,nxt
    end=owner.get(now)
    if end is None:continue
    coords=[centers[key]]+[world(v) for v in path]+[centers[end]]
    line=LineString(coords).simplify(step*.6)
    if line.length<step:continue
    widths=[float(distance[v]*2*step) for v in path]
    edges.append({'a':key,'b':end,'line':line,'widths':widths,'pixels':path})
 # Remove medial-axis spurs toward facade corners; keep true longer dead ends.
 def incident(es):
  d=defaultdict(list)
  for i,e in enumerate(es):d[e['a']].append(i);d[e['b']].append(i)
  return d
 for _ in range(5):
  inc=incident(edges);remove=[]
  for i,e in enumerate(edges):
   ends=[n for n in [e['a'],e['b']] if len(inc[n])==1]
   if not ends:continue
   boundary=any(min(p[0],p[1],mask.shape[0]-1-p[0],mask.shape[1]-1-p[1])<4 for n in ends for p in nodes[n])
   if not boundary and e['line'].length<max(2.4,np.median(e['widths'])*1.25):remove.append(i)
  if not remove:break
  edges=[e for i,e in enumerate(edges) if i not in set(remove)]
 # A degree-two bend is one edge, regardless of a width change along it.
 while True:
  inc=incident(edges);choice=next(((n,ids) for n,ids in inc.items() if len(ids)==2 and ids[0]!=ids[1] and all(edges[i]['a']!=edges[i]['b'] for i in ids)),None)
  if not choice:break
  n,(i,j)=choice;e,f=edges[i],edges[j]
  ec=list(e['line'].coords);fc=list(f['line'].coords)
  if e['a']==n:ec.reverse()
  if f['b']==n:fc.reverse()
  merged={'a':e['b'] if e['a']==n else e['a'],'b':f['a'] if f['b']==n else f['b'],'line':LineString(ec+fc[1:]),'widths':e['widths']+f['widths'],'pixels':e['pixels']+f['pixels']}
  edges=[e for k,e in enumerate(edges) if k not in (i,j)]+[merged]
 return edges,centers,incident(edges)

def build_road_network(free,step=.20):
 x0,z0,x1,z1=free.bounds;x0=math.floor(x0/step)*step-step*2;z0=math.floor(z0/step)*step-step*2
 nx=math.ceil((x1-x0)/step)+2;nz=math.ceil((z1-z0)/step)+2
 xs=x0+(np.arange(nx)+.5)*step;zs=z0+(np.arange(nz)+.5)*step
 mask=S.contains_xy(free,xs[None,:],zs[:,None]);distance=ndi.distance_transform_edt(mask)
 edges,centers,inc=graph_from_mask(mask,distance,step,(x0,z0))
 if not edges:raise ValueError('No road paths could be extracted')
 parent=list(range(len(edges)))
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 def unite(i,j):parent[root(j)]=root(i)
 def away(e,node):
  line=e['line'];d=min(line.length*.45,max(1.2,float(np.median(e['widths']))*.7))
  a=line.interpolate(0 if e['a']==node else line.length);b=line.interpolate(d if e['a']==node else line.length-d);v=np.array([b.x-a.x,b.y-a.y]);return v/max(.0001,np.linalg.norm(v))
 # Mutual best straight continuation, allowing gradual bends but not arbitrary turns.
 for node,ids in inc.items():
  candidates=[]
  for ii,i in enumerate(ids):
   for j in ids[ii+1:]:
    angle=math.degrees(math.acos(np.clip(np.dot(away(edges[i],node),away(edges[j],node)),-1,1)))
    wi,wj=np.median(edges[i]['widths']),np.median(edges[j]['widths'])
    if angle<132:continue
    score=angle-10*abs(math.log(max(wi,.1)/max(wj,.1)))
    candidates.append((score,i,j))
  paired=set()
  for score,i,j in sorted(candidates,reverse=True):
   if i not in paired and j not in paired:unite(i,j);paired.update((i,j))
 grouped=defaultdict(list)
 for i in range(len(edges)):grouped[root(i)].append(i)
 strokes=[]
 for ids in grouped.values():
  values=[]
  for i in ids:
   e=edges[i];coords=list(e['line'].coords);line=e['line']
   # Sample the usable cross-section along a whole path. Junction flares must
   # not make an otherwise narrow alley qualify as an asphalt street.
   margin=min(line.length*.2,3.0)
   for d in np.arange(margin,max(margin+.01,line.length-margin),.5):
    q=line.interpolate(d);row=round((q.y-z0)/step-.5);col=round((q.x-x0)/step-.5)
    values.append(float(distance[row,col]*2*step))
  if not values:values=[w for i in ids for w in edges[i]['widths']]
  med=float(np.median(values));p20=float(np.quantile(values,.2));tight=float(np.mean(np.array(values)<2.8));length=sum(edges[i]['line'].length for i in ids)
  pts=sorted((round(c[0],1),round(c[1],1)) for i in ids for c in [edges[i]['line'].coords[0],edges[i]['line'].coords[-1]])
  seed=int.from_bytes(hashlib.sha256(repr(pts).encode()).digest()[:4],'little')
  kind='asphalt' if med>=4.45 and p20>=3.0 and tight<.2 else ('pavers' if seed%100<32 else 'concrete')
  stroke={'id':len(strokes)+1,'edges':ids,'kind':kind,'length':round(length,2),'medianWidth':round(med,2),'p20Width':round(p20,2),'tightFraction':round(tight,3)}
  for i in ids:edges[i]['stroke']=stroke['id']
  strokes.append(stroke)
 # An isolated short wide pocket is still part of an alley network. It
 # cannot become an asphalt island merely because its median width is large.
 asphalt_ids={s['id'] for s in strokes if s['kind']=='asphalt'}
 connected={sid:set() for sid in asphalt_ids}
 for ids in inc.values():
  local={edges[i]['stroke'] for i in ids}&asphalt_ids
  for sid in local:connected[sid].update(local-{sid})
 visited=set();demoted=[]
 for sid in sorted(asphalt_ids):
  if sid in visited:continue
  group={sid};stack=[sid]
  while stack:
   for other in connected[stack.pop()]-group:group.add(other);stack.append(other)
  visited.update(group);length=sum(strokes[i-1]['length'] for i in group)
  reaches_edge=any(min(x-free.bounds[0],free.bounds[2]-x,z-free.bounds[1],free.bounds[3]-z)<2 for i in group for ei in strokes[i-1]['edges'] for x,z in [edges[ei]['line'].coords[0],edges[ei]['line'].coords[-1]])
  if length>=42 or reaches_edge:continue
  neighbors=set()
  for ids in inc.values():
   here={edges[i]['stroke'] for i in ids}
   if here&group:neighbors.update(here-group)
  kind=max((strokes[i-1] for i in neighbors),key=lambda a:a['length'],default={'kind':'concrete'})['kind']
  if kind=='asphalt':kind='concrete'
  for i in group:strokes[i-1]['kind']=kind;demoted.append(i)
 # Seeds belong to whole strokes. Region growing fills the entire cross-section,
 # so the outer fringes of a wide road cannot turn into thin concrete ribbons.
 markers=np.zeros(mask.shape,np.int32)
 for e in edges:
  for row,col in e['pixels']:markers[row,col]=e['stroke']
  # Contracted bends no longer exactly follow the original skeleton pixels.
  # Seed their full continuous centerline so another street cannot cut across it.
  for d in np.arange(0,e['line'].length+step,step*.5):
   q=e['line'].interpolate(d);row=round((q.y-z0)/step-.5);col=round((q.x-x0)/step-.5)
   for dy,dx in [(0,0),(-1,0),(1,0),(0,-1),(0,1)]:
    y,x=row+dy,col+dx
    if 0<=y<nz and 0<=x<nx and mask[y,x]:markers[y,x]=e['stroke']
 junctions=[]
 for node,ids in inc.items():
  if len(ids)<3:continue
  owners=sorted(set(edges[i]['stroke'] for i in ids));rank=lambda s:(strokes[s-1]['kind']=='asphalt',strokes[s-1]['length'],strokes[s-1]['medianWidth'])
  primary=max(owners,key=rank);cx,cz=centers[node];radius=max(1.,min(4.,max(strokes[s-1]['medianWidth'] for s in owners)*.55))
  # Give the intersection to its through street; minor branches start beyond
  # its mouth. This is the only deliberate material transition inside a stroke.
  r0=max(0,int((cz-z0-radius)/step));r1=min(nz,int((cz-z0+radius)/step)+1);c0=max(0,int((cx-x0-radius)/step));c1=min(nx,int((cx-x0+radius)/step)+1)
  disk=((zs[r0:r1,None]-cz)**2+(xs[None,c0:c1]-cx)**2)<=radius**2
  sub=markers[r0:r1,c0:c1];sub[disk & mask[r0:r1,c0:c1]]=primary
  junctions.append({'node':node,'point':[round(cx,3),round(cz,3)],'radius':radius,'primary':primary,'strokes':owners})
 # Every disconnected remnant gets a single sensible pavement, never many islets.
 cc,n=ndi.label(mask,np.ones((3,3)))
 fallback=0
 for i in range(1,n+1):
  region=cc==i
  if np.any(markers[region]):continue
  ps=np.argwhere(region);row,col=ps[len(ps)//2];sid=len(strokes)+1
  strokes.append({'id':sid,'edges':[],'kind':'concrete','length':0,'medianWidth':float(distance[row,col]*2*step),'p20Width':0,'tightFraction':1,'remnant':True});markers[row,col]=sid;fallback+=1
 labels=watershed(-distance,markers,mask=mask,connectivity=np.ones((3,3)))
 kinds=np.zeros(len(strokes)+1,np.uint8)
 for s in strokes:kinds[s['id']]=KINDS.index(s['kind'])+1
 material=kinds[labels]
 def region_polygon(code):
  rects=[]
  for row in range(nz):
   padded=np.pad(material[row]==code,(1,1));changes=np.diff(padded.astype(np.int8));starts=np.flatnonzero(changes==1);ends=np.flatnonzero(changes==-1)
   for a,b in zip(starts,ends):rects.append(box(x0+a*step,z0+row*step,x0+b*step,z0+(row+1)*step))
  if not rects:return Polygon()
  # Preserve topology; this is only antialiasing of the inferred raster boundary.
  return unary_union(rects).simplify(step*.7,preserve_topology=True).buffer(step*.78,join_style=2).intersection(free)
 asphalt=region_polygon(1);pavers=region_polygon(3).difference(asphalt);concrete=free.difference(asphalt.union(pavers))
 regions={'asphalt':asphalt,'concrete':concrete,'pavers':pavers}
 network={'resolutionM':step,'strokes':strokes,'edges':[{'id':i,'a':e['a'],'b':e['b'],'stroke':e['stroke'],'points':[[round(x,3),round(z,3)] for x,z in e['line'].coords]} for i,e in enumerate(edges)],'junctions':junctions,'qa':{'edges':len(edges),'strokes':len(strokes),'junctions':len(junctions),'isolatedRemnants':fallback,'widePocketsKeptWithAlley':len(demoted),'classes':{k:sum(s['kind']==k and not s.get('remnant') for s in strokes) for k in KINDS},'asphaltComponents':len(polys(asphalt)),'unassignedRoadCells':int(np.sum(mask & (labels==0)))}}
 assert network['qa']['unassignedRoadCells']==0
 return regions,network
