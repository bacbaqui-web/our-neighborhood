# Task4 — 선택 코드 최종 읽기 전용 검토

검토한 선택 트리는 selected-changes-manifest.json의 c130bec8400008f2e28b17655b1119e1859fd03d이며 /tmp/neighborhood-loading-selected의 파일 해시가 명세 및 Git tree blob과 일치합니다. 초기 이미지 로딩 코드 검토에서는 문제를 찾지 못했으나, 부모의 전체 clean 검사에서 아래 역사 파일 필수 조건 문제가 발견되어 보완했습니다.

- loadTexture는 성공할 때만 texture를 반환하고 두 번 실패하면 원래 cause를 담은 Error를 던집니다. placeholder나 빈 성공으로 바꾸지 않습니다. 파일명을 pathname에서만 얻어 query/hash/credentials를 표시하지 않습니다.
- 사람/식물/나무의 기존 colorSpace·filter·anisotropy·계절 및 atlas URL을 보존했습니다. 성공 texture 정리는 각 실패 배치가 모두 정착한 뒤 수행하며 나무 frames 실패도 정리합니다.
- app catch는 non-Error Event도 안내하고 index 및 메인 소비자 cache 참조가 새 버전으로 연결됩니다. 새 helper는 공개 명세에 있습니다.
- 선택본에서 texture-loading 실제 소비자 검사와 publication-references를 직접 실행해 통과했습니다: 1601 inputs/2197 references. 기존 local API/leafCompare 예외 두 개는 그대로입니다.
- 선택 app/start에는 외부 Codex bridge 연결이 없습니다. 실제 staged patch는 fresh baseline-index.patch와 정확히 같습니다.
- 두 백과 검사는 전체 등록/보존 모델 범위와 승인 우선순위를 유지하며 실제 입력 복사본 실패 주입을 포함합니다. 원본 자산이나 runtime 모델 정책을 바꾸지 않았습니다.

초기 검토 뒤 부모가 승인한 범위에서 asset-encyclopedia 테스트만 보완했습니다. runtime·index는 바꾸지 않았습니다. 최초 자연 실패의 세부 네트워크/디코드 원인은 여전히 미확정이며, 공개 재현 차단 조건에서 수정 동작 확인은 부모가 이어서 수행합니다.

## clean checkout 보완

과거 승인 파일7개 중 일부는 로컬 보존 파일이며 Git clean checkout에는 없을 수 있습니다. 정확한 경로 허용 목록은 유지하고, 실제 존재하는 미등록 GLB 탐색에서만 그 목록을 사용합니다. 과거 파일 자체의 exists 필수 assertion은 제거하고 현재 approvedRoad successor가 존재하는지 명시적으로 검사합니다. 공개필수/현재 모델 검사와 v999 미등록 파일 실패 주입은 유지합니다.

working 및 clean selected에서 asset-encyclopedia 통과, clean selected의 lines 검사와 diff 검사도 통과했습니다. 변경은 tests/asset-encyclopedia.mjs 하나입니다(task-4-changed-files.json). 선택 fixture에 이 테스트를 반영했으므로 초기 c130bec 트리/명세는 부모가 이 한 파일을 포함하여 재생성해야 합니다.

## 모델 소스 소유권 보완

부모 공개 빌드의 unowned nature: domestic-test/texture-loading.js를 확인했습니다. scripts/work의 생성 도구와 runtime 문서를 확인했으며 model-source-ownership은 별도 자동 생성물 표시/생성 도구가 없는 명시적 도달 소스 명세입니다. 기존 모델 경계 검사가 각 provider의 local imports를 따라 소유권과 전체 목록 일치를 확인합니다. 신규 helper의 실제 유입점인 nature 소유, model-source 역할로 한 항목을 추가했습니다. 검사 로직을 약화하지 않았습니다.

working/clean selected 모두 asset-model-boundaries 통과: 70 owned modules, 7 providers, no placement dependency, URL parity. catalog와 browser JS bundle --check 및 diff 검사도 통과했습니다. 최종 Task4 변경은 테스트1개와 ownership 명세1개입니다. 해당 두 파일을 selected fixture에도 반영했으며 부모의 최종 tree/manifest 재생성이 필요합니다.
