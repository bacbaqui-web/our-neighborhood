# Task 2 report — DONE

## 요구사항과 구현
- work/arterial_crossings.py가 순수 입력/결과 함수 build_exit_landings, build_crosswalks 및 기존 기하 helpers를 소유한다. 지도 취득, 지형 취득, 파일 저장, 전체 시설 배치 조율은 arterial_plan.py에 유지했다.
- 출입구 입력은 deep copy하여 원본/수동 속성을 수정하지 않는다. 빈 면, 다중/복합 면, 구멍, 너무 작은 면은 접근면 생성만 생략하고 qa.skippedLandings에 id/reason/geometryType/empty를 기록한다. 원본 시설 exits는 보존한다. 정상 장면의 JSON 형태를 유지하려고 생략이 있을 때만 새 QA 필드를 추가한다.
- 기존 skippedCrosswalks 의미와 기하 수치/순서를 유지. 교차로 모듈이 공통 면·보호 시설을 소비하고 패치 영역을 최종 소유하는 계약을 docs/runtime-architecture.md에 기록했다. 교차로 규칙/형상 변경 없음.
- pack.py에 새 모듈 연결 및 sources.json 재생성(53files), .gitignore 정식 소스 등록 허용, CI 신규 검사 추가.

## 검사와 근거
- task-2-before.json: 기존 loop의 MultiPolygon.exterior AttributeError 실제 재현. 구멍 pad를 단일 외곽선으로 내보내던 상태도 확인.
- task-2-parity.json: 부모 정상 전체 arterial fixture와 정확히 동일. 정상 출입구 전체 반환 JSON(삼각형 순서·높이 포함)도 기존 loop 결과와 동일.
- 신규4검사: 빈/다중/구멍/작은 면, 정상 flat 면적/높이, 복합경사의 pad 수평/주변 지형 추종/공유점 높이 일치, 실제 전체 build에서 mapped exit 보존 및 disconnected 접근면 QA.
- task-2-checks.json의9명령 모두 통과: 신규 landing4, 기존 crossing3, junction11, road first buildings, generation module boundary, pack53, browser contract, junction placement, diff whitespace.
- 외부 baseline20개 SHA차이0. 커밋/스테이지/푸시 없음.

## 제한
- synthetic full build는 map/terrain acquisition만 고정하고 기하 경로를 실제 실행했다. 공개 실제 지도 신규생성/경사 실사용 확인을 대신하지 않는다.
- 새 순수 함수는 현재 확정된 alignment/terrain 콜백을 명시적으로 받는다. 모든 arterial 기능을 한 번에 재작성하지 않았고 transit 배치/메시/소품 책임은 기존 조율 함수에 남는다.
- 변경 목록 task-2-changed-files.json. 다음 태스크 착수하지 않음.
