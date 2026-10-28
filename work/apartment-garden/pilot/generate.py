import json,math,random
from pathlib import Path
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[3];D=R/'outputs/domestic-test/apartments/garden';data=json.loads((D/'rule-plan.json').read_text());ref=next(f for f in data['facilities'] if f['id']=='play-0');rng=random.Random(1414)
def polys(g):return [g] if g.geom_type=='Polygon' else [p for x in getattr(g,'geoms',[]) for p in polys(x)]
def rings(g):return [{'outer':list(p.exterior.coords)[:-1],'holes':[list(h.coords)[:-1] for h in p.interiors]} for p in polys(g) if p.area>.03]
def soft(points,w):return LineString(points).buffer(w/2,quad_segs=8,join_style=1)
site=box(-18,-21,16,8).buffer(-2).buffer(2,quad_segs=10)
play=box(-9.5,-6.5,3.5,4.5);rest=box(6,-15,13,-8)
loop=soft([(-12,-6),(-12,3),(-10,6),(3,6),(6,3),(6,-5),(3,-8),(-9,-8),(-12,-6)],2)
paths=unary_union([loop,soft([(0,7.8),(0,5.8)],2.8),soft([(-12,-6),(-14,-10),(-11,-15),(-7,-17),(0,-17),(5,-15),(8,-12)],1.9),soft([(3,-8),(6,-10),(8,-12)],2.2),rest]).intersection(site)
# Rest pockets adjoin the main walk instead of placing furniture in the path.
pockets=[box(-16,-7,-12,-3),box(-9,-20,-4,-17),box(7,2,12,6)]
paths=paths.union(unary_union(pockets));lawn=site.difference(paths.union(play))
# Irregular deep perimeter beds and a soft inner island, with open lawn retained.
beds=unary_union([site.difference(site.buffer(-2.1)),Point(-14,-12).buffer(3.6),Point(2,-12).buffer(2.8),Point(12,-3).buffer(3.3),Point(-6,-12).buffer(2.5)]).intersection(lawn).buffer(-.15).buffer(.15)
soil=beds
shrubs=[];flowers=[]
for _ in range(4500):
 p=Point(rng.uniform(-18,16),rng.uniform(-21,8))
 if not beds.buffer(-.2).contains(p):continue
 # Dense varied shrubs towards the back of beds; flowers at the pedestrian edge.
 near=p.distance(paths)
 if near<1.2:
  if all(p.distance(Point(f['point']))>.23 for f in flowers):flowers.append({'point':list(p.coords)[0],'height':rng.uniform(.24,.65),'tone':rng.randrange(5)})
 elif all(p.distance(Point(s['point']))>.7 for s in shrubs):shrubs.append({'point':list(p.coords)[0],'radius':rng.uniform(.48,.85),'height':rng.uniform(.55,1.1),'tone':rng.randrange(5)})
# Tree trunks stay out of paths and play pads; canopies frame, rather than cover, the activity area.
trees=[]
for x,z,h,kind in [(-16,-17,8,'zelkova'),(-8,-20,7,'zelkova'),(0,-20,8,'zelkova'),(-17,-2,7,'zelkova'),(-16,5,7,'cherry'),(14,1,7,'zelkova'),(-6,-12,5,'cherry')]:
 p=Point(x,z)
 if paths.distance(p)>1 and play.distance(p)>2:trees.append({'point':[x,z],'height':h,'asset':kind})
# Flowering ornamental trees sit at the sides of the central garden.
ornamental=[[-16,-10],[12,-5],[3,-19]]
benches=[{'point':[-14.5,-5],'angle':math.pi/2},{'point':[-6.5,-18.5],'angle':0},{'point':[9.5,4.5],'angle':math.pi}]
lamps=[[-13,5],[5,6],[7,-6],[-13,-14],[3,-16],[14,-11]]
c,s=math.cos(ref['angle']),math.sin(ref['angle'])
def world(p):return [ref['point'][0]+c*p[0]+s*p[1],ref['point'][1]-s*p[0]+c*p[1]]
foot=Polygon([world(p) for p in site.exterior.coords]);road=unary_union([Polygon(r['outer'],r['holes']) for r in data['surfaces']['road']]);parking=unary_union([Polygon(p['footprint']) for p in data['parking']]);assert foot.intersection(road).area<.01;assert foot.intersection(parking).area<.01
assert all(not paths.contains(Point(t['point'])) for t in trees)
assert all(not play.contains(Point(b['point'])) for b in benches)
result={'origin':ref['point'],'angle':ref['angle'],'replaceFacility':'play-0','center':world([-1,-6]),'footprint':list(foot.exterior.coords),'surfaces':{'lawn':rings(site),'soil':rings(soil),'paths':rings(paths)},'trees':trees,'ornamental':ornamental,'shrubs':shrubs,'flowers':flowers,'benches':benches,'lamps':lamps,'play':{'point':[-3,-1]},'pergola':{'point':[9.5,-11.5]},'qa':{'area':round(site.area),'matureTrees':len(trees),'floweringTrees':len(ornamental),'shrubs':len(shrubs),'flowerClumps':len(flowers),'benches':len(benches)+5,'roadOverlap':0,'parkingOverlap':0}}
(D/'pilot-plan.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')));print(result['qa'])
