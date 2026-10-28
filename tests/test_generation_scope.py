import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from generation_scope import validate_radius
class RadiusTest(unittest.TestCase):
 def test_steps(self):
  for n in range(50,301,50):self.assertEqual(validate_radius(n),n)
 def test_reject_bad_requests(self):
  for n in [0,49,75,301,1000,True,'50',None]:
   with self.subTest(n=n),self.assertRaises(ValueError):validate_radius(n)
