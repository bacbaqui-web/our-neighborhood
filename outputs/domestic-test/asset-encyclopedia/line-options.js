import {normalizeAppearance} from '../illustration-settings.js';
export const CATALOG_LINES=Object.freeze(normalizeAppearance({lines:true,outerWidth:2,outerFace:true,outerBrightness:77,outerSaturation:200,minDistance:200,acrossObjects:true,innerWidth:2,innerAngle:16.4,innerFace:true,innerBrightness:90,innerSaturation:152}));
export function mountLineOptions(host,onChange){
 let state={...CATALOG_LINES};const controls=[];
 const title=document.createElement('summary');title.textContent='선 · 외부선·내부선';host.append(title);
 const check=(key,label)=>{const l=document.createElement('label'),i=document.createElement('input');l.className='line-check';i.type='checkbox';i.checked=state[key];i.id='line-'+key;l.append(i,document.createTextNode(label));i.onchange=()=>{state[key]=i.checked;onChange({...state});};host.append(l);controls.push(()=>i.checked=state[key]);};
 const heading=text=>{const h=document.createElement('h3');h.textContent=text;host.append(h);};
 const hint=text=>{const p=document.createElement('p');p.className='hint';p.textContent=text;host.append(p);};
 const number=(key,label,min,max,step,unit)=>{const row=document.createElement('label');row.className='line-row';row.htmlFor='line-'+key;const name=document.createElement('span');name.textContent=label;const slider=document.createElement('input'),input=document.createElement('input'),field=document.createElement('span'),suffix=document.createElement('span');slider.type='range';input.type='number';input.id='line-'+key;slider.setAttribute('aria-label',label+' 슬라이더');input.setAttribute('aria-label',label);for(const el of[slider,input]){el.min=min;el.max=max;el.step=step;}suffix.textContent=unit;field.className='line-number';field.append(input,suffix);row.append(name,slider,field);host.append(row);
 const sync=()=>{slider.value=input.value=state[key];slider.setAttribute('aria-valuetext',state[key]+' '+unit);};
 for(const el of[slider,input])el.oninput=()=>{if(el.value===''||!Number.isFinite(el.valueAsNumber))return;state=normalizeAppearance({...state,[key]:el.valueAsNumber});sync();onChange({...state});};input.onchange=sync;controls.push(sync);sync();};
 check('lines','선 표시');const reset=document.createElement('button');reset.type='button';reset.textContent='↻';reset.className='line-reset';reset.setAttribute('aria-label','선 설정 초기화');reset.title='캡처 설정으로 초기화';reset.onclick=()=>{state={...CATALOG_LINES};controls.forEach(fn=>fn());onChange({...state});};host.append(reset);
 heading('외부선');number('outerWidth','외부선 두께',0,6,.1,'px');check('outerFace','외부선에 면색 적용');number('outerBrightness','외부선 명도',0,200,1,'%');number('outerSaturation','외부선 채도',0,200,1,'%');number('minDistance','최소 거리',0,200,1,'cm');check('acrossObjects','다른 오브젝트 사이에도 적용');hint('앞뒤 면의 간격이 작으면 숨김 · 0cm는 제한 없음');
 heading('내부선');number('innerWidth','내부선 두께',0,6,.1,'px');number('innerAngle','내부선 각도',1,90,.1,'°');hint('낮으면 작은 굴곡까지 표시 · 기본 약 20.74°');check('innerFace','내부선에 면색 적용');number('innerBrightness','내부선 명도',0,200,1,'%');number('innerSaturation','내부선 채도',0,200,1,'%');hint('면색 기준 · 명도·채도 100%는 원래 면색');
 return ()=>({...state});
}
