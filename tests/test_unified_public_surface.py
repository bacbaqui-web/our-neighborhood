"""Parcel props cannot occupy the final arterial road/sidewalk overlay."""
import json,sys,tempfile
from pathlib import Path
from shapely.geometry import box,mapping
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from site_layout import protect_public_surfaces
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);(root/'arterial').mkdir()
 (root/'arterial/plan.json').write_text(json.dumps({'publicRings':[{'outer':list(box(0,0,10,10).exterior.coords),'holes':[]}]}))
 blocked={'point':[5,5],'footprint':mapping(box(4,4,6,6))};safe={'point':[15,5],'footprint':mapping(box(14,4,16,6))}
 package={'infill':{'bays':[blocked,safe],'roadBays':[blocked],'walls':[{'a':[-1,5],'b':[11,5]}],'plants':[{'point':[5,5],'radius':.4},{'point':[15,5],'radius':.4}],'zones':[{'geometry':mapping(box(-5,-5,20,20))}]}}
 protect_public_surfaces(package,root)
 assert package['infill']['bays']==[safe]
 assert not package['infill']['roadBays'] and not package['infill']['walls']
 assert len(package['infill']['plants'])==1
 assert package['publicSurfaceQA']['removed']['bays']==1
print('PASS: final road and sidewalk override removes overlapping parking, walls and planting.')
