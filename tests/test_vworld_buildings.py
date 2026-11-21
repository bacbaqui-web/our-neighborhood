import io, json, sys, unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'work'))
from vworld_buildings import fetch_buildings

class BuildingsTest(unittest.TestCase):
 def test_invalid_scope_never_requests(self):
  for bbox in ([float('nan'),37,127,38],[126,37,128,38],[127,37,126,38]):
   with self.subTest(bbox=bbox),patch('urllib.request.urlopen') as fetch:
    with self.assertRaises(ValueError):fetch_buildings(bbox)
    fetch.assert_not_called()
 def test_pages_and_field_mapping(self):
  def page(number, fid, floors):
   return io.BytesIO(json.dumps({'response':{'status':'OK','page':{'total':'2'},'result':{'featureCollection':{'features':[{'id':fid,'properties':{'gro_flo_co':floors,'rd_nm':'길','buld_no':'3','bd_mgt_sn':'building'},'geometry':None}]}}}}).encode())
  with patch('pathlib.Path.exists',return_value=True),patch('pathlib.Path.read_text',return_value=json.dumps({'vworldApiKey':'private-test-key','vworldDomain':'https://example.test'})),patch('urllib.request.urlopen',side_effect=[page(1,'LT_C_SPBD.123','4'),page(2,'LT_C_SPBD.124','')]):
   result=fetch_buildings([127.02,37.62,127.025,37.625])
  self.assertEqual(len(result['features']),2)
  a,b=[f['properties'] for f in result['features']]
  self.assertEqual((a['objectid'],a['gro_flo_co'],a['street_name']),(123,4,'길'))
  self.assertFalse(a['floorsEstimated']);self.assertTrue(b['floorsEstimated'])
 def test_upstream_error_hides_key(self):
  with patch('pathlib.Path.exists',return_value=True),patch('pathlib.Path.read_text',return_value=json.dumps({'vworldApiKey':'private-test-key','vworldDomain':'https://example.test'})),patch('urllib.request.urlopen',side_effect=Exception('url?key=private-test-key')):
   with self.assertRaises(RuntimeError) as error:fetch_buildings([127.02,37.62,127.025,37.625])
  self.assertNotIn('private-test-key',str(error.exception))

if __name__=='__main__':unittest.main()
