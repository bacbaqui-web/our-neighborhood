# Task3 — 최종 선택본 읽기 전용 검토

선택 tree eafe0dd8ab949521ef9a9388b2c8a456925fa0fb와 /tmp/neighborhood-diagnostics-selected의 최종 코드를 검토했습니다. manifest14개 파일 해시가 검사 fixture와 일치합니다. 배포를 막는 문제는 발견하지 못했습니다.

- 저장 schema를 직접 확인했습니다. 고정 단계·분류·허용 파일명과 제한된 숫자만 직렬화하며 raw URL, query/hash/credentials, sceneID/주소/좌표, 임의 error 문자열/객체는 저장하지 않습니다. local 저장 입력도 허용 필드로 재구성합니다. 외부 요청·전역 fetch 패치·UI는 없습니다.
- 진단 호출은 내부 safe 경계로 실패를 격리합니다. load-data 기존 retry2회, cache 옵션, timeout, JSON/바이트/GLB 검증과 반환·예외를 유지합니다. JSON SyntaxError와 body 전송 TypeError를 구분하고 image timing 부재/0값으로 원인을 추정하지 않습니다.
- raw 단조시간 구간으로 시도별 timing을 매칭하며 epoch와 표시시간 범위를 분리합니다. stage history6개·세션3개·이벤트80개·24KiB 및 token160개 제한, 정상 observer 무저장, 이전/종료 후 observer 무시를 검토했습니다. ResourceTiming이 브라우저에서 제공되지 않는 경우 null이 남는 한계는 의도적으로 유지합니다.
- 선택본에서 loading-diagnostics, 기존 check-loading, publication-references를 직접 재실행해 모두 통과했습니다. 공개 참조1602 inputs/2200 refs이며 기존 명시적 예외2개만 있습니다.
- 선택 app/start에 Codex bridge 외부 기여가 없고 실제 staged binary patch는 baseline과 같습니다.

기록 정확성의 공개 확인은 부모가 cache-disabled cold3회 및 HTTP404/HTTP200 invalid image/회복 조건에서 이어서 수행합니다. 과거 최초 실패 원인은 이 코드 검토로 확정하지 않습니다. 코드·index·기존 문서는 변경하지 않았고 이 보고서만 작성했습니다.
