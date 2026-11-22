# Task5 — 선택 커밋과 외부 변경 보존 감사

소스 ab7f29f351c4a36c738ce8565ef4333fa8c6ae66의 변경13개 blob 해시가 selected manifest와 모두 일치합니다. fresh baseline의 외부20개는 공유 app/index의 이번 치환을 역적용하면 원문 해시와 정확히 같습니다. 이번 승인 범위인 테스트2개는 외부20개 집계에서 제외했습니다. staged13의 전체 binary patch도 baseline-index.patch와 같습니다.

host-update.json의 workflowBefore/After를 비교했습니다. 소스 ref d0d3197→ab7f29f 한 곳만 변경하면 두 문자열이 정확히 일치합니다. 기록된 호스팅 커밋은 5295aac1ab27833b4e87825358182ecd9137f55e입니다. 이 검사는 보관된 workflow 원문 비교이며, 별도의 배포 성공이나 공개 화면 완료를 추정하지 않습니다.

코드·기존 문서·index를 수정하지 않았으며 task-5-preservation.md/json만 작성했습니다. 항목별 결과는 JSON에 있습니다.
