import sys,io,contextlib
from pathlib import Path
with contextlib.redirect_stdout(io.StringIO()):exec(Path(__file__).with_name('check-ramp-connections.py').read_text())
for idx,asset in enumerate(j['assets']):
 x,y,z=asset['position'];pt=Point(x,z);vals=[]
 for q in t.query(pt.buffer(1e-7)):
  if rows[q][0]!='ramp' or not polys[q].buffer(1e-7).covers(pt):continue
  k,a,b,c=rows[q];d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;vals.append(u*a[1]+v*b[1]+(1-u-v)*c[1])
 print(json.dumps({'asset':idx,'positionY':y,'rampHeights':vals,'centerBottomGapM':[y-v for v in vals]}))
