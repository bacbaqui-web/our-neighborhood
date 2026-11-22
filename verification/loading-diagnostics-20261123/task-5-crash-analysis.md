# Task5 — 세 번째 cold load renderer crash 읽기 전용 분석

## 관찰된 사실

cold-1.json과 cold-2.json은 cacheDisabled/freshDocument=true, ready,69success/0fail이며 각각39.243초/31.338초입니다. 부모가 세 번째 시도에서 Edge의 실제 renderer crash 화면과 오류코드5를 확인했습니다(cold-3-browser-crash.png). 부모가 확보한 마지막 기록은 image-assets969ms, shared-models2409ms를 지난 scene-build/running,62success/0fail입니다. 이 숫자는 추적한 data/texture helper 호출의 결과이지 모든 GLTF/JS/GPU 작업 성공을 의미하지 않습니다.

이 실패는 이전 message 없는 IMG Event가 app catch로 전달된 실패와 다릅니다. JS catch의 정상 final-error 처리 없이 renderer가 종료됐기 때문에 running 기록이 남는 것은 설계와 일치합니다. 코드5만으로 SIGTRAP/잘못된 URL/메모리 등 원인을 확정할 수 없습니다. 부모가 OS DiagnosticReports에서 Edge 보고서를 찾지 못했고 crash 후 전역 free74%를 확인했다는 사실도 순간 renderer/GPU 자원 부족의 증명이나 배제 근거는 아닙니다.

## 코드 비교

공개 소스2f3f33ca를 기준으로 검토했습니다. 앞선 ab7f29f 대비 viewer/render-loop, viewer/scene-resources, illustration-renderer, grade1-street/placement에는 diff가 없습니다. 선택 공개 app은 foreign Codex build 호출이 없으며 정상 초기 await build 호출은 한 곳입니다. 새 document 세 번을 같은 JS 객체의 build 재진입 세 번으로 해석할 근거는 없습니다.

새 진단 코드는 GPU 리소스·geometry·이미지·장면 객체를 보관하지 않습니다. URL 토큰 최대160개, 세션3개/24KiB, 이벤트80개이며 정상 성공 토큰은 즉시 제거합니다. 정상 observer batch는 persist하지 않고 단계/종료에서만 직렬화합니다. cold1/2는 events[]/dropped0이고 오류 없이 완료했습니다. 새 진단의 대량 누적이 확인됐다는 증거는 없습니다. 다만 새 코드가 CPU 실행 순서/작은 할당·스케줄링을 바꾸는 영향 자체를 분석만으로 완전히 배제할 수는 없습니다.

## 기존 경로의 위험 후보 — 원인으로 확정하지 않음

1. scene-build가 큰 동기 기하/재질 작업을 포함합니다. details/shops/alleys/아파트/식물/그림자 생성과 여러 JSON.stringify 보고서 생성, applyStyle 전 장면 순회가 이어집니다. cold1은 scene-build 진입11.730초→ready39.243초로 이 구간에27.513초가 포함됩니다. 단일 구간 기록만으로 그 안의 정확한 실패 연산을 알 수 없습니다.
2. build 중 createGrade1Props 등 await 경계가 있고, render-loop의 pause 조건은 benchmarking이며 loaded/building을 직접 막지 않습니다. 따라서 아직 조립 중인 장면이 프레임에 그려져 GPU 버퍼/재질을 일찍 준비할 가능성은 기존부터 있습니다. 이 사실만으로 경쟁조건·crash를 확정하지 않습니다.
3. 기존 renderer는 antialias/preserveDrawingBuffer, pixelRatio 최대2,4096×4096 shadow와 color HalfFloat/surface Float/finished 다중 render target, 최대4 MSAA를 사용합니다. geometry/texture와 함께 순간 GPU 메모리·명령 부담 후보입니다. 실제 crash 순간의 GPU 메모리/driver stack/renderer heap 측정이 없어 OOM이나 드라이버 결함으로 단정할 수 없습니다.
4. scene-resources는 기존 geometry/material 수명을 정리하고 공유 texture는 임의 해제하지 않습니다. 재빌드 시 _originalMaterial과 특수 객체 자원을 모두 완전히 처리하는지 별도 수명 감사 여지는 있으나 이번 cold 문서 전환에서는 같은 context 재빌드 누적이 확인되지 않았습니다. pagehide는 renderLoop만 명시 종료하고 renderer/illustration GPU context는 document teardown에 맡기는 기존 구조입니다. 연속 새 문서에서 브라우저의 실제 context 회수 시점은 이번 증거로 알 수 없습니다.

## 지금 가능한 결론

이미지 로딩은 세 번째 시도의 image-assets 구간을 통과했고, 마지막 추적 실패 카운터는0이었습니다. crash는 scene-build 진행 중으로 범위가 좁아졌지만 CPU/GPU/driver/브라우저/기존 자원 피크 중 무엇인지 미확정입니다. 최초 이미지 Event와 동일 원인이라고 묶거나 진단 모듈 때문에 발생했다고 단정할 근거가 없습니다. 부모의 정상 복구·HTTP404/HTTP200 이미지 실패 비교는 별도로 계속할 수 있습니다.

추가 원인 구분에 도움이 되는 자료는 동일 장면의 crash 재현 여부, crash 순간 renderer/GPU 프로세스 정보와 브라우저 crash 기록, scene-build 내부의 어느 경계까지 갔는지입니다. 현재 요청은 조사만이므로 새 계측·설정 변경·자원 정책 변경은 하지 않았습니다. 코드·index·저장 데이터는 수정하지 않았고 이 문서만 작성했습니다.
