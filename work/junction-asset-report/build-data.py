"""Rebuild the catalog; reference PDFs are local research inputs, not redistributed."""
import json, csv, os
from pathlib import Path
import fitz
root=Path(__file__).parent
inputs=Path(os.environ.get('REFERENCE_INPUT_DIR',root/'.reference-inputs'))
out=root/'public/references'; out.mkdir(parents=True,exist_ok=True)
physical=json.loads((root/'reference-images.json').read_text())
law={'signals':'https://www.law.go.kr/flDownload.do?bylClsCd=110201&flSeq=144234863&gubun=', 'signs':'https://www.law.go.kr/flDownload.do?bylClsCd=110201&flSeq=146448457'}
pages={k:fitz.open(inputs/('law-'+k+'.pdf')) for k in law}
refs={}
def crop(key,book,page,y0,y1,x0=.23,x1=.50):
 p=pages[book][page-1]; r=p.rect
 p.get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(r.width*x0,r.height*y0,r.width*x1,r.height*y1),alpha=False).save(str(out/(key+'.png')))
 refs[key]={'image':'./references/'+key+'.png','source':law[book],'credit':'국가법령정보센터 · 도로교통법 시행규칙 별표 '+('3' if book=='signals' else '6')+' · '+str(page)+'쪽','kind':'공식 도안','note':'공식 도안 발췌입니다. 흑백 도안의 색상은 제작 사양에서 별도로 적용합니다. 자료 개정일: '+('2024-09-20' if book=='signals' else '2024-11-14')+'. 최신 설치 치수의 확정 근거로 사용하지 않습니다.'}
for args in [('s3','signals',1,.22,.35,.24,.55),('s4','signals',1,.51,.65,.24,.55),('right','signals',3,.035,.22,.24,.55),('flash','signals',3,.63,.91,.24,.55),('warning','signs',7,.065,.27),('noentry','signs',20,.22,.40),('noturn','signs',20,.40,.74),('speed','signs',23,.24,.49),('stop','signs',24,.065,.24),('yield','signs',24,.24,.41),('pole','signs',25,.17,.60,.50,.84),('crosssign','signs',32,.30,.48),('school','signs',32,.65,.84),('oneway','signs',33,.27,.49),('left','signs',34,.065,.30),('center','signs',43,.08,.32),('lane','signs',43,.75,.98),('edge','signs',45,.04,.23),('parking','signs',47,.18,.48),('speedtext','signs',48,.035,.25),('guideline','signs',50,.50,.77),('colorline','signs',51,.04,.89),('diamond','signs',52,.49,.73),('stopline','signs',52,.72,.85),('hatch','signs',53,.035,.36),('crossing','signs',53,.37,.88),('raised','signs',54,.035,.30),('bike','signs',54,.30,.50),('arrows','signs',57,.04,.43)]: crop(*args)
external={
'mast':('두원전기 · 신호등주','https://www.doowonkorea.com/traffic-sign-pole','제품 설치 사진','한쪽 팔 신호등주와 가로형 신호기 결합을 참고합니다.'),
'mast2':('두원전기 · 신호등주','https://www.doowonkorea.com/traffic-sign-pole','제품 설치 사진','양쪽 팔의 결합과 기둥 구조를 참고합니다.'),
'controller':('한국신호 · 교통신호제어기','https://www.koreasignal.com/default/m03/p01.php?sub=01&topmenu=3','제품 사진','함체 외형 참고입니다. 기초·방향은 현장을 따릅니다.'),
'button':('한국신호 · 보행자 작동신호기','https://koreasignal.com/default/m03/p05.php?sub=05&topmenu=3','제품 사진','버튼과 안내 면을 참고합니다. 음향신호기와 구분합니다.'),
'signal':('한국신호 · LED 신호등','https://www.koreasignal.com/default/m03/p03.php?sub=03&topmenu=3','제품 사진','보행자용 적색·녹색 등화와 차양을 참고합니다.'),
'tactile':('휴먼케어 · 점자블록','https://www.humancare.co.kr/bbs/board.php?bo_table=product02&wr_id=10','제품·설치 사진','점형과 선형의 돌기 형상이 함께 나옵니다. 각 유형을 분리해 제작합니다.'),
'curb':('강원석재 · 도로 경계석','https://gwgoodstone.co.kr/guide/road-curb','제품 형상 이미지','직선 경계석 단면 참고입니다. 치수는 제품·현장에 따라 다릅니다.'),
'corner':('강원석재 · 도로 경계석','https://gwgoodstone.co.kr/guide/road-curb','제품 형상 이미지','곡선 부재 참고입니다. 모든 모퉁이에 같은 반지름을 쓰지 않습니다.'),
'ramp':('강원석재 · 횡단보도 경계석','https://www.gwgoodstone.co.kr/guide/crosswalk-curb','제품 형상 이미지','턱낮춤용 경계석 참고입니다. 전체 보도 경사면의 완성 예시는 아닙니다.'),
'bollard':('가드디자인 · 볼라드','https://gddesign.co.kr/product/list.html?cate_no=42','제품 사진','금속 몸체와 반사띠 참고입니다. 지역별 형태가 다릅니다.'),
'mirror':('현대안전 · 도로반사경','https://www.hdsmro.co.kr/product/list.html?cate_no=24','제품 사진','원형 거울·차양·기둥 결합을 참고합니다.'),
'camera':('세오 · 교통단속 시스템','https://seoitv.com/document/3_2','제품 이미지','카메라 본체의 형상 참고입니다. 단속 방식·설치 방향은 별도 확인합니다.'),
'rear':('하남시 · 후면 무인단속 안내','https://www.hanam.go.kr/cleanh/cleanhBbsNttWebView.do?key=4348&nttNo=2567','설명 이미지','후면 촬영 방식의 설명도입니다. 제품 제작도는 아닙니다. 공공누리 제4유형 원문을 수정 없이 연결합니다.'),
'grating':('토목코리아 · 스틸그레이팅','https://ktomok.com/shop/item.php?it_id=1581995611','제품 도면','격자와 프레임 참고입니다. 표기 치수를 모든 배수구에 공통 적용하지 않습니다.'),
'manhole':('인텔리어 · 맨홀뚜껑','https://m.intelrior.com/product/detail.html?product_no=18481','제품 사진','뚜껑 패턴·테두리 참고입니다. 통신·상하수도 용도는 구분합니다.')}
for k,(credit,source,kind,note) in external.items(): refs[k]=dict(image=physical[k],source=source,credit=credit,kind=kind,note=note)
items=[]
def add(id,group,name,ref,variants,placement,existing='',priority='조건부',form='입체 부품'):
 status='기존 보완' if existing else '신규 후보'
 items.append(dict(id=id,group=group,name=name,**refs[ref],variants=variants,placement=placement,existing=existing,status=status,priority=priority,form=form))
add('S01','신호시설','한쪽 팔 신호등주','mast','기둥·수평 팔·차양·장착 브래킷을 분리','신호 제어가 확인된 접근부. 회전 차량과 보행 공간을 비우고 운전자 쪽을 향합니다.')
add('S02','신호시설','양쪽 팔 신호등주','mast2','양방향 팔·결합부·기초','서로 다른 방향을 향하는 등화의 실제 결합을 따릅니다. 교차로마다 기본 설치하지 않습니다.')
add('S03','신호시설','가로형 3색 차량 신호기','s3','적·황·녹 원형 렌즈, 개별 차양, 뒷면','접근 차량에서 보이는 방향으로 배치합니다. 점등 상태는 몸체와 분리합니다.')
add('S04','신호시설','가로형 4색 차량 신호기','s4','좌회전 화살표 포함 4등, 차양·장착부','좌회전 제어가 확인된 곳에 사용합니다. 등화 배열은 선택한 형식에 맞춥니다.')
add('S05','신호시설','보행자 신호기','signal','적색 정지·녹색 보행 픽토그램, 기둥 부착형','횡단보도 건너편에서 보행자가 볼 수 있게 배치합니다. 횡단 방향별로 구성합니다.')
add('S06','신호시설','우회전 전용 신호기','right','세로형 적색·황색 원형 등화와 녹색 우회전 화살표, 보조판','별도 우회전 통제가 확인된 접근부만 사용합니다.')
add('S07','신호시설','점멸용 단등 신호기','flash','단등 몸체·차양, 적색/황색 변형','점멸 운영 확인 때만 사용합니다. 사진 한 장의 점등 상태로 운영 방식을 확정하지 않습니다.')
add('S08','신호시설','교통신호 제어함','controller','함체·문·잠금부·받침','신호시설 주변의 확보된 시설 공간. 턱낮춤·점자블록·출입구를 막지 않습니다.')
add('S09','신호시설','보행자 작동 버튼','button','버튼·안내판·기둥 체결부','수동 요청 장치가 있는 횡단부만 사용합니다. 접근 가능한 보행 공간에서 조작하게 둡니다.')
marks=[('M01','중앙선','center','황색 실선·점선·이중선','반대 방향 사이. 작은 길 접속만으로 지우지 않으며 개방 구간을 확인합니다.',''),('M02','차로선','lane','백색 실선·점선','같은 방향 차로 사이. 교차로의 종료·재개를 따릅니다.',''),('M03','차도 가장자리선','edge','백색 가장자리선·모퉁이 연결','차도 경계를 따릅니다. 중앙선·주정차선과 별도 자료로 만듭니다.','junction:edge-corner'),('M04','주정차 제한 노면선','parking','황색 실선·점선·이중실선','실제 주정차 통제 구간만 표시하며 보도·벽 위로 넘어가지 않습니다.',''),('M05','정지선','stopline','접근 차로 폭에 맞는 백색 띠','필요한 접근 방향에만 설치합니다. 차량 진행 방향에서 횡단보도보다 먼저 만납니다.','junction:crossing-stop'),('M06','횡단보도','crossing','평행 횡단·대각선 횡단','유효 보행 공간끼리 연결합니다. 보도 없는 골목마다 자동 추가하지 않습니다.','junction:crossing-stop'),('M07','진행 방향 화살표','arrows','직진·좌·우·직좌·직우 등','실제 차로별 허용 방향과 맞춥니다. 물리적 틈만 보고 회전 허용을 추정하지 않습니다.',''),('M08','교차로 통행 유도선','guideline','회전 곡률별 점선·색상 변형','필요하고 확인된 경로에만 표시합니다. 모든 회전 경로에 일괄 생성하지 않습니다.','junction:turn-guide'),('M09','횡단보도 예고 마름모','diamond','백색 마름모','예고 표시가 필요한 접근 구간. 횡단보도 위나 교차로 한가운데에 두지 않습니다.',''),('M10','안전지대 사선 표시','hatch','테두리·사선·방향 변형','실제 안전지대 윤곽에 맞춥니다. 보행 대기 공간과 차량 통행 영역을 구분합니다.',''),('M11','색깔 유도선','colorline','색 띠·방향 안내','현장 안내 경로를 확인한 곳만 적용합니다. 일반 차로선과 분리합니다.',''),('M12','속도·정지·서행 문자','speedtext','속도 숫자·정지·서행을 개별 도안으로 제작','표지판의 통제 내용과 일치시킵니다. 이미지는 속도 숫자 예시이며 다른 문자는 별도 도안을 확인합니다.',''),('M13','자전거 횡단 표시','bike','자전거 횡단 띠·픽토그램','자전거 연결이 있는 횡단부. 일반 보행자 횡단보도와 구분합니다.',''),('M14','고원식 횡단보도','raised','융기 노면·양쪽 경사·횡단 도색','실제로 높인 횡단 시설만 사용합니다. 황백색 과속방지턱과 구분합니다.','')]
for id,name,ref,var,place,ex in marks: add(id,'노면표시',name,ref,var,place,ex,'기본' if id in ['M01','M02','M03','M05','M06','M07','M08'] else '조건부','노면 도안 / 생성형')
signs=[('T01','교차로 주의 표지','warning','십자·T·Y·측면 접속 도안','접근 운전자에게 필요한 실제 경고만 둡니다. 이미지에는 십자 도안이 나옵니다.',''),('T02','횡단보도 표지','crosssign','청색 바탕·백색 보행 도안','해당 횡단시설을 안내하도록 배치합니다.',''),('T03','일시정지 표지','stop','팔각형 적색 판·문자','일시정지 통제가 확인된 접근 방향만 사용합니다.',''),('T04','양보 표지','yield','역삼각 판·문자','양보 통제가 확인된 접근 방향만 사용합니다.',''),('T05','진입금지 표지','noentry','원형 적색 판·백색 가로띠','진입이 금지된 방향을 향합니다. 좁은 길이라고 임의 지정하지 않습니다.',''),('T06','일방통행 표지','oneway','방향별 화살표·장방형 판','실제 일방통행 방향과 맞춥니다.',''),('T07','회전 금지 표지','noturn','좌회전·우회전·유턴 금지 개별 도안','금지 회전과 접근 방향을 함께 기록합니다.',''),('T08','최고속도 제한 표지','speed','속도 숫자를 바꿀 수 있는 원형 판','해당 구간 제한속도를 따릅니다. 도로 등급만으로 속도를 단정하지 않습니다.','road:a67'),('T09','어린이 보호 표지','school','어린이 도안·구역 보조판','보호구역 확인 때 사용합니다. 일반 교차로 기본 세트에 넣지 않습니다.',''),('T10','비보호 좌회전 표지','left','청색 판·좌회전 화살표·문자','비보호 좌회전 운영을 확인한 곳만 사용합니다.',''),('T11','표지판 기둥·체결부','pole','독립 지주·기존 기둥 체결·판 뒷면','기존 신호등주·전신주에 붙은 표지는 기둥을 중복 생성하지 않습니다.','')]
for id,name,ref,var,place,ex in signs: add(id,'표지판',name,ref,var,place,ex,form='도안 + 입체 판')
infra=[('I01','직선 연석','curb','단면·길이·접속점','차도와 보도 경계를 잇습니다. 길이 변경 때 단면 높이까지 늘이지 않습니다.','junction:curb-straight'),('I02','모퉁이 곡선 연석','corner','회전각·반지름·진입 폭','도로폭과 독립적으로 곡률을 정합니다. 건물 윤곽은 둥글게 바꾸지 않습니다.','junction:curb-corner'),('I03','턱낮춤·전이 연석','ramp','경사면·좌우 전이석·평탄 접속','횡단보도·양쪽 경사판·경고블록이 모두 보행 공간 안에 들어가야 합니다.','junction:curb-ramp'),('I04','점형 경고블록','tactile','고정 크기 점형 단위 블록','횡단 접근부와 위험 경계. 블록 자체를 늘이지 않고 배열 수로 길이를 조정합니다.','junction:tactile-warning'),('I05','선형 유도블록','tactile','직선 유도 돌기의 단위 블록','보행 유도 방향을 따릅니다. 점형과 역할을 분리하고 기둥이 침범하지 않게 합니다.','junction:tactile-guidance'),('I06','차량 진입 억제 볼라드','bollard','몸체·반사띠·기초, 형식별 변형','보행 공간을 확보한 시설 구역. 횡단부·휠체어 통행을 막지 않습니다.','road:a71'),('I07','도로반사경','mirror','원형·쌍면 변형·기둥·체결부','시야가 제한된 골목 등 실제 설치가 확인된 곳. 거울 방향은 필요한 시야를 향합니다.','road:a73'),('I08','측구 배수구','grating','격자·테두리·측구 연결','설치면 높이와 경사를 맞춥니다. 턱낮춤과 함께 배수를 검토합니다.','road:a74'),('I09','맨홀 뚜껑','manhole','원형 뚜껑·프레임·용도별 표면','차도 또는 보도 표면에 맞춥니다. 공중에 뜨거나 과하게 파묻히지 않게 합니다.','road:a75'),('I10','가로 배수로','grating','연속 프레임·그레이팅 반복','골목 입구 등의 확인된 가로 배수로. 단위 격자를 늘이지 않고 반복합니다.','')]
for id,name,ref,var,place,ex in infra: add(id,'도로 부속시설',name,ref,var,place,ex,'기본' if id in ['I01','I02','I03','I04','I05','I08','I09'] else '조건부','생성형 / 입체 부품')
add('C01','단속장비','과속·신호 단속 카메라','camera','카메라 본체·조명·설치 브래킷·지주','실제 단속 지점과 촬영 방향이 확인된 곳만 설치합니다. 신호등과 카메라를 같은 물체로 만들지 않습니다.')
add('C02','단속장비','후면 단속 카메라 구성','rear','후면 촬영 본체·조명·지지대','통과 차량의 뒷면을 촬영하는 방향으로 구성합니다. 사진 속 제품을 임의로 앞면 카메라와 같은 것으로 확정하지 않습니다.')
crop('buslane','signs',44,.34,.55)
add('M15','노면표시','전용차로 경계 표시','buslane','청색 단선·복선·실선·점선','전용차로 위치와 운영을 확인한 구간만 표시합니다. 기존 표시를 보존하고 붉은 노면만으로 용도를 단정하지 않습니다.',form='노면 도안 / 생성형')
add('I11','도로 부속시설','중앙분리대 끝단·교통섬 연석','corner','끝단 곡선·섬 둘레 연석·횡단 접근부','기존 분리시설의 연속성을 유지합니다. 사진은 곡선 연석 부재 참고이며 완성 교통섬 도면은 아닙니다.','junction:median-end','조건부','생성형 조립')
for key,filename,page,box,source,credit in [
 ('hump','safety',31,(.08,.145,.70,.335),'https://www.law.go.kr/행정규칙/도로안전시설설치및관리지침','국토교통부 · 도로안전시설 설치 및 관리지침 (2022) · 그림 2.5'),
 ('enforcement','seo',22,(.40,.37,.455,.585),'https://www.seoitv.com/uploads/download/2025/02/8aa637eed7d6abd80e94ac51ba0a0efe.pdf','세오 · 2025 제품 카탈로그 · PDF 22쪽')]:
 p=fitz.open(inputs/(filename+'.pdf'))[page-1];r=p.rect
 p.get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(box[0]*r.width,box[1]*r.height,box[2]*r.width,box[3]*r.height),alpha=False).save(str(out/(key+'.png')))
 refs[key]=dict(image='./references/'+key+'.png',source=source,credit=credit,kind='도안 발췌',note='형상 비교용 부분 발췌입니다. 제품·자료의 수치를 현장 공통 치수로 사용하지 않습니다.')
add('I12','도로 부속시설','황백색 과속방지턱','hump','융기 노면·황백색 사선 도색','확인된 방지턱만 구성합니다. 횡단보도와 별도 시설이며 교차로마다 자동 추가하지 않습니다.',form='노면 형상 + 도안')
add('T12','표지판','무인단속 안내 표지','enforcement','단속 종류·거리 보조판·지주','실제 단속 안내와 일치시킵니다. 참고 이미지의 속도·거리를 기본값으로 복제하지 않습니다.',form='도안 + 입체 판')
items.sort(key=lambda i: (['신호시설','노면표시','표지판','도로 부속시설','단속장비'].index(i['group']),i['id']))
extras=[{'name':'차도·보도 접속면은 생성 작업','reason':'별도의 고정 소품보다 교차각·폭·경사를 입력받는 면 생성이 필요합니다. 교차로 완성 GLB를 늘여 맞추지 않습니다.'},{'name':'가로등·전신주·가로수는 기존 분류 활용','reason':'이번 50개 목록은 교차로 전용·직접 연결 부품입니다. 일반 거리 시설은 기존 에셋을 활용하고 보행 공간·전선·가지 간섭을 따로 검사합니다.'}]
(root/'src/data.json').write_text(json.dumps({'items':items,'pending':extras},ensure_ascii=False,indent=2))
with (root/'public/asset-list.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,lineterminator="\n"); w.writerow(['번호','분류','에셋','작업 구분','제작 방식','우선순위','변형','배치 조건','기존 ID','이미지','출처'])
 for i in items:w.writerow([('https://magamiscom.ing/neighborhood/domestic-test/junction-asset-report/'+i[k][2:] if k=='image' and i[k].startswith('./') else i[k]) for k in ['id','group','name','status','form','priority','variants','placement','existing','image','source']])
print(len(items),'image cards;',len(extras),'additional scope notes')
