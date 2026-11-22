import {cases} from './cases.js';
// Reuse the report's model factory. These assemblies illustrate assumptions, not map placements.
export const housingExamples=cases.map(c=>({
 id:'example:housing-'+c.id,key:c.id,name:c.name+' · 조사 예시',category:'주택·출입구',
 collection:'주택·담장 조사 예시',kind:'part',pack:'grade1-housing-report',
 note:'설명용 조립 예시 · 자동 배치 대상 아님. '+c.assumption,
 link:'../grade1-housing-report/#'+c.id,
 modelSource:'../grade1-housing-report/models.js',
 placement:{status:'reference-only',automatic:false,reason:'조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다.'}
}));
