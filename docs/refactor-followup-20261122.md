# 후속 리팩토링 — 2026-11-22

현재 우선순위 1–7의 리팩토링·상태 문서 정리와 진입점 캐시 연결의 구현·로컬 검사가 끝났습니다. 부모 에이전트가 각 단계 결과를 직접 검토한 뒤 다음 단계를 승인했습니다. **선택 변경 커밋, 필수 CI, 공개 배포와 공개 실제 사용 확인까지 완료했습니다.** 최초 열기에서 한 번 발생한 오류의 원인은 미확정이며 아래에 별도로 기록했습니다.

이 문서는 이번 후속 작업의 현재 상태입니다. [이전 리팩토링](refactor-20261122.md)은 앞선 작업의 배포 완료 기록이며 이번 변경의 배포 증거가 아닙니다. 날짜별 문서·PROJECT_STATE의 이전 검사 수치와 ‘미완료’ 표시는 그 시점의 기록입니다. 현재 상태와 혼동하지 않도록 원문을 보존하고 최신 요약을 앞에 두었습니다.

## 달라진 구조

1. JavaScript 생성 묶음: pinned esbuild로 반복 가능한 빌드를 만들고 원본·설정 변경과 묶음 최신성을 검사합니다. 캐시 query가 다른 동일 모듈을 정규화하며 import.meta.url의 원래 에셋 위치를 보존합니다.
2. 큰길 출입구·횡단 기하: arterial_crossings가 명시 입력을 받아 결과와 QA를 반환합니다. 비어 있거나 여러 조각/구멍인 추정 접근면은 원본 시설을 지우지 않고 이유와 함께 생략합니다. 정상 기하 순서·높이와 skippedCrosswalks 계약은 유지합니다.
3. Python 생성 단계: GenerationContext와 pipeline으로 입력·출력과 단계 실행을 명시했습니다. import만으로 파일을 생성하지 않으며 상태·난수·누적 목록은 호출 내부에 둡니다. 기존 13개 파일 위치와 옛 CLI 어댑터를 유지합니다.
4. 메인 뷰어: render-loop, terrain-index, scene-resources로 프레임·지형 조회·소유 자원 정리를 분리했습니다. 카메라 변경/수동 갱신, 날씨 24fps, 장면 추가 80ms 초과 간격, 측정 중 일시정지를 유지합니다.
5. 생성 Worker: 신규 생성과 편집 재생성의 종료·취소·오류·늦은 메시지 처리를 공유합니다. 결과 준비 실패와 저장 실패를 구분하고, 원자적 저장 시작 뒤에는 취소 성공으로 안내하지 않습니다. scenes/catalog 저장 및 수동 편집 자료 의미는 유지합니다.
6. 에셋 백과: preview-engine과 thumbnail-queue로 미리보기 자원과 직렬 작업/캐시를 분리했습니다. 목록 변경·종료 뒤 완료된 모델을 해제하고 오래된 observer 콜백을 무시합니다. 목록·필터·이력·검토 UI, 고정 ID, 모델 provider, 외관은 유지합니다.
7. 상태 문서 정리: 최신 구현·검사·배포 상태를 앞에 요약하고 이전 기록은 당시의 결과로 구분했습니다. 기존 기록과 다른 대화의 문서 변경을 보존했습니다.

추가로 진입점 캐시 연결도 정리했습니다. start/location-loader → progress, app → location-loader/editor, editor → scene-edit-store의 다섯 참조를 같은 버전으로 갱신했습니다.

현재 구현 위치와 의존 방향은 [실행 경계](runtime-architecture.md)를 따릅니다. 새 에셋·디자인·지도 생성 정책을 추가한 작업은 아닙니다.

## 확인한 결과

- 부모의 통합 기록에서 CI에 대응하는 명령 31개가 모두 통과했습니다. 이는 로컬 통합 실행이며 GitHub 공개 배포 CI 성공으로 대신 표시하지 않습니다. [명령별 결과](../verification/refactor-followup-20261122/parent-integration.json), [로그](../verification/refactor-followup-20261122/parent-integration.log).
- 실제 미아동 100m 전체 site-layout 결과는 변경 전후 바이트가 같았습니다. SHA-256: `c96691c7b4faa876d7f367e1c65bfdfb4c88b322052d5ee63bbca952675617b0`.
- 작은 골목 fixture도 변경 전후 바이트가 같았습니다. SHA-256: `5de65f31d6205460e6010f807edfbac9ab401e323836ade0e4cf52e348bac468`. 실제 A→B→A 반복, 실패 뒤 성공, 환경/다른 모듈 캐시 보존과 옛 CLI를 검사했습니다. [기하 비교](../verification/refactor-followup-20261122/task-3-parity.json).
- 백과 추가 검사: 현재 표시 에셋 393개의 필터, 주택 예시 6종 실제 모델, 소유권 1023개, deferred 모델을 이용한 목록 전환·취소·실패 복구·종료 뒤 콜백 검사가 통과했습니다.
- 캐시 보완 이후 scene-editor, browser-generation, generation-task와 관련 문법·변환 보존 검사를 다시 통과했습니다.
- 부모가 selected tree의 전체 공개 빌드를 완료했습니다(exit 0): 1,600개 파일, 956.7 MB, 동네 2개입니다. 사람 이미지 240개 및 상점/차량 43개 변환의 픽셀 보존, 최적화 백과·모델 경로·texture 실제 loader 검사를 통과했습니다. 캐시 변경 후 selected tree의 loading/browser-generation/공개 참조(입력 1,600개·참조 2,193개)/generation-task/scene-editor도 통과했습니다. 이 항목은 로컬 공개용 빌드 결과이며, 이어서 완료한 실제 배포·사용 확인은 아래에 기록했습니다.

오래된 검사 두 개는 현재 자료와 기대값이 달라 실패합니다. asset-encyclopedia.mjs는 카탈로그에 없는 개별 GLB coverage, asset-encyclopedia-lines.mjs는 remade 기대 18개/실제 55개입니다. 두 검사에서 따라가는 코드·catalog 12개 입력의 git diff HEAD가 비어 있고 이번 추출 모듈을 읽지 않음을 확인했습니다. 자료와 기대값을 임의로 바꾸지 않았습니다. [입력 근거](../verification/refactor-followup-20261122/task-6-legacy-test-inputs.json).

## 변경 보존과 남은 확인

다른 대화의 변경을 섞지 않도록 baseline 해시/원문/patch를 보존했습니다. 함께 수정한 app/index/start 및 상태 문서는 working과 별도로 HEAD+이번 변경만 담은 selected 스냅샷을 둡니다. 기계적인 역변환으로 working은 기록한 baseline, selected는 HEAD와 정확히 같음을 확인합니다. 다른 대화의 Codex bridge 등은 공개 명세에 넣지 않았습니다.

선택 변경 커밋과 공개 배포 후 실제 동네·편집·백과 화면을 확인했습니다. 단계별 구현·검사 기록은 [verification/refactor-followup-20261122](../verification/refactor-followup-20261122/)에 있습니다.

## 공개 배포와 실제 사용 확인 완료

[공개 사이트](https://magamiscom.ing/neighborhood/)에 선택 소스 `d0d319741cee82721d9f2bcd9efd1f3034de0b45`, 호스팅 `fc99cd487097dcace3f709c5c0e341b7d7c523a6`가 반영됐습니다. [소스 CI 45031412124](https://github.com/bacbaqui-web/our-neighborhood/actions/runs/45031412124)와 [호스팅 CI 45031456209](https://github.com/bacbaqui-web/magamiscoming/actions/runs/45031456209)가 모두 성공했고 공개 파일 해시가 빌드 결과와 일치했습니다.

기존 동네 ce8f92284fef849c의 재열기와 편집 창 열기/닫기를 확인했습니다. 서울 종로구 계동 147-2에서 반경 100m 동네 fe5870f9c8552979를 실제 생성·저장했습니다. 8번 도로를 1에서 2로 바꿔 재생성·저장·자동 재열기한 후 편집 화면에 ‘2차도로 · 왕복 2차선과 인도’가 유지됐습니다. 마지막 화면은 ready=true, 상태 문구 없음, 오류 목록 없음이며 조립 연결 2,090개·배치 제외 37개였습니다. 백과 빠른 분류 전환, 창문 88삼각형 상세 재열기, 나무 2,572삼각형 상세, 썸네일 10개도 확인했습니다.

신규 동네의 최초 열기에서는 ‘불러오기 실패: undefined’와 console Event가 한 번 발생했습니다. 실패 리소스 URL을 확보하지 못해 원인은 미확정입니다. 같은 저장 동네를 코드 수정 없이 다시 열자 정상 렌더됐고, 이후 도로 편집·저장·재열기도 성공했습니다. 재열기 중 실패 네트워크 요청·console 오류는 관찰되지 않았습니다. 이미지 로더 오류와 모양이 비슷하지만 확정 원인으로 단정하거나 추측 수정하지 않았습니다. 이 원인 미확정과 앞서 적은 오래된 검사 두 개의 실패는 완료된 배포·사용 검사와 구분해 남깁니다.

증거: [배포](../verification/refactor-followup-20261122/deployment.json), [공개 사용](../verification/refactor-followup-20261122/public-ui-progress.json), [최종 화면 상태](../verification/refactor-followup-20261122/public-final-ui.json), [최초 오류 조사](../verification/refactor-followup-20261122/public-first-open-investigation.json), [공개 해시](../verification/refactor-followup-20261122/public-hashes.json).
