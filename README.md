# 우리 동네 · 웹툰 배경

한국의 지도·지형 데이터를 바탕으로 건물, 골목, 상가, 사람과 나무를 배치하는 브라우저 3D 배경 도구입니다. 계절·날씨·시간, 선·명암 설정, 골목 걷기와 PNG/GLB 저장을 제공합니다.

- 공개 사이트: https://magamiscom.ing/neighborhood/
- 작업 기준: `/Users/bacbaqui/Desktop/code/13_our_neighborhood`의 `main` 브랜치
- 작업 지침: [통합 지침](docs/project-guidelines.txt), [현재 상태](PROJECT_STATE.json), [파일 구성](docs/project-layout.txt)
- 에셋 기준: `outputs/domestic-test/asset-encyclopedia/registry.js`

## 사용 방법

공개 사이트에서 주소나 장소를 검색하고 지도에 사람을 놓습니다. 선택한 위치를 길 위로 맞춘 뒤, 그곳의 눈높이에서 360도로 레이를 쏴 보이는 건물과 소품을 만듭니다. 시야 거리를 조절할 수 있으며, 생성한 동네는 사용하는 브라우저에 저장됩니다. 이전 방식의 저장 지도는 지점을 다시 선택해 생성합니다.

설치나 이 Mac의 상시 실행 없이 공개 사이트를 사용할 수 있습니다. 처음 실행할 때는 생성에 필요한 파일을 내려받습니다. 지도 자료를 조회하려면 인터넷 연결이 필요합니다.

## 수정과 배포

우리동네는 지도 분석과 배치를 담당하고, 에셋백과는 분류별 모델을 제공합니다. 정식 경계와 호환 경로는 [실행 구조](docs/runtime-architecture.md)에 정리되어 있습니다. `outputs/domestic-test/`와 `outputs/alley-library/`가 실행 코드입니다. 브라우저 생성 시작 파일은 `work/browser-generation/entry.py` 하나입니다. 원본을 수정한 뒤 묶음 파일을 다시 만듭니다.

```sh
python3 work/browser-generation/pack.py
python3 work/browser-generation/pack.py --check
node scripts/check-loading.mjs
python3 scripts/build-site.py
```

`config/publication-files.json`에서 검토한 파일만 빌드에 포함됩니다. 새 정식 실행 파일을 추가할 때는 목록과 참조 검사를 함께 갱신합니다. Git에 추가한 실험·캐시·다른 작업 파일은 자동 배포되지 않습니다. 관련 검사를 통과한 변경을 `main`에 커밋하고 푸시합니다. 공개 사이트는 `bacbaqui-web/magamiscoming`의 배포 설정에서 검증한 소스 커밋을 지정해 반영합니다. 소스 저장소에 푸시한 것과 공개 사이트 반영은 구분합니다.

이전 백업과 배포 사본은 `/Users/bacbaqui/.project-archives/our-neighborhood/`에 보관합니다. 이 사본은 수정하거나 배포하지 않습니다. `archive` 링크는 이전 자료의 참조를 보존하기 위한 것입니다.

아반떼 미리보기는 단색 재질 10개, 삼각형 1,978개의 편집 가능한 메시입니다. `outputs/domestic-test/cars/avante-cn7-mesh-v91/`의 GLB·Blender 파일과 `work/car-mesh-v91/build-avante.py`를 함께 보관합니다.

## 데이터와 표현

건물 외관·높이·도로 폭·포장·상가의 외형·소품 배치는 추정과 절차적 모델링을 포함합니다. 실측 거리나 원래 건물의 정확한 복원 자료가 아닙니다. 저장된 지도 데이터의 기준일은 각 지역의 `manifest.json`과 기존 `README.txt`에 기록되어 있습니다.

- 건물: [행정안전부 / 한국에스리 서비스](https://portal.esrikr.com/arcgis/rest/services/MOIS_KR_Buildings_v2/FeatureServer/0)
- 주소·장소: [Kakao Local API](https://developers.kakao.com/docs/latest/ko/local/common)
- 도로: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), OpenMapTiles / OpenFreeMap
- 표고·원경: [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), [표고 데이터 출처](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
- 기존 기반 모델: 로케한 내보내기. 서비스와 제휴한 프로젝트가 아닙니다.
- three.js와 ez-tree: `outputs/domestic-test/vendor/`의 라이선스 파일 참조

외부 데이터·라이브러리의 라이선스와 이용 조건은 각각 적용됩니다. 이 저장소는 외부 자료에 대한 별도의 재사용 허락을 부여하지 않습니다.
