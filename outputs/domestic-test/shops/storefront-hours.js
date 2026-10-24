// Art-direction defaults, not verified business opening hours.
const DAY=1440;
const wrap=n=>((n%DAY)+DAY)%DAY;
export function stableHash(text){let h=2166136261;for(const c of text){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
export function clockText(minute){const m=wrap(Math.round(minute));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
export function scheduleFor(spec){
  const seed=stableHash(spec.id),selfService=spec.category==='laundry'&&['laundry-01','laundry-03'].includes(spec.id);
  const presets={convenience:[0,0],salon:[600,1260],estate:[570,1250],laundry:[540,1260],cafe:[540,1320],food:[660,1320]};
  const [open,close]=presets[spec.category]||[600,1260];
  const schedule={alwaysOpen:spec.category==='convenience'||selfService,openMinute:open,closeMinute:wrap(close+((seed%5)-2)*5),cleanupMinutes:10+((seed>>>5)%3)*5,kind:selfService?'무인 세탁소':spec.category==='convenience'?'24시간 편의점':'일반 매장',source:'art-direction defaults'};
  return {...schedule,...spec.hours};
}
export function lightingState(spec,hour){
  const schedule=scheduleFor(spec),minute=wrap(Number.isFinite(Number(hour))?Number(hour)*60:1200);
  const duration=wrap(schedule.closeMinute-schedule.openMinute),elapsed=wrap(minute-schedule.openMinute);
  const open=schedule.alwaysOpen||elapsed<duration;
  const cleanup=!open&&wrap(minute-schedule.closeMinute)<schedule.cleanupMinutes;
  return {schedule,hour:minute/60,phase:open?'open':cleanup?'cleanup':'closed',sign:open?1:0,interior:open?1:cleanup?.55:0,label:open?(schedule.alwaysOpen?'24시간 영업':'영업 중'):cleanup?'마감 정리 · 실내만 점등':'폐점 · 소등'};
}
