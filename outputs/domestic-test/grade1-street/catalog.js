const approvedOn = '2026-11-22';
const cards = [
 ['gas-meter-bank','도시가스 계량기 3연','road:a16','wall',[1.1661,1.05,.2269],'008',
  '적갈색 벽 배관과 계량기 세 대를 연결했습니다. 위치는 외벽의 빈 구간을 사용합니다.'],
 ['wall-ac','삼각 받침 벽붙이 실외기','legacy:18','wall',[.8996,.6525,.408],'038',
  '팬 보호망, 삼각 받침대, 외벽으로 이어지는 호스를 만들었습니다.'],
 ['drain-elbow','벽붙이 PVC 빗물 배수관','road:a21','wall',[.138,1.662,.247],'022',
  '외벽을 따라 내려오는 밝은 배수관을 참고했습니다. 아래쪽 굽힘과 관 끝 치수는 골목 배치용 추정입니다.'],
 ['service-box','낮은 벽붙이 계량함 2연','road:a18','wall',[.44,.314,.167],'008',
  '기단 높이에 나란히 놓인 두 계량함의 형태와 색을 참고했습니다. 내부 종류는 확인하지 못했습니다.'],
 ['stacked-crates','포개 놓은 플라스틱 바구니',null,'ground',[.438,.3165,.328],'041',
  '주차장 옆 청록색 용기에서 색과 크기를 참고해 빈 손잡이가 있는 바구니 조합을 구성했습니다.'],
 ['cable-junction','통신 접속함과 감은 인입선','legacy:88','wall',[.429,.9455,.1395],'008',
  '외벽의 작은 접속함과 아래에 묶인 케이블을 한 묶음으로 만들었습니다.'],
 ['security-lamp','타원형 LED 골목 보안등','legacy:136','wall',[.3006,.532,.9797],'022',
  '전주의 타원형 조명과 굽은 팔을 참고했습니다. 등기구의 렌즈와 방열부는 추정했습니다.'],
 ['storm-grate','직사각 골목 빗물받이','legacy:39','ground',[.49,.0402,.365],'038',
  '골목 가장자리의 직사각 배수구를 참고해 사선 살과 집수 틈을 만들었습니다.'],
];

export const grade1Assets = Object.freeze(cards.map(([key,name,relatedId,support,size,photo,note])=>({
 key, name, id:'grade1:'+key, existingId:null, relatedId, support, size, note,
 file: '../grade1-street/'+key+'-v1.glb',
 reference: {photoId:'roadview-100/'+photo, place:'서울 강북구 미아동', approvedOn},
})));
