# 우리동네와 에셋백과의 실행 경계

현재 작업 기준은 기준 폴더와 origin/main이며 제작·배치 규칙은 `project-guidelines.txt`를 따릅니다. 이 문서는 구현 위치와 의존 방향을 설명합니다.

| 영역 | 정식 구현 | 책임 |
| --- | --- | --- |
| 브라우저 시작 | outputs/domestic-test/start.html | 지도에서 길 위 눈높이 기준점 선택 |
| 지도 분석·동네 생성 | work/browser-generation/entry.py, site_layout.py | 가시 영역 분석, 동네 구성, 수동 수정 보존 |
| 정식 공간 생성 | work/neighborhood-generation/의 13개 Python 모듈 | 대지·도로·건물·주차·공간 배치 계산 |
| 브라우저 Python 묶음 | work/browser-generation/pack.py → outputs/domestic-test/browser-generation/sources.json | 허용한 정식 소스만 패키징 |
| 브라우저 JavaScript 묶음 | work/browser-generation/prepare-scene.js → scripts/build-browser-generation.mjs → outputs/domestic-test/browser-generation/prepare-scene.js | 고정 버전 builder로 원본 의존성을 묶고 최신성 검사 |
| 에셋 등록부 | outputs/domestic-test/asset-encyclopedia/registry.js | 고정 ID·분류·모델 출처·승인 상태 제공 |
| 분류별 모델 | asset-encyclopedia/categories/*/models.js | house, commerce, nature, vehicle, prop, road, person 모델 제공 |
| 배치/조립 | assembly-rules, details.js, 각 placement 모듈 | 지도·규칙에 따라 에셋 선택·배치·조립 |
| 백과 조립 예시 | asset-encyclopedia/preview-assembly.js | UI용 건물/거리 예시 조립기를 provider에 명시적으로 주입 |

모델 provider는 동네의 지도·가시성·배치 구현을 가져오지 않습니다. 공통 렌더링·조명·순수 기하 함수는 공유합니다. `model-source-ownership.json`은 분류 provider에서 도달하는 기존 모델 소스의 소유권을 명시합니다. 바이너리와 기존 공개 URL은 유지합니다. person의 이미지 에셋은 백과 UI 이미지 경로에서 처리합니다.

house의 실제 외벽·창문/문 형상 및 텍스처는 분류 폴더에 있습니다. root `korean-facades.js`와 `facade-textures.js`는 기존 URL을 위한 재수출입니다. nature는 나무 크기·형상을 소유하며 root `tree-planting.js`는 배치 정책, `hybrid-tree.js`는 동네 가시성 필터 어댑터입니다. 건물/시설 preview의 옛 URL도 주입을 연결하는 호환 어댑터입니다.

`work/house-plots-test`의 정식 13개 파일은 새 구현에 위임하는 호환 진입점입니다. 같은 폴더의 과거 실험과 증거 파일은 정식 브라우저 생성에 자동 포함되지 않습니다. 원본 모델·승인 자료·수동 저장 동네는 캐시로 취급하지 않습니다.

### Python 생성 호출과 상태

`work/neighborhood_generation/__init__.py`가 표준 Python 패키지 이름을 제공합니다. 패키지 내부 검색 경로만 기존 `neighborhood-generation`, 공통 기하 및 work 원본에 연결하며 전역 `sys.path`를 수정하거나 `build`·`infill` 같은 다른 모듈 캐시를 삭제하지 않습니다. 기존 13개 원본 파일은 다시 이동하지 않았습니다.

`GenerationContext(source, output, origin, radius)`가 동네별 입력·출력 위치와 기준을 전달합니다. `generate(context, start='build')`는 대지 → infill → piloti → ground_floors → enrich_sites → gaps → refine → street_front를 명시적으로 실행합니다. 각 단계의 `build(context)`는 자기 단계만 실행하고 검사 요약을 반환합니다. 중간 JSON 형식과 파일 이름은 유지합니다. 난수 생성기·누적 목록·읽은 장면은 호출 내부에 있으므로 모듈을 불러오기만 해서는 장면을 읽거나 만들지 않습니다.

환경변수 해석과 과거 단계부터의 연쇄 실행은 `legacy.py`가 담당합니다. 기존 house-plots-test 진입점 및 정식 파일의 직접 CLI 호출은 이 어댑터에 위임합니다. 선택 출력 경로가 없는 옛 로컬 CLI에서만 기존 rule_evidence 보고서를 별도 프로세스로 생성하며, 정식 생성과 단순 import에는 포함하지 않습니다. 실제 작은 골목 fixture와 저장된 지도 자료를 사용한 A→B→A 반복·실패 후 복구·옛 CLI 호환 검사는 `tests/test_generation_module_boundary.py`에 있습니다.

## 공개 파일과 검사

### 큰길과 교차로 기하의 책임

`work/arterial_plan.py`는 지도·지형 취득, 도로·보도 확정, 시설 배치와 파일 저장을 조율합니다. `work/arterial_crossings.py`는 확정된 면과 좌표/높이 함수만 받아 출입구 접근면 및 연속 횡단면·경사판을 반환합니다. 파일·환경변수에 접근하거나 입력 출입구를 수정하지 않습니다. 결과에는 기하, 보도 예약면, 생략 이유가 포함됩니다. 단일 외곽선으로 표현할 수 없는 끊긴 면이나 구멍을 최대 조각 선택·구멍 메우기로 숨기지 않습니다.

출입구 접근면을 만들 수 없어도 원본 시설은 `exits`에 유지하며 `qa.skippedLandings`에 ID·사유·도형 종류를 남깁니다. 이 필드는 생략이 있을 때 추가됩니다. 횡단부의 기존 `qa.skippedCrosswalks` 계약은 유지합니다. 정상 면의 삼각형 순서와 높이 계산은 그대로입니다.

후속 `work/junction_generation.py`는 확정한 공통 도로·보도 면과 arterial plan을 소비합니다. 플랫폼·출입구·출입구 접근면을 보호 대상으로 받아 교차로 패치 영역을 정하며, 그 영역 안의 기존 도로 삼각형·차선·일반 횡단부·경사판은 교차로 결과로 대체합니다. arterial의 횡단면 생성 단계가 교차로 패치의 최종 소유권을 다시 덮어쓰지 않습니다. 이 분리는 새 도로 규칙이나 법정 치수 적용을 뜻하지 않습니다.

### 뷰어 프레임과 지형 조회

`viewer/render-loop.js`는 재그리기 요청, 카메라 변화 감지, 날씨 24fps 제한, 80ms 초과 간격의 장면 추가, resize와 이벤트 수명을 관리합니다. 앱은 이동·날씨·장면 추가·그리기를 콜백으로 연결합니다. 숨겨진 문서와 측정 중에는 기존처럼 프레임 작업을 멈추며, 해제 후 도착한 콜백은 실행하지 않습니다. 뒤로 가기 캐시에 보관되는 페이지는 루프를 해제하지 않습니다.

`viewer/terrain-index.js`는 기존 5m 셀의 삼각형 색인·최상단 높이·첫 도로 면·좌표 변환을 담당합니다. 배경 높이 fallback은 앱이 주입하며, elevation 함수에 붙이는 기존 생성 범위 속성을 유지합니다. `viewer/scene-resources.js`는 화면이 소유한 group/resource/building geometry와 material 정리를 담당합니다. 공유 texture를 임의로 해제하지 않습니다. 장면 조립과 편집·조명 정책은 앱 및 기존 담당 모듈에 남습니다.

### 생성 작업과 저장 경계

신규 생성 client와 편집 재생성 scene-edit-store는 `browser-generation/generation-task.js`의 Worker 실행을 공유합니다. 입력 전 취소, 생성/전달 오류, 진행 콜백 오류, 응답 형식을 확인하고 한 번만 종료합니다. 완료·취소 뒤 늦은 메시지는 무시하며 Worker 및 abort listener를 정리합니다. Worker가 보내는 실패 단계와 상세는 두 화면에 같은 형식으로 전달합니다.

결과 준비와 저장은 분리합니다. 결과 JSON/원본 건물 자료 오류는 준비 실패이며 저장 공간 오류로 표시하지 않습니다. 준비 및 saving 통지 직후까지 취소할 수 있습니다. 저장 호출이 시작되면 scenes/catalog 원자적 트랜잭션의 실제 결과를 기다리고, 이후 신호를 취소 성공으로 바꾸지 않습니다. 신규·편집 UI 모두 saving 단계에서 취소를 잠급니다. 기존 저장 함수와 원본/수동 수정 자료의 의미는 유지합니다.

### 공개 묶음

`config/publication-files.json`은 검토한 공개 입력을 명시합니다. 초기 목록은 기록된 HEAD의 기존 공개 파일과 분리 작업의 신규 정식 모듈로 구성했습니다. Git index나 출력 폴더 전체를 자동 복사하지 않습니다. 파일 추가 시 목적·참조·목록을 함께 검토합니다.

`publication_manifest.py`는 중복·경로 탈출·심볼릭 링크·누락·Python/캐시 파일을 거부합니다. `tests/publication-references.mjs`는 정적 import, 동적 import, side-effect import, 모듈 기준 URL, HTML/CSS 리소스, 활성 등록 에셋과 필수 출처, 나무 atlas를 검사합니다. 임의 문자열·외부 출처 URL은 파일로 오인하지 않습니다. 계산된 임의 URL 전체를 정적으로 보장하지는 않으므로 형상 검사와 공개 브라우저 확인도 필요합니다.

빌드 생성 파일과 local-mode API는 명시적 계약으로 구분합니다. 기존 `leafCompare=new` 비교 모드의 미등록 실험 이미지는 별도 예외로 기록했습니다. 해당 선택적 실험 기능은 공개 완료 범위가 아니며 일반 나무는 등록된 종별 atlas를 사용합니다. 예외에는 정확한 소스와 조건을 남기고 조건이 사라지면 검사가 실패합니다.

`build-site.py`가 참조·등록부·출처/승인·형상 경계 검사를 실행하고, 공개용 최적화 후 등록부 파일 연결을 다시 검사합니다. 작업 중인 다른 변경이 정식 파일에서 미등록 파일을 참조하면 빌드를 거부합니다. 다른 작업을 숨겨서 자동 포함하지 말고 선택한 커밋의 깨끗한 작업 폴더에서 빌드합니다. 공개 배포와 화면 확인은 소스 커밋 이후 별도로 확인합니다.

### 에셋 백과 미리보기

백과 app은 목록·필터·URL 이력·검토 UI와 상세 요청의 detailVersion을 소유합니다. preview-engine은 기존 Three 장면·카메라·조명·선 렌더링과 모델/controls/resize 수명을 소유하며 종료 후 콜백을 무시합니다. thumbnail-queue는 단일 renderer와 직렬 작업 대기열, 최대 150개 캐시, 목록 버전과 IntersectionObserver를 소유합니다. 목록 교체·종료 뒤 완료한 모델은 표시하지 않고 해제하며, 오래된 observer는 새 목록에 작업을 넣지 않습니다. 공유 texture의 소유권은 기존 모델 provider 규칙을 그대로 따릅니다.
