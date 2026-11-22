"""Environment and old command-line names terminate at this compatibility boundary."""
from pathlib import Path
import importlib.util
import importlib
import sys

ROOT=Path(__file__).resolve().parents[2]

def ensure_package():
 name='neighborhood_generation'
 if name not in sys.modules:
  source=ROOT/'work/neighborhood_generation/__init__.py'
  spec=importlib.util.spec_from_file_location(name,source,submodule_search_locations=[str(source.parent)])
  module=importlib.util.module_from_spec(spec);sys.modules[name]=module
  try:spec.loader.exec_module(module)
  except BaseException:
   del sys.modules[name]
   raise
 return sys.modules[name]

def context_from_environment():
 import json,os
 package=ensure_package()
 return package.GenerationContext(
  Path(os.environ.get('NEIGHBORHOOD_DATA',str(ROOT/'outputs/domestic-test'))),
  Path(os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT',str(ROOT/'outputs/domestic-test/house-plots-test'))),
  json.loads(os.environ.get('NEIGHBORHOOD_ORIGIN','[37.626469,127.015677]')),
  float(os.environ.get('NEIGHBORHOOD_LAYOUT_RADIUS','150')))

def run_cli(stage,context=None):
 explicit=context is not None
 package=ensure_package();context=context or context_from_environment()
 result=package.generate(context,start=stage)
 # Keep the optional old local report out of production generation and imports.
 import os
 if not explicit and not os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT'):
  import subprocess
  subprocess.run([sys.executable,str(ROOT/'work/house-plots-test/rule_evidence.py')],check=True)
 return result

def export_legacy(stage,namespace):
 ensure_package()
 module=importlib.import_module('neighborhood_generation.'+stage)
 namespace.update({key:value for key,value in vars(module).items() if not key.startswith('_')})
 namespace['__file__']=module.__file__
 if hasattr(module,'build'):
  namespace['build']=lambda context=None:run_cli(stage,context)
  if namespace['__name__']=='__main__':run_cli(stage)
