import math
import sys
import unittest
from pathlib import Path

from shapely.geometry import LineString, Point, Polygon, box, mapping

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'work'))
from grade1_poles import apply_alley_poles, plan_poles


class GradeOnePolesTest(unittest.TestCase):
    def test_same_edge_and_preferred_spacing_clear_of_access(self):
        road = box(0, -2, 125, 2)
        center = LineString([(0, 0), (125, 0)])
        access = box(26, 2, 42, 5)
        poles, links = plan_poles([center], road, Polygon(), access, road.buffer(2))
        self.assertGreaterEqual(len(links), 3)
        self.assertEqual(len(links), len(poles) - 1)
        self.assertEqual(len({p['point'][1] > 0 for p in poles}), 1)
        for pole in poles:
            self.assertFalse(Point(pole['point']).buffer(.22).intersects(road.union(access)))
        for a, b in links:
            self.assertLess(abs(math.dist(poles[a]['point'], poles[b]['point']) - 32), 6)

    def test_building_prevents_shortcut_and_isolated_poles_are_removed(self):
        road = box(0, -2, 94, 2)
        center = LineString([(0, 0), (94, 0)])
        building = box(43, 2.1, 51, 5)
        blocked = building.union(box(0, -4, 94, -2))
        poles, links = plan_poles([center], road, building, blocked, road.buffer(2))
        self.assertGreater(len(links), 0)
        self.assertEqual({i for link in links for i in link}, set(range(len(poles))))
        for a, b in links:
            self.assertFalse(LineString([poles[a]['point'], poles[b]['point']]).intersects(building))
            self.assertLessEqual(math.dist(poles[a]['point'], poles[b]['point']), 45)

    def test_two_close_alley_segments_do_not_join_across_block(self):
        center = LineString([(0, 0), (100, 0)])
        parallel = LineString([(0, 7), (100, 7)])
        road = center.buffer(2).union(parallel.buffer(2))
        poles, links = plan_poles([center, parallel], road, Polygon(), Polygon(), road.buffer(2))
        self.assertGreaterEqual(len(links), 3)
        self.assertTrue(all(poles[a]['point'][1] == poles[b]['point'][1] for a, b in links))


    def test_only_grade_one_network_is_replaced(self):
        alley = LineString([(0, 0), (110, 0)])
        avenue = LineString([(0, 20), (110, 20)])
        road = alley.buffer(2).union(avenue.buffer(4))
        poles = [{'point': [p, z]} for z in (2.8, 24.9) for p in (4, 35)]
        placement = {
            'plots': {'buildings': [
                {'id': 1, 'plot': mapping(box(0, -6, 110, 6)), 'building': mapping(box(0, 4, 110, 5))}
            ]},
            'infill': {'poles': poles, 'poleLinks': [(0, 1), (2, 3)], 'qa': {}},
        }
        apply_alley_poles(placement, [
            {'grade': 1, 'geometry': mapping(alley)},
            {'grade': 2, 'geometry': mapping(avenue)},
        ], {'asphalt': mapping(road)}, None)
        result = placement['infill']
        self.assertEqual(result['poles'][:2], poles[2:])
        self.assertEqual(result['poleLinks'][0], (0, 1))
        self.assertGreater(result['qa']['grade1Spans'], 0)
        self.assertTrue(all(p['grade'] == 1 for p in result['poles'][2:]))
        self.assertTrue(result['poles'][2]['lamp'])
        self.assertTrue(result['poles'][-1]['lamp'])


if __name__ == '__main__':
    unittest.main()
