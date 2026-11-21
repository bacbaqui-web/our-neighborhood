"""Append/update this collection without regenerating unrelated curated entries."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'outputs/domestic-test/asset-encyclopedia/catalog.json'
c=json.loads(p.read_text());m=json.loads((root/'outputs/domestic-test/junction-assets/manifest.json').read_text())
ids={a['id'] for a in m}
assert len(ids)==len(m)
c['entries']=[a for a in c['entries'] if a['id'] not in ids]
for a in m:
 c['entries'].append(dict(id=a['id'],name=a['name'],category='도로·안전',collection='교차로 연결 부품',kind='glb',file='../junction-assets/'+a['file'],triangles=a['triangles'],note='로드뷰 관찰 기반 제작. 치수는 추정. 연결 예시는 실측 복제가 아니며 자동 동네 배치에는 미적용.'))
p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
print(f'Registered {len(m)} junction assets; preserved other entries')
