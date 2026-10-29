import sys,json,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from arterial_plan import build
with tempfile.TemporaryDirectory() as folder:
 root=Path(folder)
 (root/'location.json').write_text(json.dumps({'origin':[37.618,127.008],'sizeMetres':100}))
 for points in [[[-20,0],[0,20],[20,0]], [[0,0],[10,0],[0,0]]]:
  (root/'roads-source.json').write_text(json.dumps({'roads':[{'geometry':{'type':'LineString','coordinates':points},'width':8,'properties':{'class':'tertiary'}}]}))
  assert build(root) is None
 print('Curved and closed roads retain base road layout without an arterial override')
