export const PREFIX='commerce:bakery-local-';
export const definitions={body:{name:'빵집 · 가변 본체',size:[3.36,4.52,5.4]},sign:{name:'소담빵집 · 크림색 차양 간판',size:[3.04,1.38,.96]},shelf:{name:'빵집 목재 벽 진열장',size:[1.2,1.85,.46]},showcase:{name:'빵집 유리 쇼케이스',size:[1.4,1.64,.70]},counter:{name:'빵집 계산대',size:[1.15,1,.7]},oven:{name:'제빵 오븐과 작업 수납',size:[1.2,1.85,.65]},trays:{name:'빵 쟁반·집게 수납',size:[.5,.92,.44]},pos:{name:'빵집 결제 단말기',size:[.28,.29,.24]},bags:{name:'포장 봉투·상자 묶음',size:[.38,.34,.28]},board:{name:'빵집 목재 입간판',size:[.55,.95,.48]},planter:{name:'빵집 화분',size:[.40,1,.4]},decal:{name:'빵집 유리 영업 안내',size:[.58,.55,.002]},light:{name:'빵집 천장 평판등',size:[1.15,.07,.36]},partition:{name:'제빵실 출입문·칸막이',size:[6.4,3,.08]}};
export function dimensions({width=3.2,height=3,depth=5,frontDepth=1.5}={}){
 for(const [k,v,a,b]of [['width',width,3.2,9],['height',height,2.7,3.3],['depth',depth,4.5,6],['frontDepth',frontDepth,0,8]])if(!Number.isFinite(v)||v<a||v>b)throw Error(k+' 지원 범위를 벗어났습니다.');
 const doorLeft=-width/2+.20,doorRight=doorLeft+1.10,doorX=(doorLeft+doorRight)/2;
 return {width,height,depth,frontDepth,doorLeft,doorRight,doorX,floor:.12,doorTop:2.50,glassTop:height+.12,transomHeight:height+.12-2.50,signBottom:height+.18,signTop:height+1.52,fasciaHeight:.06,partitionZ:-depth+1.05,signEdgeInset:.10,signNameWidth:.94};
}
