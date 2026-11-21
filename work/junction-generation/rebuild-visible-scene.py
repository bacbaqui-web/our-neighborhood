"""Apply the production junction stage to an exported, existing visible360 scene.
Does not retrieve, add, move or reselect buildings. Run only on a copied scene.
"""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import junction_generation,site_layout
root=Path(sys.argv[1]);read=lambda p:json.loads((root/p).read_text());write=lambda p,v:(root/p).write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')))
loc=read('location.json');assert loc['view']['mode']=='visible360'
protected=['corrected-base.glb','buildings.geojson','view-selection.json']
before={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in protected}
roads=read('roads-source.json')['roads']
for r in roads:
 if 'grade' not in r:
  r['grade']=0 if r.get('streetType')=='pedestrian' else 4 if r['width']>=19 else 3 if r['width']>=12 else 2 if r['width']>=7 else 1
  r['gradeSource']='legacy reserved width, retained without resizing'
qa=junction_generation.build(root,roads)
package=read('site-layout.json');site_layout.align_road_paint(package,root);site_layout.protect_public_surfaces(package,root);write('site-layout.json',package)
after={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in protected};assert before==after
write('junction-validation.json',{'method':'production junction stage on saved visible360 scene','unchanged':before,'qa':qa,'legacyGrades':[r['grade'] for r in roads]})
print(json.dumps(qa,ensure_ascii=False))
