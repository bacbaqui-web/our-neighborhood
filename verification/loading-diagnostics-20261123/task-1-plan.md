# Task1 — 브라우저 내부 로딩 진단 최소 설계

## 현재 근거와 한계

texture-loading.js는 이미지당 최대2회 시도하고 최종 실패를 파일명 있는 Error와 cause로 전달합니다. load-data.js는 fetch/HTTP/JSON/바이트/GLB 검증을 최대2회 시도하며 두 번째 fetch는 cache:reload입니다. app은 초기 데이터 Promise.all → 사람/식물/나무 이미지 → 공용 모델 → build → ready 순서이며 하나의 catch에서 사용자 오류를 표시합니다. 현재는 어느 단계/시도/자원이 실패했는지 재열기 뒤 확인할 제한된 기록이 없습니다.

이전 loading-diagnosis.json의 자연 coldload는 정상이었습니다. 사람 webp를 통제 차단했을 때 message 없는 IMG error Event와 undefined 표시 경로는 재현됐고 이후 수정했습니다. 이것은 최초 실패의 네트워크·디코드 세부 원인을 증명하지 않습니다. public-recovery/public-final의 복구 확인도 최초 원인을 소급해 확정하지 않습니다.

## 최소 구조와 저장 범위

브라우저 전용 loading-diagnostics.js 하나를 두고 app의 초기 로딩 세션, texture-loading의 시도, load-data의 단계별 실패만 연결합니다. 전역 fetch/ImageLoader를 패치하거나 콘솔·모든 오류를 수집하지 않습니다. runtime의 기존 반환/예외/재시도 횟수·타이밍은 유지합니다. 새 서버/API/전송/원격 수집은 없습니다.

sessionStorage의 전용 키에 최근3세션, 세션당80이벤트, 직렬화 총24KiB 상한으로 보관합니다. 탭의 새로고침 뒤 이전 실패와 새 성공을 비교할 수 있고 영구 localStorage나 실제 동네 IndexedDB를 사용하지 않습니다. 초과 시 오래된 세션/이벤트를 먼저 버리고 droppedCount만 남깁니다. 세션 시작·단계 변경·실패·재시도 회복·종료에서만 기록하고 정상 이미지 전체를 이벤트로 쌓지 않습니다. 필요한 성공 시도 수는 고정 카운터로 합칩니다. 무작위 로컬 세션ID와 시간만 가지며 장면ID/주소/좌표와 연결하지 않습니다.

모든 storage 읽기/파싱/쓰기, performance 조회, navigator 접근은 독립 try/catch로 실패를 무시합니다. 읽은 객체도 필요한 고정 필드만 선택하고 형식·길이·개수 상한으로 재구성합니다. 저장 불가 시 메모리 제한 기록만 유지합니다. 진단 객체를 만들거나 기록하다 실패해도 원래 로딩의 성공/실패를 바꾸지 않습니다. ResourceTiming은 지원되는 브라우저에서 세션 수명에 한정한 PerformanceObserver({type:"resource", buffered:true})로 받습니다. 초기 resource 버퍼 한도에 대한 의존을 줄이되 이미 사라진 entry의 복원을 보장하지 않습니다. 세션 시작 이전 항목은 제외하고 추적 중인 요청에 해당하는 정제된 숫자 필드만 제한 메모리 맵에 보관합니다. raw URL/entry는 저장하지 않습니다. 완료·실패 시 takeRecords 처리 후 disconnect하며 늦은 콜백은 무시합니다. observer가 없거나 observe가 실패하면 getEntriesByName의 현재 버퍼 조회로 대체하고 timing 부재는 허용합니다. 전역 resource timing 버퍼 확대/clearResourceTimings는 하지 않습니다.

## 저장할 필드

- 세션: schemaVersion, 로컬 세션ID, 시작시각, elapsedMs, running/ready/failed 상태, 마지막 고정 단계, droppedCount. 탭 닫힘이나 중단을 실패로 추정하지 않고 running으로 남겨 구분합니다.
- 단계 enum: location, scene-data, image-assets, shared-models, scene-build, ready. 각 await 경계에서 표시하며 병렬 요청에는 고유한 로컬 request 번호와 data/texture kind를 부여합니다.
- 실패·회복 이벤트: 상대시각, request 번호, 고정 단계, 허용된 asset label, attempt 1/2, outcome(error/recovered/final-error), 경과시간, online boolean 또는 unknown.
- 실패 분류는 고정 enum만: image-event, timeout, abort, http, json-parse, length-mismatch, glb-invalid, network-or-policy, other. load-data는 오류문자열 분석 대신 현재 처리 위치와 실제 HTTP 상태로 분류합니다. Error.name 역시 허용 목록에 해당할 때만 분류하고 임의 name/message/stack/cause/DOM 대상은 직렬화하지 않습니다.
- ResourceTiming 선택 필드: 해당 시도 시작 뒤 일치하는 최신 entry의 duration, responseStart/responseEnd 상대값, transferSize, encodedBodySize, decodedBodySize, 지원되는 경우 responseStatus, 고정 initiatorType. 유한·비음수 값만 한정 범위로 저장하고 지원되지 않거나 찾지 못하면 null입니다.

## 파일명과 비밀값 차단

호출 인자의 URL은 저장하지 않습니다. texture 대상은 허용된 동일 출처 정식 people/vegetation 자산 경로에서 추출한 짧은 정적 파일명만 기록합니다. 허용된 루트/파일명 패턴을 벗어나거나 blob/data/외부 origin이면 texture-other라는 고정 라벨을 씁니다. loadData는 GLB·buildings·parcels·terrain 등 기존 고정 파일 종류를 whitelist로 매핑하고 저장 동네 경로/식별자는 버립니다. 파일명도 자유 문자열로 신뢰하지 않으며 길이 상한과 허용문자/확장자를 적용합니다. query/hash/username/password/호스트/디렉터리/주소/좌표/장면ID는 저장하지 않습니다.

ResourceTiming의 entry.name은 요청 시도와 매칭할 때만 메모리에서 사용하고 기록에 포함하지 않습니다. PerformanceEntry.toJSON()을 저장하지 않고 위 숫자 필드만 추출합니다. 진단 read API도 원시 error/URL 객체를 노출하지 않고 정제된 스냅샷만 반환합니다.

## 구분 가능한 것과 단정할 수 없는 것

HTTP 상태가 있으면 서버 응답 실패를 구분하고, 명시적 Abort/Timeout 또는 JSON/GLB 검증 위치는 구분할 수 있습니다. 첫 이미지 실패 후 두 번째 성공이면 transient 회복이 확인됩니다. 이미지 Event와 timing 없음/상태0만으로는 DNS·연결·CORS·차단·이미지 디코드 실패를 구분할 수 없습니다. transferSize0도 메모리캐시·제한된 timing·실패일 수 있어 캐시 적중이라고 단정하지 않습니다. navigator.onLine=true는 인터넷 연결 성공을 보장하지 않습니다. 이 경우 image-event 또는 network-or-policy 및 미확정으로 남깁니다. 원인 확인을 위해 이미지를 추가 fetch/decode하거나 별도 요청하지 않습니다.

## 구현 전 완료 기준과 실패 주입

1. 기존 texture/data 정상·재시도·실패 계약 및 자원 정리 테스트를 그대로 통과.
2. 가짜 clock/storage/performance 경계에서 실패1→회복, 실패2→final, 단계/attempt 기록과 요청별 timing 매칭을 확인.
3. query/hash/credentials/주소/좌표가 들어간 입력, 임의 error.message/name/cause, 외부 URL, blob URL로도 저장 JSON에 비밀값이 없음을 확인.
4. Storage getter/setItem 예외, malformed JSON, 거대 기존 기록, performance/navigator 접근 실패, 상한 초과에도 로딩 결과 불변과 제한크기 확인.
5. 실제 브라우저의 통제 이미지 실패와 재시도 회복 후 새로고침에서 이전 세션 기록을 읽고, 최종 정상 사용과 추가 네트워크 전송 없음 확인. 최초 자연 실패의 원인을 소급 확정하지 않음.
6. 새 helper 공개 명세·nature model-source 도달 여부·bundle 영향·캐시 진입점과 공유 app 외부 변경 보존을 검사. 접근 가능한 진단 스냅샷은 개발자 검사 용도이며 별도 UX/서버 기능으로 확대하지 않음.

이번 단계는 조사와 계획 문서만 작성했습니다. 코드·검사·index는 수정하지 않았습니다. 부모의 현대 web guidance 검토와 단계 승인을 기다립니다.

## 부모 공식 문서 확인 반영

[W3C Resource Timing](https://www.w3.org/TR/resource-timing/)에 따라 CORS/CSP 등 fetch 선행 조건 실패는 timing entry가 없을 수 있습니다. 0/null/없음은 네트워크 원인 확정 근거가 아닙니다. [MDN transferSize](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize)의 설명대로 transferSize0만으로 캐시 여부를 판정하지 않습니다. 이번 기록은 cache 판정을 만들지 않고 숫자와 부재를 그대로 남깁니다. 부모의 modern-web 검색 두 번에서 이 진단에 직접 맞는 가이드는 찾지 못했고, 위 공식 문서의 제약을 적용합니다. observer buffered 콜백/종료 후 늦은 콜백/미지원 fallback도 실패 주입 검사에 포함합니다.
