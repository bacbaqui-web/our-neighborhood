# 에셋 소유권과 조립 규칙 분리 구현 계획

Goal: 분류별 백과를 읽어 조건에 맞는 부품을 조립하고 대체 이유를 화면에서 확인합니다.
Architecture: 백과의 분류별 등록 파일을 단일 원본으로 삼고 기존 ID·모델은 보존합니다. 우리동네의 assembly-rules가 호환·발생·위치 규칙과 대체 결정을 소유합니다. 백과는 정적 에셋 특성과 부착 지점만 제공하며 소비자에게 읽기 전용 객체를 반환합니다.
Tech Stack: 기존 ES modules, Three.js, 정적 JSON, 기본 HTML/CSS 유지. UI 전체를 React로 교체하지 않습니다.
Spec: 이 대화에서 승인한 분류별 소유권, 태그+구조화 조건, 임시부품 및 이유 표시, 단계별 백과 필터.

## 계약
- taxonomy: {domain,role,era:[],colors:[],materials:[],tags:[]}.
- domains: house, commerce, road, vehicle, nature, prop, person.
- assembly: {kind:component|complete|reference|legacy,slots:[],dimensions:null 또는 치수정보,evidence:설명}.
- 정보가 없는 태그·치수는 unknown 또는 빈 배열로 명시하고 측정값을 지어내지 않습니다.
- house role: complete, wall, window, window-accessory, door, roof, boundary, garden, service, ground, reference. 나머지 분류도 명시적 하위 역할을 둡니다.
- 규칙은 outputs/domestic-test/assembly-rules/가 소유하며 백과에는 복사하지 않습니다.
- 모델 원본의 호환 경로와 고정 ID를 보존합니다. 분류별 등록을 새 수정 진입점으로 만들고 공통 목록은 자동 생성합니다.

## 작업
- [x] 분류별 독립 카탈로그, 전체 분류/중복/고정ID/태그 검증, 읽기전용 registry 및 호환 aggregate 생성.
- [x] 실제 주택 외벽·창문·문 선택을 백과 ID와 우리동네 규칙에 연결. 일치→호환 기본부품→표시전용 오류부품, 실제 요구·실패·선택 이유 기록.
- [x] 집 등 상위 탭→부품 탭→시대/색상/재료 누적 필터. 상세에서 특성·부착위치·규칙을 확인. 빈 결과 초기화, URL/키보드/반응형 유지.
- [x] 앱에서 임시 대체/문제 건수, 클릭 시 이유와 해당 위치 확인. 기존 안전 배치 제외와 임시표시를 구분.
- [x] 통합 지침에 소유권·버전·분류 담당범위·공통파일 조율·규칙갱신·대체진단 명시.
- [ ] 필요한 회귀검사 및 독립 리뷰, 공개 배포, 공개 백과 필터·동네 조립·대체사유 화면 확인.

## 검토 초점
삭제·교체된 에셋 재사용 금지, 다른 분류 수정의 격리, 완성본을 분리부품으로 오인 금지, 빈 후보/불가능한 크기에서 명확한 대체표시, 실제 정보·수동 편집·통행과 원래 윤곽 보존.
