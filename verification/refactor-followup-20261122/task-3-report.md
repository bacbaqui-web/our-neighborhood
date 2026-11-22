# Task 3 report — DONE

## 구현
- 표준 package API work/neighborhood_generation/__init__.py + GenerationContext(source,output,origin,radius), generate(context,start) 추가. 기존13개 원본은 같은 폴더에 유지.
- package __path__만 기존 source/geometry/work 원본을 가리킨다. site_layout은 env 설정·sys.path 변경·generic module cache 삭제 없이 명시 pipeline을 호출한다.
- build/infill import-time 실행을 build(context) 내부로 이동. RNG와 누적 배열/장면 IO는 호출 로컬. 후속 stage 자동 import/호출을 제거하고 pipeline이8단계를 명시적으로 실행. 기존 중간파일/최종 JSON 계약 유지.
- 13개 house-plots wrappers는 5줄 compatibility adapter. CLI 환경변수 해석은 legacy.py에만 유지. canonical script 직접 실행도 adapter 사용. 기존 무출력경로 local CLI의 rule_evidence는 별도 subprocess로 생성하여 전역 import 상태를 오염시키지 않는다.
- 각 stage는 QA를 반환. context.radius는 기존 float 출력100.0 계약을 보존. sources.json은 package/context/pipeline/legacy를 포함해57개.
- 기존 CI test_generation_module_boundary 명령이 새 실제5검사를 실행하므로 workflow 중복 명령 추가 없음.

## 검사
- task-3-parity.json: 이전 작은 fixture package bytes/SHA5de65f31d6205460e6010f807edfbac9ab401e323836ade0e4cf52e348bac468 동일.
- tracked 미아동5개 입력으로 만든 전체100m site-layout bytes/SHA c96691c7b4faa876d7f367e1c65bfdfb4c88b322052d5ee63bbca952675617b0 동일.
- 실제5개 boundary 검사: fresh import의 무생성/환경변수 무시; 실제 작은 A→확정층수 다른 B→실패 입력→A 반복 및 외부 module/env/path 보존; 기존 infill wrapper 동일 출력/parking 함수 호환; 실제 지도100m A→80m B→100m A byte 동일; fresh process의 full legacy build CLI(테스트의 sys.path 없이) 동일 출력. bundle/정식 소스 일치도 포함.
- task-3-checks.json의7명령 모두 통과: boundary, generation scope, scene edits, alley housing, pack57, browser contract, diff check.
- foreign tracked20개 SHA차이0. stage/commit/push 없음. task-3-changed-files.json 참조.

## 확인된 제한
- 기존 site_geometry.py의 json.load(open(...))에서 ResourceWarning이 출력된다. 이번 변경 이전 코드이며 실제 출력/반복검사는 통과했다. 원본 기하 구현 변경 범위를 늘리지 않았다.
- 중간 결과는 기존 파일 계약을 유지한다. 이번 작업은 전체 in-memory 재작성이나 병렬 동일 출력폴더 실행 지원이 아니다. 독립 output context의 순차 호출을 검증했다.
- 실제 공개 Pyodide 신규/편집 전체 실행은 최종 브라우저 확인 단계에서 검증해야 한다.
