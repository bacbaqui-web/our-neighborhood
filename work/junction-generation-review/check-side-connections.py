"""Actual ramp plateau side-height and sidewalk-section audit; DATA_DIR argument."""
import sys,io,contextlib,json
from pathlib import Path
from shapely.geometry import shape,LineString
with contextlib.redirect_stdout(io.StringIO()):exec(Path(__file__).with_name('check-ramp-connections.py').read_text())
def sample(x,z):
 pt=Point(x,z);out=[]
 for q in t.query(pt.buffer(1e-7)):
  if rows[q][0]not in ['ramp','sidewalk'] or not polys[q].buffer(1e-7).covers(pt):continue
  k,a,b,c=rows[q];d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;out.append({'kind':k,'height':u*a[1]+v*b[1]+(1-u-v)*c[1]})
 return out
pairs=[];sections=[];walk=shape(j['sidewalk'])
for i,r in enumerate(j['ramps']):
 n=r['out'];u=[n[1],-n[0]];c=r['center']
 for along in [.4,.55,.7]:
  for side in [-1,1]:
   vals=[sample(c[0]+n[0]*along+u[0]*side*w,c[1]+n[1]*along+u[1]*side*w)for w in [1.199,1.201]]
   pairs.append({'ramp':i,'alongFromCenter':along,'side':side,'inside':vals[0],'outside':vals[1],'differenceM':abs(vals[0][0]['height']-vals[1][0]['height'])if all(vals)else None})
 for side in [-1,1]:
  line=LineString([(c[0]+u[0]*side*1.21+n[0]*a,c[1]+u[1]*side*1.21+n[1]*a)for a in [-2,2]])
  sections.append({'ramp':i,'side':side,'sidewalkSurfaceSectionM':walk.intersection(line).length})
print(json.dumps({'dataDirectory':p,'scope':'sidewalk geometry only; not clear width after all rendered obstacles','pairs':pairs,'maxDifferenceM':max(a['differenceM']for a in pairs),'sections':sections},indent=2))
