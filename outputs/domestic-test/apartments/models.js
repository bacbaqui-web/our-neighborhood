import * as T from 'three';
import {FacadeBatch} from '../korean-facades.js';
import {inPolygon} from '../facilities/placement.js';
const eras=[{id:'old',name:'구축',wall:0xcac6b4,accent:0x8c9b8b,glass:0x718b87,roof:0x7e9680},{id:'middle',name:'중간 시대',wall:0xd5c9af,accent:0x9b7860,glass:0x728d91,roof:0x716e64},{id:'new',name:'신식',wall:0xd9dcd3,accent:0x505f63,glass:0x69858d,roof:0x879394}];
export const apartmentCatalog=eras.flatMap(e=>['긴 동','꺾인 동','타워와 혼합'].map((shape,i)=>({...e,id:`${e.id}-${i+1}`,era:e.id,variant:i,name:`${e.name} · ${shape}`,source:'../apartment-research/',nominalLevels:([5,12,15,15,18,22,20,25,30])[eras.indexOf(e)*3+i]})));
const hash=s=>Array.from(String(s)).reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,7);
export function chooseApartment(b){
 const p=b.properties||{},name=p.building_name||p.buld_nm_dc||b.address||String(b.seed),key=name.replace(/\s*\d+동.*$/,'');
 const raw=String(p.useAprDay||p.use_apr_day||p.approval_date||''),year=Number(raw.slice(0,4));
 let era=p.apartment_era,source='설정';
 if(!eras.some(e=>e.id===era)){if(year>=1900&&year<=2100){era=year<1995?'old':year<2010?'middle':'new';source='준공 기록';}else{era=/주공|시영/.test(name)?'old':/원베일리|디에이치|아크로/.test(name)?'new':'middle';source='유형 추정 · 준공 연도 없음';}}
 let variant=p.apartment_variant; if(!Number.isInteger(variant)||variant<0||variant>2)variant=b.points.length>6?1:b.levels>=22?2:hash(key)%3;
 return {...apartmentCatalog.find(a=>a.era===era&&a.variant===variant),selection:source,complexKey:key};
}
function edges(b){const ps=b.points,sign=Math.sign(ps.reduce((v,p,i)=>{const q=ps[(i+1)%ps.length];return v+p[0]*q[1]-q[0]*p[1]},0))||1;return ps.map((a,i)=>{const c=ps[(i+1)%ps.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]),ux=(c[0]-a[0])/L,uz=(c[1]-a[1])/L;return {i,a,L,ux,uz,nx:uz*sign,nz:-ux*sign}}).filter(e=>e.L>.5);}
export function emitApartment(batch,b){
 const style=b.apartment||chooseApartment(b);b.apartment=style;const H=b.top-b.base,levels=Math.max(1,Math.round(b.levels)),fh=H/levels,es=edges(b),longest=Math.max(...es.map(e=>e.L));let windows=0;
 const insideBox=(e,x,z,w,d)=>[-1,0,1].every(u=>[-1,0,1].every(v=>inPolygon([e.a[0]+e.ux*(x+u*w/2)+e.nx*(z+v*d/2),e.a[1]+e.uz*(x+u*w/2)+e.nz*(z+v*d/2)],b.points)&&!(b.holePoints||[]).some(h=>inPolygon([e.a[0]+e.ux*(x+u*w/2)+e.nx*(z+v*d/2),e.a[1]+e.uz*(x+u*w/2)+e.nz*(z+v*d/2)],h))));
 for(const e of es){const {L,i}=e,out=batch.writer([e.a[0],b.base,e.a[1]],e.ux,e.uz,e.nx,e.nz),B=out.box,Q=out.quad;
 Q(L/2,H/2,.018,L,H,style.wall);B(L/2,H+.3,-.09,L,.6,.18,style.wall);B(L/2,.7,.025,L,1.4,.035,style.accent);
 const entrance=i===(b.frontEdge??es[0].i)&&L>4,doorX=L*(b.frontFraction??.5);
 const main=L>longest*.46,cols=Math.max(1,Math.floor(L/(main?3.2:3.8))),pw=L/cols,back=i%2===1;
 if(style.era==='new')for(let j=0;j<cols;j+=3)B((j+.93)*pw,H/2,.54,.16,H,.08,style.accent);
 if(main)for(let j=2;j<cols;j+=5)B((j+.5)*pw,H/2,.025,1.25,H,.03,style.accent);
 // Build a continuous outer wall with real openings. The original shell is the
 // back of the reveal; glazing sits between it and the outer wall face.
 const openings=[];
 for(let r=0;r<levels;r++)for(let j=0;j<cols;j++){
  const stair=main&&j%5===2,x=(j+.5)*pw;
  const w=r===0?(stair?.62:Math.min(pw-.65,2.2)):(stair?.75:Math.min(pw-.35,style.era==='new'?2.25:2.65));
  const h=r===0?(stair?.92:1.42):(stair?fh*.5:fh*.65),y=r===0?(stair?1.92:1.83):r*fh+fh*.57;
  if(r===0&&entrance&&Math.abs(x-doorX)<((stair?.75:Math.min(pw-.35,style.era==='new'?2.25:2.65))/2+1.85))continue;
  openings.push({x0:x-w/2-.065,x1:x+w/2+.065,y0:y-h/2-.065,y1:y+h/2+.065});
 }
 if(entrance)openings.push({x0:doorX-1.52,x1:doorX+1.52,y0:0,y1:2.77});
 const cuts=[...new Set([0,H,...openings.flatMap(a=>[a.y0,a.y1])])].filter(y=>y>=0&&y<=H).sort((a,b)=>a-b);
 for(let k=0;k<cuts.length-1;k++){
  const lo=cuts[k],hi=cuts[k+1],mid=(lo+hi)/2,holes= openings.filter(a=>a.y0<hi&&a.y1>lo).sort((a,b)=>a.x0-b.x0);let start=0;
  const panel=(end)=>{if(end>start+.001)B((start+end)/2,mid,.27,end-start,hi-lo,.5,mid<.48?0x8e9085:mid<3?0xc5c0ae:style.wall);};
  for(const hole of holes){panel(Math.max(0,hole.x0));start=Math.max(start,hole.x1);}panel(L);
 }
 for(let r=0;r<levels;r++)for(let j=0;j<cols;j++){
 const stair=main&&j%5===2,x=(j+.5)*pw,y=r*fh+fh*.57,w=stair?.75:Math.min(pw-.35,style.era==='new'?2.25:2.65),h=stair?fh*.5:fh*.65;
 if(r===0){
  // Reserve the entire lobby bay; do not draw a residential window behind the door.
  if(entrance&&Math.abs(x-doorX)<(w/2+1.85))continue;
  const ww=stair?.62:Math.min(pw-.65,2.2),hh=stair?.92:1.42,yy=stair?1.92:1.83,frame=0xd8d9cf;
  Q(x,yy,.105,ww,hh,stair?0x6e8280:style.glass);
  for(const xx of [-ww/2,ww/2])B(x+xx,yy,.16,.075,hh+.12,.19,frame);
  for(const dy of [-hh/2,hh/2])B(x,yy+dy,.18,ww+.12,.075,.24,frame);
  B(x,yy,.21,.045,hh,.045,frame);B(x,yy-.3,.215,ww,.035,.04,frame);
  B(x,yy-hh/2-.09,.23,ww+.22,.13,.38,0xaaa99a);
  if(!stair){Q(x,yy-.36,.225,ww-.1,.55,0x94a29b);for(const xx of [-ww*.43,ww*.43])B(x+xx,yy-.35,.25,.025,.5,.03,0xc9cdc2);}
  continue;
 }


 // Thin frames sit inside the wall opening; the reveal remains visible from the side.
 const frame=style.era==='old'?0xd1d0bf:0xe0dfd3,depth=.16;
 Q(x,y,.075,w,h,((r+j)%11===0)?0x9eaaa4:style.glass);
 for(const xx of [-w/2,w/2])B(x+xx,y,depth/2,.085,h+.14,depth,frame);
 for(const yy of [-h/2,h/2])B(x,y+yy,depth/2,w+.12,.09,depth,frame);
 for(let m=1;m<3;m++)B(x-w/2+w*m/3,y,depth-.035,.045,h,.065,frame);
 B(x,y-h*.18,depth-.02,w,.045,.055,frame);windows++;
 if(!stair){
 B(x,r*fh+.15,.50,pw-.10,.13,.08,style.wall);
 B(x,y-h/2-.22,.48,w+.18,.25,.08,style.wall);
 if(style.era!=='new'){B(x,y-h/2+.52,.42,w,.035,.04,0x8f9b97);B(x,y-h/2+.08,.42,w,.03,.04,0x8f9b97);for(let k=0;k<=10;k++)B(x-w/2+w*k/10,y-h/2+.3,.42,.018,.44,.025,0x8f9b97);}
 if(style.era==='middle'){B(x-pw*.46,r*fh+fh/2,.535,.09,fh,.035,style.accent);}
 if(style.era!=='new'&&(r+j*3)%7===0){B(x+w*.28,r*fh+.48,.57,.68,.46,.33,0xc2c3b5);for(let l=0;l<4;l++)B(x+w*.28,r*fh+.34+l*.085,.75,.52,.025,.025,0x7a8580);}
 }else{B(x,y-h/2-.13,.47,w+.3,.12,.10,style.accent);}

 }
 if(main&&L>=8){const n=Math.max(1,Math.floor(L/15));for(let k=0;k<n;k++){const x=L*(k+.5)/n,w=Math.min(3.4,L/n*.4),d=3.4;
 if(insideBox(e,x,-d/2-.35,w,d)){
 const h=style.era==='old'?2.5:style.era==='middle'?3.0:1.2;B(x,H+h/2,-d/2-.35,w,h,d,style.era==='new'?style.accent:style.wall);
 if(style.era==='old'){B(x,H+h+.12,-d/2-.35,w+.18,.24,d+.18,style.wall);Q(x,H+h*.5,-.34,w*.5,.45,style.accent);}
 if(style.era==='middle'){for(let step=0;step<4;step++)B(x,H+h+.15+step*.22,-d/2-.35,w+.5-step*.45,.23,d+.5-step*.45,style.roof);}
 if(style.era==='new'){for(const xx of [-1,1])B(x+xx*w*.4,H+2,-d/2-.35,.3,3.2,d,style.accent);B(x,H+3.6,-d/2-.35,w+.3,.35,d,style.accent);}
 }
 }}
 if(entrance){
  // Recessed-looking common lobby, stone surround and a separate pair of entrance doors.
  Q(doorX,1.43,.12,3.35,2.7,0x3d4c49);
  for(const dx of [-1.7,1.7])B(doorX+dx,1.45,.3,.32,2.9,.58,0xb7b3a2);
  B(doorX,2.87,.34,3.7,.24,.68,0xb7b3a2);
  const metal=0xa5afa9;
  for(const dx of [-.6,.6]){Q(doorX+dx,1.34,.23,1.14,2.12,0x526d70);B(doorX+dx,.37,.26,1.14,.22,.05,0x8b9892);B(doorX+dx,1.16,.27,1.14,.09,.04,0xc8cec2);}
  for(const dx of [-1.2,0,1.2])B(doorX+dx,1.34,.28,.06,2.2,.09,metal);
  B(doorX,2.44,.27,2.46,.07,.09,metal);B(doorX,2.62,.28,2.45,.24,.08,0x758880);
  for(const dx of [-.13,.13]){B(doorX+dx,1.22,.36,.035,.48,.05,0xd7d9cb);}
  B(doorX,2.98,.78,3.9,.18,1.75,style.accent);B(doorX,2.89,.81,3.65,.025,1.48,0xd4cfba);
  for(const dx of [-1,1])B(doorX+dx,2.865,1.1,.24,.018,.12,0xf0e5be);
  const number=String(b.properties?.buld_nm_dc||'').match(/\d+/)?.[0];
  if(number){const digitSegments=['ab cdef'.replaceAll(' ',''),'bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'],segments={a:[0,.12,.14,.024],b:[.075,.06,.024,.12],c:[.075,-.06,.024,.12],d:[0,-.12,.14,.024],e:[-.075,-.06,.024,.12],f:[-.075,.06,.024,.12],g:[0,0,.14,.024]};number.split('').forEach((digit,k)=>{for(const seg of digitSegments[Number(digit)]){const [x,y,w,h]=segments[seg];B(doorX+(k-(number.length-1)/2)*.23+x,2.65+y,.34,w,h,.015,0xe5e0cb);}});}
  B(doorX,.09,.9,3.25,.18,1.8,0xb5b5a7);B(doorX,.19,.55,2.3,.025,.65,0x646f69);
  for(let dx=-1.4;dx<1.5;dx+=.45)B(doorX+dx,.187,1.45,.012,.01,.55,0x8b9086);
  // Visitor intercom, door sensor and tactile warning tiles.
  B(doorX+1.48,1.38,.64,.22,.36,.07,0x535e5b);Q(doorX+1.48,1.45,.681,.15,.10,0x8ca6a4);
  for(let k=0;k<3;k++)for(let m=0;m<3;m++)B(doorX+1.42+m*.055,1.33-k*.05,.687,.023,.022,.01,0xc9cec3);
  B(doorX,2.49,.35,.17,.07,.10,0x3c4845);
  for(let dx=-.8;dx<.9;dx+=.28){B(doorX+dx,.195,1.62,.26,.025,.25,0xc8b679);for(let m=0;m<3;m++)for(let k=0;k<3;k++)B(doorX+dx-.08+m*.08,.218,1.54+k*.08,.035,.015,.035,0xd8c58b);}
 }

 // Roof coping and rainwater pipe stay distinct from the facade.
 B(L/2,H+.63,-.08,L+.08,.08,.28,0xb8bcb2);
 if(L>8){B(.18,H/2,.14,.09,H,.1,style.accent);}

 }
 return {windows};
}
// Grounds are inferred local pockets, never a claim of a surveyed complex boundary.
export function planApartmentGrounds(buildings,{elevation=()=>0,roadInfo=()=>null,obstacles=[]}={}){
 const slots=[],reserved=[];let rejected=0;
 for(const b of buildings.filter(b=>b.facility?.id==='apartment')){b.apartment??=chooseApartment(b);const es=edges(b),front=es.find(e=>e.i===b.frontEdge)||es.reduce((a,e)=>e.L>a.L?e:a),era=b.apartment.era;
 for(const e of es){if(e.L<8)continue;const positions=[];for(let x=3.5;x<e.L-2;x+=7)if(e!==front||Math.abs(x-e.L/2)>=5)positions.push(x);if(e===front)positions.push(e.L/2);for(const x of positions){const entry=e===front&&x===e.L/2,kind=entry?'path':era==='old'?(Math.round(x/7)%3?'parking':'tree'):era==='middle'?(Math.round(x/7)%3?'garden':'parking'):'garden',w=entry?3:5.8,d=entry?4:5.4,center=entry?2.1:4.2;
 const local=(u,v)=>[e.a[0]+e.ux*u+e.nx*v,e.a[1]+e.uz*u+e.nz*v],samples=[];
 for(let u=-w/2;u<=w/2+.01;u+=w/6)for(let v=-d/2;v<=d/2+.01;v+=d/6)samples.push(local(x+u,center+v));
 const poly=[local(x-w/2,center-d/2),local(x+w/2,center-d/2),local(x+w/2,center+d/2),local(x-w/2,center+d/2)],heights=samples.map(p=>elevation(...p,b.base));
 const blocked=samples.some(p=>roadInfo(...p)||buildings.some(o=>inPolygon(p,o.points))||obstacles.some(o=>o.footprint&&inPolygon(p,o.footprint))||reserved.some(r=>inPolygon(p,r)))||buildings.some(o=>o.points.some(p=>inPolygon(p,poly)))||Math.max(...heights)-Math.min(...heights)>.65;
 if(blocked){rejected++;continue;}reserved.push(poly);slots.push({owner:b.seed,kind,era,variant:b.apartment.variant,origin:local(x,center),y:Math.max(...heights)+.025,ux:e.ux,uz:e.uz,nx:e.nx,nz:e.nz,w,d,footprint:poly});
 }}
 }
 return {slots,rejected,boundary:'건물 주변 빈 공간 추정 · 실제 단지 경계 아님'};
}
export function createApartmentGrounds(plan){const batch=new FacadeBatch();const leaf=new T.IcosahedronGeometry(1,1),lp=leaf.attributes.position,ln=leaf.attributes.normal;
 function crown(s,x,y,z,r,color){const bucket=batch.bucket(color);for(let i=0;i<lp.count;i++){const xx=x+lp.getX(i)*r,zz=z+lp.getZ(i)*r;bucket.p.push(s.origin[0]+s.ux*xx+s.nx*zz,s.y+y+lp.getY(i)*r*.8,s.origin[1]+s.uz*xx+s.nz*zz);bucket.n.push(s.ux*ln.getX(i)+s.nx*ln.getZ(i),ln.getY(i),s.uz*ln.getX(i)+s.nz*ln.getZ(i));bucket.inkIds.push(Number(s.owner)||1);}}
 for(const s of plan.slots){batch.inkObjectId=Number(s.owner)||1;const o=batch.writer([s.origin[0],s.y,s.origin[1]],s.ux,s.uz,s.nx,s.nz),B=o.box;
 B(0,0,0,s.w,.07,s.d,s.kind==='parking'?0x858b82:s.kind==='path'?0xb7b7a5:0x9ba48a);
 if(s.kind==='path'&&s.era!=='old'){for(const x of [-1.3,1.3])B(x,1.7,0,.25,3.4,.6,0x68766f);B(0,3.4,0,3.1,.38,.8,s.era==='new'?0xd4d6ca:0xa79071);}
 if(s.kind==='parking'){
 for(const x of [-1.45,1.45]){for(const side of [-1,1])B(x+side*1.25,.05,0,.055,.025,4.7,0xd9d5bd);B(x,.05,2.3,2.5,.025,.06,0xd9d5bd);B(x,.55,-.3,1.7,.85,3.5,x<0?0xa5b1ab:0x6b787e);B(x,1.12,-.25,1.5,.4,1.85,0x6c858b);for(const z of [-1.3,.9])for(const side of [-1,1])B(x+side*.84,.3,z,.18,.45,.5,0x454d49);}
 }else if(s.kind==='garden'||s.kind==='tree'){
 for(const x of [-1.7,1.7]){B(x,.25,1.1,1.4,.5,1.4,0x718669);o.rod([x,0,.5],[x,2.9,.5],.12,0x81735c,6);for(let k=0;k<3;k++)crown(s,x+(k-1)*.48,2.7+k*.45+(s.era==='old'?.5:0),.5,1.05+(s.variant||0)*.12,[0x778b69,0x889976,0x94a17c][k]);}
 B(0,.48,-1.5,2,.15,.6,0x95806a);for(const x of [-.75,.75])B(x,.23,-1.5,.12,.46,.5,0x5c6b61);
 // Open rail segment on the far edge leaves both sides and the building entrance open.
 const modern=s.era==='new';for(let x=-2.5;x<=2.5;x+=modern?1.25:.5)B(x,.65,2.6,.055,1.3,.055,0x627568);B(0,1.25,2.6,5.2,.06,.06,0x627568);
 if(modern){B(0,.15,-.35,2.5,.3,1.2,0xb5b6a3);B(0,.4,-.35,2.2,.3,.9,0x758b68);}
 }
 }
 leaf.dispose();const group=batch.finish('ApartmentGrounds');group.userData={plan,procedural:true};return group;
}
export function makeApartmentSpec(asset,x=0,z=0,seed=1){const w=asset.variant===2?23:42,d=asset.variant===2?23:12;let p=[[-w/2,d/2],[w/2,d/2],[w/2,-d/2],[-w/2,-d/2]];if(asset.variant===1)p=[[-22,15],[22,15],[22,3],[-10,3],[-10,-17],[-22,-17]];if(asset.variant===2)p=[[-13,5],[-5,5],[-5,13],[5,13],[5,5],[13,5],[13,-5],[5,-5],[5,-13],[-5,-13],[-5,-5],[-13,-5]];return {points:p.map(([a,b])=>[a+x,b+z]),base:0,top:asset.nominalLevels*3,levels:asset.nominalLevels,seed,inkObjectId:seed,frontEdge:0,facility:{id:'apartment'},apartment:asset,properties:{apartment_era:asset.era,apartment_variant:asset.variant},floor:3};}
