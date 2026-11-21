import sys,io,contextlib,math
from pathlib import Path
with contextlib.redirect_stdout(io.StringIO()):exec(Path(__file__).with_name('check-ramp-connections.py').read_text())
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def sample(x,z):
 pt=Point(x,z);out=[]
 for q in t.query(pt.buffer(1e-7)):
  if rows[q][0]!='ramp' or not polys[q].buffer(1e-7).covers(pt):continue
  k,a,b,c=rows[q];d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;out.append(u*a[1]+v*b[1]+(1-u-v)*c[1])
 return max(out)if out else None
for idx,asset in enumerate(j['assets']):
 x,y,z=asset['position'];dx,dz=asset['slope'];l=math.sqrt(1+dx*dx+dz*dz);n=[-dx/l,1/l,-dz/l];k=[n[2],0,-n[0]];h=asset['heading'];gaps=[]
 for lx,lz in [(-.6,-.15),(-.6,.15),(.6,-.15),(.6,.15),(0,0)]:
  v=[math.cos(h)*lx+math.sin(h)*lz,0,-math.sin(h)*lx+math.cos(h)*lz];kv=cross(k,v);kkv=cross(k,kv);rot=[v[i]+kv[i]+kkv[i]/(1+n[1])for i in range(3)];rh=sample(x+rot[0],z+rot[2]);gaps.append(None if rh is None else y+rot[1]-rh)
 out=j['ramps'][idx]['out'];dot=math.cos(h)*out[0]-math.sin(h)*out[1]
 assert all(g is not None and abs(g)<.001 for g in gaps), (idx,gaps)
 assert abs(dot)<1e-6,(idx,dot)
 print(json.dumps({'asset':idx,'longAxisDotCrossingDirection':dot,'cornerAndCenterBottomGapsM':gaps}))
