"""Real parcel pipeline fixture; uses production shapes and renderers."""
import sys,os,json,runpy
from pathlib import Path
from shapely.geometry import box,Polygon,LineString,mapping
from shapely.affinity import rotate
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work'));sys.path.insert(0,str(ROOT/'work/neighborhood-generation'))
from scene_edits import classify_roads,apply_building_rules
from alley_housing import decorate
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True);os.environ['NEIGHBORHOOD_LAYOUT_OUTPUT']=str(out.resolve())
road=box(-50,-2.6,50,2.6)
polys=[rotate(box(-36,8,-26,18),12),box(-16,7,-6,18),Polygon([(0,7),(10,7),(10,18),(4,18),(4,14),(0,14)]),Polygon([(13,7),(23,7),(23,18),(17,18),(17,14),(13,14)])]
plots=[box(-44,2.6,-22,23),box(-22,2.6,-3,23),box(-3,2.6,11.5,23),box(11.5,2.6,28,23)]
r=[{'properties':{'class':'minor'},'geometry':mapping(LineString([(-50,0),(50,0)]))}];classify_roads(r,{})
f=[{'properties':{'objectid':i+1,'gro_flo_co':3,'floorsEstimated':True},'geometry':mapping(p)} for i,p in enumerate(polys)]
apply_building_rules({'features':f},r,{},local=True)
bs=[dict(id=i+1,building=mapping(p),plot=mapping(plots[i]),levels=f[i]['properties']['gro_flo_co'],streetProfile=f[i]['properties']['streetProfile'],base=0,area=plots[i].area,yardArea=plots[i].area-p.area,roadContact=True) for i,p in enumerate(polys)]
body={'road':mapping(road),'common':mapping(Polygon()),'buildings':bs,'qa':{'mergedBuildings':[]}}
(out/'plots.json').write_text(json.dumps(body))
runpy.run_path(str(ROOT/'work/neighborhood-generation/infill.py'),run_name='__main__')
p={'version':1}
for key,name in [('plots','infill-plots'),('frontages','frontages'),('piloti','piloti'),('groundFloors','ground-floors'),('infill','street-infill')]:p[key]=json.loads((out/(name+'.json')).read_text())
decorate(p);(out/'package.json').write_text(json.dumps(p));print('ALLEY_QA',p['infill']['alleyHousingQA'])
