# 우리동네 작업 지침

- 기준 작업 폴더는 `/Users/bacbaqui/Desktop/code/13_our_neighborhood`입니다.
- 작업 전에 `docs/project-guidelines.txt`를 읽고 따릅니다. 작업·모델링·소품·에셋 관리·동네 생성·검사·배포 기준을 합친 문서입니다.
- 이어서 `PROJECT_STATE.json`과 `docs/project-layout.txt`에서 현재 적용 범위와 관련 최신 작업을 확인합니다.
- 날짜별 실험·검증 기록을 현재 구현 상태나 별도 제작 지침으로 오해하지 않습니다.
- 에셋 제작·백과 등록·실제 배치의 완료 기준은 통합 지침 4절·8절을 따릅니다. 새 규칙은 별도 지침이 아니라 그 문서에 반영합니다.

## 유일한 수정·배포 기준
- 우리동네의 메인은 이 폴더와 `origin/main`입니다. 공개 주소는 https://magamiscom.ing/neighborhood/ 입니다.
- 실행 시작은 outputs/domestic-test/start.html, 생성기는 work/browser-generation/entry.py, 에셋 기준은 outputs/domestic-test/asset-encyclopedia/registry.js입니다.
- 지도에서 찍은 길 위 지점의 눈높이에서 360도 레이로 보이는 대상만 생성합니다. 예전 반경 전체 지도로 우회하지 않습니다.
- 통합 지침 docs/project-guidelines.txt를 반드시 따릅니다.
- 이전 백업·배포 작업 사본은 /Users/bacbaqui/.project-archives/our-neighborhood 아래에 보관합니다. archive 링크는 이전 기록 조회용입니다. 이 사본에서 수정하거나 배포하지 않습니다.
- 과거 실험 소스·모델 원본은 보존 자료입니다. 정식 실행 코드가 의존하는 파일은 백업으로 오인해 옮기지 않습니다.

## 수정 요청의 기본 완료 범위 (2026-11-21 사용자 지시)

- 우리동네 프로젝트의 모든 대화에서 수정 요청은 구현·필요한 검사·공개 배포·공개 화면 확인까지 포함합니다. 로컬 수정만 끝내고 완료로 보고하지 않습니다.
- 별도 배포 승인을 다시 묻지 않고 기준 폴더와 origin/main에서 공개 주소 https://magamiscom.ing/neighborhood/ 에 반영합니다.
- 사용자가 명시적으로 로컬 시험이나 배포 보류를 요청한 경우만 예외입니다. 검사 실패나 배포 장애가 있으면 원인과 미완료 범위를 알리고 해결을 계속합니다.
- 다른 대화의 진행 중 변경을 임의로 함께 배포하지 않습니다. 완료된 변경을 조율해 반영하며 사용자에게는 공개 주소를 우선 안내합니다.
