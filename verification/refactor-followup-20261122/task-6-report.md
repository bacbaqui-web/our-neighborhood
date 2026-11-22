# Task 6 — 에셋 백과 미리보기 수명 분리

## 결과
- preview-engine.js로 기존 카메라, 조명, framing, 삼각형 계산, 시간/선 설정과 renderer/controls/observer/model 수명을 옮겼습니다. 실제 Three 객체를 그대로 사용하며 GPU·브라우저 경계만 주입할 수 있습니다.
- thumbnail-queue.js가 단일 renderer, 직렬 대기열, FIFO 최대 150개 캐시와 목록 버전을 소유합니다. app은 목록/filter/history/review UI와 상세 detailVersion을 유지합니다.
- 새 목록으로 바꾼 뒤 늦은 모델은 release, 오래된 observer callback은 무시합니다. dispose는 idempotent이며 종료 후 resize/control 콜백은 draw하지 않습니다. 엔진 종료 후 전달된 모델도 release합니다.
- persisted pagehide는 유지하고 실제 종료에서 상세 및 썸네일 자원을 해제합니다. 모델 provider/ID/registry/policy/공유 texture 해제 규칙은 바꾸지 않았습니다.
- index app cache v를 refactor-followup1로 올렸습니다. 해당 백과 파일들은 시작 baseline dirty 대상이 아니었습니다. 새 공개 파일 2개와 CI 검사 연결을 추가했습니다.

## 검사
- 새 lifecycle 검사: 실제 deferred 모델을 이용한 빠른 목록 교체, 늦은 모델 해제, 오래된 observer, queued work 취소, 실패 후 다음 모델, 캐시 재사용, renderer 1개, 종료 1회. 실제 Three BoxGeometry framing 크기/12삼각형과 늦은 resize/control 콜백 및 종료 후 모델 전달 검사 통과.
- asset-filter-state: 현재 visible 393개와 누적 필터 통과.
- housing-encyclopedia: three-loader를 사용해 실제 모델 6종 검사 통과. 최초 loader 없는 호출은 ERR_MODULE_NOT_FOUND였고 올바른 loader로 재실행했습니다.
- asset-category-ownership: 1023개 분류/소유권/기존 필드 보존 검사 통과.
- app 문법 및 git diff --check 통과.
- 오래된 asset-encyclopedia.mjs 실패: 현재 카탈로그에 없는 개별 GLB coverage(8행). asset-encyclopedia-lines.mjs 실패: remade 기대 18 / 실제 55(11행). 두 검사는 app/추출 모듈을 import하지 않고 변경하지 않은 카탈로그/remakes/모델 데이터를 검사합니다. 이번 책임 분리와 관련 없는 기존 기대값을 임의 수정하지 않았습니다. 공개 소유권 검사는 별도로 통과했습니다.

## 보존과 범위
baseline tracked20 중 Task4에서 의도한 메인 app/index만 차이가 있고 나머지18 파일은 baseline 해시와 같습니다. Task6는 메인 app/index/start와 registry/provider를 수정하지 않았습니다. stage/commit/push/공개 배포는 하지 않았으며 부모의 통합·선택 배포 검증을 기다립니다.

modern-web-guidance는 이전 태스크에서 확인한 client lifecycle/cancellation 지침 범위를 유지했고 새 API/의존성/CSS/레이아웃을 추가하지 않았습니다. 공개 실제 렌더 외관 확인은 부모 최종 브라우저 단계에서 진행합니다.
