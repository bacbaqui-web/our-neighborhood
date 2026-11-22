# Task4 — 선택 커밋 보존 감사

소스 2f3f33ca59000c70e5ed31c36cb7b71530ea20af의14개 blob 해시가 selected manifest와 모두 같습니다. 외부20개 파일은 공유 app/index의 정확한 치환을 역적용하면 fresh baseline 원문 해시와 일치합니다. staged13 전체 binary patch도 baseline-index.patch와 같습니다.

host-update.json의 workflowBefore/After는 소스 ref ab7f29f351c4a36c738ce8565ef4333fa8c6ae66 → 2f3f33ca59000c70e5ed31c36cb7b71530ea20af 한 곳만 교체하면 정확히 같습니다. 기록된 호스팅 커밋은 7774d9ceb81488d4f337bd2d224f252cdef42219입니다. 이 비교는 기록된 workflow 원문을 검증하며 배포 성공이나 공개 화면 상태를 추정하지 않습니다.

코드·기존 문서·index를 수정하지 않았고 이 감사의 md/json만 작성했습니다.
