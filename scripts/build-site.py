"""Build the published viewer from tracked, reviewed application files only."""
import json, shutil, struct, subprocess, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
subprocess.run(['python3', str(ROOT / 'work/browser-generation/pack.py'), '--check'], cwd=ROOT, check=True)
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
    # Old generated districts remain in the source archive. Publish their small
    # manifests so old links can offer regeneration through the single entry.
    if relative.parts[0]=='generated-neighborhoods' and relative.name!='manifest.json':
        continue
    # Reference photos and superseded comparison exports are not app assets.
    if len(relative.parts)>1 and relative.parts[1] in {'apartment-research','first-batch-review'} and source.suffix!='.html':
        continue
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

# This domain-bound web API key is intentionally sent to browsers, like Kakao JS.
# Read only this field; never copy the private settings file or REST credentials.
settings_path=ROOT/'.local-settings.json'
settings=json.loads(settings_path.read_text()) if settings_path.exists() else {}
web_key=os.environ.get('VWORLD_WEB_KEY') or settings.get('vworldApiKey')
if not web_key:
    raise SystemExit('Set VWORLD_WEB_KEY before publishing the site.')
(OUT/'domestic-test/browser-generation/vworld-config.json').write_text(json.dumps({'key':web_key,'domain':'https://magamiscom.ing/neighborhood/'}))

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
subprocess.run(['python3', str(ROOT / 'scripts/optimize-people-site.py')], check=True)
subprocess.run(['python3', str(ROOT / 'scripts/optimize-shop-site.py')], check=True)
total = sum(path.stat().st_size for path in OUT.rglob('*') if path.is_file())
if total >= 1_000_000_000:
    raise ValueError('Site exceeds the Pages size budget.')
print(f'Built {count} files, {total / 1e6:.1f} MB, {len(locations) + 1} neighborhoods.')
