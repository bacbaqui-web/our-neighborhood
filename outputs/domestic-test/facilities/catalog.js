// Reference-derived architectural motifs. Site footprint/height remain authoritative.
// Dates, photographs and observation limits live in first-batch-review/sources.json.
const row=(id,name,pattern,wall,accent,glass,nominal)=>({id,name,pattern,wall,accent,glass,nominal,sourceId:id,reference:'./first-batch-review/#'+id,dimensions:'estimated; fitted to mapped footprint and floor count'});
export const facilities=[
 row('apartment','아파트','balconies',0xd1cbb9,0xb8a98c,0x72928d,[24,24,12]),
 row('school','학교','school',0x9d6954,0xcbb34f,0x65827d,[32,12,12]),
 row('emart','이마트','panels',0xc9c2af,0xd7b346,0x667f7d,[32,18,20]),
 row('lotte','롯데마트','bowed',0xc9bd9b,0xa95750,0x61868b,[30,18,20]),
 row('homeplus','홈플러스','louvers',0x929b98,0xad5354,0x678a91,[30,21,18]),
 row('costco','코스트코','parking',0xc7c2b1,0xaf4b52,0x454f4c,[38,15,24]),
 row('traders','트레이더스','bowed',0xd1d3bd,0x97b952,0x648f8d,[32,15,22]),
 row('police','경찰서','civic-glass',0xc5baa3,0x537c9c,0x5c8793,[24,15,15]),
 row('fire','소방서','garage',0xc9c5b8,0xb64b3e,0x638a85,[28,12,17]),
 row('post','우체국','post-office',0x8faeaa,0xb85860,0x4e6966,[22,12,14]),
 row('daiso','다이소','retail-glass',0xd6d3c7,0xbb4d4f,0x6d8a87,[18,9,14]),
 row('cu','CU','shop',0x965f50,0x79638e,0x56716c,[6.6,3.65,5]),
 row('gs25','GS25','shop',0x575451,0x4a9ca9,0x577773,[7.4,3.55,5]),
 row('seven','세븐일레븐','shop',0xc4c5b9,0x42725c,0x607d76,[7.2,3.6,5]),
 row('emart24','이마트24','shop',0x575e61,0xd2b44d,0x5e7673,[7,3.55,5]),
 row('mega','메가커피','shop',0xcec9bb,0xd8b94e,0x526e6b,[5.6,3.5,5]),
 row('starbucks','스타벅스','shop',0x776167,0x5d535b,0x57736e,[8,3.7,5]),
];
export const facilityById=Object.fromEntries(facilities.map(r=>[r.id,r]));
const brands=[['traders',/^(?:트레이더스|이마트\s*트레이더스)/],['emart24',/^이마트24/],['emart',/^이마트(?!24|에브리데이|\s*트레이더스)/],['lotte',/^롯데마트/],['homeplus',/^홈플러스(?!익스프레스)/],['costco',/^코스트코/],['daiso',/^다이소/],['mega',/^메가(?:MGC|엠지씨)?커피/i],['starbucks',/^스타벅스/],['cu',/^CU(?:$|\s|[가-힣])|^씨유/i],['gs25',/^GS25/i],['seven',/^세븐일레븐/],['post',/우체국/],['police',/경찰서|지구대|파출소/],['fire',/소방서|119안전센터/]];
export function identifyPlace(p){
 const name=p.place_name||'';
 if(/주차장|ATM|카셰어링|충전소|문화센터|타이어센터|물류|택배|수영장|병설유치원/.test(name))return null;
 if(p.category_group_code==='SC4'||/^(?:교육,학문.*학교)/.test(p.category_name||''))return 'school';
 return brands.find(([,re])=>re.test(name))?.[0]||null;
}
export function identifyBuilding(p={}){
 const name=[p.building_name,p.buld_nm_dc].filter(Boolean).join(' ');
 if(/아파트|아너스빌|래미안|힐스테이트|푸르지오|자이아파트/.test(name)||String(p.bdtyp_cd)==='02001')return 'apartment';
 if(/초등학교|중학교|고등학교/.test(name)&&!/상가|학원/.test(name))return 'school';
 return identifyPlace({place_name:name});
}
