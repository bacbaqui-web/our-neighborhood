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
