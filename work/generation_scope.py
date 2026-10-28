"""Validated, bounded half-width in metres; part of every generated cache identity."""
def validate_radius(value=150):
    if isinstance(value,bool) or not isinstance(value,(int,float)) or value not in range(50,301,50):
        raise ValueError('상세 범위는 50~300m 사이에서 50m 단위로 입력해 주세요.')
    return int(value)


def validate_center(value):
    if value is None:return None
    import math
    if not isinstance(value,list) or len(value)!=2 or any(isinstance(n,bool) or not isinstance(n,(int,float)) or not math.isfinite(n) for n in value):
        raise ValueError('지도에서 생성할 지점을 다시 선택해 주세요.')
    lat,lon=value
    if not (33<lat<39.5 and 124<lon<132):raise ValueError('현재는 국내 지역만 생성할 수 있습니다.')
    return [float(lat),float(lon)]
