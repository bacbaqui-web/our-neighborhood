# 후속 리팩토링 진행 기록

계획: docs/superpowers/plans/2026-11-22-refactor-followup.md
시작 HEAD: e114779. 작업자: /root/refactor_worker 한 명. 부모 직접 검토 후 다음 작업 지시.
기존 완료 기록: verification/refactor-20261122/completion.json (재적용하지 않음).

- 시작 보존: tracked dirty20개 및 staged13개 원문/해시/patch를 baseline*에 보관. 공유 app.js Codex 연결 변경은 선택 공개본에서 제외할 것.
- 부모 기준 실제 기하: Python3.12.13/numpy2.5.5/shapely2.2.0, tests/build_alley_fixture.py 결과 SHA256 5de65f31d6205460e6010f807edfbac9ab401e323836ade0e4cf52e348bac468. /tmp/neighborhood-followup-baseline/package.json. 이전 완료 결과와 일치.
- 태스크1 설계 검토 승인. 고정 esbuild, 재현/최신성 검사, module singleton 및 import.meta.url 검증, CI 연결 구현 중.
- 스킬 절차 중 별도 worktree/다수 리뷰 에이전트/재승인 대신 사용자 지정 기준 폴더·main/작업자1명/부모 검토를 적용.

- 태스크1 요구/품질 검토 승인: builder/test/CI diff 직접 검토, 부모 재실행 source/output drift·singleton·URL·DOM-free import + browser contracts + pack52 + diff check 통과. 태스크2 출입구/횡단 기하 분리 진행.

- 태스크2 요구/품질 검토 승인: 부모 기하7개/pack53/diff check 통과, 정상 전체 plan equality 및 출입구 원본 보존 검토. 태스크3 명시 Python 파이프라인 진행.
- 추가 실제 전체 기준: tracked 미아동 f20b139277e4d2a5 data5개 복사→site_layout.build radius100, SHA c96691c7b4faa876d7f367e1c65bfdfb4c88b322052d5ee63bbca952675617b0. /tmp/neighborhood-followup-full-baseline/site-layout.json; 생성 원본 수정 없음.

- 태스크3 요구/품질 승인: 부모 실제 boundary5/작은 fixture byte compare/미아동 whole byte compare(SHA c96691...)/pack57 통과. core env/path/module cache 오염 제거 및 legacy 경계 검토. 태스크4 viewer render lifecycle·terrain 책임 분리 진행; app 외부 변경 보존 및 별도 selected 스냅샷 요구.

- 태스크4 요구/품질 승인: 부모 viewer lifecycle/UI 검사 통과 및 replacements 역적용으로 work==baseline, selected==HEAD 각각 확인. root 참조검사 foreign bridge3개만 실패(예상); 최종 선택트리에서 검증할 것. 태스크5 공통 Worker lifecycle/저장 오류 분리 진행.

- 태스크5 보완1/5: preflight async progress 오류 전달 누락 보완. 부모 generation-task 재실행/수정diff 검토로 해결 확인. 요구/품질 승인; 기존 저장 transaction 유지 및 cancel/save 경계 검토. 태스크6 백과 preview/thumbnail 수명 분리 진행.

- 최종 통합 후속: start/location-loader→progress, app→location-loader/editor, editor→scene-edit-store import cache 버전 갱신 필요. 태스크6 이후 별도 처리, 공유 app/start 선택본과 역변환 검사 갱신할 것.

- 태스크6 부모 요구/품질 승인: preview/queue/app diff 검토, lifecycle·filter·housing·ownership 직접 재실행 통과. 선택 검사본 공개 참조 1600 inputs/2193 refs 통과. 기존 데이터 기대값 검사2개 실패는 분리 보고. 캐시 연결 정리 별도 지시.

- cache 부모 승인: Task4+cache 역변환 독립 검증으로 원문/선택본 보존 확인. 선택 검사본 loading/browser-generation/publication references(1600/2193)/generation-task/scene-editor 통과. Task7 문서 정리 지시.
- 부모 선택 공개 빌드 exit0: 1600파일956.7MB, 이미지 변환 및 공개 모델/텍스처 경로 검사 통과. 빌드 중 갱신된 query-only 진입4파일은 최종 선택 원본과 byte동일하게 반영했으며 최종 Git commit 원격 CI에서 전체 재빌드 예정.

- 태스크7 부모 승인: 현재/역사 기록 구분과 보고서 사실 검토, 상태문서 역변환 및 최종 선택 구현파일 일치 독립 확인. 선택 커밋/공개 배포 단계 진행.
