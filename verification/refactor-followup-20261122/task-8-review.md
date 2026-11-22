# Task8a — 최종 선택 트리 읽기 전용 검토

검토 트리: ecc0fc46aa13cfff10217afa81a756cf8c2749ea
기준: e114779208625dd31d1cc28537d865d218c8ca9b

배포를 막는 문제를 찾지 못했습니다.

- /tmp/neighborhood-followup-final-index의 tree가 review-tree-final.txt와 일치합니다. HEAD 대비 변경 97개가 selected-commit-paths.json의 집합과 정확히 같습니다.
- selected-changes-manifest.json의 실제 변경 파일 69개 모두 트리 blob SHA-256과 일치하며, /tmp/neighborhood-followup-selected의 검사 fixture와 바이트가 같습니다. 나머지 28개 선택 파일은 계획·보고·검사 증거입니다. 코드 누락 또는 검사하지 않은 다른 runtime 파일 추가는 없습니다.
- 작업 폴더의 baseline tracked 20개에 Task4/cache/Task7 변환을 역순 적용하면 원본 baseline 해시와 모두 일치합니다. 선택 트리에서 같은 변환을 역적용하면 각 파일이 HEAD 원문과 정확히 같습니다. 외부 문서 기여와 Codex bridge 변경을 함께 넣지 않았습니다.
- 현재 실제 Git staged patch는 baseline-index.patch와 바이트가 같습니다. 다른 대화가 stage한 13개 파일을 그대로 보존했습니다.
- HEAD 대비 선택 경로에 codex 관련 파일 및 docs/project-guidelines.txt가 없습니다. 선택 app/start에는 codex-bridge, mergeCodexEdits, installCodexBridge가 없습니다.
- 선택된 outputs JavaScript 파일은 모두 publication-files 목록에 있습니다. 신규 preview-engine, thumbnail-queue, generation-task, viewer modules를 포함합니다.
- 후속 보고서와 runtime-architecture의 로컬 Markdown 링크는 선택 트리 안의 파일/디렉터리에 연결되며 빠진 링크를 찾지 못했습니다.
- git diff --check HEAD <tree>가 통과했습니다.

이 검토에서는 코드·문서·index를 수정하지 않았습니다. 이 검토 기록만 새로 작성했습니다. 선택 커밋·push·공개 배포·공개 화면 확인은 부모가 이어서 수행합니다.
