import os
"""Road-connected pedestrian gaps and frontage closures; inferred local test only."""
import json,math,sys
sys.path.insert(0,str(__import__("pathlib").Path(__file__).resolve().parent))
from pathlib import Path
from shapely.geometry import shape,Point,LineString,mapping
from shapely.ops import unary_union,nearest_points
O=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(Path(__file__).resolve().parents[2]/'outputs/domestic-test/house-plots-test')))
def build():
 d=json.loads((O/'enriched-infill.json').read_text());base=json.loads((O/'infill-plots.json').read_text());bs=[shape(b['building']) for b in base['buildings']];houses=unary_union(bs);road=shape(base['road']);protected=unary_union([shape(b['footprint']) for b in d['bays']]+[shape(b['entrance']) for b in d['bays'] if b.get('entrance')]+[shape(p['access']) for p in json.loads((O/'ground-floors.json').read_text())['plans']]+[shape(a) for p in json.loads((O/'piloti.json').read_text())['plans'] for a in p['access']]);gaps=[];used=[]
 for i,a in enumerate(bs):
  for j in range(i+1,len(bs)):
   b=bs[j];w=a.distance(b)
   if not .65<w<5:continue
   A,B=nearest_points(a,b);mx,my=(A.x+B.x)/2,(A.y+B.y)/2;nx,ny=(B.x-A.x)/w,(B.y-A.y)/w;tx,ty=-ny,nx
   candidates=[]
   for sign in [-1,1]:
    ray=LineString([(mx,my),(mx+tx*sign*25,my+ty*sign*25)]);hit=ray.intersection(road)
    if not hit.is_empty:
     q=nearest_points(Point(mx,my),hit)[1];dist=q.distance(Point(mx,my))
     if 1.5<dist<18:candidates.append((dist,q,sign))
   if not candidates:continue
   dist,q,sign=min(candidates,key=lambda v:v[0]);ux,uy=-tx*sign,-ty*sign;mouth=Point(q.x+ux*.4,q.y+uy*.4)
   if any(mouth.distance(v)<3 for v in used):continue
   # Check constant-width access along the whole gap, not only its mouth.
   end=Point(mx+ux*2,my+uy*2);width=min(1.6,w-.45);path=LineString([q,end]).buffer(width/2,cap_style=2)
   if w>=1.8 and dist>=4 and path.intersection(houses.buffer(.12)).area<.01 and path.intersection(protected).area<1e-8:
    path=path.difference(road);kind='passage';geom=path;aa,bb=[mouth.x,mouth.y],[end.x,end.y]
   else:
    A=nearest_points(a,mouth)[0];B=nearest_points(b,mouth)[0];line=LineString([A,B]);geom=line.buffer(.08,cap_style=2)
    if not .65<line.length<5 or line.distance(road)>3.5 or geom.intersection(road).area>.01 or geom.intersection(protected.buffer(.15)).area>1e-8 or line.intersection(houses.buffer(-.04)).length>.01:continue
    kind='shutter' if len(gaps)%2 else 'wall';aa,bb=list(A.coords[0]),list(B.coords[0])
   if geom.intersection(unary_union([shape(g['geometry']) for g in gaps])).area>.01:continue
   gaps.append(dict(kind=kind,a=aa,b=bb,geometry=mapping(geom),width=round(w,2),focus=[mouth.x,mouth.y],camera=[q.x-ux*6,q.y-uy*6],pair=[base['buildings'][i]['id'],base['buildings'][j]['id']]));used.append(mouth)
 clear=unary_union([shape(g['geometry']).buffer(.15) for g in gaps]);d['plants']=[p for p in d['plants'] if not clear.intersects(Point(p['point']).buffer(p['radius']))]
 for key in ['walls']:
  d[key]=[w for w in d[key] if not LineString([w['a'],w['b']]).intersects(clear)]
 d['siteDetails']['fences']=[f for f in d['siteDetails']['fences'] if not LineString([f['a'],f['b']]).intersects(clear)]
 d['qa']['plants']=len(d['plants']);d['gaps']=gaps;qa={k:sum(g['kind']==k for g in gaps) for k in ['passage','wall','shutter']};qa['protectedOverlap']=sum(shape(g['geometry']).intersection(protected).area for g in gaps);assert qa['protectedOverlap']<.01
 (O/'gaps-infill.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));(O/'gaps-qa.json').write_text(json.dumps(qa,indent=2));print(qa)
 import importlib.util
 spec=importlib.util.spec_from_file_location('frontage_refine',Path(__file__).with_name('refine.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.build()
if __name__=='__main__':build()
