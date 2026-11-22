# Task1 — 오래된 백과 검사 두 개 원인과 최소 보완안

## 재현 결과

Node 24.13.0에서 두 검사를 수정 없이 재실행했습니다.
- asset-encyclopedia.mjs: 8행 전체 GLB 탐색에서 approved-road/barrier-approved-v1.glb를 ‘missing individual model’로 판정합니다.
- asset-encyclopedia-lines.mjs: 11행 remade 전체 개수 기대18/실제55로 실패합니다.

실제 에셋이나 curation 오류라고 단정할 근거는 없습니다. 검사들이 이전 단일 catalog.file 및 소품18개 교체 시절 계약에 묶여 있습니다.

## 현재 계약과 차이

현재 categories/*/catalog.json이 정식 원본이고 build-asset-encyclopedia가 catalog.json과 category-metadata.js를 생성합니다. raw1045개와 registry1023개는 숨긴 prototype/alias22개 차이입니다. registry는 revision을 적용하고 고정ID/alias/deletion을 해석합니다. ownership.sources는 원본과 수정 모델을 함께 소유하고 sourceAvailability는 local-archive를 구분합니다. publication-references는 실제 resolve 가능한 모델과 public-required source만 공개 명세에 요구합니다.

첫 실패 barrier는 누락된 에셋이 아닙니다. registry.resolve('road:a72')가 approved-road/barrier-approved-v1.glb를 현재 모델로 반환하며 원래 roadview50/a72.glb와 함께 ownership에 등록되어 있습니다. 옛 검사는 raw file 하나만 수집하므로 revision/ownership의 현재 모델을 놓칩니다. 첫 실패를 넘겨도 part 개수가 현재90인데 기대84라 또 실패합니다(legacy212/tree10은 현재도 일치).

현재 registry의 file/ownership만으로 전체 GLB를 조사하면 15개가 남습니다. 이 중 hidden raw 항목8개는 대표/후보 모델 보존본입니다. 나머지7개는 approved-road의 이전 bus v1/v2/v3, parking v1/v2, speed v1/v2이며 현재 후속 버전으로 교체되어 보존 중입니다. 즉 디스크 전체가 현재 UI 목록과 같다는 전제가 틀렸습니다. 그렇다고 전체 탐색을 없애면 새로운 미등록 모델 누락을 놓칩니다.

applyRemakes는 props18개뿐 아니라 approvedRoad10개, approvedBuildingProfiles23개, grade1Assets8개를 처리합니다. 우선순위는 building → approvedRoad → props이며 ID 중복 때문에 총합 단순 덧셈과도 다릅니다. props 대상 중 barrier/bus-stop/manhole/cone4개는 승인 모델이 우선하므로 old props 삼각형과 현재 값이 다른 것이 맞습니다. alias는 canonicalId로 비교해야 합니다. CATALOG_LINES의 화면 설정 상수 검사는 여전히 유효합니다.

## 제안하는 최소 수정 범위

원본 자산·curation·registry·모델 정책을 바꾸지 않고 두 테스트와 필요하면 tests 내 작은 검증 helper만 수정합니다. 이후 부모 승인 때 CI에 이 두 검사를 포함합니다.

1. asset-encyclopedia: raw ID 중복/필수 표시 필드/원본 보존 검사를 유지합니다. 현재 모델은 createRegistry.resolve 결과, 보존 모델은 raw.file/ownership.sources/revision.file로 수집합니다. local-archive는 파일 부재를 명시적으로 허용하고 현재 공개 모델은 publication-files 포함과 파일 존재를 검사합니다. 전체 GLB 탐색은 유지하되 위 등록 모델과 정확한 과거 승인버전7개만 구분합니다. 이7개는 테스트의 명시적 역사 목록으로 경로·후속 current 승인 모델을 함께 기록하고 존재를 검증합니다(모든 *-vN을 허용하는 regex 예외 금지). 새 미등록 GLB는 계속 실패합니다. 212/84/10 같은 개수 대신 category inventory.ids와 각 유형 ID 집합/분류별 원본 및 aggregate 합치, 생성물 --check로 누락·중복을 검사합니다. 같은 파일을 공유하는 alias는 독립 모델 중복으로 잘못 판정하지 않고 정식 canonical ID 충돌을 검사합니다.
2. asset-encyclopedia-lines: raw 불변, candidate 제거, alias 해석, 원본 파일 보존, 고정 선 설정 검사는 유지합니다. expected remade ID 집합은 승인 building/road/props/grade1 명세와 canonical ID로 독립 구성하고 결과와 집합 일치를 확인합니다. 각 집합의 file/triangles/reference/originalFile을 명세에서 검증하되 승인 road가 props보다 우선하는4개를 명시적 분기 계약으로 검사합니다. 숫자18을55로 바꾸거나 검사 전체를 제거하지 않습니다. 실제 app의 registry 결과와 applyRemakes 호환 결과도 같은 교체 계약인지 확인합니다.

## 회귀 실패 주입

검증 함수가 입력 복사본과 경로 존재/공개 목록을 받게 하여 실제 원본 파일을 바꾸지 않고 다음 실패를 확인합니다.
- 중복 ID, category stable ID 하나 제거, revision 모델 파일/ownership 연결 누락, 미등록 GLB 추가, 공개 필수 모델 manifest 누락 → 실패.
- local-archive 없음은 허용하되 public-required 없음은 실패. 명시하지 않은 과거 버전 비슷한 이름은 실패.
- remade 항목 하나 삭제/추가, 승인 road를 옛 prop 파일/삼각형으로 되돌림, 승인 reference 삭제, candidate 재노출, 원본 메타데이터/원본 배열 변형 → 실패.
- CATALOG_LINES 값 변경 → 기존 고정 외관 검사 실패 유지.

현재 조사 단계에서는 코드·테스트·index·저장 데이터·자산을 수정하지 않았습니다. 이 분석 보고서만 작성했고 구현 승인을 기다립니다.
