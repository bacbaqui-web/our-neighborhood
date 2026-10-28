"""Build the published viewer from tracked, reviewed application files only."""
import json, shutil, struct, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
files = subprocess.check_output(['git', 'ls-files', '-z', 'outputs'], cwd=ROOT).decode().split('\0')
if not any(name.endswith('/app.js') for name in files):
    raise SystemExit('Stage the application files before building.')
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
count = total = 0
for name in filter(None, files):
    source = ROOT / name
    relative = Path(name).relative_to('outputs')
    # The allowlisted browser source bundle is packaged separately. Raw development scripts stay local.
    if 'generation' in relative.parts or source.suffix == '.py':
        continue
    if source.is_symlink():
        raise ValueError(f'Unexpected symlink: {name}')
    data = source.read_bytes()
    if source.suffix in {'.json', '.geojson'}:
        json.loads(data)
    elif source.suffix == '.glb':
        if len(data) < 20 or data[:4] != b'glTF' or struct.unpack_from('<II', data, 4) != (2, len(data)):
            raise ValueError(f'Incomplete GLB: {name}')
    destination = OUT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    count += 1
    total += len(data)

locations = []
for path in sorted((OUT / 'generated-neighborhoods').glob('*/data/manifest.json')):
    data = json.loads(path.read_text())
    locations.append({key: data[key] for key in ('id', 'address', 'query', 'origin', 'generatedAt') if key in data})
(OUT / 'domestic-test/locations.json').write_text(json.dumps(locations, ensure_ascii=False, indent=2))
(OUT / 'domestic-test/deployment.json').write_text('{"mode":"browser"}\n')
default = locations[-1]['id'] if locations else 'original'
(OUT / 'index.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>우리 동네 · 웹툰 배경</title>
<script>const target=new URL(location.search?'./domestic-test/':'./domestic-test/start.html',location.href);target.search=location.search;

target.hash=location.hash;location.replace(target.href);</script>
<a href="./domestic-test/">우리 동네 열기</a></html>'''.replace('DEFAULT', json.dumps(default)))
(OUT / '.nojekyll').touch()
if total >= 1_000_000_000:
    raise ValueError('Site exceeds the Pages size budget.')
print(f'Built {count} files, {total / 1e6:.1f} MB, {len(locations) + 1} neighborhoods.')
