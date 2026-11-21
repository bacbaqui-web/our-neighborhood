# Road-first generation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, following the canonical main checkout rule.

**Goal:** 붉은 기준점 선택 후 도로 종류를 먼저 확정하고 건물을 생성합니다.
**Architecture:** 기존 Worker의 도로 조회를 별도 단계로 노출합니다. 교차로 사이의 연결 구간을 묶고 기존 SVG 도로 선택기를 재사용합니다. 확정된 원본 도로와 수정값을 생성기에 전달합니다.
**Tech Stack:** 기존 JavaScript, native dialog, Pyodide, Shapely.
**Spec:** 현재 사용자 요청 및 docs/project-guidelines.txt 9절.

## Constraints and review focus
- 정식 main에서 다른 작업 보존. 추가 의존성 없음. 360도 가림 검사 유지.
- T/X 교차로, 입체교차, 차로 변화, 취소/조회 실패, 기존 건물 수동 지정 보존을 검사합니다.

### 1. 도로 구간
- [ ] tests/test_road_sections.py에 연결·교차·구조변화·입체교차 검사를 작성하고 실패 확인.
- [ ] work/road_sections.py의 group_road_sections(roads) 구현. 원본 변경 없이 교차로 사이 LineString 목록 반환.
- [ ] 검사 통과 후 entry.py의 prepare_roads와 worker의 roads 응답 연결, pack.py 갱신.

### 2. 선택과 생성
- [ ] map-picker.js를 붉은 점과 다음 단계 버튼으로 단순화.
- [ ] road-setup.js에서 도로 조회·선택·등급 수정·취소 처리. confirm 전 건물 조회 금지.
- [ ] progress/client에 sourceRoads와 sceneEdits 전달, 기존 건물 수동값 보존.
- [ ] 실제 브라우저에서 선택→수정→생성 및 취소 확인.

### 3. 공개 반영
- [ ] 관련 검사·묶음 검사·변경 검토. 독립 코드 리뷰.
- [ ] 해당 변경만 커밋·공개 배포, 공개 화면 흐름 확인 후 상태 기록.
