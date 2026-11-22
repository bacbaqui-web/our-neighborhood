"""Production bundle boundaries and repeated scene generation state isolation."""
import ast
import importlib.util
import json
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['build', 'infill', 'parking', 'straight_plots', 'piloti', 'ground_floors',
         'enrich_sites', 'gaps', 'refine', 'access_routes', 'street_front',
         'street_rules', 'wall_connections']

class GenerationModuleBoundary(unittest.TestCase):
    def test_bundle_uses_only_canonical_sources(self):
        bundle = json.loads((ROOT/'outputs/domestic-test/browser-generation/sources.json').read_text())
        self.assertFalse(any('/house-plots-test/' in name for name in bundle))
        for name in NAMES:
            source = ROOT/'work/neighborhood-generation'/f'{name}.py'
            self.assertEqual(bundle[f'/work/neighborhood-generation/{name}.py'], source.read_text())
            ast.parse(source.read_text())
            wrapper = ROOT/'work/house-plots-test'/f'{name}.py'
            self.assertIn("'neighborhood-generation'", wrapper.read_text())
            self.assertLess(len(wrapper.read_text().splitlines()), 12)
        self.assertIn("parent/'neighborhood-generation'", bundle['/work/site_layout.py'])

    def test_legacy_import_preserves_name_spec_and_canonical_file(self):
        # Import a side-effect-free geometry helper using lightweight module placeholders.
        # This test checks wrapper execution semantics, not geometric operations.
        placeholders = {}
        for name, exports in {'shapely': [], 'shapely.geometry': ['box', 'Point'], 'shapely.ops': ['unary_union'], 'shapely.affinity': ['rotate']}.items():
            stub = types.ModuleType(name)
            for export in exports:
                setattr(stub, export, lambda *args: None)
            placeholders[name] = stub
        old_path = sys.path[:]
        try:
            with patch.dict(sys.modules, placeholders):
                spec = importlib.util.spec_from_file_location('legacy_parking_fixture', ROOT/'work/house-plots-test/parking.py')
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                self.assertEqual(module.__name__, 'legacy_parking_fixture')
                self.assertIs(module.__spec__, spec)
                self.assertEqual(Path(module.__file__), ROOT/'work/neighborhood-generation/parking.py')
                self.assertIs(module.plan.__globals__, module.__dict__)
                self.assertEqual(module.plan.__module__, 'legacy_parking_fixture')
        finally:
            sys.path[:] = old_path

    def test_repeated_calls_clear_modules_and_restore_environment(self):
        spec = importlib.util.spec_from_file_location('site_layout_under_test', ROOT/'work/site_layout.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        calls = []
        def run(path, run_name):
            self.assertEqual(Path(path), ROOT/'work/neighborhood-generation/build.py')
            self.assertEqual(run_name, '__main__')
            self.assertEqual(Path(sys.path[0]), ROOT/'work/neighborhood-generation')
            self.assertTrue(all(name not in sys.modules for name in NAMES))
            root = Path(os.environ['NEIGHBORHOOD_DATA'])
            output = Path(os.environ['NEIGHBORHOOD_LAYOUT_OUTPUT'])
            calls.append(str(root))
            for file in ['infill-plots', 'frontages', 'piloti', 'ground-floors', 'street-infill']:
                (output/f'{file}.json').write_text(json.dumps({'qa': {'scene': str(root)}}))
            for name in NAMES:
                sys.modules[name] = types.ModuleType(name)
        fake_decorator = types.ModuleType('alley_housing')
        fake_decorator.decorate = lambda package: None
        old_path = sys.path[:]
        keys = ['NEIGHBORHOOD_DATA', 'NEIGHBORHOOD_ORIGIN', 'NEIGHBORHOOD_LAYOUT_OUTPUT', 'NEIGHBORHOOD_LAYOUT_RADIUS']
        with tempfile.TemporaryDirectory() as directory, patch.dict(sys.modules, {'alley_housing': fake_decorator}), patch.dict(os.environ, {key: 'preserved' for key in keys}):
            with patch.object(module.runpy, 'run_path', side_effect=run), patch.object(module, 'align_road_paint', return_value=None), patch.object(module, 'protect_public_surfaces', return_value=None):
                for index in range(2):
                    root = Path(directory)/str(index)
                    root.mkdir()
                    (root/'buildings.geojson').write_text('{"features":[{}]}')
                    result = module.build(root, [37.6, 127.0], 50)
                    self.assertEqual(result, {'scene': str(root.resolve())})
                    self.assertTrue(all(os.environ[key] == 'preserved' for key in keys))
                    self.assertEqual(sys.path, old_path)
            self.assertEqual(len(set(calls)), 2)
            with patch.object(module.runpy, 'run_path', side_effect=RuntimeError('fixture failure')):
                with self.assertRaisesRegex(RuntimeError, 'fixture failure'):
                    module.build(root, [37.6, 127.0], 50)
            self.assertTrue(all(os.environ[key] == 'preserved' for key in keys))
            self.assertEqual(sys.path, old_path)

if __name__ == '__main__':
    unittest.main()
