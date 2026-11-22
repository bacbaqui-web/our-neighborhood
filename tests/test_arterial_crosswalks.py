"""A disconnected public crossing must not abort the whole scene or bridge its gap."""
import importlib.util
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch
from shapely.geometry import box, mapping, Polygon

ROOT = Path(__file__).resolve().parents[1]
# These adapters replace only external map/terrain acquisition; arterial geometry is real.
source = types.ModuleType('neighborhood_sources')
source.Terrain = object
source.scales = lambda lat: (90000, 110000)
source.kakao = lambda *args: {'documents': []}
terrain = types.ModuleType('kakao_terrain')
terrain.load_terrain = lambda *args: types.SimpleNamespace(mesh_height=lambda x, z: 0)
spec = importlib.util.spec_from_file_location('arterial_under_test', ROOT/'work/arterial_plan.py')
arterial = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {'neighborhood_sources': source, 'kakao_terrain': terrain}):
    spec.loader.exec_module(arterial)

class CrosswalkGeometry(unittest.TestCase):
    def generate(self, public):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = {
                'location.json': {'origin': [37.57, 126.98], 'sizeMetres': 80},
                'roads-source.json': {'roads': [
                    {'geometry': {'coordinates': [[-40, 0], [40, 0]]}, 'grade': 3, 'width': 13.5, 'properties': {'class': 'primary'}},
                    {'geometry': {'coordinates': [[0, -30], [0, 30]]}, 'grade': 2, 'width': 7, 'properties': {'class': 'secondary'}},
                ]},
                'buildings.geojson': {'features': []},
                'road-reservation.json': {'majorPublic': mapping(public), 'road': mapping(box(-40,-6.75,40,6.75)), 'qa': {}},
                'road-context.json': {'positions': {}, 'qa': {}},
                'parcels.json': {'yards': [], 'segments': []},
                'attached-structures.json': {'structures': [], 'drives': [], 'wallSegments': [], 'qa': {}},
                'streetscape-context.json': {**{k: [] for k in ['wallRuns','connections','piers','gates','drains','apronTriangles','paintTriangles']}, 'qa': {}},
                'utilities.json': {'poles': [], 'spans': [], 'drops': [], 'qa': {}},
                'vegetation/placements.json': {'trees': []},
                'environment/streetlights.json': {'lights': [], 'qa': {}},
                'people/placements.json': {'people': [{'x': 100, 'z': 100, 'character': 'fixture'}]},
            }
            for name, value in data.items():
                p=root/name; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(json.dumps(value))
            arterial.build(root)
            return json.loads((root/'arterial/plan.json').read_text())

    def test_disconnected_crossing_is_reported_without_bridging_gap(self):
        public=box(-40,-9.75,40,9.75).difference(box(-41,-.3,41,.3))
        plan=self.generate(public)
        self.assertEqual(plan['crosswalks'], [])
        self.assertEqual(len(plan['qa']['skippedCrosswalks']), 2)
        self.assertEqual({r['reason'] for r in plan['qa']['skippedCrosswalks']}, {'disconnected-public-crossing'})
        self.assertFalse(any(l.get('kind')=='crosswalk-ramp' for l in plan['landings']))

    def test_empty_or_holed_crossing_is_not_published_as_solid(self):
        for public in [Polygon(), box(-40,-9.75,40,9.75).difference(box(15,-1,18,1)).difference(box(-18,-1,-15,1))]:
            with self.subTest(geometry=public.geom_type):
                plan=self.generate(public)
                self.assertEqual(plan['crosswalks'], [])
                self.assertEqual(len(plan['qa']['skippedCrosswalks']), 2)

    def test_connected_crossings_keep_their_public_footprints(self):
        public=box(-40,-9.75,40,9.75)
        plan=self.generate(public)
        self.assertEqual(len(plan['crosswalks']), 2)
        for crossing in plan['crosswalks']:
            self.assertTrue(public.covers(Polygon(crossing['footprint'])))
            self.assertAlmostEqual(Polygon(crossing['footprint']).area, 81.9)

if __name__ == '__main__':
    unittest.main()
