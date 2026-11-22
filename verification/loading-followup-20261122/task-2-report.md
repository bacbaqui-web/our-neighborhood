# Task2 — 백과 계약 검사 보완

두 기존 검사를 현재 계약으로 수정하고 pages CI의 Check loading behavior에 연결했습니다. runtime·원본 자산·registry·curation은 바꾸지 않았습니다. 별도 공통 helper 없이 각 테스트의 작은 validate 함수에 입력 복사본을 전달합니다.

asset-encyclopedia는 category 원본과 aggregate 전체 일치, inventory 고정 ID, 필수 필드, revision ownership, 파일 존재와 공개 명세를 검사합니다. 원본/숨긴 후보/교체 모델의 소유 경로와 실제 GLB 전체 탐색을 유지합니다. 교체 전 승인 버스·주차·속도 표지 7개 파일은 구체적 역사 목록으로 남기고 현재 승인 모델과 다른 파일임을 확인합니다. 임의 v999 파일은 허용하지 않습니다. local-archive 없음은 허용하지만 public-required 없음은 실패합니다. 개수만 바꾸지 않았습니다.

asset-encyclopedia-lines는 승인 building/road/prop/grade1의 정확한 ID 집합을 구성하고 applyRemakes와 실제 registry 양쪽을 검사합니다. 승인 road가 이전 prop보다 우선하는 파일·삼각형·참고ID 및 originalFile, 기존 raw 불변성과 고정 선 설정을 확인합니다.

실패 주입13개를 실제 assert.throws로 실행했습니다: 중복ID, stableID 누락, 미등록GLB, revision ownership 누락, 필수 파일 누락, 공개명세 누락 / remake 누락·추가, 승인모델을 옛 파일로 교체, 옛 삼각형 복원, 승인reference 삭제, 원본파일 변경, prototype 재노출. 원본 파일은 수정하지 않고 입력 복사본과 exists/publicFiles/models 주입을 사용했습니다.

두 검사, catalog --check, category-ownership, filter-state, git diff --check가 모두 통과했습니다. 결과는 task-2-checks.json에 있습니다. fresh baseline22개 중 이번에 수정하도록 승인된 검사2개만 달라졌으며 외부20개 해시와 staged13 patch는 모두 동일합니다. 변경 파일은 두 테스트와 CI workflow 세 개뿐이며 커밋·index 변경은 하지 않았습니다.
