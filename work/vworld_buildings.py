"""Bounded VWorld building queries. Keys stay in the local server settings."""
import json
import math
import re
import urllib.parse
import urllib.request
from pathlib import Path

SOURCE = 'VWorld / 도로명주소 건물 (LT_C_SPBD)'

def fetch_buildings(bbox):
    if len(bbox) != 4 or not all(math.isfinite(x) for x in bbox):
        raise ValueError('건물 조회 범위가 올바르지 않습니다.')
    west, south, east, north = bbox
    if not (124 < west < east < 132 and 33 < south < north < 39.5 and east-west <= .02 and north-south <= .02):
        raise ValueError('국내의 작은 범위만 조회할 수 있습니다.')
    settings_path = Path(__file__).resolve().parents[1] / '.local-settings.json'
    settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
    key = settings.get('vworldApiKey')
    if not key:
        raise RuntimeError('브이월드 인증키가 설정되지 않았습니다.')
    features = []; seen = set()
    for page in range(1, 7):
        params = dict(service='data', version='2.0', request='GetFeature', data='LT_C_SPBD',
                      geomFilter='BOX('+','.join(map(str,bbox))+')', crs='EPSG:4326', format='json',
                      size=1000, page=page, key=key, domain=settings['vworldDomain'])
        try:
            with urllib.request.urlopen('https://api.vworld.kr/req/data?'+urllib.parse.urlencode(params), timeout=25) as response:
                payload = json.load(response)['response']
        except Exception:
            # Upstream exceptions may contain the URL and API key.
            raise RuntimeError('브이월드 건물 자료를 받지 못했습니다. 연결 상태를 확인해 주세요.') from None
        if payload.get('status') == 'NOT_FOUND':
            if page != 1: raise RuntimeError('건물 자료 일부를 받지 못했습니다. 다시 시도해 주세요.')
            return dict(type='FeatureCollection', features=[], source=SOURCE)
        if payload.get('status') != 'OK':
            raise RuntimeError('브이월드가 건물 조회를 거절했습니다. 인증키 상태와 이용 한도를 확인해 주세요.')
        batch = payload.get('result', {}).get('featureCollection', {}).get('features')
        if not isinstance(batch, list):
            raise RuntimeError('브이월드 건물 응답 형식이 올바르지 않습니다.')
        for feature in batch:
            fid = feature.get('id', '')
            if not re.fullmatch(r'LT_C_SPBD\.\d+', fid):
                raise RuntimeError('건물 식별번호를 확인하지 못했습니다.')
            if fid in seen: continue
            seen.add(fid)
            props = feature.get('properties', {})
            try: floors = int(props.get('gro_flo_co') or 0)
            except (TypeError, ValueError): floors = 0
            props.update(objectid=int(fid.split('.')[1]), building_id=props.get('bd_mgt_sn',''),
                         building_name=props.get('buld_nm',''), street_name=props.get('rd_nm',''),
                         house_number=props.get('buld_no',''), gro_flo_co=max(1,floors),
                         floorsEstimated=floors <= 0, und_flo_co=0, source=SOURCE)
            feature['properties'] = props
            features.append(feature)
        if page >= int(payload['page']['total']):
            return dict(type='FeatureCollection', features=features, source=SOURCE)
        if not batch: break
    raise RuntimeError('건물 조회 범위가 너무 큽니다. 범위를 줄여 주세요.')
