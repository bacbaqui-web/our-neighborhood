"""Shared location inputs. With no environment override, preserve the original scene."""
import os, json
from pathlib import Path
SHARED = Path(__file__).resolve().parents[1]
ROOT = Path(os.environ.get('NEIGHBORHOOD_DATA', SHARED)).resolve()
DYNAMIC = ROOT != SHARED
REPORT = ROOT.parent if DYNAMIC else SHARED.parent
ORIGIN = json.loads((ROOT/'location.json').read_text())['origin'] if DYNAMIC else [37.626469,127.015677]
LAT,LON = ORIGIN
CACHE = Path.home()/'Library/Caches/rokehan-neighborhood/terrain-tiles'
CACHE.mkdir(parents=True,exist_ok=True)

RADIUS = int(json.loads((ROOT/'location.json').read_text()).get('sizeMetres',300)/2) if DYNAMIC else 150
