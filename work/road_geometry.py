"""Physical carriageways for paired one-way map lines; inferred widths only."""
import math
from shapely.geometry import shape,LineString,Polygon,Point
from shapely.ops import unary_union

def key(p):return ','.join(f'{x:.3f}' for x in p)
def direction(line,t):
 a=line.interpolate(max(0,t-.5));b=line.interpolate(min(line.length,t+.5));dx,dz=b.x-a.x,b.y-a.y;L=math.hypot(dx,dz);return (dx/L,dz/L) if L else (1,0)
def oneway(r):
 v=str(r.get('properties',{}).get('oneway','')).lower();return -1 if v=='-1' else 1 if v in ('yes','true','1') else 0
def pair_and_taper(roads):
 # classify_roads resets base widths first, making repeated regeneration idempotent.
 for r in roads:
  for k in ('carriagewayPair','carriagewayPairs','outerSide','endTapers','widthSource'):r.pop(k,None)
 candidates=[r for r in roads if r.get('grade',0)>=2 and oneway(r) and r['properties'].get('class') in ('primary','secondary','trunk','tertiary') and not any(r['properties'].get(k) for k in ('width','lanes'))]
 lines=[shape(r['geometry']) for r in candidates];proposals={}
 for i,(r,line) in enumerate(zip(candidates,lines)):
  if line.length<6:continue
  matches=[]
  for j,(other,edge) in enumerate(zip(candidates,lines)):
   if i==j:continue
   p,q=r['properties'],other['properties']
   if any(str(p.get(k,''))!=str(q.get(k,'')) for k in ('layer','brunnel','bridge','tunnel')):continue
   if p.get('name') and q.get('name') and p['name']!=q['name']:continue
   # Samples must run alongside the other road, not merely meet its end.
   samples=[]
   for fraction in (.2,.5,.8):
    t=line.length*fraction;a=line.interpolate(t);s=edge.project(a);b=edge.interpolate(s);u=direction(line,t);v=direction(edge,s);delta=(b.x-a.x,b.y-a.y);distance=math.hypot(*delta)
    flow=sum(x*y for x,y in zip(u,v))*oneway(r)*oneway(other)
    if 3<distance<24 and flow<-.94 and abs(sum(x*y for x,y in zip(u,delta)))<distance*.25:
     samples.append((distance,1 if u[0]*delta[1]-u[1]*delta[0]>0 else -1,fraction))
   if samples:matches.append((sum(x[0] for x in samples)/len(samples),other,samples[0][1],{x[2] for x in samples}))
  if matches:
   matches.sort(key=lambda x:x[0]);distance,other,inner,covered=matches[0]
   matched=[m for m in matches if m[2]==inner and m[0]<distance+4]
   if len(set().union(*(m[3] for m in matched)))<2:continue
   if any(a[3]&b[3] and abs(a[0]-b[0])<2 and shape(a[1]['geometry']).distance(shape(b[1]['geometry']))>1 for i,a in enumerate(matched) for b in matched[i+1:]):continue
   proposals[r['editId']]=(r,inner,matched)
 # A partial parallel street must not shrink just one side of a corridor.
 while True:
  rejected=[]
  for rid,(r,inner,matched) in proposals.items():
   mutual=[m for m in matched if m[1]['editId'] in proposals and any(x[1]['editId']==rid for x in proposals[m[1]['editId']][2])]
   if len(set().union(*(m[3] for m in mutual)))<2:rejected.append(rid)
  if not rejected:break
  for rid in rejected:del proposals[rid]
 for rid,(r,inner,matched) in proposals.items():
  mutual=[m for m in matched if m[1]['editId'] in proposals and any(x[1]['editId']==rid for x in proposals[m[1]['editId']][2])]
  r['carriagewayPair']=mutual[0][1]['editId'];r['carriagewayPairs']=[m[1]['editId'] for m in mutual];r['outerSide']=-inner;r['width']=r['width']/2;r['widthSource']='paired-oneway-half-of-total-grade'
 # Smooth only connected, nearly straight two-arm width changes, in the wide road.
 ends={}
 for r in roads:
  p=r.get('properties',{})
  if r.get('grade',0)<1 or p.get('class')=='busway' or any(p.get(k)=='no' for k in ('motor_vehicle','vehicle','access')):continue
  line=shape(r['geometry'])
  for end in (0,1):
   ps=list(line.coords);pt=ps[-1] if end else ps[0];u=direction(line,line.length if end else 0);u=tuple(-x for x in u) if end else u
   layer=tuple(str(r['properties'].get(k,'')) for k in ('layer','brunnel','bridge','tunnel'))
   ends.setdefault((key(pt),layer),[]).append((r,end,u,line.length))
 for (pt,layer),rows in ends.items():
  if len(rows)!=2:continue
  a,b=rows
  if sum(x*y for x,y in zip(a[2],b[2]))>-.94 or abs(a[0]['width']-b[0]['width'])<.1:continue
  wide,narrow=(a,b) if a[0]['width']>b[0]['width'] else (b,a)
  length=min(20.,wide[3]*.45,max(4.,3*(wide[0]['width']-narrow[0]['width'])))
  if length>=2:wide[0].setdefault('endTapers',{})[pt]={'width':narrow[0]['width'],'length':length}
 return roads

def width_at(r,t,line=None):
 line=line or shape(r['geometry']);w=r['width'];ps=list(line.coords)
 for pt,distance in ((ps[0],t),(ps[-1],line.length-t)):
  taper=r.get('endTapers',{}).get(key(pt))
  if taper and distance<taper['length']:w=min(w,taper['width']+(r['width']-taper['width'])*max(0,distance)/taper['length'])
 return w

def pavement(r,extra=0,outer=False):
 line=shape(r['geometry']);side=r.get('outerSide',0) if outer else 0
 if not r.get('endTapers'):
  road=line.buffer(r['width']/2,cap_style=2,join_style=2)
  if side and extra:return road.union(line.buffer(side*(r['width']/2+extra),single_sided=True,cap_style=2,join_style=2))
  return line.buffer(r['width']/2+extra,cap_style=2,join_style=2)
 ts={0.,line.length};distance=0
 for a,b in zip(list(line.coords),list(line.coords)[1:]):distance+=math.dist(a,b);ts.add(distance)
 ts.update(line.length*i/max(1,math.ceil(line.length)) for i in range(1,math.ceil(line.length)))
 left=[];right=[]
 for t in sorted(ts):
  p=line.interpolate(t);u=direction(line,t);n=(-u[1],u[0]);half=width_at(r,t,line)/2
  l=half+(extra if side>=0 else 0);h=half+(extra if side<=0 else 0)
  left.append((p.x+n[0]*l,p.y+n[1]*l));right.append((p.x-n[0]*h,p.y-n[1]*h))
 return Polygon(left+right[::-1]).buffer(0)

def median_spaces(roads):
 """Reserve the gap between a paired corridor as road space, never inner sidewalk."""
 by_id={r.get('editId'):r for r in roads};pieces=[]
 for r in roads:
  for pair_id in r.get('carriagewayPairs',[]):
   other=by_id.get(pair_id)
   if not other:continue
   a=shape(r['geometry']);b=shape(other['geometry']);points=[]
   for i in range(max(2,math.ceil(a.length/3))+1):
    t=a.length*i/max(2,math.ceil(a.length/3));p=a.interpolate(t);s=b.project(p);q=b.interpolate(s);u=direction(a,t);delta=(q.x-p.x,q.y-p.y)
    if 3<math.hypot(*delta)<24 and abs(sum(x*y for x,y in zip(u,delta)))<1:
     if points:pieces.append(Polygon([points[-1][0],(p.x,p.y),(q.x,q.y),points[-1][1]]))
     points.append(((p.x,p.y),(q.x,q.y)))
    else:points=[]
 return unary_union(pieces).buffer(0)
