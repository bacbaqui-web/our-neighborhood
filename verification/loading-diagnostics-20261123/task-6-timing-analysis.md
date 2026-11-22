# Task6 — 실패 이미지 ResourceTiming 부재 분석

public-files.json에서 공개 loading-diagnostics/texture-loading가 선택 파일과 일치함을 확인했습니다. public-http404.json은 image-event2회,60success/2fail, dropped0이며 첫 실패 이후 두 번째 시도9.053초 동안 첫 실패 timing도 null입니다. 부모가 HTTP200 손상 이미지에서도 timing=null, 같은 문서 resource 목록에서 대상 이미지가 []임을 확인했습니다.

## 확정 가능한 부분

texture-loading은 HTMLImage/TextureLoader를 사용하므로 직접 Response.status를 받지 않습니다. 따라서 이미지 이벤트의 httpStatus=null은 의도된 결과이며 주입404를 자동 알 수 있는 구조가 아닙니다. timing.responseStatus는 브라우저가 ResourceTiming entry를 제공할 때만 가능합니다. 62회 추적 호출과 dropped0은 token160/event80 상한 때문에 이번 기록이 빠졌다는 가설을 지지하지 않습니다.

현재 공개 resource 목록에 대상 entry가 없다는 것은 현재 전역 ResourceTiming 버퍼에서 조회되지 않는다는 증거입니다. Fetch.fulfill·실패 이미지·브라우저 구현 제약 또는 버퍼 제한 가능성을 구분하지 않고 ‘404/디코드 원인 확정’으로 해석하면 안 됩니다.

## 확인된 조건부 계측 사각지대

attach(entries)는 token.event가 아직 없으면 해당 entry를 버립니다. event는 loader reject 후 end에서 만들어집니다. observer가 IMG error보다 먼저 entry를 전달하고, 기본 전역 resource 버퍼에는 그 entry가 보관되지 않은 경우 이후 flush/getEntriesByName으로 복구할 수 없습니다. buffered observer를 썼다는 사실만으로 이 경우를 막지는 못합니다.

코드 변경 없이 fake observer를 호출하는 read-only 재현을 실행했습니다: begin → observer에 일치404 entry 전달 → end(image-event), getEntriesByName=[] 조건에서 최종 timing=null입니다. 이는 조건부 계측 정보 손실을 증명하지만 공개404/200 시험에서 실제 그 순서가 일어났음을 증명하지 않습니다.

finish는 최종 flush 직후 observer를 끊고 tokens를 비웁니다. 종료 뒤 timing이 도착하면 수집하지 못하는 두 번째 경계도 있습니다. 그러나 공개 첫 시도는 후속9초 동안 세션이 살아 있었으므로 final 직후 종료 경합만으로 두 시도의 null을 모두 설명하기 어렵습니다.

## 원인 구분을 위한 최소 확인점

- 제어실패 중 별도 일회성 resource observer에서 대상 entry를 받은 횟수와 callback 시점만 관찰합니다. raw URL을 저장하지 않고 대상 여부 boolean과 숫자만 비교합니다. observer0/getEntries0이면 브라우저/주입 경로에서 미제공 가능성을 지지합니다.
- observer>0/getEntries0이면 전역 버퍼만으로 판단할 수 없습니다. 콜백이 error/end보다 먼저였으면 위 사각지대, 종료 뒤였으면 finish 경계입니다.
- entry가 있으면 요청과 정확한 name 일치 여부 및 startTime이 attempt start/end 구간에 들어가는지 숫자로 비교합니다. source query가 실제 이미지 요청과 달라졌거나 browser retry가 별도 요청으로 잡혔는지도 URL 원문 저장 없이 equality로 확인할 수 있습니다.
- resource 전체 개수/기본 버퍼 상한 근접 여부는 참고 증거입니다. 진단을 위해 전역 timing 버퍼를 지우거나 크기를 바꾸지 않습니다.
- 일시404 뒤 실제 성공은 recovered 이벤트와 성공 entry를 비교할 수 있지만, 성공 entry만 있다는 사실로 앞선 실패 원인을 단정하지 않습니다.

이번 단계는 코드/index 변경 없이 조사와 이 보고서만 작성했습니다. 실제 공개404/200의 timing 부재 원인은 아직 확정하지 않았습니다.
