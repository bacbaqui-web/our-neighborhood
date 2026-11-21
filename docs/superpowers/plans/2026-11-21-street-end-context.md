# Street-end context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실제 건물 윤곽으로 길 끝의 빈 공간을 채우고 추가 로딩을 제한한다.
**Architecture:** 단일 건물 조회의 범위를 제한적으로 넓히고 상세 선택 전에 원본을 보관한다. 원경 전용 가벼운 선택과 면 생성으로 상세 배치 비용을 늘리지 않는다.
**Tech Stack:** 기존 Python/Shapely, Three.js, 브라우저 Worker.
**Spec:** docs/superpowers/specs/2026-11-21-street-end-context-design.md

## Global Constraints
- 상세 반경과 시야 선택 유지. 원경 조회 반경 max(200, 상세+150)m.
- 최대256동, 창문·소품 생성 없음, 실제 좌표·윤곽 유지.
- 기존 미커밋 작업과 인증 설정 보존.

## Review Focus
- 가까운 건물 중복: 상세 owner 제외 검사.
- 좁은 골목: 도로와 건물 교차 면적 0 검사.
- 부지 구멍·다중 폴리곤: 구멍 보존 검사.
- 경사: 모든 원경 바닥을 같은 지면에 접지 검사.
- 밀집·빈 자료: 상한, 유한값, 빈 결과 검사.

### Task 1: 원경 자료 생성
Files: work/street_end_context.py, work/browser-generation/entry.py, pack.py, browser-generation/vworld.js, client.js, generation/build-environment.py, tests/test_street_end_context.py.
- [ ] 합성 지도 회귀 검사 작성 후 실패 확인.
- [ ] build_context(collection, roads, origin, radius, view, detailed) 구현. 원경 건물/도로 폴리곤 반환, 네트워크 호출 없음.
- [ ] 단일 자료 조회 범위 확장, 원경 저장, 캐시 구분 연결.
- [ ] Python/기존 건물 조회 검사, pack 갱신 및 check.

### Task 2: 화면 연결과 확인
Files: outputs/domestic-test/street-end-context.js, atmosphere.js, tests/street-end-context.mjs.
- [ ] 실제 윤곽과 구멍, 접지, 중복, 삼각형 검사 실패 확인.
- [ ] 건물 면과 이어지는 도로를 각각 합친 메시로 생성하고 기존 조명을 받도록 연결.
- [ ] 기존 원경 검사와 생성 검사, Edge 새 지도 화면·낮밤 확인.
- [ ] 변경 검토, PROJECT_STATE와 검증 기록 갱신. 검증한 변경만 공개 반영.
