"""Compatibility entry; the maintained implementation is in neighborhood-generation."""
from pathlib import Path as _Path
import sys as _sys
_source = _Path(__file__).resolve().parents[1] / 'neighborhood-generation' / _Path(__file__).name
if str(_source.parent) not in _sys.path:
    _sys.path.insert(0, str(_source.parent))
__file__ = str(_source)
exec(compile(_source.read_bytes(), __file__, 'exec'), globals())
