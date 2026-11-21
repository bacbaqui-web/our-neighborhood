"""Run from repository root. Independent actual-input landing boundary audit."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from junction_generation import plan_junctions
from shapely.geometry import shape,Polygon
p=Path(__file__).with_name('actual-landing-boundary-fixture.json');f=json.loads(p.read_text())
j=plan_junctions(f['roads'],shape(f['road']),shape(f['sidewalk']),lambda x,z:0,Polygon(),shape(f['barriers']))
zone=shape(j['zone']);walk=shape(j['sidewalk'])
rows=[{'index':i,'area':shape(r['footprint']).area,'outsideZoneM2':shape(r['footprint']).difference(zone).area,'outsideSidewalkM2':shape(r['footprint']).difference(walk).area,'covered':zone.covers(shape(r['footprint']))}for i,r in enumerate(j['ramps'])]
print(json.dumps({'crossings':len(j['crossings']),'ramps':len(j['ramps']),'details':rows},indent=2))
assert len(j['crossings'])==f['expectedCrossings'] and len(j['ramps'])==f['expectedRamps']
assert all(r['outsideZoneM2']<1e-10 and r['outsideSidewalkM2']<1e-10 for r in rows),'Accepted landing extends outside its final public surface'
