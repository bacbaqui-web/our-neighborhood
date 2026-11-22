import React from 'react';
import {Layout,LayoutHeader,LayoutContent} from '@astryxdesign/core/Layout';
import {Heading,Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack,VStack} from '@astryxdesign/core/Stack';
import {Button} from '@astryxdesign/core/Button';
import {Divider} from '@astryxdesign/core/Divider';
import review from './review.json';
import guidelines from './guidelines.json';
export default function GuidelineReview(){
 return <Layout header={<LayoutHeader hasDivider padding={6}><HStack gap={4} wrap="wrap"><Heading level={1}>교차로 지침 검토 결과</Heading><Button label="50개 에셋 목록 보기" href="./" variant="ghost"/></HStack></LayoutHeader>} content={<LayoutContent padding={6}><VStack gap={6}>
  <VStack gap={4}><Text type="label" color="secondary">2026.11.22 · 독립 검토 3건 취합</Text><Heading level={2}>{review.decisions.length}개 보완점을 반영한 통합 지침</Heading><Text type="body" size="lg">논리·우선순위, 기하·조립, 교통시설·근거를 각각 검토하고 {guidelines.sections.length}개 항목·{guidelines.sections.reduce((n,s)=>n+s.paragraphs.length,0)}개 규칙으로 정리했습니다. 수정안을 세 에이전트가 다시 읽었으며, 검토 범위에서 중요한 잔여 충돌은 발견되지 않았습니다.</Text><Text>검토 범위: {review.scope}. 생성기와 모델은 이번에 수정하지 않았습니다. 새 규칙의 구현·실행 검증과 최신 법정 수치 확인은 남아 있습니다.</Text><HStack gap={2} wrap="wrap"><Button label="통합 지침 TXT 내려받기" href="./guidelines.txt" download="교차로-통합지침-20261122.txt" variant="primary"/><Button label="통합 지침 읽기" href="#guidelines" variant="secondary"/><Button label="검토 결과 3개 보기" href="#independent-reviews" variant="secondary"/></HStack></VStack>
  <section aria-labelledby="changes-title"><VStack gap={4}><Heading level={2} id="changes-title">무엇을 바꿨나요</Heading>{review.decisions.map((d,i)=><VStack gap={2} key={d.topic}><Heading level={3}>{String(i+1).padStart(2,'0')} · {d.topic}</Heading><Text color="secondary">이전: {d.before}</Text><Text>반영: {d.after}</Text><Text type="supporting" color="secondary">통합 지침 {d.section}</Text><Divider/></VStack>)}</VStack></section>
  <section id="independent-reviews" aria-labelledby="reviews-title"><VStack gap={4}><Heading level={2} id="reviews-title">세 에이전트의 독립 검토</Heading><Text>{review.method}</Text><Grid columns={{minWidth:320}} gap={4}>{review.reviews.map(r=><Card padding={4} key={r.name}><VStack gap={4}><Heading level={3}>{r.name}</Heading><Text color="secondary">{r.scope}</Text><ul>{r.findings.map(f=><li key={f}><Text as="p">{f}</Text></li>)}</ul><Text type="label">통합안 재검토</Text><Text>{r.recheck}</Text></VStack></Card>)}</Grid></VStack></section>
  <Divider/><section id="guidelines" aria-labelledby="guidelines-title"><VStack gap={4}><Heading level={2} id="guidelines-title">통합 지침 원문</Heading><Text>프로젝트 통합 문서에서 직접 가져온 읽기 전용 발췌입니다. 수정 원본은 하나이며, 웹페이지에서 별도 규칙을 관리하지 않습니다. 제목을 누르면 항목별 내용을 펼칠 수 있습니다.</Text><Heading level={3}>도로 분류</Heading>{guidelines.grades.map(p=><Text as="p" key={p}>{p}</Text>)}{guidelines.sections.map(s=><details key={s.title}><summary>{s.title}</summary><VStack gap={3}>{s.paragraphs.map(p=><Text as="p" key={p}>{p}</Text>)}</VStack></details>)}</VStack></section>
  <Divider/><VStack gap={4}><Heading level={2}>확정하지 않은 범위</Heading>{review.limits.map(p=><Text as="p" key={p}>{p}</Text>)}<Text>특히 새 횡단 형식·복합 접속·최종 면 접지·시설 전체 외형·교차로 점등 조건은 실제 생성 결과를 별도로 검사해야 합니다. 기존에 통과한 장면을 이번 신규 조건의 검증 결과로 재사용하지 않습니다.</Text></VStack>
  <Divider/><VStack gap={3}><Heading level={2}>근거와 원본</Heading><Button label="프로젝트 통합 지침 원본" href="https://github.com/bacbaqui-web/our-neighborhood/blob/main/docs/project-guidelines.txt" target="_blank" rel="noopener noreferrer" variant="ghost"/>{review.sources.map(s=><VStack gap={1} key={s.url}><Button label={s.title} href={s.url} target="_blank" rel="noopener noreferrer" variant="ghost"/><Text color="secondary">{s.scope}</Text></VStack>)}</VStack>
 </VStack></LayoutContent>}/>;
}
