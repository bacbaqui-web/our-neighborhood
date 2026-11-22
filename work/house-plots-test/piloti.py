"""Compatibility entry; maintained implementation is in neighborhood-generation."""
from pathlib import Path as _Path
import runpy as _runpy
_legacy=_Path(__file__).resolve().parents[1]/'neighborhood-generation'/'legacy.py'
_runpy.run_path(str(_legacy))['export_legacy'](_Path(__file__).stem,globals())
