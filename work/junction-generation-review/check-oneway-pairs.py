import json,base64,math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from shapely.geometry import shape
j=json.load(open(sys.argv[1]));ip=json.loads(base64.b64decode(j['files']['generation-input.json']));rs=[r for r in ip['sourceRoads'] if r['grade']>=3]
print('Roads')
for r in rs:
 p=r['properties'];cs=r['geometry']['coordinates'];v=[cs[-1][i]-cs[0][i] for i in [0,1]];l=math.hypot(*v);sg=-1 if p.get('oneway')==-1 else 1
 print(r['editId'],'grade',r['grade'],'source',r['gradeSource'],'width',r['width'],'properties',p,'flow',[round(sg*x/l,4) for x in v],'length',round(shape(r['geometry']).length,2))
print('Pair candidates')
for i,a in enumerate(rs):
 for b in rs[i+1:]:
  la,lb=shape(a['geometry']),shape(b['geometry']);pa,pb=list(la.coords),list(lb.coords);va=[pa[-1][k]-pa[0][k] for k in [0,1]];vb=[pb[-1][k]-pb[0][k] for k in [0,1]];va=[v/math.hypot(*va) for v in va];vb=[v/math.hypot(*vb) for v in vb];cos=sum(x*y for x,y in zip(va,vb));flowcos=cos*(-1 if a['properties']['oneway']==-1 else 1)*(-1 if b['properties']['oneway']==-1 else 1)
  da=[sum(p[k]*va[k] for k in [0,1]) for p in pa];db=[sum(p[k]*va[k] for k in [0,1]) for p in pb];overlap=min(max(da),max(db))-max(min(da),min(db));gap=la.distance(lb)
  if abs(cos)>.95 and 1<gap<25 and overlap>5:
   print(a['editId'],b['editId'],'flowCos',round(flowcos,4),'gap',round(gap,3),'longOverlap',round(overlap,3),'orig widths',a['width'],b['width'],'half widths',a['width']/2,b['width']/2,'gapAfterHalfApprox',round(gap-(a['width']+b['width'])/4,3))
