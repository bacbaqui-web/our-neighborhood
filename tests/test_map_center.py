import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from generation_scope import validate_center
class MapCenterTests(unittest.TestCase):
 def test_selected_point_preserved(self):
  self.assertEqual(validate_center([37.626469,127.015677]),[37.626469,127.015677])
 def test_invalid_points(self):
  for point in [[True,127],[float('nan'),127],[37],['37',127],[0,0]]:
   with self.subTest(point=point), self.assertRaises(ValueError):validate_center(point)
 def test_address_compatibility(self):
  self.assertIsNone(validate_center(None))
if __name__=='__main__':unittest.main()
