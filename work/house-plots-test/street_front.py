"""Stable final generation entry."""
from street_rules import build as generate

def build():
 generate()
 import os
 if not os.environ.get('NEIGHBORHOOD_LAYOUT_OUTPUT'):
  from rule_evidence import build as evidence
  evidence()
if __name__=='__main__':build()
