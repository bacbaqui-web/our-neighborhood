"""Lossless public-only people images; source PNGs remain untouched."""
import hashlib,json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image,ImageChops
ROOT=Path(__file__).resolve().parents[1]/'dist'
people=ROOT/'domestic-test/people'
def convert(path):
    with Image.open(path) as source:
        original=source.convert('RGBA')
        target=path.with_suffix('.webp')
        original.save(target,format='WEBP',lossless=True,method=6,exact=False)
        with Image.open(target) as encoded:
            restored=encoded.convert('RGBA')
            assert original.getchannel('A').tobytes()==restored.getchannel('A').tobytes(),path
            # RGB under fully transparent pixels is not displayed and may be discarded.
            mask=original.getchannel('A').point(lambda a:255 if a else 0)
            assert ImageChops.multiply(ImageChops.difference(original.convert('RGB'),restored.convert('RGB')),mask.convert('RGB')).getbbox() is None,path
        result=(path.relative_to(people).as_posix(),target.relative_to(people).as_posix(),hashlib.sha256(target.read_bytes()).hexdigest())
        path.unlink() # dist only; source images are preserved
        return result
with ThreadPoolExecutor(max_workers=4) as pool:
    converted=list(pool.map(convert,sorted(people.rglob('*.png'))))
changes={old:(new,digest) for old,new,digest in converted}
def rewrite(value):
    if isinstance(value,dict):
        result={rewrite(k):rewrite(v) for k,v in value.items()}
        if value.get('image') in changes and 'sha256' in value:result['sha256']=changes[value['image']][1]
        return result
    if isinstance(value,list):return [rewrite(v) for v in value]
    if isinstance(value,str):
        for prefix in ['', 'people/', '../people/']:
            if value.startswith(prefix) and value[len(prefix):] in changes:return prefix+changes[value[len(prefix):]][0]
    return value
for path in list(people.glob('*.json'))+[ROOT/'domestic-test/asset-encyclopedia/catalog.json',* (ROOT/'domestic-test/asset-encyclopedia/categories').glob('*/catalog.json')]:
    data=json.loads(path.read_text());path.write_text(json.dumps(rewrite(data),ensure_ascii=False,separators=(',',':')))
print(f'Public people: {len(converted)} lossless WebP images; alpha and every visible RGB pixel verified.')
