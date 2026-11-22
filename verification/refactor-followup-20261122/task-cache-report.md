# 공개 진입점 캐시 연결 보완

실제 기존 import 문자열을 확인하고 네 파일의 다섯 참조를 refactor-followup1로 맞췄습니다.
- start.html → browser-generation/progress.js
- location-loader.js → browser-generation/progress.js
- app.js → location-loader.js, building-assets/editor.js
- building-assets/editor.js → scene-edit-store.js

apply-task-cache.py는 현재 파일이 이전 단계의 정확한 결과 또는 이미 적용한 결과일 때만 진행하는 재실행 가능한 변환입니다. 외부 변경이 새로 끼어들면 덮어쓰지 않고 실패합니다. cache 변환과 Task4 변환을 역순으로 되돌려 working은 baseline-originals, selected는 HEAD와 정확히 일치함을 검증했습니다. app/start의 selected 스냅샷을 갱신했고 기존 index selected는 유지했습니다. app의 외부 Codex imports/install/merge와 start 외부 import 등 기존 변경은 working에 그대로 남고 selected에는 포함되지 않습니다.

scene-editor, browser-generation, generation-task 실제 검사와 location-loader/editor/selected app 문법, diff 검사를 모두 통과했습니다. 재현 스크립트 두 번째 실행도 통과했습니다. 상세 명령/결과는 task-cache-checks.json, 보존 증명은 task-cache-preservation.json, 선택 파일 해시는 task-cache-changed-files.json에 있습니다.

Task6의 오래된 두 실패 검사도 다시 조사했습니다. 직접 및 전이 local import와 catalog 총 12개 입력을 추적했고 git diff HEAD 결과가 비어 있음을 확인했습니다. 이 검사들은 app/preview-engine/thumbnail-queue를 읽지 않습니다. asset-encyclopedia의 추가 GLB traversal 역시 이번 태스크에서 GLB를 수정하지 않았습니다. task-6-legacy-test-inputs.json에 입력 목록과 근거를 기록했으며 카탈로그와 검사 기대값을 바꾸지 않았습니다.

Task7 문서 작업, stage/commit/push/배포는 시작하지 않았습니다.
