import {solarPosition,SOLAR_CONTEXT} from './solar-position.js?v=36';
export {SOLAR_CONTEXT};
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function blend(a,b,t){const A=rgb(a),B=rgb(b);return '#'+A.map((c,i)=>Math.round(mix(c,B[i],clamp(t))).toString(16).padStart(2,'0')).join('');}
const PALETTES={
 day:{zenith:'#438ed5',horizon:'#d1e7f8',cloud:'#fbfdff',sun:'#f9fcff',ground:'#687585',tint:'#ffffff',terrain:'#69836e',haze:'#a8c8e3'},
 dawn:{zenith:'#9eafcb',horizon:'#f4d7b2',cloud:'#f4dfcf',sun:'#ffd3a3',ground:'#858079',tint:'#e9dcd3',terrain:'#828376',haze:'#d3c6bc'},
 sunset:{zenith:'#97a5c9',horizon:'#ffd3a0',cloud:'#ffd5c3',sun:'#ffbd83',ground:'#9f8777',tint:'#ffe6d0',terrain:'#928579',haze:'#e2bb9e'},
 twilight:{zenith:'#667b9d',horizon:'#e7ad90',cloud:'#bda0ae',sun:'#ffa66f',ground:'#7c7985',tint:'#c1b1ba',terrain:'#69717c',haze:'#a499a6'},
 night:{zenith:'#101b35',horizon:'#465470',cloud:'#46536d',sun:'#a5bded',ground:'#4c5f7c',tint:'#687b9d',terrain:'#243349',haze:'#34465f'},
 deep:{zenith:'#091225',horizon:'#2b3c58',cloud:'#2e3d56',sun:'#9aafcf',ground:'#40536d',tint:'#576d8d',terrain:'#1d2a3e',haze:'#293a53'}
};
function palette(a,b,t){return Object.fromEntries(Object.keys(a).map(k=>[k,blend(a[k],b[k],t)]));}
// Stable occupancy curve, unrelated to the random window pattern. Returning to a
// previous hour restores the same illuminated windows; late-night sets are nested.
export const WINDOW_OCCUPANCY=[.40,.27,.17,.09,.06,.10,.15,.12,.04,.02,.01,.01,.01,.01,.01,.02,.08,.22,.48,.70,.78,.72,.62,.50];
export function normalizeHour(value=12){const legacy={morning:8,day:12,evening:17,night:21};const h=typeof value==='string'&&value in legacy?legacy[value]:Number(value);return Number.isFinite(h)?((h%24)+24)%24:12;}
export function occupancyAt(hour){const h=normalizeHour(hour),i=Math.floor(h);return mix(WINDOW_OCCUPANCY[i],WINDOW_OCCUPANCY[(i+1)%24],h-i);}
// Artistic high sun for readable midday alley scenes. Keep the astronomical
// elevation intact for sunrise/night logic and metadata. Taper the correction
// smoothly to zero toward dawn/dusk; never lower an already higher summer sun.
export function renderedSunElevation(hour,solar){
 const e=solar.elevation;if(e<=0)return e;
 const offset=Math.abs(normalizeHour(hour)-solar.solarNoon);
 const weight=(1-smooth(1.75,4.75,offset))*smooth(3,18,e);
 return mix(e,Math.max(e,74-3*offset*offset),weight);
}
export function environmentProfile(time=12,weather='clear',context=SOLAR_CONTEXT){
 const hour=normalizeHour(time),solar=solarPosition(hour,context),e=solar.elevation;
 const renderElevation=renderedSunElevation(hour,solar);
 const morning=hour<solar.solarNoon;
 const deep=smooth(22,27,hour<12?hour+24:hour)*(1-smooth(4,6,hour<12?hour:0));
 const nightPalette=palette(PALETTES.night,PALETTES.deep,deep);
 let colors;
 if(e<-6)colors=palette(nightPalette,PALETTES.twilight,smooth(-16,-6,e));
 else if(e<0)colors=palette(PALETTES.twilight,morning?PALETTES.dawn:PALETTES.sunset,smooth(-6,0,e));
 else colors=palette(morning?PALETTES.dawn:PALETTES.sunset,PALETTES.day,smooth(9,32,renderElevation));
 // Keep a readable golden hour; remove direct sun entirely below the horizon.
 const daylight=smooth(-10,12,e),sunset=smooth(-12,-1,e)*(1-smooth(10,26,renderElevation))*(morning?.55:1);
 const night=1-smooth(-7,8,e),direct=smooth(-.5,7,e);
 const p={...colors,...solar,renderElevation,lightingModel:'webtoon-sun-contrast-v3',dayClarity:0,time:hour,hour,weather,date:context.date,utcOffset:context.utcOffset,
  label:String(Math.floor(hour)).padStart(2,'0')+':00',cloudiness:weather==='clear'?0:1,
  night,sunset,sunVisibility:smooth(-1,.5,e),sunIntensity:direct*mix(1.85,2.45,smooth(7,45,renderElevation)),
  ambient:mix(mix(.58,.42,deep),2.2,daylight),skyLight:blend('#a1b5d5',colors.zenith,daylight),
  windowChance:occupancyAt(hour),windowIntensity:mix(.18,.95,night),castsSunShadow:weather==='clear'&&e>.5
 };
 if(weather==='cloudy'){
  p.zenith=blend('#182235',blend('#9aaab3','#a7a5b6',sunset),daylight);
  p.horizon=blend('#3b485b',blend('#d4d8d5','#e6c6b1',sunset),daylight);
  p.sunIntensity*=.28;p.ambient*=.92;p.haze=p.horizon;p.tint=blend(p.tint,blend('#606e8a','#d9dfe0',daylight),.5);
 }
 if(weather==='rain'||weather==='snow'){
  const snow=weather==='snow';p.zenith=blend('#172338',snow?'#aebbc8':'#7e919f',daylight);p.horizon=blend('#35465d',snow?'#e2e8eb':'#b7c5cb',daylight);
  p.cloud=blend('#39465b',snow?'#e4e9ed':'#b3bfc7',daylight);p.sunIntensity*=snow?.2:.12;p.ambient*=snow?.92:.76;p.haze=p.horizon;p.tint=blend('#60748e',snow?'#e1e8ee':'#c2d0d9',daylight);
 }
 p.skyLight=blend('#a1b5d5',p.zenith,daylight);
 // The visible blue sky and its diffuse illumination have different saturation:
 // a pale blue fill keeps shaded walls crisp without tinting every material blue.
 if(weather==='clear'){
  const crispDay=smooth(12,32,renderElevation);
  p.dayClarity=crispDay;
  p.skyLight=blend(p.skyLight,'#d4e8ff',crispDay);
  p.ambient=mix(p.ambient,3.1,crispDay);
  p.sunIntensity=mix(p.sunIntensity,3.6,crispDay);
 }
 // Lower fill only under clear direct sun; retain the bright sunlit faces.
 if(weather==='clear'){const contrast=smooth(0,12,e);p.ambient*=mix(1,.74,contrast);p.sunIntensity*=mix(1,1.10,contrast);}
 return p;
}
export function windowLightBand(seed){let x=Math.trunc(seed)|0;x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return (x^(x>>>16))>>>28;}
export function windowIsLit(band,chance){return (band+.5)/16<chance;}
export function bearingVector(degrees,elevation=0){const a=degrees*Math.PI/180,p=elevation*Math.PI/180;return [Math.sin(a)*Math.cos(p),Math.sin(p),-Math.cos(a)*Math.cos(p)];}
