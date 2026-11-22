import React, {useState} from 'react';
import {Layout,LayoutHeader,LayoutContent} from '@astryxdesign/core/Layout';
import {Heading,Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Section} from '@astryxdesign/core/Section';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack,VStack} from '@astryxdesign/core/Stack';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Divider} from '@astryxdesign/core/Divider';
import data from './data.json';
const GROUPS=['신호시설','노면표시','표지판','도로 부속시설','단속장비'];
const combos=[['1차 × 1차','작은 길–작은 길','접속면·가장자리·배수부터. 횡단보도·신호기 자동 추가 금지.'],['1차 × 2차','작은 길–보도 있는 본선','본선 연석·턱낮춤·배수 연결. 본선 중앙선 유지 여부 확인.'],['1차 × 3차','골목–다차로 본선','분리대·회전 제한 보존. 골목 접속만으로 횡단·좌회전 만들지 않음.'],['1차 × 4차','골목–큰 본선','실제 진입 방향·접근 제한 우선. 본선 시설을 일괄 삭제하지 않음.'],['2차 × 2차','보도 있는 T자·십자','보행 연결·정지선·횡단부 세트 검토. 신호 제어는 별도 확인.'],['2차 × 3차','보도 있는 길–다차로','차로 종료·회전 경로·보행 연결을 함께 검토.'],['2차 × 4차','보도 있는 길–큰 본선','분리시설·전용차로·통행 제한 보존 후 접속부 구성.'],['3차 × 3차','다차로 T자·십자','차로별 방향·회전 유도·횡단 접근부 구성.'],['3차 × 4차','다차로–큰 본선','기둥·표지·단속시설은 실제 정보가 있는 것만 선택.'],['4차 × 4차','큰 다차로 교차','분리대·교통섬·전용차로·횡단시설을 개별 확인.']];
type Asset=typeof data.items[number];
function AssetCard({item,index}:{item:Asset,index:number}) {
 const [failed,setFailed]=useState(false);
 return <Card padding={0}><Section variant="transparent" padding={4}><VStack gap={4}>
  <HStack gap={2} wrap="wrap"><Text type="label" color="secondary">{item.id} · {item.status}</Text><Text type="label" color="secondary">{item.priority==='기본'?'먼저 준비':'설치 확인 후 선택'}</Text></HStack>
  <Heading level={3}>{item.name}</Heading>
  <figure style={{margin:0}}>
   <a href={item.image} target="_blank" rel="noopener noreferrer" aria-label={`${item.name} 참고 이미지 크게 보기`}>
    <img src={item.image} alt={`${item.name} — ${item.kind}, ${item.credit}`} width={640} height={360} loading={index<3?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)} style={{width:'100%',height:'auto',aspectRatio:'16 / 9',objectFit:'contain',background:'var(--color-background-primary)'}} />
   </a>
   <figcaption><Text type="supporting" color="secondary">{item.kind} · {item.credit}</Text></figcaption>
  </figure>
  {failed&&<Text>외부 이미지 연결을 불러오지 못했습니다. 아래 원문에서 확인해 주세요.</Text>}
  <Text type="body" size="sm">{item.note}</Text>
  <Divider/>
  <VStack gap={1}><Text type="label">제작 범위 · {item.form}</Text><Text>{item.variants}</Text></VStack>
  <VStack gap={1}><Text type="label">배치 조건</Text><Text>{item.placement}</Text></VStack>
  <Text type="supporting" color="secondary">{item.existing?`기존 후보: ${item.existing} · 실제 사용 승인과 자동 배치는 별도 확인`:'현재 목록에서 직접 대응하는 등록 항목을 확인하지 못한 신규 후보'}</Text>
  <HStack gap={2} wrap="wrap"><Button label="참고 원문 열기" href={item.source} target="_blank" rel="noopener noreferrer" variant="secondary"/>{item.existing&&<Button label="기존 에셋 보기" href={`../asset-encyclopedia/#${encodeURIComponent(item.existing)}`} target="_blank" rel="noopener noreferrer" variant="ghost"/>}</HStack>
 </VStack></Section></Card>;
}
export default function Report(){
 const [category,setCategory]=useState('전체');const [status,setStatus]=useState('전체 작업');const [search,setSearch]=useState('');
 const items=data.items.filter(i=>(category==='전체'||i.group===category)&&(status==='전체 작업'||i.status===status)&&[i.name,i.id,i.variants,i.placement,i.existing].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
 const existing=data.items.filter(i=>i.existing).length;
 return <Layout header={<LayoutHeader hasDivider padding={6}><HStack gap={4} wrap="wrap"><Heading level={1}>교차로 에셋 제작 목록</Heading><Button label="우리동네 열기" href="../start.html" variant="ghost"/></HStack></LayoutHeader>} content={<LayoutContent padding={6}><VStack gap={6}>
  <VStack gap={4}><Text type="label" color="secondary">우리동네 · 지침 기준 2026.11.22</Text><Heading level={2}>무엇을 만들고, 어디에 놓을지</Heading><Text type="body" size="lg">50개 에셋 묶음에 참고 이미지와 제작 범위를 붙였습니다. 신호시설 9 · 노면표시 15 · 표지판 12 · 도로 부속시설 12 · 단속장비 2</Text><Text>기존 보완 {existing}개 · 신규 후보 {50-existing}개. 변형을 묶은 제작 항목 수이며 완성 모델 수가 아닙니다. 도로 등급은 기본 단면을 정하고, 시설 설치는 실제 교통 통제와 보행 연결을 확인해 결정합니다.</Text><HStack gap={2} wrap="wrap"><Button label="제작 목록 CSV 내려받기" href="./asset-list.csv" download="교차로-에셋-제작목록.csv" variant="primary"/><Button label="도로 조합별 적용 보기" href="#road-combinations" variant="secondary"/></HStack></VStack>
  <Card padding={4}><VStack gap={2}><Heading level={2}>먼저 지킬 배치 원칙</Heading><Text>연결 관계 → 차도·보도·연석 → 선의 종료·재개 → 횡단·정지·턱낮춤 → 분리대·기둥·표지·배수 순서로 구성합니다.</Text><Text>횡단보도·양쪽 경사판·점형 블록은 한 묶음으로 보행 공간 안에 들어가야 합니다. 차량 진행 방향에서는 정지선 다음에 횡단보도를 만납니다. 기둥·볼라드·제어함은 그 통로를 침범하지 않아야 합니다.</Text><Text type="supporting" color="secondary">현재 지침의 서울 25개 위치·200장 관찰은 모든 등급 조합의 실측을 뜻하지 않습니다. 아래 조합은 제작 분류이며 10개 조합 모두를 관찰했다는 뜻이 아닙니다.</Text></VStack></Card>
  <VStack gap={4}><TextInput label="에셋 검색" placeholder="이름·제작 범위·기존 ID 검색" value={search} onChange={setSearch} type="search" size="lg" hasClear/><HStack gap={2} wrap="wrap">{['전체',...GROUPS].map(g=><Button key={g} label={g} variant={category===g?'primary':'secondary'} onClick={()=>setCategory(g)} aria-pressed={category===g}/>)}</HStack><HStack gap={2} wrap="wrap">{['전체 작업','신규 후보','기존 보완'].map(s=><Button key={s} label={s} variant={status===s?'primary':'ghost'} onClick={()=>setStatus(s)} aria-pressed={status===s}/>)}</HStack><Text role="status" aria-live="polite">{items.length}개 항목 표시</Text></VStack>
  {items.length===0?<Card padding={6}><VStack gap={4}><Text>조건에 맞는 에셋이 없습니다. 검색어나 분류를 바꿔 주세요.</Text><Button label="검색과 필터 초기화" onClick={()=>{setSearch('');setCategory('전체');setStatus('전체 작업')}}/></VStack></Card>:GROUPS.filter(g=>items.some(i=>i.group===g)).map(g=><VStack key={g} gap={6}><Divider/><Heading level={2}>{g} · {items.filter(i=>i.group===g).length}</Heading><Grid columns={{minWidth:320}} gap={4}>{items.filter(i=>i.group===g).map(i=><AssetCard key={i.id} item={i} index={items.indexOf(i)}/>)}</Grid></VStack>)}
  <Divider/><section id="road-combinations"><VStack gap={4}><Heading level={2}>도로 조합별 적용</Heading><Text>1차: 보도 없는 보차혼용 골목 · 2차: 전체 2차로와 보도 · 3차: 전체 4차로 · 4차: 전체 6차로 이상. T자·십자·갈림길 여부는 등급과 별도로 기록합니다.</Text>{combos.map(([pair,type,rule])=><VStack key={pair} gap={1}><Heading level={3}>{pair} · {type}</Heading><Text>{rule}</Text><Divider/></VStack>)}</VStack></section>
  <VStack gap={4}><Heading level={2}>제작·검수 범위</Heading>{data.pending.map(p=><VStack key={p.name} gap={1}><Text type="label">{p.name}</Text><Text>{p.reason}</Text></VStack>)}<Text>부품은 미터 단위, +Y 위 방향, 접속점의 위치·높이·방향을 기록합니다. 선 폭·돌기 크기·연석 높이를 유지하고 길이·곡률은 원본에서 다시 생성합니다. 접합 틈, 겹친 면, 막힌 횡단부, 불필요한 분리대 단절, 금지 회전 연결, 시설 간섭을 확인합니다.</Text><Text>이 페이지는 제작 준비 보고서입니다. 모델 제작 완료·백과 등록 완료·자동 동네 배치 적용을 뜻하지 않습니다. 기존 후보의 폐기·승인 상태는 제작 전에 백과에서 다시 확인합니다.</Text></VStack>
  <Divider/><VStack gap={3}><Heading level={2}>근거와 이미지 이용 범위</Heading><Text>프로젝트 통합 지침의 「교차로 연결과 도로 시설」 및 「교차로 자동 생성 검토 보완」과 도로·소품 에셋 목록을 대조했습니다. 법령 그림은 표시된 개정판의 형상 참고 자료이며 최신 법정 설치 치수의 확정 자료가 아닙니다.</Text><Text>제품 사진은 원본 서버에 연결하며 각 카드에 출처를 표시했습니다. 외부 사진의 권리는 원저작자에게 있습니다. 사진을 모델 텍스처나 배포 에셋에 복사할 수 있다는 뜻은 아닙니다. 로드뷰 사진은 이 공개 보고서에 포함하지 않았습니다.</Text><HStack gap={2} wrap="wrap"><Button label="프로젝트 지침" href="https://github.com/bacbaqui-web/our-neighborhood/blob/main/docs/project-guidelines.txt" target="_blank" rel="noopener noreferrer" variant="ghost"/><Button label="에셋 백과" href="../asset-encyclopedia/" variant="ghost"/><Button label="도로교통법 시행규칙" href="https://www.law.go.kr/법령/도로교통법시행규칙" target="_blank" rel="noopener noreferrer" variant="ghost"/></HStack></VStack>
 </VStack></LayoutContent>}/>;
}
