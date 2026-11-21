"""Lossless public textures for the shop release; source artwork stays untouched."""
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageChops
root=Path(__file__).resolve().parents[1]/'dist/domestic-test'
textures=root/'shops/textures'
def convert(path):
    with Image.open(path) as image:
        original=image.convert('RGBA');target=path.with_suffix('.webp')
        original.save(target,format='WEBP',lossless=True,method=6)
        with Image.open(target) as image:
            restored=image.convert('RGBA')
            assert original.getchannel('A').tobytes()==restored.getchannel('A').tobytes(),path
            mask=original.getchannel('A').point(lambda a:255 if a else 0)
            assert ImageChops.multiply(ImageChops.difference(original.convert('RGB'),restored.convert('RGB')),mask.convert('RGB')).getbbox() is None,path
        saved=path.stat().st_size-target.stat().st_size
        old=path.relative_to(root).as_posix();new=target.relative_to(root).as_posix()
        path.unlink() # generated dist only
        return old,new,saved
with ThreadPoolExecutor(max_workers=4) as pool:
    changes=list(pool.map(convert,sorted([*textures.rglob('*.png'),*(root/'vehicles').rglob('*.png')])))
# Includes the packaged Python source's embedded catalog. Paths retain their prefix.
for path in root.rglob('*'):
    if path.suffix not in {'.js','.json','.html'}:continue
    text=path.read_text();updated=text
    for old,new,_ in changes:
        updated=updated.replace(old,new)
        if old.startswith('shops/textures/'):
            updated=updated.replace(old.removeprefix('shops/textures/'),new.removeprefix('shops/textures/'))
    if text!=updated:
        if path.suffix=='.json':json.loads(updated)
        path.write_text(updated)
print(f'Public shop/vehicle textures: {len(changes)} lossless WebP textures; visible pixels verified; saved {sum(x[2] for x in changes):,} bytes.')
