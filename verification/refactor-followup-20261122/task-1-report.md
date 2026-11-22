# Task 1 report — DONE

## 변경
- scripts/build-browser-generation.mjs: esbuild API 고정 옵션 재현 빌드, --check 메모리 재생성/byte comparison. bundle 헤더는 모든 의존 원문과 builder/package/lock의 SHA256을 포함하여 tree-shaken 코드나 주석만 바뀌어도 오래된 묶음을 검출한다.
- work/browser-generation/package.json, package-lock.json: build-only esbuild0.25.12 exact pin. 기존 cache 도구 버전 재사용. MIT license. npm ci --prefix work/browser-generation --ignore-scripts --no-audit --no-fund.
- local module ?v= cache suffix를 같은 physical path로 통일. 다른 suffix는 명시적으로 거부. bare three는 기존 vendor/three.module.js에 연결. 원본 웹 import URL은 수정하지 않음.
- import.meta.url을 esbuild parser define으로 원본 모듈 URL 변수에 연결. 상대 asset URL을 bundle 폴더로 잘못 옮기지 않는다. 원본 텍스트/주석을 정규식으로 대체하지 않음.
- outputs/domestic-test/browser-generation/prepare-scene.js를 79 source modules로 재생성. 최신 details assembly 처리 포함, registry option 없는 prepareScene 호출은 유지.
- scripts/build-site.py 최전단 최신성 gate, .github/workflows/pages.yml npm ci 설치 및 신규 test 연결.

## 검사
- task-1-checks.json에 9명령 결과. 신규 재현검사는 실제 생성2회 identical, 임시 root 동일 byte, input 변경/output 변조 실패, ?v alternate singleton, unknown query 거부, registry.resolve 실제 asset URL, DOM globals 없는 Node import/prepareScene export를 검사한다.
- 기존 stale bundle로 --check가 실패하는 것을 먼저 확인했다.
- 기존 browser-generation, visible-horizon-worker, loading, house-assembly-rendering, scene-budget, Python pack52 검사 통과.
- git diff --check 통과. baseline tracked 외부20파일 SHA차이0. staged/index 변경 없음.

## 부모 검토/배포 주의
- 변경 목록 task-1-changed-files.json. stage/commit/push 하지 않음. 다음 태스크 착수하지 않음.
- hosting repo에서 source checkout 후 build-site.py를 호출할 때도 npm ci --prefix work/browser-generation 설치가 필요하다. 소스 repo workflow만 수정했으며 hosting workflow는 부모 배포 단계에서 연결해야 한다.
- registry module의 top-level은 URL 계산뿐이다. loadAssetRegistry의 fetch는 호출 시 실행되며 이번 prepareScene에 registry load를 새로 연결하지 않았다. DOM-only 코드는 import 때 실행되지 않는 것을 Node import로 확인. 실제 Worker 두 모드/새 동네 생성은 최종 공개 UI 검사 대상이다.
- bundle byte 감소는 module 통일과 최신 source 재생성 결과이며 체감 속도 개선은 측정하지 않았다.
- modern-web-guidance는 bundler/worker 검색2회, 해당 build tooling guide 없음. CI/tooling 예외 범위이며 무관한 UI guide를 적용하지 않았다.
