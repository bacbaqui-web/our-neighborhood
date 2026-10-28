"""Validated, bounded half-width in metres; part of every generated cache identity."""
def validate_radius(value=150):
    if isinstance(value,bool) or not isinstance(value,(int,float)) or value not in range(50,301,50):
        raise ValueError('상세 범위는 50~300m 사이에서 50m 단위로 입력해 주세요.')
    return int(value)
