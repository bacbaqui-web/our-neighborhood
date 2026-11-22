"""Reviewed publication inputs; independent of Git/index and local experiments."""
import json
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'config/publication-files.json'

def publication_files(root=ROOT, manifest=MANIFEST):
    value = json.loads(Path(manifest).read_text())
    if value.get('version') != 1 or not isinstance(value.get('files'), list):
        raise ValueError('Unsupported publication manifest')
    names = value['files']
    if len(names) != len(set(names)):
        raise ValueError('Duplicate publication path')
    if names != sorted(names):
        raise ValueError('Publication paths must be sorted')
    for name in names:
        if not isinstance(name, str):
            raise ValueError('Publication path must be a string')
        p = PurePosixPath(name)
        if p.is_absolute() or '..' in p.parts or '\\' in name or str(p) != name or p.parts[0] != 'outputs':
            raise ValueError(f'Unsafe publication path: {name}')
        if p.suffix in {'.py', '.pyc', '.pyo'} or any(part in {'__pycache__', '.cache', 'node_modules', 'tests', 'test-results', 'generation'} for part in p.parts):
            raise ValueError(f'Development/cache file cannot be published: {name}')
        source = Path(root) / name
        if any((Path(root) / Path(*p.parts[:i])).is_symlink() for i in range(1, len(p.parts) + 1)):
            raise ValueError(f'Symlink publication path: {name}')
        if not source.is_file():
            raise ValueError(f'Missing publication file: {name}')
    return names
