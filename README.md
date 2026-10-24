# 우리 동네 · 웹툰 배경

한국의 지도·지형 데이터를 바탕으로 건물, 골목, 상가, 사람과 나무를 배치하는 브라우저 3D 배경 도구입니다. 계절·날씨·시간, 선·명암 설정, 골목 걷기와 PNG/GLB 저장을 제공합니다.

- 공개 사이트: https://bacbaqui-web.github.io/our-neighborhood/
- 기존 주택가: `domestic-test/?location=original`
- 도봉로 큰길: `domestic-test/?location=f20b139277e4d2a5`
- 에셋 미리보기: `domestic-test/cars.html`, `domestic-test/tree-library.html`, `domestic-test/storefronts.html`, `domestic-test/people.html`, `alley-library/`

## 공개판과 로컬 실행

GitHub Pages에는 생성이 완료된 두 동네와 에셋을 배포합니다. 공개판의 주소 검색은 이 두 동네를 검색합니다. **새 주소의 지도 조회와 동네 생성은 Python 서버가 필요한 로컬 기능**입니다. API 키를 브라우저나 저장소에 넣지 않습니다.

```sh
python3 work/serve-neighborhood.py
```

`http://127.0.0.1:8765/domestic-test/`에서 엽니다. 기존 장면 보기에는 Python 표준 라이브러리만 필요합니다.

새 주소를 생성하려면 Python 환경과 Node.js 22 이상을 준비합니다.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
# .env.example을 .env로 복사하고 본인의 카카오 REST API 키를 입력합니다.
NEIGHBORHOOD_PYTHON="$PWD/.venv/bin/python" python3 work/serve-neighborhood.py
```

`KAKAO_REST_API_KEY` 환경변수 또는 `KAKAO_ENV_FILE`에 지정한 로컬 파일도 사용할 수 있습니다. `.env`, `.local-settings.json`, 작업 캐시와 로그는 Git에 포함하지 않습니다. 데이터 제공 서비스의 응답과 이용 조건에 따라 신규 주소 생성 가능 여부는 달라집니다.

## 수정과 배포

`outputs/domestic-test/`가 현재 앱과 데이터, `outputs/alley-library/`가 생활 소품, `outputs/generated-neighborhoods/`가 생성된 지역 데이터입니다. `work/`에는 현행 지역 생성과 아반떼 모델 생성 소스만 보관합니다. 과거 실험·대용량 중복 내보내기는 로컬에 보존합니다.

```sh
node scripts/check-loading.mjs
git add .
python3 scripts/build-site.py
```

`main`에 푸시하면 Actions가 `dist/`를 만들어 Pages에 배포합니다. 빌드에는 Git에 등록한 파일만 포함됩니다. 새 지역을 공개하려면 생성된 `data/` 폴더를 함께 커밋합니다. 새 주소 생성 API는 Pages에 배포되지 않습니다.

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
