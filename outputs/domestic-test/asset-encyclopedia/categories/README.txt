분류별 에셋 원본

house, commerce, road, vehicle, nature, prop, person의 catalog.json이 각 분류 등록의 유일한 수정 원본입니다.
상위 catalog.json과 category-metadata.js는 node scripts/build-asset-encyclopedia.mjs로 생성합니다. --check는 생성 결과 일치를 확인합니다.
새 고정 ID는 해당 분류에 추가합니다. inventory.json은 마이그레이션 시점에 이미 사용된 ID의 삭제 방지 목록입니다.
기존 ID의 taxonomy/assembly/ownership 및 원본 필드를 유지합니다. placement/integration은 조립 규칙이 소유합니다.
revision은 과거 원본 경로를 보존하면서 현재 승인된 제작본을 선택하는 정적 에셋 기록입니다. registryHidden은 이미 통합된 별칭·교체 후보의 중복 표시 방지입니다.
분류별 담당자는 자기 catalog.json과 분류 내부 새 모델만 수정합니다. ownership.sharedDependencies의 기존 공유 생성기는 관련 담당자와 조율합니다.
ownership.sources는 기존 모델의 실제 호환 경로입니다. 바이너리 파일은 이동하지 않았습니다. 미리보기·저장 지도와 공유 import를 보존하기 위한 경로입니다.
정보가 없는 시대/색상/재료는 빈 배열, 치수는 null입니다. 이름에 나타난 재료·색상과 생성기에 기록된 기본 치수만 옮겼습니다. 기본 치수는 실측치가 아닙니다.
완성된 조합은 complete, 예시 장면은 reference, 보관 모델은 legacy로 구분합니다. 조립 가능 여부·발생 확률·조건은 동네 assembly-rules에서 결정합니다.
