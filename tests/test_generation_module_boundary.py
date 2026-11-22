"""Canonical namespaces and real repeated generation without ambient state."""
import ast
import contextlib
import importlib
import importlib.util
import io
import json
import os
import runpy
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'work'))
from neighborhood_generation import GenerationContext,generate
from build_alley_fixture import build_fixture
from site_layout import build as build_site

NAMES=['build','infill','parking','straight_plots','piloti','ground_floors','enrich_sites','gaps','refine','access_routes','street_front','street_rules','wall_connections']
ENV_KEYS=['NEIGHBORHOOD_DATA','NEIGHBORHOOD_ORIGIN','NEIGHBORHOOD_LAYOUT_OUTPUT','NEIGHBORHOOD_LAYOUT_RADIUS']

class GenerationModuleBoundary(unittest.TestCase):
    def test_bundle_uses_only_canonical_sources(self):
        bundle=json.loads((ROOT/'outputs/domestic-test/browser-generation/sources.json').read_text())
        self.assertFalse(any('/house-plots-test/' in name for name in bundle))
        for name in NAMES+['context','pipeline','legacy']:
            source=ROOT/'work/neighborhood-generation'/f'{name}.py'
            self.assertEqual(bundle[f'/work/neighborhood-generation/{name}.py'],source.read_text())
            ast.parse(source.read_text())
        self.assertEqual(bundle['/work/neighborhood_generation/__init__.py'],(ROOT/'work/neighborhood_generation/__init__.py').read_text())
        for name in NAMES:
            wrapper=ROOT/'work/house-plots-test'/f'{name}.py'
            self.assertIn("'neighborhood-generation'",wrapper.read_text())
            self.assertLess(len(wrapper.read_text().splitlines()),12)

    def test_fresh_imports_do_not_read_scene_or_create_output(self):
        with tempfile.TemporaryDirectory() as directory:
            code="""
import os,sys,importlib,pathlib
sys.path.insert(0,sys.argv[1])
before=sys.path[:]
for name in sys.argv[3:]:importlib.import_module('neighborhood_generation.'+name)
assert before==sys.path
assert not pathlib.Path(sys.argv[2]).exists()
"""
            output=Path(directory)/'must-not-exist'
            env={**os.environ,**{key:'invalid-on-purpose' for key in ENV_KEYS},'NEIGHBORHOOD_LAYOUT_OUTPUT':str(output)}
            result=subprocess.run([sys.executable,'-c',code,str(ROOT/'work'),str(output),*NAMES],env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)

    def test_actual_a_b_a_and_failure_preserve_foreign_process_state(self):
        with tempfile.TemporaryDirectory() as directory:
            a,b,bad=[Path(directory)/name for name in ('a','b','bad')]
            foreign={name:types.ModuleType(name) for name in NAMES}
            before_path=sys.path[:]
            with patch.dict(sys.modules,foreign),patch.dict(os.environ,{key:'preserved' for key in ENV_KEYS}),contextlib.redirect_stdout(io.StringIO()):
                first=build_fixture(a)
                different=build_fixture(b,variant=2)
                self.assertNotEqual(first,different)
                with self.assertRaises(FileNotFoundError):generate(GenerationContext(bad,bad,(37,127),50),start='infill')
                again=build_fixture(a)
                self.assertEqual(first,again)
                self.assertEqual(sys.path,before_path)
                self.assertTrue(all(os.environ[key]=='preserved' for key in ENV_KEYS))
                self.assertTrue(all(sys.modules[name] is module for name,module in foreign.items()))

    def test_legacy_entry_matches_canonical_generation(self):
        with tempfile.TemporaryDirectory() as directory,contextlib.redirect_stdout(io.StringIO()):
            current=Path(directory)/'current';legacy=Path(directory)/'legacy';legacy.mkdir()
            build_fixture(current)
            shutil.copyfile(current/'plots.json',legacy/'plots.json')
            before_path=sys.path[:]
            with patch.dict(os.environ,{'NEIGHBORHOOD_LAYOUT_OUTPUT':str(legacy)}):
                runpy.run_path(str(ROOT/'work/house-plots-test/infill.py'),run_name='__main__')
            for name in ['infill-plots','frontages','piloti','ground-floors','street-infill']:
                self.assertEqual((current/f'{name}.json').read_bytes(),(legacy/f'{name}.json').read_bytes())
            self.assertEqual(sys.path,before_path)
            spec=importlib.util.spec_from_file_location('legacy_parking_fixture',ROOT/'work/house-plots-test/parking.py')
            module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
            canonical=importlib.import_module('neighborhood_generation.parking')
            self.assertEqual(module.__name__,'legacy_parking_fixture')
            self.assertIs(module.__spec__,spec)
            self.assertIs(module.plan,canonical.plan)

    def test_real_mapped_scene_repeated_generation_uses_each_context(self):
        source=ROOT/'outputs/generated-neighborhoods/f20b139277e4d2a5/data'
        with tempfile.TemporaryDirectory() as directory,contextlib.redirect_stdout(io.StringIO()):
            roots=[Path(directory)/name for name in ('a','b')]
            for root in roots:
                for name in ['buildings.geojson','corrected-base.glb','road-context.json','arterial/plan.json','location.json']:
                    target=root/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/name,target)
            origin=json.loads((roots[0]/'location.json').read_text())['origin']
            before_path=sys.path[:];before_env=dict(os.environ)
            build_site(roots[0],origin,100);first=(roots[0]/'site-layout.json').read_bytes()
            build_site(roots[1],origin,80);second=(roots[1]/'site-layout.json').read_bytes()
            self.assertNotEqual(first,second)
            build_site(roots[0],origin,100)
            self.assertEqual(first,(roots[0]/'site-layout.json').read_bytes())
            self.assertEqual(sys.path,before_path);self.assertEqual(dict(os.environ),before_env)
            # Run the old CLI in a fresh process without the test's work path.
            legacy=Path(directory)/'legacy'
            env={**os.environ,'NEIGHBORHOOD_DATA':str(roots[0]),'NEIGHBORHOOD_LAYOUT_OUTPUT':str(legacy),
                 'NEIGHBORHOOD_ORIGIN':json.dumps(origin),'NEIGHBORHOOD_LAYOUT_RADIUS':'100'}
            env.pop('PYTHONPATH',None)
            result=subprocess.run([sys.executable,str(ROOT/'work/house-plots-test/build.py')],cwd=directory,env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual((roots[0]/'site-layout/street-infill.json').read_bytes(),(legacy/'street-infill.json').read_bytes())

if __name__=='__main__':unittest.main()
