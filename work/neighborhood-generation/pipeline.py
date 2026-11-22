"""Explicit stage order; each stage owns only its existing output files."""
from importlib import import_module

STAGES=('build','infill','piloti','ground_floors','enrich_sites','gaps','refine','street_front')

def run(context,start='build'):
 # street_rules is the stable implementation behind the last compatibility name.
 if start=='street_rules':start='street_front'
 if start not in STAGES:raise ValueError(f'Unknown generation stage: {start}')
 context.output.mkdir(parents=True,exist_ok=True)
 results={}
 for name in STAGES[STAGES.index(start):]:
  results[name]=import_module('.'+name,__package__).build(context)
 return results
