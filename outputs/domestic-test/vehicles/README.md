# 우리동네 차량 에셋 목록

목록 데이터: dist/vehicle-catalog.json
미리보기: dist/vehicles.html
모델·텍스처: dist/vehicles/<고정-ID>/model.glb, texture.png

2026-10-28: 시내버스 파랑·초록·빨강, 포터2 흰색, 기존 아반떼 CN7 v92 등록. 3차종 5버전. 버스는 모두 같은 차체의 색상 변형이며 빨강을 광역버스 전용 모델로 표시하지 않습니다.

## 제작 기준

Tripo GLB → 원본 차종 특징·비율·곡면·UV 보존 → 동네 톤 텍스처 → 외부선 ON, 내부선 OFF → 비교 확인 → 목록 등록. 임의로 다른 형상의 모델을 새로 만들지 않습니다. 형상 보정은 국소적이고 검증 가능하게 수행합니다. 원본은 보존합니다.

새 차량은 안정된 id와 family, name, variant, category, color, triangles, source, status, model, note 필드를 items에 추가합니다. 미리보기는 목록을 읽어 자동 생성되므로 HTML에 카드 추가가 필요 없습니다. 계획 항목은 planned에 별도로 기록하며 실제 제작 완료로 표시하지 않습니다.

기본 모델 단위·실차 치수가 아직 정규화되지 않았습니다. 미리보기는 긴 축을 4.8로 맞추므로 표시 크기를 실제 배치 크기로 사용하지 마세요. 에셋 등록과 도로 자동 배치는 별도입니다.

색상 버전: built-in image_gen으로 파랑 텍스처의 초록/빨강 버전을 만든 뒤, 원본의 파란 도장 영역 마스크 안에서만 반영했습니다. 마스크 밖 텍스처 픽셀은 원본과 동일합니다. 버스 세 모델의 원본 geometry/normal/UV/index는 동일합니다.

프롬프트: Exact texture recolor edit. Preserve packed UV layout, all windows, rims, tires, lamps, aircon and plate. Change only blue body paint to medium leaf green #4c9d39 or muted red #bd3838. Keep original line detail and avoid new gradients, reflections or details.

로컬 원본 프로젝트의 outputs/domestic-test/에도 같은 목록·모델과 링크를 추가했습니다. 이 프로젝트는 별도 Sites 주소로 목록을 제공합니다. 우리동네 기존 GitHub Pages 배포는 원본 저장소 Git 접근 시간 초과 때문에 이번 변경에 포함되지 않았습니다.
