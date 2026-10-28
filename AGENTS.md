# 우리동네 공통 작업 기준

- 사용자에게 쉬운 한국어 존댓말로 설명합니다.
- 기준 작업 폴더는 `/Users/bacbaqui/Desktop/code/13_our_neighborhood`입니다.
- 먼저 `PROJECT_STATE.json`과 `docs/project-layout.txt`를 읽고 관련 대화의 최신 작업을 확인합니다.
- `/tmp/our-neighborhood-foliage-134`는 이전 배포 복사본입니다. 새 작업과 배포 기준으로 쓰지 않습니다.
- 다른 대화가 같은 파일을 수정 중이면 해당 작업을 확인하고 충돌을 피합니다. 변경 후 PROJECT_STATE.json의 내용을 갱신합니다.
- 모델·텍스처·조사 자료·미등록 파일을 오래됐다는 이유만으로 삭제하지 않습니다. 원본과 변경 전 파일을 보존하고 참조 관계를 확인합니다.
- 실행 코드는 outputs/domestic-test와 outputs/alley-library에 있습니다. work에는 제작·생성 원본이 있으며, dist는 다시 만드는 배포 결과입니다.
- 브라우저 생성 시작 파일은 work/browser-generation/entry.py 하나입니다. sources.json을 직접 수정하지 말고 원본을 고친 뒤 `python3 work/browser-generation/pack.py`를 실행합니다.
- 배포 전 `python3 work/browser-generation/pack.py --check`와 관련 검사를 실행합니다. 필요한 파일이 Git에 등록됐는지도 확인합니다.
- 공개 버전 확인과 로컬 검사 결과를 구분합니다. 이번 정리 이후 통합본은 공개 배포 전 상태입니다.
- 공개 주소는 https://magamiscom.ing/neighborhood/ 이며 호스팅 저장소는 bacbaqui-web/magamiscoming입니다. 최상위 홈페이지는 별도 프로젝트입니다.
