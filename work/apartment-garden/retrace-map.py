import json,math
from pathlib import Path
out=Path('outputs/domestic-test/apartments/garden')
plan=json.load(open(out/'plan.json')); old=json.load(open('work/apartment-garden/map-retrace-before/plan.json'))
frames={'north':(1670,420),'center':(1670,920),'east':(2120,1420),'south':(2120,1820)}
rows=[];roads=[]
def base(p,frame):
 a,b=frames[frame];return [round((p[0]+a)/4,3),round((p[1]+b)/4,3)]
def row(frame,name,a,b):
 rows.append(dict(id=f'M{len(rows)+1:02}',area=name,a=base(a,frame),b=base(b,frame),source=f'trace-{frame}.png',sourcePixels=[a,b],confidence='일반 지도에 그려진 주차선 직접 추적'))
def road(frame,name,points,width=3.8):
 roads.append(dict(id=name,width=width,pixels=[base(p,frame) for p in points],source=f'trace-{frame}.png',sourcePixels=points))
for name,a,b in [
 ('104 서쪽',(402,196),(411,270)),('104 동쪽',(571,184),(580,248)),('104 안쪽',(448,203),(541,194)),
 ('105 동쪽',(457,399),(466,486)),('106 북쪽',(505,444),(600,434)),('107 서쪽',(638,430),(645,477)),('106 안쪽 위',(503,385),(506,410))]:row('north',name,a,b)
for name,a,b in [
 ('109 안쪽',(488,98),(497,176)),('109 중앙 동쪽',(529,94),(538,155)),('110 서쪽',(582,115),(591,213)),('111 북쪽',(472,224),(559,216)),
 ('108 남쪽',(746,112),(809,104)),('112 서쪽',(832,116),(845,239)),('112 안쪽',(784,157),(789,190)),
 ('114 동쪽',(428,325),(444,456)),('114 안쪽 위',(477,350),(523,345)),('114 안쪽 서쪽',(484,362),(492,433)),('114 안쪽 동쪽',(559,330),(566,378)),('115 서쪽',(612,349),(622,432)),('116 북쪽',(469,474),(604,459)),
 ('113 남쪽',(799,342),(882,333)),('117 서쪽',(903,351),(919,472)),('117 안쪽',(858,390),(866,449)),('118 남쪽',(815,584),(891,575)),
 ('120 서쪽',(914,615),(926,698)),('120 안쪽',(861,617),(873,680)),('119 북서쪽',(533,661),(615,652)),('119 남서쪽',(543,709),(636,698)),('119 서쪽 짧은 열',(644,639),(650,680))]:row('center',name,a,b)
for name,a,b in [
 ('121 남쪽',(401,359),(540,345)),('122 남쪽',(720,94),(867,79)),('123 바깥 서쪽',(704,136),(714,222)),('123 안쪽 서쪽',(757,146),(767,210)),('123 안쪽 중앙',(807,133),(815,191)),('123 안쪽 동쪽',(835,130),(843,190))]:row('east',name,a,b)
for name,a,b in [
 ('125 바깥 서쪽',(929,198),(940,261)),('125 안쪽 위',(963,184),(1015,177)),('125 안쪽 아래',(975,239),(1029,232)),('125 바깥 동쪽',(1059,209),(1066,264)),('125 남쪽',(950,300),(1055,288)),('125 남서쪽',(941,292),(949,339)),
 ('126 안쪽 북쪽',(466,400),(554,391)),('126 안쪽 남쪽',(470,432),(559,423)),('126 바깥 동쪽',(595,381),(607,447)),('127 북서쪽',(347,460),(393,454))]:row('south',name,a,b)
road('north','court-104',[(596,160),(424,181),(433,261),(556,248),(549,166)])
road('north','court-106',[(637,361),(477,381),(488,476),(617,466),(608,365)])
road('center','court-109',[(655,60),(463,87),(477,200),(568,191),(553,74)])
road('center','court-112',[(699,145),(803,136),(817,238),(785,246),(763,237),(754,224),(746,156)])
road('center','court-114',[(690,306),(456,328),(470,449),(595,435),(581,318)])
road('center','court-117',[(730,377),(878,357),(895,472),(809,481),(788,467),(781,450),(777,397)])
road('center','court-119',[(731,547),(506,576),(480,583),(469,595),(470,624),(516,690),(628,679),(624,635)])
road('east','court-120',[(330,122),(439,100),(450,214),(393,224),(373,215),(363,200),(355,157)])
road('east','court-123',[(721,241),(707,118),(862,105),(879,229),(721,245)])
road('east','cross-121',[(353,391),(563,367)],4)
road('south','court-125',[(889,158),(944,150),(959,270),(1046,267),(1030,147),(1010,140)],4)
road('south','court-126',[(374,352),(432,378),(449,466),(587,449),(574,369),(554,363),(432,378)],4)
road('south','cross-127',[(318,484),(448,466)],4)
# Traced islands replace broad inferred gardens in the parking courtyards.
islands=[('north','104 안쪽',[(447,215),(540,204),(541,239),(445,248)]),('north','106 안쪽',[(513,385),(594,377),(600,423),(512,432)]),('center','109 안쪽',[(503,96),(518,95),(528,182),(507,185)]),('center','114 안쪽',[(499,362),(528,359),(535,425),(500,429)]),('center','117 안쪽',[(798,398),(847,393),(854,462),(799,465)]),('east','120 안쪽',[(373,134),(405,130),(414,199),(374,202)]),('east','123 서쪽 섬',[(739,130),(749,129),(762,222),(748,224)]),('east','123 동쪽 섬',[(781,131),(795,130),(808,218),(792,221)]),('south','126 안쪽',[(465,406),(554,397),(557,416),(468,425)]),('south','125 안쪽',[(969,199),(1019,193),(1022,220),(974,225)])]
def local(p):return [round((p[0]-640)*plan['pixelTransform']['x'],3),round((p[1]-360)*plan['pixelTransform']['z'],3)]
plan['roads']=old['roads']+[dict(id=r['id'],width=r['width'],points=[local(p) for p in r['pixels']],evidence=r['source'],sourcePixels=r['sourcePixels']) for r in roads]
# Replace previously invented central lawns; preserve only the exterior vegetation regions.
plan['gardens']=[g for g in old['gardens'] if g['name'] not in ['중앙 정원','북쪽 안뜰','남쪽 안뜰','126동 앞 녹지']]+[dict(id='map-island-'+str(i),name=name,polygon=[local(base(p,fr)) for p in ps],evidence=f'trace-{fr}.png; 주차장 사이 섬, 식재는 표현용') for i,(fr,name,ps) in enumerate(islands)]
# The west edge of the east lot was previously drawn through its mapped parking.
plan['boundary'][2][0]=local([699,343]);plan['boundary'][2][-1]=local([696,375]);plan['boundary'][2][-2]=local([694,412])
plan['version']=2
plan['notes']=['확대 일반 지도에 표시된 순환 도로와 주차 구획을 함께 추적','지도 주차 구획을 먼저 고정하고 정원·보행 연결을 남는 공간에 배치','원본 공공 건물 윤곽은 지도와 대조해 유지; 주차장에 맞추기 위한 임의 축소 없음','기존 항공 사진의 지붕·진입로를 주차열로 잘못 해석한 항목은 일반 지도 주차선으로 교정','수동 추적과 지형 평탄화에 따른 오차 있음']
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
ref=dict(version=2,source='Kakao 일반 지도, 2026-10-29 확대 확인',method='주차 구획과 순환 길을 같은 지도 좌표로 추적. 공유 경계는 겹침으로 보지 않으며 주차칸을 삭제하지 않음.',limits='칸 간격은 지도 열 길이에 맞춰 재구성. 차종과 점유율은 표현용. 지하 공간은 대상 아님.',frames={k:dict(file=f'trace-{k}.png',scale=4,offset=list(v)) for k,v in frames.items()},rows=rows,roads=roads)
json.dump(ref,open(out/'parking-reference.json','w'),ensure_ascii=False,indent=2)
print(len(rows),'rows',len(plan['roads']),'road polylines')
# Correct the 105 footprint against the ground outline on the same map, not aerial roof projection.
geo=json.load(open('work/apartment-garden/map-retrace-before/buildings.geojson'))
corrections=[]
for f in geo['features']:
 if f['properties']['buld_nm_dc']=='105동':
  px=[base(q,'north') for q in [(393,401),(434,396),(446,501),(399,505)]]
  ring=[[plan['origin'][0]+(q[0]-640)*plan['pixelTransform']['x']/(111320*math.cos(math.radians(37.618))),plan['origin'][1]-(q[1]-360)*plan['pixelTransform']['z']/111133] for q in px]
  ring.append(ring[0]);f['geometry']['coordinates']=[ring];f['properties']['comparison_geometry_source']='trace-north.png; 지도 지상 윤곽 수동 교정';corrections.append({'building':'105동','source':'trace-north.png','pixels':px})
plan['boundary'][1][-1]=local([610,557]);plan['boundary'][1].append(local([625,542]))
# This vertical text was a building label, not a marked parking row; record the correction explicitly.
ref['corrections']=[{'id':'M39','reason':'125동 서쪽의 세로 건물 표기를 주차선으로 오독; 실제 주차선 없음','source':'trace-south.png'}]
ref['rows']=[r for r in ref['rows'] if r['id']!='M39']
ref['buildingCorrections']=corrections
plan['notes'][2]='105동은 같은 일반 지도의 지상 윤곽으로 교정; 나머지 27동 윤곽과 모든 층수 보존'
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
json.dump(ref,open(out/'parking-reference.json','w'),ensure_ascii=False,indent=2)
json.dump(geo,open(out/'buildings.geojson','w'),ensure_ascii=False,indent=2)
# Ground outlines of the two eastern north blocks differ from the imported footprints.
for name,points in [('103동',[(658,123),(703,118),(720,273),(676,279)]),('107동',[(680,309),(721,305),(738,469),(694,476)])]:
 for f in geo['features']:
  if f['properties']['buld_nm_dc']==name:
   px=[base(q,'north') for q in points];ring=[[plan['origin'][0]+(q[0]-640)*plan['pixelTransform']['x']/(111320*math.cos(math.radians(37.618))),plan['origin'][1]-(q[1]-360)*plan['pixelTransform']['z']/111133] for q in px];ring.append(ring[0]);f['geometry']['coordinates']=[ring];f['properties']['comparison_geometry_source']='trace-north.png; 지도 지상 윤곽 수동 교정';corrections.append({'building':name,'source':'trace-north.png','pixels':px})
for r in plan['roads']:
 if r['id']=='spine':r['width']=6;r['points'][0]=local([576.5,116]);r['points'][1]=local([576.5,148])
 if r['id']=='cross-middle':r['points']=[local(q) for q in [[487,302],[504,304],[532,307],[596,307],[638,314]]]
 if r['id']=='cross-south':r['points']=[local(q) for q in [[511,374],[539,373],[570,369],[603,367]]]
 if r['id']=='east-loop':r['points']=[local(q) for q in [[717,490],[711,452],[704,418],[708,384],[707,375]]]
plan['roads'].append(dict(id='east-cross-118',width=4,points=[local(q) for q in [[608,378],[645,378]]],evidence='reference-center-map.png'))
plan['notes'][2]='103·105·107동 지상 윤곽을 확대 지도와 대조해 교정. 층수 보존.'
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
json.dump(ref,open(out/'parking-reference.json','w'),ensure_ascii=False,indent=2)
json.dump(geo,open(out/'buildings.geojson','w'),ensure_ascii=False,indent=2)
# The old cross-middle line ran through building corners; the observed connection is court-114.
plan['roads']=[r for r in plan['roads'] if r['id']!='cross-middle']
for r in plan['roads']:
 if r['id']=='spine':r['points']=[local(q) for q in [[576.5,116],[576.5,148],[579.5,173],[583,200],[587.5,246.25],[594.75,306.25],[603.5,367.5],[608,405],[613,434],[618,477],[623,507]]]
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
# Replace the remaining inferred shortcuts with the white lanes actually drawn on the map.
plan['roads']=[r for r in plan['roads'] if r['id'] not in ['east-cross-118','south-access2']]
for r in plan['roads']:
 if r['id']=='court-123':r['points']=[local(base(q,'east')) for q in [(721,241),(740,239),(724,118),(862,105),(879,229),(740,245),(721,241)]]
 if r['id']=='east-loop':r['points']=[local(base(q,'east')) for q in [(721,241),(708,270),(718,335),(748,377),(862,468),(873,551)]]
 if r['id']=='east-south':r['width']=8;r['points']=[local(base(q,'south')) for q in [(806,400),(1000,418),(1120,386),(1240,420)]]
 if r['id']=='south':r['points']=[local(q) for q in [[623,507],[626,519],[629,528],[625,538],[617,552],[610,576],[611,603],[612,631]]]
for r in ref['rows']:
 if r['id']=='M41':r['a']=base((938,292),'south');r['b']=base((946,339),'south');r['sourcePixels']=[(938,292),(946,339)]
ref['roads']=[{'id':r['id'],'width':r['width'],'pixels':[[round(p[0]/plan['pixelTransform']['x']+640,3),round(p[1]/plan['pixelTransform']['z']+360,3)] for p in r['points']],'source':r.get('evidence','확대 일반 지도')} for r in plan['roads']]
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
json.dump(ref,open(out/'parking-reference.json','w'),ensure_ascii=False,indent=2)
# Include the short visible crosswalk/entry necks, not just the inner loop centerlines.
starts={'court-104':('north',(630,156)),'court-109':('center',(674,60)),'court-112':('center',(688,145)),'court-114':('center',(709,305)),'court-119':('center',(744,547)),'court-120':('east',(303,122)),'court-125':('south',(868,160))}
for r in plan['roads']:
 if r['id'] in starts:
  fr,q=starts[r['id']];r['points'].insert(0,local(base(q,fr)))
plan['roads'].append(dict(id='west-north-street',width=7,points=[local(q) for q in [[470,148],[473,165],[476,172],[488.5,186],[493,199],[495,241]]],evidence='trace-north.png; 학교 옆 도로'))
plan['gardens']=[g for g in plan['gardens'] if g['name']!='북쪽 녹지']
ref['roads']=[{'id':r['id'],'width':r['width'],'pixels':[[round(p[0]/plan['pixelTransform']['x']+640,3),round(p[1]/plan['pixelTransform']['z']+360,3)] for p in r['points']],'source':r.get('evidence','확대 일반 지도')} for r in plan['roads']]
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
json.dump(ref,open(out/'parking-reference.json','w'),ensure_ascii=False,indent=2)
# The public road between the three lots is part of the visible comparison too.
plan['roads'].append(dict(id='solsaem-road',width=18,points=[local(q) for q in [[817,184],[769,219],[729,255],[705,294],[687,333],[684.25,355],[682.5,390],[685,430],[693,467.5],[704.75,517.5],[709,535],[715.5,580],[718,633],[718,655]]],evidence='source-map.png, trace-east.png, trace-south.png; 솔샘로',publicRoad=True))
ref['roads']=[{'id':r['id'],'width':r['width'],'pixels':[[round(p[0]/plan['pixelTransform']['x']+640,3),round(p[1]/plan['pixelTransform']['z']+360,3)] for p in r['points']],'source':r.get('evidence','확대 일반 지도')} for r in plan['roads']]
json.dump(plan,open(out/'plan.json','w'),ensure_ascii=False,indent=2)
json.dump(ref,open(out/'parking-reference.json','w'),ensure_ascii=False,indent=2)
