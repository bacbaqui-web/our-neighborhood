"""Explicit per-scene generation inputs, with no ambient process settings."""
from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class GenerationContext:
 source: Path
 output: Path
 origin: tuple
 radius: float

 def __post_init__(self):
  object.__setattr__(self,'source',Path(self.source))
  object.__setattr__(self,'output',Path(self.output))
  # Keep serialized origins compatible with the existing JSON array contract.
  object.__setattr__(self,'origin',tuple(self.origin))
  object.__setattr__(self,'radius',float(self.radius))
