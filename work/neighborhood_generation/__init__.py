"""Stable package name for maintained sources in neighborhood-generation.

Only this package's lookup paths are extended; process-wide import paths and
unrelated cached modules are untouched. Existing geometry keeps its owner.
"""
from pathlib import Path

_root=Path(__file__).resolve().parents[2]
__path__=[str(_root/'work/neighborhood-generation'),str(_root/'outputs/domestic-test/generation'),str(_root/'work')]
from .context import GenerationContext

def generate(context, start='build'):
 from .pipeline import run
 return run(context,start)
