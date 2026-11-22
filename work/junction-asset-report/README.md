# 교차로 에셋 제작 보고서

현재 통합 지침(2026-11-22)의 교차로 규칙을 제작용 50개 항목으로 정리합니다. 일반 가로수·전신주 등은 기존 분류를 사용합니다. 모델 제작이나 에셋 등록을 수행하는 페이지는 아닙니다.

- 편집: `src/data.json`, `src/Report.tsx`
- 빌드: 이 폴더에서 `npm ci`, `npm run build`
- 결과: `outputs/domestic-test/junction-asset-report/`
- 공개 주소: https://magamiscom.ing/neighborhood/domestic-test/junction-asset-report/
- 디자인 검사: `npx astryx doctor --built .`
- `public/references/`는 법령 도안 및 출처를 밝힌 제품 도안의 부분 발췌입니다. 외부 제품 사진은 재배포하지 않고 원본 URL에 연결합니다.
- 공식 도안은 2024년 자료의 형상 참고이며 현행 법정 설치 수치를 확정하지 않습니다. 제작 단계에서는 선택한 형식의 색상·치수를 다시 확인합니다.

`build-data.py`는 조사 원본에서 카드 자료·CSV·도안 발췌를 다시 만드는 선택적 도구입니다. 일반 페이지 빌드에는 필요하지 않습니다. PyMuPDF가 필요하며 `REFERENCE_INPUT_DIR`로 아래 조사 파일 폴더를 지정합니다. 이미지 주소 목록은 `reference-images.json`에 보관합니다.

| 로컬 조사 파일명 | 원문 |
|---|---|
| law-signals.pdf | https://www.law.go.kr/flDownload.do?bylClsCd=110201&flSeq=144234863&gubun= |
| law-signs.pdf | https://www.law.go.kr/flDownload.do?bylClsCd=110201&flSeq=146448457 |
| seo.pdf | https://www.seoitv.com/uploads/download/2025/02/8aa637eed7d6abd80e94ac51ba0a0efe.pdf |
| safety.pdf | 국토교통부 도로안전시설 설치 및 관리지침, 2022년 제681호, 법령정보센터 인쇄본 48쪽, 그림 2.5 (PDF 31쪽). 공개 법령 원문은 카드에 연결합니다. |

현재 등록 ID는 15개 카드에 연결됩니다(정지선·횡단보도는 같은 조립 예시를 공유하므로 고유 모델 수와 다릅니다). 실제 승인·폐기 여부 및 자동 배치 적용 여부는 백과에서 따로 확인합니다.

## 교차로 지침 독립 검토

`?view=guidelines`는 3개 독립 검토 결과, 12개 보완 결정, 통합 문서의 J01~J11 발췌를 표시합니다. 수정 원본은 `docs/project-guidelines.txt` 하나입니다. `sync-guidelines.py`는 이 문서에서 `src/guidelines.json`과 `public/guidelines.txt`를 생성하며 `--check`로 일치를 확인합니다. `npm run build`가 발췌를 갱신합니다. `src/review.json`은 검토 증거이며 별도 정책 파일이 아닙니다.
