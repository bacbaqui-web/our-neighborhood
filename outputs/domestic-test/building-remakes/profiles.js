const p=(referenceId,wall,texture,nominal)=>({referenceId,wall,texture,nominal});
export const approvedBuildingProfiles={
 'building:shop-tile':p('bangyi-before-kr-v1',0xb3b6b2,'small-white-tile',[29,9.3,11]),
 'building:shop-panel':p('starbucks-30-kr-v1',0x956341,null,[21,16.5,13]),
 'facility:apartment':p('building-reference-apartment-hanshin-20261121',0xb9d0c8,null,[32,45,12]),
 'facility:emart':p('emart-1-kr-v1',0x9b7763,null,[34,14,22]),
 'facility:homeplus':p('homeplus-cheonan-kr-v1',0xc4c0b9,null,[36,15,20]),
 'facility:costco':p('costco-3-kr-v1',0xe8e8e1,null,[38,14,25]),
 'facility:traders':p('traders-0-kr-v1',0xbec8c9,null,[40,16,24]),
 'facility:police':p('police-2-kr-v1',0xd6dfdc,null,[28,16,13]),
 'facility:gs25':p('building-reference-gs25-bucheon-20261121',0xd4d2c9,'vertical-gray-tile',[8.4,6.8,8]),
 'facility:seven':p('seven-exterior-kr-v1',0x505754,null,[8.6,3.8,8]),
 'facility:emart24':p('emart24-0-kr-v1',0x343936,null,[10,7.5,9]),
 'facility:starbucks':p('starbucks-0-kr-v1',0xc8c8bd,null,[11,7.5,9]),
};

for(const profile of Object.values(approvedBuildingProfiles)){profile.roofCore=false;profile.glass=[0x527e87,0x7fa4aa,0x335c67];}
Object.assign(approvedBuildingProfiles['building:shop-panel'],{levels:5,roofCore:true,glass:[0x5599bd,0x76b2cc,0x2c5873]});
Object.assign(approvedBuildingProfiles['building:shop-tile'],{levels:3,glass:[0x459d9c,0x8bc6be,0x487a7b]});
Object.assign(approvedBuildingProfiles['facility:apartment'],{levels:15,roofColor:0xb0bebb});
Object.assign(approvedBuildingProfiles['facility:police'],{levels:5,roofColor:0x62a76d});
for(const id of ['gs25','seven','emart24','starbucks'])Object.assign(approvedBuildingProfiles['facility:'+id],{levels:id==='seven'?1:2,glass:[0x314746,0x526965,0x263f42]});

for(const id of ['emart24','starbucks'])approvedBuildingProfiles['facility:'+id].glass=[0x6e9cab,0xa1c0c7,0x456a78];

// Explicit user request to build the current replacement candidates (2026-11-21).
approvedBuildingProfiles['building:shop-glass']={"referenceId":"building-reference-glass-seongnae-20261121-v2","wall":12829624,"texture":null,"nominal":[17,25.2,12],"levels":7,"glass":[6323332,8627114,4679541],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['building:school']={"referenceId":"building-reference-school-noryangjin-20261121-v2","wall":14076082,"texture":null,"nominal":[46,13.2,12],"levels":4,"glass":[5664630,8558740,4415079],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['facility:school']={"referenceId":"building-reference-school-noryangjin-20261121-v2","wall":14076082,"texture":null,"nominal":[46,13.2,12],"levels":4,"glass":[5664630,8558740,4415079],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['building:civic']={"referenceId":"building-reference-civic-gasan-20261121-v2","wall":12368299,"texture":null,"nominal":[24,18,15],"levels":5,"glass":[7904681,10139839,4680828],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['building:fire']={"referenceId":"building-reference-fire-sandong-20261121-v2","wall":11974830,"texture":null,"nominal":[25,7.5,14],"levels":2,"glass":[5401445,7572612,3493705],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['facility:fire']={"referenceId":"building-reference-fire-sandong-20261121-v2","wall":11974830,"texture":null,"nominal":[25,7.5,14],"levels":2,"glass":[5401445,7572612,3493705],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['facility:lotte']={"referenceId":"building-reference-lotte-yangpyeong-20261121-v2","wall":13157045,"texture":null,"nominal":[32,24,24],"levels":7,"glass":[9549233,11125947,7642266],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['facility:post']={"referenceId":"building-reference-post-gyeolseong-20261121-v2","wall":5066837,"texture":null,"nominal":[11,5.2,8],"levels":1,"glass":[3429992,5404807,2572110],"roofCore":false,"requestedRemake":true,"parapet":false};
approvedBuildingProfiles['facility:daiso']={"referenceId":"building-reference-daiso-sinsa-20261121-v2","wall":6448489,"texture":null,"nominal":[12,13,10],"levels":4,"glass":[7903939,10270677,5798820],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['facility:cu']={"referenceId":"building-reference-cu-songpa-20261121-v2","wall":14145223,"texture":null,"nominal":[11,7,8],"levels":2,"glass":[3624002,5794648,2505523],"roofCore":false,"requestedRemake":true};
approvedBuildingProfiles['facility:mega']={"referenceId":"building-reference-mega-storefront-20261121-v2","wall":14278098,"texture":null,"nominal":[8.5,4.4,8],"levels":1,"glass":[6585719,7441280,4283991],"roofCore":false,"requestedRemake":true};

Object.assign(approvedBuildingProfiles['building:shop-glass'],{wall:3358288,glass:[3491953, 6255255, 2440289]});
Object.assign(approvedBuildingProfiles['building:school'],{wall:15197396,glass:[4746346, 7444881, 3561304]});
Object.assign(approvedBuildingProfiles['facility:school'],{wall:15197396,glass:[4746346, 7444881, 3561304]});
Object.assign(approvedBuildingProfiles['building:civic'],{wall:12499110,glass:[4553585, 7776410, 3562837]});
Object.assign(approvedBuildingProfiles['building:fire'],{wall:14803676,glass:[5734263, 8363664, 4679518]});
Object.assign(approvedBuildingProfiles['facility:fire'],{wall:14803676,glass:[5734263, 8363664, 4679518]});
