import sys,unittest,tempfile,json
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from kakao_terrain import Terrain,LocalFlatTerrain,flat_correction,load_terrain,DOBONG_CENTER
class LocalGround(unittest.TestCase):
 def test_scope_surface_and_transition(self):
  correction=flat_correction({'origin':DOBONG_CENTER})
  with patch.object(Terrain,'absolute',lambda self,x,z:50+10/(1+(x*x+z*z)/2500)):
   terrain=LocalFlatTerrain(*DOBONG_CENTER,correction)
   self.assertEqual(terrain.mesh_height(50,50),0)
   self.assertEqual(terrain.mesh_height(-50,-50),0)
   self.assertAlmostEqual(terrain.absolute(400,0),Terrain.absolute(terrain,400,0))
   self.assertLess(abs(terrain.absolute(180.001,0)-terrain.absolute(179.999,0)),.001)
   with tempfile.TemporaryDirectory() as tmp:
    Path(tmp,'terrain-correction.json').write_text(json.dumps(correction))
    restored=load_terrain(tmp,{'origin':DOBONG_CENTER})
    self.assertEqual(restored.mesh_height(25,25),terrain.mesh_height(25,25))
  self.assertIsNone(flat_correction({'origin':[37.626469,127.015677]}))
if __name__=='__main__':unittest.main()
