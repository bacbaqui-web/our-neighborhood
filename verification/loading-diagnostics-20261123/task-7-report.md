# Task7 — observer 선행 전달 timing 보존

ResourceTiming observer가 이미지 error/recovery보다 먼저 전달되고 전역 resource 버퍼에는 entry가 없는 조건의 회귀 테스트를 먼저 추가했습니다. 기존 코드에서 timing=null로 실패함을 확인한 뒤 두 지점만 수정했습니다.

attach는 기존 최대160개 token 안에 정제된 timing 숫자 객체 한 개를 보관하고, event가 이미 있을 때만 변경을 저장합니다. end가 실패/회복 event를 만들 때 이 객체를 연결합니다. URL/entry 원문을 추가 저장하지 않고, 정상 성공은 여전히 token을 제거합니다. URL/시도별 raw 시간구간 필터, event80/session3/24KiB 제한과 정상 observer 무저장은 유지합니다.

전역 buffer=[] 상태에서 error 이전404 timing, recovery 이전200 timing을 각각 올바른 시도에 연결하는 검사가 통과했습니다. 정상 pending observer가 storage 쓰기를 만들지 않음과 민감 query 미저장도 확인했습니다. 전체 진단, 기존 load-data/texture 검사와 diff 검사가 통과했습니다(task-7-checks.json).

변경은 loading-diagnostics.js와 tests/loading-diagnostics.mjs 두 파일뿐입니다. cache/commit/배포는 부모가 처리합니다. 이 수정은 조건부 계측 손실을 해결하지만 공개 Fetch.fulfill404/200에서 브라우저가 timing을 제공했는지 소급 확정하지 않습니다.
