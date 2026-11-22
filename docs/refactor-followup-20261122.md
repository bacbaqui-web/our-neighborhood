# 후속 리팩토링 — 2026-11-22

현재 우선순위 1–6과 진입점 캐시 연결의 구현·로컬 검사가 끝났습니다. 부모 에이전트가 각 단계 결과를 직접 검토한 뒤 다음 단계를 승인했습니다. **이번 후속 변경의 공개 배포와 공개 화면 확인은 아직 완료하지 않았습니다.** 배포 결과는 완료 후 이 문서에 갱신합니다.

이 문서는 이번 후속 작업의 현재 상태입니다. [이전 리팩토링](refactor-20261122.md)은 앞선 작업의 배포 완료 기록이며 이번 변경의 배포 증거가 아닙니다. 날짜별 문서·PROJECT_STATE의 이전 검사 수치와 ‘미완료’ 표시는 그 시점의 기록입니다. 현재 상태와 혼동하지 않도록 원문을 보존하고 최신 요약을 앞에 두었습니다.

## 달라진 구조

1. JavaScript 생성 묶음: pinned esbuild로 반복 가능한 빌드를 만들고 원본·설정 변경과 묶음 최신성을 검사합니다. 캐시 query가 다른 동일 모듈을 정규화하며 import.meta.url의 원래 에셋 위치를 보존합니다.
2. 큰길 출입구·횡단 기하: arterial_crossings가 명시 입력을 받아 결과와 QA를 반환합니다. 비어 있거나 여러 조각/구멍인 추정 접근면은 원본 시설을 지우지 않고 이유와 함께 생략합니다. 정상 기하 순서·높이와 skippedCrosswalks 계약은 유지합니다.
3. Python 생성 단계: GenerationContext와 pipeline으로 입력·출력과 단계 실행을 명시했습니다. import만으로 파일을 생성하지 않으며 상태·난수·누적 목록은 호출 내부에 둡니다. 기존 13개 파일 위치와 옛 CLI 어댑터를 유지합니다.
4. 메인 뷰어: render-loop, terrain-index, scene-resources로 프레임·지형 조회·소유 자원 정리를 분리했습니다. 카메라 변경/수동 갱신, 날씨 24fps, 장면 추가 80ms 초과 간격, 측정 중 일시정지를 유지합니다.
5. 생성 Worker: 신규 생성과 편집 재생성의 종료·취소·오류·늦은 메시지 처리를 공유합니다. 결과 준비 실패와 저장 실패를 구분하고, 원자적 저장 시작 뒤에는 취소 성공으로 안내하지 않습니다. scenes/catalog 저장 및 수동 편집 자료 의미는 유지합니다.
6. 에셋 백과: preview-engine과 thumbnail-queue로 미리보기 자원과 직렬 작업/캐시를 분리했습니다. 목록 변경·종료 뒤 완료된 모델을 해제하고 오래된 observer 콜백을 무시합니다. 목록·필터·이력·검토 UI, 고정 ID, 모델 provider, 외관은 유지합니다.
7. 진입점 캐시 연결: start/location-loader → progress, app → location-loader/editor, editor → scene-edit-store의 다섯 참조를 같은 버전으로 갱신했습니다.

현재 구현 위치와 의존 방향은 [실행 경계](runtime-architecture.md)를 따릅니다. 새 에셋·디자인·지도 생성 정책을 추가한 작업은 아닙니다.

## 확인한 결과

- 부모의 통합 기록에서 CI에 대응하는 명령 31개가 모두 통과했습니다. 이는 로컬 통합 실행이며 GitHub 공개 배포 CI 성공으로 대신 표시하지 않습니다. [명령별 결과](../verification/refactor-followup-20261122/parent-integration.json), [로그](../verification/refactor-followup-20261122/parent-integration.log).
- 실제 미아동 100m 전체 site-layout 결과는 변경 전후 바이트가 같았습니다. SHA-256: `c96691c7b4faa876d7f367e1c65bfdfb4c88b322052d5ee63bbca952675617b0`.
- 작은 골목 fixture도 변경 전후 바이트가 같았습니다. SHA-256: `5de65f31d6205460e6010f807edfbac9ab401e323836ade0e4cf52e348bac468`. 실제 A→B→A 반복, 실패 뒤 성공, 환경/다른 모듈 캐시 보존과 옛 CLI를 검사했습니다. [기하 비교](../verification/refactor-followup-20261122/task-3-parity.json).
- 백과 추가 검사: 현재 표시 에셋 393개의 필터, 주택 예시 6종 실제 모델, 소유권 1023개, deferred 모델을 이용한 목록 전환·취소·실패 복구·종료 뒤 콜백 검사가 통과했습니다.
- 캐시 보완 이후 scene-editor, browser-generation, generation-task와 관련 문법·변환 보존 검사를 다시 통과했습니다.
- 부모가 selected tree의 전체 공개 빌드를 완료했습니다(exit 0): 1,600개 파일, 956.7 MB, 동네 2개입니다. 사람 이미지 240개 및 상점/차량 43개 변환의 픽셀 보존, 최적화 백과·모델 경로·texture 실제 loader 검사를 통과했습니다. 캐시 변경 후 selected tree의 loading/browser-generation/공개 참조(입력 1,600개·참조 2,193개)/generation-task/scene-editor도 통과했습니다. 이 결과는 로컬 공개용 빌드이며 실제 공개 배포는 아직 남아 있습니다.

오래된 검사 두 개는 현재 자료와 기대값이 달라 실패합니다. asset-encyclopedia.mjs는 카탈로그에 없는 개별 GLB coverage, asset-encyclopedia-lines.mjs는 remade 기대 18개/실제 55개입니다. 두 검사에서 따라가는 코드·catalog 12개 입력의 git diff HEAD가 비어 있고 이번 추출 모듈을 읽지 않음을 확인했습니다. 자료와 기대값을 임의로 바꾸지 않았습니다. [입력 근거](../verification/refactor-followup-20261122/task-6-legacy-test-inputs.json).

## 변경 보존과 남은 확인

다른 대화의 변경을 섞지 않도록 baseline 해시/원문/patch를 보존했습니다. 함께 수정한 app/index/start 및 상태 문서는 working과 별도로 HEAD+이번 변경만 담은 selected 스냅샷을 둡니다. 기계적인 역변환으로 working은 기록한 baseline, selected는 HEAD와 정확히 같음을 확인합니다. 다른 대화의 Codex bridge 등은 공개 명세에 넣지 않았습니다.

선택 변경 커밋, 공개 배포 성공, 공개 동네·편집·백과 화면 확인은 아직 남아 있습니다. 로컬 자동검사만으로 실제 공개 사용 확인을 완료했다고 보고하지 않습니다. 단계별 구현·검사 기록은 [verification/refactor-followup-20261122](../verification/refactor-followup-20261122/)에 있습니다.
