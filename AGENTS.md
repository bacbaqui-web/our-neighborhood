# 우리동네 작업 지침

- 기준 작업 폴더는 `/Users/bacbaqui/Desktop/code/13_our_neighborhood`입니다.
- 작업 전에 `docs/project-guidelines.txt`를 읽고 따릅니다. 작업·모델링·소품·에셋 관리·동네 생성·검사·배포 기준을 합친 문서입니다.
- 이어서 `PROJECT_STATE.json`과 `docs/project-layout.txt`에서 현재 적용 범위와 관련 최신 작업을 확인합니다.
- 날짜별 실험·검증 기록을 현재 구현 상태나 별도 제작 지침으로 오해하지 않습니다.

## 유일한 수정·배포 기준
- 우리동네의 메인은 이 폴더와 `origin/main`입니다. 공개 주소는 https://magamiscom.ing/neighborhood/ 입니다.
- 실행 시작은 outputs/domestic-test/start.html, 생성기는 work/browser-generation/entry.py, 에셋 기준은 asset-encyclopedia/registry.js입니다.
- 지도에서 찍은 길 위 지점의 눈높이에서 360도 레이로 보이는 대상만 생성합니다. 예전 반경 전체 지도로 우회하지 않습니다.
- 통합 지침 docs/project-guidelines.txt를 반드시 따릅니다.
- 이전 백업·배포 작업 사본은 /Users/bacbaqui/.project-archives/our-neighborhood 아래에 보관합니다. archive 링크는 이전 기록 조회용입니다. 이 사본에서 수정하거나 배포하지 않습니다.
- 과거 실험 소스·모델 원본은 보존 자료입니다. 정식 실행 코드가 의존하는 파일은 백업으로 오인해 옮기지 않습니다.
