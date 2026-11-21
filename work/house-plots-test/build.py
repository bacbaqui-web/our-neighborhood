import os,runpy
"""Local experiment: preserve roads, fit buildings, merge small remnants and partition plots."""
import sys,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'outputs/domestic-test/generation'))
import shapely as S
from shapely.geometry import box,Polygon,MultiPoint,mapping
from shapely.ops import unary_union
from site_geometry import Site
source=Path(os.environ.get('NEIGHBORHOOD_DATA',str(ROOT/'outputs/domestic-test')))
origin=json.loads(os.environ.get('NEIGHBORHOOD_ORIGIN','[37.626469,127.015677]'))
site=Site(source,origin)
out=Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(ROOT/'outputs/domestic-test/house-plots-test')))
out.mkdir(parents=True,exist_ok=True)
radius=float(os.environ.get('NEIGHBORHOOD_LAYOUT_RADIUS','150'))
limit=box(-radius,-radius,radius,radius)
original={k:b for k,b in site.buildings.items() if limit.covers(b)}
# Preserve the imported road exactly. Clearance also keeps facade details off asphalt.
road=site.road.intersection(limit)
land=limit.difference(road)
blocks=[p for p in S.get_parts(land) if p.geom_type=='Polygon' and p.area>.001]
has_profiles=any(f['properties'].get('streetProfile') for f in json.loads((source/'buildings.geojson').read_text())['features'])
protected=road if has_profiles else road.buffer(.4,join_style=2)
bs={};changes={};small=[];unresolved=[];merged=[]
for k,b in original.items():
 parts=[p for p in S.get_parts(b.difference(protected)) if p.geom_type=='Polygon' and p.area>.01]
 fitted=b if has_profiles else max(parts,key=lambda p:p.area) if parts else Polygon()
 changed=b.symmetric_difference(fitted).area>.01
 changes[k]={'originalArea':round(b.area,2),'fittedArea':round(fitted.area,2),'status':'shrunk' if changed else 'unchanged','sourceIds':[k]}
 if fitted.area>0:bs[k]=fitted
 if changed and (fitted.area<20 or fitted.area<b.area*.35):small.append(k)
# A small remainder is joined only to a nearby building in the same road block.
for k in sorted(small,key=lambda k:bs.get(k,Polygon()).area):
 b=bs.get(k,Polygon());anchor=b if not b.is_empty else original[k]
 block=max(blocks,key=lambda p:p.intersection(anchor).area)
 if block.intersection(anchor).area<.01:
  block=min(blocks,key=lambda p:p.distance(anchor))
 candidates=sorted((anchor.distance(v),j) for j,v in bs.items() if j!=k and j not in small and block.covers(v) and anchor.distance(v)<=15)
 success=False
 for distance,j in candidates:
  target=bs[j]
  combined=target if b.is_empty else unary_union([target,b]).convex_hull.difference(protected)
  others=unary_union([v for other,v in bs.items() if other not in (k,j)])
  combined=combined.difference(others.buffer(.05))
  # Never bridge a road or consume a third house.
  if not block.covers(combined) or combined.intersection(protected).area>1e-7:continue
  if any(combined.intersection(v).area>1e-7 for other,v in bs.items() if other not in (k,j)):continue
  if combined.geom_type!='Polygon':continue
  bs[j]=combined;bs.pop(k,None);changes[j]['status']='merged';changes[j]['sourceIds'].append(k)
  merged.append({'source':k,'target':j,'gap':round(distance,2)});success=True;break
 if not success:unresolved.append(k)
built=unary_union(list(bs.values()))
from straight_plots import partition
plots,empty,partition_qa=partition(blocks,bs)
# Keep each owner's land connected to its house. Reassign detached islands to neighbors.
islands=[]
for k,p in list(plots.items()):
 parts=list(S.get_parts(p));main=max(parts,key=lambda g:g.intersection(bs[k]).area)
 plots[k]=main
 islands.extend(g for g in parts if g is not main and g.area>1e-9)
for _ in range(10):
 remaining=[]
 for island in islands:
  neighbors=[(p.boundary.intersection(island.boundary).length,k) for k,p in plots.items() if p.distance(island)<1e-7]
  if neighbors and max(neighbors)[0]>1e-7:
   _,k=max(neighbors);plots[k]=plots[k].union(island)
  else:remaining.append(island)
 if len(remaining)==len(islands):break
 islands=remaining
empty.extend(remaining)
allplots=unary_union(list(plots.values()))
# Include numerical slivers from block splitting in common land instead of losing them.
common=land.difference(allplots)
qa={'originalBuildings':len(original),'shrunkBuildings':sum(changes[k]['status']=='shrunk' for k in bs),'mergedBuildings':merged,'unresolvedSmallBuildings':unresolved,'roadPreservedAreaDifference':road.symmetric_difference(site.road.intersection(limit)).area,'buildingRoadOverlapArea':built.intersection(road).area,'buildingOverlapArea':sum(b.area for b in bs.values())-built.area,'buildings':len(bs),'plots':len(plots),'blocks':len(blocks),'emptyBlockArea':common.area,'unassignedArea':land.difference(allplots.union(common)).area,'overlapArea':sum(p.area for p in plots.values())-allplots.area,'roadOverlapArea':allplots.intersection(road).area,'outsideOwnPlotArea':sum(b.difference(plots[k]).area for k,b in bs.items()),'multipartPlots':sum(p.geom_type!='Polygon' for p in plots.values()),'sourceBuildingOverlapArea':sum(b.area for b in original.values())-unary_union(list(original.values())).area,'removedNoFootprint':[k for k in original if k not in bs and not any(m['source']==k for m in merged)]}
qa.update(partition_qa)
assert qa['buildingRoadOverlapArea']<1e-6 and abs(qa['buildingOverlapArea'])<1e-6 and qa['outsideOwnPlotArea']<1e-6 and qa['unassignedArea']<1e-6 and abs(qa['overlapArea'])<1e-6 and qa['roadOverlapArea']<1e-6,qa
sys.path.insert(0,str(ROOT/'work'))
from scene_edits import align_profile
profiles={int(f['properties']['objectid']):f['properties'].get('streetProfile') for f in json.loads((source/'buildings.geojson').read_text())['features']}
features=[]
for k,b in bs.items():
 p=plots[k]
 if p.is_empty:print('EMPTY',k,b.area,b.geom_type,flush=True);continue
 c=b.centroid;features.append({'streetProfile':align_profile(profiles.get(k),b),'change':changes[k],'id':k,'building':mapping(b),'plot':mapping(p),'levels':site.levels[k],'base':min(site.height(x,z) for x,z in b.exterior.coords),'area':round(p.area,1),'yardArea':round(p.difference(b).area,1),'roadContact':p.boundary.intersection(road.buffer(.02)).length>.1})
body={'origin':origin,'radius':radius,'road':mapping(road),'common':mapping(common),'buildings':features,'qa':qa}
(out/'plots.json').write_text(json.dumps(body,ensure_ascii=False,separators=(',',':')))
(out/'qa.json').write_text(json.dumps(qa,indent=2));print(qa)

# Rebuild the derived land-use layer with the same geometry environment.
runpy.run_path(str(Path(__file__).with_name("infill.py")),run_name="__main__")
