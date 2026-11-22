# Task3 — 이미지 로드 오류 전달·제한 재시도

## 근거와 변경
부모 loading-diagnosis.json에서 공개 사람 webp 차단 시 TextureLoader가 message 없는 IMG error Event를 reject하고 기존 app catch가 undefined를 표시하는 경로가 재현됐습니다. 자연 coldload는 정상이므로 최초 한 번의 네트워크/디코드 세부 원인을 소급해 단정하지 않습니다.

texture-loading.js의 loadTexture는 기존 loader.loadAsync를 최대2번 호출하고 실패를 성공으로 숨기지 않습니다. 성공1회면 즉시 반환하며 첫 실패만 추가1회 시도합니다. 최종실패는 URL pathname의 마지막 파일명과 한국어 안내를 포함한 Error(message,{cause})입니다. 사용자명·호스트·query/hash는 문구에 포함하지 않습니다. modern JS guidance의 원인 보존 방식을 적용했고 새 의존성/대기 타이머는 없습니다.

사람·식물·나무 atlas loader에 적용했습니다. 사람의 기존 allSettled 정리를 유지했고 식물 및 나무 배치는 allSettled 뒤 성공 texture를 dispose하고 실패를 전달합니다. 나무 frames fetch/JSON 처리 실패는 해당 texture를 즉시 정리합니다. texture 설정, 계절, 경로 및 PNG→WebP 정책은 유지합니다. app 최초 catch는 non-Error에도 안전한 한국어 안내를 사용합니다.

## 캐시와 선택본
index→app, app→pedestrians/vegetation/hybrid-tree, hybrid-tree→category nature의 cache query를 texture-load1로 갱신했습니다. 새 helper는 공개 manifest에 포함했습니다. Worker bundle은 이 이미지 loader 경로에 의존하지 않아 --check가 그대로 통과했고 묶음 변경은 없습니다.

공유 app/index의 정확한 HEAD 대비 치환은 task-3-shared-replacements.json입니다. working은 fresh baseline 원문에, selected 스냅샷은 현재 HEAD에 해당 치환만 적용했습니다. 역적용 시 각각 baseline/HEAD 바이트가 동일하며 foreign bridge 변경은 working에 보존되고 selected에는 없습니다. staged13 patch도 동일합니다.

## 검사
texture-loading 검사는 정상1회, transient2회 성공, persistent2회 실패, 원본 Event cause, filename 표시와 query/credential/hash 비노출, non-Error fallback을 확인했습니다. 실제 소비자 함수를 불러와 Three TextureLoader 경계만 stub하고 사람/식물 배치 성공 texture 정리, 나무 frames 실패 정리, 일부 species 실패 시 나머지 성공 texture 정리를 확인했습니다.

새 검사, 기존 백과2개, browser-generation-build, full-detail, working/selected app 문법과 diff 검사가 모두 통과했습니다(task-3-checks.json). CI에 새 검사를 연결했습니다. 공개 fault injection과 실제 화면 확인은 부모가 선택 배포 후 같은 장면에서 수행합니다. 코드 commit/index 변경은 하지 않았습니다.
