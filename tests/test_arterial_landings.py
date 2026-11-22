"""Exit thresholds preserve source facilities and never bridge missing public space."""
import copy
import sys
import unittest
from unittest.mock import patch
from pathlib import Path
from shapely.geometry import Polygon, box

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'work'))
from arterial_crossings import build_exit_landings


class ExitLandings(unittest.TestCase):
    def setUp(self):
        self.exits = [{'id': 'exit-1', 't': 0, 'd': 0, 'length': 8.6,
                       'width': 2.5, 'position': [0, .14, 0],
                       'manual': {'name': 'preserved'}, 'footprint': [[-4.3,-1.25],[4.3,-1.25],[4.3,1.25],[-4.3,1.25]]}]

    def generate(self, sidewalk, height=lambda x,z:0):
        original = copy.deepcopy(self.exits)
        result = build_exit_landings(exits=self.exits, sidewalks=sidewalk,
            rect=lambda t,d,L,W:box(t-L/2,d-W/2,t+L/2,d+W/2), height=height)
        self.assertEqual(self.exits, original, 'Geometry planning must not mutate source exits')
        return result

    def test_empty_disconnected_holed_and_too_small_pads_preserve_exit(self):
        full = box(-20,-20,20,20)
        cases = [
            (Polygon(), 'empty-exit-landing'),
            (full.difference(box(-5,-.1,-4,.1)), 'disconnected-exit-landing'),
            (full.difference(box(-4.8,-.1,-4.6,.1)), 'holed-exit-landing'),
            (box(-4.8,-.1,-4.6,.1), 'insufficient-exit-landing-area'),
        ]
        for sidewalk, reason in cases:
            with self.subTest(reason=reason):
                result = self.generate(sidewalk)
                self.assertEqual(result['exits'], self.exits)
                self.assertEqual(result['landings'], [])
                self.assertEqual(result['triangles'], [])
                self.assertTrue(result['area'].is_empty)
                self.assertEqual(result['skipped'][0]['id'], 'exit-1')
                self.assertEqual(result['skipped'][0]['reason'], reason)
                self.assertIn('geometryType', result['skipped'][0])

    def test_flat_threshold_keeps_footprint_and_surface_area(self):
        result = self.generate(box(-20,-20,20,20))
        self.assertEqual(result['skipped'], [])
        self.assertEqual(len(result['landings']), 1)
        self.assertAlmostEqual(result['exits'][0]['position'][1], .145)
        self.assertAlmostEqual(Polygon(result['exits'][0]['landingFootprint']).area, .7*(2.5-.32))
        self.assertAlmostEqual(result['area'].area, 1.5*(2.5+.9))
        self.assertTrue(all(abs(y-.145)<1e-12 for y in result['triangles'][1::3]))
        self.assertEqual(result['exits'][0]['manual'], self.exits[0]['manual'])

    def test_compound_slope_is_level_only_on_threshold_and_joins_shared_edges(self):
        height = lambda x,z:.08*x+.03*z
        result = self.generate(box(-20,-20,20,20), height)
        pad = Polygon(result['exits'][0]['landingFootprint'])
        entry = result['exits'][0]['entryHeight']
        self.assertAlmostEqual(entry, max(height(x,z) for x,z in pad.exterior.coords)+.145)
        from shapely.geometry import Point
        vertices = {}
        for i in range(0, len(result['triangles']), 3):
            x,y,z = result['triangles'][i:i+3]
            expected = entry if pad.distance(Point(x,z))<1e-6 else height(x,z)+.145
            self.assertAlmostEqual(y, expected)
            key = (round(x,8),round(z,8))
            if key in vertices:self.assertAlmostEqual(y, vertices[key])
            vertices[key] = y
        self.assertGreater(len(set(round(y,8) for y in vertices.values())), 1)

    def test_full_plan_keeps_mapped_exit_and_reports_disconnected_threshold(self):
        from test_arterial_crosswalks import arterial, CrosswalkGeometry
        exit_poi = {'id':'fixture-exit','place_name':'Fixture 출구','category_name':'지하철출구',
                    'place_url':'fixture','x':126.98,'y':37.57-8.25/110000}
        def kakao(kind, params):
            return {'documents':[{'place_name':'Fixture 역'}] if kind=='category' else [exit_poi]}
        public = box(-40,-9.75,40,9.75).difference(box(-5.1,8.2,-4.3,8.3))
        with patch.object(arterial, 'kakao', kakao):
            result = CrosswalkGeometry().generate(public)
        self.assertEqual([e['id'] for e in result['exits']], ['fixture-exit'])
        self.assertEqual(result['qa']['subwayExits'], 1)
        self.assertEqual(result['qa']['skippedLandings'][0]['id'], 'fixture-exit')
        self.assertEqual(result['qa']['skippedLandings'][0]['reason'], 'disconnected-exit-landing')
        self.assertFalse(any(l['id']=='fixture-exit' for l in result['landings']))


if __name__ == '__main__':
    unittest.main()
