# 우리동네와 에셋백과의 실행 경계

현재 작업 기준은 기준 폴더와 origin/main이며 제작·배치 규칙은 `project-guidelines.txt`를 따릅니다. 이 문서는 구현 위치와 의존 방향을 설명합니다.

| 영역 | 정식 구현 | 책임 |
| --- | --- | --- |
| 브라우저 시작 | outputs/domestic-test/start.html | 지도에서 길 위 눈높이 기준점 선택 |
| 지도 분석·동네 생성 | work/browser-generation/entry.py, site_layout.py | 가시 영역 분석, 동네 구성, 수동 수정 보존 |
| 정식 공간 생성 | work/neighborhood-generation/의 13개 Python 모듈 | 대지·도로·건물·주차·공간 배치 계산 |
| 브라우저 Python 묶음 | work/browser-generation/pack.py → outputs/domestic-test/browser-generation/sources.json | 허용한 정식 소스만 패키징 |
| 에셋 등록부 | outputs/domestic-test/asset-encyclopedia/registry.js | 고정 ID·분류·모델 출처·승인 상태 제공 |
| 분류별 모델 | asset-encyclopedia/categories/*/models.js | house, commerce, nature, vehicle, prop, road, person 모델 제공 |
| 배치/조립 | assembly-rules, details.js, 각 placement 모듈 | 지도·규칙에 따라 에셋 선택·배치·조립 |
| 백과 조립 예시 | asset-encyclopedia/preview-assembly.js | UI용 건물/거리 예시 조립기를 provider에 명시적으로 주입 |

모델 provider는 동네의 지도·가시성·배치 구현을 가져오지 않습니다. 공통 렌더링·조명·순수 기하 함수는 공유합니다. `model-source-ownership.json`은 분류 provider에서 도달하는 기존 모델 소스의 소유권을 명시합니다. 바이너리와 기존 공개 URL은 유지합니다. person의 이미지 에셋은 백과 UI 이미지 경로에서 처리합니다.

house의 실제 외벽·창문/문 형상 및 텍스처는 분류 폴더에 있습니다. root `korean-facades.js`와 `facade-textures.js`는 기존 URL을 위한 재수출입니다. nature는 나무 크기·형상을 소유하며 root `tree-planting.js`는 배치 정책, `hybrid-tree.js`는 동네 가시성 필터 어댑터입니다. 건물/시설 preview의 옛 URL도 주입을 연결하는 호환 어댑터입니다.

`work/house-plots-test`의 정식 13개 파일은 새 구현에 위임하는 호환 진입점입니다. 같은 폴더의 과거 실험과 증거 파일은 정식 브라우저 생성에 자동 포함되지 않습니다. 원본 모델·승인 자료·수동 저장 동네는 캐시로 취급하지 않습니다.

## 공개 파일과 검사

`config/publication-files.json`은 검토한 공개 입력을 명시합니다. 초기 목록은 기록된 HEAD의 기존 공개 파일과 분리 작업의 신규 정식 모듈로 구성했습니다. Git index나 출력 폴더 전체를 자동 복사하지 않습니다. 파일 추가 시 목적·참조·목록을 함께 검토합니다.

`publication_manifest.py`는 중복·경로 탈출·심볼릭 링크·누락·Python/캐시 파일을 거부합니다. `tests/publication-references.mjs`는 정적 import, 동적 import, side-effect import, 모듈 기준 URL, HTML/CSS 리소스, 활성 등록 에셋과 필수 출처, 나무 atlas를 검사합니다. 임의 문자열·외부 출처 URL은 파일로 오인하지 않습니다. 계산된 임의 URL 전체를 정적으로 보장하지는 않으므로 형상 검사와 공개 브라우저 확인도 필요합니다.

빌드 생성 파일과 local-mode API는 명시적 계약으로 구분합니다. 기존 `leafCompare=new` 비교 모드의 미등록 실험 이미지는 별도 예외로 기록했습니다. 해당 선택적 실험 기능은 공개 완료 범위가 아니며 일반 나무는 등록된 종별 atlas를 사용합니다. 예외에는 정확한 소스와 조건을 남기고 조건이 사라지면 검사가 실패합니다.

`build-site.py`가 참조·등록부·출처/승인·형상 경계 검사를 실행하고, 공개용 최적화 후 등록부 파일 연결을 다시 검사합니다. 작업 중인 다른 변경이 정식 파일에서 미등록 파일을 참조하면 빌드를 거부합니다. 다른 작업을 숨겨서 자동 포함하지 말고 선택한 커밋의 깨끗한 작업 폴더에서 빌드합니다. 공개 배포와 화면 확인은 소스 커밋 이후 별도로 확인합니다.
