# 웹에서 동네 만들기

서비스 주소: https://magamiscom.ing/neighborhood/

- 주소 검색 → 카카오지도에서 지점 선택 → 50~300m 반경 선택 → 생성.
- Python 지형·도로·배치 계산은 Pyodide 314.0.0의 Web Worker에서 실행한다. 지도 자료는 브라우저가 ArcGIS, OpenFreeMap, Mapzen에서 직접 받는다. 로컬 서버, 설치, 사용자의 Mac 가동이 필요하지 않다.
- 카카오 공개 JavaScript 키만 map-config.json에 둔다. 허용 도메인은 https://magamiscom.ing 이며 REST 키는 배포하지 않는다.
- 결과는 IndexedDB에 저장한다. 다른 기기에 자동으로 옮겨지지 않으며 브라우저 데이터를 삭제하면 사라진다. 같은 위치·범위는 저장본을 다시 연다.
- 첫 실행에는 계산용 파일 다운로드가 필요하다. 생성 속도는 범위, 건물 밀도, 기기 성능과 지도 서비스 응답에 따라 달라진다.
- 화면은 기존 전체 디테일 렌더러와 등록 차량을 사용한다. 배치 계산만 실제 차량의 측정한 크기를 쓴다. 거리 LOD는 다시 켜지 않는다.
- 지도에서 얻은 건물 윤곽과 도로를 사용하지만 외관, 길 폭, 소품과 상점 모습은 추정이다.

## 파일

`outputs/domestic-test/browser-generation/worker.js`: 계산 실행 순서와 전송.
`browser-generation/sources.json`: 허용한 Python 소스와 공개 에셋 메타데이터.
`browser-generation/prepare-scene.js`: Three.js 배치 계산 번들.
`browser-generation/storage.js`: 브라우저 저장과 재열기.
`start.html`, `map-picker.js`: 시작 화면과 위치 선택.

원본 생성 스크립트와 새 포장 코드는 로컬 프로젝트의 `work/browser-generation/`에 있다. 기존 생성 스크립트를 변경하면 `pack.py`로 sources.json을 다시 만든다. prepare-scene.js는 esbuild로 번들링한다. `.local-settings.json`이나 REST 키는 묶지 않는다.

## 검증

브라우저에서 실제 외부 지도를 조회해 50m 동네 생성·저장·3D 렌더링을 확인했다. 100m 도봉로에서도 건물 137개, 6차로, 버스차로 2개, 정류장 1개, 횡단보도 1개까지 생성했다(시험 기기 약 133초). 공개 도메인 지도 검색은 배포 후 별도 확인한다.
