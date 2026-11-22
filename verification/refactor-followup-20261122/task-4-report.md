# Task 4 report — DONE

## 구현
- viewer/render-loop.js: invalidation, camera projection/world 변화, weather24fps, stream >80ms, ResizeObserver 및 change/click/input/visibility 이벤트 수명 소유. app은 navigation/weather/stream/beforeRender/render/state 콜백을 주입. 렌더 순서와 기존 document.hidden/benchmark pause 유지.
- 초기 요청 true로 시작하므로 controller 설치 이전 requestRender는 첫 프레임에서 반영. 기존 loaded/meshes 선언 전 animation callback 등록 순서를 유지했고 callback 실행은 다음 프레임. dispose 후 late frame/resize 차단. non-persisted pagehide에서만 dispose하여 bfcache 복원 동작을 유지.
- viewer/terrain-index.js: 기존 수식과 순서 그대로 coordinate conversion,5m triangle index,elevation 최고면,roadInfo 첫 road/path 면 분리. 배경 fallback callback, elevation 함수 속성 호환.
- viewer/scene-resources.js: commercial/shops/streetlights,street/detail groups,building geometry/material cleanup 분리. 공유 textures 해제 없음. material array도 같은 개별 material dispose 규칙 적용.
- 3개 새 모듈 publication-files에 연결. index app cache v=refactor-followup1. CI viewer-lifecycle 검사 연결.

## 공유 파일 보존과 공개 선택본
- apply-task-4.py와 task-4-replacements.json이 exact reversible transform을 기록.
- working app/index reverse == baseline 원문, selected app/index reverse == HEAD 원문 전부 true. 다른 외부18개 SHA 동일.
- selected/outputs/domestic-test/app.js 및 index.html이 외부 Codex 코드 없는 공개본. 부모는 이 선택본을 사용해야 함.
- index foreign patch를 selected에 얹으면 working과 동일. app은 giant build line의 외부/본인 변경이 같은 문맥에 있어 기존 foreign unified patch 직접 적용 불가; exact 역변환으로 외부 원문 보존을 검증했다. task-4-preservation.json 참조.

## 검사
- task-4-checks.json의10명령 통과. 신규 실제 callback 검사: frame순서, strict80ms,weather24fps,manual/camera/projection/resize/events invalidation,pause/resume,dispose late callbacks. Terrain은 overlapping heights,edge,road class/order,heading,fallback/NaN,world transform,reindex,degenerate,caller metadata,coordinate conversion 검사. Resource는 group/lamps/material/geometry release 검사.
- 기존 scene-budget, view-generation-visibility,full-detail,scene-editor(saved/manual edits),loading,browser contract 통과.
- working/selected app 문법 통과. selected static relative imports66개 모두 존재/공개명세 포함, Codex imports/merge 없음.
- git diff --check 통과. stage/commit/push 없음. 실제 화면은 부모 최종 공개 검증 단계에서 확인.

## Modern Web Guidance
manage animation lifecycle와 pause background rendering을 검색하고 efficient-background-processing을 읽었다. 이 가이드는 content-visibility:auto 영역의 중단/재개용이며 현재 고정 전체화면에는 적용되지 않아 새 CSS/API를 추가하지 않았다. 기존 document.hidden 정책을 보존했다.
