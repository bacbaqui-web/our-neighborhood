import {facilities,identifyPlace} from './catalog.js';
// Each variation comes from the linked observation record; interiors are omitted.
export const facilityShops=facilities.filter(f=>f.pattern==='shop'||['post','daiso'].includes(f.id)).map(f=>{
 const [w,h]=f.id==='post'?[7.8,3.7]:f.id==='daiso'?[8.4,3.6]:f.nominal,category=['mega','starbucks'].includes(f.id)?'cafe':['post','daiso'].includes(f.id)?'retail':'convenience';
 const s={id:'reference-'+f.id,facilityId:f.id,referenceOnly:true,name:f.name,category,width:w,height:h,wall:f.wall,signText:f.name,signs:[{x:0,y:h-.48,w:w-.14,h:.72,color:f.accent}],openings:[{x:0,y:1.3,w:w-.65,h:2.4,panes:4,door:2,frame:0xb7bdb4,glass:f.glass}],awnings:[],props:[],steps:[],source:{referenceId:f.id,placeId:null,placeUrl:'./first-batch-review/#'+f.id},reconstruction:'Reference-derived frontage; dimensions estimated; fitted to mapped host building'};
 if(f.id==='post'){s.signs[0].w=w*.65;s.signs[0].x=w*.1;s.openings[0].w=w*.7;s.openings[0].panes=4;s.panels=[{x:-w*.43,y:1.45,w:.35,h:2.8,color:0x72958f}];}
 if(f.id==='daiso'){s.signs[0].color=0xb94e51;s.openings[0].frame=0xc8ccc1;s.openings[0].panes=6;}
 if(f.id==='cu'){s.signs[0].color=0xe0dfd1;s.textColor='#695278';s.signs[0].bands=[{y:-.28,h:.1,color:0x91a75a}];s.awnings=[{x:0,y:2.73,w:w-.3,depth:.55,drop:.17,color:0x927e89}];}
 if(f.id==='gs25'){s.signs[0].color=0x414c51;s.signs[0].bands=[{y:-.29,h:.1,color:0x4a9ca9}];s.openings[0].frame=0xbfc4ba;s.openings[0].panes=4;}
 if(f.id==='seven'){s.signs[0].color=0x626761;s.signs[0].bands=[{y:.24,h:.07,color:0xbc864c},{y:.11,h:.07,color:0x4d8062},{y:-.02,h:.07,color:0xad6450}];s.signText='7 ELEVEN';s.awnings=[{x:-w*.23,y:2.72,w:w*.44,depth:.6,drop:.24,color:0x476e5d},{x:w*.23,y:2.72,w:w*.44,depth:.6,drop:.24,color:0x476e5d}];}
 if(f.id==='emart24'){s.signs[0].color=0x4c5558;s.signText='emart24';s.openings=[{x:-w*.18,y:1.3,w:w*.52,h:2.35,panes:2,frame:f.accent,frameWidth:.09,glass:f.glass},{x:w*.32,y:1.3,w:w*.22,h:2.35,panes:1,door:0,frame:f.accent,glass:f.glass}];s.awnings=[{x:0,y:2.73,w:w-.25,depth:.38,drop:.08,color:0x8a8d86}];}
 if(f.id==='mega'){s.signs[0].color=0x66655b;s.signText='MEGA MGC COFFEE';s.textColor='#e7d6a2';s.awnings=[{x:0,y:2.68,w:w-.2,depth:.55,drop:.2,color:0xd6bc5f}];s.openings[0].frame=0x4f5350;s.openings[0].door=3;}
 if(f.id==='starbucks'){s.signText='STARBUCKS COFFEE';s.signs[0].color=0x64565d;s.openings[0].frame=0x5a5654;s.openings[0].panes=5;}
 return s;
});
export function withFacilityShops(catalog){return {...catalog,assets:[...catalog.assets.filter(s=>!s.referenceOnly),...facilityShops]};}
export function referenceShop(place){const id=identifyPlace(place);return facilityShops.find(s=>s.facilityId===id);}
