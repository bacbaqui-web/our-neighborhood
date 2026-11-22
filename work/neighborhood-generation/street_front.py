"""Stable final generation stage; optional historical evidence belongs to the CLI."""
# Direct script execution is a compatibility boundary; normal imports are namespaced.
if not __package__:
 from pathlib import Path as _Path
 import runpy as _runpy
 _runpy.run_path(str(_Path(__file__).with_name('legacy.py')))['ensure_package']()
 __package__='neighborhood_generation'
from .street_rules import build as generate

def build(context):
 return generate(context)

if __name__=='__main__':
 from .legacy import run_cli
 run_cli('street_front')
